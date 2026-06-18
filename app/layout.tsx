import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "台股資產總覽 | Taiwan Stock Wealth Dashboard",
  description: "即時台股資產管理儀表板 - 追蹤投資組合、損益報酬、資產配置",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
