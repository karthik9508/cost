'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
    Download,
    Users,
    DollarSign,
    Package,
    Layers,
    Settings,
    Briefcase
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import MaterialCostManager, { MaterialCostManagerRef } from '@/components/MaterialCostManager'
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
import { saveMaterials, saveScrapItems } from '@/app/materials/actions'

const currencySymbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'SAR': '﷼'
}

interface LaborItem {
    id: string
    description: string
    hours: string
    rate: string
    gross_wages: string
    payroll_taxes: string
    benefits: string
    other_expenses: string
    amount: number
}

interface OverheadItem {
    id: string
    description: string
    amount: string
}

interface CostSheetFormData {
    product_id: string
    sheet_number: string
    date: string
    quantity_produced: string
    cost_unit: 'per_unit' | 'per_batch'
    // Labor
    labor: LaborItem[]
    // Factory Overhead — 3 groups
    indirect_materials: OverheadItem[]
    indirect_labor: OverheadItem[]
    other_indirect: OverheadItem[]
    // Admin, Selling & Distribution — 3 groups
    admin_costs: OverheadItem[]
    selling_costs: OverheadItem[]
    distribution_costs: OverheadItem[]
    notes: string
}

const createLaborItem = (): LaborItem => ({
    id: crypto.randomUUID(),
    description: '',
    hours: '0',
    rate: '0',
    gross_wages: '0',
    payroll_taxes: '0',
    benefits: '0',
    other_expenses: '0',
    amount: 0
})

const createOverheadItem = (): OverheadItem => ({
    id: crypto.randomUUID(),
    description: '',
    amount: '0'
})

const calcGrossWages = (item: LaborItem): number => {
    return (parseFloat(item.hours) || 0) * (parseFloat(item.rate) || 0)
}

const calcLaborAmount = (item: LaborItem): number => {
    const grossWages = calcGrossWages(item)
    return grossWages +
        (parseFloat(item.payroll_taxes) || 0) +
        (parseFloat(item.benefits) || 0) +
        (parseFloat(item.other_expenses) || 0)
}

const emptyForm: CostSheetFormData = {
    product_id: '',
    sheet_number: '',
    date: new Date().toISOString().split('T')[0],
    quantity_produced: '1',
    cost_unit: 'per_unit',
    // Labor
    labor: [createLaborItem()],
    // Factory Overhead
    indirect_materials: [],
    indirect_labor: [],
    other_indirect: [],
    // Admin, Selling & Distribution
    admin_costs: [],
    selling_costs: [],
    distribution_costs: [],
    notes: ''
}


