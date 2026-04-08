import fs from 'fs';
import path from 'path';

const appDir = path.join(process.cwd(), 'src', 'app');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            if (file.startsWith('[')) continue; // skip dynamic routes
            processDir(fullPath);
        } else if (file === 'page.tsx') {
            let content = fs.readFileSync(fullPath, 'utf-8');
            
            if (content.includes("'use client'") || content.includes('"use client"')) {
                // If it's a client component and has metadata
                if (content.includes('export const metadata')) {
                    
                    // remove import type { Metadata } if present
                    content = content.replace(/import type \{ Metadata \} from "next";\r?\n?/g, '');
                    content = content.replace(/import type \{ Metadata \} from 'next';\r?\n?/g, '');
                    
                    const blockRegex = /export const metadata:\s?Metadata\s?=\s?\{[\s\S]*?alternates:\s?\{[\s\S]*?canonical:\s?"([^"]+)",?\s?\},?\s*\};\r?\n?\r?\n?/g;
                    
                    // We need to safely extract without destroying the rest of the string
                    let match;
                    let blockFound = false;
                    let routePath = '';

                    const blockRegexIter = /export const metadata:\s?Metadata\s?=\s?\{[\s\S]*?alternates:\s?\{[\s\S]*?canonical:\s?"([^"]+)",?\s?\},?\s*\};\r?\n?\r?\n?/g;
                    match = blockRegexIter.exec(content);

                    if (match) {
                        blockFound = true;
                        routePath = match[1];
                        content = content.replace(blockRegex, '');
                        
                        // Save the cleaned page.tsx
                        fs.writeFileSync(fullPath, content);
                        console.log(`Cleaned ${fullPath}`);
                        
                        // Create layout.tsx with the canonical link
                        const layoutPath = path.join(dir, 'layout.tsx');
                        
                        // If it's src/app/page.tsx, it's at the root. But the root is not "use client" so it wouldn't be grouped here, unless it is. If layout.tsx exists, we append to it (but root layout already has it).
                        if (!fs.existsSync(layoutPath)) {
                            const layoutContent = `import type { Metadata } from 'next';\n\nexport const metadata: Metadata = {\n  alternates: {\n    canonical: "${routePath}",\n  },\n};\n\nexport default function Layout({ children }: { children: React.ReactNode }) {\n  return <>{children}</>;\n}\n`;
                            fs.writeFileSync(layoutPath, layoutContent);
                            console.log(`Created ${layoutPath}`);
                        } else {
                            console.log(`Warning: layout.tsx already exists at ${layoutPath}. Please merge manually.`);
                        }
                    }
                }
            }
        }
    }
}

processDir(appDir);
