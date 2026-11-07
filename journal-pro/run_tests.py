# -*- coding: utf-8 -*-
"""统一测试运行器：发现并顺序执行 tests/test_*.py，汇总结果与耗时。

用法：
  python run_tests.py            # 跑全部 5 套
  python run_tests.py core tax   # 只跑名字包含 core / tax 的套件
  python run_tests.py --fast     # 跳过最慢的 reports 套件

退出码：全部通过为 0，任何失败为 1（pre-commit 与 CI 依赖此约定）。
"""
import glob
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.abspath(__file__))
SLOW = {"test_reports"}


def suites(args):
    fast = "--fast" in args
    only = [a for a in args if not a.startswith("--")]
    out = []
    for path in sorted(glob.glob(os.path.join(ROOT, "tests", "test_*.py"))):
        name = os.path.basename(path)[:-3]
        if fast and name in SLOW:
            continue
        if only and not any(o in name for o in only):
            continue
        out.append((name, path))
    return out


def main():
    args = sys.argv[1:]
    chosen = suites(args)
    if not chosen:
        print("未找到匹配的测试套件")
        return 1
    print(f"journal-pro 回归测试：{len(chosen)} 套\n{'=' * 60}")
    total_p = total_f = 0
    failed_suites = []
    for name, path in chosen:
        t0 = time.time()
        r = subprocess.run([sys.executable, path], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", cwd=ROOT)
        dt = time.time() - t0
        m = re.search(r"通过 (\d+) 项，失败 (\d+) 项", r.stdout)
        p, f = (int(m.group(1)), int(m.group(2))) if m else (0, 0)
        ok = r.returncode == 0 and f == 0 and "Traceback" not in (r.stdout + r.stderr)
        total_p += p
        total_f += f
        mark = "✓" if ok else "✗"
        print(f"  {mark} {name:16} {p:4} 项通过 / {f} 项失败   {dt:5.1f}s")
        if not ok:
            failed_suites.append((name, (r.stdout or "") + (r.stderr or "")))
    print("=" * 60)
    total_dt = 0.0
    print(f"合计：{total_p} 项通过 / {total_f} 项失败，{len(chosen) - len(failed_suites)}/{len(chosen)} 套全绿")
    if failed_suites:
        for name, log in failed_suites:
            print(f"\n----- 失败详情：{name} -----")
            tail = log.strip().splitlines()
            print("\n".join(tail[-25:]))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
