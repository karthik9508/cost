import { redirect } from 'next/navigation'
import { getUser } from '@/app/auth/actions'
import { TrendingUp, TrendingDown, DollarSign, Package, FileSpreadsheet, Activity } from 'lucide-react'

export default async function DashboardPage() {
    const user = await getUser()

    if (!user) {
        redirect('/login')
    }

    const stats = [
        {
            name: 'Total Products',
            value: '24',
            change: '+3 this month',
            trend: 'up',
            icon: Package,
            color: 'blue'
        },
        {
            name: 'Active Cost Sheets',
            value: '12',
            change: '+2 this week',
            trend: 'up',
            icon: FileSpreadsheet,
            color: 'green'
        },
        {
            name: 'Total Revenue',
            value: '₹4,50,000',
            change: '+12.5%',
            trend: 'up',
            icon: DollarSign,
            color: 'purple'
        },
        {
            name: 'Profit Margin',
            value: '23.5%',
            change: '-2.3%',
            trend: 'down',
            icon: Activity,
            color: 'orange'
        },
    ]

    const getColorClasses = (color: string) => {
        const colors: { [key: string]: { bg: string, icon: string } } = {
            blue: { bg: 'bg-blue-50', icon: 'text-blue-600' },
            green: { bg: 'bg-green-50', icon: 'text-green-600' },
            purple: { bg: 'bg-purple-50', icon: 'text-purple-600' },
            orange: { bg: 'bg-orange-50', icon: 'text-orange-600' },
        }
        return colors[color] || colors.blue
    }

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h1 className="text-2xl font-bold text-gray-800">
                    Welcome back, {user.email?.split('@')[0] || 'User'}!
                </h1>
                <p className="text-gray-500 mt-1">
                    Here&apos;s an overview of your cost management dashboard.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat) => {
                    const Icon = stat.icon
                    const colorClasses = getColorClasses(stat.color)

                    return (
                        <div
                            key={stat.name}
                            className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
                                    <Icon className={colorClasses.icon} size={24} />
                                </div>
                                <div className={`flex items-center gap-1 text-sm ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                    {stat.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                    <span>{stat.change}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                                <p className="text-sm text-gray-500">{stat.name}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium transition-colors">
                        <Package size={20} />
                        Add New Product
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium transition-colors">
                        <FileSpreadsheet size={20} />
                        Create Cost Sheet
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium transition-colors">
                        <DollarSign size={20} />
                        Set Pricing
                    </button>
                    <button className="flex items-center gap-3 p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-700 font-medium transition-colors">
                        <Activity size={20} />
                        Run Analysis
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {[
                        { action: 'Updated pricing for Product A', time: '2 hours ago', type: 'pricing' },
                        { action: 'Created cost sheet for Service B', time: '5 hours ago', type: 'cost' },
                        { action: 'Break-even analysis completed', time: '1 day ago', type: 'analysis' },
                        { action: 'Added new product category', time: '2 days ago', type: 'product' },
                    ].map((activity, idx) => (
                        <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <span className="text-gray-700">{activity.action}</span>
                            </div>
                            <span className="text-sm text-gray-400">{activity.time}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
