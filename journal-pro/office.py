# -*- coding: utf-8 -*-
"""Office 文件读写（纯 Python 标准库实现 OOXML，无第三方依赖）
支持：.xlsx 读写、.docx 生成/解析、.pptx 生成/解析
"""
import io
import re
import zipfile
import datetime
import xml.etree.ElementTree as ET

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG_REL = "http://schemas.openxmlformats.org/package/2006/relationships"
NS_W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"
NS_P = "http://schemas.openxmlformats.org/presentationml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def esc(s):
    return (str(s if s is not None else "").replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;").replace("'", "&apos;"))


def col_letter(n):
    s = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def _zip(files):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in files.items():
            z.writestr(name, data.encode("utf-8") if isinstance(data, str) else data)
    return buf.getvalue()


# ==================== XLSX 生成 ====================
STYLES_XML = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="{NS_MAIN}">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>
<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="gray125"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FF4472C4"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>
<border><left style="thin"><color rgb="FFD9D9D9"/></left><right style="thin"><color rgb="FFD9D9D9"/></right>
<top style="thin"><color rgb="FFD9D9D9"/></top><bottom style="thin"><color rgb="FFD9D9D9"/></bottom><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="3">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"><alignment horizontal="center"/></xf>
<xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>'''


def make_xlsx(sheets):
    """sheets: [{'name':..., 'headers':[...], 'rows':[[...]]}]"""
    files = {}
    n = len(sheets)
    overrides = "".join(
        f'<Override PartName="/xl/worksheets/sheet{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        for i in range(n))
    files["[Content_Types].xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
{overrides}</Types>'''
    files["_rels/.rels"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}">
<Relationship Id="rId1" Type="{NS_REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>'''
    sheet_tags = "".join(
        f'<sheet name="{esc(s["name"][:31])}" sheetId="{i+1}" r:id="rId{i+1}"/>'
        for i, s in enumerate(sheets))
    files["xl/workbook.xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="{NS_MAIN}" xmlns:r="{NS_R}"><sheets>{sheet_tags}</sheets></workbook>'''
    rel_tags = "".join(
        f'<Relationship Id="rId{i+1}" Type="{NS_REL}/worksheet" Target="worksheets/sheet{i+1}.xml"/>'
        for i in range(n))
    files["xl/_rels/workbook.xml.rels"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}">{rel_tags}
<Relationship Id="rId{n+1}" Type="{NS_REL}/styles" Target="styles.xml"/></Relationships>'''
    files["xl/styles.xml"] = STYLES_XML

    for i, s in enumerate(sheets):
        headers, rows = s.get("headers") or [], s.get("rows") or []
        widths = s.get("widths") or []
        cols = ""
        if widths:
            cols = "<cols>" + "".join(
                f'<col min="{j+1}" max="{j+1}" width="{w}" customWidth="1"/>'
                for j, w in enumerate(widths)) + "</cols>"

        def cell_xml(ref, v, style):
            if v is None or v == "":
                return f'<c r="{ref}" s="{style}"/>'
            if isinstance(v, bool):
                return f'<c r="{ref}" s="{style}" t="b"><v>{1 if v else 0}</v></c>'
            if isinstance(v, (int, float)) and not isinstance(v, bool):
                return f'<c r="{ref}" s="{style}"><v>{v}</v></c>'
            return f'<c r="{ref}" s="{style}" t="inlineStr"><is><t xml:space="preserve">{esc(v)}</t></is></c>'

        body = []
        if headers:
            hcells = "".join(cell_xml(f"{col_letter(j+1)}1", h, 1) for j, h in enumerate(headers))
            body.append(f'<row r="1" ht="22" customHeight="1">{hcells}</row>')
        for ri, row in enumerate(rows, 2):
            cells = "".join(cell_xml(f"{col_letter(j+1)}{ri}", v, 2 if isinstance(v, (int, float)) and not isinstance(v, bool) else 0)
                            for j, v in enumerate(row))
            body.append(f'<row r="{ri}">{cells}</row>')
        maxcol = max([len(headers)] + [len(r) for r in rows]) if (headers or rows) else 1
        dim = f"A1:{col_letter(max(1, maxcol))}{max(1, len(rows) + (1 if headers else 0))}"
        files[f"xl/worksheets/sheet{i+1}.xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="{NS_MAIN}"><dimension ref="{dim}"/>
<sheetViews><sheetView workbookViewId="0"><pane ySplit="{1 if headers else 0}" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
<sheetFormatPr defaultRowHeight="18"/>{cols}<sheetData>{''.join(body)}</sheetData>
<autoFilter ref="{dim}"/></worksheet>'''
    return _zip(files)


# ==================== XLSX 解析 ====================
def read_xlsx(data):
    """返回 [{'name':..., 'rows': [[值,...],...]}]，第一行通常作表头"""
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        names = z.namelist()
        # sharedStrings
        shared = []
        if "xl/sharedStrings.xml" in names:
            root = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in root.findall(f"{{{NS_MAIN}}}si"):
                shared.append("".join(t.text or "" for t in si.iter(f"{{{NS_MAIN}}}t")))
        # workbook 顺序
        order = []
        if "xl/workbook.xml" in names and "xl/_rels/workbook.xml.rels" in names:
            wb = ET.fromstring(z.read("xl/workbook.xml"))
            rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
            rmap = {r.get("Id"): r.get("Target") for r in rels}
            for sh in wb.iter(f"{{{NS_MAIN}}}sheet"):
                rid = sh.get(f"{{{NS_R}}}id")
                target = rmap.get(rid, "")
                path = target.lstrip("/")
                if not path.startswith("xl/"):
                    path = "xl/" + path
                if path not in names:
                    path = path.replace("xl/xl/", "xl/")
                order.append((sh.get("name"), path))
        if not order:
            order = [("Sheet" + str(i + 1), p) for i, p in enumerate(
                sorted(x for x in names if re.match(r"xl/worksheets/sheet\d+\.xml", x)))]
        out = []
        for name, path in order:
            if path not in names:
                continue
            root = ET.fromstring(z.read(path))
            rows = []
            for row in root.iter(f"{{{NS_MAIN}}}row"):
                cells = {}
                for c in row.findall(f"{{{NS_MAIN}}}c"):
                    ref = c.get("r") or ""
                    m = re.match(r"([A-Z]+)", ref)
                    ci = 0
                    if m:
                        for ch in m.group(1):
                            ci = ci * 26 + (ord(ch) - 64)
                        ci -= 1
                    t = c.get("t")
                    if t == "inlineStr":
                        val = "".join(x.text or "" for x in c.iter(f"{{{NS_MAIN}}}t"))
                    else:
                        v = c.find(f"{{{NS_MAIN}}}v")
                        val = v.text if v is not None else ""
                        if t == "s" and val not in (None, ""):
                            try:
                                val = shared[int(val)]
                            except (ValueError, IndexError):
                                pass
                        elif t == "b":
                            val = "是" if val == "1" else "否"
                        elif t in (None, "n") and val not in (None, ""):
                            try:
                                f = float(val)
                                val = int(f) if f.is_integer() else f
                            except ValueError:
                                pass
                    cells[ci] = val
                if cells:
                    rows.append([cells.get(i, "") for i in range(max(cells) + 1)])
                else:
                    rows.append([])
            out.append({"name": name, "rows": rows})
        return out


# ==================== DOCX 生成 ====================
def _docx_para(text, size=22, bold=False, align=None, color=None):
    b = "<w:b/>" if bold else ""
    c = f'<w:color w:val="{color}"/>' if color else ""
    al = f'<w:jc w:val="{align}"/>' if align else ""
    return (f'<w:p><w:pPr>{al}<w:spacing w:after="120"/></w:pPr>'
            f'<w:r><w:rPr>{b}<w:sz w:val="{size}"/>{c}</w:rPr>'
            f'<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p>')


def _docx_table(headers, rows):
    def tc(text, bold=False):
        b = "<w:b/>" if bold else ""
        shade = '<w:shd w:val="clear" w:fill="4472C4"/>' if bold else ""
        color = '<w:color w:val="FFFFFF"/>' if bold else ""
        return (f'<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/>{shade}</w:tcPr>'
                f'<w:p><w:r><w:rPr>{b}<w:sz w:val="18"/>{color}</w:rPr>'
                f'<w:t xml:space="preserve">{esc(text)}</w:t></w:r></w:p></w:tc>')
    grid = "".join('<w:gridCol w:w="2400"/>' for _ in (headers or [""]))
    head = f'<w:tr>{ "".join(tc(h, True) for h in headers) }</w:tr>' if headers else ""
    body = "".join("<w:tr>" + "".join(tc(v) for v in row) + "</w:tr>" for row in rows)
    return (f'<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/>'
            f'<w:tblBorders><w:top w:val="single" w:sz="4" w:color="BFBFBF"/>'
            f'<w:left w:val="single" w:sz="4" w:color="BFBFBF"/>'
            f'<w:bottom w:val="single" w:sz="4" w:color="BFBFBF"/>'
            f'<w:right w:val="single" w:sz="4" w:color="BFBFBF"/></w:tblBorders></w:tblPr>'
            f'<w:tblGrid>{grid}</w:tblGrid>{head}{body}</w:tbl>')


def make_docx(title, blocks):
    """blocks: [('h', text) | ('p', text) | ('table', headers, rows)]"""
    parts = [_docx_para(title, 36, True, "center", "2F5597")]
    for b in blocks:
        if b[0] == "h":
            parts.append(_docx_para(b[1], 26, True, color="2F5597"))
        elif b[0] == "p":
            parts.append(_docx_para(b[1], 22))
        elif b[0] == "table":
            parts.append(_docx_table(b[1], b[2]))
    parts.append(_docx_para(f"生成时间：{datetime.datetime.now().strftime('%Y-%m-%d %H:%M')} · 会计出纳系统", 18, False, "right", "808080"))
    doc = (f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
           f'<w:document xmlns:w="{NS_W}"><w:body>{"".join(parts)}'
           f'<w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/></w:sectPr></w:body></w:document>')
    files = {
        "[Content_Types].xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>''',
        "_rels/.rels": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}"><Relationship Id="rId1" Type="{NS_REL}/officeDocument" Target="word/document.xml"/></Relationships>''',
        "word/document.xml": doc,
        "word/_rels/document.xml.rels": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}"><Relationship Id="rId1" Type="{NS_REL}/styles" Target="styles.xml"/></Relationships>''',
        "word/styles.xml": f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="{NS_W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:eastAsia="Microsoft YaHei"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>''',
    }
    return _zip(files)


