'use client'

import { useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { PlusCircle, X, Package, Recycle, Hash, Trash2, Settings } from 'lucide-react'
import { getMaterials, getScrapItems, MaterialInput, ScrapInput } from '@/app/materials/actions'

export interface MaterialItem {
    id: string
    name: string
    part_number: string
    category: string
    unit: string
    quantity: string
    rate: string
    amount: number
}

export interface ScrapItemData {
    id: string
    description: string
    unit: string
    quantity: string
    rate: string
    amount: number
}

export interface MaterialCostManagerRef {
    getMaterialsData: () => MaterialInput[]
    getScrapData: () => ScrapInput[]
}

interface MaterialCostManagerProps {
    costSheetId?: string | null
    currency: string
    isEditing: boolean
    onTotalChange: (total: number) => void
}

const units = [
    { value: 'pcs', label: 'Pcs' },
    { value: 'kg', label: 'Kg' },
    { value: 'g', label: 'Grams' },
    { value: 'l', label: 'Liters' },
    { value: 'ml', label: 'ML' },
    { value: 'box', label: 'Box' },
    { value: 'pack', label: 'Pack' },
    { value: 'unit', label: 'Unit' },
    { value: 'meter', label: 'Meter' },
    { value: 'sqft', label: 'Sq.ft' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'ton', label: 'Ton' },
]

const categories = [
    { value: 'raw_material', label: 'Raw Material' },
    { value: 'packaging', label: 'Packaging' },
    { value: 'consumable', label: 'Consumable' },
    { value: 'sub_component', label: 'Sub-Component' },
]

const categoryColors: { [key: string]: string } = {
    raw_material: 'bg-blue-100 text-blue-700',
    packaging: 'bg-amber-100 text-amber-700',
    consumable: 'bg-emerald-100 text-emerald-700',
    sub_component: 'bg-violet-100 text-violet-700',
}

const createMaterialItem = (): MaterialItem => ({
    id: crypto.randomUUID(),
    name: '',
    part_number: '',
    category: 'raw_material',
    unit: 'pcs',
    quantity: '0',
    rate: '0',
    amount: 0,
})

const createScrapItem = (): ScrapItemData => ({
    id: crypto.randomUUID(),
    description: '',
    unit: 'kg',
    quantity: '0',
    rate: '0',
    amount: 0,
})

const MaterialCostManager = forwardRef<MaterialCostManagerRef, MaterialCostManagerProps>(
    function MaterialCostManager({ costSheetId, currency, isEditing, onTotalChange }, ref) {
        const [materials, setMaterials] = useState<MaterialItem[]>([createMaterialItem()])
        const [scrapItems, setScrapItems] = useState<ScrapItemData[]>([])
        const [loaded, setLoaded] = useState(false)
        const [showScrapModal, setShowScrapModal] = useState(false)
        const [showMaterialModal, setShowMaterialModal] = useState(false)
        const [activeMaterialId, setActiveMaterialId] = useState<string | null>(null)

        // Expose getMaterialsData and getScrapData to parent via ref
        useImperativeHandle(ref, () => ({
            getMaterialsData: (): MaterialInput[] => {
                return materials
                    .filter(m => m.name.trim() !== '')
                    .map(m => ({
                        name: m.name,
                        part_number: m.part_number,
                        category: m.category,
                        unit: m.unit,
                        quantity: parseFloat(m.quantity) || 0,
                        rate: parseFloat(m.rate) || 0,
                        amount: m.amount,
                    }))
            },
            getScrapData: (): ScrapInput[] => {
                return scrapItems
                    .filter(s => s.description.trim() !== '')
                    .map(s => ({
                        description: s.description,
                        unit: s.unit,
                        quantity: parseFloat(s.quantity) || 0,
                        rate: parseFloat(s.rate) || 0,
                        amount: s.amount,
                    }))
            }
        }), [materials, scrapItems])

        // Calculate net total (gross - scrap) and notify parent
        const calculateTotal = useCallback((items: MaterialItem[], scraps: ScrapItemData[]) => {
            const gross = items.reduce((sum, m) => sum + m.amount, 0)
            const scrapValue = scraps.reduce((sum, s) => sum + s.amount, 0)
            const net = gross - scrapValue
            onTotalChange(net)
            return net
        }, [onTotalChange])

        // Load existing materials and scrap items when costSheetId changes
        useEffect(() => {
            async function loadData() {
                if (!costSheetId) {
                    const defaultMaterials = [createMaterialItem()]
                    setMaterials(defaultMaterials)
                    setScrapItems([])
                    setLoaded(true)
                    calculateTotal(defaultMaterials, [])
                    return
                }

                const [materialsData, scrapData] = await Promise.all([
                    getMaterials(costSheetId),
                    getScrapItems(costSheetId)
                ])

                let matItems: MaterialItem[]
                if (materialsData.length > 0) {
                    matItems = materialsData.map(m => ({
                        id: m.id,
                        name: m.name,
                        part_number: m.part_number || '',
                        category: m.category || 'raw_material',
                        unit: m.unit,
                        quantity: m.quantity.toString(),
                        rate: m.rate.toString(),
                        amount: m.quantity * m.rate,
                    }))
                } else {
                    matItems = [createMaterialItem()]
                }

                let scItems: ScrapItemData[]
                if (scrapData.length > 0) {
                    scItems = scrapData.map(s => ({
                        id: s.id,
                        description: s.description,
                        unit: s.unit,
                        quantity: s.quantity.toString(),
                        rate: s.rate.toString(),
                        amount: s.quantity * s.rate,
                    }))
                } else {
                    scItems = []
                }

                setMaterials(matItems)
                setScrapItems(scItems)
                calculateTotal(matItems, scItems)
                setLoaded(true)
            }
            setLoaded(false)
            loadData()
        }, [costSheetId, calculateTotal])

        // ── Material handlers ──
        const addMaterial = () => {
            const updated = [...materials, createMaterialItem()]
            setMaterials(updated)
        }

        const removeMaterial = (id: string) => {
            if (materials.length > 1) {
                const updated = materials.filter(m => m.id !== id)
                setMaterials(updated)
                calculateTotal(updated, scrapItems)
            }
        }

        const updateMaterial = (id: string, field: keyof MaterialItem, value: string) => {
            const updated = materials.map(m => {
                if (m.id === id) {
                    const item = { ...m, [field]: value }
                    item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
                    return item
                }
                return m
            })
            setMaterials(updated)
            calculateTotal(updated, scrapItems)
        }

        const openMaterialDetail = (id: string) => {
            setActiveMaterialId(id)
            setShowMaterialModal(true)
        }

        // ── Scrap handlers ──
        const addScrapItem = () => {
            setScrapItems([...scrapItems, createScrapItem()])
        }

        const removeScrapItem = (id: string) => {
            const updated = scrapItems.filter(s => s.id !== id)
            setScrapItems(updated)
            calculateTotal(materials, updated)
        }

        const updateScrapItem = (id: string, field: keyof ScrapItemData, value: string) => {
            const updated = scrapItems.map(s => {
                if (s.id === id) {
                    const item = { ...s, [field]: value }
                    item.amount = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0)
                    return item
                }
                return s
            })
            setScrapItems(updated)
            calculateTotal(materials, updated)
        }

        const grossMaterialCost = materials.reduce((sum, m) => sum + m.amount, 0)
        const totalScrapValue = scrapItems.reduce((sum, s) => sum + s.amount, 0)
        const netMaterialCost = grossMaterialCost - totalScrapValue
        const validScrapCount = scrapItems.filter(s => s.description.trim() !== '').length

        if (!loaded && costSheetId) {
            return (
                <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400 text-sm">
                        Loading materials...
                    </td>
                </tr>
            )
        }

        const activeMaterial = activeMaterialId ? materials.find(m => m.id === activeMaterialId) : null

        return (
            <>
                {/* ═══════════════════════════════════════════ */}
                {/* SECTION: DIRECT MATERIALS                  */}
                {/* ═══════════════════════════════════════════ */}

                {/* Section Header */}
                <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
                    <td colSpan={5} className="p-3 font-semibold text-blue-800 border-b border-blue-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm font-bold">A</span>
                                <span className="text-base">DIRECT MATERIALS</span>
                                <span className="text-xs bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full ml-2">
                                    {materials.filter(m => m.name.trim() !== '').length} item{materials.filter(m => m.name.trim() !== '').length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            {isEditing && (
                                <button
                                    type="button"
                                    onClick={addMaterial}
                                    className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                                >
                                    <PlusCircle size={16} /> Add Material
                                </button>
                            )}
                        </div>
                    </td>
                </tr>

                {/* Column Headers — simplified: Name | Manage | Cost */}
                <tr className="bg-blue-50/50">
                    <td colSpan={3} className="p-2 text-xs font-semibold text-blue-700 border-b border-r">Material Name</td>
                    <td className="p-2 text-xs font-semibold text-blue-700 border-b border-r text-center">Material Cost</td>
                    <td className="p-2 text-xs font-semibold text-blue-700 border-b text-right w-32">Amount ({currency})</td>
                </tr>

                {/* Material Rows — compact: Name + Manage button + Total */}
                {materials.map((material, index) => (
                    <tr key={material.id} className="border-b border-gray-200 hover:bg-blue-50/30 transition-colors group">
                        {/* Name */}
                        <td colSpan={3} className="p-2 border-r">
                            {isEditing ? (
                                <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-medium shrink-0">
                                        {index + 1}
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Material name..."
                                        value={material.name}
                                        onChange={(e) => updateMaterial(material.id, 'name', e.target.value)}
                                        className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none transition-all text-sm"
                                    />
                                    {materials.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeMaterial(material.id)}
                                            className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-all shrink-0"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 pl-2">
                                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-medium">
                                        {index + 1}
                                    </span>
                                    <Package size={14} className="text-blue-400" />
                                    <span className="font-medium text-gray-700">{material.name || `Material ${index + 1}`}</span>
                                    {material.part_number && (
                                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Hash size={9} />{material.part_number}</span>
                                    )}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${categoryColors[material.category] || 'bg-gray-100 text-gray-600'}`}>
                                        {categories.find(c => c.value === material.category)?.label || material.category}
                                    </span>
                                </div>
                            )}
                        </td>

                        {/* Manage Material Cost Button */}
                        <td className="p-2 border-r text-center">
                            <button
                                type="button"
                                onClick={() => openMaterialDetail(material.id)}
                                className="inline-flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-sm"
                            >
                                <Settings size={14} />
                                Manage Material Cost
                            </button>
                        </td>

                        {/* Amount */}
                        <td className="p-2 text-right">
                            <span className="font-semibold text-gray-800">{currency}{material.amount.toFixed(2)}</span>
                        </td>
                    </tr>
                ))}

                {/* Gross Material Cost */}
                <tr className="bg-blue-50">
                    <td colSpan={4} className="p-2 text-right font-semibold text-blue-700 border-b border-r text-sm">
                        Gross Material Cost
                    </td>
                    <td className="p-2 text-right font-bold text-blue-800 border-b">
                        {currency}{grossMaterialCost.toFixed(2)}
                    </td>
                </tr>

                {/* ═══════════════════════════════════════════ */}
                {/* SCRAP VALUE — Summary row + popup button   */}
                {/* ═══════════════════════════════════════════ */}
                <tr className="bg-amber-50/80 border-b border-amber-200">
                    <td colSpan={4} className="p-2 border-r">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Recycle size={16} className="text-amber-600" />
                                <span className="text-sm font-medium text-amber-800">Less: Scrap / Wastage Value</span>
                                {validScrapCount > 0 && (
                                    <span className="text-xs bg-amber-200 text-amber-700 px-2 py-0.5 rounded-full">
                                        {validScrapCount} item{validScrapCount !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowScrapModal(true)}
                                className="flex items-center gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors shadow-sm"
                            >
                                <Recycle size={14} /> {validScrapCount > 0 ? 'Manage Scrap' : 'Add Scrap'}
                            </button>
                        </div>
                    </td>
                    <td className="p-2 text-right font-bold text-amber-800">
                        {totalScrapValue > 0 ? `−${currency}${totalScrapValue.toFixed(2)}` : `${currency}0.00`}
                    </td>
                </tr>

                {/* NET MATERIAL COST TOTAL */}
                <tr className="bg-gradient-to-r from-blue-100 to-blue-200">
                    <td colSpan={4} className="p-3 text-right font-semibold text-blue-800 border-b border-r">
                        <span className="flex items-center justify-end gap-2">
                            Net Direct Materials
                            <span className="text-xs bg-blue-300 text-blue-800 px-2 py-0.5 rounded-full">
                                {materials.filter(m => m.name.trim() !== '').length} items
                            </span>
                        </span>
                    </td>
                    <td className="p-3 text-right font-bold text-blue-900 border-b text-lg">
                        {currency}{netMaterialCost.toFixed(2)}
                    </td>
                </tr>

                {/* ═══════════════════════════════════════════ */}
                {/* MATERIAL DETAIL POPUP MODAL                */}
                {/* ═══════════════════════════════════════════ */}
                {showMaterialModal && activeMaterial && (
                    <tr>
                        <td colSpan={5} className="p-0">
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowMaterialModal(false) }}>
                                <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    {/* Modal Header */}
                                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-5 rounded-t-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                <Package size={22} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold">Material Cost Details</h2>
                                                <p className="text-blue-100 text-xs">{activeMaterial.name || 'New Material'}</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setShowMaterialModal(false)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-5 space-y-4">
                                        {/* Material Name */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <label className="block text-xs font-semibold text-blue-700 mb-2">📋 Material Name</label>
                                            <p className="text-[10px] text-gray-400 mb-2">Name of the material (shown in cost sheet)</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={activeMaterial.name}
                                                    onChange={(e) => updateMaterial(activeMaterial.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2.5 border border-blue-200 rounded-lg bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-sm font-medium"
                                                    placeholder="e.g., Steel Sheet, Plastic Granules..."
                                                />
                                            ) : (
                                                <div className="text-sm font-medium text-gray-800">{activeMaterial.name || '—'}</div>
                                            )}
                                        </div>

                                        {/* Part Number */}
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                            <label className="block text-xs font-semibold text-gray-700 mb-2"># Part Number</label>
                                            <p className="text-[10px] text-gray-400 mb-2">Unique identifier for this material</p>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    value={activeMaterial.part_number}
                                                    onChange={(e) => updateMaterial(activeMaterial.id, 'part_number', e.target.value)}
                                                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                                                    placeholder="e.g., RM-001"
                                                />
                                            ) : (
                                                <div className="text-sm font-medium text-gray-800">{activeMaterial.part_number || '—'}</div>
                                            )}
                                        </div>

                                        {/* Category + Unit */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                                                <label className="block text-xs font-semibold text-indigo-700 mb-2">📦 Category</label>
                                                {isEditing ? (
                                                    <select
                                                        value={activeMaterial.category}
                                                        onChange={(e) => updateMaterial(activeMaterial.id, 'category', e.target.value)}
                                                        className="w-full px-3 py-2.5 border border-indigo-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none text-sm"
                                                    >
                                                        {categories.map(c => (
                                                            <option key={c.value} value={c.value}>{c.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[activeMaterial.category] || 'bg-gray-100 text-gray-600'}`}>
                                                        {categories.find(c => c.value === activeMaterial.category)?.label}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                                                <label className="block text-xs font-semibold text-purple-700 mb-2">📏 Unit</label>
                                                {isEditing ? (
                                                    <select
                                                        value={activeMaterial.unit}
                                                        onChange={(e) => updateMaterial(activeMaterial.id, 'unit', e.target.value)}
                                                        className="w-full px-3 py-2.5 border border-purple-200 rounded-lg bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none text-sm"
                                                    >
                                                        {units.map(u => (
                                                            <option key={u.value} value={u.value}>{u.label}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="text-sm font-medium text-gray-800">{units.find(u => u.value === activeMaterial.unit)?.label || activeMaterial.unit}</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Quantity + Rate + Amount */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                            <label className="block text-xs font-semibold text-blue-700 mb-2">💰 Cost Calculation</label>
                                            <p className="text-[10px] text-gray-400 mb-2">Quantity × Rate = Amount</p>
                                            {isEditing ? (
                                                <div className="grid grid-cols-3 gap-3 mt-2">
                                                    <div>
                                                        <label className="block text-[10px] text-blue-600 font-medium mb-1">Quantity</label>
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            value={activeMaterial.quantity}
                                                            onChange={(e) => updateMaterial(activeMaterial.id, 'quantity', e.target.value)}
                                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-center bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-blue-600 font-medium mb-1">Rate ({currency})</label>
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            value={activeMaterial.rate}
                                                            onChange={(e) => updateMaterial(activeMaterial.id, 'rate', e.target.value)}
                                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-right bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none text-sm"
                                                            placeholder="0"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] text-blue-600 font-medium mb-1">Amount</label>
                                                        <div className="px-3 py-2 bg-blue-100 rounded-lg text-right">
                                                            <span className="text-sm font-bold text-blue-800">{currency}{activeMaterial.amount.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-gray-500">{activeMaterial.quantity} {activeMaterial.unit} × {currency}{parseFloat(activeMaterial.rate).toFixed(2)}</span>
                                                    <span className="font-bold text-blue-800">{currency}{activeMaterial.amount.toFixed(2)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="border-t border-gray-200 p-5 bg-gray-50 rounded-b-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-500">
                                                Material Amount
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-bold text-blue-700">
                                                    {currency}{activeMaterial.amount.toFixed(2)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowMaterialModal(false)}
                                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-sm"
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
                )}

                {/* ═══════════════════════════════════════════ */}
                {/* SCRAP MANAGEMENT POPUP MODAL               */}
                {/* ═══════════════════════════════════════════ */}
                {showScrapModal && (
                    <tr>
                        <td colSpan={5} className="p-0">
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowScrapModal(false) }}>
                                <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                                    {/* Modal Header */}
                                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-5 rounded-t-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                                <Recycle size={22} />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold">Scrap / Wastage Value</h2>
                                                <p className="text-amber-100 text-xs">Manage recoverable scrap from production</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowScrapModal(false)}
                                            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="flex-1 overflow-y-auto p-5">
                                        {scrapItems.length === 0 ? (
                                            <div className="text-center py-10">
                                                <Recycle className="w-14 h-14 text-amber-200 mx-auto mb-3" />
                                                <h3 className="text-gray-600 font-medium mb-1">No scrap items yet</h3>
                                                <p className="text-gray-400 text-sm mb-4">Add scrap or wastage items to deduct from material cost</p>
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={addScrapItem}
                                                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors"
                                                    >
                                                        <PlusCircle size={18} /> Add First Scrap Item
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {scrapItems.map((scrap, index) => (
                                                    <div key={scrap.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4 hover:border-amber-300 transition-colors group">
                                                        <div className="flex items-start gap-3">
                                                            <span className="w-7 h-7 bg-amber-200 text-amber-700 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-1">
                                                                {index + 1}
                                                            </span>
                                                            <div className="flex-1 space-y-3">
                                                                {/* Description + Unit row */}
                                                                <div className="flex gap-2">
                                                                    {isEditing ? (
                                                                        <>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="e.g., Metal shavings, Offcuts, Sawdust..."
                                                                                value={scrap.description}
                                                                                onChange={(e) => updateScrapItem(scrap.id, 'description', e.target.value)}
                                                                                className="flex-1 px-3 py-2 border border-amber-200 rounded-lg focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none text-sm bg-white"
                                                                            />
                                                                            <select
                                                                                value={scrap.unit}
                                                                                onChange={(e) => updateScrapItem(scrap.id, 'unit', e.target.value)}
                                                                                className="w-24 px-2 py-2 border border-amber-200 rounded-lg text-sm bg-white focus:border-amber-400 outline-none"
                                                                            >
                                                                                {units.map(u => (
                                                                                    <option key={u.value} value={u.value}>{u.label}</option>
                                                                                ))}
                                                                            </select>
                                                                        </>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-medium text-gray-700">{scrap.description || `Scrap ${index + 1}`}</span>
                                                                            <span className="text-xs text-gray-400">({scrap.unit})</span>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Qty, Rate, Amount row */}
                                                                <div className="grid grid-cols-3 gap-3">
                                                                    <div>
                                                                        <label className="block text-xs text-amber-600 font-medium mb-1">Quantity</label>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number" min="0" step="0.01"
                                                                                value={scrap.quantity}
                                                                                onChange={(e) => updateScrapItem(scrap.id, 'quantity', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-center bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none text-sm"
                                                                                placeholder="0"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-sm font-medium">{scrap.quantity} {scrap.unit}</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-amber-600 font-medium mb-1">Rate ({currency})</label>
                                                                        {isEditing ? (
                                                                            <input
                                                                                type="number" min="0" step="0.01"
                                                                                value={scrap.rate}
                                                                                onChange={(e) => updateScrapItem(scrap.id, 'rate', e.target.value)}
                                                                                className="w-full px-3 py-2 border border-amber-200 rounded-lg text-right bg-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none text-sm"
                                                                                placeholder="0"
                                                                            />
                                                                        ) : (
                                                                            <span className="text-sm">{currency}{parseFloat(scrap.rate).toFixed(2)}</span>
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs text-amber-600 font-medium mb-1">Value</label>
                                                                        <div className="px-3 py-2 bg-amber-100 rounded-lg text-right">
                                                                            <span className="text-sm font-bold text-amber-800">{currency}{scrap.amount.toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Delete button */}
                                                            {isEditing && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeScrapItem(scrap.id)}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all shrink-0 mt-1"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add more button */}
                                                {isEditing && (
                                                    <button
                                                        type="button"
                                                        onClick={addScrapItem}
                                                        className="w-full py-3 border-2 border-dashed border-amber-300 rounded-xl text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                                                    >
                                                        <PlusCircle size={18} /> Add Another Scrap Item
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="border-t border-gray-200 p-5 bg-gray-50 rounded-b-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="text-sm text-gray-500">
                                                {validScrapCount} scrap item{validScrapCount !== 1 ? 's' : ''} • Total deduction
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xl font-bold text-amber-700">
                                                    −{currency}{totalScrapValue.toFixed(2)}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowScrapModal(false)}
                                                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shadow-sm"
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
                )}
            </>
        )
    }
)

export default MaterialCostManager
