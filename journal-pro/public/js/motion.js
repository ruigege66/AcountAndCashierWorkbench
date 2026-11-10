/* 简洁模式：视觉装饰已全部回退，这里保留函数签名以兼容调用点与回归断言。
   initMotion / refreshMotion / pulseSweep 都是空实现，
   不创建 DOM 层、不注册观察器、不跑任何动画，页面重绘时零额外工作。
   若将来要恢复光影，恢复本文件实现并删掉 styles.css 末尾的「简洁模式」覆盖段即可。
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

let _motionObserver = null;   // 简洁模式：不创建观察器
function pulseSweep() {
  // 简洁模式：无扫光动画。
}
