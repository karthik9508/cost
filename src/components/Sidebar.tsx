'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Package,
    FileSpreadsheet,
    DollarSign,
    TrendingUp,
    FlaskConical,
    FileBarChart,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Products / Services', href: '/products', icon: Package },
    { name: 'Cost Sheet', href: '/cost-sheet', icon: FileSpreadsheet },
    { name: 'Pricing Decision', href: '/pricing', icon: DollarSign },
    { name: 'Break-Even Analysis', href: '/break-even', icon: TrendingUp },
    { name: 'What-If Analysis', href: '/what-if', icon: FlaskConical },
    { name: 'Reports', href: '/reports', icon: FileBarChart },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 z-40 ${collapsed ? 'w-20' : 'w-64'
                }`}
        >
            {/* Logo / Brand */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                <Link href="/" className="flex items-center gap-2">
                    {!collapsed && (
                        <Image
                            src="/cost analyst.webp"
                            alt="Cost Analyst Logo"
                            width={120}
                            height={32}
                            className="h-7 w-auto"
                        />
                    )}
                    {collapsed && (
                        <Image
                            src="/cost analyst.webp"
                            alt="Cost Analyst"
                            width={32}
                            height={32}
                            className="h-8 w-8 object-contain"
                        />
                    )}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-50 text-blue-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            title={collapsed ? item.name : undefined}
                        >
                            <Icon
                                size={20}
                                className={`flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                                    }`}
                            />
                            {!collapsed && (
                                <span className="truncate">{item.name}</span>
                            )}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
