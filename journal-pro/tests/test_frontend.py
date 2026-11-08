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
    else:
        print("  [--] 未找到 node，跳过动态渲染校验（静态校验已通过即放行）")

    print(f"\n通过 {len(PASS)} 项，失败 {len(FAIL)} 项")
    return 0 if not FAIL else 1


if __name__ == "__main__":
    sys.exit(main())
