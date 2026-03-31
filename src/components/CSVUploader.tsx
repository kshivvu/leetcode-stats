'use client'

import React, { useState, useRef } from 'react'
import { parseCSV, parseExcel, generateSampleCSV, generateSampleXLSX } from '@/lib/csvParser'
import { StudentInfo } from '@/types/leetcode'

interface CSVUploaderProps {
  onStudentsLoaded: (students: StudentInfo[]) => void
}

type FileType = 'excel' | 'csv' | null

function getFileType(name: string): FileType {
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) return 'excel'
  if (name.endsWith('.csv')) return 'csv'
  return null
}

export function CSVUploader({ onStudentsLoaded }: CSVUploaderProps) {
  const [isHovering, setIsHovering] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileType, setFileType] = useState<FileType>(null)
  const [successCount, setSuccessCount] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsHovering(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsHovering(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsHovering(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

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

  return (
    <div className="w-full mb-8">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer overflow-hidden ${
          isHovering ? 'bg-[var(--surface2)] border-[var(--accent)]' : 'bg-transparent border-[var(--border)]'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
            style={{ background: 'var(--surface2)' }}
          >
            {fileType === 'excel' ? '📊' : '📋'}
          </div>
          
          <div>
            <div className="font-bold tracking-wide text-sm" style={{ color: 'var(--text)' }}>
              {fileName ? fileName : 'Upload Batch File'}
            </div>
            {!fileName && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Drag & drop or click · .xlsx, .xls, or .csv · Columns: Name, Roll No, LeetCode URL
              </div>
            )}
            {successCount !== null && successCount > 0 && (
              <div className="text-xs mt-1 font-bold text-green-500">
                Loaded {successCount} students successfully!
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-shrink-0 mt-2">
            <button
              onClick={(e) => { e.stopPropagation(); downloadXLSXTemplate() }}
              className="mono text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 active:scale-95"
              style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              title="Download Excel template"
            >
              ↓ .xlsx
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); downloadCSVTemplate() }}
              className="mono text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5 active:scale-95"
              style={{ background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)' }}
              title="Download CSV template"
            >
              ↓ .csv
            </button>
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      <div className="mt-2 px-1 text-center">
        <div className="mono text-[10px]" style={{ color: 'var(--border)' }}>
          Accepted formats:{' '}
          <span style={{ color: 'var(--muted)' }}>
            .xlsx, .xls (Excel) · .csv · Columns: Name, Roll No, LeetCode URL, Section (opt), Branch (opt)
          </span>
        </div>
      </div>

      {parseErrors.length > 0 && (
        <div className="mt-3 p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs text-left max-h-32 overflow-y-auto">
          <div className="font-bold mb-1 mono">Parsing Errors:</div>
          <ul className="list-disc pl-4 opacity-80 space-y-0.5">
            {parseErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
