/* Fonts-ready geometry for unlisted screenshot cards; no network or storage. */
(function () {
  'use strict';
  var card = document.getElementById('card');
  if (!card) return;
  function frame() {
    return new Promise(function (resolve) {
      var timer, animation;
      function done() { clearTimeout(timer); cancelAnimationFrame(animation); resolve(); }
      timer = setTimeout(done, 50);
      animation = requestAnimationFrame(done);
    });
  }
  function fonts() {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () {
        card.dataset.studioFonts = 'timeout'; resolve();
      }, 1500);
      Promise.resolve(document.fonts && document.fonts.ready).then(function () {
        clearTimeout(timer);
        // A late font response must not erase an observed timeout.
        if (card.dataset.studioFonts === 'timeout') return;
        card.dataset.studioFonts = document.fonts ? 'ready' : 'unavailable'; resolve();
      }, function (error) { clearTimeout(timer); reject(error); });
    });
  }
  function fit() {
    var rows = Array.from(card.querySelectorAll('.studio-change'));
    var changes = card.querySelector('.studio-changes');
    var warning = card.querySelector('.studio-truncated');
    var footer = card.querySelector('.studio-footer');
    var style = getComputedStyle(card);
    var bounds = card.getBoundingClientRect();
    var scale = bounds.width / 1080;
    var gap = parseFloat(style.rowGap || style.gap) || 0;
    // The footer owns its full measured height; all other content stops before
    // it and before the native vertical overlay exclusion at y=1700.
    var limit = bounds.bottom - (parseFloat(style.paddingBottom) || 0)
      - (footer ? footer.getBoundingClientRect().height : 0) - gap;
    if (card.dataset.cardRatio === '9x16') limit = Math.min(limit, bounds.bottom - 220 * scale);
    function updateWarning() {
      if (!warning || !changes) return;
      var shown = rows.filter(function (row) { return !row.hidden; }).length;
      var omitted = Number(changes.dataset.totalChanges) - shown;
      warning.hidden = omitted === 0;
      warning.textContent = omitted ? warning.dataset.moreTemplate.replace('%d', String(omitted)) : '';
    }
    // Keep these measured rules in step with geometry_check.py's independent
    // browser audit: one CSS-pixel rounding tolerance, native 64px safe margins
    // and 220px vertical exclusion, scaled with the preview canvas.
    function inspect() {
      var checks = {version: 1, ratio: card.dataset.cardRatio,
        geometry_complete: true, content_bounds: true, scroll_width: true,
        scroll_height: true, text_safe_margins: true, footer_clearance: true,
        bottom_exclusion: true};
      function validBox(b) {
        return b && ['x', 'y', 'width', 'height', 'right', 'bottom'].every(function (k) {
          return Number.isFinite(b[k]);
        }) && b.width >= 0 && b.height >= 0
          && Math.abs(b.x + b.width - b.right) <= 1
          && Math.abs(b.y + b.height - b.bottom) <= 1;
      }
      function visible(node) {
        for (var e = node; e && e !== card.parentElement; e = e.parentElement) {
          var s = getComputedStyle(e);
          if (e.hidden || e.classList.contains('sr-only') || s.display === 'none'
              || s.visibility === 'hidden' || s.visibility === 'collapse') return false;
        }
        return true;
      }
      try {
        var footerBox = footer && footer.getBoundingClientRect();
        if (!validBox(bounds) || bounds.width <= 0 || bounds.height <= 0
            || !validBox(footerBox) || footerBox.width <= 0 || footerBox.height <= 0
            || !Number.isFinite(limit) || !['3x4', '9x16'].includes(checks.ratio)) {
          checks.geometry_complete = false;
        }
        Array.from(card.children).forEach(function (node) {
          if (node === footer || !visible(node)) return;
          var b = node.getBoundingClientRect();
          if (!validBox(b)) checks.geometry_complete = false;
          else if (b.bottom > limit + .5) checks.content_bounds = false;
        });
        [card].concat(Array.from(card.querySelectorAll('*'))).forEach(function (node) {
          if (!visible(node)) return;
          var display = getComputedStyle(node).display;
          // Inline glyph geometry is checked by Range below. Inline-block,
          // flex/grid and all other descendant blocks own scroll/client boxes.
          if (display === 'inline' || display === 'contents') return;
          var b = node.getBoundingClientRect();
          var sizes = [node.clientWidth, node.scrollWidth, node.clientHeight, node.scrollHeight];
          if (!validBox(b) || !sizes.every(function (n) { return Number.isFinite(n) && n >= 0; })
              || b.width > 0 && node.clientWidth === 0 || b.height > 0 && node.clientHeight === 0) {
            checks.geometry_complete = false;
          }
          if (node.scrollWidth > node.clientWidth + 1) checks.scroll_width = false;
          if (node.scrollHeight > node.clientHeight + 1) checks.scroll_height = false;
        });
        var walker = document.createTreeWalker(card, 4), count = 0;
        while (walker.nextNode()) {
          var node = walker.currentNode, parent = node.parentElement;
          if (!node.textContent.trim() || !visible(parent)) continue;
          var range = document.createRange();
          range.selectNodeContents(node);
          var rects = Array.from(range.getClientRects()).filter(function (b) { return b.width && b.height; });
          if (!rects.length) checks.geometry_complete = false;
          rects.forEach(function (b) {
            count++;
            if (!validBox(b)) { checks.geometry_complete = false; return; }
            if (b.x < bounds.x + 64 * scale - 1 || b.right > bounds.right - 64 * scale + 1
                || b.y < bounds.y + 64 * scale - 1 || b.bottom > bounds.bottom - 64 * scale + 1) {
              checks.text_safe_margins = false;
            }
            if (!parent.closest('.studio-footer')) {
              if (!footerBox || b.bottom > footerBox.y + 1) checks.footer_clearance = false;
              if (checks.ratio === '9x16' && b.bottom > bounds.bottom - 220 * scale + 1) checks.bottom_exclusion = false;
            }
          });
        }
        if (!count) checks.geometry_complete = false;
      } catch (_error) {
        // Unsupported or absent measurement APIs must never create a pass.
        checks.geometry_complete = false;
      }
      return checks;
    }
    function passed(checks) {
      return Object.keys(checks).filter(function (key) { return key !== 'version' && key !== 'ratio'; })
        .every(function (key) { return checks[key] === true; });
    }
    function contentFits() { return passed(inspect()); }
    // Restart from every admitted candidate on each fit. Removing only a tail
    // preserves source reading order and fills up to the 4/7 cap when it fits.
    rows.forEach(function (row) { row.hidden = false; });
    updateWarning();
    while (rows.filter(function (row) { return !row.hidden; }).length > 0 && !contentFits()) {
      var shown = rows.filter(function (row) { return !row.hidden; });
      shown[shown.length - 1].hidden = true;
      updateWarning();
    }
    var checks = inspect();
    card.dataset.studioChecks = JSON.stringify(checks);
    card.dataset.studioOverflow = String(!passed(checks));
    card.dataset.studioReady = 'true';
  }
  window.heronStudioReady = fonts()
    .then(frame).then(frame).then(function () {
      fit();
      window.addEventListener('resize', fit);
    });
}());
