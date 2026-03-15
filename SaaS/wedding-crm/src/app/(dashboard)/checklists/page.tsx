'use client'

import { useState, useEffect } from 'react'
import { Plus, ClipboardCheck, ChevronDown, ChevronRight, CheckCircle2, Circle, X, FileText, Trash2 } from 'lucide-react'

export default function ChecklistsPage() {
  const [data, setData] = useState<any>({ templates: [], checklists: [] })
  const [activeTab, setActiveTab] = useState<'templates' | 'active'>('templates')
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [weddings, setWeddings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = () => {
    setLoading(true)
    fetch('/api/checklists').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }

  useEffect(() => { fetchData() }, [])

  const toggleItem = async (checklistId: string, itemId: string) => {
    await fetch(`/api/checklists/${checklistId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toggleItem: itemId }),
    })
    fetchData()
  }

  const applyTemplate = async (templateId: string, weddingId: string) => {
    await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'apply', templateId, weddingId }),
    })
    setShowApplyModal(false)
    fetchData()
  }

  const openApplyModal = () => {
    fetch('/api/weddings').then(r => r.json()).then(setWeddings)
    setShowApplyModal(true)
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SOP & Checklists</h1>
          <p className="text-gray-500 mt-1">Standardised checklists that auto-populate per wedding</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openApplyModal} className="px-4 py-2.5 border border-gray-200 text-sm font-medium text-gray-700 rounded-xl hover:bg-gray-50 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Apply to Wedding
          </button>
          <button onClick={() => setShowCreateTemplate(true)} className="px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200 mb-6">
        <button onClick={() => setActiveTab('templates')} className={`px-5 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'templates' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
          SOP Templates ({data.templates?.length || 0})
        </button>
        <button onClick={() => setActiveTab('active')} className={`px-5 py-3 text-sm font-medium border-b-2 transition ${activeTab === 'active' ? 'text-purple-600 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-700'}`}>
          Active Checklists ({data.checklists?.length || 0})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : activeTab === 'templates' ? (
        <div className="grid gap-4">
          {(data.templates || []).map((t: any) => (
            <TemplateCard key={t.id} template={t} />
          ))}
          {(data.templates || []).length === 0 && (
            <div className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No SOP templates yet. Create your first template!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {(data.checklists || []).map((cl: any) => {
            const completed = cl.items?.filter((i: any) => i.isCompleted).length || 0
            const total = cl.items?.length || 0
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0
            return (
              <div key={cl.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cl.name}</h3>
                    <p className="text-xs text-gray-500">Wedding: {cl.wedding?.clientName || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-purple-600">{pct}%</span>
                    <p className="text-xs text-gray-400">{completed}/{total} done</p>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                  <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-2">
                  {(cl.items || []).map((item: any) => (
                    <button key={item.id} onClick={() => toggleItem(cl.id, item.id)} className="flex items-center gap-3 w-full text-left hover:bg-gray-50 p-1 rounded">
                      {item.isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" /> : <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />}
                      <span className={`text-sm ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.title}</span>
                      {item.isMandatory && <span className="text-xs text-red-500 ml-auto">Required</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {(data.checklists || []).length === 0 && <p className="text-center text-gray-400 py-16">No active checklists. Apply an SOP template to a wedding to get started.</p>}
        </div>
      )}

      {showCreateTemplate && <CreateTemplateModal onClose={() => setShowCreateTemplate(false)} onSuccess={() => { setShowCreateTemplate(false); fetchData() }} />}
      {showApplyModal && <ApplyTemplateModal templates={data.templates} weddings={weddings} onClose={() => setShowApplyModal(false)} onApply={applyTemplate} />}
    </div>
  )
}

function TemplateCard({ template }: { template: any }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div>
          <h3 className="font-semibold text-gray-900">{template.name}</h3>
          <p className="text-sm text-gray-500">{template.description || 'No description'}</p>
          <div className="flex gap-3 mt-1 text-xs text-gray-400">
            {template.category && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{template.category.replace('_', ' ')}</span>}
            <span>{template.items?.length || 0} items</span>
            <span>Used {template._count?.checklists || 0} times</span>
          </div>
        </div>
        {expanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
      </div>
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {(template.items || []).map((item: any, i: number) => (
            <div key={item.id} className="flex items-center gap-3 text-sm">
              <span className="w-6 h-6 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium">{i + 1}</span>
              <span className="text-gray-700">{item.title}</span>
              {item.isMandatory && <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
              {item.daysOffset && <span className="text-xs text-gray-400 ml-auto">{item.daysOffset > 0 ? `+${item.daysOffset}` : item.daysOffset} days</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateTemplateModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [items, setItems] = useState([{ title: '', description: '', daysOffset: '', isMandatory: false }])
  const [saving, setSaving] = useState(false)

  const addItem = () => setItems([...items, { title: '', description: '', daysOffset: '', isMandatory: false }])
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i))
  const updateItem = (i: number, field: string, value: any) => {
    const updated = [...items]
    ;(updated[i] as any)[field] = value
    setItems(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/checklists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'template', name, description, category, items: items.filter(i => i.title) }),
    })
    onSuccess()
  }

  const categories = ['PRE_WEDDING', 'WEDDING_DAY', 'POST_WEDDING', 'VENDOR_MGMT', 'LOGISTICS', 'DECOR', 'CATERING']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Create SOP Template</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"><option value="">Select</option>{categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Description</label><input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">Checklist Items</label>
              <button type="button" onClick={addItem} className="text-sm text-purple-600 hover:text-purple-700 font-medium">+ Add Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mt-1">{i + 1}</span>
                  <div className="flex-1 space-y-2">
                    <input placeholder="Task title" value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    <div className="flex gap-2">
                      <input placeholder="Days offset (e.g. -30)" value={item.daysOffset} onChange={e => updateItem(i, 'daysOffset', e.target.value)} className="w-32 px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      <label className="flex items-center gap-1.5 text-xs text-gray-600"><input type="checkbox" checked={item.isMandatory} onChange={e => updateItem(i, 'isMandatory', e.target.checked)} className="rounded" /> Required</label>
                    </div>
                  </div>
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-gray-400 hover:text-red-500 mt-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create Template'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApplyTemplateModal({ templates, weddings, onClose, onApply }: { templates: any[]; weddings: any[]; onClose: () => void; onApply: (templateId: string, weddingId: string) => void }) {
  const [templateId, setTemplateId] = useState('')
  const [weddingId, setWeddingId] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Apply Template to Wedding</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SOP Template</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select template</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.items?.length} items)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Wedding</label>
            <select value={weddingId} onChange={e => setWeddingId(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="">Select wedding</option>
              {weddings.map((w: any) => <option key={w.id} value={w.id}>{w.clientName} - {new Date(w.weddingDate).toLocaleDateString('en-IN')}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
            <button onClick={() => templateId && weddingId && onApply(templateId, weddingId)} disabled={!templateId || !weddingId} className="px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 disabled:opacity-50">Apply</button>
          </div>
        </div>
      </div>
    </div>
  )
}
