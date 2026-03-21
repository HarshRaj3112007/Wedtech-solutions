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
          <h1 className="text-2xl font-bold font-display text-[#5c1a2a]">SOP & Checklists</h1>
          <p className="text-[#8b6969] mt-1">Standardised checklists that auto-populate per wedding</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openApplyModal} className="px-4 py-2.5 border border-[#f0e4d8] text-sm font-medium text-[#5c1a2a]/90 rounded-xl hover:bg-[#f5e6d0]/30 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Apply to Wedding
          </button>
          <button onClick={() => setShowCreateTemplate(true)} className="px-4 py-2.5 bg-[#8b1a34] text-white text-sm font-medium rounded-xl hover:bg-[#6d1529] flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[#f0e4d8] mb-6">
        <button onClick={() => setActiveTab('templates')} className={`px-5 py-3 text-sm font-medium border-b-2 transition rounded-t-lg ${activeTab === 'templates' ? 'bg-[#8b1a34] text-[#f5e6d0] border-[#8b1a34]' : 'text-[#5c1a2a] border-transparent hover:bg-[#f5e6d0]/50'}`}>
          SOP Templates ({data.templates?.length || 0})
        </button>
        <button onClick={() => setActiveTab('active')} className={`px-5 py-3 text-sm font-medium border-b-2 transition rounded-t-lg ${activeTab === 'active' ? 'bg-[#8b1a34] text-[#f5e6d0] border-[#8b1a34]' : 'text-[#5c1a2a] border-transparent hover:bg-[#f5e6d0]/50'}`}>
          Active Checklists ({data.checklists?.length || 0})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-[#8b1a34]/20 border-t-[#8b1a34] rounded-full animate-spin" /></div>
      ) : activeTab === 'templates' ? (
        <div className="grid gap-4">
          {(data.templates || []).map((t: any) => (
            <TemplateCard key={t.id} template={t} />
          ))}
          {(data.templates || []).length === 0 && (
            <div className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 text-[#8b6969]/60 mx-auto mb-3" />
              <p className="text-[#8b6969]">No SOP templates yet. Create your first template!</p>
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
              <div key={cl.id} className="glass-card rounded-xl p-5 border border-[#f0e4d8] shadow-wedding">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[#5c1a2a]">{cl.name}</h3>
                    <p className="text-xs text-[#8b6969]">Wedding: {cl.wedding?.clientName || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#8b1a34]">{pct}%</span>
                    <p className="text-xs text-[#8b6969]/60">{completed}/{total} done</p>
                  </div>
                </div>
                <div className="w-full bg-[#f5e6d0] rounded-full h-2 mb-4">
                  <div className="bg-[#8b1a34] h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-2">
                  {(cl.items || []).map((item: any) => (
                    <button key={item.id} onClick={() => toggleItem(cl.id, item.id)} className="flex items-center gap-3 w-full text-left hover:bg-[#f5e6d0]/30 p-1 rounded">
                      {item.isCompleted ? <CheckCircle2 className="w-5 h-5 text-[#d4a017] flex-shrink-0" /> : <Circle className="w-5 h-5 text-[#8b6969]/60 flex-shrink-0" />}
                      <span className={`text-sm ${item.isCompleted ? 'text-[#8b6969]/60 line-through' : 'text-[#5c1a2a]/90'}`}>{item.title}</span>
                      {item.isMandatory && <span className="text-xs text-red-500 ml-auto">Required</span>}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
          {(data.checklists || []).length === 0 && <p className="text-center text-[#8b6969]/60 py-16">No active checklists. Apply an SOP template to a wedding to get started.</p>}
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
    <div className="card-3d">
      <div className="card-3d-inner glass-card rounded-xl p-5 border border-[#f0e4d8] shadow-wedding">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div>
            <h3 className="font-semibold text-[#5c1a2a]">{template.name}</h3>
            <p className="text-sm text-[#8b6969]">{template.description || 'No description'}</p>
            <div className="flex gap-3 mt-1 text-xs text-[#8b6969]/60">
              {template.category && <span className="bg-[#8b1a34]/10 text-[#8b1a34] px-2 py-0.5 rounded-full">{template.category.replace('_', ' ')}</span>}
              <span>{template.items?.length || 0} items</span>
              <span>Used {template._count?.checklists || 0} times</span>
            </div>
          </div>
          {expanded ? <ChevronDown className="w-5 h-5 text-[#8b6969]/60" /> : <ChevronRight className="w-5 h-5 text-[#8b6969]/60" />}
        </div>
        {expanded && (
          <div className="mt-4 pt-4 border-t border-[#f0e4d8] space-y-2">
            {(template.items || []).map((item: any, i: number) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 bg-[#8b1a34]/10 text-[#8b1a34] rounded-full flex items-center justify-center text-xs font-medium">{i + 1}</span>
                <span className="text-[#5c1a2a]/90">{item.title}</span>
                {item.isMandatory && <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded">Required</span>}
                {item.daysOffset && <span className="text-xs text-[#8b6969]/60 ml-auto">{item.daysOffset > 0 ? `+${item.daysOffset}` : item.daysOffset} days</span>}
              </div>
            ))}
          </div>
        )}
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d0811]/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-[#f0e4d8]">
          <h2 className="text-lg font-semibold text-[#5c1a2a]">Create SOP Template</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#8b6969]/60" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Template Name *</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" /></div>
            <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Category</label><select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]"><option value="">Select</option>{categories.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Description</label><input value={description} onChange={e => setDescription(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" /></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-[#5c1a2a]/90">Checklist Items</label>
              <button type="button" onClick={addItem} className="text-sm text-[#8b1a34] hover:text-[#6d1529] font-medium">+ Add Item</button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-[#faf8f5] rounded-xl">
                  <span className="w-6 h-6 bg-[#8b1a34]/10 text-[#8b1a34] rounded-full flex items-center justify-center text-xs font-medium mt-1">{i + 1}</span>
                  <div className="flex-1 space-y-2">
                    <input placeholder="Task title" value={item.title} onChange={e => updateItem(i, 'title', e.target.value)} className="w-full px-3 py-1.5 border border-[#f0e4d8] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]" />
                    <div className="flex gap-2">
                      <input placeholder="Days offset (e.g. -30)" value={item.daysOffset} onChange={e => updateItem(i, 'daysOffset', e.target.value)} className="w-32 px-3 py-1.5 border border-[#f0e4d8] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#d4a017]" />
                      <label className="flex items-center gap-1.5 text-xs text-[#8b6969]"><input type="checkbox" checked={item.isMandatory} onChange={e => updateItem(i, 'isMandatory', e.target.checked)} className="rounded" /> Required</label>
                    </div>
                  </div>
                  {items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-[#8b6969]/60 hover:text-red-500 mt-1"><Trash2 className="w-4 h-4" /></button>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#8b6969]">Cancel</button>
            <button type="submit" disabled={saving} className="px-6 py-2.5 bg-[#8b1a34] text-white text-sm font-medium rounded-xl hover:bg-[#6d1529] disabled:opacity-50">{saving ? 'Saving...' : 'Create Template'}</button>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d0811]/60 backdrop-blur-sm p-4">
      <div className="glass-card rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-[#f0e4d8]">
          <h2 className="text-lg font-semibold text-[#5c1a2a]">Apply Template to Wedding</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-[#8b6969]/60" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">SOP Template</label>
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]">
              <option value="">Select template</option>
              {templates.map(t => <option key={t.id} value={t.id}>{t.name} ({t.items?.length} items)</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5c1a2a]/90 mb-1">Wedding</label>
            <select value={weddingId} onChange={e => setWeddingId(e.target.value)} className="w-full px-3 py-2 border border-[#f0e4d8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a017]">
              <option value="">Select wedding</option>
              {weddings.map((w: any) => <option key={w.id} value={w.id}>{w.clientName} - {new Date(w.weddingDate).toLocaleDateString('en-IN')}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-[#8b6969]">Cancel</button>
            <button onClick={() => templateId && weddingId && onApply(templateId, weddingId)} disabled={!templateId || !weddingId} className="px-6 py-2.5 bg-[#8b1a34] text-white text-sm font-medium rounded-xl hover:bg-[#6d1529] disabled:opacity-50">Apply</button>
          </div>
        </div>
      </div>
    </div>
  )
}
