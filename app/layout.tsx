import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "天衍牌局 · 卡牌对战 Demo",
  description: "一款面向 Erlang 服务端接入的东方玄幻卡牌对战客户端 Demo。",
  openGraph: {
    title: "天衍牌局",
    description: "东方玄幻卡牌对战客户端 Demo",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "天衍牌局",
    description: "东方玄幻卡牌对战客户端 Demo",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
