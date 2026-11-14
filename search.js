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
  '已到点 · 官方数据核验中': '已到點 · 官方數據核驗中',
  '未来 72 小时内没有关键日程，以下是随后最近的三项。': '未來 72 小時內沒有關鍵日程，以下是隨後最近的三項。',
  '关注的经济体在此窗口内没有日程，已显示全部经济体。': '關注的經濟體在此窗口內沒有日程，已顯示全部經濟體。', '下一项：': '下一項：', '已到公布时间，以官方公布为准': '已到公布時間，以官方公布為準', '复制': '複製', '已复制': '已複製'};
/* en/ pages only show relative times from this script for now. */
const ENGLISH = {
  '成功': 'success', '刚刚': 'just now', '即将': 'soon', '{n} 分钟前': '{n} min ago', '{n} 小时前': '{n} h ago', '{n} 天前': '{n} days ago',
  '{n} 分钟后': 'in {n} min', '{n} 小时后': 'in {n} h', '{n} 天后': 'in {n} days',
  '即将公布': 'Due soon', '分后': ' min remaining', '小时': ' h ', '分': ' min ', '后': 'remaining',
  '天后': ' days remaining', '已到点 · 官方数据核验中': 'Due · verifying official data',
  '未来 72 小时内没有关键日程，以下是随后最近的三项。': 'No key releases in the next 72 hours; the next three follow.',
  '关注的经济体在此窗口内没有日程，已显示全部经济体。': 'No events for your followed economies in this window; showing all economies.', '下一项：': 'Next: ', '已到公布时间，以官方公布为准': 'Release time reached; the official release prevails', '复制': 'Copy', '已复制': 'Copied'};
const PAGE_LANG = document.documentElement.lang;
const T = (text) => (PAGE_LANG.startsWith('zh-Hant') && TRADITIONAL[text]) || (PAGE_LANG === 'en' && ENGLISH[text]) || text;
const countdownLabel = (ms) => {
    const minutes = Math.floor(ms / 60000);
    if (PAGE_LANG === 'en') {
      if (minutes < 1) return 'soon';
      if (minutes < 60) return 'in ' + minutes + ' min';
      const h = Math.floor(minutes / 60);
      if (h < 48) return 'in ' + h + ' h' + (minutes % 60 ? ' ' + (minutes % 60) + ' min' : '');
      return 'in ' + Math.floor(h / 24) + ' days';
    }
    if (minutes < 1) return T('即将公布');
    if (minutes < 60) return minutes + T('分后');
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours < 48) return hours + T('小时') + (rest ? rest + T('分') : '') + T('后');
    return Math.floor(hours / 24) + T('天后');
  };
