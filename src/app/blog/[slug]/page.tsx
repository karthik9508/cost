import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Clock, Calendar, User, Tag } from "lucide-react";
import { getPostBySlug } from "@/lib/blog";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Navbar Simplified */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/60">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <div className="flex justify-between items-center h-16">
                        <Link
                            href="/blog"
                            className="inline-flex items-center text-slate-600 hover:text-blue-600 font-medium transition-colors"
                        >
                            <ArrowLeft size={18} className="mr-2" />
                            Back to Blog
                        </Link>
                        <Link href="/">
                            <Image
                                src="/cost analyst.webp"
                                alt="Cost Analyst Logo"
                                width={120}
                                height={35}
                                className="h-6 w-auto opacity-70 hover:opacity-100 transition-opacity"
                                priority
                            />
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Article Header */}
            <article className="pt-32 pb-16">
                <header className="max-w-3xl mx-auto px-4 sm:px-6 mb-12 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                        <Tag size={12} />
                        {post.category}
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
                        {post.title}
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed text-balance">
                        {post.excerpt}
                    </p>

                    <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 font-medium pb-8 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                                {post.author.charAt(0)}
                            </div>
                            <span className="text-slate-700">{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar size={16} />
                            {post.date}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock size={16} />
                            {post.readTime}
                        </div>
                    </div>
                </header>

                {/* Cover Image Placeholder */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-16">
                    <div className="w-full aspect-[2/1] bg-slate-200 rounded-2xl overflow-hidden relative border border-slate-200 shadow-sm flex items-center justify-center">
                         {/* This would be an Image component in reality, if an image path exists */}
                         <p className="text-slate-400 font-medium">Cover Image: {post.image}</p>
                    </div>
                </div>

                {/* Article Content */}
                <div className="max-w-3xl mx-auto px-4 sm:px-6">
                    <div className="prose prose-lg prose-slate prose-a:text-blue-600 hover:prose-a:text-blue-500 prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-12 prose-img:rounded-xl">
                        <ReactMarkdown>{post.content}</ReactMarkdown>
                    </div>
                </div>
            </article>

            {/* Newsletter CTA */}
            <section className="py-16 bg-white border-t border-slate-200">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
                    <h3 className="text-2xl font-bold text-slate-900 mb-4">Enjoyed this article?</h3>
                    <p className="text-slate-500 mb-8">Subscribe to our newsletter for more weekly cost accounting tips and tricks.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button className="px-6 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-colors">
                            Subscribe
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
