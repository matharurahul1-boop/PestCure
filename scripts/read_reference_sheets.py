import json, zipfile, xml.etree.ElementTree as ET
from pathlib import Path
NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
FILES = ['Alka Review Sheet August 2026 .xlsx', 'Deepika Review Sheet.xlsx', 'Kajal Review Sheet (2).xlsx']
output = []
for filename in FILES:
    with zipfile.ZipFile(Path('C:/Users/DELL/Downloads') / filename) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            strings = [''.join(n.itertext()) for n in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('m:si', NS)]
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        relationships = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = []
        for sheet in wb.findall('m:sheets/m:sheet', NS):
            target = relationships[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            root = ET.fromstring(z.read(path))
            rows = []
            for row in root.findall('m:sheetData/m:row', NS):
                cells = []
                for cell in row.findall('m:c', NS):
                    v = cell.find('m:v', NS)
                    value = v.text if v is not None else ''
                    if cell.attrib.get('t') == 's': value = strings[int(value)] if value else ''
                    elif cell.attrib.get('t') == 'inlineStr': value = ''.join(cell.find('m:is', NS).itertext())
                    f = cell.find('m:f', NS)
                    if value or f is not None: cells.append({'cell':cell.attrib['r'], 'value':value, 'formula': f.text if f is not None else None, 'style':cell.attrib.get('s')})
                if cells: rows.append({'row':int(row.attrib['r']), 'cells':cells})
            sheets.append({'name':sheet.attrib['name'], 'rows':rows, 'merges':[n.attrib['ref'] for n in root.findall('m:mergeCells/m:mergeCell', NS)]})
        output.append({'file':filename, 'sheets':sheets})
Path('reference-data').mkdir(exist_ok=True)
Path('reference-data/workbooks.json').write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
for book in output:
    print('\nFILE:', book['file'])
    for sheet in book['sheets']:
        print('SHEET:', sheet['name'], 'ROWS:', len(sheet['rows']))
        for row in sheet['rows']:
            print(' | '.join(c['cell'] + '=' + (('FORMULA ' + c['formula'] + ' => ') if c['formula'] else '') + str(c['value']) for c in row['cells']))
