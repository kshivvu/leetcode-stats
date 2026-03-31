# TODO2.md — Excel Import Feature

Read `CLAUDE.md` first to understand the full project structure before making any changes.

---

## Feature: Import Students from Excel File (.xlsx / .xls)

The app already supports CSV upload via `src/components/CSVUploader.tsx` and `src/lib/csvParser.ts`.
Your job is to upgrade it to also accept `.xlsx` and `.xls` Excel files — which is what the dean actually uses.

---

## Step 1 — Install SheetJS

```bash
npm install xlsx
```

---

## Step 2 — Update `src/lib/csvParser.ts`

Add the following to the **top** of the file:

```ts
import * as XLSX from 'xlsx'
```

### Add a shared header detector function (before `parseCSV`):

```ts
function detectColumns(headers: string[]) {
  const h = headers.map(v => String(v).toLowerCase().replace(/[^a-z0-9]/g, ''))
  return {
    nameIdx:    h.findIndex(v => v.includes('name')     || v.includes('student')),
    rollIdx:    h.findIndex(v => v.includes('roll')     || v.includes('enroll') || v.includes('reg') || v === 'id'),
    lcIdx:      h.findIndex(v => v.includes('leetcode') || v.includes('lc')     || v.includes('url') || v.includes('profile') || v.includes('link')),
    sectionIdx: h.findIndex(v => v.includes('section')  || v.includes('sec')    || v.includes('div')),
    branchIdx:  h.findIndex(v => v.includes('branch')   || v.includes('dept')   || v.includes('stream')),
  }
}
```

### Add a shared row-to-students converter (before `parseCSV`):

```ts
function rowsToStudents(
  rows: string[][],
  nameIdx: number, rollIdx: number, lcIdx: number,
  sectionIdx: number, branchIdx: number,
): { students: StudentInfo[]; errors: string[] } {
  const students: StudentInfo[] = []
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i]
    const name        = cols[nameIdx]?.trim()
    const rollNo      = cols[rollIdx]?.trim()
    const leetcodeUrl = cols[lcIdx]?.trim()

    if (!name && !rollNo && !leetcodeUrl) continue // skip blank rows silently
    if (!name || !rollNo || !leetcodeUrl) {
      errors.push(`Row ${i + 2}: Missing required fields (name, roll no, or LeetCode URL). Skipped.`)
      continue
    }

    students.push({
      name,
      rollNo,
      leetcodeUrl,
      section: sectionIdx !== -1 ? cols[sectionIdx]?.trim() || undefined : undefined,
      branch:  branchIdx  !== -1 ? cols[branchIdx]?.trim()  || undefined : undefined,
    })
  }

  return { students, errors }
}
```

### Add the Excel parser function (after `parseCSV`):

```ts
export function parseExcel(buffer: ArrayBuffer): { students: StudentInfo[]; errors: string[] } {
  try {
    const workbook  = XLSX.read(buffer, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const sheet     = workbook.Sheets[sheetName]

    const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })

    if (raw.length < 2) {
      return { students: [], errors: ['Excel sheet must have a header row and at least one data row.'] }
    }

    const headers = (raw[0] as unknown[]).map(v => String(v ?? ''))
    const { nameIdx, rollIdx, lcIdx, sectionIdx, branchIdx } = detectColumns(headers)

    const colErrors: string[] = []
    if (nameIdx === -1) colErrors.push('Could not find a "Name" column.')
    if (rollIdx === -1) colErrors.push('Could not find a "Roll No" column.')
    if (lcIdx   === -1) colErrors.push('Could not find a "LeetCode URL" column.')
    if (colErrors.length) return { students: [], errors: colErrors }

    const rows = raw.slice(1).map(row => (row as unknown[]).map(cell => String(cell ?? '')))
    return rowsToStudents(rows, nameIdx, rollIdx, lcIdx, sectionIdx, branchIdx)
  } catch {
    return { students: [], errors: ['Failed to parse Excel file. Make sure it is a valid .xlsx or .xls file.'] }
  }
}
```

### Add an Excel template generator (after `generateSampleCSV`):

```ts
const SAMPLE_ROWS = [
  ['Name',         'Roll No',  'LeetCode URL',                          'Section', 'Branch'],
  ['Rahul Sharma', '21CS001',  'https://leetcode.com/u/rahul_sharma/',  'A',       'CSE'],
  ['Priya Singh',  '21CS002',  'https://leetcode.com/u/priya_codes/',   'A',       'CSE'],
  ['Amit Verma',   '21IT003',  'lee215',                                'B',       'IT'],
  ['Sneha Gupta',  '21EC004',  'https://leetcode.com/u/sneha_g/',       'A',       'ECE'],
  ['Rohan Mehta',  '21CS005',  'https://leetcode.com/u/rohan_m/',       'B',       'CSE'],
]

export function generateSampleXLSX(): Blob {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(SAMPLE_ROWS)
  ws['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 45 }, { wch: 10 }, { wch: 10 }]
  XLSX.utils.book_append_sheet(wb, ws, 'Students')
  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}
```

