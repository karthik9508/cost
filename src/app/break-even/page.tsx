'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Calculator,
    Loader2,
    TrendingUp,
    DollarSign,
    Package,
    BarChart3,
    Target,
    Percent
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getCostSheets, CostSheet } from '@/app/cost-sheet/actions'
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

interface ProfitScenario {
    targetProfit: number
    unitsToSell: number
    totalSales: number
    totalProfit: number
}

export default function BreakEvenPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [costSheets, setCostSheets] = useState<CostSheet[]>([])
    const [settings, setSettings] = useState<UserSettings | null>(null)

    // Form state
    const [selectedCostSheet, setSelectedCostSheet] = useState<string>('')
    const [fixedCosts, setFixedCosts] = useState<string>('10000')
    const [sellingPrice, setSellingPrice] = useState<string>('100')

    // Cost details from cost sheet
    const [materialCost, setMaterialCost] = useState<number>(0)
    const [laborCost, setLaborCost] = useState<number>(0)
    const [overheadCost, setOverheadCost] = useState<number>(0)
    const [otherCosts, setOtherCosts] = useState<number>(0)
    const [totalVariableCost, setTotalVariableCost] = useState<number>(0)

    // Custom profit percentage
    const [customProfitPercent, setCustomProfitPercent] = useState<string>('')

    // Profit margin scenarios (including custom if entered)
    const baseProfitMargins = [0, 5, 10, 15, 20, 25, 30, 50]
    const customProfit = parseFloat(customProfitPercent)
    const profitMargins = customProfit > 0 && !baseProfitMargins.includes(customProfit)
        ? [...baseProfitMargins, customProfit].sort((a, b) => a - b)
        : baseProfitMargins

    const currency = currencySymbols[settings?.currency || 'INR'] || '₹'

    useEffect(() => {
        async function loadData() {
            const user = await getUser()
            if (!user) {
                router.push('/login')
                return
            }
            const [sheetsData, settingsData] = await Promise.all([
                getCostSheets(),
                getSettings()
            ])
            setCostSheets(sheetsData)
            setSettings(settingsData)
            setLoading(false)
        }
        loadData()
    }, [router])

    // When cost sheet is selected, fetch cost details
    useEffect(() => {
        if (selectedCostSheet) {
            const sheet = costSheets.find(s => s.id === selectedCostSheet)
            if (sheet) {
                setMaterialCost(sheet.material_cost || 0)
                setLaborCost(sheet.labor_cost || 0)
                setOverheadCost(sheet.overhead_cost || 0)
                setOtherCosts(sheet.other_costs || 0)
                const variableCost = sheet.cost_per_unit
                setTotalVariableCost(variableCost)
                setSellingPrice((variableCost * 1.3).toFixed(2)) // Default 30% markup
            }
        }
    }, [selectedCostSheet, costSheets])

    // Calculate contribution margin
    const contributionMargin = parseFloat(sellingPrice) - totalVariableCost
    const contributionRatio = parseFloat(sellingPrice) > 0 ? (contributionMargin / parseFloat(sellingPrice)) * 100 : 0

    // Calculate Break-Even Point
    const fixedCostsNum = parseFloat(fixedCosts) || 0
    const bepUnits = contributionMargin > 0 ? Math.ceil(fixedCostsNum / contributionMargin) : Infinity
    const bepSales = bepUnits !== Infinity ? bepUnits * parseFloat(sellingPrice) : Infinity

    // Calculate profit scenarios
    const calculateProfitScenarios = (): ProfitScenario[] => {
        const sellingPriceNum = parseFloat(sellingPrice) || 0

        return profitMargins.map(margin => {
            if (contributionMargin <= 0) {
                return {
                    targetProfit: margin,
                    unitsToSell: Infinity,
                    totalSales: Infinity,
                    totalProfit: 0
                }
            }

            // Target profit based on % of fixed costs
            const targetProfitAmount = (margin / 100) * fixedCostsNum

            // Units needed = (Fixed Costs + Target Profit) / Contribution Margin
            const unitsNeeded = Math.ceil((fixedCostsNum + targetProfitAmount) / contributionMargin)
            const totalSales = unitsNeeded * sellingPriceNum
            const totalProfit = (unitsNeeded * contributionMargin) - fixedCostsNum

            return {
                targetProfit: margin,
                unitsToSell: unitsNeeded,
                totalSales,
                totalProfit
            }
        })
    }

    const profitScenarios = calculateProfitScenarios()
    const maxUnits = Math.max(...profitScenarios.filter(s => s.unitsToSell !== Infinity).map(s => s.unitsToSell), 1)

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

    const selectedSheet = costSheets.find(s => s.id === selectedCostSheet)

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64 transition-all duration-300">
                <div className="p-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Break-Even Analysis</h1>
                        <p className="text-gray-500 mt-1">Calculate sales quantity needed at different profit margins</p>
                    </div>

                    {/* Warning if no cost sheets */}
                    {costSheets.length === 0 && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                            ⚠️ Create a cost sheet first. <a href="/cost-sheet" className="underline font-medium">Go to Cost Sheet →</a>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Select Cost Sheet & Parameters */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Calculator size={20} />
                                Parameters
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Sheet</label>
                                    <select
                                        value={selectedCostSheet}
                                        onChange={(e) => setSelectedCostSheet(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select...</option>
                                        {costSheets.map((sheet) => (
                                            <option key={sheet.id} value={sheet.id}>
                                                {sheet.sheet_number} - {sheet.product?.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fixed Costs ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        value={fixedCosts}
                                        onChange={(e) => setFixedCosts(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Rent, salaries, insurance, etc.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Selling Price ({currency})
                                    </label>
                                    <input
                                        type="number"
                                        value={sellingPrice}
                                        onChange={(e) => setSellingPrice(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                    <label className="block text-sm font-medium text-purple-700 mb-1">
                                        Custom Profit % (optional)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        placeholder="e.g., 35"
                                        value={customProfitPercent}
                                        onChange={(e) => setCustomProfitPercent(e.target.value)}
                                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                                    />
                                    <p className="text-xs text-purple-600 mt-1">Add your own profit target to the table</p>
                                </div>
                            </div>
                        </div>

                        {/* Cost Breakdown from Cost Sheet */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Package size={20} />
                                Variable Cost Breakdown
                            </h2>

                            {selectedCostSheet ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Direct Materials:</span>
                                        <span className="font-medium">{currency}{materialCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Direct Labor:</span>
                                        <span className="font-medium">{currency}{laborCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Manufacturing Overhead:</span>
                                        <span className="font-medium">{currency}{overheadCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Other Costs:</span>
                                        <span className="font-medium">{currency}{otherCosts.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t pt-3 flex justify-between">
                                        <span className="font-semibold text-gray-800">Variable Cost/Unit:</span>
                                        <span className="font-bold text-lg text-blue-600">{currency}{totalVariableCost.toFixed(2)}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        From: {selectedSheet?.sheet_number} ({selectedSheet?.product?.name})
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Select a cost sheet to view breakdown</p>
                                </div>
                            )}
                        </div>

                        {/* Key Metrics */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Target size={20} />
                                Key Metrics
                            </h2>

                            {selectedCostSheet ? (
                                <div className="space-y-4">
                                    <div className="bg-blue-50 rounded-lg p-3">
                                        <div className="text-sm text-blue-600 mb-1">Contribution Margin/Unit</div>
                                        <div className={`text-2xl font-bold ${contributionMargin > 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                            {currency}{contributionMargin.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-blue-500 mt-1">
                                            {contributionRatio.toFixed(1)}% of selling price
                                        </div>
                                    </div>

                                    <div className="bg-green-50 rounded-lg p-3">
                                        <div className="text-sm text-green-600 mb-1">Break-Even Point</div>
                                        <div className="text-2xl font-bold text-green-700">
                                            {bepUnits === Infinity ? 'N/A' : `${bepUnits.toLocaleString()} units`}
                                        </div>
                                        <div className="text-xs text-green-500 mt-1">
                                            {bepSales === Infinity ? '-' : `${currency}${bepSales.toLocaleString()} in sales`}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>Select a cost sheet first</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profit Margin Scenarios */}
                    {selectedCostSheet && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Percent size={20} />
                                    Units Needed at Different Profit Margins
                                </h2>
                                <p className="text-sm text-green-100 mt-1">
                                    Profit margin calculated as % of Fixed Costs ({currency}{fixedCostsNum.toLocaleString()})
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="p-3 text-left font-semibold text-gray-700">Target Profit</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Profit Amount</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Units to Sell</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Total Sales</th>
                                            <th className="p-3 text-right font-semibold text-gray-700">Actual Profit</th>
                                            <th className="p-3 text-left font-semibold text-gray-700 w-40">Progress</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profitScenarios.map((scenario, index) => {
                                            const isBreakEven = scenario.targetProfit === 0
                                            const isCustom = scenario.targetProfit === customProfit && customProfit > 0
                                            const barWidth = scenario.unitsToSell !== Infinity
                                                ? Math.min((scenario.unitsToSell / maxUnits) * 100, 100)
                                                : 100

                                            return (
                                                <tr
                                                    key={index}
                                                    className={`border-b border-gray-100 ${isCustom ? 'bg-purple-50 ring-2 ring-purple-300 ring-inset' :
                                                            isBreakEven ? 'bg-yellow-50' : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <td className="p-3">
                                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${isCustom ? 'bg-purple-200 text-purple-800' :
                                                                isBreakEven ? 'bg-yellow-100 text-yellow-700' :
                                                                    scenario.targetProfit <= 15 ? 'bg-blue-100 text-blue-700' :
                                                                        scenario.targetProfit <= 25 ? 'bg-green-100 text-green-700' :
                                                                            'bg-purple-100 text-purple-700'
                                                            }`}>
                                                            {isBreakEven ? '🎯 Break-Even' : isCustom ? `⭐ ${scenario.targetProfit}% (Custom)` : `${scenario.targetProfit}% Profit`}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right text-gray-600">
                                                        {currency}{((scenario.targetProfit / 100) * fixedCostsNum).toLocaleString()}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {scenario.unitsToSell === Infinity ? (
                                                            <span className="text-red-500">Not viable</span>
                                                        ) : (
                                                            <span className="font-bold text-gray-800">
                                                                {scenario.unitsToSell.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right text-gray-700">
                                                        {scenario.totalSales === Infinity ? '-' : `${currency}${scenario.totalSales.toLocaleString()}`}
                                                    </td>
                                                    <td className={`p-3 text-right font-medium ${scenario.totalProfit > 0 ? 'text-green-600' : 'text-gray-500'
                                                        }`}>
                                                        {scenario.unitsToSell === Infinity ? '-' : `${currency}${scenario.totalProfit.toLocaleString()}`}
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all ${scenario.unitsToSell === Infinity ? 'bg-red-400' :
                                                                    isBreakEven ? 'bg-yellow-500' :
                                                                        scenario.targetProfit <= 15 ? 'bg-blue-500' :
                                                                            'bg-green-500'
                                                                    }`}
                                                                style={{ width: `${barWidth}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Formula Reference */}
                    <div className="bg-blue-50 rounded-xl border border-blue-100 p-5">
                        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                            <Calculator size={18} />
                            Formulas Used
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
                            <div className="bg-white/50 rounded-lg p-3">
                                <strong className="block mb-1">Contribution Margin</strong>
                                <code className="text-blue-600">= Selling Price - Variable Cost/Unit</code>
                            </div>
                            <div className="bg-white/50 rounded-lg p-3">
                                <strong className="block mb-1">Break-Even Units</strong>
                                <code className="text-blue-600">= Fixed Costs ÷ Contribution Margin</code>
                            </div>
                            <div className="bg-white/50 rounded-lg p-3">
                                <strong className="block mb-1">Units for Target Profit</strong>
                                <code className="text-blue-600">= (Fixed Costs + Target Profit) ÷ Contribution Margin</code>
                            </div>
                            <div className="bg-white/50 rounded-lg p-3">
                                <strong className="block mb-1">Contribution Ratio</strong>
                                <code className="text-blue-600">= (Contribution Margin ÷ Selling Price) × 100</code>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