/* Cite the visible line only. Clipboard access happens exclusively on a reader's click. */
document.querySelectorAll('.cite-copy').forEach((button) => {
  if (typeof navigator.clipboard?.writeText !== 'function') return;
  const line = button.closest('.page-citation').querySelector('.cite-text');
  if (!line) return;
  let timer;
  button.textContent = T('复制');
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(line.textContent);
      clearTimeout(timer);
      button.textContent = T('已复制');
      timer = setTimeout(() => { button.textContent = T('复制'); }, 2000);
    } catch (_) { /* Denied clipboard access leaves the readable citation intact. */ }
  });
});
/* Follows are a local browser preference, shared by home/calendar and language trees. */
const FOLLOW_KEY = 'heron-atlas-follows-v1';
const FOLLOW_DEFAULT = ['us', 'ea', 'jp', 'uk', 'cn'];
const FOLLOW_ALLOWED = new Set([...FOLLOW_DEFAULT, 'ca', 'au', 'ch', 'se', 'nz', 'no']);
const readFollows = () => {
  try {
    const raw = window.localStorage.getItem(FOLLOW_KEY);
    const value = raw === null ? null : JSON.parse(raw);
    if (Array.isArray(value) && value.every((e) => typeof e === 'string' && FOLLOW_ALLOWED.has(e))) {
      return {selected: new Set(value), saved: true};
    }
  } catch (_) { /* Private browsing/storage denial keeps the default HTML usable. */ }
  return {selected: new Set(FOLLOW_DEFAULT), saved: false};
};
let followState = readFollows();
let updateRollingWindows = () => {};
const isFollowed = (node) => !node.hasAttribute('data-economy') || followState.selected.has(node.getAttribute('data-economy'));
const renderFollows = () => {
  document.querySelectorAll('[data-follow-economy]').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(followState.selected.has(chip.getAttribute('data-follow-economy'))));
  });
  document.querySelectorAll('[data-follow-hint]').forEach((hint) => { hint.hidden = followState.saved; });
  document.querySelectorAll('[data-economy]').forEach((node) => {
    if (!node.closest('[data-filter-scope]') && !node.closest('[data-home-window]')) node.hidden = !isFollowed(node);
  });
  document.querySelectorAll('[data-follow-summary]').forEach((node) => {
    try {
      const labels = JSON.parse(node.getAttribute('data-economy-labels'));
      node.textContent = [...followState.selected].map(e => labels[e]).filter(Boolean).join(node.getAttribute('data-separator') || '、') || node.getAttribute('data-empty') || '—';
    } catch (_) { /* Keep the deterministic default summary if labels are absent. */ }
  });
  document.querySelectorAll('[data-home-window]:not([data-rolling-window])').forEach((section) => {
    const button = section.querySelector('[data-window-all]');
    const all = button?.getAttribute('aria-pressed') === 'true';
    const rows = [...section.querySelectorAll('[data-economy]')];
    rows.forEach(node => { node.hidden = !all && !isFollowed(node); });
    const empty = section.querySelector('[data-window-empty]');
    if (empty) empty.hidden = rows.some(node => !node.hidden);
    if (button) {
      button.hidden = false;
      button.textContent = button.getAttribute(all ? 'data-show-followed' : 'data-show-all');
    }
  });
  updateRollingWindows();
  document.dispatchEvent(new Event('heron:follows-change'));
};
document.querySelectorAll('[data-follow-economy]').forEach((chip) => {
  chip.addEventListener('click', () => {
    const economy = chip.getAttribute('data-follow-economy');
    if (followState.selected.has(economy)) followState.selected.delete(economy);
    else followState.selected.add(economy);
    try {
      window.localStorage.setItem(FOLLOW_KEY, JSON.stringify([...followState.selected]));
      followState.saved = true;
    } catch (_) { /* Selection still works for this page when persistence is blocked. */ }
    renderFollows();
  });
});
window.addEventListener('storage', (event) => {
  if (event.key === FOLLOW_KEY || event.key === null) {
    followState = readFollows();
    renderFollows();
  }
});
document.querySelectorAll('[data-window-all]').forEach((button) => {
  button.addEventListener('click', () => {
    button.setAttribute('aria-pressed', String(button.getAttribute('aria-pressed') !== 'true'));
    renderFollows();
  });
});
renderFollows();
/* A cached page carries one bounded absolute schedule. Roll only within that
   snapshot; no browser network request, build-time countdown, or guessed result. */
