# -*- coding: utf-8 -*-
"""生成会计日记账工作簿：现金日记账 + 银行存款日记账 + 使用说明"""
try:
    import openpyxl
except ImportError:
    import subprocess, sys
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--quiet", "openpyxl>=3.1.0"])
    import openpyxl

from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.formatting.rule import CellIsRule
from openpyxl.worksheet.datavalidation import DataValidation
from datetime import date

def xl_color(css_hex: str) -> str:
    value = css_hex.removeprefix("#").upper()
    if len(value) != 6:
        raise ValueError(f"Expected #RRGGBB, got: {css_hex}")
    return "FF" + value

# ---- 配色（商务蓝）----
XL_TITLE_BG = xl_color("#2F5597")
XL_HEADER_BG = xl_color("#4472C4")
XL_INPUT_BG = xl_color("#D9E2F3")
XL_SUMMARY_BG = xl_color("#2F5597")
XL_BORDER_C = xl_color("#BFBFBF")
XL_NEG_FONT = xl_color("#9C0006")

F_TITLE = Font(name="微软雅黑", size=14, bold=True, color="FFFFFF")
F_HEADER = Font(name="微软雅黑", size=11, bold=True, color="FFFFFF")
F_SUMMARY = Font(name="微软雅黑", size=11, bold=True, color="FFFFFF")
F_BODY = Font(name="微软雅黑", size=11)
FILL_TITLE = PatternFill("solid", fgColor=XL_TITLE_BG)
FILL_HEADER = PatternFill("solid", fgColor=XL_HEADER_BG)
FILL_INPUT = PatternFill("solid", fgColor=XL_INPUT_BG)
FILL_SUMMARY = PatternFill("solid", fgColor=XL_SUMMARY_BG)
thin = Side(style="thin", color=XL_BORDER_C)
BORDER = Border(left=thin, right=thin, top=thin, bottom=thin)
CENTER = Alignment(horizontal="center", vertical="center")
RIGHT = Alignment(horizontal="right", vertical="center")
LEFT = Alignment(horizontal="left", vertical="center", wrapText=True)

FMT_MONEY = "#,##0.00"
FMT_DATE = "yyyy-mm-dd"

wb = openpyxl.Workbook()
wb.properties.title = "日记账"

# ============ 通用建表函数 ============
def build_journal(ws, title_text, headers, opening, rows, closing_balance_col,
                  money_cols, date_col="A", dv_col=None, dv_options=None):
    """锚点：第1行标题、第2行表头、第3行期初、第4~8行样例数据、第9行本月合计"""
    ncol = len(headers)
    last_col = openpyxl.utils.get_column_letter(ncol)
    money_last = closing_balance_col

    # 第1行：标题（合并居中）
    ws.merge_cells(f"A1:{last_col}1")
    ws["A1"] = title_text
    ws["A1"].font = F_TITLE
    ws["A1"].alignment = CENTER
    ws["A1"].fill = FILL_TITLE
    ws.row_dimensions[1].height = 28

    # 第2行：表头
    for i, h in enumerate(headers):
        c = ws.cell(row=2, column=i + 1, value=h)
        c.font = F_HEADER
        c.fill = FILL_HEADER
        c.alignment = CENTER
        c.border = BORDER
    ws.row_dimensions[2].height = 22

    # 第3行：期初余额（输入区，浅底）
    for col in range(1, ncol + 1):
        c = ws.cell(row=3, column=col)
        c.fill = FILL_INPUT
        c.border = BORDER
        c.font = F_BODY
        c.alignment = LEFT if col == 3 else CENTER
    ws.cell(row=3, column=3, value="期初余额")
    ws.cell(row=3, column=closing_balance_col_idx(money_cols, closing_balance_col),
            value=opening).number_format = FMT_MONEY
    ws.cell(row=3, column=1, value=date(2026, 11, 1)).number_format = FMT_DATE

    # 第4~8行：样例数据（结余列为公式）
    bal_letter = closing_balance_col
    prev_bal = f"{bal_letter}3"
    in_l, out_l = money_cols[0], money_cols[1]
    for i, row in enumerate(rows):
        r = 4 + i
        for j, v in enumerate(row):
            col_letter = openpyxl.utils.get_column_letter(j + 1)
            c = ws[f"{col_letter}{r}"]
            c.value = v
            c.font = F_BODY
            c.border = BORDER
            if col_letter == date_col:
                c.number_format = FMT_DATE
                c.alignment = CENTER
            elif col_letter in money_cols:
                c.number_format = FMT_MONEY
                c.alignment = RIGHT
            elif col_letter == "C":
                c.alignment = LEFT
            else:
                c.alignment = CENTER
        # 结余公式：上一行结余 + 收入 - 支出
        ws[f"{bal_letter}{r}"] = (f'=IF(AND({in_l}{r}="",{out_l}{r}=""),"",'
                                  f'{prev_bal}+N({in_l}{r})-N({out_l}{r}))')
        ws[f"{bal_letter}{r}"].number_format = FMT_MONEY
        ws[f"{bal_letter}{r}"].font = F_BODY
        ws[f"{bal_letter}{r}"].alignment = RIGHT
        ws[f"{bal_letter}{r}"].border = BORDER
        prev_bal = f"{bal_letter}{r}"

    # 第9行：本月合计
    r = 9
    in_l, out_l = money_cols[0], money_cols[1]
    for col in range(1, ncol + 1):
        c = ws.cell(row=r, column=col)
        c.fill = FILL_SUMMARY
        c.font = F_SUMMARY
        c.border = BORDER
        c.alignment = CENTER
    ws.cell(row=r, column=3, value="本月合计")
    ws[f"{in_l}{r}"] = f"=SUM({in_l}4:{in_l}8)"
    ws[f"{out_l}{r}"] = f"=SUM({out_l}4:{out_l}8)"
    ws[f"{bal_letter}{r}"] = f"={bal_letter}3+SUM({in_l}4:{in_l}8)-SUM({out_l}4:{out_l}8)"
    for L in (in_l, out_l, bal_letter):
        ws[f"{L}{r}"].number_format = FMT_MONEY
        ws[f"{L}{r}"].alignment = RIGHT

    # 条件格式：结余为负 → 红字
    rng = f"{bal_letter}3:{bal_letter}9"
    ws.conditional_formatting.add(
        rng, CellIsRule(operator="lessThan", formula=["0"],
                        font=Font(color=XL_NEG_FONT, bold=True)))

    # 数据验证（结算方式等枚举列）
    if dv_col and dv_options:
        dv = DataValidation(type="list", formula1='"' + ",".join(dv_options) + '"', allow_blank=True)
        ws.add_data_validation(dv)
        dv.add(f"{dv_col}4:{dv_col}8")

    # 列宽、冻结、筛选
    widths = {"A": 12, "B": 12, "C": 28, "D": 13, "E": 13, "F": 13, "G": 14, "H": 14}
    for L, w in widths.items():
        if L <= last_col:
            ws.column_dimensions[L].width = w
    ws.freeze_panes = "A3"
    ws.auto_filter.ref = f"A2:{last_col}8"

    # 打印设置：横向、一页宽、每页重复表头与标题
    ws.page_setup.orientation = "landscape"
    ws.page_setup.fitToWidth = 1
    ws.page_setup.fitToHeight = 0
    ws.sheet_properties.pageSetUpPr.fitToPage = True
    ws.print_title_rows = "1:2"
    ws.sheet_properties.tabColor = XL_HEADER_BG

