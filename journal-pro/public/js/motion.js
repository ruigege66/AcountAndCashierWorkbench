/* 轻量动效引擎（性能优先版）
   保留：静态极光层、星点呼吸、页面切换一次性扫光、入场揭示、hover 反馈。
   移除：逐帧 pointermove 计算（3D 倾斜 / 局部高光 / 鼠标柔光）、
        全屏背景位移动画、旋转渐变描边的每帧重绘。
   原因：这些效果在滚动和移动鼠标时反复触发全页重绘，浏览器明显卡顿。
   零依赖；装饰层 pointer-events:none；prefers-reduced-motion 下整层不创建。
*/
function motionReduced() {
  try {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { return false; }
}

function initMotion() {
  if (typeof document === 'undefined' || motionReduced()) return;
  try {
    let layers = document.getElementById('motionLayers');
    if (!layers) {
      layers = document.createElement('div');
      layers.id = 'motionLayers';
      layers.setAttribute('aria-hidden', 'true');
      layers.innerHTML = '<div class="ml-aurora"></div><div class="ml-stars"></div>'
        + '<div class="ml-spot"></div><div class="ml-progress"></div>';
      // 挂在 .main 内：其层叠上下文保证装饰层落在 header/content 之下
      const host = document.querySelector ? document.querySelector('.main') : null;
      (host || document.body).appendChild(layers);
    }
  } catch (e) {}
}

/* 页面重绘后：挂静态渐变描边、入场揭示，并扫一道一次性斜光。
   没有指针移动监听，滚动时不做任何逐帧计算。 */
function refreshMotion(root) {
  if (typeof document === 'undefined' || motionReduced()) return;
  pulseSweep();
  if (!root || typeof root.querySelectorAll !== 'function') return;
  try {
    const nodes = Array.prototype.slice.call(root.querySelectorAll('.card,.kpi,.page-help'));
    nodes.forEach(function (n, i) {
      try {
        if (n.classList && n.classList.contains('page-help')) n.classList.add('glow-ring');
        // 无 IntersectionObserver 时不加 reveal 类：内容始终以正常状态呈现
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
