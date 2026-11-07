# -*- coding: utf-8 -*-
"""补齐：数据验证下拉 + 公式列保护（子代理环境不支持的项）"""
import openpyxl
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.styles import Protection
from datetime import date, datetime

PATH = "D:/日记账/日记账.xlsx"
wb = openpyxl.load_workbook(PATH)

# ---------- 0. 检查科目清单是否覆盖样例数据，缺则补 ----------
subj_ws = wb["科目清单"]
subjects = [subj_ws.cell(row=r, column=1).value for r in range(5, subj_ws.max_row + 1)
            if subj_ws.cell(row=r, column=1).value]
need = ["银行存款", "管理费用", "其他应收款", "销售费用", "应收账款", "应付账款",
        "应交税费", "合同负债", "财务费用"]
add = [x for x in need if x not in subjects]
r = subj_ws.max_row + 1
for v in add:
    subj_ws.cell(row=r, column=1, value=v)
    r += 1
print("科目清单已有:", len(subjects), "补加:", add)

# ---------- 1. 数据验证 ----------
def add_dv(ws, ranges, **kw):
    dv = DataValidation(**kw)
    dv.showErrorMessage = True
    ws.add_data_validation(dv)
    for rng in ranges:
        dv.add(rng)

cash = wb["现金日记账"]   # D对方科目 E收入 F支出 G结余 H项目 I对账状态 J校验
bank = wb["银行存款日记账"]  # D结算方式 E对方科目 F收入 G支出 H结余 I项目 J对账状态 K校验

add_dv(cash, ["D4:D200"], type="list", formula1="'科目清单'!$A$5:$A$200",
       allow_blank=True, errorTitle="科目无效", error="请从科目清单中选择，或在清单页添加后刷新")
add_dv(cash, ["H4:H200"], type="list", formula1="'项目清单'!$A$5:$A$200",
       allow_blank=True, errorTitle="项目无效", error="请从项目清单中选择，或在清单页添加后刷新")
add_dv(cash, ["I4:I200"], type="list", formula1='"未核对,已核对,已调节"',
       allow_blank=True, errorTitle="状态无效", error="可选：未核对 / 已核对 / 已调节")

add_dv(bank, ["E4:E200"], type="list", formula1="'科目清单'!$A$5:$A$200",
       allow_blank=True, errorTitle="科目无效", error="请从科目清单中选择，或在清单页添加后刷新")
add_dv(bank, ["I4:I200"], type="list", formula1="'项目清单'!$A$5:$A$200",
       allow_blank=True, errorTitle="项目无效", error="请从项目清单中选择，或在清单页添加后刷新")
add_dv(bank, ["J4:J200"], type="list", formula1='"未核对,已核对,已调节"',
       allow_blank=True, errorTitle="状态无效", error="可选：未核对 / 已核对 / 已调节")
add_dv(bank, ["D4:D200"], type="list", formula1='"转账,现金支票,转账支票,网银,汇款,其他"',
       allow_blank=True, errorTitle="结算方式无效", error="可选：转账/现金支票/转账支票/网银/汇款/其他")

# ---------- 2. 公式列保护（无密码，审阅-撤销保护即可解锁） ----------
UNLOCK = Protection(locked=False)

def unlock_range(ws, rng):
    for row in ws[rng]:
        for c in row:
            c.protection = UNLOCK

def protect_journal(ws, in_cols, bal_col, chk_col, bal_row=3):
    """解锁输入列(已在外部逐列解锁)与期初余额格，开启保护锁定其余(公式列)"""
    ws[f"{bal_col}{bal_row}"].protection = UNLOCK  # 期初余额
    p = ws.protection
    p.sheet = True
    p.insertRows = False        # 允许插入行
    p.autoFilter = False        # 允许筛选
    p.sort = False              # 允许排序
    p.formatCells = False       # 允许设置单元格格式
    p.formatColumns = False
    p.formatRows = False
    p.selectLockedCells = False # 允许选中锁定格（便于复制）
    p.selectUnlockedCells = False

# 现金：输入列 A~F + H~I（G结余、J校验为公式锁定）
for L in "ABCDEFHI":
    unlock_range(cash, f"{L}4:{L}200")
protect_journal(cash, "ABCDEFHI", "G", "J")

# 银行：输入列 A~G + I~J（H结余、K校验为公式锁定）
for L in "ABCDEFGIJ":
    unlock_range(bank, f"{L}4:{L}200")
protect_journal(bank, "ABCDEFGIJ", "H", "K")

# 日结核对：解锁两个手工填列位（实际库存现金 / 对账单余额）
chk = wb["日结核对"]
unlock_range(chk, "E6:E35")
unlock_range(chk, "E40:E69")
p = chk.protection
p.sheet = True
p.formatCells = False
p.selectLockedCells = False
p.selectUnlockedCells = False

wb.save(PATH)
print("OK: 数据验证与公式保护已写入")