Also update `generateSampleCSV` to use `SAMPLE_ROWS`:

```ts
export function generateSampleCSV(): string {
  return SAMPLE_ROWS.map(r => r.join(',')).join('\n')
}
```

---

## Step 3 — Update `src/components/CSVUploader.tsx`

### Update the import line at the top:

```ts
import { parseCSV, parseExcel, generateSampleCSV, generateSampleXLSX } from '@/lib/csvParser'
```

### Add a file type helper above the component:

```ts
type FileType = 'excel' | 'csv' | null

function getFileType(name: string): FileType {
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel'
  if (name.endsWith('.csv')) return 'csv'
  return null
}
```

### Add `fileType` state inside the component:

```ts
const [fileType, setFileType] = useState<FileType>(null)
```

### Replace the entire `handleFile` function with:

```ts
const handleFile = (file: File) => {
  const type = getFileType(file.name)
  if (!type) {
    setParseErrors(['Unsupported file. Please upload a .xlsx, .xls, or .csv file.'])
    return
  }

  setFileName(file.name)
  setFileType(type)
  setParseErrors([])
  setSuccessCount(null)

  const reader = new FileReader()

  if (type === 'excel') {
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const { students, errors } = parseExcel(buffer)
      setParseErrors(errors)
      setSuccessCount(students.length)
      if (students.length > 0) onStudentsLoaded(students)
    }
    reader.readAsArrayBuffer(file)
  } else {
    reader.onload = (e) => {
      const content = e.target?.result as string
      const { students, errors } = parseCSV(content)
      setParseErrors(errors)
      setSuccessCount(students.length)
      if (students.length > 0) onStudentsLoaded(students)
    }
    reader.readAsText(file)
  }
}
```

### Replace the `downloadTemplate` function with two functions:

```ts
const downloadXLSXTemplate = () => {
  const blob = generateSampleXLSX()
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'students_template.xlsx'
  a.click()
  URL.revokeObjectURL(url)
}

const downloadCSVTemplate = () => {
  const blob = new Blob([generateSampleCSV()], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = 'students_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}
```

### Update the `<input>` accept attribute:

```tsx
<input
  ref={inputRef}
  type="file"
  accept=".xlsx,.xls,.csv"
  className="hidden"
  onChange={handleChange}
/>
```

### Update the drop zone icon to show Excel icon when file is Excel:

```tsx
<div
  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
  style={{ background: 'var(--surface2)' }}
>
  {fileType === 'excel' ? '📊' : '📋'}
</div>
```

### Update the subtitle text to mention both formats:

```tsx
<div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
  Drag & drop or click · .xlsx, .xls, or .csv · Columns: Name, Roll No, LeetCode URL
</div>
```

### Replace the single template button with two buttons side by side:

```tsx
<div className="flex gap-2 flex-shrink-0">
  <button
    onClick={(e) => { e.stopPropagation(); downloadXLSXTemplate() }}
    className="mono text-xs px-3 py-1.5 rounded-lg transition-colors"
    style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
    title="Download Excel template"
  >
    ↓ .xlsx
  </button>
  <button
    onClick={(e) => { e.stopPropagation(); downloadCSVTemplate() }}
    className="mono text-xs px-3 py-1.5 rounded-lg transition-colors"
    style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
    title="Download CSV template"
  >
    ↓ .csv
  </button>
</div>
```

### Update the format hint at the bottom:

```tsx
<div className="mt-2 px-1">
  <div className="mono text-xs" style={{ color: 'var(--border)' }}>
    Accepted formats:{' '}
    <span style={{ color: 'var(--muted)' }}>
      .xlsx, .xls (Excel) · .csv · Columns: Name, Roll No, LeetCode URL, Section (optional), Branch (optional)
    </span>
  </div>
</div>
```

---

## Expected Result

After these changes:

- The uploader accepts `.xlsx`, `.xls`, and `.csv` files
- Dragging an Excel file onto the drop zone works
- The icon shows 📊 for Excel files and 📋 for CSV
- Two template download buttons: **↓ .xlsx** and **↓ .csv**
- The `.xlsx` template downloads a properly formatted Excel file with correct column widths
- Error messages are clear if columns are missing or rows are incomplete
- All existing CSV functionality continues to work unchanged

---

## Do Not Change

- `src/types/leetcode.ts` — no changes needed
- `src/app/api/leetcode/route.ts` — no changes needed
- `src/components/ProfileCard.tsx` — no changes needed
- `src/app/page.tsx` — no changes needed
- Any other existing files not mentioned above
