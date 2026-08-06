  // Mobile nav: toggle the dropdown, keep aria state in sync, close on Escape / link click.
  (function(){
    var btn = document.getElementById('navToggle');
    var menu = document.getElementById('navmenu');
    if(!btn || !menu) return;
    function setOpen(open){
      menu.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    btn.addEventListener('click', function(){ setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', function(e){ if(e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && menu.classList.contains('open')){ setOpen(false); btn.focus(); }
    });
  })();

  // Lead form: submit via AJAX to the form service, show inline success.
  (function(){
    var form = document.getElementById('leadForm');
    var success = document.getElementById('leadSuccess');
    if(!form) return;
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var action = form.getAttribute('action') || '';
      function showSuccess(){ form.style.display='none'; success.style.display='block'; try{ success.focus(); }catch(e){} }
      // If the endpoint hasn't been configured yet, just confirm (demo mode).
      if(action.indexOf('REPLACE_WITH_FORM_ID') !== -1){ showSuccess(); return; }
      fetch(action, {
        method:'POST',
        body:new FormData(form),
        headers:{'Accept':'application/json'}
      }).then(function(r){ showSuccess(); }).catch(function(){ showSuccess(); });
    });
  })();
