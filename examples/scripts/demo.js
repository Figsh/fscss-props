const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const target = $('#target'), code = $('#code');
const show = () => {
  if (document.activeElement !== code) code.value = target.fscssPropText.replace(/; /g, ';\n');
};
target.fscssPropText =
  'size: 120px; rounded: 24px; center: true; bg: hsl(240 80% 60%); tf: rotate(0deg); ring: 0px rgba(99,102,241,.45)';
show();
const bind = (id, fn) => {
  const el = $(id);
  el.addEventListener('input', () => { fn(+el.value); show(); });
};
bind('#size',   v => target.fscssProp.size = v + 'px');
bind('#radius', v => target.fscssProp.rounded = v + 'px');
bind('#rotate', v => target.fscssProp.tf = `rotate(${v}deg)`);
bind('#ring',   v => target.fscssProp.ring = v + 'px rgba(99,102,241,.45)');
bind('#hue',    v => target.fscssProp.bg = `hsl(${v} 80% 60%)`);
code.addEventListener('input', () => { target.fscssPropText = code.value; });
const grid = $('#grid');
const setLayout = (btn) => {
  $$('#layouts button').forEach(b => b.setAttribute('aria-pressed', b === btn));
  grid.fscssPropText = btn.dataset.l;
};
$('#layouts').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) setLayout(b);
});
setLayout($('#layouts button'));
const rbox = $('#rbox');
const setRatio = (btn) => {
  $$('#ratios button').forEach(b => b.setAttribute('aria-pressed', b === btn));
  rbox.fscssProp['ratio-fit'] = btn.dataset.r;
  rbox.textContent = btn.textContent;
};
$('#ratios').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) setRatio(b);
});
setRatio($('#ratios [aria-pressed=true]'));
const rz = $('#rz'), grip = $('#grip'), rzOut = $('#rzOut');
grip.addEventListener('pointerdown', e => {
  grip.setPointerCapture(e.pointerId);
  const r = rz.getBoundingClientRect(), sx = e.clientX, sy = e.clientY;
  const move = ev => {
    rz.fscssProp.size = `${Math.round(r.width + ev.clientX - sx)}px ${Math.round(r.height + ev.clientY - sy)}px`;
    rzOut.textContent = rz.fscssPropText;
  };
  const up = () => {
    grip.removeEventListener('pointermove', move);
    grip.removeEventListener('pointerup', up);
  };
  grip.addEventListener('pointermove', move);
  grip.addEventListener('pointerup', up);
});
const txt = $('#txt');
const setClamp = (btn) => {
  $$('#clamps button').forEach(b => b.setAttribute('aria-pressed', b === btn));
  txt.fscssProp['line-clamp'] = +btn.dataset.n || null;
};
$('#clamps').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (b) setClamp(b);
});
setClamp($('#clamps [aria-pressed=true]'));
const live = $('#live'), liveCss = $('#liveCss');
liveCss.value =
`.glass-demo {
  bg: linear-gradient(135deg, #ec4899, #6366f1);
  size: 100% 120px;
  rounded: 16px;
  center: true;
  fs: 22px;
  fw: 700;
  shadow: 0 10px 30px #6366f155;
}`;
const applyLive = () => { live.textContent = liveCss.value; };
liveCss.addEventListener('input', applyLive);
applyLive();
