/* ===================================================================
   LOADER.JS — Space-themed loading screen
   Runs synchronously in <head> so it appears BEFORE page paint.
   =================================================================== */
(function () {
  'use strict';

  // Don't double-inject
  if (document.getElementById('space-loader')) return;

  const html = `
    <div id="space-loader" role="status" aria-label="Chargement">
      <div class="loader-orb"></div>
      <div class="loader-text">
        <span class="loader-text-name">JUDE BUYIKANA</span>
        Initialisation du portfolio
      </div>
      <div class="loader-progress"></div>
    </div>
  `;

  function inject() {
    if (!document.body) return false;
    const wrap = document.createElement('div');
    wrap.innerHTML = html;
    document.body.prepend(wrap.firstElementChild);
    return true;
  }

  // Try to inject as early as possible
  if (!inject()) {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
  }

  // Dismiss when the page is fully loaded (min 900ms so the user sees it)
  const start = Date.now();
  const MIN_DISPLAY = 900;

  function dismiss() {
    const loader = document.getElementById('space-loader');
    if (!loader) return;
    const elapsed = Date.now() - start;
    const wait = Math.max(0, MIN_DISPLAY - elapsed);
    setTimeout(() => {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 1000);
    }, wait);
  }

  if (document.readyState === 'complete') {
    dismiss();
  } else {
    window.addEventListener('load', dismiss);
    // safety fallback
    setTimeout(dismiss, 4000);
  }
})();
