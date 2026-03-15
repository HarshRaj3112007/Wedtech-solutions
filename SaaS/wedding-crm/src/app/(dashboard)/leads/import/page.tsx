'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import Papa from 'papaparse'

export default function ImportPage() {
  const [importType, setImportType] = useState<'leads' | 'vendors' | 'weddings'>('leads')
  const [parsedData, setParsedData] = useState<any[]>([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)

    if (file.name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setParsedData(results.data as any[])
        },
      })
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        const XLSX = await import('xlsx')
        const wb = XLSX.read(evt.target?.result, { type: 'binary' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws)
        setParsedData(data as any[])
      }
      reader.readAsBinaryString(file)
    }
  }

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: importType, data: parsedData }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ error: 'Import failed' })
    }
    setImporting(false)
  }

  const downloadTemplate = () => {
    let csv = ''
    if (importType === 'leads') {
      csv = 'Name,Email,Phone,Source,Status,Budget,Venue,Priority\nJohn Doe,john@example.com,9876543210,Instagram,NEW,2500000,Taj Palace,MEDIUM'
    } else if (importType === 'vendors') {
      csv = 'Name,Category,Email,Phone,City,Price Range,Rating\nRaj Photography,PHOTOGRAPHER,raj@photo.com,9876543210,Mumbai,PREMIUM,4.5'
    } else {
      csv = 'Client Name,Partner Name,Wedding Date,Venue,City,Budget,Guest Count\nPriya Sharma,Rahul Kumar,2026-12-15,The Grand Palace,Delhi,5000000,500'
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${importType}_template.csv`
    a.click()
  }

  return (
    <div>
      <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Leads
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import</h1>
        <p className="text-gray-500 mt-1">Import leads, vendors, or weddings from CSV/Excel files</p>
      </div>

      <div className="max-w-2xl">
        {/* Type selector */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Import Type</label>
          <div className="flex gap-3">
            {(['leads', 'vendors', 'weddings'] as const).map(type => (
              <button key={type} onClick={() => { setImportType(type); setParsedData([]); setResult(null) }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition ${importType === type ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Upload area */}
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-700">Upload File</h2>
            <button onClick={downloadTemplate} className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1">
              <Download className="w-3 h-3" /> Download Template
            </button>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 transition"
          >
            <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 font-medium">{fileName || 'Click to upload CSV or Excel file'}</p>
            <p className="text-xs text-gray-400 mt-1">Supports .csv, .xlsx, .xls</p>
          </div>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFile} className="hidden" />
        </div>

        {/* Preview */}
        {parsedData.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm mb-4">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Preview ({parsedData.length} rows)</h2>
            <div className="overflow-x-auto max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>{Object.keys(parsedData[0]).map(key => <th key={key} className="px-3 py-2 text-left font-medium text-gray-500">{key}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {parsedData.slice(0, 10).map((row, i) => (
                    <tr key={i}>{Object.values(row).map((val: any, j) => <td key={j} className="px-3 py-2 text-gray-600">{String(val)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 10 && <p className="text-xs text-gray-400 text-center py-2">...and {parsedData.length - 10} more rows</p>}
            </div>
            <button onClick={handleImport} disabled={importing}
              className="mt-4 w-full py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Upload className="w-4 h-4" />
              {importing ? 'Importing...' : `Import ${parsedData.length} ${importType}`}
            </button>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className={`rounded-xl p-4 flex items-center gap-3 ${result.error ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
            {result.error ? <AlertCircle className="w-5 h-5 text-red-500" /> : <CheckCircle className="w-5 h-5 text-green-500" />}
            <div>
              <p className={`text-sm font-medium ${result.error ? 'text-red-700' : 'text-green-700'}`}>
                {result.error ? `Error: ${result.error}` : `Successfully imported ${result.imported} ${importType}!`}
              </p>
              {result.imported > 0 && result.error && <p className="text-xs text-gray-500">{result.imported} records imported before error</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
