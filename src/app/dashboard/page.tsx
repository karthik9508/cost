'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    TrendingUp,
    DollarSign,
    Package,
    FileSpreadsheet,
    Calculator,
    BarChart3,
    FileBarChart,
    Loader2,
    ArrowRight,
    ChevronRight,
    Activity,
    Target,
    PieChart
} from 'lucide-react'
import { getUser } from '@/app/auth/actions'
import { getProducts, Product } from '@/app/products/actions'
import { getCostSheets, CostSheet } from '@/app/cost-sheet/actions'
import { getPricingDecisions, PricingDecision } from '@/app/pricing/actions'
import { getSettings, UserSettings } from '@/app/settings/actions'

const currencySymbols: { [key: string]: string } = {
    'INR': '₹',
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'SAR': '﷼'
}

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [products, setProducts] = useState<Product[]>([])
    const [costSheets, setCostSheets] = useState<CostSheet[]>([])
    const [pricingDecisions, setPricingDecisions] = useState<PricingDecision[]>([])
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [userName, setUserName] = useState('')

    const currency = currencySymbols[settings?.currency || 'INR'] || '₹'

    useEffect(() => {
        async function loadData() {
            const user = await getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserName(user.email?.split('@')[0] || 'User')

            const [productsData, sheetsData, pricingData, settingsData] = await Promise.all([
                getProducts(),
                getCostSheets(),
                getPricingDecisions(),
                getSettings()
            ])

            setProducts(productsData)
            setCostSheets(sheetsData)
            setPricingDecisions(pricingData)
            setSettings(settingsData)
            setLoading(false)
        }
        loadData()
    }, [router])

    // Calculate statistics
    const totalProducts = products.length
    const totalCostSheets = costSheets.length
    const totalPricingDecisions = pricingDecisions.length
    const totalCostValue = costSheets.reduce((sum, s) => sum + (s.total_cost || 0), 0)
    const avgCostPerUnit = costSheets.length > 0
        ? costSheets.reduce((sum, s) => sum + (s.cost_per_unit || 0), 0) / costSheets.length
        : 0

    // Cost breakdown
    const totalMaterials = costSheets.reduce((sum, s) => sum + (s.material_cost || 0), 0)
    const totalLabor = costSheets.reduce((sum, s) => sum + (s.labor_cost || 0), 0)
    const totalOverhead = costSheets.reduce((sum, s) => sum + (s.overhead_cost || 0), 0)
    const grandTotal = totalMaterials + totalLabor + totalOverhead

    // Recent items
    const recentCostSheets = costSheets.slice(0, 5)

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <>
            {/* Header Row */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 gap-3">
                <div>
                    <h1 className="text-xl lg:text-2xl font-bold text-slate-800">
                        Welcome, {userName}
                    </h1>
                    <p className="text-slate-500 text-sm" suppressHydrationWarning>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/cost-sheet" className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                        <FileSpreadsheet size={16} />
                        New Cost Sheet
                    </Link>
                    <Link href="/reports" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm">
                        <FileBarChart size={16} />
                        Reports
                    </Link>
                </div>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-12 gap-4">
                {/* Left Column - Stats & Breakdown */}
                <div className="col-span-12 lg:col-span-8 space-y-4">
                    {/* Stats Row */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Link href="/products" className="group bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <Package className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">{totalProducts}</p>
                                    <p className="text-xs text-slate-500">Products</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/cost-sheet" className="group bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <FileSpreadsheet className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">{totalCostSheets}</p>
                                    <p className="text-xs text-slate-500">Cost Sheets</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/pricing" className="group bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <DollarSign className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">{totalPricingDecisions}</p>
                                    <p className="text-xs text-slate-500">Pricing</p>
                                </div>
                            </div>
                        </Link>

                        <Link href="/break-even" className="group bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <Target className="text-blue-600" size={20} />
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-slate-800">BEP</p>
                                    <p className="text-xs text-slate-500">Analysis</p>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Cost Summary Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <PieChart size={18} className="text-blue-600" />
                                Cost Summary
                            </h2>
                            <div className="text-right">
                                <p className="text-xs text-slate-500">Total</p>
                                <p className="text-lg font-bold text-blue-600">{currency}{totalCostValue.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Materials</span>
                                    <span className="text-xs text-slate-400">{grandTotal > 0 ? Math.round((totalMaterials / grandTotal) * 100) : 0}%</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">{currency}{totalMaterials.toLocaleString()}</p>
                                <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                                    <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: grandTotal > 0 ? `${(totalMaterials / grandTotal) * 100}%` : '0%' }} />
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Labor</span>
                                    <span className="text-xs text-slate-400">{grandTotal > 0 ? Math.round((totalLabor / grandTotal) * 100) : 0}%</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">{currency}{totalLabor.toLocaleString()}</p>
                                <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                                    <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: grandTotal > 0 ? `${(totalLabor / grandTotal) * 100}%` : '0%' }} />
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-slate-600">Overhead</span>
                                    <span className="text-xs text-slate-400">{grandTotal > 0 ? Math.round((totalOverhead / grandTotal) * 100) : 0}%</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800">{currency}{totalOverhead.toLocaleString()}</p>
                                <div className="mt-1 w-full bg-slate-200 rounded-full h-1.5">
                                    <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: grandTotal > 0 ? `${(totalOverhead / grandTotal) * 100}%` : '0%' }} />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Activity size={16} className="text-blue-600" />
                                <span className="text-sm text-slate-700">Avg Cost/Unit</span>
                            </div>
                            <span className="text-lg font-bold text-blue-600">{currency}{avgCostPerUnit.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Recent Cost Sheets */}
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <TrendingUp size={18} className="text-blue-600" />
                                Recent Cost Sheets
                            </h2>
                            <Link href="/cost-sheet" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>

                        {recentCostSheets.length === 0 ? (
                            <div className="p-6 text-center">
                                <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                <p className="text-sm text-slate-500">No cost sheets yet</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="text-left p-3 font-medium text-slate-600">Sheet #</th>
                                            <th className="text-left p-3 font-medium text-slate-600">Product</th>
                                            <th className="text-right p-3 font-medium text-slate-600">Total</th>
                                            <th className="text-right p-3 font-medium text-slate-600">Per Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {recentCostSheets.map((sheet) => (
                                            <tr key={sheet.id} className="hover:bg-slate-50">
                                                <td className="p-3 font-medium text-slate-800">{sheet.sheet_number}</td>
                                                <td className="p-3 text-slate-600">{sheet.product?.name || '-'}</td>
                                                <td className="p-3 text-right text-slate-700">{currency}{sheet.total_cost?.toFixed(2)}</td>
                                                <td className="p-3 text-right font-semibold text-blue-600">{currency}{sheet.cost_per_unit?.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Quick Actions */}
                <div className="col-span-12 lg:col-span-4 space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4">
                        <h2 className="font-semibold text-slate-800 mb-3">Quick Actions</h2>
                        <div className="space-y-2">
                            <Link href="/products" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-700 hover:text-blue-700 transition-all group">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Package size={16} className="text-blue-600" />
                                </div>
                                <span className="flex-1 text-sm font-medium">Add Product</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                            </Link>
                            <Link href="/cost-sheet" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-700 hover:text-blue-700 transition-all group">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <FileSpreadsheet size={16} className="text-blue-600" />
                                </div>
                                <span className="flex-1 text-sm font-medium">Create Cost Sheet</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                            </Link>
                            <Link href="/pricing" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-700 hover:text-blue-700 transition-all group">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <DollarSign size={16} className="text-blue-600" />
                                </div>
                                <span className="flex-1 text-sm font-medium">Set Pricing</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                            </Link>
                            <Link href="/break-even" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-700 hover:text-blue-700 transition-all group">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Calculator size={16} className="text-blue-600" />
                                </div>
                                <span className="flex-1 text-sm font-medium">Break-Even Analysis</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                            </Link>
                            <Link href="/reports" className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-blue-50 rounded-lg text-slate-700 hover:text-blue-700 transition-all group">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <BarChart3 size={16} className="text-blue-600" />
                                </div>
                                <span className="flex-1 text-sm font-medium">View Reports</span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500" />
                            </Link>
                        </div>
                    </div>

                    {/* Company Info */}
                    {settings?.business_name && (
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h2 className="font-semibold text-slate-800 mb-2">Company</h2>
                            <p className="text-slate-700 font-medium">{settings.business_name}</p>
                            {settings.address && (
                                <p className="text-sm text-slate-500 mt-1">{settings.address}</p>
                            )}
                        </div>
                    )}

                    {/* Help Card */}
                    <div className="bg-blue-600 rounded-xl p-4 text-white">
                        <h3 className="font-semibold mb-1">Need Help?</h3>
                        <p className="text-blue-100 text-sm mb-3">
                            Start by adding products, then create cost sheets.
                        </p>
                        <Link href="/settings" className="inline-flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                            Settings <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
