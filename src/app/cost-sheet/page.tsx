'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    FileSpreadsheet,
    Plus,
    Loader2,
    Save,
    Printer,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    PlusCircle,
    Download
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import {
    getCostSheets,
    createCostSheet,
    updateCostSheet,
    deleteCostSheet,
    getNextSheetNumber,
    CostSheet
} from './actions'
import { getProducts, Product } from '@/app/products/actions'
import { getSettings, UserSettings } from '@/app/settings/actions'
import { getUser } from '@/app/auth/actions'

const currencySymbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'SAR': '﷼'
}

interface MaterialItem {
    id: string
    name: string
    quantity: string
    rate: string
    amount: number
}

interface LaborItem {
    id: string
    description: string
    hours: string
    rate: string
    amount: number
}

interface CostSheetFormData {
    product_id: string
    sheet_number: string
    date: string
    quantity_produced: string
    cost_unit: 'per_unit' | 'per_batch'
    materials: MaterialItem[]
    labor: LaborItem[]
    overhead_cost: string
    other_costs: string
    notes: string
}

const createMaterialItem = (): MaterialItem => ({
    id: crypto.randomUUID(),
    name: '',
    quantity: '1',
    rate: '0',
    amount: 0
})

const createLaborItem = (): LaborItem => ({
    id: crypto.randomUUID(),
    description: '',
    hours: '0',
    rate: '0',
    amount: 0
})

const emptyForm: CostSheetFormData = {
    product_id: '',
    sheet_number: '',
    date: new Date().toISOString().split('T')[0],
    quantity_produced: '1',
    cost_unit: 'per_unit',
    materials: [createMaterialItem()],
    labor: [createLaborItem()],
    overhead_cost: '0',
    other_costs: '0',
    notes: ''
}

