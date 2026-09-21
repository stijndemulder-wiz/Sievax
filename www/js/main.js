/* ============================================================================
   SIEVAX ACADEMY · Shared front-end behaviour
   ----------------------------------------------------------------------------
   Loaded with `defer` by index.html, so the DOM is parsed before any module
   runs. Four small, self-contained modules:

     1. Mobile navigation — hamburger toggle with synced ARIA state.
     2. Lead form         — AJAX submit to api/lead.php, inline success/error.
     3. Explainer video   — click-to-load YouTube facade.
     4. Calendly          — click-to-load booking popup.

   Modules 3 and 4 share one rule: no third-party script is fetched on pageload,
   only when the visitor asks for it. Both degrade to a plain link/no-op.

   No dependencies, no build step.
   ============================================================================ */

/* ----------------------------------------------------------------------------
   1. Mobile navigation
   Toggle the dropdown, keep aria-expanded/label in sync, and close it on
   Escape or when a link inside the menu is clicked.
---------------------------------------------------------------------------- */
(function () {
  var btn = document.getElementById("navToggle");
  var menu = document.getElementById("navmenu");
  if (!btn || !menu) return;

  function setOpen(open) {
    menu.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  btn.addEventListener("click", function () {
    setOpen(!menu.classList.contains("open"));
  });

  menu.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && menu.classList.contains("open")) {
      setOpen(false);
      btn.focus();
    }
  });
})();

/* ----------------------------------------------------------------------------
   2. Lead form
   Submit to api/lead.php (Brevo) via fetch and reveal the inline success message.
   Failures are shown, not swallowed: a lead that silently disappears is worse
   than one that asks the visitor to mail instead.
   Also stamps _ts with the render time — the handler treats a submit within two
   seconds of that as a bot.
---------------------------------------------------------------------------- */
(function () {
  var form = document.getElementById("leadForm");
  var success = document.getElementById("leadSuccess");
  var error = document.getElementById("leadError");
  if (!form) return;

  var ts = document.getElementById("f-ts");
  if (ts) ts.value = String(Math.floor(Date.now() / 1000));

  var button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (error) error.hidden = true;
    if (button) button.disabled = true;

    fetch(form.getAttribute("action") || "", {
      method: "POST",
      body: new FormData(form),
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { ok: res.ok };
        });
      })
      .then(function (data) {
        if (!data || !data.ok) throw new Error((data && data.reason) || "failed");
        form.style.display = "none";
        success.style.display = "block";
        try {
          success.focus();
        } catch (err) {}
      })
      .catch(function () {
        if (button) button.disabled = false;
        if (error) {
          error.hidden = false;
          error.scrollIntoView({ block: "nearest" });
        }
      });
  });
})();

/* ----------------------------------------------------------------------------
   3. Explainer video
   Click-to-load YouTube facade: keep the poster until "play" is pressed, then
   swap in the (privacy-friendly, no-cookie) embed with autoplay. Until a real
   video ID is set on the frame (data-video-id still the placeholder), the button
   stays in demo mode and does nothing — mirrors the lead form above.
   Applies to every .vid-frame on the page.
---------------------------------------------------------------------------- */
(function () {
  var frames = document.querySelectorAll(".vid-frame");

  Array.prototype.forEach.call(frames, function (frame) {
    var btn = frame.querySelector(".vid-play");
    if (!btn) return;

    btn.addEventListener("click", function () {
      var id = frame.getAttribute("data-video-id") || "";
      if (!id || id.indexOf("REPLACE_WITH_YOUTUBE_ID") !== -1) return; // demo mode

      var iframe = document.createElement("iframe");
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" +
        encodeURIComponent(id) +
        "?autoplay=1&rel=0";
      iframe.title = "Sievax Academy — explainer video";
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      );
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("loading", "lazy");

      frame.innerHTML = "";
      frame.appendChild(iframe);
    });
  });
})();

/* ----------------------------------------------------------------------------
   4. Calendly
   Click-to-load popup, same principle as the video facade above: Calendly's
   script and stylesheet are not fetched on pageload, only when someone actually
   wants to book. Any <a data-calendly href="https://calendly.com/..."> is
   upgraded; without JS (or if Calendly fails to load) the link keeps working as
   an ordinary target="_blank" link, so the booking path never dead-ends.
---------------------------------------------------------------------------- */
(function () {
  var links = document.querySelectorAll("a[data-calendly]");
  if (!links.length) return;

  var WIDGET_JS = "https://assets.calendly.com/assets/external/widget.js";
  var WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";
  var loading = null;

  function loadWidget() {
    if (loading) return loading;

    loading = new Promise(function (resolve, reject) {
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = WIDGET_CSS;
      document.head.appendChild(css);

      var script = document.createElement("script");
      script.src = WIDGET_JS;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    return loading;
  }

  Array.prototype.forEach.call(links, function (link) {
    link.addEventListener("click", function (e) {
      // Let modified clicks (new tab/window, middle click) behave normally.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      e.preventDefault();

      loadWidget()
        .then(function () {
          if (!window.Calendly) throw new Error("no widget");
          window.Calendly.initPopupWidget({ url: link.href });
        })
        .catch(function () {
          // Script blocked or offline → fall back to the plain link.
          window.open(link.href, "_blank", "noopener");
        });
    });
  });
})();
