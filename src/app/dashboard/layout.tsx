import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar />
            <div className="lg:pl-64">
                <Header />
                <main className="p-4">
                    {children}
                </main>
            </div>
        </div>
    )
}
