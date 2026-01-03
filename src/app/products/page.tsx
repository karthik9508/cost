'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Package,
    Plus,
    Pencil,
    Trash2,
    X,
    Loader2,
    Search,
    Briefcase,
    Box
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getProducts, createProduct, updateProduct, deleteProduct, Product } from './actions'
import { getUser } from '@/app/auth/actions'

const units = [
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'g', label: 'Grams (g)' },
    { value: 'l', label: 'Liters (l)' },
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'box', label: 'Boxes' },
    { value: 'pack', label: 'Packs' },
    { value: 'unit', label: 'Units' },
    { value: 'hrs', label: 'Hours' },
    { value: 'days', label: 'Days' },
    { value: 'session', label: 'Sessions' },
    { value: 'project', label: 'Projects' },
]

interface ProductFormData {
    name: string
    type: 'product' | 'service'
    unit: string
    expected_monthly_quantity: string
    description: string
}

const emptyForm: ProductFormData = {
    name: '',
    type: 'product',
    unit: 'pcs',
    expected_monthly_quantity: '',
    description: ''
}

export default function ProductsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [showModal, setShowModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [formData, setFormData] = useState<ProductFormData>(emptyForm)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    useEffect(() => {
        async function loadData() {
            const user = await getUser()
            if (!user) {
                router.push('/login')
                return
            }
            const data = await getProducts()
            setProducts(data)
            setLoading(false)
        }
        loadData()
    }, [router])

    const openAddModal = () => {
        setFormData(emptyForm)
        setEditingProduct(null)
        setShowModal(true)
    }

    const openEditModal = (product: Product) => {
        setFormData({
            name: product.name,
            type: product.type,
            unit: product.unit,
            expected_monthly_quantity: product.expected_monthly_quantity?.toString() || '',
            description: product.description || ''
        })
        setEditingProduct(product)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
        setEditingProduct(null)
        setFormData(emptyForm)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        const form = new FormData()
        form.set('name', formData.name)
        form.set('type', formData.type)
        form.set('unit', formData.unit)
        form.set('expected_monthly_quantity', formData.expected_monthly_quantity)
        form.set('description', formData.description)

        let result
        if (editingProduct) {
            result = await updateProduct(editingProduct.id, form)
        } else {
            result = await createProduct(form)
        }

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: result.success || 'Success!' })
            closeModal()
            // Refresh products list
            const data = await getProducts()
            setProducts(data)
        }
        setSaving(false)
    }

    const handleDelete = async (id: string) => {
        const result = await deleteProduct(id)
        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else {
            setMessage({ type: 'success', text: result.success || 'Deleted!' })
            const data = await getProducts()
            setProducts(data)
        }
        setDeleteConfirm(null)
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.type.toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Products / Services</h1>
                            <p className="text-gray-500 mt-1">Manage your products and services for cost analysis</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            <Plus size={20} />
                            Add Product / Service
                        </button>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                            {message.text}
                        </div>
                    )}

                    {/* Search */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search products or services..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Products Grid */}
                    {filteredProducts.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-700 mb-2">No products or services yet</h3>
                            <p className="text-gray-500 mb-4">Add your first product or service to start cost analysis</p>
                            <button
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <Plus size={18} />
                                Add Your First Item
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${product.type === 'product' ? 'bg-blue-50' : 'bg-purple-50'
                                            }`}>
                                            {product.type === 'product'
                                                ? <Box className="w-5 h-5 text-blue-600" />
                                                : <Briefcase className="w-5 h-5 text-purple-600" />
                                            }
                                        </div>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${product.type === 'product'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {product.type === 'product' ? 'Product' : 'Service'}
                                        </span>
                                    </div>

                                    <h3 className="font-semibold text-gray-800 mb-2">{product.name}</h3>

                                    <div className="space-y-1 text-sm text-gray-500 mb-4">
                                        <p>Unit: <span className="text-gray-700">{product.unit}</span></p>
                                        {product.expected_monthly_quantity && (
                                            <p>Monthly Qty: <span className="text-gray-700">{product.expected_monthly_quantity.toLocaleString()}</span></p>
                                        )}
                                        {product.description && (
                                            <p className="truncate">Note: {product.description}</p>
                                        )}
                                    </div>

                                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => openEditModal(product)}
                                            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <Pencil size={16} />
                                            Edit
                                        </button>
                                        {deleteConfirm === product.id ? (
                                            <div className="flex-1 flex gap-1">
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="flex-1 px-2 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                                >
                                                    Confirm
                                                </button>
                                                <button
                                                    onClick={() => setDeleteConfirm(null)}
                                                    className="px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setDeleteConfirm(product.id)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-800">
                                {editingProduct ? 'Edit Item' : 'Add New Item'}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-4 space-y-4">
                            {/* Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'product' })}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${formData.type === 'product'
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <Box size={18} />
                                        Product
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'service' })}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${formData.type === 'service'
                                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                            }`}
                                    >
                                        <Briefcase size={18} />
                                        Service
                                    </button>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder={formData.type === 'product' ? 'e.g., Widget A' : 'e.g., Consulting Service'}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Unit of Measurement <span className="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {units.map((unit) => (
                                        <option key={unit.value} value={unit.value}>{unit.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Expected Monthly Quantity */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expected Monthly Sales Quantity
                                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={formData.expected_monthly_quantity}
                                    onChange={(e) => setFormData({ ...formData, expected_monthly_quantity: e.target.value })}
                                    placeholder="e.g., 1000"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                    <span className="text-gray-400 font-normal ml-1">(optional)</span>
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description or notes..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                                >
                                    {saving ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        editingProduct ? 'Update' : 'Add'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