def read_docx_text(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    texts = ["".join(t.text or "" for t in p.iter(f"{{{NS_W}}}t"))
             for p in root.iter(f"{{{NS_W}}}p")]
    return [t for t in texts if t.strip()]


# ==================== PPTX 生成 ====================
def _sp(id_, name, x, y, cx, cy, text, size=1800, bold=False, color="1F2937"):
    b = ' b="1"' if bold else ""
    lines = str(text).split("\n")
    paras = "".join(
        f'<a:p><a:pPr><a:lnSpc><a:spcPts val="{size // 100 * 14}"/></a:lnSpc></a:pPr>'
        f'<a:r><a:rPr lang="zh-CN" sz="{size}"{b} dirty="0"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill></a:rPr>'
        f'<a:t>{esc(ln)}</a:t></a:r></a:p>' for ln in lines)
    return (f'<p:sp><p:nvSpPr><p:cNvPr id="{id_}" name="{esc(name)}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>'
            f'<p:txBody><a:bodyPr wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720"/>'
            f'<a:lstStyle/>{paras}</p:txBody></p:sp>')


def _ppt_table(id_, headers, rows, x=685800, y=1600200, cx=10668000):
    ncol = max(1, len(headers or (rows[0] if rows else [])))
    w = cx // ncol
    grid = "".join(f'<a:gridCol w="{w}"/>' for _ in range(ncol))

    def cell(v, bold):
        b = ' b="1"' if bold else ""
        color = "FFFFFF" if bold else "1F2937"
        fill = ('<a:solidFill><a:srgbClr val="4472C4"/></a:solidFill>' if bold
                else '<a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill>')
        return (f'<a:tc><a:txBody><a:bodyPr/><a:lstStyle/>'
                f'<a:p><a:r><a:rPr lang="zh-CN" sz="1200"{b} dirty="0"><a:solidFill><a:srgbClr val="{color}"/></a:solidFill></a:rPr>'
                f'<a:t>{esc(v)}</a:t></a:r></a:p></a:txBody>'
                f'<a:tcPr marL="68580" marR="68580"><a:lnL w="6350"><a:solidFill><a:srgbClr val="D9E2F3"/></a:solidFill></a:lnL>'
                f'<a:lnR w="6350"><a:solidFill><a:srgbClr val="D9E2F3"/></a:solidFill></a:lnR>'
                f'<a:lnT w="6350"><a:solidFill><a:srgbClr val="D9E2F3"/></a:solidFill></a:lnT>'
                f'<a:lnB w="6350"><a:solidFill><a:srgbClr val="D9E2F3"/></a:solidFill></a:lnB>{fill}</a:tcPr></a:tc>')
    trs = ""
    if headers:
        trs += f'<a:tr h="370000">{"".join(cell(h, True) for h in headers)}</a:tr>'
    for row in rows[:14]:
        trs += f'<a:tr h="320000">{"".join(cell(v, False) for v in row)}</a:tr>'
    return (f'<p:graphicFrame><p:nvGraphicFramePr><p:cNvPr id="{id_}" name="Table"/><p:cNvGraphicFramePr/><p:nvPr/></p:nvGraphicFramePr>'
            f'<p:xfrm><a:off x="{x}" y="{y}"/><a:ext cx="{cx}" cy="4800000"/></p:xfrm>'
            f'<a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/table">'
            f'<a:tbl><a:tblPr firstRow="1" bandRow="1"/><a:tblGrid>{grid}</a:tblGrid>{trs}</a:tbl>'
            f'</a:graphicData></a:graphic></p:graphicFrame>')


def make_pptx(title, slides):
    """slides: [{'title':..., 'bullets':[...] 或 'headers':[...] + 'rows':[[...]]}]"""
    files = {}
    n = len(slides)
    slide_overrides = "".join(
        f'<Override PartName="/ppt/slides/slide{i+1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>'
        for i in range(n))
    files["[Content_Types].xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
{slide_overrides}</Types>'''
    files["_rels/.rels"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}"><Relationship Id="rId1" Type="{NS_REL}/officeDocument" Target="ppt/presentation.xml"/></Relationships>'''
    sld_ids = "".join(f'<p:sldId id="{256+i}" r:id="rId{i+2}"/>' for i in range(n))
    files["ppt/presentation.xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}">
<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
<p:sldIdLst>{sld_ids}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>'''
    rels = f'<Relationship Id="rId1" Type="{NS_REL}/slideMaster" Target="slideMasters/slideMaster1.xml"/>' + "".join(
        f'<Relationship Id="rId{i+2}" Type="{NS_REL}/slide" Target="slides/slide{i+1}.xml"/>' for i in range(n))
    files["ppt/_rels/presentation.xml.rels"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}">{rels}</Relationships>'''
    empty_tree = '<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree>'
    files["ppt/slideMasters/slideMaster1.xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}"><p:cSld>{empty_tree}</p:cSld>
<p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" tx1="dk1" tx2="dk2" hlink="hlink" folHlink="folHlink"/>
<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst></p:sldMaster>'''
    files["ppt/slideMasters/_rels/slideMaster1.xml.rels"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}"><Relationship Id="rId1" Type="{NS_REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
<Relationship Id="rId2" Type="{NS_REL}/theme" Target="../theme/theme1.xml"/></Relationships>'''
    files["ppt/slideLayouts/slideLayout1.xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}" type="blank" preserve="1"><p:cSld name="Blank">{empty_tree}</p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>'''
    files["ppt/slideLayouts/_rels/slideLayout1.xml.rels"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}"><Relationship Id="rId1" Type="{NS_REL}/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>'''
    clr = "".join(f'<a:{k}><a:srgbClr val="{v}"/></a:{k}>' for k, v in [
        ("dk1", "1F2937"), ("lt1", "FFFFFF"), ("dk2", "44546A"), ("lt2", "E7E6E6"),
        ("accent1", "4472C4"), ("accent2", "ED7D31"), ("accent3", "A5A5A5"), ("accent4", "FFC000"),
        ("accent5", "5B9BD5"), ("accent6", "70AD47"), ("hlink", "0563C1"), ("folHlink", "954F72")])
    files["ppt/theme/theme1.xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="{NS_A}" name="Journal"><a:themeElements><a:clrScheme name="Journal">{clr}</a:clrScheme>
<a:fontScheme name="Journal"><a:majorFont><a:latin typeface="Calibri"/><a:ea typeface="Microsoft YaHei"/></a:majorFont>
<a:minorFont><a:latin typeface="Calibri"/><a:ea typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme>
<a:fmtScheme name="Journal"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>
<a:lnStyleLst><a:ln><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst>
<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>
<a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>'''

    for i, s in enumerate(slides):
        shapes = _sp(2, "Title", 685800, 365760, 10668000, 800000,
                     s.get("title", ""), 3200, True, "2F5597")
        if s.get("headers") is not None:
            shapes += _ppt_table(3, s.get("headers") or [], s.get("rows") or [])
        elif s.get("bullets"):
            shapes += _sp(3, "Body", 685800, 1600200, 10668000, 4400000,
                          "\n".join("• " + str(b) for b in s["bullets"]), 1800)
        files[f"ppt/slides/slide{i+1}.xml"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="{NS_A}" xmlns:r="{NS_R}" xmlns:p="{NS_P}"><p:cSld><p:spTree>
<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
{shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>'''
        files[f"ppt/slides/_rels/slide{i+1}.xml.rels"] = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="{NS_PKG_REL}"><Relationship Id="rId1" Type="{NS_REL}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>'''
    return _zip(files)


def read_pptx_text(data):
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        paths = sorted((p for p in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml", p)),
                       key=lambda p: int(re.search(r"(\d+)", p).group(1)))
        out = []
        for p in paths:
            root = ET.fromstring(z.read(p))
            out.append([t.text for t in root.iter(f"{{{NS_A}}}t") if t.text])
        return out


def extract_office_text(filename, data):
    """统一入口：返回 (类型, 文本行列表)"""
    low = filename.lower()
    if low.endswith(".docx"):
        return "Word 文档", read_docx_text(data)
    if low.endswith(".pptx"):
        slides = read_pptx_text(data)
        return "PPT 演示文稿", [f"第{i+1}页：" + " / ".join(s) for i, s in enumerate(slides)]
    if low.endswith(".xlsx"):
        sheets = read_xlsx(data)
        lines = []
        for sh in sheets:
            lines.append(f"工作表：{sh['name']}")
            for row in sh["rows"][:200]:
                lines.append(" | ".join(str(x) for x in row))
        return "Excel 工作簿", lines
    return "文本", data.decode("utf-8", "ignore").splitlines()
