/* ============================================================================
   SIEVAX ACADEMY · Analytics (GA4) behind a consent banner
   ----------------------------------------------------------------------------
   Nothing from Google loads until the visitor clicks "Accept". Until then there
   is no gtag.js, no cookie and no request; declining keeps it that way. The
   choice is stored in localStorage ("sx-consent") for 12 months and can be
   changed at any time via the "Cookie settings" link in the footer.

   Consent Mode v2 defaults are set to denied before gtag.js is ever injected,
   so even a stray tag could not write cookies without the update.

   Events (no personal data in any parameter):
     generate_lead        lead form accepted by api/lead.php   (key event)
     form_error           lead form failed
     cta_click            any link to #apply                    link_text, section
     video_start          explainer video play
     faq_open             FAQ question opened                   question
     book_call_click      Calendly link clicked                 link_text
     book_call_completed  Calendly reports event_scheduled      (key event)

   main.js calls window.sxTrack() for the form and the video; everything else is
   picked up here with delegated listeners. Loaded with defer before main.js.
   ============================================================================ */
(function () {
  var GA_ID = "G-XX4CZLMZ4N";
  var STORE = "sx-consent";
  var MAX_AGE = 365 * 24 * 60 * 60 * 1000;

  window.dataLayer = window.dataLayer || [];
  window.gtag =
    window.gtag ||
    function () {
      window.dataLayer.push(arguments);
    };
  window.gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });

  var granted = false;

  function read() {
    try {
      var c = JSON.parse(localStorage.getItem(STORE) || "null");
      if (c && Date.now() - c.ts < MAX_AGE) return c;
    } catch (e) {}
    return null;
  }

  function persist(analytics) {
    try {
      localStorage.setItem(STORE, JSON.stringify({ analytics: analytics, ts: Date.now() }));
    } catch (e) {}
  }

  function loadGa() {
    if (window.__sxGaLoaded) return;
    window.__sxGaLoaded = true;
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  // Withdrawn consent: stop measuring and remove the _ga cookies GA left behind.
  function clearGaCookies() {
    var host = location.hostname;
    document.cookie.split(";").forEach(function (c) {
      var name = c.split("=")[0].trim();
      if (name.indexOf("_ga") !== 0) return;
      ["", "; domain=" + host, "; domain=." + host].forEach(function (d) {
        document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + d;
      });
    });
  }

  function apply(analytics) {
    granted = analytics;
    window.gtag("consent", "update", { analytics_storage: analytics ? "granted" : "denied" });
    if (analytics) loadGa();
    else clearGaCookies();
  }

  // Public: events are dropped unless consent was given.
  window.sxTrack = function (name, params) {
    if (!granted) return;
    window.gtag("event", name, params || {});
  };

  /* ---------------------------------------------------------------- banner */
  var banner = document.getElementById("consent");

  // Focus moves only when the visitor asked for the banner (footer link); on
  // first load it must not steal focus from the page.
  function show(focus) {
    if (!banner) return;
    banner.hidden = false;
    var first = banner.querySelector("button");
    if (focus && first) first.focus({ preventScroll: true });
  }

  if (banner) {
    banner.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-consent]");
      if (!btn) return;
      var analytics = btn.getAttribute("data-consent") === "allow";
      persist(analytics);
      apply(analytics);
      banner.hidden = true;
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-consent-open]")) {
      e.preventDefault();
      show(true);
    }
  });

  var stored = read();
  if (stored) apply(stored.analytics);
  else show();

  /* ---------------------------------------------------------------- events */
  function label(el) {
    return (el.textContent || "").replace(/\s+/g, " ").replace(/[→→]/g, "").trim().slice(0, 100);
  }

  document.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href === "#apply") {
      var sec = a.closest("section, header, aside, nav");
      window.sxTrack("cta_click", {
        link_text: label(a),
        section: sec ? sec.id || sec.className.split(" ")[0] || sec.tagName.toLowerCase() : "",
      });
    } else if (a.hasAttribute("data-calendly")) {
      window.sxTrack("book_call_click", { link_text: label(a) });
    }
  });

  // Click on a summary, not the "toggle" event: toggle also fires on load for a
  // <details open>, which would count as a question nobody opened.
  document.addEventListener("click", function (e) {
    var s = e.target.closest("summary");
    if (!s || !s.parentElement || s.parentElement.open) return;
    window.sxTrack("faq_open", { question: label(s).replace(/\+$/, "").trim() });
  });

  // Calendly posts its lifecycle events to the parent window.
  window.addEventListener("message", function (e) {
    if (e.origin !== "https://calendly.com") return;
    if (e.data && e.data.event === "calendly.event_scheduled") {
      window.sxTrack("book_call_completed");
    }
  });
})();
