import Link from "next/link";
import Image from "next/image";
import { getUser } from "@/app/auth/actions";
import {
  FileSpreadsheet,
  DollarSign,
  TrendingUp,
  Calculator,
  BarChart3,
  Shield,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  ChevronRight,
  Star,
  Zap,
  Users
} from "lucide-react";

export default async function Home() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-blue-500/20 shadow-lg">
                C
              </div>
              <span className="text-xl font-bold text-slate-800 tracking-tight">
                Cost <span className="text-blue-600">Analyst</span>
              </span>
            </div>

            <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              <Link href="/cost-sheet" className="hover:text-blue-600 transition-colors">Cost Sheet</Link>
              <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
              <Link href="/break-even" className="hover:text-blue-600 transition-colors">Break-Even</Link>
            </div>

            <div className="flex gap-3">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center gap-2 text-sm"
                >
                  Dashboard
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="hidden sm:inline-flex px-5 py-2.5 text-slate-600 hover:text-slate-900 font-medium transition-colors text-sm"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium transition-all shadow-lg hover:shadow-xl text-sm"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-0 w-[1000px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10 opacity-60" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl -z-10 opacity-60" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-16 items-center">

          {/* Text Content - Left Column */}
          <div className="text-center lg:text-left lg:col-span-5 animate-fade-in-up mb-16 lg:mb-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-blue-600 text-xs font-semibold uppercase tracking-wide mb-6 mx-auto lg:mx-0">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              New v2.0 Released
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-900 mb-6 tracking-tight leading-tight">
              Master Your <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Business Costs
              </span>
            </h1>

            <p className="text-lg text-slate-500 mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
              The all-in-one platform to track production costs, set profitable prices, and analyze break-even points with precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {user ? (
                <Link
                  href="/dashboard"
                  className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg"
                >
                  Go to Dashboard
                  <ArrowRight size={20} />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 transition-all transform hover:-translate-y-1 text-lg"
                  >
                    Start Free Trial
                  </Link>
                  <Link
                    href="#how-it-works"
                    className="px-8 py-3.5 bg-white text-slate-700 hover:text-slate-900 font-semibold rounded-full border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all text-lg flex items-center justify-center gap-2"
                  >
                    <Zap size={20} className="text-yellow-500" />
                    How It Works
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Image Content - Right Column */}
          <div className="lg:col-span-7 relative perspective-1000 animate-fade-in-up-delay-200">
            <div className="relative rounded-2xl border-4 border-slate-900/5 bg-slate-900/5 p-2 shadow-2xl transform rotate-x-6 lg:rotate-y-12 lg:rotate-x-6 hover:rotate-0 transition-transform duration-700 ease-out">
              <div className="rounded-xl overflow-hidden shadow-2xl bg-white aspect-[16/9]">
                <Image
                  src="/dashboard-hero.png"
                  alt="CostApp Dashboard"
                  width={1200}
                  height={675}
                  className="object-cover w-full h-full"
                  priority
                />
              </div>
            </div>

            {/* Floating Badges */}
            <div className="absolute -right-4 lg:-right-12 top-10 bg-white p-3 lg:p-4 rounded-xl shadow-xl border border-slate-100 animate-float hidden sm:block z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg text-green-600">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Profit Margin</p>
                  <p className="text-lg font-bold text-slate-800">+24%</p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 lg:-left-8 bottom-10 bg-white p-3 lg:p-4 rounded-xl shadow-xl border border-slate-100 animate-float hidden sm:block z-10" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Active Users</p>
                  <p className="text-lg font-bold text-slate-800">1,200+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-8">Trusted by innovative manufacturing teams</p>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16 grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {/* Placeholder Logos - using text for now */}
            <span className="text-2xl font-bold font-serif text-slate-800">Acme Corp</span>
            <span className="text-2xl font-bold font-sans text-slate-800 tracking-tighter">GlobalTech</span>
            <span className="text-2xl font-bold font-mono text-slate-800">S T R U C T</span>
            <span className="text-2xl font-bold font-serif italic text-slate-800">Prestige.</span>
            <span className="text-2xl font-bold font-sans text-slate-800">NEXUS</span>
          </div>
        </div>
      </section>

      {/* Features Grid - id="features" */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Powerful Tools for <span className="text-blue-600">Cost Control</span>
            </h2>
            <p className="text-lg text-slate-500">
              Everything you need to manage your manufacturing costs, pricing strategies, and profitability in one unified platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileSpreadsheet,
                title: "Smart Cost Sheets",
                desc: "Create dynamic cost sheets with drag-and-drop ease. Track materials, labor, and overheads in real-time.",
                color: "blue"
              },
              {
                icon: DollarSign,
                title: "Intelligent Pricing",
                desc: "Stop guessing. Use Cost-Plus, Market-Based, and Target Profit pricing models to find your perfect price.",
                color: "green"
              },
              {
                icon: TrendingUp,
                title: "Break-Even Analysis",
                desc: "Visualize your break-even point instantly. Know exactly how many units you need to sell to turn a profit.",
                color: "purple"
              },
              {
                icon: Calculator,
                title: "Instant Calculations",
                desc: "Change one variable and see the impact across your entire pricing strategy instantly.",
                color: "orange"
              },
              {
                icon: BarChart3,
                title: "Visual Analytics",
                desc: "Beautiful charts and graphs give you a bird's-eye view of your cost structure and profitability.",
                color: "pink"
              },
              {
                icon: Shield,
                title: "Enterprise Security",
                desc: "Your financial data is protected with bank-grade encryption and granular access controls.",
                color: "slate"
              }
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 bg-white rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-colors ${feature.color === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' :
                  feature.color === 'green' ? 'bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white' :
                    feature.color === 'purple' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                      feature.color === 'orange' ? 'bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white' :
                        feature.color === 'pink' ? 'bg-pink-50 text-pink-600 group-hover:bg-pink-600 group-hover:text-white' :
                          'bg-slate-50 text-slate-600 group-hover:bg-slate-600 group-hover:text-white'
                  }`}>
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Large Gradient Box */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden bg-blue-600 text-white shadow-2xl shadow-blue-900/20 px-8 py-20 text-center">
            {/* Decor */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-5xl font-bold mb-6">
                Ready to optimize your profits?
              </h2>
              <p className="text-xl text-blue-100 mb-10">
                Join thousands of smart manufacturers who are taking control of their costs today. No credit card required.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="px-10 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all shadow-lg transform hover:-translate-y-1"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    className="px-10 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all shadow-lg transform hover:-translate-y-1"
                  >
                    Get Started Free
                  </Link>
                )}
              </div>

              <p className="mt-8 text-sm text-blue-200 opacity-80">
                Free 14-day trial • Cancel anytime • No setup fees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
                <span className="text-xl font-bold text-white">Cost Analyst</span>
              </Link>
              <p className="text-slate-400 mb-6 max-w-xs leading-relaxed">
                The #1 cost management platform for modern manufacturing and service businesses. Built for accuracy, designed for growth.
              </p>
              <div className="flex gap-4">
                {/* Socials (Simulated) */}
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="sr-only">Twitter</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-blue-600 transition-colors cursor-pointer">
                  <span className="sr-only">GitHub</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4">
                <li><Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link></li>
                <li><Link href="/cost-sheet" className="hover:text-blue-400 transition-colors">Cost Sheet</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-400 transition-colors">Pricing Decisions</Link></li>
                <li><Link href="/break-even" className="hover:text-blue-400 transition-colors">Break-Even Analysis</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Tools</h4>
              <ul className="space-y-4">
                <li><Link href="/products" className="hover:text-blue-400 transition-colors">Products & Services</Link></li>
                <li><Link href="/what-if" className="hover:text-blue-400 transition-colors">What-If Analysis</Link></li>
                <li><Link href="/reports" className="hover:text-blue-400 transition-colors">Reports</Link></li>
                <li><Link href="/settings" className="hover:text-blue-400 transition-colors">Settings</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6">Account</h4>
              <ul className="space-y-4">
                <li><Link href="/login" className="hover:text-blue-400 transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-blue-400 transition-colors">Sign Up</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-sm text-slate-600">
            © 2024 Cost Analyst Inc. All rights reserved.
          </div>
        </div>
      </footer>

      {/* WhatsApp Support Widget */}
      <a
        href="https://wa.me/1234567890?text=Hi%2C%20I%20need%20help%20with%20Cost%20Analyst"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all transform hover:scale-110"
        aria-label="Contact us on WhatsApp"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 text-white"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
