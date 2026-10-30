/* Same-origin, offline filtering of existing public HTML only. */
'use strict';
/* Founder 2026-10-28: zh-hant/ pages are Taiwan Traditional. The build converts page text; the strings this script writes
   come from this table, and a backend test checks every entry equals the build's own conversion. */
const TRADITIONAL = {
  '日期未提供': '日期未提供', '地区未提供': '地區未提供', '来源未提供': '來源未提供',
  '匹配 {n} 条 · 仅当前展示快照': '匹配 {n} 條 · 僅當前展示快照',
  '快照已超过 1 小时，可能过时；页面不会实时更新，请核对资料时点。': '快照已超過 1 小時，可能過時；頁面不會即時更新，請核對資料時點。',
  '成功': '成功', '刚刚': '剛剛', '{n} 分钟前': '{n} 分鐘前', '{n} 小时前': '{n} 小時前', '{n} 天前': '{n} 天前', '{n} 分钟后': '{n} 分鐘後',
  '{n} 小时后': '{n} 小時後', '{n} 天后': '{n} 天後', '后': '後', '即将': '即將',
  '即将公布': '即將公布', '分后': '分後', '小时': '小時', '分': '分', '天后': '天後',
  '已到时间，以官方公布为准': '已到時間，以官方公布為準'};
/* en/ pages only show relative times from this script for now. */
const ENGLISH = {
  '成功': 'success', '刚刚': 'just now', '即将': 'soon', '{n} 分钟前': '{n} min ago', '{n} 小时前': '{n} h ago', '{n} 天前': '{n} days ago',
  '{n} 分钟后': 'in {n} min', '{n} 小时后': 'in {n} h', '{n} 天后': 'in {n} days'};
const PAGE_LANG = document.documentElement.lang;
const T = (text) => (PAGE_LANG.startsWith('zh-Hant') && TRADITIONAL[text]) || (PAGE_LANG === 'en' && ENGLISH[text]) || text;
(() => {
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('zh-CN').trim();
  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const controls = scope.querySelector('[data-filter-controls]');
    if (!controls) return;
    const query = controls.querySelector('[data-filter-query]');
    // The calendar page adds an importance select (2026-10-26); other pages keep the three fields.
    const fields = ['source', 'region', 'date'].concat(controls.querySelector('[data-filter-level]') ? ['level'] : []);
    const rows = Array.from(scope.querySelectorAll('[data-filter-item]')).map((node) => {
      const values = {};
      fields.forEach((key) => {
        const many = node.getAttribute('data-filter-' + key + 's');
        values[key] = many ? JSON.parse(many) : [node.getAttribute('data-filter-' + key) || ''];
      });
      values.status = [node.getAttribute('data-filter-status') || ''];
      return {node, values, text: normalize(node.textContent)};
    });
    fields.forEach((key) => {
      const select = controls.querySelector('[data-filter-' + key + ']');
      const options = Array.from(new Set(rows.flatMap((row) => row.values[key]))).sort();
      options.forEach((value) => {
        const option = document.createElement('option');
        option.value = value || '__unknown__';
        option.textContent = value || (key === 'date' ? T('日期未提供') : key === 'region' ? T('地区未提供') : T('来源未提供'));
        select.appendChild(option);
      });
    });
    const selects = fields.concat('status').map((key) => [key, controls.querySelector('select[data-filter-' + key + ']')]).filter((entry) => entry[1]);
    const update = () => {
      const terms = normalize(query.value).split(/\s+/u).filter(Boolean);
      let count = 0;
      rows.forEach((row) => {
        const match = terms.every((term) => row.text.includes(term)) && selects.every(([key, select]) =>
          !select.value || row.values[key].includes(select.value === '__unknown__' ? '' : select.value));
        row.node.hidden = !match;
        if (match) count += 1;
      });
      scope.querySelectorAll('[data-filter-group]').forEach((group) => {
        group.hidden = !rows.some((row) => group.contains(row.node) && !row.node.hidden);
      });
      controls.querySelector('[data-filter-count]').textContent = T('匹配 {n} 条 · 仅当前展示快照').replace('{n}', count);
      scope.querySelector('[data-filter-empty]').hidden = count !== 0;
    };
    query.addEventListener('input', update);
    selects.forEach(([, select]) => select.addEventListener('change', update));
    controls.querySelector('[data-filter-reset]').addEventListener('click', () => {
      query.value = '';
      selects.forEach(([, select]) => { select.value = ''; });
      update();
      query.focus();
    });
    update();
    controls.hidden = false;
  });
  document.querySelectorAll('[data-snapshot-at]').forEach((node) => {
    const stamp = Date.parse(node.getAttribute('data-snapshot-at'));
    if (!Number.isFinite(stamp)) return;
    const age = Date.now() - stamp;
    if (age > 3600000) node.textContent = T('快照已超过 1 小时，可能过时；页面不会实时更新，请核对资料时点。');
  });
})();

/* Relative times for collection activity and cards (same-origin, no network); title keeps the absolute time. */
(() => {
  const nodes = Array.from(document.querySelectorAll('time[data-rel][datetime]'));
  if (!nodes.length) return;
  const label = (ms, ahead) => {
    const minutes = Math.round(ms / 60000);
    if (minutes < 1) return ahead ? T('即将') : T('刚刚');
    if (minutes < 60) return (ahead ? T('{n} 分钟后') : T('{n} 分钟前')).replace('{n}', minutes);
    const hours = Math.round(minutes / 60);
    if (hours < 48) return (ahead ? T('{n} 小时后') : T('{n} 小时前')).replace('{n}', hours);
    return (ahead ? T('{n} 天后') : T('{n} 天前')).replace('{n}', Math.round(hours / 24));
  };
  const update = () => {
    const now = Date.now();
    nodes.forEach((node) => {
      const at = Date.parse(node.getAttribute('datetime'));
      if (Number.isNaN(at)) return;
      const relative = at <= now + 60000 ? label(Math.max(0, now - at), false) : label(at - now, true);
      node.textContent = relative + (node.hasAttribute('data-rel-success') ? ' ' + T('成功') : '');
    });
  };
  update();
  setInterval(update, 60000);
})();


/* Answer-card countdown (2026-10-28): the build writes the instant and the first label; this only ticks it every
   30 s while the tab is visible, and after the instant says so instead of guessing what happened. */
(() => {
  const nodes = Array.from(document.querySelectorAll('[data-countdown]'));
  if (!nodes.length) return;
  const label = (ms) => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 1) return T('即将公布');
    if (minutes < 60) return minutes + T('分后');
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours < 48) return hours + T('小时') + (rest ? rest + T('分') : '') + T('后');
    return Math.floor(hours / 24) + T('天后');
  };
  const update = () => {
    if (document.hidden) return;
    const now = Date.now();
    nodes.forEach((node) => {
      const at = Date.parse(node.getAttribute('data-countdown'));
      if (Number.isNaN(at)) return;
      const left = at - now;
      node.textContent = left > 0 ? label(left) : T('已到时间，以官方公布为准');
      node.classList.toggle('is-past', left <= 0);
    });
  };
  update();
  setInterval(update, 30000);
  document.addEventListener('visibilitychange', update);
})();
