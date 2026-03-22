# Hostinger Deployment Setup

This project is a Next.js 16 app with Supabase auth. Deploy it on Hostinger as a Node.js web app.

## 1. Prerequisites

- A Hostinger Business or Cloud plan with Node.js Web Apps support
- A Supabase project
- This project pushed to GitHub, or zipped without `node_modules`

Hostinger currently supports Node.js `18.x`, `20.x`, `22.x`, and `24.x` for deployment, and auto-detects the version from `package.json` when possible. Next.js 16 requires Node.js `20.9+`, so this project allows `>=20.9 <25` in `package.json`.

## 2. Database Setup

Run the complete schema from:

- `schema.sql`

Paste it into the Supabase SQL editor and execute it once on a fresh project.

## 3. Supabase Setup

In Supabase, configure:

- `Authentication -> URL Configuration -> Site URL`
- `Authentication -> URL Configuration -> Redirect URLs`

Add your production domain, for example:

- `https://your-domain.com`
- `https://your-domain.com/auth/callback`

If you use Google OAuth, add the same callback URL to your Google provider settings in Supabase.

## 4. Environment Variables in Hostinger

Add these environment variables in the Hostinger deployment settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 5. Deploy in Hostinger

Recommended path: GitHub deployment.

1. In hPanel, go to `Websites`.
2. Click `Add Website`.
3. Choose `Node.js Apps`.
4. Choose `Import Git Repository`.
5. Connect GitHub and select this repository.
6. Select the branch to deploy.
7. Review the auto-detected build settings.
8. Add the environment variables.
9. Deploy.

Hostinger documents this flow here:

- https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/
- https://www.hostinger.com/support/how-to-migrate-a-node-js-application-to-hostinger/

## 6. Build Settings

Use these settings if Hostinger asks for them explicitly:

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`
- Node.js version: `22.x` preferred, `20.x` also valid

## 7. Domain Connection

If you deploy first on a temporary Hostinger domain, connect your real domain afterward in hPanel and wait for DNS propagation.

Hostinger domain guide:

- https://www.hostinger.com/support/how-to-connect-a-custom-domain-to-a-node-js-application/

## 8. Post-Deployment Checks

After deployment, verify:

- Home page loads
- `/login` loads
- Register/login works
- `/auth/callback` completes successfully
- Supabase reads and writes work
- Product, cost sheet, pricing, and settings pages load after login

## 9. Common Failure Points

- Missing `NEXT_PUBLIC_SITE_URL` causes auth redirect issues
- Missing Supabase redirect URLs causes login or OAuth callback failures
- Wrong Node.js version can break Next.js 16 builds
- If Hostinger uses Node `18.x`, the build can fail because Next.js 16 needs Node `20.9+`
- If you upload a ZIP, do not include `node_modules`; Linux can fail with `node_modules/.bin/next: Permission denied` when the folder comes from Windows
- Running old SQL will miss columns required by the current app

## 10. ZIP Upload Alternative

If you deploy by ZIP instead of GitHub:

- include `package.json`, source files, `public`, `src`, and config files
- exclude `.next`
- exclude `node_modules`

## 11. Project-Specific Notes

- This app uses server-side Supabase auth helpers from `src/lib/supabase`
- The production auth callback route is `/auth/callback`
- `NEXT_PUBLIC_SITE_URL` should always match the final public HTTPS domain
