import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DataDock",
  description: "Sistema de Gestão de Dados - DataDock",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
  applicationName: 'DataDock',
  keywords: ['datadock', 'dados', 'datasets', 'gestão', 'sistema'],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ff385c',
};

// Inline script to hydrate theme before first paint — prevents flash
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('datadock-theme');
    var mode = saved || 'light';
    var resolved = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br" suppressHydrationWarning>
      <head>
        {/* Theme hydration — must run before paint to prevent flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="DataDock" />
      </head>
      <body className={`${inter.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
