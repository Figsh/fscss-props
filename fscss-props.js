/*!
 * fscss-props.js  |  FSCSS properties-only browser runtime
 *
 * Load early, in <head>, no defer:
 *   <script src="fscss-props.js"></script>
 *
 * CSS (style blocks, inline style="", <link data-fscss>):
 *   .box { mx: auto; size: 200px 100px; rounded-t: 12px; center: true; }
 *   .vid { inset: ratio-fit(16/9); }   (parent needs container-type: size)
 *
 * JS (every element gets these automatically):
 *   el.fscssProp.mx = '1rem';
 *   el.fscssProp['ratio-fit'] = '16/9';   // or el.fscssProp.ratioFit
 *   el.fscssProp.color = 'red';           // normal CSS works too
 *   el.fscssProp.mx = null;               // removes it
 *   el.fscssPropText = 'mx: 1rem; size: 10px 20px; color: red';
 *   console.log(el.fscssPropText);
 *
 * Extras: fscssProps.register(name, v => [[prop, value], ...])
 *         fscssProps.watch(shadowRoot), fscssProps.expand(cssText), fscssProps.disconnect()
 */
(() => {
  'use strict';
  if (typeof document === 'undefined' || window.fscssProps) return;

  /* ---------------- helpers ---------------- */

  const IMP = /\s*!important\s*$/i;
  const imp = (v, pr) => {
    v = String(v).trim();
    return IMP.test(v) ? [v.replace(IMP, ''), 'important'] : [v, pr || ''];
  };

  // split on whitespace, but not inside parentheses
  const split = (v) => {
    const out = [];
    let d = 0, cur = '';
    for (const c of v) {
      if (c === '(') d++;
      else if (c === ')') d--;
      if (/\s/.test(c) && !d) { if (cur) out.push(cur); cur = ''; }
      else cur += c;
    }
    if (cur) out.push(cur);
    return out;
  };

  const kebab = (k) =>
    k.startsWith('--') ? k :
    k.replace(/^(webkit|moz|ms)(?=[A-Z])/, '-$1').replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());

  const track = (v) => (/^\d+$/.test(v) ? `repeat(${v}, 1fr)` : v);

  /* ---------------- property table ---------------- */
  // name -> (value) => [[prop, value], ...] | null (null = leave untouched)

  const R = Object.create(null);

  // one name -> one or many longhands, same value
  const multi = (o) => {
    for (const k in o) {
      const ps = [].concat(o[k]);
      R[k] = (v) => ps.map((p) => [p, v]);
    }
  };

  const LR = (p, s = '') => [`${p}-left${s}`, `${p}-right${s}`];
  const TB = (p, s = '') => [`${p}-top${s}`, `${p}-bottom${s}`];

  // plain aliases
  multi({
    m: 'margin', mt: 'margin-top', mb: 'margin-bottom', ml: 'margin-left', mr: 'margin-right',
    p: 'padding', pt: 'padding-top', pb: 'padding-bottom', pl: 'padding-left', pr: 'padding-right',
    fs: 'font-size', fw: 'font-weight', ff: 'font-family', lh: 'line-height',
    ls: 'letter-spacing', ta: 'text-align', td: 'text-decoration', tt: 'text-transform',
    ws: 'white-space', tsh: 'text-shadow',
    ov: 'overflow', ovx: 'overflow-x', ovy: 'overflow-y',
    z: 'z-index', op: 'opacity', cur: 'cursor', pe: 'pointer-events', us: 'user-select', pos: 'position',
    jc: 'justify-content', ai: 'align-items', ac: 'align-content',
    ji: 'justify-items', js: 'justify-self', as: 'align-self', pi: 'place-items',
    fdir: 'flex-direction', fwrap: 'flex-wrap', grow: 'flex-grow', shrink: 'flex-shrink', basis: 'flex-basis',
    trans: 'transition', anim: 'animation', tf: 'transform', fil: 'filter',
    shadow: 'box-shadow', aspect: 'aspect-ratio', 'obj-fit': 'object-fit', 'obj-pos': 'object-position',
  });

  // axis shorthands
  multi({
    'inset-x': ['left', 'right'], 'inset-y': ['top', 'bottom'],
    'scroll-mx': LR('scroll-margin'), 'scroll-my': TB('scroll-margin'),
    'scroll-px': LR('scroll-padding'), 'scroll-py': TB('scroll-padding'),
    'margin-x': LR('margin'), mx: LR('margin'),
    'margin-y': TB('margin'), my: TB('margin'),
    'padding-x': LR('padding'), px: LR('padding'),
    'padding-y': TB('padding'), py: TB('padding'),
    'gap-x': 'column-gap', 'gap-y': 'row-gap',
    w: 'width', h: 'height',
    'min-w': 'min-width', 'max-w': 'max-width', 'min-h': 'min-height', 'max-h': 'max-height',
    'place-x': ['justify-content', 'justify-items'],
    'place-y': ['align-content', 'align-items'],
  });

  const two = (a, b) => (v) => {
    const [x, y = x] = split(v);
    return [[a, x], [b, y]];
  };
  R['min-size'] = two('min-width', 'min-height');
  R['max-size'] = two('max-width', 'max-height');
  R.size = two('width', 'height');

  R['origin-x'] = (v) => [['transform-origin', `${v} center`]];
  R['origin-y'] = (v) => [['transform-origin', `center ${v}`]];
  R['object-x'] = (v) => [['object-position', `${v} center`]];
  R['object-y'] = (v) => [['object-position', `center ${v}`]];

  // safe area
  const safe = (v, sides) => sides.map((s) => [`padding-${s}`, `max(${v}, env(safe-area-inset-${s}))`]);
  R['safe-x'] = (v) => safe(v, ['left', 'right']);
  R['safe-y'] = (v) => safe(v, ['top', 'bottom']);
  R['inset-safe'] = (v) => {
    v = v === '0' ? '0px' : v;
    return ['top', 'right', 'bottom', 'left'].map((s) => [s, `max(${v}, env(safe-area-inset-${s}))`]);
  };

  // borders
  multi({
    'border-x': LR('border'), 'border-y': TB('border'),
    'border-t': 'border-top', 'border-b': 'border-bottom',
    'border-l': 'border-left', 'border-r': 'border-right',
  });
  for (const [k, s] of [['bw', '-width'], ['bs', '-style'], ['bc', '-color']]) {
    multi({
      [`${k}-x`]: LR('border', s), [`${k}-y`]: TB('border', s),
      [`${k}-t`]: `border-top${s}`, [`${k}-b`]: `border-bottom${s}`,
      [`${k}-l`]: `border-left${s}`, [`${k}-r`]: `border-right${s}`,
      [k]: `border${s}`,
    });
  }

  // radius
  const CORNER = { tl: 'top-left', tr: 'top-right', bl: 'bottom-left', br: 'bottom-right' };
  for (const k in CORNER) {
    for (const n of ['rounded', 'radius']) multi({ [`${n}-${k}`]: `border-${CORNER[k]}-radius` });
  }
  const SIDE = {
    t: ['top', ['top-left', 'top-right']],
    b: ['bottom', ['bottom-left', 'bottom-right']],
    l: ['left', ['top-left', 'bottom-left']],
    r: ['right', ['top-right', 'bottom-right']],
  };
  for (const s in SIDE) {
    const [full, cs] = SIDE[s];
    const ps = cs.map((c) => `border-${c}-radius`);
    multi({ [`rounded-${s}`]: ps, [`radius-${full}`]: ps });
  }
  multi({ rounded: 'border-radius', radius: 'border-radius' });

  // background
  multi({
    'bg-x': 'background-position-x', 'bg-y': 'background-position-y',
    'bg-color': 'background-color', 'bg-image': 'background-image',
    'bg-repeat': 'background-repeat', 'bg-pos': 'background-position',
    'bg-attachment': 'background-attachment', 'bg-clip': 'background-clip',
    'bg-origin': 'background-origin', 'bg-size': 'background-size',
    bg: 'background',
  });
  R['bg-size-x'] = (v) => [['background-size', `${v} auto`]];
  R['bg-size-y'] = (v) => [['background-size', `auto ${v}`]];

  // ratio-fit
  const RATIO = /^(?:ratio-fit\(\s*)?([\d.]+)\s*(?:\/\s*([\d.]+))?\s*\)?$/i;
  R['ratio-fit'] = (v) => {
    const m = RATIO.exec(v);
    if (!m) return null;
    const w = m[1], h = m[2] || 1;
    return [
      ['position', 'absolute'], ['inset', '0'], ['margin', 'auto'],
      ['aspect-ratio', `${w} / ${h}`],
      ['width', `min(100%, 100cqh * ${w} / ${h})`],
      ['height', `min(100%, 100cqw * ${h} / ${w})`],
    ];
  };
  // inset is real CSS, only expand the ratio-fit() form
  R.inset = (v) => (/^ratio-fit\(/i.test(v) ? R['ratio-fit'](v) : null);

  // helpers
  R.center = (v) =>
    v === 'x' ? [['display', 'flex'], ['justify-content', 'center']] :
    v === 'y' ? [['display', 'flex'], ['align-items', 'center']] :
    [['display', 'grid'], ['place-items', 'center']];
  R.stack = (v) => [['display', 'flex'], ['flex-direction', 'column'], ['gap', v]];
  R.hstack = (v) => [['display', 'flex'], ['flex-direction', 'row'], ['gap', v]];
  // fill is also an SVG property, so only act on the FSCSS forms
  R.fill = (v) =>
    /^(fixed|absolute|true|1)?$/i.test(v) ? [['position', /^fixed$/i.test(v) ? 'fixed' : 'absolute'], ['inset', '0']] : null;
  R['abs-center'] = () => [['position', 'absolute'], ['inset', '0'], ['margin', 'auto']];
  R.truncate = () => [['overflow', 'hidden'], ['text-overflow', 'ellipsis'], ['white-space', 'nowrap']];
  R['line-clamp'] = (v) => [
    ['display', '-webkit-box'], ['-webkit-line-clamp', v], ['-webkit-box-orient', 'vertical'],
    ['line-clamp', v], ['overflow', 'hidden'],
  ];
  R.cols = (v) => [['display', 'grid'], ['grid-template-columns', track(v)]];
  R.rows = (v) => [['display', 'grid'], ['grid-template-rows', track(v)]];
  R['auto-fit'] = (v) => [['display', 'grid'], ['grid-template-columns', `repeat(auto-fit, minmax(${v}, 1fr))`]];
  R.glass = (v) => [['backdrop-filter', `blur(${v})`], ['-webkit-backdrop-filter', `blur(${v})`]];
  R.ring = (v) => [['box-shadow', `0 0 0 ${v}`]];

  /* ---------------- expansion ---------------- */

  let QUICK;
  const buildQuick = () => {
    QUICK = new RegExp(
      '(?<![\\w-])(?:' + Object.keys(R).sort((a, b) => b.length - a.length).join('|') + ')\\s*:', 'i'
    );
  };
  buildQuick();

  // name: value; (value may hold nested parens, ends at ; or } or end of text)
  const DECL = /(?<![\w-])([a-z][\w-]*)\s*:\s*((?:[^;{}()]|\((?:[^()]|\([^()]*\))*\))+?)\s*(?:;|(?=\})|$)/gi;

  // [[prop, value, priority]] or null when not an FSCSS property
  const expand = (n, v, pr) => {
    const f = R[n];
    if (!f) return null;
    const [x, p] = imp(v, pr);
    const o = f(x);
    return o && o.map(([a, b]) => [a, b, p]);
  };

  const ser = (pairs) => pairs.map(([p, v, pr]) => `${p}: ${v}${pr ? ' !important' : ''};`).join(' ');

  const expandCSS = (css) =>
    QUICK.test(css)
      ? css.replace(DECL, (all, n, v) => {
          const o = expand(n.toLowerCase(), v);
          return o ? ser(o) : all;
        })
      : css;

  /* ---------------- per-element state ---------------- */

  const store = new WeakMap(); // el -> Map(name -> { v, pr, props })
  const proxies = new WeakMap();

  const getMap = (el) => {
    let m = store.get(el);
    if (!m) store.set(el, (m = new Map()));
    return m;
  };

  // drop entries whose longhands were wiped by someone else
  const live = (el) => {
    const m = store.get(el);
    if (!m) return new Map();
    for (const [n, o] of m) {
      if (!o.props.every((p) => el.style.getPropertyValue(p))) m.delete(n);
    }
    return m;
  };

  const put = (el, name, value, pr) => {
    if (!el.style) return;
    name = kebab(name);
    const m = getMap(el), old = m.get(name);
    if (old) old.props.forEach((p) => el.style.removeProperty(p));
    if (value == null || value === '' || value === false) { m.delete(name); return; }
    const [x, p] = imp(value, pr);
    const pairs = expand(name, x, p) || [[name, x, p]];
    for (const [a, b, c] of pairs) el.style.setProperty(a, b, c);
    m.set(name, { v: x, pr: p, props: pairs.map((q) => q[0]) });
  };

  const parseDecls = (text) => {
    const out = [];
    const re = /([\w-]+)\s*:\s*((?:[^;()]|\((?:[^()]|\([^()]*\))*\))+?)\s*(?:;|$)/g;
    for (const m of String(text).matchAll(re)) out.push([m[1], m[2]]);
    return out;
  };

  const makeProxy = (el) =>
    new Proxy({}, {
      get(_, k) {
        if (typeof k !== 'string') return undefined;
        const n = kebab(k);
        const o = live(el).get(n);
        return o ? o.v + (o.pr ? ' !important' : '') : el.style ? el.style.getPropertyValue(n) : '';
      },
      set(_, k, v) {
        if (typeof k === 'string') put(el, k, v);
        return true;
      },
      deleteProperty(_, k) {
        if (typeof k === 'string') put(el, k, null);
        return true;
      },
      has: (_, k) => typeof k === 'string' && live(el).has(kebab(k)),
      ownKeys: () => [...live(el).keys()],
      getOwnPropertyDescriptor: (_, k) =>
        typeof k === 'string' && live(el).has(kebab(k))
          ? { enumerable: true, configurable: true, writable: true, value: undefined }
          : undefined,
    });

  Object.defineProperty(Element.prototype, 'fscssProp', {
    configurable: true,
    get() {
      let p = proxies.get(this);
      if (!p) proxies.set(this, (p = makeProxy(this)));
      return p;
    },
    set(obj) {
      if (obj && typeof obj === 'object') Object.assign(this.fscssProp, obj);
    },
  });

  Object.defineProperty(Element.prototype, 'fscssPropText', {
    configurable: true,
    get() {
      return [...live(this)].map(([n, o]) => `${n}: ${o.v}${o.pr ? ' !important' : ''};`).join(' ');
    },
    set(text) {
      for (const n of [...live(this).keys()]) put(this, n, null);
      for (const [n, v] of parseDecls(text)) put(this, n, v);
    },
  });

  /* ---------------- watchers ---------------- */

  const out = new WeakMap(); // style el -> text we last wrote / saw

  const procStyle = (el) => {
    if (el.hasAttribute('data-fscss-off')) return;
    const txt = el.textContent;
    if (out.get(el) === txt) return; // our own write
    const res = expandCSS(txt);
    out.set(el, res);
    if (res !== txt) el.textContent = res;
  };

  const procInline = (el) => {
    const txt = el.getAttribute('style');
    if (!txt || !QUICK.test(txt)) return;
    const m = getMap(el);
    const res = txt.replace(DECL, (all, n, v) => {
      n = n.toLowerCase();
      const o = expand(n, v);
      if (!o) return all;
      const [x, p] = imp(v);
      m.set(n, { v: x, pr: p, props: o.map((q) => q[0]) });
      return ser(o);
    });
    if (res !== txt) el.setAttribute('style', res);
  };

  const absUrls = (css, base) =>
    css.replace(/url\(\s*(['"]?)(?!data:|https?:|\/\/|#)([^)'"]+)\1\s*\)/gi, (_, q, u) => {
      try { return `url(${q}${new URL(u, base).href}${q})`; } catch { return _; }
    });

  const linked = new WeakSet();
  const procLink = async (l) => {
    if (linked.has(l) || !/stylesheet/i.test(l.rel) || !l.href) return;
    linked.add(l);
    try {
      const css = await (await fetch(l.href)).text();
      const st = document.createElement('style');
      st.setAttribute('data-fscss-from', l.href);
      if (l.media) st.media = l.media;
      st.textContent = expandCSS(absUrls(css, l.href));
      out.set(st, st.textContent);
      l.after(st);
      l.disabled = true;
    } catch (e) {
      console.warn('[fscss-props] could not load', l.href, e);
    }
  };

  const one = (e) => {
    const t = e.localName;
    if (t === 'style') procStyle(e);
    else if (t === 'link' && e.hasAttribute('data-fscss')) procLink(e);
    if (e.hasAttribute('style')) procInline(e);
  };

  const scan = (n) => {
    if (n.nodeType === 1) one(n);
    if (n.querySelectorAll) n.querySelectorAll('style,link[data-fscss],[style]').forEach(one);
  };

  const mo = new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'attributes') { procInline(m.target); continue; }
      if (m.type === 'characterData') {
        const p = m.target.parentNode;
        if (p && p.localName === 'style') procStyle(p);
        continue;
      }
      for (const n of m.addedNodes) scan(n);
      if (m.target.localName === 'style') procStyle(m.target);
    }
  });

  const watch = (root = document) => {
    scan(root.documentElement || root);
    mo.observe(root, {
      subtree: true, childList: true, characterData: true,
      attributes: true, attributeFilter: ['style'],
    });
  };

  watch(document);

  window.fscssProps = {
    expand: expandCSS,
    process: scan,
    watch,
    disconnect: () => mo.disconnect(),
    register(name, fn) {
      R[name.toLowerCase()] = fn;
      buildQuick();
    },
  };
})();
