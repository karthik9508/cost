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
    // Direct Materials - Material Consumed
    opening_stock: string
    purchases: string
    carriage_inward: string
    closing_stock: string
    scrap: string
    // Labor
    labor: LaborItem[]
    // Overheads
    factory_overhead: string
    utilities: string
    depreciation: string
    other_costs: string
    notes: string
}

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
    // Direct Materials
    opening_stock: '0',
    purchases: '0',
    carriage_inward: '0',
    closing_stock: '0',
    scrap: '0',
    // Labor
    labor: [createLaborItem()],
    // Overheads
    factory_overhead: '0',
    utilities: '0',
    depreciation: '0',
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
        setExporting(true)

        const selectedProduct = products.find(p => p.id === formData.product_id)
        const productName = selectedProduct?.name || 'Product'
        const productUnit = selectedProduct?.unit || 'units'

        // Calculate all totals for the PDF
        // Direct Material Consumed = Opening Stock + Purchases + Carriage Inward - Closing Stock - Scrap
        const openingStockVal = parseFloat(formData.opening_stock) || 0
        const purchasesVal = parseFloat(formData.purchases) || 0
        const carriageInwardVal = parseFloat(formData.carriage_inward) || 0
        const closingStockVal = parseFloat(formData.closing_stock) || 0
        const scrapVal = parseFloat(formData.scrap) || 0
        const matCost = openingStockVal + purchasesVal + carriageInwardVal - closingStockVal - scrapVal

        const labCost = formData.labor.reduce((sum, l) => sum + l.amount, 0)
        const primeCostVal = matCost + labCost
        const factoryOverheadVal = parseFloat(formData.factory_overhead) || 0
        const utilitiesVal = parseFloat(formData.utilities) || 0
        const depreciationVal = parseFloat(formData.depreciation) || 0
        const overheadVal = factoryOverheadVal + utilitiesVal + depreciationVal
        const factoryCostVal = primeCostVal + overheadVal
        const otherCostsVal = parseFloat(formData.other_costs) || 0
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

        // Build materials rows - formula based
        const materialsRows = `
            <tr>
                <td colspan="3" style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; padding-left: 30px;">Opening Stock of Raw Materials</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px;">${currency}${openingStockVal.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; padding-left: 30px;">Add: Purchases</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px;">${currency}${purchasesVal.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; padding-left: 30px;">Add: Carriage Inward</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px;">${currency}${carriageInwardVal.toFixed(2)}</td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; padding-left: 30px; color: #dc2626;">Less: Closing Stock</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px; color: #dc2626;">(${currency}${closingStockVal.toFixed(2)})</td>
            </tr>
            <tr>
                <td colspan="3" style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px; padding-left: 30px; color: #dc2626;">Less: Scrap</td>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 12px; color: #dc2626;">(${currency}${scrapVal.toFixed(2)})</td>
            </tr>
        `

        // Build labor rows - compact
        const laborRows = formData.labor.map((l, i) => `
            <tr>
                <td style="padding: 6px 10px; border-bottom: 1px solid #e5e7eb; font-size: 12px;">${i + 1}. ${l.description || 'Labor'}</td>
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
                                <td colspan="4"><span class="badge">A</span>Direct Materials</td>
                            </tr>
                            ${materialsRows}
                            <tr class="subtotal-row">
                                <td colspan="3" style="text-align: right; color: #1e40af;">Total Materials</td>
                                <td style="text-align: right; color: #1e40af;">${currency}${matCost.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Labor -->
                            <tr class="section-row labor">
                                <td colspan="4"><span class="badge">B</span>Direct Labor</td>
                            </tr>
                            ${laborRows}
                            <tr class="subtotal-row">
                                <td colspan="3" style="text-align: right; color: #166534;">Total Labor</td>
                                <td style="text-align: right; color: #166534;">${currency}${labCost.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Prime Cost -->
                            <tr class="prime-row">
                                <td colspan="3" style="text-align: right;">PRIME COST (A + B)</td>
                                <td style="text-align: right;">${currency}${primeCostVal.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Overhead -->
                            <tr class="section-row overhead">
                                <td colspan="4"><span class="badge">C</span>Manufacturing Overhead</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #e5e7eb; padding-left: 30px;">1. Factory Overhead</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; border-bottom: 1px solid #e5e7eb;">${currency}${factoryOverheadVal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #e5e7eb; padding-left: 30px;">2. Utilities</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; border-bottom: 1px solid #e5e7eb;">${currency}${utilitiesVal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #e5e7eb; padding-left: 30px;">3. Depreciation</td>
                                <td style="padding: 6px 10px; text-align: right; font-size: 12px; border-bottom: 1px solid #e5e7eb;">${currency}${depreciationVal.toFixed(2)}</td>
                            </tr>
                            <tr class="subtotal-row">
                                <td colspan="3" style="text-align: right; color: #6b21a8;">Total Manufacturing Overhead</td>
                                <td style="text-align: right; color: #6b21a8;">${currency}${overheadVal.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Factory Cost -->
                            <tr class="factory-row">
                                <td colspan="3" style="text-align: right;">FACTORY COST (Prime + C)</td>
                                <td style="text-align: right;">${currency}${factoryCostVal.toFixed(2)}</td>
                            </tr>
                            
                            <!-- Other Costs -->
                            <tr class="section-row other">
                                <td colspan="4"><span class="badge">D</span>Other Costs</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #e5e7eb;">Admin, Selling & Distribution Expenses</td>
                                <td style="padding: 6px 10px; text-align: right; font-weight: 600; font-size: 12px; border-bottom: 1px solid #e5e7eb;">${currency}${otherCostsVal.toFixed(2)}</td>
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
                                    <span class="label">Direct Labor</span>
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
                    updated.amount = (parseFloat(updated.hours) || 0) * (parseFloat(updated.rate) || 0)
                    return updated
                }
                return l
            })
        })
    }

    // Calculate totals
    // Direct Material Consumed = Opening Stock + Purchases + Carriage Inward - Closing Stock - Scrap
    const openingStock = parseFloat(formData.opening_stock) || 0
    const purchases = parseFloat(formData.purchases) || 0
    const carriageInward = parseFloat(formData.carriage_inward) || 0
    const closingStock = parseFloat(formData.closing_stock) || 0
    const scrap = parseFloat(formData.scrap) || 0
    const totalMaterialCost = openingStock + purchases + carriageInward - closingStock - scrap

    const totalLaborCost = formData.labor.reduce((sum, l) => sum + l.amount, 0)
    const primeCost = totalMaterialCost + totalLaborCost
    const factoryOverhead = parseFloat(formData.factory_overhead) || 0
    const utilities = parseFloat(formData.utilities) || 0
    const depreciation = parseFloat(formData.depreciation) || 0
    const totalOverhead = factoryOverhead + utilities + depreciation
    const factoryCost = primeCost + totalOverhead
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
            // Material consumed - load total material_cost into purchases as a reasonable default
            opening_stock: '0',
            purchases: sheet.material_cost.toString(),
            carriage_inward: '0',
            closing_stock: '0',
            scrap: '0',
            labor: [{ id: '1', description: 'Direct Labor', hours: sheet.labor_hours.toString(), rate: sheet.labor_rate.toString(), amount: sheet.labor_cost }],
            factory_overhead: sheet.overhead_cost.toString(),
            utilities: '0',
            depreciation: '0',
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
        form.set('overhead_cost', totalOverhead.toString())
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
                                    <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                                        <td colSpan={5} className="p-3 font-semibold text-blue-800 border-b border-blue-200">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">A</span>
                                                <span className="text-base">DIRECT MATERIALS CONSUMED</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Materials Formula Sub-header */}
                                    <tr className="bg-blue-50/50">
                                        <td colSpan={4} className="p-2 text-xs font-medium text-blue-600 border-b border-r italic">
                                            Formula: Opening Stock + Purchases + Carriage Inward - Closing Stock - Scrap
                                        </td>
                                        <td className="p-2 text-xs font-semibold text-blue-700 border-b text-right w-32">Amount</td>
                                    </tr>
                                    {/* Opening Stock */}
                                    <tr className="border-b border-gray-200 hover:bg-blue-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-medium">1</span>
                                                <span className="font-medium text-gray-700">Opening Stock of Raw Materials</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.opening_stock}
                                                    onChange={(e) => setFormData({ ...formData, opening_stock: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                                                />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.opening_stock).toFixed(2)}</span>}
                                        </td>
                                    </tr>
                                    {/* Add: Purchases */}
                                    <tr className="border-b border-gray-200 hover:bg-blue-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-medium">+</span>
                                                <span className="font-medium text-gray-700">Add: Purchases</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.purchases}
                                                    onChange={(e) => setFormData({ ...formData, purchases: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                                                />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.purchases).toFixed(2)}</span>}
                                        </td>
                                    </tr>
                                    {/* Add: Carriage Inward */}
                                    <tr className="border-b border-gray-200 hover:bg-blue-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-medium">+</span>
                                                <span className="font-medium text-gray-700">Add: Carriage Inward</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.carriage_inward}
                                                    onChange={(e) => setFormData({ ...formData, carriage_inward: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none"
                                                />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.carriage_inward).toFixed(2)}</span>}
                                        </td>
                                    </tr>
                                    {/* Less: Closing Stock */}
                                    <tr className="border-b border-gray-200 hover:bg-red-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center text-xs font-medium">−</span>
                                                <span className="font-medium text-gray-700">Less: Closing Stock</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.closing_stock}
                                                    onChange={(e) => setFormData({ ...formData, closing_stock: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                                                />
                                            ) : <span className="font-medium text-red-600">({currency}{parseFloat(formData.closing_stock).toFixed(2)})</span>}
                                        </td>
                                    </tr>
                                    {/* Less: Scrap */}
                                    <tr className="border-b border-gray-200 hover:bg-red-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center text-xs font-medium">−</span>
                                                <span className="font-medium text-gray-700">Less: Scrap Value</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.scrap}
                                                    onChange={(e) => setFormData({ ...formData, scrap: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none"
                                                />
                                            ) : <span className="font-medium text-red-600">({currency}{parseFloat(formData.scrap).toFixed(2)})</span>}
                                        </td>
                                    </tr>
                                    {/* Total Direct Materials Consumed */}
                                    <tr className="bg-gradient-to-r from-blue-100 to-blue-200">
                                        <td colSpan={4} className="p-3 text-right font-semibold text-blue-800 border-b border-r">
                                            <span className="flex items-center justify-end gap-2">
                                                Direct Materials Consumed
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-blue-900 border-b text-lg">{currency}{totalMaterialCost.toFixed(2)}</td>
                                    </tr>

                                    {/* DIRECT LABOR SECTION */}
                                    <tr className="bg-gradient-to-r from-green-50 to-green-100">
                                        <td colSpan={5} className="p-3 font-semibold text-green-800 border-b border-green-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">B</span>
                                                    <span className="text-base">DIRECT LABOR</span>
                                                    <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded-full ml-2">{formData.labor.length} item{formData.labor.length > 1 ? 's' : ''}</span>
                                                </div>
                                                {isEditing && (
                                                    <button type="button" onClick={addLaborItem} className="flex items-center gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm">
                                                        <PlusCircle size={16} /> Add Labor
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Labor Table Header */}
                                    <tr className="bg-green-50/50">
                                        <td className="p-2 text-xs font-semibold text-green-700 border-b border-r w-2/5">Description</td>
                                        <td className="p-2 text-xs font-semibold text-green-700 border-b border-r text-center w-20">Hrs</td>
                                        <td className="p-2 text-xs font-semibold text-green-700 border-b border-r text-center w-20">Wages</td>
                                        <td className="p-2 text-xs font-semibold text-green-700 border-b border-r text-right w-28">Rate/Hr</td>
                                        <td className="p-2 text-xs font-semibold text-green-700 border-b text-right w-32">Amount</td>
                                    </tr>
                                    {formData.labor.map((labor, index) => (
                                        <tr key={labor.id} className="border-b border-gray-200 hover:bg-green-50/30 transition-colors group">
                                            <td className="p-2 border-r">
                                                {isEditing ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-6 h-6 bg-green-100 text-green-600 rounded flex items-center justify-center text-xs font-medium">{index + 1}</span>
                                                        <input
                                                            type="text"
                                                            placeholder="Labor description..."
                                                            value={labor.description}
                                                            onChange={(e) => updateLaborItem(labor.id, 'description', e.target.value)}
                                                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none transition-all"
                                                        />
                                                        {formData.labor.length > 1 && (
                                                            <button type="button" onClick={() => removeLaborItem(labor.id)} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-all">
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 pl-2">
                                                        <span className="w-6 h-6 bg-green-100 text-green-600 rounded flex items-center justify-center text-xs font-medium">{index + 1}</span>
                                                        <span className="font-medium text-gray-700">{labor.description || `Labor ${index + 1}`}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2 border-r text-center">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.5"
                                                        value={labor.hours}
                                                        onChange={(e) => updateLaborItem(labor.id, 'hours', e.target.value)}
                                                        className="w-full px-1 py-1.5 border border-gray-200 rounded-lg text-center focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none"
                                                        placeholder="Hrs"
                                                    />
                                                ) : <span className="font-medium">{labor.hours}</span>}
                                            </td>
                                            <td className="p-2 border-r text-center">
                                                <span className="text-gray-500 text-sm">{currency}{(parseFloat(labor.hours) * parseFloat(labor.rate) || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="p-2 border-r text-right">
                                                {isEditing ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={labor.rate}
                                                        onChange={(e) => updateLaborItem(labor.id, 'rate', e.target.value)}
                                                        className="w-full px-1 py-1.5 border border-gray-200 rounded-lg text-right focus:border-green-400 focus:ring-1 focus:ring-green-400 outline-none"
                                                    />
                                                ) : <span>{currency}{parseFloat(labor.rate).toFixed(2)}/hr</span>}
                                            </td>
                                            <td className="p-2 text-right">
                                                <span className="font-semibold text-gray-800">{currency}{labor.amount.toFixed(2)}</span>
                                            </td>
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
                                    <tr className="bg-gradient-to-r from-purple-50 to-purple-100">
                                        <td colSpan={5} className="p-3 font-semibold text-purple-800 border-b border-purple-200">
                                            <div className="flex items-center gap-2">
                                                <span className="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">C</span>
                                                <span className="text-base">MANUFACTURING OVERHEAD</span>
                                                <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded-full ml-2">3 items</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* Factory Overhead */}
                                    <tr className="border-b border-gray-200 hover:bg-purple-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs font-medium">1</span>
                                                <span className="font-medium text-gray-700">Factory Overhead</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.factory_overhead}
                                                    onChange={(e) => setFormData({ ...formData, factory_overhead: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
                                                />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.factory_overhead).toFixed(2)}</span>}
                                        </td>
                                    </tr>
                                    {/* Utilities */}
                                    <tr className="border-b border-gray-200 hover:bg-purple-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs font-medium">2</span>
                                                <span className="font-medium text-gray-700">Utilities</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.utilities}
                                                    onChange={(e) => setFormData({ ...formData, utilities: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
                                                />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.utilities).toFixed(2)}</span>}
                                        </td>
                                    </tr>
                                    {/* Depreciation */}
                                    <tr className="border-b border-gray-200 hover:bg-purple-50/30">
                                        <td colSpan={4} className="p-2 border-r">
                                            <div className="flex items-center gap-2 pl-2">
                                                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs font-medium">3</span>
                                                <span className="font-medium text-gray-700">Depreciation</span>
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.depreciation}
                                                    onChange={(e) => setFormData({ ...formData, depreciation: e.target.value })}
                                                    className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-right focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
                                                />
                                            ) : <span className="font-medium">{currency}{parseFloat(formData.depreciation).toFixed(2)}</span>}
                                        </td>
                                    </tr>
                                    {/* Total Manufacturing Overhead */}
                                    <tr className="bg-gradient-to-r from-purple-100 to-purple-200">
                                        <td colSpan={4} className="p-3 text-right font-semibold text-purple-800 border-b border-r">
                                            <span className="flex items-center justify-end gap-2">
                                                Total Manufacturing Overhead
                                                <span className="text-xs bg-purple-300 text-purple-800 px-2 py-0.5 rounded-full">3 items</span>
                                            </span>
                                        </td>
                                        <td className="p-3 text-right font-bold text-purple-900 border-b text-lg">{currency}{totalOverhead.toFixed(2)}</td>
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