(() => {
  const sections = [...document.querySelectorAll('[data-rolling-window]')].map(section => ({
    section,
    entries: [...section.querySelectorAll('[data-window-item]')].map(node => ({node, at: Date.parse(node.getAttribute('data-at'))}))
      .filter(row => Number.isFinite(row.at)).sort((a, b) => a.at - b.at),
    keyOnly: section.hasAttribute('data-key-window')
  }));
  if (!sections.length) return;
  let deadlineTimer;
  const render = () => {
    if (document.hidden) return;
    const now = Date.now();
    sections.forEach(({section, entries, keyOnly}) => {
      for (let i = entries.length - 1; i >= 0; i -= 1) {
        if (entries[i].at < now - 3600000) { entries[i].node.remove(); entries.splice(i, 1); }
      }
      const all = entries.filter(row => !keyOnly || row.node.getAttribute('data-tier') === '1');
      section.hidden = all.length === 0;
      const card = keyOnly ? section.closest('.ledger-next-window') : null;
      if (card) card.hidden = all.length === 0;
      const future = all.filter(row => row.at > now);
      const inside = keyOnly ? all : all.filter(row => now - 3600000 <= row.at && row.at <= now + 72 * 3600000);
      const fallback = !keyOnly && inside.length === 0;
      const candidates = fallback ? future : inside;
      const followed = candidates.filter(row => isFollowed(row.node));
      const followingFallback = candidates.length > 0 && (followed.length === 0 || keyOnly && future.length > 0 && !future.some(row => isFollowed(row.node)));
      const chosen = followingFallback ? candidates : followed.length ? followed : candidates;
      const keyVisible = keyOnly ? [...chosen.filter(row => row.at <= now), ...chosen.filter(row => row.at > now).slice(0, 1)] : [];
      const visible = new Set((keyOnly ? keyVisible : fallback ? chosen.slice(0, 3) : chosen).map(row => row.node));
      entries.forEach(({node, at}) => {
        node.hidden = !visible.has(node);
        const status = node.querySelector('[data-window-status]');
        if (status) status.textContent = at <= now ? T('已到点 · 官方数据核验中') : '';
        const countdown = node.querySelector('[data-key-countdown]');
        if (countdown) countdown.textContent = at > now && !node.hasAttribute('data-date') ? countdownLabel(at - now) : '';
      });
      const note = section.querySelector('[data-window-note]');
      if (note) {
        note.textContent = T('未来 72 小时内没有关键日程，以下是随后最近的三项。');
        note.hidden = !fallback || !future.length;
      }
      const followNote = section.querySelector('[data-window-follow-note]');
      if (followNote) {
        followNote.textContent = T('关注的经济体在此窗口内没有日程，已显示全部经济体。');
        followNote.hidden = !followingFallback;
      }
      const next = section.querySelector('[data-window-next]');
      if (next) {
        const followedFuture = future.filter(row => isFollowed(row.node));
        const first = (followingFallback ? future : followedFuture.length ? followedFuture : future)[0];
        next.hidden = !first;
        next.textContent = first ? T('下一项：') + (first.node.querySelector('[data-window-name]')?.textContent || '') + ' · ' + (first.node.querySelector('time')?.textContent || '') : '';
      }
      if (!keyOnly) {
        const followedFuture = future.filter(row => isFollowed(row.node));
        const first = (followingFallback ? future : followedFuture.length ? followedFuture : future)[0];
        document.querySelectorAll('[data-rolling-pulse]').forEach(pulse => {
          const name = pulse.querySelector('[data-window-pulse-name]');
          const time = pulse.querySelector('[data-window-pulse-time]');
          const feed = pulse.querySelector('[data-window-pulse-feed]');
          pulse.hidden = !first;
          if (!first) return;
          const source = first.node.querySelector('a');
          if (name) {
            name.textContent = first.node.querySelector('[data-window-name]')?.textContent || first.node.textContent.trim();
            if (source) name.setAttribute('href', source.getAttribute('href'));
          }
          if (time) {
            const absolute = first.node.querySelector('time')?.cloneNode(true);
            const remaining = document.createElement('span');
            remaining.className = 'pulse-remaining pulse-countdown num';
            remaining.textContent = first.node.hasAttribute('data-date') ? '' : countdownLabel(first.at - now);
            // Preserve the official-source control while rolling its timestamp.
            const linkedTime = time.querySelector('a');
            if (linkedTime) {
              if (source) linkedTime.setAttribute('href', source.getAttribute('href'));
              linkedTime.classList.add('pulse-absolute');
              linkedTime.replaceChildren(...(absolute ? [absolute] : []));
            }
            time.removeAttribute('data-countdown');
            if (absolute && !linkedTime) absolute.classList.add('pulse-absolute');
            time.replaceChildren(...(absolute ? [linkedTime || absolute] : []), remaining);
          }
          if (feed) {
            const economy = first.node.getAttribute('data-economy');
            feed.setAttribute('href', 'calendar/' + (FOLLOW_ALLOWED.has(economy) ? economy : 'key-events') + '.ics');
            feed.hidden = false;
          }
        });
      }
    });
  };
  const scheduleDeadline = () => {
    clearTimeout(deadlineTimer);
    if (document.hidden) return;
    const now = Date.now();
    // Wake exactly on due, window entry, and expiry; +1 preserves the inclusive
    // sixty-minute boundary and removes the row immediately afterwards.
    const instants = sections.flatMap(({entries}) => entries.flatMap(({at}) => [at, at - 72 * 3600000, at + 3600000 + 1]))
      .filter(at => at > now);
    if (instants.length) deadlineTimer = setTimeout(() => { render(); scheduleDeadline(); }, Math.min(Math.min(...instants) - now, 2147483647));
  };
  updateRollingWindows = () => { render(); scheduleDeadline(); };
  updateRollingWindows();
  setInterval(render, 30000);
  document.addEventListener('visibilitychange', updateRollingWindows);
})();
/* The source keeps every statement panel readable without JavaScript. */
(() => {
  document.querySelectorAll('[data-diff-tabs]').forEach(section => {
    const tabs = [...section.querySelectorAll('[data-diff-bank]')];
    const pairs = tabs.map(tab => ({tab, panel: document.getElementById(tab.getAttribute('href')?.slice(1))}))
      .filter(pair => pair.panel && section.contains(pair.panel));
    if (!pairs.length) return;
    const nav = pairs[0].tab.parentElement;
    nav.setAttribute('role', 'tablist');
    const activate = (index, focus = false) => {
      pairs.forEach(({tab, panel}, i) => {
        tab.setAttribute('aria-selected', String(i === index));
        tab.setAttribute('tabindex', i === index ? '0' : '-1');
        panel.hidden = i !== index;
      });
      if (focus) pairs[index].tab.focus();
    };
    pairs.forEach(({tab, panel}, i) => {
      tab.id ||= 'tab-' + panel.id;
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('aria-labelledby', tab.id);
      tab.addEventListener('click', event => { event.preventDefault(); activate(i); });
      tab.addEventListener('keydown', event => {
        let index;
        if (event.key === 'ArrowRight') index = (i + 1) % pairs.length;
        else if (event.key === 'ArrowLeft') index = (i + pairs.length - 1) % pairs.length;
        else if (event.key === 'Home') index = 0;
        else if (event.key === 'End') index = pairs.length - 1;
        else return;
        event.preventDefault(); activate(index, true);
      });
    });
    const fromHash = pairs.findIndex(({panel}) => '#' + panel.id === window.location.hash);
    const defaultIndex = pairs.findIndex(({tab}) => tab.getAttribute('data-diff-bank') === section.getAttribute('data-default-bank'));
    activate(fromHash >= 0 ? fromHash : defaultIndex >= 0 ? defaultIndex : 0);
    window.addEventListener('hashchange', () => {
      const index = pairs.findIndex(({panel}) => '#' + panel.id === window.location.hash);
      if (index >= 0) activate(index);
    });
  });
})();
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
        const match = isFollowed(row.node) && terms.every((term) => row.text.includes(term)) && selects.every(([key, select]) =>
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
    document.addEventListener('heron:follows-change', update);
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
    if (document.hidden) return;
    const now = Date.now();
    nodes.forEach((node) => {
      const at = Date.parse(node.getAttribute('datetime'));
      if (Number.isNaN(at)) return;
      const relative = at <= now + 60000 ? label(Math.max(0, now - at), false) : label(at - now, true);
      node.textContent = relative + (node.hasAttribute('data-rel-success') ? ' ' + T('成功') : '');
    });
  };
  update();
  setInterval(update, 30000);
  document.addEventListener('visibilitychange', update);
})();


