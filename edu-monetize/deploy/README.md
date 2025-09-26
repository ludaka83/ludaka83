This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## PWA and Play Store (TWA)

This app is PWA-enabled and includes a service worker and manifest.

To publish on Play Store via Trusted Web Activity (TWA):

1. Install Bubblewrap globally:
   ```bash
   npm i -g @bubblewrap/cli
   ```
2. Update `bubblewrap-config.json` with your domain, packageId, and icons.
3. Generate project and build release:
   ```bash
   bubblewrap init --manifest=https://YOUR_DOMAIN/manifest.webmanifest
   # or use the local bubblewrap-config.json to seed values
   bubblewrap build
   ```
4. Create/upload a Play Console signing key or use an upload key per your policy.
5. Test on device:
   ```bash
   bubblewrap install
   ```
6. Submit the generated `.aab` to Play Console.

Notes:
- Ensure your site is served over HTTPS on a verified domain (required for TWA).
- Update `.env` values in production and rebuild.
- Confirm asset links for TWA: host `/.well-known/assetlinks.json` with proper SHA-256 from your signing key.
