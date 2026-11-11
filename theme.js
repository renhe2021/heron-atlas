/* Synchronous head initialization: only same-origin CSS and this tiny script are needed. */
(() => {
  'use strict';
  if (window.__heronThemeInitialized) return;
  window.__heronThemeInitialized = true;
  const root = document.documentElement;
  const key = 'heron-theme';
  let preference = null;
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === 'light' || saved === 'dark') preference = saved;
  } catch (_error) { /* Private/blocked storage still permits an in-memory choice. */ }
  const system = typeof window.matchMedia === 'function' ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  const buttons = () => document.querySelectorAll('[data-theme-toggle]');
  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    const dark = theme === 'dark';
    const lang = root.lang || '';
    const label = lang.startsWith('en') ? (dark ? 'Light' : 'Dark') : (dark ? (lang.startsWith('zh-Hant') ? '淺色' : '浅色') : '深色');
    buttons().forEach((button) => {
      button.textContent = label;
      button.setAttribute('aria-label', label);
      button.setAttribute('aria-pressed', String(dark));
      button.hidden = false;
    });
  };
  const current = () => preference || (system && system.matches ? 'dark' : 'light');
  // This executes before styles/body parsing; no deferred search.js dependency.
  apply(current());
  const bind = () => {
    apply(current());
    buttons().forEach((button) => button.addEventListener('click', () => {
      preference = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      try { window.localStorage.setItem(key, preference); } catch (_error) { /* Keep the choice for this page. */ }
      apply(preference);
    }));
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, {once:true});
  else bind();
  const systemChanged = (event) => { if (!preference) apply(event.matches ? 'dark' : 'light'); };
  if (system && typeof system.addEventListener === 'function') system.addEventListener('change', systemChanged);
  else if (system && typeof system.addListener === 'function') system.addListener(systemChanged);
})();