def closing_balance_col_idx(money_cols, bal_letter):
    return openpyxl.utils.column_index_from_string(bal_letter)

# ============ Sheet 1：现金日记账 ============
ws1 = wb.active
ws1.title = "现金日记账"
cash_rows = [
    [date(2026, 11, 1), "现收001", "从银行提取备用金", "银行存款", 3000, None],
    [date(2026, 11, 2), "现付001", "支付办公用品采购款", "管理费用", None, 350],
    [date(2026, 11, 3), "现付002", "支付市内交通费", "管理费用", None, 120.5],
    [date(2026, 11, 4), "现收002", "收回员工备用金", "其他应收款", 800, None],
    [date(2026, 11, 5), "现付003", "支付快递费", "销售费用", None, 65],
]
build_journal(
    ws1, "现金日记账（2026年11月）",
    ["日期", "凭证字号", "摘要", "对方科目", "收入（借方）", "支出（贷方）", "结余"],
    opening=5000, rows=cash_rows, closing_balance_col="G",
    money_cols=("E", "F"),
)

# ============ Sheet 2：银行存款日记账 ============
ws2 = wb.create_sheet("银行存款日记账")
bank_rows = [
    [date(2026, 11, 1), "银收001", "收到A客户货款", "网银", "应收账款", 25000, None],
    [date(2026, 11, 2), "银付001", "支付供应商货款", "转账", "应付账款", None, 18000],
    [date(2026, 11, 3), "银付002", "缴纳上月税费", "网银", "应交税费", None, 5600],
    [date(2026, 11, 4), "银收002", "收到B客户预付款", "转账", "合同负债", 12000, None],
    [date(2026, 11, 5), "银付003", "支付银行手续费", "网银", "财务费用", None, 85.5],
]
build_journal(
    ws2, "银行存款日记账（2026年11月）",
    ["日期", "凭证字号", "摘要", "结算方式", "对方科目", "收入（借方）", "支出（贷方）", "结余"],
    opening=86000, rows=bank_rows, closing_balance_col="H",
    money_cols=("F", "G"),
    dv_col="D", dv_options=["转账", "现金支票", "转账支票", "网银", "汇款", "其他"],
)

# ============ Sheet 3：使用说明 ============
ws3 = wb.create_sheet("使用说明")
notes = [
    "日记账使用说明",
    "1. 「现金日记账」「银行存款日记账」各含：标题行、表头行、期初余额行（浅蓝底，请填贵司实际期初数）、5 行样例数据、本月合计行。",
    "2. 样例数据仅供参考，可直接修改或删除；删除后请在「结余」列向下拖拽公式，保持余额连续计算。",
    "3. 「结余」列为公式：上一行结余 + 收入（借方）- 支出（贷方），无需手工填写。",
    "4. 「本月合计」行自动汇总本月收入、支出合计，并计算期末结余（期初 + 收入合计 - 支出合计）。",
    "5. 结余为负数时自动标红，请核对是否存在漏记收入或重复记支出。",
    "6. 需要增加数据行时，请在「本月合计」行上方插入行，并将「结余」公式向下填充；插入行后合计公式范围请确认已包含新行。",
    "7. 银行存款日记账的「结算方式」列已设下拉选项：转账 / 现金支票 / 转账支票 / 网银 / 汇款 / 其他。",
    "8. 建议每月末核对：现金日记账期末结余应与实际库存现金一致；银行存款日记账期末结余应与银行对账单核对并编制余额调节表。",
]
for i, t in enumerate(notes, start=1):
    c = ws3.cell(row=i, column=1, value=t)
    if i == 1:
        c.font = Font(name="微软雅黑", size=14, bold=True, color=XL_TITLE_BG)
    else:
        c.font = F_BODY
        c.alignment = Alignment(vertical="center", wrapText=True)
    ws3.row_dimensions[i].height = 30 if i > 1 else 24
ws3.column_dimensions["A"].width = 100

wb.save("D:/日记账/日记账.xlsx")
print("OK: D:/日记账/日记账.xlsx")
