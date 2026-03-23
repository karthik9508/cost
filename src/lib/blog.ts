import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const blogDirectory = path.join(process.cwd(), 'src/content/blog');

export type BlogPost = {
    slug: string;
    title: string;
    excerpt: string;
    category: string;
    author: string;
    date: string;
    readTime: string;
    image: string;
    featured: boolean;
    content: string;
};

export function getPosts(): BlogPost[] {
    // Check if the directory exists
    if (!fs.existsSync(blogDirectory)) {
        return [];
    }

    const fileNames = fs.readdirSync(blogDirectory);
    
    const allPosts = fileNames
        .filter((fileName) => fileName.endsWith('.md'))
        .map((fileName) => {
            const slug = fileName.replace(/\.md$/, '');
            const fullPath = path.join(blogDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');

            // Parse metadata section
            const matterResult = matter(fileContents);

            return {
                slug,
                content: matterResult.content,
                ...matterResult.data,
            } as BlogPost;
        });

    // Sort posts by date descending
    return allPosts.sort((a, b) => {
        if (new Date(a.date) < new Date(b.date)) {
            return 1;
        } else {
            return -1;
        }
    });
}

export function getPostBySlug(slug: string): BlogPost | null {
    try {
        const fullPath = path.join(blogDirectory, `${slug}.md`);
        
        if (!fs.existsSync(fullPath)) {
            return null;
        }
        
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const matterResult = matter(fileContents);

        return {
            slug,
            content: matterResult.content,
            ...matterResult.data,
        } as BlogPost;
    } catch (e) {
        return null;
    }
}