export default function CostSheetPage() {
    const router = useRouter()
    const costSheetRef = useRef<HTMLFormElement>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [exporting, setExporting] = useState(false)
    const [costSheets, setCostSheets] = useState<CostSheet[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [currentSheetIndex, setCurrentSheetIndex] = useState(-1)
    const [formData, setFormData] = useState<CostSheetFormData>(emptyForm)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [isEditing, setIsEditing] = useState(true)

    const currency = currencySymbols[settings?.currency || 'INR'] || '₹'
    const currentSheet = currentSheetIndex >= 0 ? costSheets[currentSheetIndex] : null

    // PDF Export Handler - using print dialog
    const handleExportPDF = async () => {
        // Hide non-printable elements and trigger print
        const printContents = costSheetRef.current
        if (!printContents) return

        // Create a new window for printing
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            setMessage({ type: 'error', text: 'Please allow popups for PDF export' })
            return
        }

        // Get the form HTML content
        const content = printContents.innerHTML

        // Write the print document
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cost Sheet - ${formData.sheet_number}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 20px; background: white; }
                    table { width: 100%; border-collapse: collapse; }
                    td, th { padding: 8px 12px; border: 1px solid #d1d5db; }
                    .bg-gray-50 { background-color: #f9fafb; }
                    .bg-gray-100 { background-color: #f3f4f6; }
                    .bg-gray-800, .bg-gradient-to-r { background-color: #1f2937; color: white; }
                    .bg-blue-50 { background-color: #eff6ff; }
                    .bg-blue-100 { background-color: #dbeafe; }
                    .bg-green-50 { background-color: #f0fdf4; }
                    .bg-green-100 { background-color: #dcfce7; }
                    .bg-green-600 { background-color: #16a34a; color: white; }
                    .bg-indigo-100 { background-color: #e0e7ff; }
                    .bg-purple-50 { background-color: #faf5ff; }
                    .bg-purple-100 { background-color: #f3e8ff; }
                    .bg-orange-50 { background-color: #fff7ed; }
                    .text-blue-600, .text-blue-800 { color: #1d4ed8; }
                    .text-green-600, .text-green-800 { color: #16a34a; }
                    .text-indigo-800 { color: #3730a3; }
                    .text-purple-800 { color: #6b21a8; }
                    .text-orange-800 { color: #9a3412; }
                    .text-gray-300 { color: #d1d5db; }
                    .text-gray-400 { color: #9ca3af; }
                    .text-gray-500 { color: #6b7280; }
                    .text-gray-600 { color: #4b5563; }
                    .text-gray-700 { color: #374151; }
                    .text-white { color: white; }
                    .font-bold { font-weight: bold; }
                    .font-semibold { font-weight: 600; }
                    .font-medium { font-weight: 500; }
                    .text-sm { font-size: 14px; }
                    .text-lg { font-size: 18px; }
                    .text-xl { font-size: 20px; }
                    .text-2xl { font-size: 24px; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .text-left { text-align: left; }
                    .p-2 { padding: 8px; }
                    .p-3 { padding: 12px; }
                    .p-4 { padding: 16px; }
                    .p-6 { padding: 24px; }
                    .pl-6 { padding-left: 24px; }
                    .pl-8 { padding-left: 32px; }
                    .border-b { border-bottom: 1px solid #e5e7eb; }
                    .border-r { border-right: 1px solid #e5e7eb; }
                    .rounded-xl { border-radius: 12px; }
                    button, input, select, textarea { display: none !important; }
                    .print\\:hidden { display: none !important; }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 10mm; }
                    }
                </style>
            </head>
            <body>
                <div class="rounded-xl" style="border: 1px solid #d1d5db; overflow: hidden;">
                    ${content}
                </div>
            </body>
            </html>
        `)

        printWindow.document.close()

        // Wait for content to load then print
        setTimeout(() => {
            printWindow.print()
            printWindow.close()
        }, 500)

        setMessage({ type: 'success', text: 'Print dialog opened - save as PDF' })
    }


    useEffect(() => {
        async function loadData() {
            const user = await getUser()
            if (!user) {
                router.push('/login')
                return
            }
            const [sheetsData, productsData, settingsData] = await Promise.all([
                getCostSheets(),
                getProducts(),
                getSettings()
            ])
            setCostSheets(sheetsData)
            setProducts(productsData)
            setSettings(settingsData)

            const nextNumber = await getNextSheetNumber()
            setFormData({ ...emptyForm, sheet_number: nextNumber })

            setLoading(false)
        }
        loadData()
    }, [router])

    // Material item handlers
    const addMaterialItem = () => {
        setFormData({
            ...formData,
            materials: [...formData.materials, createMaterialItem()]
        })
    }

    const removeMaterialItem = (id: string) => {
        if (formData.materials.length > 1) {
            setFormData({
                ...formData,
                materials: formData.materials.filter(m => m.id !== id)
            })
        }
    }

    const updateMaterialItem = (id: string, field: keyof MaterialItem, value: string) => {
        setFormData({
            ...formData,
            materials: formData.materials.map(m => {
                if (m.id === id) {
                    const updated = { ...m, [field]: value }
                    updated.amount = (parseFloat(updated.quantity) || 0) * (parseFloat(updated.rate) || 0)
                    return updated
                }
                return m
            })
        })
    }

    // Labor item handlers
    const addLaborItem = () => {
        setFormData({
            ...formData,
            labor: [...formData.labor, createLaborItem()]
        })
    }

    const removeLaborItem = (id: string) => {
        if (formData.labor.length > 1) {
            setFormData({
                ...formData,
                labor: formData.labor.filter(l => l.id !== id)
            })
        }
    }

    const updateLaborItem = (id: string, field: keyof LaborItem, value: string) => {
        setFormData({
            ...formData,
            labor: formData.labor.map(l => {
                if (l.id === id) {
                    const updated = { ...l, [field]: value }
                    updated.amount = (parseFloat(updated.hours) || 0) * (parseFloat(updated.rate) || 0)
                    return updated
                }
                return l
            })
        })
    }

    // Calculate totals
    const totalMaterialCost = formData.materials.reduce((sum, m) => sum + m.amount, 0)
    const totalLaborCost = formData.labor.reduce((sum, l) => sum + l.amount, 0)
    const primeCost = totalMaterialCost + totalLaborCost
    const overheadCost = parseFloat(formData.overhead_cost) || 0
    const factoryCost = primeCost + overheadCost
    const otherCosts = parseFloat(formData.other_costs) || 0
    const totalCost = factoryCost + otherCosts
    const quantity = parseInt(formData.quantity_produced) || 1
    const costPerUnit = quantity > 0 ? totalCost / quantity : totalCost

    const getProductUnit = () => {
        const product = products.find(p => p.id === formData.product_id)
        return product?.unit || 'units'
    }

    const handleNewSheet = async () => {
        const nextNumber = await getNextSheetNumber()
        setFormData({ ...emptyForm, sheet_number: nextNumber })
        setCurrentSheetIndex(-1)
        setIsEditing(true)
    }

    const handleNavigate = (direction: 'prev' | 'next') => {
        if (costSheets.length === 0) return

        let newIndex = currentSheetIndex
        if (direction === 'prev') {
            newIndex = currentSheetIndex <= 0 ? costSheets.length - 1 : currentSheetIndex - 1
        } else {
            newIndex = currentSheetIndex >= costSheets.length - 1 ? 0 : currentSheetIndex + 1
        }

        setCurrentSheetIndex(newIndex)
        // Load sheet data...
        const sheet = costSheets[newIndex]
        setFormData({
            product_id: sheet.product_id,
            sheet_number: sheet.sheet_number,
            date: sheet.date,
            quantity_produced: sheet.quantity_produced.toString(),
            cost_unit: sheet.cost_unit,
            materials: [{ id: '1', name: 'Raw Materials', quantity: '1', rate: sheet.material_cost.toString(), amount: sheet.material_cost }],
            labor: [{ id: '1', description: 'Direct Labor', hours: sheet.labor_hours.toString(), rate: sheet.labor_rate.toString(), amount: sheet.labor_cost }],
            overhead_cost: sheet.overhead_cost.toString(),
            other_costs: sheet.other_costs.toString(),
            notes: sheet.notes || ''
        })
        setIsEditing(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        const form = new FormData()
        form.set('product_id', formData.product_id)
        form.set('sheet_number', formData.sheet_number)
        form.set('date', formData.date)
        form.set('quantity_produced', formData.quantity_produced)
        form.set('cost_unit', formData.cost_unit)
        form.set('material_cost', totalMaterialCost.toString())
        form.set('labor_hours', formData.labor.reduce((sum, l) => sum + (parseFloat(l.hours) || 0), 0).toString())
        form.set('labor_rate', formData.labor.length > 0 ? (totalLaborCost / Math.max(formData.labor.reduce((sum, l) => sum + (parseFloat(l.hours) || 0), 0), 1)).toString() : '0')
        form.set('overhead_cost', formData.overhead_cost)
        form.set('other_costs', formData.other_costs)
        form.set('notes', formData.notes)

        let result
        if (currentSheet) {
            result = await updateCostSheet(currentSheet.id, form)
        } else {
            result = await createCostSheet(form)
        }

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: result.success || 'Success!' })
            const data = await getCostSheets()
            setCostSheets(data)
            if (!currentSheet) {
                setCurrentSheetIndex(0)
            }
            setIsEditing(false)
        }
        setSaving(false)
    }

    const handleDelete = async () => {
        if (!currentSheet) return
        if (!confirm('Delete this cost sheet?')) return

        const result = await deleteCostSheet(currentSheet.id)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            const data = await getCostSheets()
            setCostSheets(data)
            handleNewSheet()
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                <div className="lg:pl-64 flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64 transition-all duration-300">
                <div className="p-6 max-w-5xl mx-auto">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
                        <div className="flex items-center gap-2">
                            <button onClick={handleNewSheet} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg">
                                <Plus size={18} /> New
                            </button>
                            {currentSheet && (
                                <>
                                    <button onClick={() => setIsEditing(true)} disabled={isEditing} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50">Edit</button>
                                    <button onClick={handleDelete} className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </>
                            )}
                            <button onClick={() => window.print()} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"><Printer size={18} /></button>
                            <button
                                onClick={handleExportPDF}
                                disabled={exporting}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg disabled:opacity-50"
                            >
                                {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                PDF
                            </button>
                        </div>

                        {costSheets.length > 0 && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleNavigate('prev')} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} /></button>
                                <span className="text-sm text-gray-600">{currentSheetIndex >= 0 ? currentSheetIndex + 1 : 'New'} / {costSheets.length}</span>
                                <button onClick={() => handleNavigate('next')} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </div>

                    {products.length === 0 && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 print:hidden">
                            ⚠️ Add products first. <a href="/products" className="underline font-medium">Go to Products →</a>
                        </div>
                    )}

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg print:hidden ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Cost Sheet Form */}
                    <form ref={costSheetRef} onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-300 shadow-lg overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6 text-center">
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <FileSpreadsheet size={28} />
                                <h1 className="text-2xl font-bold tracking-wide">COST SHEET</h1>
                            </div>
                            <p className="text-gray-300 text-sm">Product Cost Analysis Statement</p>
                        </div>

                        {/* General Information */}
                        <div className="border-b border-gray-200">
                            <table className="w-full text-sm">
                                <tbody>
                                    <tr className="border-b border-gray-200">
                                        <td className="p-3 bg-gray-50 font-medium text-gray-700 w-1/4 border-r">Business Name</td>
                                        <td className="p-3 w-1/4 border-r"><span className="font-medium">{settings?.business_name || 'Not Set'}</span></td>
                                        <td className="p-3 bg-gray-50 font-medium text-gray-700 w-1/4 border-r">Cost Sheet No</td>
                                        <td className="p-3 w-1/4"><span className="font-mono text-blue-600 font-bold">{formData.sheet_number}</span></td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td className="p-3 bg-gray-50 font-medium text-gray-700 border-r">Product / Job</td>
                                        <td className="p-3 border-r">
                                            {isEditing ? (
                                                <select required value={formData.product_id} onChange={(e) => setFormData({ ...formData, product_id: e.target.value })} className="w-full px-2 py-1 border rounded">
                                                    <option value="">Select...</option>
                                                    {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            ) : <span className="font-medium">{currentSheet?.product?.name}</span>}
                                        </td>
                                        <td className="p-3 bg-gray-50 font-medium text-gray-700 border-r">Date</td>
                                        <td className="p-3">
                                            {isEditing ? (
                                                <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-2 py-1 border rounded" />
                                            ) : <span>{formData.date}</span>}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="p-3 bg-gray-50 font-medium text-gray-700 border-r">Quantity Produced</td>
                                        <td className="p-3 border-r">
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input type="number" required min="1" value={formData.quantity_produced} onChange={(e) => setFormData({ ...formData, quantity_produced: e.target.value })} className="w-20 px-2 py-1 border rounded" />
                                                    <span className="text-gray-500">{getProductUnit()}</span>
                                                </div>
                                            ) : <span>{formData.quantity_produced} {getProductUnit()}</span>}
                                        </td>
                                        <td className="p-3 bg-gray-50 font-medium text-gray-700 border-r">Cost Unit</td>
                                        <td className="p-3">
                                            {isEditing ? (
                                                <select value={formData.cost_unit} onChange={(e) => setFormData({ ...formData, cost_unit: e.target.value as 'per_unit' | 'per_batch' })} className="w-full px-2 py-1 border rounded">
                                                    <option value="per_unit">Per Unit</option>
                                                    <option value="per_batch">Per Batch</option>
                                                </select>
                                            ) : <span>{formData.cost_unit === 'per_unit' ? 'Per Unit' : 'Per Batch'}</span>}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Cost Details Table */}
                        <div className="p-4">
                            <table className="w-full border border-gray-300 text-sm">
                                <thead>
                                    <tr className="bg-gray-100">
                                        <th className="p-2 text-left font-semibold text-gray-700 border-b border-r w-2/5">Particulars</th>
                                        <th className="p-2 text-center font-semibold text-gray-700 border-b border-r w-20">Qty</th>
                                        <th className="p-2 text-right font-semibold text-gray-700 border-b border-r w-28">Rate ({currency})</th>
                                        <th className="p-2 text-right font-semibold text-gray-700 border-b w-32">Amount ({currency})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* DIRECT MATERIALS SECTION */}
                                    <tr className="bg-blue-50">
                                        <td colSpan={4} className="p-2 font-semibold text-blue-800 border-b border-gray-300">
                                            <div className="flex items-center justify-between">
                                                <span>A. DIRECT MATERIALS</span>
                                                {isEditing && (
                                                    <button type="button" onClick={addMaterialItem} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
                                                        <PlusCircle size={16} /> Add Material
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {formData.materials.map((material, index) => (
                                        <tr key={material.id} className="border-b border-gray-200">
                                            <td className="p-2 border-r">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 w-6">{index + 1}.</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Material name..."
                                                            value={material.name}
                                                            onChange={(e) => updateMaterialItem(material.id, 'name', e.target.value)}
                                                            className="flex-1 px-2 py-1 border rounded"
                                                        />
                                                        {formData.materials.length > 1 && (
                                                            <button type="button" onClick={() => removeMaterialItem(material.id)} className="text-red-400 hover:text-red-600">
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : <span className="pl-6">{material.name || `Material ${index + 1}`}</span>}
                                            </td>
                                            <td className="p-2 border-r text-center">
                                                {isEditing ? (
                                                    <input type="number" min="0" step="0.01" value={material.quantity} onChange={(e) => updateMaterialItem(material.id, 'quantity', e.target.value)} className="w-full px-1 py-1 border rounded text-center" />
                                                ) : <span>{material.quantity}</span>}
                                            </td>
                                            <td className="p-2 border-r text-right">
                                                {isEditing ? (
                                                    <input type="number" min="0" step="0.01" value={material.rate} onChange={(e) => updateMaterialItem(material.id, 'rate', e.target.value)} className="w-full px-1 py-1 border rounded text-right" />
                                                ) : <span>{currency}{parseFloat(material.rate).toFixed(2)}</span>}
                                            </td>
                                            <td className="p-2 text-right font-medium">{currency}{material.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-blue-100">
                                        <td colSpan={3} className="p-2 text-right font-semibold text-blue-800 border-b border-r">Total Direct Materials</td>
                                        <td className="p-2 text-right font-bold text-blue-800 border-b">{currency}{totalMaterialCost.toFixed(2)}</td>
                                    </tr>

                                    {/* DIRECT LABOR SECTION */}
                                    <tr className="bg-green-50">
                                        <td colSpan={4} className="p-2 font-semibold text-green-800 border-b border-gray-300">
                                            <div className="flex items-center justify-between">
                                                <span>B. DIRECT LABOR</span>
                                                {isEditing && (
                                                    <button type="button" onClick={addLaborItem} className="flex items-center gap-1 text-sm text-green-600 hover:text-green-800">
                                                        <PlusCircle size={16} /> Add Labor
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {formData.labor.map((labor, index) => (
                                        <tr key={labor.id} className="border-b border-gray-200">
                                            <td className="p-2 border-r">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 w-6">{index + 1}.</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Labor description..."
                                                            value={labor.description}
                                                            onChange={(e) => updateLaborItem(labor.id, 'description', e.target.value)}
                                                            className="flex-1 px-2 py-1 border rounded"
                                                        />
                                                        {formData.labor.length > 1 && (
                                                            <button type="button" onClick={() => removeLaborItem(labor.id)} className="text-red-400 hover:text-red-600">
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : <span className="pl-6">{labor.description || `Labor ${index + 1}`}</span>}
                                            </td>
                                            <td className="p-2 border-r text-center">
                                                {isEditing ? (
                                                    <input type="number" min="0" step="0.5" value={labor.hours} onChange={(e) => updateLaborItem(labor.id, 'hours', e.target.value)} className="w-full px-1 py-1 border rounded text-center" placeholder="hrs" />
                                                ) : <span>{labor.hours} hrs</span>}
                                            </td>
                                            <td className="p-2 border-r text-right">
                                                {isEditing ? (
                                                    <input type="number" min="0" step="0.01" value={labor.rate} onChange={(e) => updateLaborItem(labor.id, 'rate', e.target.value)} className="w-full px-1 py-1 border rounded text-right" />
                                                ) : <span>{currency}{parseFloat(labor.rate).toFixed(2)}/hr</span>}
                                            </td>
                                            <td className="p-2 text-right font-medium">{currency}{labor.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-green-100">
                                        <td colSpan={3} className="p-2 text-right font-semibold text-green-800 border-b border-r">Total Direct Labor</td>
                                        <td className="p-2 text-right font-bold text-green-800 border-b">{currency}{totalLaborCost.toFixed(2)}</td>
                                    </tr>

                                    {/* PRIME COST */}
                                    <tr className="bg-indigo-100">
                                        <td colSpan={3} className="p-3 text-right font-bold text-indigo-800 border-b border-r">PRIME COST (A + B)</td>
                                        <td className="p-3 text-right font-bold text-indigo-800 border-b text-lg">{currency}{primeCost.toFixed(2)}</td>
                                    </tr>

                                    {/* MANUFACTURING OVERHEAD */}
                                    <tr className="bg-purple-50">
                                        <td colSpan={4} className="p-2 font-semibold text-purple-800 border-b">C. MANUFACTURING OVERHEAD</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td colSpan={3} className="p-2 pl-8 border-r">Factory Overhead, Utilities, Depreciation, etc.</td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input type="number" min="0" step="0.01" value={formData.overhead_cost} onChange={(e) => setFormData({ ...formData, overhead_cost: e.target.value })} className="w-full px-2 py-1 border rounded text-right" />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.overhead_cost).toFixed(2)}</span>}
                                        </td>
                                    </tr>

                                    {/* FACTORY COST */}
                                    <tr className="bg-purple-100">
                                        <td colSpan={3} className="p-3 text-right font-bold text-purple-800 border-b border-r">FACTORY COST (Prime + C)</td>
                                        <td className="p-3 text-right font-bold text-purple-800 border-b text-lg">{currency}{factoryCost.toFixed(2)}</td>
                                    </tr>

                                    {/* OTHER COSTS */}
                                    <tr className="bg-orange-50">
                                        <td colSpan={4} className="p-2 font-semibold text-orange-800 border-b">D. OTHER COSTS</td>
                                    </tr>
                                    <tr className="border-b border-gray-200">
                                        <td colSpan={3} className="p-2 pl-8 border-r">Administrative, Selling & Distribution Expenses</td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input type="number" min="0" step="0.01" value={formData.other_costs} onChange={(e) => setFormData({ ...formData, other_costs: e.target.value })} className="w-full px-2 py-1 border rounded text-right" />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.other_costs).toFixed(2)}</span>}
                                        </td>
                                    </tr>

                                    {/* TOTAL COST */}
                                    <tr className="bg-gray-800 text-white">
                                        <td colSpan={3} className="p-4 font-bold text-lg">TOTAL COST OF PRODUCTION</td>
                                        <td className="p-4 text-right font-bold text-xl">{currency}{totalCost.toFixed(2)}</td>
                                    </tr>

                                    {/* COST PER UNIT */}
                                    <tr className="bg-green-600 text-white">
                                        <td colSpan={3} className="p-4 font-bold text-lg">COST PER UNIT</td>
                                        <td className="p-4 text-right font-bold text-xl">{currency}{costPerUnit.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Notes */}
                        <div className="p-4 border-t border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                            {isEditing ? (
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Additional notes..." className="w-full px-3 py-2 border rounded-lg" />
                            ) : <p className="text-gray-600">{formData.notes || 'No notes'}</p>}
                        </div>

                        {/* Save Button */}
                        {isEditing && (
                            <div className="p-4 bg-gray-50 border-t print:hidden">
                                <button type="submit" disabled={saving || products.length === 0} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50">
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                                    {currentSheet ? 'Update' : 'Save'} Cost Sheet
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    )
}
