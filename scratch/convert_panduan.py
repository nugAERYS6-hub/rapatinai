import re
import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import qn, nsdecls

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=120, bottom=120, left=180, right=180):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def set_callout_box(cell, border_color="0284C7", fill_color="F0F9FF"):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_color}"/>')
    tcPr.append(shd)
    borders = parse_xml(f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="none"/>
            <w:left w:val="single" w:sz="24" w:space="0" w:color="{border_color}"/>
            <w:bottom w:val="none"/>
            <w:right w:val="none"/>
        </w:tcBorders>
    ''')
    tcPr.append(borders)
    set_cell_margins(cell, top=140, bottom=140, left=240, right=200)

def main():
    md_path = r"d:\rapatinAI\PANDUAN_PENGGUNAAN_NIPW.md"
    docx_path = r"d:\rapatinAI\PANDUAN_PENGGUNAAN_NIPW.docx"

    with open(md_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    doc = Document()

    # Page Margins (1 inch)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1)
        section.bottom_margin = Inches(1)
        section.left_margin = Inches(1)
        section.right_margin = Inches(1)

    # Styles
    normal_style = doc.styles['Normal']
    normal_style.font.name = 'Calibri'
    normal_style.font.size = Pt(11)
    normal_style.font.color.rgb = RGBColor(0x1F, 0x29, 0x37)

    # State tracking
    in_table = False
    table_lines = []

    def flush_table():
        nonlocal in_table, table_lines
        if not table_lines:
            return
        
        parsed_rows = []
        for tl in table_lines:
            if re.match(r'^\s*\|[\s\-:]+\|\s*$', tl):
                continue
            cells = [c.strip() for c in tl.strip().split('|')[1:-1]]
            if cells:
                parsed_rows.append(cells)
        
        if parsed_rows:
            col_count = max(len(r) for r in parsed_rows)
            table = doc.add_table(rows=len(parsed_rows), cols=col_count)
            table.alignment = WD_TABLE_ALIGNMENT.CENTER
            table.autofit = False

            # Style table with thin gray borders
            tblPr = table._tbl.tblPr
            tblBorders = parse_xml(f'''
                <w:tblBorders {nsdecls("w")}>
                    <w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
                    <w:left w:val="none"/>
                    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
                    <w:right w:val="none"/>
                    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
                    <w:insideV w:val="none"/>
                </w:tblBorders>
            ''')
            tblPr.append(tblBorders)

            for row_idx, r_data in enumerate(parsed_rows):
                row = table.rows[row_idx]
                is_header = (row_idx == 0)
                for col_idx in range(col_count):
                    cell = row.cells[col_idx]
                    val = r_data[col_idx] if col_idx < len(r_data) else ""
                    
                    if is_header:
                        set_cell_background(cell, "F3F4F6")
                    set_cell_margins(cell, top=100, bottom=100, left=140, right=140)

                    p = cell.paragraphs[0]
                    p.paragraph_format.space_after = Pt(2)
                    p.paragraph_format.space_before = Pt(2)
                    
                    # Bold header or parse bold text
                    clean_val = val.replace("**", "")
                    run = p.add_run(clean_val)
                    if is_header or ("**" in val):
                        run.font.bold = True
                    if is_header:
                        run.font.color.rgb = RGBColor(0x11, 0x18, 0x27)
                    run.font.name = 'Calibri'
                    run.font.size = Pt(10)
            
            p_spacer = doc.add_paragraph()
            p_spacer.paragraph_format.space_after = Pt(6)

        table_lines = []
        in_table = False

    def add_formatted_runs(paragraph, text, base_italic=False, base_color=None):
        # Splits by **bold** and *italic*
        tokens = re.split(r'(\*\*.*?\*\*|\*.*?\*)', text)
        for token in tokens:
            if not token:
                continue
            if token.startswith('**') and token.endswith('**'):
                run = paragraph.add_run(token[2:-2])
                run.font.bold = True
                run.font.italic = base_italic
            elif token.startswith('*') and token.endswith('*'):
                run = paragraph.add_run(token[1:-1])
                run.font.italic = True
            else:
                run = paragraph.add_run(token)
                run.font.italic = base_italic

            run.font.name = 'Calibri'
            if base_color:
                run.font.color.rgb = base_color

    callout_buffer = []

    def flush_callout():
        nonlocal callout_buffer
        if not callout_buffer:
            return
        
        full_text = "\n".join(callout_buffer)
        callout_buffer = []

        is_screenshot = "[TEMPATKAN SCREENSHOT" in full_text or "📸" in full_text
        bg_color = "EFF6FF" if is_screenshot else "F8FAFC"
        border_color = "0284C7" if is_screenshot else "64748B"

        table = doc.add_table(rows=1, cols=1)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = table.cell(0, 0)
        set_callout_box(cell, border_color=border_color, fill_color=bg_color)

        lines_in_callout = full_text.split("\n")
        p = cell.paragraphs[0]
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(3)

        for i, cl in enumerate(lines_in_callout):
            if i > 0:
                p = cell.add_paragraph()
                p.paragraph_format.space_before = Pt(2)
                p.paragraph_format.space_after = Pt(3)

            # Strip leading > if any
            clean_cl = re.sub(r'^[>\s]+', '', cl).strip()
            
            if "📸" in clean_cl or "[TEMPATKAN SCREENSHOT" in clean_cl or "💡" in clean_cl or "###" in clean_cl:
                clean_cl = clean_cl.replace("### ", "")
                add_formatted_runs(p, clean_cl, base_color=RGBColor(0x03, 0x69, 0xA1))
                for run in p.runs:
                    run.font.bold = True
                    run.font.size = Pt(10.5)
            elif clean_cl.startswith("*Petunjuk Tangkapan Layar:"):
                add_formatted_runs(p, clean_cl, base_italic=True, base_color=RGBColor(0x47, 0x55, 0x69))
                for run in p.runs:
                    run.font.size = Pt(9.5)
            else:
                add_formatted_runs(p, clean_cl, base_color=RGBColor(0x33, 0x41, 0x55))
                for run in p.runs:
                    run.font.size = Pt(10)

        p_after = doc.add_paragraph()
        p_after.paragraph_format.space_before = Pt(2)
        p_after.paragraph_format.space_after = Pt(4)

    i = 0
    while i < len(lines):
        line = lines[i]
        trimmed = line.strip()

        # Handle table
        if trimmed.startswith('|'):
            if callout_buffer:
                flush_callout()
            in_table = True
            table_lines.append(trimmed)
            i += 1
            continue
        else:
            if in_table:
                flush_table()

        # Handle callout (> blockquote)
        if trimmed.startswith('>'):
            callout_buffer.append(trimmed)
            i += 1
            continue
        else:
            if callout_buffer:
                flush_callout()

        # Blank or separator
        if not trimmed or trimmed == '---':
            i += 1
            continue

        # Heading 1
        if trimmed.startswith('# '):
            text = trimmed[2:].strip()
            h = doc.add_heading(level=1)
            h.paragraph_format.space_before = Pt(18)
            h.paragraph_format.space_after = Pt(6)
            run = h.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(17)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x0F, 0x29, 0x4A)
            i += 1
            continue

        # Heading 2
        if trimmed.startswith('## '):
            text = trimmed[3:].strip()
            h = doc.add_heading(level=2)
            h.paragraph_format.space_before = Pt(14)
            h.paragraph_format.space_after = Pt(4)
            run = h.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(13.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)
            i += 1
            continue

        # Heading 3
        if trimmed.startswith('### '):
            text = trimmed[4:].strip()
            h = doc.add_heading(level=3)
            h.paragraph_format.space_before = Pt(10)
            h.paragraph_format.space_after = Pt(3)
            run = h.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(11.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x03, 0x69, 0xA1)
            i += 1
            continue

        # Heading 4
        if trimmed.startswith('#### '):
            text = trimmed[5:].strip()
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(8)
            p.paragraph_format.space_after = Pt(2)
            run = p.add_run(text)
            run.font.name = 'Calibri'
            run.font.size = Pt(11)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x37, 0x41, 0x51)
            i += 1
            continue

        # Bullet list
        if trimmed.startswith('* ') or trimmed.startswith('- '):
            text = trimmed[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            add_formatted_runs(p, text)
            i += 1
            continue

        # Numbered list
        num_match = re.match(r'^(\d+)\.\s+(.*)$', trimmed)
        if num_match:
            text = num_match.group(2).strip()
            p = doc.add_paragraph(style='List Number')
            p.paragraph_format.space_before = Pt(1)
            p.paragraph_format.space_after = Pt(2)
            add_formatted_runs(p, text)
            i += 1
            continue

        # Regular paragraph
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(2)
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.line_spacing = 1.15
        add_formatted_runs(p, trimmed)
        i += 1

    if in_table:
        flush_table()
    if callout_buffer:
        flush_callout()

    doc.save(docx_path)
    print(f"SUKSES: File Word berhasil dibuat ulang di {docx_path}")

if __name__ == '__main__':
    main()
