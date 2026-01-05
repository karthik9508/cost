'use client'

import { useState } from 'react'
import { login, signInWithGoogle } from '@/app/auth/actions'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError(null)
        const result = await login(formData)
        if (result?.error) {
            setError(result.error)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-slate-50">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex lg:w-1/2 bg-blue-600 text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600 to-blue-800 z-0" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

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
                        Take control of your <br />
                        manufacturing costs.
                    </h2>
                    <p className="text-blue-100 text-lg max-w-md leading-relaxed">
                        Join thousands of businesses making smarter pricing decisions and boosting profitability with Cost Analyst.
                    </p>
                </div>

                <div className="relative z-10 space-y-4">
                    {[
                        "Real-time cost tracking",
                        "Smart pricing models",
                        "Break-even analysis",
                        "Automated reporting"
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-blue-50">
                            <CheckCircle2 size={20} className="text-blue-300" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>

                <div className="relative z-10 mt-12 text-sm text-blue-200">
                    © 2024 Cost Analyst Inc. All rights reserved.
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative">
                <div className="w-full max-w-md space-y-8 animate-fade-in-up">
                    <div className="text-center lg:text-left">
                        <h1 className="text-3xl font-bold text-slate-900">Welcome back</h1>
                        <p className="mt-2 text-slate-500">Please enter your details to sign in.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-start gap-2">
                            <div className="mt-0.5">⚠️</div>
                            {error}
                        </div>
                    )}

                    <form action={handleSubmit} className="space-y-6">
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

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                    Password
                                </label>
                                <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-slate-50 text-slate-500">or continue with</span>
                        </div>
                    </div>

                    {/* Google OAuth Button */}
                    <form action={async () => {
                        setGoogleLoading(true)
                        setError(null)
                        const result = await signInWithGoogle()
                        if (result?.error) {
                            setError(result.error)
                            setGoogleLoading(false)
                        }
                    }}>
                        <button
                            type="submit"
                            disabled={googleLoading}
                            className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                        >
                            {googleLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                                    <span>Connecting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    <span>Sign in with Google</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-slate-500 text-sm">
                        Don&apos;t have an account?{' '}
                        <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold transition-colors">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
