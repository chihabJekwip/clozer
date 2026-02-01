import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import MobileNav from '@/components/layout/MobileNav';
import DesktopSidebar from '@/components/layout/DesktopSidebar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Clozer - Gestion de Tournées Commerciales',
  description: 'Application de planification et suivi de tournées commerciales avec optimisation d\'itinéraires',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Clozer',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1f2937' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
          integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
          crossOrigin=""
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1f2937" media="(prefers-color-scheme: dark)" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {/* Desktop Sidebar */}
          <DesktopSidebar />
          
          {/* Main Content - offset for sidebar on desktop */}
          <div className="min-h-screen bg-background lg:pl-64">
            {children}
          </div>
          
          {/* Mobile Bottom Nav */}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