/* Answer-card countdown (2026-10-28): the build writes the instant and the first label; this only ticks it every
   30 s while the tab is visible, and after the instant says so instead of guessing what happened. */
(() => {
  const nodes = Array.from(document.querySelectorAll('[data-countdown]'));
  if (!nodes.length) return;
  const update = () => {
    if (document.hidden) return;
    const now = Date.now();
    nodes.forEach((node) => {
      const at = Date.parse(node.getAttribute('data-countdown'));
      if (Number.isNaN(at)) return;
      const left = at - now;
      node.textContent = left > 0 ? (node.hasAttribute('data-countdown-date') ? '' : countdownLabel(left)) : T('已到点 · 官方数据核验中');
      if (left <= 0) node.title = T('已到公布时间，以官方公布为准');
      node.classList.toggle('is-past', left <= 0);
    });
  };
  let deadlineTimer;
  const scheduleDeadline = () => {
    clearTimeout(deadlineTimer);
    if (document.hidden) return;
    const now = Date.now();
    const upcoming = nodes.map(node => Date.parse(node.getAttribute('data-countdown'))).filter(at => Number.isFinite(at) && at > now);
    if (!upcoming.length) return;
    deadlineTimer = setTimeout(() => { update(); scheduleDeadline(); }, Math.min(Math.min(...upcoming) - now, 2147483647));
  };
  update();
  scheduleDeadline();
  setInterval(update, 30000);
  document.addEventListener('visibilitychange', () => { update(); scheduleDeadline(); });
})();
