'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
    FlaskConical,
    Clock,
    ArrowLeft,
    Lightbulb,
    TrendingUp,
    Calculator
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { getUser } from '@/app/auth/actions'

export default function WhatIfPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function checkAuth() {
            const user = await getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setLoading(false)
        }
        checkAuth()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Sidebar />
                <div className="lg:pl-64 flex items-center justify-center min-h-screen">
                    <Clock className="w-8 h-8 animate-pulse text-blue-600" />
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64 transition-all duration-300">
                <div className="p-6 max-w-4xl mx-auto">
                    {/* Coming Soon Card */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-center text-white">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FlaskConical className="w-10 h-10" />
                            </div>
                            <h1 className="text-3xl font-bold mb-2">What-If Analysis</h1>
                            <p className="text-indigo-100">Coming Soon</p>
                        </div>

                        <div className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-4">
                                    <Clock size={16} />
                                    Feature Under Development
                                </div>
                                <p className="text-gray-600 max-w-lg mx-auto">
                                    This powerful analysis tool is currently being developed and will be available soon.
                                </p>
                            </div>

                            {/* Planned Features */}
                            <h3 className="font-semibold text-gray-800 mb-4 text-center">What You'll Be Able To Do</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-gray-50 rounded-xl p-5 text-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Calculator className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-800 mb-1">Scenario Modeling</h4>
                                    <p className="text-sm text-gray-500">Test different cost & price scenarios</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-5 text-center">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-800 mb-1">Profit Projections</h4>
                                    <p className="text-sm text-gray-500">See impact on profit margins</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-5 text-center">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Lightbulb className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-800 mb-1">Decision Support</h4>
                                    <p className="text-sm text-gray-500">Get insights for better decisions</p>
                                </div>
                            </div>

                            {/* Back Button */}
                            <div className="text-center">
                                <button
                                    onClick={() => router.push('/break-even')}
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={18} />
                                    Back to Break-Even Analysis
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
