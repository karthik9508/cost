'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    FileBarChart,
    Loader2,
    FileText,
    TrendingUp,
    Package,
    DollarSign,
    Calendar,
    Eye,
    Download,
    BarChart3
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getCostSheets, CostSheet } from '@/app/cost-sheet/actions'
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

export default function ReportsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [costSheets, setCostSheets] = useState<CostSheet[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [settings, setSettings] = useState<UserSettings | null>(null)

    const currency = currencySymbols[settings?.currency || 'INR'] || '₹'

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
            setLoading(false)
        }
        loadData()
    }, [router])

    // Calculate summary statistics
    const totalCostSheets = costSheets.length
    const totalProducts = products.length
    const totalCostValue = costSheets.reduce((sum, sheet) => sum + (sheet.total_cost || 0), 0)
    const avgCostPerUnit = costSheets.length > 0
        ? costSheets.reduce((sum, sheet) => sum + (sheet.cost_per_unit || 0), 0) / costSheets.length
        : 0

    // Group cost sheets by product
    const sheetsByProduct: { [key: string]: CostSheet[] } = {}
    costSheets.forEach(sheet => {
        const productName = sheet.product?.name || 'Unknown'
        if (!sheetsByProduct[productName]) {
            sheetsByProduct[productName] = []
        }
        sheetsByProduct[productName].push(sheet)
    })

    // Cost breakdown totals
    const totalMaterials = costSheets.reduce((sum, s) => sum + (s.material_cost || 0), 0)
    const totalLabor = costSheets.reduce((sum, s) => sum + (s.labor_cost || 0), 0)
    const totalOverhead = costSheets.reduce((sum, s) => sum + (s.overhead_cost || 0), 0)
    const totalOther = costSheets.reduce((sum, s) => sum + (s.other_costs || 0), 0)

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
                <div className="p-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <FileBarChart size={28} />
                            Cost Reports
                        </h1>
                        <p className="text-gray-500 mt-1">Summary of all cost sheets and analytics</p>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <FileText size={20} />
                                </div>
                                <span className="text-slate-600 font-medium">Cost Sheets</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{totalCostSheets}</div>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                    <Package size={20} />
                                </div>
                                <span className="text-slate-600 font-medium">Products</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{totalProducts}</div>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                    <DollarSign size={20} />
                                </div>
                                <span className="text-slate-600 font-medium">Total Value</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{currency}{totalCostValue.toLocaleString()}</div>
                        </div>

                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                                    <TrendingUp size={20} />
                                </div>
                                <span className="text-slate-600 font-medium">Avg Cost/Unit</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{currency}{avgCostPerUnit.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} className="text-blue-600" />
                            Cost Breakdown (All Sheets)
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
                                <div className="text-sm font-medium text-slate-500 mb-1">Materials</div>
                                <div className="text-xl font-bold text-slate-800">{currency}{totalMaterials.toLocaleString()}</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
                                <div className="text-sm font-medium text-slate-500 mb-1">Labour</div>
                                <div className="text-xl font-bold text-slate-800">{currency}{totalLabor.toLocaleString()}</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
                                <div className="text-sm font-medium text-slate-500 mb-1">Overhead</div>
                                <div className="text-xl font-bold text-slate-800">{currency}{totalOverhead.toLocaleString()}</div>
                            </div>
                            <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 text-center">
                                <div className="text-sm font-medium text-slate-500 mb-1">Other (ASD)</div>
                                <div className="text-xl font-bold text-slate-800">{currency}{totalOther.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Cost Sheets Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                <FileText size={20} className="text-blue-600" />
                                All Cost Sheets
                            </h2>
                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{costSheets.length} records</span>
                        </div>

                        {costSheets.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>No cost sheets found</p>
                                <button
                                    onClick={() => router.push('/cost-sheet')}
                                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Cost Sheet
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 text-left font-semibold text-slate-600">Sheet #</th>
                                            <th className="p-4 text-left font-semibold text-slate-600">Product</th>
                                            <th className="p-4 text-left font-semibold text-slate-600">Date</th>
                                            <th className="p-4 text-right font-semibold text-slate-600">Qty</th>
                                            <th className="p-4 text-right font-semibold text-slate-600">Materials</th>
                                            <th className="p-4 text-right font-semibold text-slate-600">Labour</th>
                                            <th className="p-4 text-right font-semibold text-slate-600">Overhead</th>
                                            <th className="p-4 text-right font-semibold text-slate-600">Total Cost</th>
                                            <th className="p-4 text-right font-semibold text-slate-600">Cost/Unit</th>
                                            <th className="p-4 text-center font-semibold text-slate-600">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {costSheets.map((sheet) => (
                                            <tr key={sheet.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-medium text-slate-800">{sheet.sheet_number}</td>
                                                <td className="p-4 text-slate-600">{sheet.product?.name || '-'}</td>
                                                <td className="p-4 text-slate-500 flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {sheet.date}
                                                </td>
                                                <td className="p-4 text-right text-slate-600">{sheet.quantity_produced}</td>
                                                <td className="p-4 text-right text-slate-600">{currency}{(sheet.material_cost || 0).toFixed(2)}</td>
                                                <td className="p-4 text-right text-slate-600">{currency}{(sheet.labor_cost || 0).toFixed(2)}</td>
                                                <td className="p-4 text-right text-slate-600">{currency}{(sheet.overhead_cost || 0).toFixed(2)}</td>
                                                <td className="p-4 text-right font-semibold text-slate-800">{currency}{(sheet.total_cost || 0).toFixed(2)}</td>
                                                <td className="p-4 text-right font-medium text-blue-600">{currency}{(sheet.cost_per_unit || 0).toFixed(2)}</td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => router.push('/cost-sheet')}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50 border-t border-slate-200 font-semibold text-slate-700">
                                        <tr>
                                            <td colSpan={4} className="p-4 text-right text-slate-500">Totals:</td>
                                            <td className="p-4 text-right">{currency}{totalMaterials.toFixed(2)}</td>
                                            <td className="p-4 text-right">{currency}{totalLabor.toFixed(2)}</td>
                                            <td className="p-4 text-right">{currency}{totalOverhead.toFixed(2)}</td>
                                            <td className="p-4 text-right text-slate-900">{currency}{totalCostValue.toFixed(2)}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Product-wise Summary */}
                    {Object.keys(sheetsByProduct).length > 0 && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
                            <div className="bg-slate-50 border-b border-slate-200 p-4">
                                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                    <Package size={20} className="text-blue-600" />
                                    Product-wise Summary
                                </h2>
                            </div>
                            <div className="p-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(sheetsByProduct).map(([productName, sheets]) => {
                                        const productTotal = sheets.reduce((sum, s) => sum + (s.total_cost || 0), 0)
                                        const avgCost = sheets.reduce((sum, s) => sum + (s.cost_per_unit || 0), 0) / sheets.length

                                        return (
                                            <div key={productName} className="border border-slate-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all bg-white">
                                                <h3 className="font-semibold text-slate-800 mb-3">{productName}</h3>
                                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                                                    <div>
                                                        <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Sheets</span>
                                                        <span className="font-medium text-slate-700">{sheets.length}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500 block text-xs uppercase tracking-wider mb-0.5">Total Value</span>
                                                        <span className="font-medium text-slate-700">{currency}{productTotal.toFixed(2)}</span>
                                                    </div>
                                                    <div className="col-span-2 pt-2 border-t border-slate-100">
                                                        <span className="text-slate-500 mr-2">Avg Cost/Unit:</span>
                                                        <span className="font-semibold text-blue-600">{currency}{avgCost.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
