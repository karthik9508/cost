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
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText size={20} />
                                <span className="text-blue-100">Cost Sheets</span>
                            </div>
                            <div className="text-3xl font-bold">{totalCostSheets}</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <Package size={20} />
                                <span className="text-green-100">Products</span>
                            </div>
                            <div className="text-3xl font-bold">{totalProducts}</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign size={20} />
                                <span className="text-purple-100">Total Cost Value</span>
                            </div>
                            <div className="text-2xl font-bold">{currency}{totalCostValue.toLocaleString()}</div>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp size={20} />
                                <span className="text-orange-100">Avg Cost/Unit</span>
                            </div>
                            <div className="text-2xl font-bold">{currency}{avgCostPerUnit.toFixed(2)}</div>
                        </div>
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <BarChart3 size={20} />
                            Cost Breakdown (All Sheets)
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-blue-600 mb-1">Materials</div>
                                <div className="text-xl font-bold text-blue-800">{currency}{totalMaterials.toLocaleString()}</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-green-600 mb-1">Labor</div>
                                <div className="text-xl font-bold text-green-800">{currency}{totalLabor.toLocaleString()}</div>
                            </div>
                            <div className="bg-purple-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-purple-600 mb-1">Overhead</div>
                                <div className="text-xl font-bold text-purple-800">{currency}{totalOverhead.toLocaleString()}</div>
                            </div>
                            <div className="bg-orange-50 rounded-lg p-4 text-center">
                                <div className="text-sm text-orange-600 mb-1">Other</div>
                                <div className="text-xl font-bold text-orange-800">{currency}{totalOther.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>

                    {/* Cost Sheets Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4 flex justify-between items-center">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <FileText size={20} />
                                All Cost Sheets
                            </h2>
                            <span className="text-sm text-gray-300">{costSheets.length} records</span>
                        </div>

                        {costSheets.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
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
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3 text-left font-semibold text-gray-700">Sheet #</th>
                                            <th className="p-3 text-left font-semibold text-gray-700">Product</th>
                                            <th className="p-3 text-left font-semibold text-gray-700">Date</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Qty</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Materials</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Labor</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Overhead</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Total Cost</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Cost/Unit</th>
                                            <th className="p-3 text-center font-semibold text-gray-700">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {costSheets.map((sheet, index) => (
                                            <tr key={sheet.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                                <td className="p-3 font-medium text-gray-800">{sheet.sheet_number}</td>
                                                <td className="p-3 text-gray-600">{sheet.product?.name || '-'}</td>
                                                <td className="p-3 text-gray-600 flex items-center gap-1">
                                                    <Calendar size={14} />
                                                    {sheet.date}
                                                </td>
                                                <td className="p-3 text-right text-gray-700">{sheet.quantity_produced}</td>
                                                <td className="p-3 text-right text-blue-600">{currency}{(sheet.material_cost || 0).toFixed(2)}</td>
                                                <td className="p-3 text-right text-green-600">{currency}{(sheet.labor_cost || 0).toFixed(2)}</td>
                                                <td className="p-3 text-right text-purple-600">{currency}{(sheet.overhead_cost || 0).toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold text-gray-800">{currency}{(sheet.total_cost || 0).toFixed(2)}</td>
                                                <td className="p-3 text-right font-semibold text-orange-600">{currency}{(sheet.cost_per_unit || 0).toFixed(2)}</td>
                                                <td className="p-3 text-center">
                                                    <button
                                                        onClick={() => router.push('/cost-sheet')}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                                                        title="View"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-gray-100 font-semibold">
                                        <tr>
                                            <td colSpan={4} className="p-3 text-right">Totals:</td>
                                            <td className="p-3 text-right text-blue-700">{currency}{totalMaterials.toFixed(2)}</td>
                                            <td className="p-3 text-right text-green-700">{currency}{totalLabor.toFixed(2)}</td>
                                            <td className="p-3 text-right text-purple-700">{currency}{totalOverhead.toFixed(2)}</td>
                                            <td className="p-3 text-right text-gray-900">{currency}{totalCostValue.toFixed(2)}</td>
                                            <td colSpan={2}></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Product-wise Summary */}
                    {Object.keys(sheetsByProduct).length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mt-6">
                            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Package size={20} />
                                    Product-wise Summary
                                </h2>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(sheetsByProduct).map(([productName, sheets]) => {
                                        const productTotal = sheets.reduce((sum, s) => sum + (s.total_cost || 0), 0)
                                        const avgCost = sheets.reduce((sum, s) => sum + (s.cost_per_unit || 0), 0) / sheets.length

                                        return (
                                            <div key={productName} className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                                                <h3 className="font-medium text-gray-800 mb-2">{productName}</h3>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Sheets:</span>
                                                        <span className="ml-1 font-medium">{sheets.length}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Total:</span>
                                                        <span className="ml-1 font-medium text-teal-600">{currency}{productTotal.toFixed(2)}</span>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <span className="text-gray-500">Avg Cost/Unit:</span>
                                                        <span className="ml-1 font-medium text-orange-600">{currency}{avgCost.toFixed(2)}</span>
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
