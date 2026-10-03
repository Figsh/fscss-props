# fscss-props

**Lightweight browser runtime for FSCSS property shorthands.**

Expands names like `mx`, `size`, `rounded`, `stack`, `ratio-fit` into real CSS longhands — in `<style>`, inline `style=""`, optional stylesheets, and from JavaScript. No `@define`, `@arr`, `pattern()`, or module imports. For those, use the full [FSCSS](https://www.npmjs.com/package/fscss) CLI / runtime.

| | Full `fscss` | `fscss-props` |
|--|--------------|---------------|
| Property shorthands (1.2.5-style) | ✅ compile-time | ✅ live in the browser |
| `@define` / `@arr` / `pattern` | ✅ | ❌ |
| DOM API (`el.fscssProp`) | — | ✅ |
| Typical use | Ship plain CSS | Prototypes, design tools, JS-driven UI |

- **Shorthand map:** [fscss.devtem.org/shorthands](https://fscss.devtem.org/shorthands)  
- **Core language:** [github.com/Figsh/xfscss](https://github.com/Figsh/xfscss) (v1.2.5+)

---

## Install

```bash
npm install fscss-props
```

Or CDN / copy:

```html
<!-- sync in <head> so the first paint can already be expanded -->
<script src="https://cdn.jsdelivr.net/npm/fscss-props@1.0.0/fscss-props.min.js"></script>
```

Local file: `fscss-props.js` at the repo root.

---

## Quick start

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/fscss-props@1.0.0/fscss-props.min.js"></script>
  <style>
    body {
m: 0;
p: 24px;
bg: #0b1020;
color: #e6edf7;
ff: system-ui, sans-serif;
}
    .card {
max-w: 400px;
mx: auto;
stack: 12px;
p: 20px;
rounded: 16px;
bg: #121a30;
}
    .btn {
px: 14px;
py: 8px;
rounded: 999px;
bg: #6366f1;
color: #fff;
border: none;
cur: pointer;
}
  </style>
</head>
<body>
  <div class="card">
    <p style="m: 0; fs: 14px; color: #9fb0d0;">Inline works too</p>
    <button id="go" class="btn">Grow</button>
  </div>
  <script>
    const el = document.querySelector('.card');
    document.getElementById('go').onclick = () => {
      el.fscssProp.p = '28px';
      el.fscssProp.shadow = '0 12px 40px #6366f155';
    };
  </script>
</body>
</html>
```

---

## CSS usage

### Style tags

Any `<style>` is scanned. Shorthand declarations are rewritten to longhands in place.

```html
<style>
  .box {
    mx: auto;
    size: 200px 100px;
    rounded-t: 12px;
    center: true;
  }
</style>
```

Skip a block: `data-fscss-off` on the `<style>` element.

### Inline styles

```html
<div style="bg: red; size: 80px; center: true; rounded: 12px;">Hi</div>
```

### Linked stylesheets

```html
<link rel="stylesheet" href="./theme.css" data-fscss>
```

Only links with **`data-fscss`** are fetched, expanded, and injected as a `<style>` (original link disabled). Relative `url()` values are resolved against the stylesheet URL.

---

## JavaScript API

### `element.fscssProp`

Proxy map of **FSCSS property name > value**. Setting expands and applies longhands; `null` / `''` / `false` removes the longhands this runtime added for that name.

```js
el.fscssProp.mx = '1rem';
el.fscssProp.size = '120px';           // width + height
el.fscssProp['ratio-fit'] = '16/9';    // or el.fscssProp.ratioFit after kebab
el.fscssProp.color = 'red';            // normal CSS names work too
el.fscssProp.mx = null;                // remove

// bulk assign
el.fscssProp = { px: '16px', rounded: '12px', bg: '#121a30' };
```

CamelCase keys are kebab-cased (`ratioFit` → `ratio-fit`).

### `element.fscssPropText`

Serialize or replace the whole FSCSS-owned set:

```js
console.log(el.fscssPropText);
// "mx: 1rem; size: 120px;"

el.fscssPropText = 'stack: 12px; p: 16px; rounded: 12px; bg: #121a30';
```

Setting `fscssPropText` clears previous FSCSS-owned entries on that element, then applies the new declarations.

### Global `window.fscssProps`

| Method | Description |
|--------|-------------|
| `expand(cssText)` | Expand shorthands in a CSS string; return new string |
| `process(node)` | Scan a node (and descendants) for styles / links / inline |
| `watch(root)` | Observe `document` or a **ShadowRoot** (default watches `document`) |
| `disconnect()` | Stop the document `MutationObserver` |
| `register(name, fn)` | Add a custom shorthand: `(value) => [[prop, value], ...]` |

```js
fscssProps.register('pad-block', (v) => [
  ['padding-top', v],
  ['padding-bottom', v],
]);

el.fscssProp['pad-block'] = '12px';
```

---

## Property reference (summary)

Aligned with [FSCSS 1.2.5 shorthands](https://fscss.devtem.org/shorthands).

**Axis / size:** `mx` `my` `px` `py` `inset-x` `inset-y` `gap-x` `gap-y` `w` `h` `min-w` `max-w` `size` `min-size` `max-size` `safe-x` `safe-y` `inset-safe` …

**Aliases:** `m` `p` `fs` `fw` `ff` `pos` `z` `op` `jc` `ai` `shadow` `tf` `bg` …

**Layout helpers:** `center` (`x` / `y` / other → grid center), `stack` `hstack` `fill` `abs-center` `truncate` `line-clamp` `cols` `rows` `auto-fit` `glass` `ring`

**Borders / radius:** `border-x` `border-t` `bw` `rounded` `rounded-t` `rounded-tl` …

**ratio-fit:** parent should use `container-type: size` (or size containment) for `cqw` / `cqh`.

```css
.frame { position: relative; height: 220px; container-type: size; }
.frame > .box { inset: ratio-fit(16 / 9); }
/* or */ .box { ratio-fit: 16/9; }
```

---

## Examples

| File | What it shows |
|------|----------------|
| [examples/demo.html](examples/demo.html) | Interactive lab (shape, layout, ratio-fit, resize, clamp, live style) |
| [examples/state-vanilla.html](examples/state-vanilla.html) | Tiny store → `fscssProp` updates |
| [examples/state-reactive.html](examples/state-reactive.html) | Proxy state object bound to elements |

```bash
npx serve .
# open /examples/demo.html
```

---

## State management patterns

### 1. Direct (simplest)

```js
function setTheme(mode) {
  document.body.fscssProp.bg = mode === 'dark' ? '#0b1020' : '#f8fafc';
  document.body.fscssProp.color = mode === 'dark' ? '#e6edf7' : '#0f172a';
}
```

### 2. Small store + subscribe

```js
function createStore(initial) {
  let state = { ...initial };
  const subs = new Set();
  return {
    get: () => state,
    set(patch) {
      state = { ...state, ...patch };
      subs.forEach((fn) => fn(state));
    },
    subscribe(fn) {
      subs.add(fn);
      fn(state);
      return () => subs.delete(fn);
    },
  };
}

const ui = createStore({ pad: 16, radius: 12, accent: '#6366f1' });

ui.subscribe((s) => {
  card.fscssPropText = `p: ${s.pad}px; rounded: ${s.radius}px; border: 2px solid ${s.accent}`;
});
```

### 3. Clear ownership

Only remove what this runtime set:

```js
el.fscssProp['line-clamp'] = 2;
// later
el.fscssProp['line-clamp'] = null; // strips -webkit-line-clamp, overflow, etc.
```

Prefer **`fscssPropText`** when switching exclusive layout modes (`stack` vs `cols` vs `hstack`) so old layout longhands do not linger.

---

## Shadow DOM

```js
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `<style>.x { mx: auto; size: 40px; }</style><div class="x"></div>`;
fscssProps.watch(root);
```

---

## Production notes

- For static sites, **compile with FSCSS CLI** and skip this script when you do not need live expansion or the JS API.
- Load **synchronously in `<head>`** if the first paint must not flash unexpanded declarations.
- `fill` only expands for values like `true` / `absolute` / `fixed` so SVG `fill: #f00` is left alone.
- `inset: ratio-fit(...)` expands; normal `inset: 0` is left to the browser.

---

## License

MIT

---

## Related

- [FSCSS npm](https://www.npmjs.com/package/fscss) — full language + CLI  
- [Shorthands reference](https://fscss.devtem.org/shorthands)  
- [xfscss releases](https://github.com/Figsh/xfscss/releases)
