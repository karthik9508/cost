'use client'

import { useState } from 'react'
import { register } from '@/app/auth/actions'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function RegisterPage() {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        setSuccess(null)
        const result = await register(formData)
        if (result?.error) {
            setError(result.error)
        } else if (result?.success) {
            setSuccess(result.success)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 z-0" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="relative z-10">
                    <Link href="/" className="flex items-center gap-2 mb-12">
                        <Image
                            src="/cost analyst.webp"
                            alt="Cost Analyst Logo"
                            width={140}
                            height={40}
                            className="h-8 w-auto brightness-0 invert"
                        />
                    </Link>

                    <h2 className="text-4xl font-bold mb-6 leading-tight">
                        Start your journey to <br />
                        financial clarity.
                    </h2>
                    <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                        Join the fastest growing cost management platform. No credit card required to get started.
                    </p>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-1">Enterprise-grade Security</h4>
                                <p className="text-slate-400 text-sm">Your data is encrypted and protected with industry standard security protocols.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-slate-700" />
                        ))}
                    </div>
                </div>

                <div className="relative z-10 mt-12 text-sm text-slate-500">
                    © 2024 Cost Analyst Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative overflow-y-auto">
                <div className="w-full max-w-md space-y-8 animate-fade-in-up py-8">
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl font-bold text-slate-900">Create an account</h1>
                        <p className="mt-2 text-slate-500">Get started with your free 14-day trial.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-start gap-2">
                            <div className="mt-0.5">⚠️</div>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-green-600 text-sm flex items-start gap-2">
                            <div className="mt-0.5">✅</div>
                            {success}
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                                    Confirm <span className="hidden sm:inline">Password</span>
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="text-xs text-slate-500 leading-relaxed">
                            By creating an account, you agree to our <Link href="#" className="text-blue-600 hover:text-blue-700 underline">Terms of Service</Link> and <Link href="#" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</Link>.
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Creating account...</span>
                                </>
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                            Sign in instead
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
