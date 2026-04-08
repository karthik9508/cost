import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, ArrowRight, ArrowLeft, Search, Tag } from "lucide-react";
import { getPosts } from "@/lib/blog";

import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/blog",
  },
};

export default function BlogPage() {
    const blogPosts = getPosts();
    const featuredPosts = blogPosts.filter((post) => post.featured);
    const regularPosts = blogPosts.filter((post) => !post.featured);

    // Compute categories dynamically based on actual markdown files
    const categoryCounts: Record<string, number> = {};
    blogPosts.forEach(post => {
        categoryCounts[post.category] = (categoryCounts[post.category] || 0) + 1;
    });
    
    const categories = [
        { name: "All Posts", count: blogPosts.length },
        ...Object.entries(categoryCounts).map(([name, count]) => ({ name, count }))
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        <div className="flex items-center gap-2">
                            <Link href="/">
                                <Image
                                    src="/cost analyst.webp"
                                    alt="Cost Analyst Logo"
                                    width={140}
                                    height={40}
                                    className="h-8 w-auto"
                                    priority
                                />
                            </Link>
                        </div>

                        <div className="hidden md:flex gap-8 items-center text-sm font-medium text-slate-600">
                            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
                            <Link href="/cost-sheet" className="hover:text-blue-600 transition-colors">Cost Sheet</Link>
                            <Link href="/pricing" className="hover:text-blue-600 transition-colors">Pricing</Link>
                            <Link href="/break-even" className="hover:text-blue-600 transition-colors">Break-Even</Link>
                            <Link href="/blog" className="text-blue-600 font-semibold">Blog</Link>
                        </div>

                        <div className="flex gap-3">
                            <Link
                                href="/dashboard"
                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center gap-2 text-sm"
                            >
                                Dashboard
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wide mb-6">
                            <BookOpen size={14} />
                            Knowledge Hub
                        </div>
                        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                            Costing & Management <span className="text-blue-400">Accounting Blog</span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
                            Expert insights, practical guides, and industry best practices for cost accounting,
                            pricing strategies, and financial decision-making.
                        </p>

                        {/* Search Bar */}
                        <div className="max-w-xl mx-auto relative">
                            <input
                                type="text"
                                placeholder="Search articles..."
                                className="w-full px-6 py-4 bg-white/10 border border-white/10 rounded-full text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pl-14"
                            />
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section className="py-8 bg-white border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-wrap gap-3 justify-center">
                        {categories.map((category, idx) => (
                            <button
                                key={idx}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${idx === 0
                                        ? "bg-blue-600 text-white"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {category.name}
                                <span className="ml-2 text-xs opacity-70">({category.count})</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Posts */}
            <section className="py-16 bg-slate-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                            Featured Articles
                        </h2>
                        <Link
                            href="#all-posts"
                            className="text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors flex items-center gap-1"
                        >
                            View All
                            <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredPosts.map((post) => (
                            <article
                                key={post.slug}
                                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300"
                            >
                                {/* Image Placeholder */}
                                <div className="aspect-video bg-gradient-to-br from-blue-100 to-slate-100 relative overflow-hidden">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <BookOpen size={48} className="text-blue-300" />
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                                            {post.category}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                                        <span>{post.date}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            {post.readTime}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">
                                        {post.excerpt}
                                    </p>

                                    <Link
                                        href={`/blog/${post.slug}`}
                                        className="inline-flex items-center text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors group-hover:translate-x-1 transform duration-300"
                                    >
                                        Read Article
                                        <ArrowRight size={16} className="ml-1" />
                                    </Link>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* All Posts */}
            <section id="all-posts" className="py-16 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-10">
                        All Articles
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                        {blogPosts.map((post) => (
                            <article
                                key={post.slug}
                                className="group flex gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-lg transition-all duration-300"
                            >
                                {/* Image Placeholder */}
                                <div className="w-32 h-32 flex-shrink-0 bg-gradient-to-br from-blue-100 to-slate-100 rounded-xl flex items-center justify-center">
                                    <BookOpen size={32} className="text-blue-300" />
                                </div>

                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-semibold rounded">
                                            {post.category}
                                        </span>
                                        <span className="text-slate-400 text-xs flex items-center gap-1">
                                            <Clock size={12} />
                                            {post.readTime}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>

                                    <p className="text-slate-500 text-sm mb-3 line-clamp-2">
                                        {post.excerpt}
                                    </p>

                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400 text-xs">{post.date}</span>
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-blue-600 font-semibold text-sm hover:text-blue-700 transition-colors flex items-center gap-1"
                                        >
                                            Read
                                            <ArrowRight size={14} />
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Newsletter CTA */}
            <section className="py-16 px-4 sm:px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-8 lg:p-12 text-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="relative z-10">
                            <h2 className="text-2xl lg:text-3xl font-bold mb-4">
                                Stay Updated with Cost Accounting Insights
                            </h2>
                            <p className="text-blue-100 mb-8 max-w-lg mx-auto">
                                Get the latest articles on costing strategies, pricing methods, and management accounting tips delivered to your inbox.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-5 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50"
                                />
                                <button className="px-6 py-3 bg-white text-blue-600 font-bold rounded-full hover:bg-blue-50 transition-all shadow-lg">
                                    Subscribe
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Back to Home */}
            <section className="py-8 bg-slate-50 border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-slate-600 hover:text-blue-600 transition-colors font-medium"
                    >
                        <ArrowLeft size={16} className="mr-2" />
                        Back to Home
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-2">
                            <Image
                                src="/cost analyst.webp"
                                alt="Cost Analyst Logo"
                                width={120}
                                height={35}
                                className="h-7 w-auto brightness-0 invert"
                            />
                        </div>
                        <div className="flex gap-6 text-sm">
                            <Link href="/" className="hover:text-blue-400 transition-colors">Home</Link>
                            <Link href="/dashboard" className="hover:text-blue-400 transition-colors">Dashboard</Link>
                            <Link href="/blog" className="hover:text-blue-400 transition-colors">Blog</Link>
                            <Link href="/#contact" className="hover:text-blue-400 transition-colors">Contact</Link>
                        </div>
                        <p className="text-sm text-slate-500">
                            © 2024 Cost Analyst. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
