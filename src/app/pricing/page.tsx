'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    DollarSign,
    Loader2,
    Save,
    Trash2,
    Calculator,
    TrendingUp,
    Target,
    BarChart3,
    ChevronDown
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getPricingDecisions, createPricingDecision, deletePricingDecision, PricingDecision } from './actions'
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

type PricingMethod = 'cost_plus' | 'desired_profit' | 'market_basis'

export default function PricingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [costSheets, setCostSheets] = useState<CostSheet[]>([])
    const [decisions, setDecisions] = useState<PricingDecision[]>([])
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Form state
    const [selectedCostSheet, setSelectedCostSheet] = useState<string>('')
    const [pricingMethod, setPricingMethod] = useState<PricingMethod>('cost_plus')
    const [costPerUnit, setCostPerUnit] = useState<number>(0)
    const [markupPercentage, setMarkupPercentage] = useState<string>('25')
    const [profitMargin, setProfitMargin] = useState<string>('20')
    const [profitAmount, setProfitAmount] = useState<string>('')
    const [profitInputMode, setProfitInputMode] = useState<'percentage' | 'amount'>('percentage')
    const [competitorPrice, setCompetitorPrice] = useState<string>('')
    const [notes, setNotes] = useState<string>('')

    const currency = currencySymbols[settings?.currency || 'INR'] || '₹'

    useEffect(() => {
        async function loadData() {
            const user = await getUser()
            if (!user) {
                router.push('/login')
                return
            }
            const [sheetsData, decisionsData, settingsData] = await Promise.all([
                getCostSheets(),
                getPricingDecisions(),
                getSettings()
            ])
            setCostSheets(sheetsData)
            setDecisions(decisionsData)
            setSettings(settingsData)
            setLoading(false)
        }
        loadData()
    }, [router])

    // When cost sheet is selected, update cost per unit
    useEffect(() => {
        if (selectedCostSheet) {
            const sheet = costSheets.find(s => s.id === selectedCostSheet)
            if (sheet) {
                setCostPerUnit(sheet.cost_per_unit)
            }
        }
    }, [selectedCostSheet, costSheets])

    // Calculate selling price based on method
    const calculateSellingPrice = (): number => {
        if (pricingMethod === 'cost_plus') {
            const markup = parseFloat(markupPercentage) || 0
            return costPerUnit * (1 + markup / 100)
        } else if (pricingMethod === 'desired_profit') {
            if (profitInputMode === 'amount') {
                // Amount-based: Selling Price = Cost + Profit Amount
                const profitAmt = parseFloat(profitAmount) || 0
                return costPerUnit + profitAmt
            } else {
                // Percentage-based: Selling Price = Cost / (1 - Margin%)
                const margin = parseFloat(profitMargin) || 0
                if (margin >= 100) return costPerUnit * 10 // Cap at 10x
                return costPerUnit / (1 - margin / 100)
            }
        } else {
            return parseFloat(competitorPrice) || 0
        }
    }

    // Calculate the margin percentage when using amount mode
    const calculatedMarginFromAmount = (): number => {
        const profitAmt = parseFloat(profitAmount) || 0
        const sellingPriceFromAmount = costPerUnit + profitAmt
        if (sellingPriceFromAmount > 0) {
            return (profitAmt / sellingPriceFromAmount) * 100
        }
        return 0
    }

    const sellingPrice = calculateSellingPrice()
    const profit = sellingPrice - costPerUnit
    const actualMargin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0
    const actualMarkup = costPerUnit > 0 ? (profit / costPerUnit) * 100 : 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        const formData = new FormData()
        formData.set('cost_sheet_id', selectedCostSheet)
        formData.set('pricing_method', pricingMethod)
        formData.set('cost_per_unit', costPerUnit.toString())
        formData.set('selling_price', sellingPrice.toString())

        if (pricingMethod === 'cost_plus') {
            formData.set('markup_percentage', markupPercentage)
        } else if (pricingMethod === 'desired_profit') {
            formData.set('profit_margin', profitMargin)
        } else {
            formData.set('competitor_price', competitorPrice)
        }
        formData.set('notes', notes)

        const result = await createPricingDecision(formData)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: result.success || 'Saved!' })
            const data = await getPricingDecisions()
            setDecisions(data)
            // Reset form
            setSelectedCostSheet('')
            setCostPerUnit(0)
            setNotes('')
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this pricing decision?')) return

        const result = await deletePricingDecision(id)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            const data = await getPricingDecisions()
            setDecisions(data)
        }
    }

    const getMethodLabel = (method: string) => {
        switch (method) {
            case 'cost_plus': return 'Cost Plus'
            case 'desired_profit': return 'Desired Profit'
            case 'market_basis': return 'Market Basis'
            default: return method
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
                <div className="p-6 max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Pricing Decision</h1>
                        <p className="text-gray-500 mt-1">Calculate optimal selling prices using different methods</p>
                    </div>

                    {/* Warning if no cost sheets */}
                    {costSheets.length === 0 && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                            ⚠️ Create a cost sheet first. <a href="/cost-sheet" className="underline font-medium">Go to Cost Sheet →</a>
                        </div>
                    )}

                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Pricing Calculator */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Calculator size={20} />
                                    Pricing Calculator
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="p-4 space-y-4">
                                {/* Select Cost Sheet */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Select Cost Sheet
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={selectedCostSheet}
                                            onChange={(e) => setSelectedCostSheet(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Select a cost sheet...</option>
                                            {costSheets.map((sheet) => (
                                                <option key={sheet.id} value={sheet.id}>
                                                    {sheet.sheet_number} - {sheet.product?.name} ({currency}{sheet.cost_per_unit.toFixed(2)}/unit)
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Cost Per Unit Display */}
                                {selectedCostSheet && (
                                    <div className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                                        <span className="text-gray-600">Cost Per Unit:</span>
                                        <span className="text-xl font-bold text-gray-800">{currency}{costPerUnit.toFixed(2)}</span>
                                    </div>
                                )}

                                {/* Pricing Method Tabs */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPricingMethod('cost_plus')}
                                            className={`p-3 rounded-lg border-2 text-center transition-all ${pricingMethod === 'cost_plus'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs font-medium">Cost Plus</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPricingMethod('desired_profit')}
                                            className={`p-3 rounded-lg border-2 text-center transition-all ${pricingMethod === 'desired_profit'
                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <Target className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs font-medium">Desired Profit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPricingMethod('market_basis')}
                                            className={`p-3 rounded-lg border-2 text-center transition-all ${pricingMethod === 'market_basis'
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <BarChart3 className="w-5 h-5 mx-auto mb-1" />
                                            <span className="text-xs font-medium">Market Basis</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Method-specific inputs */}
                                {pricingMethod === 'cost_plus' && (
                                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                                        <label className="block text-sm font-medium text-blue-800 mb-2">
                                            Markup Percentage (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={markupPercentage}
                                            onChange={(e) => setMarkupPercentage(e.target.value)}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-blue-600 mt-2">
                                            Formula: Cost × (1 + {markupPercentage}%) = Selling Price
                                        </p>
                                    </div>
                                )}

                                {pricingMethod === 'desired_profit' && (
                                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                                        {/* Toggle between Percentage and Amount */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <button
                                                type="button"
                                                onClick={() => setProfitInputMode('percentage')}
                                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${profitInputMode === 'percentage'
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                                                    }`}
                                            >
                                                By Percentage
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setProfitInputMode('amount')}
                                                className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${profitInputMode === 'amount'
                                                        ? 'bg-green-600 text-white'
                                                        : 'bg-white text-green-700 border border-green-300 hover:bg-green-100'
                                                    }`}
                                            >
                                                By Amount
                                            </button>
                                        </div>

                                        {profitInputMode === 'percentage' ? (
                                            <>
                                                <label className="block text-sm font-medium text-green-800 mb-2">
                                                    Desired Profit Margin (%)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    min="0"
                                                    max="99"
                                                    value={profitMargin}
                                                    onChange={(e) => setProfitMargin(e.target.value)}
                                                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                                <p className="text-xs text-green-600 mt-2">
                                                    Formula: Cost ÷ (1 - {profitMargin}%) = Selling Price
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <label className="block text-sm font-medium text-green-800 mb-2">
                                                    Desired Profit Amount ({currency})
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={profitAmount}
                                                    onChange={(e) => setProfitAmount(e.target.value)}
                                                    placeholder="Enter profit amount needed"
                                                    className="w-full px-3 py-2 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                                {costPerUnit > 0 && parseFloat(profitAmount) > 0 && (
                                                    <div className="mt-3 p-2 bg-green-100 rounded-lg">
                                                        <p className="text-sm text-green-800">
                                                            <span className="font-medium">Required Margin:</span> {calculatedMarginFromAmount().toFixed(2)}%
                                                        </p>
                                                        <p className="text-xs text-green-600 mt-1">
                                                            Formula: Cost ({currency}{costPerUnit.toFixed(2)}) + Profit ({currency}{profitAmount}) = Selling Price
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}

                                {pricingMethod === 'market_basis' && (
                                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                                        <label className="block text-sm font-medium text-purple-800 mb-2">
                                            Competitor / Market Price ({currency})
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={competitorPrice}
                                            onChange={(e) => setCompetitorPrice(e.target.value)}
                                            placeholder="Enter market price"
                                            className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                        <p className="text-xs text-purple-600 mt-2">
                                            Set your price based on competitor analysis
                                        </p>
                                    </div>
                                )}

                                {/* Result */}
                                {selectedCostSheet && (
                                    <div className="bg-gray-900 rounded-lg p-4 text-white space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Selling Price:</span>
                                            <span className="text-2xl font-bold">{currency}{sellingPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="border-t border-gray-700 pt-3 grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-400">Profit/Unit:</span>
                                                <span className={`ml-2 font-medium ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {currency}{profit.toFixed(2)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Margin:</span>
                                                <span className={`ml-2 font-medium ${actualMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    {actualMargin.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-400">Markup:</span>
                                                <span className={`ml-2 font-medium ${actualMarkup >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                                    {actualMarkup.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Notes */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                        placeholder="Any notes about this pricing decision..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={saving || !selectedCostSheet || costSheets.length === 0}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={20} />}
                                    Save Pricing Decision
                                </button>
                            </form>
                        </div>

                        {/* Saved Decisions */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white p-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <DollarSign size={20} />
                                    Saved Pricing Decisions
                                </h2>
                            </div>

                            <div className="p-4">
                                {decisions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No pricing decisions yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                                        {decisions.map((decision) => (
                                            <div key={decision.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-medium text-gray-800">
                                                            {decision.cost_sheet?.product?.name}
                                                        </h3>
                                                        <span className="text-xs text-gray-500">
                                                            {decision.cost_sheet?.sheet_number}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(decision.id)}
                                                        className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Method:</span>
                                                        <span className="ml-1 font-medium">{getMethodLabel(decision.pricing_method)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Cost:</span>
                                                        <span className="ml-1">{currency}{decision.cost_per_unit.toFixed(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Selling:</span>
                                                        <span className="ml-1 font-bold text-green-600">{currency}{decision.selling_price.toFixed(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Profit:</span>
                                                        <span className="ml-1 text-blue-600">
                                                            {currency}{(decision.selling_price - decision.cost_per_unit).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {decision.notes && (
                                                    <p className="text-xs text-gray-500 mt-2 italic">{decision.notes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
