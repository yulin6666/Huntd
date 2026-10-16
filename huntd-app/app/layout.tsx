import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Huntd",
  description: "公司购买信号监控",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh" className="h-full">
      <body className="h-full bg-gray-950 text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
