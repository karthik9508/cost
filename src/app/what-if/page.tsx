'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    Clock,
    Lightbulb,
    AlertTriangle,
    FileSpreadsheet,
    BarChart3,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getUser } from '@/app/auth/actions'
import { getCostSheets } from '@/app/cost-sheet/actions'
import { getSettings, UserSettings } from '@/app/settings/actions'

interface CostAnalysisItem {
    id: string;
    sheet_number: string;
    product_name: string;
    material_cost: number;
    labor_cost: number;
    overhead_cost: number;
    other_costs: number; // ASD
    total_cost: number;
    cost_per_unit: number;
    
    // Percentages
    material_pct: number;
    labor_pct: number;
    overhead_pct: number;
    asd_pct: number;
    
    // Insights
    highest_component: 'Material' | 'Labour' | 'Overhead' | 'ASD';
    is_material_outlier: boolean;
}

type SortField = 'product_name' | 'material_pct' | 'labor_pct' | 'overhead_pct' | 'asd_pct' | 'total_cost';
type SortOrder = 'asc' | 'desc';

export default function WhatIfPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [settings, setSettings] = useState<UserSettings | null>(null)
    const [analysisData, setAnalysisData] = useState<CostAnalysisItem[]>([])
    
    // Sort state
    const [sortField, setSortField] = useState<SortField>('material_pct')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    // Summary state
    const [summaryCards, setSummaryCards] = useState({
        avgMaterialPct: 0,
        avgLaborPct: 0,
        avgOverheadPct: 0,
        avgAsdPct: 0,
    })

    const currency = settings?.currency === 'USD' ? '$' : 
                    settings?.currency === 'EUR' ? '€' : 
                    settings?.currency === 'GBP' ? '£' : '₹';

    useEffect(() => {
        async function loadData() {
            const user = await getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const [sheets, userSettings] = await Promise.all([
                getCostSheets(),
                getSettings()
            ])
            setSettings(userSettings)

            if (sheets && sheets.length > 0) {
                // First pass: Calculate basic percentages for each sheet
                let totalMatPct = 0;
                let totalLabPct = 0;
                let totalOvhPct = 0;
                let totalAsdPct = 0;
                let validCount = 0;

                const baseItems = sheets.map(sheet => {
                    const total = sheet.total_cost || 1; // prevent div by zero
                    
                    const matPct = (sheet.material_cost / total) * 100;
                    const labPct = (sheet.labor_cost / total) * 100;
                    const ovhPct = (sheet.overhead_cost / total) * 100;
                    const asdPct = (sheet.other_costs / total) * 100;

                    if (sheet.total_cost > 0) {
                        totalMatPct += matPct;
                        totalLabPct += labPct;
                        totalOvhPct += ovhPct;
                        totalAsdPct += asdPct;
                        validCount++;
                    }

                    // Determine highest component
                    const components = [
                        { name: 'Material' as const, val: sheet.material_cost },
                        { name: 'Labour' as const, val: sheet.labor_cost },
                        { name: 'Overhead' as const, val: sheet.overhead_cost },
                        { name: 'ASD' as const, val: sheet.other_costs }
                    ];
                    components.sort((a, b) => b.val - a.val);

                    return {
                        id: sheet.id,
                        sheet_number: sheet.sheet_number,
                        product_name: sheet.product?.name || 'Unknown Product',
                        material_cost: sheet.material_cost,
                        labor_cost: sheet.labor_cost,
                        overhead_cost: sheet.overhead_cost,
                        other_costs: sheet.other_costs,
                        total_cost: sheet.total_cost,
                        cost_per_unit: sheet.cost_per_unit,
                        material_pct: matPct,
                        labor_pct: labPct,
                        overhead_pct: ovhPct,
                        asd_pct: asdPct,
                        highest_component: components[0].name,
                        is_material_outlier: false // calculated in second pass
                    }
                });

                // Calculate averages
                const avgMat = validCount > 0 ? (totalMatPct / validCount) : 0;
                const avgLab = validCount > 0 ? (totalLabPct / validCount) : 0;
                const avgOvh = validCount > 0 ? (totalOvhPct / validCount) : 0;
                const avgAsd = validCount > 0 ? (totalAsdPct / validCount) : 0;

                setSummaryCards({
                    avgMaterialPct: avgMat,
                    avgLaborPct: avgLab,
                    avgOverheadPct: avgOvh,
                    avgAsdPct: avgAsd
                });

                // Second pass: Mark outliers (Material % is > 1.5x the average)
                const itemsWithOutliers = baseItems.map(item => ({
                    ...item,
                    is_material_outlier: item.material_pct > (avgMat * 1.5) && item.material_pct > 20 // Only flag if it's over 1.5x average AND at least 20%
                }));

                setAnalysisData(itemsWithOutliers);
            }

            setLoading(false)
        }
        loadData()
    }, [router])

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
    }

    const sortedData = [...analysisData].sort((a, b) => {
        const valA = a[sortField]
        const valB = b[sortField]
        
        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }
        
        return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    })

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 ml-1" />
        return sortOrder === 'asc' 
            ? <ArrowUp size={14} className="text-blue-600 ml-1" />
            : <ArrowDown size={14} className="text-blue-600 ml-1" />
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Sidebar />
                <div className="lg:pl-64 flex items-center justify-center min-h-screen">
                    <Clock className="w-8 h-8 animate-pulse text-blue-600" />
                </div>
            </div>
        )
    }

    if (analysisData.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Sidebar />
                <div className="lg:pl-64 transition-all duration-300">
                    <div className="p-6 max-w-6xl mx-auto flex items-center justify-center min-h-[80vh]">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileSpreadsheet className="w-10 h-10 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">No Cost Data Available</h2>
                            <p className="text-slate-500 max-w-md mx-auto mb-6">Create some cost sheets first to see the component cost analysis and reduction insights.</p>
                            <button
                                onClick={() => router.push('/cost-sheet')}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Go to Cost Sheets
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Generate Insights Text
    const numOutliers = analysisData.filter(d => d.is_material_outlier).length;
    const topMarginEater = analysisData.reduce((acc, curr) => {
        acc[curr.highest_component] = (acc[curr.highest_component] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const mostCommonEater = Object.keys(topMarginEater).length > 0 ? Object.keys(topMarginEater).reduce((a, b) => topMarginEater[a] > topMarginEater[b] ? a : b) : 'Unknown';

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="lg:pl-64 transition-all duration-300">
                <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
                    
                    {/* Header */}
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Cost Component Analysis</h1>
                        <p className="text-slate-500 mt-1">Identify which cost components are eating your margins and find areas to reduce costs.</p>
                    </div>

                    {/* AI Insights Banner */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row gap-6 items-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                            <Lightbulb className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
                                Activity Insights
                            </h2>
                            <ul className="space-y-1 text-sm text-blue-100 list-disc list-inside">
                                <li><strong>{mostCommonEater}</strong> is the most frequent highest-cost component across your catalog. Focus on {mostCommonEater.toLowerCase()} reduction strategies to improve overall margins.</li>
                                {numOutliers > 0 ? (
                                    <li>Found <strong>{numOutliers} product{numOutliers > 1 ? 's' : ''}</strong> with unusually high material costs compared to the category average. These are prime targets for renegotiating supplier prices or changing material specs.</li>
                                ) : (
                                    <li>Material cost distributions look healthy and consistent across the product line.</li>
                                )}
                                <li>The average cost to produce a unit is highly dependent on {summaryCards.avgMaterialPct > summaryCards.avgLaborPct ? 'Materials' : 'Labour'} ({Math.max(summaryCards.avgMaterialPct, summaryCards.avgLaborPct).toFixed(1)}% of total cost).</li>
                            </ul>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <BarChart3 size={20} />
                                </div>
                                <h3 className="font-semibold text-slate-700">Avg Material %</h3>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{summaryCards.avgMaterialPct.toFixed(1)}%</div>
                            <p className="text-xs text-slate-500 mt-1">of total product cost</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <BarChart3 size={20} />
                                </div>
                                <h3 className="font-semibold text-slate-700">Avg Labour %</h3>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{summaryCards.avgLaborPct.toFixed(1)}%</div>
                            <p className="text-xs text-slate-500 mt-1">of total product cost</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <BarChart3 size={20} />
                                </div>
                                <h3 className="font-semibold text-slate-700">Avg Overhead %</h3>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{summaryCards.avgOverheadPct.toFixed(1)}%</div>
                            <p className="text-xs text-slate-500 mt-1">of total product cost</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
                                    <BarChart3 size={20} />
                                </div>
                                <h3 className="font-semibold text-slate-700">Avg ASD Exp. %</h3>
                            </div>
                            <div className="text-2xl font-bold text-slate-800">{summaryCards.avgAsdPct.toFixed(1)}%</div>
                            <p className="text-xs text-slate-500 mt-1">of total product cost</p>
                        </div>
                    </div>

                    {/* Breakdown Table */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Product Component Breakdown</h3>
                            <button
                                onClick={() => router.push('/cost-sheet')}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                Open Cost Sheets →
                            </button>
                        </div>
                        
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 bg-slate-50 border-b border-slate-100 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-5 py-4 font-semibold cursor-pointer group" onClick={() => handleSort('product_name')}>
                                            <div className="flex items-center">Product <SortIcon field="product_name" /></div>
                                        </th>
                                        <th className="px-5 py-4 font-semibold text-right cursor-pointer group" onClick={() => handleSort('material_pct')}>
                                            <div className="flex items-center justify-end">Material % <SortIcon field="material_pct" /></div>
                                        </th>
                                        <th className="px-5 py-4 font-semibold text-right cursor-pointer group" onClick={() => handleSort('labor_pct')}>
                                            <div className="flex items-center justify-end">Labour % <SortIcon field="labor_pct" /></div>
                                        </th>
                                        <th className="px-5 py-4 font-semibold text-right cursor-pointer group" onClick={() => handleSort('overhead_pct')}>
                                            <div className="flex items-center justify-end">Overhead % <SortIcon field="overhead_pct" /></div>
                                        </th>
                                        <th className="px-5 py-4 font-semibold text-right cursor-pointer group" onClick={() => handleSort('asd_pct')}>
                                            <div className="flex items-center justify-end">ASD % <SortIcon field="asd_pct" /></div>
                                        </th>
                                        <th className="px-5 py-4 font-semibold text-right">Highest Component</th>
                                        <th className="px-5 py-4 font-semibold text-right cursor-pointer group" onClick={() => handleSort('total_cost')}>
                                            <div className="flex items-center justify-end">Unit Cost <SortIcon field="total_cost" /></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {sortedData.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-3 font-medium text-slate-900 border-r border-slate-50">
                                                {item.product_name}
                                                <div className="text-xs text-slate-400 font-normal">{item.sheet_number}</div>
                                            </td>
                                            
                                            <td className="px-5 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.is_material_outlier && (
                                                        <span title="Unusually high material cost" className="text-red-500">
                                                            <AlertTriangle size={14} />
                                                        </span>
                                                    )}
                                                    <span className={`font-medium ${item.highest_component === 'Material' ? 'text-slate-900' : ''}`}>
                                                        {item.material_pct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                            
                                            <td className={`px-5 py-3 text-right ${item.highest_component === 'Labour' ? 'font-medium text-slate-900' : ''}`}>
                                                {item.labor_pct.toFixed(1)}%
                                            </td>
                                            
                                            <td className={`px-5 py-3 text-right ${item.highest_component === 'Overhead' ? 'font-medium text-slate-900' : ''}`}>
                                                {item.overhead_pct.toFixed(1)}%
                                            </td>
                                            
                                            <td className={`px-5 py-3 text-right ${item.highest_component === 'ASD' ? 'font-medium text-slate-900' : ''}`}>
                                                {item.asd_pct.toFixed(1)}%
                                            </td>

                                            <td className="px-5 py-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold
                                                    ${item.highest_component === 'Material' ? 'bg-blue-100 text-blue-800' : ''}
                                                    ${item.highest_component === 'Labour' ? 'bg-slate-200 text-slate-800' : ''}
                                                    ${item.highest_component === 'Overhead' ? 'bg-indigo-100 text-indigo-800' : ''}
                                                    ${item.highest_component === 'ASD' ? 'bg-purple-100 text-purple-800' : ''}
                                                `}>
                                                    {item.highest_component}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3 text-right font-medium text-slate-900">
                                                {currency}{item.cost_per_unit.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}
