import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppUpdater } from "@/components/app-updater";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 하위 페이지는 제목만 적으면 "Q-Do | 로그인" 형태로 완성된다
  title: {
    default: "Q-Do",
    template: "Q-Do | %s",
  },
  description: "중요한 일에 먼저 집중하는 4분면 스케줄러",
  applicationName: "Q-Do",
  appleWebApp: {
    capable: true,
    title: "Q-Do",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  other: {
    // Next는 표준 이름인 mobile-web-app-capable만 내보낸다.
    // iOS Safari는 여전히 apple- 접두 버전을 봐야 홈스크린에서 주소창 없이 뜬다.
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0d",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  // 노치 있는 기기에서 배경이 가장자리까지 차게
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      {/* 화면 높이는 각 뷰의 .app-shell이 100dvh로 잡는다 */}
      <body className="font-sans">
        {children}
        <AppUpdater />
      </body>
    </html>
  );
}
