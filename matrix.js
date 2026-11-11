/* Progressive sorting of the published rows; never fetches, rewrites or invents data. */
(() => {
  'use strict';
  const initialize = () => document.querySelectorAll('table[data-policy-matrix]').forEach((table) => {
    if (table.dataset.sortReady || !table.tBodies.length) return;
    table.dataset.sortReady = 'true';
    const body = table.tBodies[0];
    const original = new Map(Array.from(body.rows, (row, index) => [row, index]));
    const buttons = Array.from(table.querySelectorAll('thead button[data-sort-key]'));
    const value = (row, index, type) => {
      const cell = row.cells[index];
      const raw = cell ? (cell.getAttribute('data-sort-value') ?? cell.textContent).trim() : '';
      if (!raw || /^(?:—|–|-|待核[验驗]|待[确確][认認]|unknown|not verified|n\/a)$/i.test(raw)) return null;
      if (type === 'number') return /^[-+]?\d+(?:\.\d+)?$/.test(raw) && Number.isFinite(Number(raw)) ? Number(raw) : null;
      if (type === 'date') return /^\d{4}-\d{2}-\d{2}/.test(raw) && Number.isFinite(Date.parse(raw)) ? Date.parse(raw) : null;
      return raw.normalize('NFKC');
    };
    buttons.forEach((button) => {
      const header = button.closest('th');
      if (!header) return;
      const index = header.cellIndex;
      header.setAttribute('aria-sort', 'none');
      button.addEventListener('click', () => {
        const direction = header.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
        const factor = direction === 'ascending' ? 1 : -1;
        const type = button.getAttribute('data-sort-type') || 'text';
        const rows = Array.from(body.rows);
        rows.sort((a, b) => {
          const av = value(a, index, type), bv = value(b, index, type);
          if (av === null || bv === null) return av === bv ? original.get(a) - original.get(b) : av === null ? 1 : -1;
          const order = typeof av === 'number' ? av - bv : av.localeCompare(bv, document.documentElement.lang || undefined, {sensitivity:'base', numeric:true});
          return order ? order * factor : original.get(a) - original.get(b);
        });
        buttons.forEach((other) => other.closest('th').setAttribute('aria-sort', other === button ? direction : 'none'));
        rows.forEach((row) => body.appendChild(row));
      });
    });
    // A real anchor supplies keyboard navigation and the no-JS fallback. Mouse row
    // activation is extra; preserve selections, modified clicks and native controls.
    body.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (event.target.closest('a,button,input,select,textarea,summary')) return;
      if (window.getSelection && String(window.getSelection())) return;
      const row = event.target.closest('tr[data-row-href]');
      if (!row) return;
      const destination = new URL(row.getAttribute('data-row-href'), window.location.href);
      if (destination.origin === window.location.origin && /^(https?:)$/.test(destination.protocol)) window.location.assign(destination.href);
    });
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once:true});
  else initialize();
})();
