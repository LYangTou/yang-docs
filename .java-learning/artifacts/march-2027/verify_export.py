from pathlib import Path
import zipfile
import xml.etree.ElementTree as ET

folder = Path('D:/myspace/yang-docs/outputs/01a1a044-945b-7450-a2da-5a89f892abfb')
files = list(folder.glob('*.xlsx'))
assert len(files) == 1
ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(files[0]) as archive:
    assert archive.testzip() is None
    book = ET.fromstring(archive.read('xl/workbook.xml'))
    assert len(book.findall('x:sheets/x:sheet', ns)) == 3
    for idx in range(1, 4):
        root = ET.fromstring(archive.read(f'xl/worksheets/sheet{idx}.xml'))
        errors = [cell for cell in root.findall('.//x:c', ns) if cell.get('t') == 'e']
        assert not errors
        assert root.findall('x:sheetViews/x:sheetView/x:pane', ns)
        if idx > 1:
            assert root.findall('x:dataValidations/x:dataValidation', ns)
        print(f'Sheet {idx}: panes and formulas verified')
print(f'Export verified: {files[0].stat().st_size} bytes')
