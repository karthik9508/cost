'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Building2, MapPin, Coins, LogOut, Save, Loader2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getSettings, updateSettings, UserSettings } from './actions'
import { logout, getUser } from '@/app/auth/actions'

const currencies = [
    { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
    { code: 'AED', name: 'UAE Dirham (د.إ)', symbol: 'د.إ' },
    { code: 'SAR', name: 'Saudi Riyal (﷼)', symbol: '﷼' },
]

export default function SettingsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [userEmail, setUserEmail] = useState<string>('')
    const [settings, setSettings] = useState<UserSettings>({
        user_id: '',
        full_name: '',
        business_name: '',
        address: '',
        currency: 'INR'
    })

    useEffect(() => {
        async function loadData() {
            try {
                const user = await getUser()
                if (!user) {
                    router.push('/login')
                    return
                }
                setUserEmail(user.email || '')

                const data = await getSettings()
                if (data) {
                    setSettings(data)
                }
            } catch (error) {
                console.error('Error loading settings:', error)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        const formData = new FormData()
        formData.set('full_name', settings.full_name || '')
        formData.set('business_name', settings.business_name || '')
        formData.set('address', settings.address || '')
        formData.set('currency', settings.currency)

        const result = await updateSettings(formData)

        if (result.error) {
            setMessage({ type: 'error', text: result.error })
        } else if (result.success) {
            setMessage({ type: 'success', text: result.success })
        }

        setSaving(false)
    }

    const handleLogout = async () => {
        await logout()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                <div className="lg:pl-64 transition-all duration-300">
                    <div className="flex items-center justify-center min-h-screen">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64 transition-all duration-300">
                <div className="p-6 max-w-4xl mx-auto">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                        <p className="text-gray-500 mt-1">Manage your account and business preferences</p>
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

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* User Profile Section */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">User Profile</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={userEmail}
                                        disabled
                                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                                    />
                                    <p className="mt-1 text-xs text-gray-400">Email cannot be changed</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.full_name || ''}
                                        onChange={(e) => setSettings({ ...settings, full_name: e.target.value })}
                                        placeholder="Enter your full name"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Details Section */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-green-50 rounded-lg">
                                    <Building2 className="w-5 h-5 text-green-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Business Details</h2>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Business Name
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.business_name || ''}
                                        onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                                        placeholder="Enter your business name"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <MapPin className="w-4 h-4 inline mr-1" />
                                        Business Address
                                    </label>
                                    <textarea
                                        value={settings.address || ''}
                                        onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                                        placeholder="Enter your business address"
                                        rows={3}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Preferences Section */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-purple-50 rounded-lg">
                                    <Coins className="w-5 h-5 text-purple-600" />
                                </div>
                                <h2 className="text-lg font-semibold text-gray-800">Preferences</h2>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Currency Preference
                                </label>
                                <select
                                    value={settings.currency}
                                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                    className="w-full md:w-1/2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    {currencies.map((currency) => (
                                        <option key={currency.code} value={currency.code}>
                                            {currency.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-sm text-gray-500">
                                    This currency will be used for all cost sheets and reports
                                </p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Save className="w-5 h-5" />
                                )}
                                {saving ? 'Saving...' : 'Save Settings'}
                            </button>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition-colors border border-red-200"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
