/* Same-origin, offline filtering of existing public HTML only. */
'use strict';
(() => {
  const normalize = (value) => value.normalize('NFKC').toLocaleLowerCase('zh-CN').trim();
  document.querySelectorAll('[data-filter-scope]').forEach((scope) => {
    const controls = scope.querySelector('[data-filter-controls]');
    if (!controls) return;
    const query = controls.querySelector('[data-filter-query]');
    const fields = ['source', 'region', 'date'];
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
        option.textContent = value || (key === 'date' ? '日期未提供' : key === 'region' ? '地区未提供' : '来源未提供');
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
      controls.querySelector('[data-filter-count]').textContent = '匹配 ' + count + ' 条 · 仅当前展示快照';
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
    if (age > 3600000) node.textContent = '快照已超过 1 小时，可能过时；页面不会实时更新，请核对资料时点。';
  });
})();
