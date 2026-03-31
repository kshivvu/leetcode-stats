import * as XLSX from 'xlsx'
import { StudentInfo } from '@/types/leetcode'

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

function rowsToStudents(
  rows: string[][],
  nameIdx: number, rollIdx: number, lcIdx: number,
  sectionIdx: number, branchIdx: number,
): { students: StudentInfo[]; errors: string[] } {
  const students: StudentInfo[] = []
  const errors: string[] = []

  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i]
    if (!cols) continue
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

export function parseCSV(content: string): { students: StudentInfo[]; errors: string[] } {
  const rawRows = content.split('\n').map(row => row.split(',').map(cell => cell.trim()))
  if (rawRows.length < 2) {
    return { students: [], errors: ['CSV must have a header row and at least one data row.'] }
  }

  const headers = rawRows[0]
  const { nameIdx, rollIdx, lcIdx, sectionIdx, branchIdx } = detectColumns(headers)

  const colErrors: string[] = []
  if (nameIdx === -1) colErrors.push('Could not find a "Name" column.')
  if (rollIdx === -1) colErrors.push('Could not find a "Roll No" column.')
  if (lcIdx   === -1) colErrors.push('Could not find a "LeetCode URL" column.')
  if (colErrors.length) return { students: [], errors: colErrors }

  return rowsToStudents(rawRows.slice(1), nameIdx, rollIdx, lcIdx, sectionIdx, branchIdx)
}

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

export function generateSampleCSV(): string {
  return SAMPLE_ROWS.map(r => r.join(',')).join('\n')
}