export default function CostSheetPage() {
    const router = useRouter()
    const costSheetRef = useRef<HTMLFormElement>(null)
    const materialCostRef = useRef<MaterialCostManagerRef>(null)
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
    const [totalMaterialCost, setTotalMaterialCost] = useState(0)
    const [materialCostSheetId, setMaterialCostSheetId] = useState<string | null>(null)
    const [showLaborBreakdown, setShowLaborBreakdown] = useState(false)
    const [activeLaborId, setActiveLaborId] = useState<string | null>(null)
    const [showOverheadModal, setShowOverheadModal] = useState<'indirect_materials' | 'indirect_labor' | 'other_indirect' | null>(null)
    const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false)

    const currency = currencySymbols[settings?.currency || 'INR'] || '₹'
    const currentSheet = currentSheetIndex >= 0 ? costSheets[currentSheetIndex] : null

    const handleMaterialTotalChange = useCallback((total: number) => {
        setTotalMaterialCost(total)
    }, [])

    // PDF Export Handler - using print dialog
    const handleExportPDF = async () => {
        setExporting(true)

        const selectedProduct = products.find(p => p.id === formData.product_id)
        const productName = selectedProduct?.name || 'Product'
        const productUnit = selectedProduct?.unit || 'units'

        // Get materials and scrap data from the component ref
        const materialsData = materialCostRef.current?.getMaterialsData() || []
        const scrapData = materialCostRef.current?.getScrapData() || []
        const matCost = totalMaterialCost
        const grossMatCost = materialsData.reduce((sum, m) => sum + m.amount, 0)
        const scrapTotal = scrapData.reduce((sum, s) => sum + s.amount, 0)

        const labCost = formData.labor.reduce((sum, l) => sum + l.amount, 0)
        const primeCostVal = matCost + labCost
        const overheadVal = totalOverhead
        const factoryCostVal = primeCostVal + overheadVal
        const otherCostsVal = totalASD
        const totalCostVal = factoryCostVal + otherCostsVal
        const qtyVal = parseInt(formData.quantity_produced) || 1
        const costPerUnitVal = qtyVal > 0 ? totalCostVal / qtyVal : totalCostVal

        // Calculate percentages for cost breakdown
        const matPercent = totalCostVal > 0 ? ((matCost / totalCostVal) * 100).toFixed(1) : '0'
        const labPercent = totalCostVal > 0 ? ((labCost / totalCostVal) * 100).toFixed(1) : '0'
        const overheadPercent = totalCostVal > 0 ? ((overheadVal / totalCostVal) * 100).toFixed(1) : '0'
        const otherPercent = totalCostVal > 0 ? ((otherCostsVal / totalCostVal) * 100).toFixed(1) : '0'

        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            setMessage({ type: 'error', text: 'Please allow popups for PDF export' })
            setExporting(false)
            return
        }

        const currentDate = new Date().toLocaleDateString('en-IN', {
            year: 'numeric', month: 'short', day: 'numeric'
        })

        // Build materials rows - from individual material line items with BOM info
        const materialsRows = materialsData.map((m, i) => `
            <tr>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${i + 1}. ${m.name}${m.part_number ? ` <span style="color:#6b7280;font-size:10px;">(#${m.part_number})</span>` : ''}</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 12px;">${m.quantity} ${m.unit}</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px;">${currency}${m.rate.toFixed(2)}/${m.unit}</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 12px;">${currency}${m.amount.toFixed(2)}</td>
            </tr>
        `).join('')

        // Build scrap rows
        const scrapRows = scrapData.length > 0 ? `
            <tr style="background:#fffbeb;">
                <td colspan="4" style="padding:6px 10px;font-size:11px;font-weight:600;color:#92400e;border-bottom:1px solid #e5e7eb;">Less: Scrap / Wastage Value</td>
            </tr>
            ${scrapData.map((s, i) => `
                <tr>
                    <td style="padding:4px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;padding-left:24px;">${i + 1}. ${s.description}</td>
                    <td style="padding:4px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;">${s.quantity} ${s.unit}</td>
                    <td style="padding:4px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:11px;">${currency}${s.rate.toFixed(2)}/${s.unit}</td>
                    <td style="padding:4px 10px;border-bottom:1px solid #e5e7eb;text-align:right;font-size:11px;color:#92400e;">−${currency}${s.amount.toFixed(2)}</td>
                </tr>
            `).join('')}
            <tr class="subtotal-row">
                <td colspan="3" style="text-align:right;color:#92400e;">Total Scrap Deduction</td>
                <td style="text-align:right;color:#92400e;">−${currency}${scrapTotal.toFixed(2)}</td>
            </tr>
        ` : ''

        // Build labor rows - compact
        const laborRows = formData.labor.map((l, i) => `
            <tr>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${i + 1}. ${l.description || 'Labour'}</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 12px;">${l.hours} hrs</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px;">${currency}${parseFloat(l.rate).toFixed(2)}/hr</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600; font-size: 12px;">${currency}${l.amount.toFixed(2)}</td>
            </tr>
        `).join('')

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Cost Sheet - ${formData.sheet_number}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Inter', -apple-system, sans-serif;
                        background: white;
                        color: #1f2937;
                        font-size: 12px;
                        line-height: 1.4;
                    }
                    .page { max-width: 210mm; margin: 0 auto; padding: 12mm; }
                    
                    /* Header */
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: flex-start;
                        padding-bottom: 12px;
                        border-bottom: 3px solid #1e3a8a;
                        margin-bottom: 12px;
                    }
                    .company { }
                    .company-name { font-size: 20px; font-weight: 700; color: #1e3a8a; }
                    .doc-title { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
                    .sheet-info { text-align: right; }
                    .sheet-no { font-size: 18px; font-weight: 700; color: #1e3a8a; }
                    .sheet-date { font-size: 11px; color: #64748b; margin-top: 2px; }
                    
                    /* Info Grid */
                    .info-grid { 
                        display: grid; 
                        grid-template-columns: repeat(4, 1fr); 
                        gap: 12px; 
                        background: #f8fafc; 
                        padding: 10px 14px; 
                        border-radius: 6px; 
                        margin-bottom: 12px;
                        border: 1px solid #e2e8f0;
                    }
                    .info-box { }
                    .info-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
                    .info-value { font-size: 12px; font-weight: 600; color: #1e293b; }
                    
                    /* Main Cost Table */
                    .cost-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
                    .cost-table th { 
                        background: #f1f5f9; 
                        padding: 8px 10px; 
                        font-size: 10px; 
                        font-weight: 600; 
                        text-transform: uppercase; 
                        letter-spacing: 0.5px;
                        color: #475569;
                        border-bottom: 2px solid #d1d5db;
                    }
                    .section-row { background: linear-gradient(90deg, #eff6ff, #f8fafc); }
                    .section-row td { 
                        padding: 8px 10px; 
                        font-weight: 600; 
                        font-size: 11px; 
                        color: #1e40af;
                        border-bottom: 1px solid #d1d5db;
                    }
                    .section-row .badge { 
                        display: inline-block;
                        width: 20px; 
                        height: 20px; 
                        background: #2563eb; 
                        color: white; 
                        border-radius: 4px; 
                        text-align: center; 
                        line-height: 20px;
                        font-size: 10px;
                        font-weight: 700;
                        margin-right: 8px;
                    }
                    .section-row.labor { background: linear-gradient(90deg, #f0fdf4, #f8fafc); }
                    .section-row.labor td { color: #166534; }
                    .section-row.labor .badge { background: #16a34a; }
                    .section-row.overhead { background: linear-gradient(90deg, #faf5ff, #f8fafc); }
                    .section-row.overhead td { color: #6b21a8; }
                    .section-row.overhead .badge { background: #9333ea; }
                    .section-row.other { background: linear-gradient(90deg, #fff7ed, #f8fafc); }
                    .section-row.other td { color: #9a3412; }
                    .section-row.other .badge { background: #ea580c; }
                    
                    .subtotal-row { background: #f8fafc; }
                    .subtotal-row td { padding: 6px 10px; font-weight: 600; font-size: 11px; border-bottom: 1px solid #d1d5db; }
                    
                    .prime-row { background: linear-gradient(90deg, #e0e7ff, #eef2ff); }
                    .prime-row td { padding: 8px 10px; font-weight: 700; color: #3730a3; font-size: 12px; border-bottom: 2px solid #c7d2fe; }
                    
                    .factory-row { background: linear-gradient(90deg, #f3e8ff, #faf5ff); }
                    .factory-row td { padding: 8px 10px; font-weight: 700; color: #6b21a8; font-size: 12px; border-bottom: 2px solid #e9d5ff; }
                    
                    /* Summary Section */
                    .summary { display: flex; gap: 12px; margin-bottom: 12px; }
                    .summary-left { flex: 1; }
                    .summary-right { width: 220px; }
                    
                    .breakdown { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; height: 100%; }
                    .breakdown-title { font-size: 10px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 1px solid #e2e8f0; }
                    .breakdown-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 11px; }
                    .breakdown-row .label { color: #64748b; }
                    .breakdown-row .value { font-weight: 600; color: #1e293b; }
                    .breakdown-row .percent { color: #94a3b8; font-size: 10px; margin-left: 4px; }
                    
                    .totals { border-radius: 6px; overflow: hidden; height: 100%; display: flex; flex-direction: column; }
                    .total-box { padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; }
                    .total-main { background: linear-gradient(135deg, #1e3a8a, #2563eb); color: white; flex: 1; }
                    .total-unit { background: linear-gradient(135deg, #166534, #22c55e); color: white; flex: 1; }
                    .total-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.9; }
                    .total-value { font-size: 20px; font-weight: 700; margin-top: 2px; }
                    
                    /* Notes */
                    .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 10px; margin-bottom: 12px; }
                    .notes-title { font-size: 10px; font-weight: 600; color: #92400e; text-transform: uppercase; margin-bottom: 4px; }
                    .notes-content { font-size: 11px; color: #78350f; }
                    
                    /* Footer */
                    .footer { display: flex; justify-content: space-between; padding-top: 16px; border-top: 1px solid #e2e8f0; margin-top: 16px; }
                    .sig-box { width: 140px; text-align: center; }
                    .sig-line { border-top: 1px solid #94a3b8; margin-top: 36px; padding-top: 4px; font-size: 10px; color: #64748b; }
                    .footer-meta { font-size: 9px; color: #94a3b8; text-align: center; margin-top: 12px; }
                    
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .page { padding: 0; max-width: 100%; }
                        @page { margin: 10mm; size: A4; }
                    }
                </style>
            </head>
            <body>
                <div class="page">
                    <!-- Header -->
                    <div class="header">
                        <div class="company">
                            <div class="company-name">${settings?.business_name || 'Cost Analyst'}</div>
                            <div class="doc-title">Cost Sheet Statement</div>
                        </div>
                        <div class="sheet-info">
                            <div class="sheet-no">#${formData.sheet_number}</div>
                        </div>
                    </div>
                    
                    <!-- Info Grid -->
                    <div class="info-grid">
                        <div class="info-box">
                            <div class="info-label">Product / Service</div>
                            <div class="info-value">${productName}</div>
                        </div>
                        <div class="info-box">
                            <div class="info-label">Quantity Produced</div>
                            <div class="info-value">${formData.quantity_produced} ${productUnit}</div>
                        </div>
                        <div class="info-box">
                            <div class="info-label">Cost Unit</div>
                            <div class="info-value">${formData.cost_unit === 'per_unit' ? 'Per Unit' : 'Per Batch'}</div>
                        </div>
                        <div class="info-box">
                            <div class="info-label">Currency</div>
                            <div class="info-value">${settings?.currency || 'INR'}</div>
                        </div>
                    </div>
                    
                    <!-- Main Cost Table -->
                    <table class="cost-table">
                        <thead>
                            <tr>
                                <th style="width: 40%; text-align: left;">Particulars</th>
                                <th style="width: 20%; text-align: center;">Qty / Hrs</th>
                                <th style="width: 20%; text-align: right;">Rate</th>
                                <th style="width: 20%; text-align: right;">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Materials -->
                            <tr class="section-row">
                                <td colspan="4"><span class="badge">A</span>Direct Materials (BOM)</td>
                            </tr>
                            ${materialsRows}
                            ${scrapRows}
                            <tr class="subtotal-row">
                                <td colspan="3" style="text-align: right; color: #1e40af;">${scrapTotal > 0 ? 'Net Direct Materials' : 'Total Materials'}</td>
                                <td style="text-align: right; color: #1e40af;">${currency}${matCost.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Labor -->
                            <tr class="section-row labor">
                                <td colspan="4"><span class="badge">B</span>Direct Labour</td>
                            </tr>
                            ${laborRows}
                            <tr class="subtotal-row">
                                <td colspan="3" style="text-align: right; color: #166534;">Total Labour</td>
                                <td style="text-align: right; color: #166534;">${currency}${labCost.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Prime Cost -->
                            <tr class="prime-row">
                                <td colspan="3" style="text-align: right;">PRIME COST (A + B)</td>
                                <td style="text-align: right;">${currency}${primeCostVal.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Overhead -->
                            <tr class="section-row overhead">
                                <td colspan="4"><span class="badge">C</span>Factory Overhead</td>
                            </tr>
                            ${formData.indirect_materials.length > 0 ? `
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 11px; font-weight: 600; color: #6b21a8; padding-left: 30px; border-bottom: 1px solid #e5e7eb;">Indirect Materials</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${currency}${totalIndirectMaterials.toFixed(2)}</td>
                            </tr>
                            ${formData.indirect_materials.map(i => `
                            <tr>
                                <td colspan="3" style="padding: 4px 10px; font-size: 11px; padding-left: 50px; color: #666; border-bottom: 1px solid #f3f4f6;">• ${i.description || 'Item'}</td>
                                <td style="padding: 4px 10px; text-align: right; font-size: 11px; color: #666; border-bottom: 1px solid #f3f4f6;">${currency}${(parseFloat(i.amount) || 0).toFixed(2)}</td>
                            </tr>`).join('')}` : ''}
                            ${formData.indirect_labor.length > 0 ? `
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 11px; font-weight: 600; color: #6b21a8; padding-left: 30px; border-bottom: 1px solid #e5e7eb;">Indirect Labour</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${currency}${totalIndirectLabor.toFixed(2)}</td>
                            </tr>
                            ${formData.indirect_labor.map(i => `
                            <tr>
                                <td colspan="3" style="padding: 4px 10px; font-size: 11px; padding-left: 50px; color: #666; border-bottom: 1px solid #f3f4f6;">• ${i.description || 'Item'}</td>
                                <td style="padding: 4px 10px; text-align: right; font-size: 11px; color: #666; border-bottom: 1px solid #f3f4f6;">${currency}${(parseFloat(i.amount) || 0).toFixed(2)}</td>
                            </tr>`).join('')}` : ''}
                            ${formData.other_indirect.length > 0 ? `
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 11px; font-weight: 600; color: #6b21a8; padding-left: 30px; border-bottom: 1px solid #e5e7eb;">Other Indirect Factory Costs</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${currency}${totalOtherIndirect.toFixed(2)}</td>
                            </tr>
                            ${formData.other_indirect.map(i => `
                            <tr>
                                <td colspan="3" style="padding: 4px 10px; font-size: 11px; padding-left: 50px; color: #666; border-bottom: 1px solid #f3f4f6;">• ${i.description || 'Item'}</td>
                                <td style="padding: 4px 10px; text-align: right; font-size: 11px; color: #666; border-bottom: 1px solid #f3f4f6;">${currency}${(parseFloat(i.amount) || 0).toFixed(2)}</td>
                            </tr>`).join('')}` : ''}
                            <tr class="subtotal-row">
                                <td colspan="3" style="text-align: right; color: #6b21a8;">Total Factory Overhead</td>
                                <td style="text-align: right; color: #6b21a8;">${currency}${overheadVal.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Factory Cost -->
                            <tr class="factory-row">
                                <td colspan="3" style="text-align: right;">FACTORY COST (Prime + C)</td>
                                <td style="text-align: right;">${currency}${factoryCostVal.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Other Costs -->
                            <tr class="section-row other">
                                <td colspan="4"><span class="badge">D</span>Admin, Selling & Distribution</td>
                            </tr>
                            ${formData.admin_costs.length > 0 ? `
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 11px; font-weight: 600; color: #c2410c; padding-left: 30px; border-bottom: 1px solid #e5e7eb;">Administrative Costs</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${currency}${totalAdminCosts.toFixed(2)}</td>
                            </tr>
                            ${formData.admin_costs.map(i => `
                            <tr>
                                <td colspan="3" style="padding: 4px 10px; font-size: 11px; padding-left: 50px; color: #666; border-bottom: 1px solid #f3f4f6;">• ${i.description || 'Item'}</td>
                                <td style="padding: 4px 10px; text-align: right; font-size: 11px; color: #666; border-bottom: 1px solid #f3f4f6;">${currency}${(parseFloat(i.amount) || 0).toFixed(2)}</td>
                            </tr>`).join('')}` : ''}
                            ${formData.selling_costs.length > 0 ? `
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 11px; font-weight: 600; color: #c2410c; padding-left: 30px; border-bottom: 1px solid #e5e7eb;">Selling Costs</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${currency}${totalSellingCosts.toFixed(2)}</td>
                            </tr>
                            ${formData.selling_costs.map(i => `
                            <tr>
                                <td colspan="3" style="padding: 4px 10px; font-size: 11px; padding-left: 50px; color: #666; border-bottom: 1px solid #f3f4f6;">• ${i.description || 'Item'}</td>
                                <td style="padding: 4px 10px; text-align: right; font-size: 11px; color: #666; border-bottom: 1px solid #f3f4f6;">${currency}${(parseFloat(i.amount) || 0).toFixed(2)}</td>
                            </tr>`).join('')}` : ''}
                            ${formData.distribution_costs.length > 0 ? `
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 11px; font-weight: 600; color: #c2410c; padding-left: 30px; border-bottom: 1px solid #e5e7eb;">Distribution Costs</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${currency}${totalDistributionCosts.toFixed(2)}</td>
                            </tr>
                            ${formData.distribution_costs.map(i => `
                            <tr>
                                <td colspan="3" style="padding: 4px 10px; font-size: 11px; padding-left: 50px; color: #666; border-bottom: 1px solid #f3f4f6;">• ${i.description || 'Item'}</td>
                                <td style="padding: 4px 10px; text-align: right; font-size: 11px; color: #666; border-bottom: 1px solid #f3f4f6;">${currency}${(parseFloat(i.amount) || 0).toFixed(2)}</td>
                            </tr>`).join('')}` : ''}
                            <tr class="subtotal-row">
                                <td colspan="3" style="text-align: right; color: #c2410c;">Total Admin, Selling & Distribution</td>
                                <td style="text-align: right; color: #c2410c;">${currency}${otherCostsVal.toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <!-- Summary Section -->
                    <div class="summary">
                        <div class="summary-left">
                            <div class="breakdown">
                                <div class="breakdown-title">Cost Breakdown</div>
                                <div class="breakdown-row">
                                    <span class="label">Direct Materials</span>
                                    <span><span class="value">${currency}${matCost.toFixed(2)}</span><span class="percent">(${matPercent}%)</span></span>
                                </div>
                                <div class="breakdown-row">
                                    <span class="label">Direct Labour</span>
                                    <span><span class="value">${currency}${labCost.toFixed(2)}</span><span class="percent">(${labPercent}%)</span></span>
                                </div>
                                <div class="breakdown-row">
                                    <span class="label">Manufacturing Overhead</span>
                                    <span><span class="value">${currency}${overheadVal.toFixed(2)}</span><span class="percent">(${overheadPercent}%)</span></span>
                                </div>
                                <div class="breakdown-row">
                                    <span class="label">Other Costs</span>
                                    <span><span class="value">${currency}${otherCostsVal.toFixed(2)}</span><span class="percent">(${otherPercent}%)</span></span>
                                </div>
                            </div>
                        </div>
                        <div class="summary-right">
                            <div class="totals">
                                <div class="total-box total-main">
                                    <div>
                                        <div class="total-label">Total Cost</div>
                                        <div class="total-value">${currency}${totalCostVal.toFixed(2)}</div>
                                    </div>
                                </div>
                                <div class="total-box total-unit">
                                    <div>
                                        <div class="total-label">Cost Per Unit</div>
                                        <div class="total-value">${currency}${costPerUnitVal.toFixed(2)}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${formData.notes ? `
                    <div class="notes">
                        <div class="notes-title">Notes & Remarks</div>
                        <div class="notes-content">${formData.notes}</div>
                    </div>
                    ` : ''}
                    
                    <!-- Footer -->
                    <div class="footer">
                        <div class="sig-box"><div class="sig-line">Prepared By</div></div>
                        <div class="sig-box"><div class="sig-line">Checked By</div></div>
                        <div class="sig-box"><div class="sig-line">Approved By</div></div>
                    </div>
                    <div class="footer-meta">Generated on ${currentDate} • ${settings?.business_name || 'Cost Analyst'}</div>
                </div>
            </body>
            </html>
        `)

        printWindow.document.close()

        setTimeout(() => {
            printWindow.print()
            printWindow.close()
            setExporting(false)
        }, 600)

        setMessage({ type: 'success', text: 'PDF export ready - save from print dialog' })
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
                    updated.amount = calcLaborAmount(updated)
                    return updated
                }
                return l
            })
        })
    }

    const openLaborBreakdown = (id: string) => {
        setActiveLaborId(id)
        setShowLaborBreakdown(true)
    }

    // Calculate totals (totalMaterialCost comes from MaterialCostManager via callback)
    const totalLaborCost = formData.labor.reduce((sum, l) => sum + l.amount, 0)
    const primeCost = totalMaterialCost + totalLaborCost
    const totalIndirectMaterials = formData.indirect_materials.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    const totalIndirectLabor = formData.indirect_labor.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    const totalOtherIndirect = formData.other_indirect.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    const totalOverhead = totalIndirectMaterials + totalIndirectLabor + totalOtherIndirect
    const factoryCost = primeCost + totalOverhead
    const totalAdminCosts = formData.admin_costs.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    const totalSellingCosts = formData.selling_costs.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    const totalDistributionCosts = formData.distribution_costs.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
    const totalASD = totalAdminCosts + totalSellingCosts + totalDistributionCosts
    const totalCost = factoryCost + totalASD
    const quantity = parseInt(formData.quantity_produced) || 1
    const costPerUnit = quantity > 0 ? totalCost / quantity : totalCost

    // Overhead & expense item handlers
    const addOverheadItem = (group: 'indirect_materials' | 'indirect_labor' | 'other_indirect' | 'admin_costs' | 'selling_costs' | 'distribution_costs') => {
        setFormData({ ...formData, [group]: [...formData[group], createOverheadItem()] })
    }
    const removeOverheadItem = (group: 'indirect_materials' | 'indirect_labor' | 'other_indirect' | 'admin_costs' | 'selling_costs' | 'distribution_costs', id: string) => {
        setFormData({ ...formData, [group]: formData[group].filter(i => i.id !== id) })
    }
    const updateOverheadItem = (group: 'indirect_materials' | 'indirect_labor' | 'other_indirect' | 'admin_costs' | 'selling_costs' | 'distribution_costs', id: string, field: keyof OverheadItem, value: string) => {
        setFormData({ ...formData, [group]: formData[group].map(i => i.id === id ? { ...i, [field]: value } : i) })
    }

    const getProductUnit = () => {
        const product = products.find(p => p.id === formData.product_id)
        return product?.unit || 'units'
    }

    const handleNewSheet = async () => {
        const nextNumber = await getNextSheetNumber()
        setFormData({ ...emptyForm, sheet_number: nextNumber })
        setCurrentSheetIndex(-1)
        setMaterialCostSheetId(null)
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
            labor: [{ id: '1', description: 'Direct Labour', hours: sheet.labor_hours.toString(), rate: sheet.labor_rate.toString(), gross_wages: sheet.labor_cost.toString(), payroll_taxes: '0', benefits: '0', other_expenses: '0', amount: sheet.labor_cost }],
            indirect_materials: sheet.overhead_cost > 0 ? [{ id: '1', description: 'Factory Overhead', amount: sheet.overhead_cost.toString() }] : [],
            indirect_labor: [],
            other_indirect: [],
            admin_costs: sheet.other_costs > 0 ? [{ id: '1', description: 'Admin & Distribution', amount: sheet.other_costs.toString() }] : [],
            selling_costs: [],
            distribution_costs: [],
            notes: sheet.notes || ''
        })
        setMaterialCostSheetId(sheet.id)
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
        form.set('overhead_cost', totalOverhead.toString())
        form.set('other_costs', totalASD.toString())
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
            // Save materials for this cost sheet
            const data = await getCostSheets()
            setCostSheets(data)

            // Determine the cost sheet ID (for new sheets, it's the first in the list)
            const savedSheetId = currentSheet ? currentSheet.id : data[0]?.id
            if (savedSheetId && materialCostRef.current) {
                const materialsData = materialCostRef.current.getMaterialsData()
                const scrapData = materialCostRef.current.getScrapData()
                await saveMaterials(savedSheetId, materialsData)
                await saveScrapItems(savedSheetId, scrapData)
                setMaterialCostSheetId(savedSheetId)
            }

            setMessage({ type: 'success', text: result.success || 'Success!' })
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
                                                <select required value={formData.product_id} onChange={(e) => {
                                                    const selectedProduct = products.find(p => p.id === e.target.value)
                                                    const quantityFromProduct = selectedProduct?.expected_monthly_quantity || 1
                                                    setFormData({
                                                        ...formData,
                                                        product_id: e.target.value,
                                                        quantity_produced: quantityFromProduct.toString()
                                                    })
                                                }} className="w-full px-2 py-1 border rounded">
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
                            <table className="w-full border border-gray-200 text-sm">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="p-2 text-left font-medium text-slate-500 border-b border-r w-2/5 uppercase tracking-wider text-xs">Particulars</th>
                                        <th className="p-2 text-center font-medium text-slate-500 border-b border-r w-20 uppercase tracking-wider text-xs">Qty</th>
                                        <th className="p-2 text-right font-medium text-slate-500 border-b border-r w-28 uppercase tracking-wider text-xs">Rate ({currency})</th>
                                        <th className="p-2 text-right font-medium text-slate-500 border-b w-32 uppercase tracking-wider text-xs">Amount ({currency})</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* DIRECT MATERIALS SECTION — managed by MaterialCostManager */}
                                    <MaterialCostManager
                                        ref={materialCostRef}
                                        costSheetId={materialCostSheetId}
                                        currency={currency}
                                        isEditing={isEditing}
                                        onTotalChange={handleMaterialTotalChange}
                                    />

                                    {/* DIRECT LABOR SECTION */}
                                    <tr className="bg-slate-100">
                                        <td colSpan={5} className="p-3 font-semibold text-slate-800 border-b border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-7 h-7 bg-slate-700 text-white rounded flex items-center justify-center text-xs font-bold">B</span>
                                                    <span className="text-sm font-bold tracking-wide uppercase">Direct Labour</span>
                                                    <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{formData.labor.length} item{formData.labor.length > 1 ? 's' : ''}</span>
                                                </div>
                                                {isEditing && (
                                                    <button type="button" onClick={addLaborItem} className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors">
                                                        <PlusCircle size={14} /> Add Labour
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Labor Column Headers */}
                                    <tr className="bg-slate-50">
                                        <td colSpan={3} className="p-2 text-xs font-medium text-slate-500 border-b border-r uppercase tracking-wider">Description</td>
                                        <td className="p-2 text-xs font-medium text-slate-500 border-b border-r text-center uppercase tracking-wider">Labour Cost</td>
                                        <td className="p-2 text-xs font-medium text-slate-500 border-b text-right w-32 uppercase tracking-wider">Total ({currency})</td>
                                    </tr>
                                    {formData.labor.map((labor, index) => (
                                        <tr key={labor.id} className="border-b border-gray-100 hover:bg-slate-50 transition-colors group">
                                            {/* Description */}
                                            <td colSpan={3} className="p-2 border-r">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Labour description..."
                                                            value={labor.description}
                                                            onChange={(e) => updateLaborItem(labor.id, 'description', e.target.value)}
                                                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                                                        />
                                                        {formData.labor.length > 1 && (
                                                            <button type="button" onClick={() => removeLaborItem(labor.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-all">
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 pl-2">
                                                        <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold">{index + 1}</span>
                                                        <Users size={14} className="text-slate-400" />
                                                        <span className="font-medium text-gray-700">{labor.description || `Labour ${index + 1}`}</span>
                                                    </div>
                                                )}
                                            </td>
                                            {/* Manage Labour Cost Button */}
                                            <td className="p-2 border-r text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => openLaborBreakdown(labor.id)}
                                                    className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                                                >
                                                    <DollarSign size={14} />
                                                    Manage Labour Cost
                                                </button>
                                            </td>
                                            {/* Total Amount */}
                                            <td className="p-2 text-right">
                                                <span className="font-semibold text-gray-800">{currency}{labor.amount.toFixed(2)}</span>
                                            </td>
                                        </tr>
                                    ))}

                                    {/* Labor Cost Breakdown Popup Modal */}
                                    {showLaborBreakdown && activeLaborId && (() => {
                                        const labor = formData.labor.find(l => l.id === activeLaborId)
                                        if (!labor) return null
                                        return (
                                            <tr>
                                                <td colSpan={5} className="p-0">
                                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowLaborBreakdown(false) }}>
                                                        <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                                                            {/* Modal Header */}
                                                        <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-5 rounded-t-2xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                                        <DollarSign size={22} />
                                                                    </div>
                                                                    <div>
                                                                        <h2 className="text-lg font-bold">Labour Cost Breakdown</h2>
                                                                        <p className="text-slate-300 text-xs">{labor.description || 'Direct Labour'}</p>
                                                                    </div>
                                                                </div>
                                                                <button type="button" onClick={() => setShowLaborBreakdown(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                                    <X size={20} />
                                                                </button>
                                                            </div>

                                                            {/* Modal Body */}
                                                            <div className="p-5 space-y-4">
                                                                {/* Gross Wages = Hours/Pieces × Rate */}
                                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">💰 Gross Wages</label>
                                                                    <p className="text-[10px] text-gray-400 mb-2">Hours/Pieces × Rate per unit</p>
                                                                    {isEditing ? (
                                                                        <div className="grid grid-cols-3 gap-3 mt-2">
                                                                            <div>
                                                                                <label className="block text-[10px] text-slate-600 font-medium mb-1">Hours / Pieces</label>
                                                                                <input
                                                                                    type="number" min="0" step="0.5"
                                                                                    value={labor.hours}
                                                                                    onChange={(e) => updateLaborItem(labor.id, 'hours', e.target.value)}
                                                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-center bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                                                                    placeholder="0"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] text-slate-600 font-medium mb-1">Rate ({currency})</label>
                                                                                <input
                                                                                    type="number" min="0" step="0.01"
                                                                                    value={labor.rate}
                                                                                    onChange={(e) => updateLaborItem(labor.id, 'rate', e.target.value)}
                                                                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-right bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                                                                                    placeholder="0"
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label className="block text-[10px] text-slate-600 font-medium mb-1">Gross Wages</label>
                                                                                <div className="px-3 py-2 bg-slate-100 rounded-lg text-right">
                                                                                    <span className="text-sm font-bold text-slate-800">{currency}{calcGrossWages(labor).toFixed(2)}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-xs text-gray-500">{labor.hours} hrs/pcs × {currency}{parseFloat(labor.rate).toFixed(2)}</span>
                                                                            <span className="font-medium text-gray-800">{currency}{calcGrossWages(labor).toFixed(2)}</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Payroll Taxes */}
                                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">🏛️ Payroll Taxes</label>
                                                                    <p className="text-[10px] text-gray-400 mb-2">PF, ESI, professional tax, social security contributions</p>
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="number" min="0" step="0.01"
                                                                            value={labor.payroll_taxes}
                                                                            onChange={(e) => updateLaborItem(labor.id, 'payroll_taxes', e.target.value)}
                                                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-right bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                                                                            placeholder="0.00"
                                                                        />
                                                                    ) : (
                                                                        <div className="text-right font-medium text-gray-800">{currency}{parseFloat(labor.payroll_taxes).toFixed(2)}</div>
                                                                    )}
                                                                </div>

                                                                {/* Benefits */}
                                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">🎁 Benefits</label>
                                                                    <p className="text-[10px] text-gray-400 mb-2">Health insurance, gratuity, leave encashment, retirement</p>
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="number" min="0" step="0.01"
                                                                            value={labor.benefits}
                                                                            onChange={(e) => updateLaborItem(labor.id, 'benefits', e.target.value)}
                                                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-right bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                                                                            placeholder="0.00"
                                                                        />
                                                                    ) : (
                                                                        <div className="text-right font-medium text-gray-800">{currency}{parseFloat(labor.benefits).toFixed(2)}</div>
                                                                    )}
                                                                </div>

                                                                {/* Other Related Expenses */}
                                                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                                                                    <label className="block text-xs font-semibold text-slate-700 mb-2">📋 Other Related Expenses</label>
                                                                    <p className="text-[10px] text-gray-400 mb-2">Training, uniforms, safety gear, meals, transport allowance</p>
                                                                    {isEditing ? (
                                                                        <input
                                                                            type="number" min="0" step="0.01"
                                                                            value={labor.other_expenses}
                                                                            onChange={(e) => updateLaborItem(labor.id, 'other_expenses', e.target.value)}
                                                                            className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-right bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                                                                            placeholder="0.00"
                                                                        />
                                                                    ) : (
                                                                        <div className="text-right font-medium text-gray-800">{currency}{parseFloat(labor.other_expenses).toFixed(2)}</div>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Modal Footer — Total */}
                                                            <div className="border-t border-gray-200 p-5 bg-gray-50 rounded-b-2xl">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm text-gray-500">
                                                                        Total Labour Cost
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-xl font-bold text-slate-800">
                                                                            {currency}{labor.amount.toFixed(2)}
                                                                        </span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setShowLaborBreakdown(false)}
                                                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                                                                        >
                                                                            Done
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })()}
                                    <tr className="bg-slate-100">
                                        <td colSpan={4} className="p-2.5 text-right font-semibold text-slate-700 border-b border-r">Total Direct Labour (B)</td>
                                        <td className="p-2.5 text-right font-bold text-slate-900 border-b text-base">{currency}{totalLaborCost.toFixed(2)}</td>
                                    </tr>

                                    {/* PRIME COST */}
                                    <tr className="bg-slate-200">
                                        <td colSpan={3} className="p-3 text-right font-bold text-slate-800 border-b border-r">PRIME COST (A + B)</td>
                                        <td className="p-3 text-right font-bold text-slate-900 border-b text-base">{currency}{primeCost.toFixed(2)}</td>
                                    </tr>

                                    {/* FACTORY OVERHEAD — single row with total */}
                                    <tr className="bg-slate-100">
                                        <td colSpan={4} className="p-3 font-semibold text-slate-800 border-b border-slate-200 border-r">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-7 h-7 bg-slate-700 text-white rounded flex items-center justify-center text-xs font-bold">C</span>
                                                    <span className="text-sm font-bold tracking-wide uppercase">Factory Overhead</span>
                                                    {(formData.indirect_materials.length + formData.indirect_labor.length + formData.other_indirect.length) > 0 && (
                                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                                            {formData.indirect_materials.length + formData.indirect_labor.length + formData.other_indirect.length} items
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOverheadModal('indirect_materials')}
                                                    className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                                                >
                                                    <Settings size={14} /> Manage Factory Overhead
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-900 border-b border-slate-200 text-base">
                                            {currency}{totalOverhead.toFixed(2)}
                                        </td>
                                    </tr>

                                    {/* ═══════════════════════════════════════════ */}
                                    {/* UNIFIED FACTORY OVERHEAD POPUP MODAL       */}
                                    {/* ═══════════════════════════════════════════ */}
                                    {showOverheadModal && (() => {
                                        const allGroups: { key: 'indirect_materials' | 'indirect_labor' | 'other_indirect'; title: string; icon: string; examples: string; color: string }[] = [
                                            { key: 'indirect_materials', title: 'Indirect Materials', icon: '📦', examples: 'e.g., Lubricants, Cleaning supplies, Gloves, Small tools', color: 'purple' },
                                            { key: 'indirect_labor', title: 'Indirect Labour', icon: '👷', examples: 'e.g., Supervisor salary, Security, Maintenance staff', color: 'violet' },
                                            { key: 'other_indirect', title: 'Other Indirect Factory Costs', icon: '🏭', examples: 'e.g., Rent, Utilities, Depreciation, Insurance, Repairs', color: 'fuchsia' }
                                        ]
                                        return (
                                            <tr>
                                                <td colSpan={5} className="p-0">
                                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowOverheadModal(null) }}>
                                                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                                                            {/* Modal Header */}
                                                            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-5 rounded-t-2xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">🏭</div>
                                                                    <div>
                                                                        <h2 className="text-lg font-bold">Factory Overhead</h2>
                                                                        <p className="text-slate-300 text-xs">Manage all indirect factory costs</p>
                                                                    </div>
                                                                </div>
                                                                <button type="button" onClick={() => setShowOverheadModal(null)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                                    <X size={20} />
                                                                </button>
                                                            </div>

                                                            {/* Modal Body — 3 Sections */}
                                                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                                                {allGroups.map((group) => {
                                                                    const items = formData[group.key]
                                                                    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
                                                                    return (
                                                                        <div key={group.key} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                                                            {/* Section Header */}
                                                                            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-lg">{group.icon}</span>
                                                                                    <span className="font-semibold text-slate-700 text-sm">{group.title}</span>
                                                                                    {items.length > 0 && (
                                                                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{items.length}</span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-sm font-bold text-slate-700">{currency}{subtotal.toFixed(2)}</span>
                                                                                    {isEditing && (
                                                                                        <button type="button" onClick={() => addOverheadItem(group.key)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition-colors">
                                                                                            <PlusCircle size={14} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {/* Section Items */}
                                                                            <div className="p-3 space-y-2">
                                                                                {items.length === 0 ? (
                                                                                    <p className="text-xs text-gray-400 text-center py-2">{group.examples}</p>
                                                                                ) : (
                                                                                    <>
                                                                                        {items.map((item, index) => (
                                                                                            <div key={item.id} className="flex items-center gap-2 group">
                                                                                                <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</span>
                                                                                                {isEditing ? (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Description..."
                                                                                                            value={item.description}
                                                                                                            onChange={(e) => updateOverheadItem(group.key, item.id, 'description', e.target.value)}
                                                                                                            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                                                                                        />
                                                                                                        <input
                                                                                                            type="number" min="0" step="0.01"
                                                                                                            value={item.amount}
                                                                                                            onChange={(e) => updateOverheadItem(group.key, item.id, 'amount', e.target.value)}
                                                                                                            className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg text-right bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                                                                                                            placeholder="0.00"
                                                                                                        />
                                                                                                        <button type="button" onClick={() => removeOverheadItem(group.key, item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded transition-all shrink-0">
                                                                                                            <Trash2 size={14} />
                                                                                                        </button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        <span className="flex-1 text-sm text-gray-700">{item.description || `Item ${index + 1}`}</span>
                                                                                                        <span className="text-sm font-semibold text-gray-800">{currency}{(parseFloat(item.amount) || 0).toFixed(2)}</span>
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>

                                                            {/* Modal Footer */}
                                                            <div className="border-t border-gray-200 p-5 bg-gray-50 rounded-b-2xl">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm text-gray-500">
                                                                        {formData.indirect_materials.length + formData.indirect_labor.length + formData.other_indirect.length} total items
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-xl font-bold text-slate-800">{currency}{totalOverhead.toFixed(2)}</span>
                                                                        <button type="button" onClick={() => setShowOverheadModal(null)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Done</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })()}

                                    {/* Total Manufacturing Overhead */}
                                    <tr className="bg-slate-100">
                                        <td colSpan={4} className="p-2.5 text-right font-semibold text-slate-700 border-b border-r">
                                            Total Factory Overhead (C)
                                        </td>
                                        <td className="p-2.5 text-right font-bold text-slate-900 border-b text-base">{currency}{totalOverhead.toFixed(2)}</td>
                                    </tr>

                                    {/* FACTORY COST */}
                                    <tr className="bg-slate-200">
                                        <td colSpan={3} className="p-3 text-right font-bold text-slate-800 border-b border-r">FACTORY COST (Prime + C)</td>
                                        <td className="p-3 text-right font-bold text-slate-900 border-b text-base">{currency}{factoryCost.toFixed(2)}</td>
                                    </tr>

                                    {/* ADMIN, SELLING & DISTRIBUTION EXPENSES — single row with total */}
                                    <tr className="bg-slate-100">
                                        <td colSpan={4} className="p-3 font-semibold text-slate-800 border-b border-slate-200 border-r">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-7 h-7 bg-slate-700 text-white rounded flex items-center justify-center text-xs font-bold">D</span>
                                                    <span className="text-sm font-bold tracking-wide uppercase">Admin, Selling & Distribution</span>
                                                    {(formData.admin_costs.length + formData.selling_costs.length + formData.distribution_costs.length) > 0 && (
                                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">
                                                            {formData.admin_costs.length + formData.selling_costs.length + formData.distribution_costs.length} items
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowExpenseModal(true)}
                                                    className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
                                                >
                                                    <Briefcase size={14} /> Manage Expenses
                                                </button>
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-bold text-slate-900 border-b border-slate-200 text-base">
                                            {currency}{totalASD.toFixed(2)}
                                        </td>
                                    </tr>

                                    {/* ═══════════════════════════════════════════ */}
                                    {/* UNIFIED ADMIN/SELLING/DISTRIBUTION POPUP   */}
                                    {/* ═══════════════════════════════════════════ */}
                                    {showExpenseModal && (() => {
                                        const expenseGroups: { key: 'admin_costs' | 'selling_costs' | 'distribution_costs'; title: string; icon: string; examples: string }[] = [
                                            { key: 'admin_costs', title: 'Administrative Costs', icon: '🏢', examples: 'e.g., Office rent, Stationery, Accounting, Legal fees' },
                                            { key: 'selling_costs', title: 'Selling Costs', icon: '📊', examples: 'e.g., Advertising, Sales commission, Packaging, Showroom' },
                                            { key: 'distribution_costs', title: 'Distribution Costs', icon: '🚚', examples: 'e.g., Freight, Warehousing, Delivery charges, Insurance' }
                                        ]
                                        return (
                                            <tr>
                                                <td colSpan={5} className="p-0">
                                                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowExpenseModal(false) }}>
                                                        <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                                                            {/* Modal Header */}
                                                            <div className="bg-gradient-to-r from-slate-700 to-slate-800 text-white p-5 rounded-t-2xl flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">💼</div>
                                                                    <div>
                                                                        <h2 className="text-lg font-bold">Admin, Selling & Distribution</h2>
                                                                        <p className="text-slate-300 text-xs">Manage all non-manufacturing expenses</p>
                                                                    </div>
                                                                </div>
                                                                <button type="button" onClick={() => setShowExpenseModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                                                    <X size={20} />
                                                                </button>
                                                            </div>

                                                            {/* Modal Body — 3 Sections */}
                                                            <div className="flex-1 overflow-y-auto p-5 space-y-5">
                                                                {expenseGroups.map((group) => {
                                                                    const items = formData[group.key]
                                                                    const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0)
                                                                    return (
                                                                        <div key={group.key} className="bg-gray-50 border border-gray-200 rounded-xl overflow-hidden">
                                                                            {/* Section Header */}
                                                                            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-lg">{group.icon}</span>
                                                                                    <span className="font-semibold text-slate-700 text-sm">{group.title}</span>
                                                                                    {items.length > 0 && (
                                                                                        <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full">{items.length}</span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-sm font-bold text-slate-700">{currency}{subtotal.toFixed(2)}</span>
                                                                                    {isEditing && (
                                                                                        <button type="button" onClick={() => addOverheadItem(group.key)} className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-lg transition-colors">
                                                                                            <PlusCircle size={14} />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            {/* Section Items */}
                                                                            <div className="p-3 space-y-2">
                                                                                {items.length === 0 ? (
                                                                                    <p className="text-xs text-gray-400 text-center py-2">{group.examples}</p>
                                                                                ) : (
                                                                                    <>
                                                                                        {items.map((item, index) => (
                                                                                            <div key={item.id} className="flex items-center gap-2 group">
                                                                                                <span className="w-5 h-5 bg-slate-200 text-slate-600 rounded flex items-center justify-center text-[10px] font-bold shrink-0">{index + 1}</span>
                                                                                                {isEditing ? (
                                                                                                    <>
                                                                                                        <input
                                                                                                            type="text"
                                                                                                            placeholder="Description..."
                                                                                                            value={item.description}
                                                                                                            onChange={(e) => updateOverheadItem(group.key, item.id, 'description', e.target.value)}
                                                                                                            className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                                                                                                        />
                                                                                                        <input
                                                                                                            type="number" min="0" step="0.01"
                                                                                                            value={item.amount}
                                                                                                            onChange={(e) => updateOverheadItem(group.key, item.id, 'amount', e.target.value)}
                                                                                                            className="w-24 px-2.5 py-1.5 border border-gray-200 rounded-lg text-right bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm font-medium"
                                                                                                            placeholder="0.00"
                                                                                                        />
                                                                                                        <button type="button" onClick={() => removeOverheadItem(group.key, item.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 rounded transition-all shrink-0">
                                                                                                            <Trash2 size={14} />
                                                                                                        </button>
                                                                                                    </>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        <span className="flex-1 text-sm text-gray-700">{item.description || `Item ${index + 1}`}</span>
                                                                                                        <span className="text-sm font-semibold text-gray-800">{currency}{(parseFloat(item.amount) || 0).toFixed(2)}</span>
                                                                                                    </>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>

                                                            {/* Modal Footer */}
                                                            <div className="border-t border-gray-200 p-5 bg-gray-50 rounded-b-2xl">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="text-sm text-gray-500">
                                                                        {formData.admin_costs.length + formData.selling_costs.length + formData.distribution_costs.length} total items
                                                                    </div>
                                                                    <div className="flex items-center gap-4">
                                                                        <span className="text-xl font-bold text-slate-800">{currency}{totalASD.toFixed(2)}</span>
                                                                        <button type="button" onClick={() => setShowExpenseModal(false)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">Done</button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })()}

                                    {/* TOTAL COST */}
                                    <tr className="bg-slate-800 text-white">
                                        <td colSpan={3} className="p-4 font-bold text-base">TOTAL COST OF PRODUCTION</td>
                                        <td className="p-4 text-right font-bold text-lg">{currency}{totalCost.toFixed(2)}</td>
                                    </tr>

                                    {/* COST PER UNIT */}
                                    <tr className="bg-blue-600 text-white">
                                        <td colSpan={3} className="p-4 font-bold text-base">COST PER UNIT</td>
                                        <td className="p-4 text-right font-bold text-lg">{currency}{costPerUnit.toFixed(2)}</td>
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

                        {/* Action Buttons - Save, Print, PDF in single line */}
                        <div className="p-4 bg-gray-50 border-t print:hidden">
                            <div className="flex items-center justify-center gap-3">
                                {isEditing && (
                                    <button type="submit" disabled={saving || products.length === 0} className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors">
                                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                                        {currentSheet ? 'Update' : 'Save'} Cost Sheet
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => window.print()}
                                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors"
                                >
                                    <Printer size={20} />
                                    Print
                                </button>
                                <button
                                    type="button"
                                    onClick={handleExportPDF}
                                    disabled={exporting}
                                    className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50"
                                >
                                    {exporting ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
