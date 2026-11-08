# -*- coding: utf-8 -*-
"""前端完整性回归测试：防「打不开」这类事故。

覆盖三类问题（都真实发生过）：
  ① index.html 的 <script> 路径被改坏 → 所有 JS 404，页面永远停在「加载中…」；
  ② 首页/侧边栏脚本语法错误 → 白屏、侧栏空白；
  ③ 新加的功能页没进侧边栏 → 用户以为功能被删了（功能裁剪投诉的根因）。

Node 可用时再跑三项动态校验（真实执行全部前端脚本 + 渲染全部页面）；
Node 不可用时只做静态校验并提示，不判失败（避免环境问题堵住提交）。
"""
import os
import re
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PASS, FAIL = [], []


def check(name, cond, detail=""):
    (PASS if cond else FAIL).append(name)
    print(("  [OK] " if cond else "  [XX] ") + name + (f"  -> {detail}" if detail else ""))


def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()


def main():
    html = read(os.path.join(ROOT, "public", "index.html"))
    srcs = re.findall(r'<script src="([^"]+)"', html)
    check("① index.html 引用了脚本", len(srcs) >= 10, f"{len(srcs)} 个")

    bad = [s for s in srcs if not re.fullmatch(r"/js/[\w./-]+\.js", s)]
    check("  脚本路径干净（无被改坏的 ?v= / 后缀粘连）", not bad, "、".join(bad) or "全部形如 /js/xxx.js")

    missing = [s for s in srcs if not os.path.exists(os.path.join(ROOT, "public", s.lstrip("/")))]
    check("  脚本文件都存在", not missing, "、".join(missing) or "全部命中磁盘文件")

    js_dir = os.path.join(ROOT, "public", "js")
    jsfiles = sorted(f for f in os.listdir(js_dir) if f.endswith(".js"))
    check("  js 目录非空且含启动脚本", "app.js" in jsfiles and "core.js" in jsfiles, f"{len(jsfiles)} 个文件")

    # 侧栏静态兜底：即使某个 JS 没跑成，index.html 里的 <a href="#page"> 也点得动
    fallback = re.findall(r'<a href="#(\w+)"', html)
    check("  侧栏有静态兜底入口（脚本异常也能导航）", len(fallback) >= 60, f"{len(fallback)} 条 <a href=\"#page\">")

    # 静态语法检查（node --check）
    node = shutil.which("node")
    if node:
        broken = []
        for f in jsfiles:
            r = subprocess.run([node, "--check", os.path.join(js_dir, f)], capture_output=True, text=True)
            if r.returncode != 0:
                broken.append(f + "：" + (r.stderr or "").strip().splitlines()[0][:60])
        check("② 全部 JS 语法可编译", not broken, "；".join(broken) or f"{len(jsfiles)} 个文件通过")
    else:
        print("  [--] 未找到 node，跳过语法检查")

    # ③ 侧边栏覆盖：注册的页面必须都能点到
    nav = read(os.path.join(ROOT, "public", "js", "pages_work.js"))
    m = re.search(r"GROUPS_ALL = \[(.*?)\n  \];", nav, re.S)
    in_nav = set(re.findall(r"'([\w]+)'", m.group(1))) if m else set()
    check("③ 侧边栏 8 大分组可解析", bool(m) and len(in_nav) >= 55, f"{len(in_nav)} 个入口")

    if node:
        r = subprocess.run([node, os.path.join(ROOT, "tests", "frontend", "nav_cover.js")],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=ROOT)
        out = (r.stdout or "") + (r.stderr or "")
        no_missing = "未出现在侧栏: （无）" in out
        check("  所有已注册页面都在侧栏（无隐藏功能）", no_missing,
              " ".join(l for l in out.splitlines() if "未出现在侧栏" in l) or out.strip()[-80:])

        r = subprocess.run([node, os.path.join(ROOT, "tests", "frontend", "nav_labels.js")],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=ROOT)
        out = (r.stdout or "").strip()
        check("  侧栏条目都有中文名（不露英文 key）", "缺中文名： （无）" in out, out[-80:] or "无输出")

        r = subprocess.run([node, os.path.join(ROOT, "tests", "frontend", "boot_check.js")],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=ROOT)
        out = (r.stdout or "") + (r.stderr or "")
        check("  整站启动：全部脚本可执行、侧栏与首页渲染成功", "全部通过" in out,
              "；".join(l for l in out.splitlines() if l.startswith("✗")) or "侧栏 65 个入口 + 首页 6 区卡片")

        r = subprocess.run([node, os.path.join(ROOT, "tests", "frontend", "render_check.js")],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=ROOT)
        out = (r.stdout or "") + (r.stderr or "")
        check("  21 个核心页面渲染无 undefined / NaN / 空壳", "不合格页面: 0" in out,
              "；".join(l for l in out.splitlines() if l.startswith("✗")) or "全部通过")

        # ④ 按钮失灵专项：所有内联事件调用的函数必须真实存在，且点击后能跳转。
        #   真实事故：goPage 从未定义 → 13 处「去办理 / 进入工作台」全部点了没反应；
        #   岗位视角侧栏抛 "is not iterable" → 侧栏动态渲染失败。
        r = subprocess.run([node, os.path.join(ROOT, "tests", "frontend", "handler_audit.js")],
                           capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=ROOT)
        out = (r.stdout or "") + (r.stderr or "")
        check("  全部按钮处理函数已定义且跳转生效（含四视角侧栏）",
              r.returncode == 0 and "缺失: （无）" in out and "按钮跳转验证: 成功" in out
              and "侧栏四视角: 全部正常" in out,
              "；".join(l.strip() for l in out.splitlines()
                        if "缺失:" in l or "侧栏四视角:" in l or "跳转验证:" in l or "脚本异常:" in l))

    # ⑤ 前端 api() 路径必须全部有后端路由（离线比对，不依赖服务）。
    #   真实事故：/api/competency/coverage 少写 /v28 前缀，首页卡片静默失效。
    r = subprocess.run([sys.executable, os.path.join(ROOT, "tests", "frontend", "api_routes.py")],
                       capture_output=True, text=True, encoding="utf-8", errors="replace", cwd=ROOT)
    out = (r.stdout or "") + (r.stderr or "")
    check("  前端 API 调用全部命中后端路由（无静默 404）", r.returncode == 0 and "无对应后端路由: （无）" in out,
          "；".join(l.strip() for l in out.splitlines() if l.strip().startswith("✗")) or "全部命中")

    # ⑥ 光影双主题完整性：两套令牌齐备、CSS 括号平衡、切换链路完整
    css = read(os.path.join(ROOT, "public", "styles.css"))
    core_js = read(os.path.join(ROOT, "public", "js", "core.js"))
    app_js = read(os.path.join(ROOT, "public", "js", "app.js"))
    dark_at = css.find('[data-theme="dark"]')
    light_block = css[:dark_at] if dark_at > 0 else ""
    dark_block = css[dark_at:] if dark_at > 0 else ""
    keys = ("--primary", "--card", "--text", "--bg", "--border", "--sidebar", "--header-bg")
    vars_ok = dark_at > 0 and all(" " + k + ":" in light_block for k in keys) \
        and all(" " + k + ":" in dark_block for k in keys) \
        and css.count("{") == css.count("}")
    chain_ok = ("themeToggle" in html and "data-theme" in html
                and all(x in core_js for x in ("function toggleTheme", "function applyChartTheme",
                                               "function refreshChartColors", "function currentTheme"))
                and "themeToggle" in app_js and "applyChartTheme()" in core_js)
    check("  光影双主题令牌齐备、CSS 平衡、切换链路完整", vars_ok and chain_ok,
          f"令牌={'OK' if vars_ok else '缺失'} / 链路={'OK' if chain_ok else '断裂'} / {len(css)} 字节 CSS")

    if not node:
        print("  [--] 未找到 node，动态渲染校验已跳过（静态校验通过即放行）")

    print(f"\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    return 0 if not FAIL else 1


if __name__ == "__main__":
    sys.exit(main())
