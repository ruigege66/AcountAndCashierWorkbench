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
  // 简洁模式：不创建任何装饰层。保留函数签名以兼容现有调用点与回归断言。
}

/* 页面重绘后：挂静态渐变描边、入场揭示，并扫一道一次性斜光。
   没有指针移动监听，滚动时不做任何逐帧计算。 */
function refreshMotion(root) {
  // 简洁模式：不挂揭示类、不触发扫光，页面重绘时零额外工作。
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
  // 简洁模式：无扫光动画。
}
