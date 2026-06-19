import type { Metadata, Viewport } from 'next';
import './globals.css';

const title = '台股資產總覽 | Taiwan Stock Wealth Dashboard';
const description = '即時台股投資組合管理儀表板 - 追蹤資產、損益、配置、盤中報價';
const url = 'https://taiwan-stock-wealth-dashboard.vercel.app';

export const metadata: Metadata = {
  title,
  description,
  applicationName: '台股資產總覽',
  authors: [{ name: 'Taiwan Stock Wealth' }],
  keywords: ['台股', '投資組合', '資產管理', '股票', '即時報價', '財富管理'],
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: '台股資產總覽',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    url,
    title,
    description,
    siteName: '台股資產總覽',
    images: [
      {
        url: `${url}/api/og`,
        width: 1200,
        height: 630,
        alt: '台股資產總覽 - 即時投資組合管理',
      },
    ],
    locale: 'zh_TW',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [`${url}/api/og`],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#d8b46e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <link rel="apple-touch-icon" href="/icon-512.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
