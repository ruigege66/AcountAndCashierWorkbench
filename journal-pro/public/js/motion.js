/* 动效引擎：移植 Agnes AI 一类产品站的动效语言
   ① 流动极光带 ② 鼠标跟随柔光 ③ 卡片局部高光 + 3D 倾斜
   ④ 旋转渐变描边 ⑤ 星点微光 ⑥ 页面切换顶部扫光 ⑦ 入场轻微揭示
   纯原生 JS + CSS，零依赖；所有装饰层 pointer-events:none，不拦截任何点击。
   尊重 prefers-reduced-motion，不支持时全部降级为静态（内容永远清晰可见）。
*/
function motionReduced() {
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { return false; }
}

let _motionActiveCard = null;

function _clearTilt(card) {
  if (!card || !card.style || !card.style.setProperty) return;
  try {
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    card.style.setProperty('--mx', '100%');
    card.style.setProperty('--my', '0%');
  } catch (e) {}
}

function initMotion() {
  if (typeof document === 'undefined' || motionReduced()) return;
  let layers;
  try {
    layers = document.getElementById('motionLayers');
    if (!layers) {
      layers = document.createElement('div');
      layers.id = 'motionLayers';
      layers.setAttribute('aria-hidden', 'true');
      layers.innerHTML = '<div class="ml-aurora"></div><div class="ml-stars"></div>'
        + '<div class="ml-spot"></div><div class="ml-progress"></div>';
      // 挂到 .main 内：它创建了层叠上下文，装饰层 z-index:0 会稳定地
      // 落在 header(z:3) / content(z:1) 之下、光球层之上，不会盖住文字。
      const host = document.querySelector ? document.querySelector('.main') : null;
      (host || document.body).appendChild(layers);
    }
  } catch (e) { return; }

  const spot = layers.querySelector ? layers.querySelector('.ml-spot') : null;
  let queued = false, lastX = -999, lastY = -999, lastCard = null;

  function apply() {
    queued = false;
    try {
      if (spot && spot.style && spot.style.setProperty) {
        spot.style.setProperty('--px', lastX + 'px');
        spot.style.setProperty('--py', lastY + 'px');
      }
      const card = lastCard;
      if (card && card.getBoundingClientRect && card.style && card.style.setProperty) {
        const r = card.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          const px = Math.max(0, Math.min(1, (lastX - r.left) / r.width));
          const py = Math.max(0, Math.min(1, (lastY - r.top) / r.height));
          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
          card.style.setProperty('--rx', ((0.5 - py) * 3).toFixed(2) + 'deg');
          card.style.setProperty('--ry', ((px - 0.5) * 3).toFixed(2) + 'deg');
        }
      }
    } catch (e) {}
  }

  try {
    document.addEventListener('pointermove', function (e) {
      lastX = e.clientX || 0;
      lastY = e.clientY || 0;
      let card = null;
      try { card = e.target && e.target.closest ? e.target.closest('.card,.kpi') : null; } catch (e2) {}
      if (_motionActiveCard && _motionActiveCard !== card) _clearTilt(_motionActiveCard);
      _motionActiveCard = card;
      lastCard = card;
      if (!queued) {
        queued = true;
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(apply);
        else apply();
      }
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      _clearTilt(_motionActiveCard);
      _motionActiveCard = null;
      lastCard = null;
    });
  } catch (e) {}
}

/* 页面重绘后：给重点元素挂旋转描边、给新卡片挂入场揭示、扫一道顶部光 */
function refreshMotion(root) {
  if (typeof document === 'undefined' || motionReduced()) return;
  pulseSweep();
  if (!root || typeof root.querySelectorAll !== 'function') return;
  try {
    const nodes = Array.prototype.slice.call(root.querySelectorAll('.card,.kpi,.page-help'));
    nodes.forEach(function (n, i) {
      try {
        if (n.classList && n.classList.contains('page-help')) n.classList.add('glow-ring');
        // 无 IntersectionObserver 时不加任何 reveal 类：内容始终以正常状态呈现
        if (typeof IntersectionObserver === 'undefined' || !_motionObserver) return;
        if (n.classList && !n.classList.contains('motion-bound')) {
          n.classList.add('motion-bound', 'reveal');
          n.style.setProperty('--reveal-delay', (Math.min(i, 8) * 45) + 'ms');
          _motionObserver.observe(n);
        }
      } catch (e) {}
    });
  } catch (e) {}
}

let _motionObserver = null;
if (typeof IntersectionObserver !== 'undefined') {
  try {
    _motionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          try { en.target.classList.add('in'); } catch (e) {}
          _motionObserver.unobserve(en.target);
        }
      });
    }, { rootMargin: '80px 0px', threshold: 0.02 });
  } catch (e) { _motionObserver = null; }
}

function pulseSweep() {
  if (typeof document === 'undefined' || motionReduced()) return;
  try {
    const bar = document.querySelector ? document.querySelector('.ml-progress') : null;
    if (!bar || !bar.classList) return;
    bar.classList.remove('run');
    void bar.offsetWidth;              // 强制重排以重启动画
    bar.classList.add('run');
  } catch (e) {}
}
