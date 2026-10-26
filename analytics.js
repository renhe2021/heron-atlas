/* Google Analytics 4 (founder 2026-10-26: follow established practice). Standard gtag bootstrap, kept in a
   same-origin file because the site forbids inline scripts. Event dictionary: official_source_click,
   item_read_30s, search. Page views, scrolls and outbound clicks come from GA4 enhanced measurement. */
'use strict';
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
window.gtag = gtag;
gtag('js', new Date());
gtag('config', 'G-MV2X1NF06M');
(() => {
  document.addEventListener('click', (event) => {
    const link = event.target && event.target.closest ? event.target.closest('a.ref-link, a.ref[rel~="noreferrer"]') : null;
    if (!link) return;
    let domain = '';
    try { domain = new URL(link.href).hostname; } catch (error) { domain = ''; }
    gtag('event', 'official_source_click', { link_domain: domain, page_path: location.pathname });
  });
  if (document.querySelector('article.item')) {
    let visible = 0;
    let last = Date.now();
    let sent = false;
    const tick = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible') visible += now - last;
      last = now;
      if (!sent && visible >= 30000) {
        sent = true;
        gtag('event', 'item_read_30s', { page_path: location.pathname });
      }
    };
    document.addEventListener('visibilitychange', () => { last = Date.now(); });
    setInterval(tick, 1000);
  }
  let timer = null;
  document.querySelectorAll('[data-filter-query]').forEach((input) => {
    input.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const term = input.value.trim();
        if (term.length >= 2) gtag('event', 'search', { search_term: term.slice(0, 60) });
      }, 1500);
    });
  });
})();
