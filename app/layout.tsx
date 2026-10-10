import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ProfileProvider } from "@/context/profile-context" // Import ProfileProvider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Jom Eja - Aplikasi Kad Imbas Bahasa Melayu",
  description:
    "Aplikasi pembelajaran interaktif untuk menguasai suku kata Bahasa Melayu. Dilengkapi dengan pelbagai mod latihan, sistem markah, analisis prestasi, dan karakter motivasi. Sesuai untuk kanak-kanak dan pelajar dewasa.",
  keywords: [
    "Bahasa Melayu",
    "suku kata",
    "kad imbas",
    "flashcard",
    "pembelajaran",
    "pendidikan",
    "Malaysia",
    "ejaan",
    "membaca",
    "interactive learning",
    "syllables",
    "Malay language",
    "education app",
    "spelling practice",
  ],
  authors: [{ name: "Jom Eja Team" }],
  creator: "Jom Eja",
  publisher: "Jom Eja",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://jom-eja.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Jom Eja - Aplikasi Kad Imbas Bahasa Melayu",
    description:
      "Aplikasi pembelajaran interaktif untuk menguasai suku kata Bahasa Melayu dengan pelbagai mod latihan dan analisis prestasi.",
    url: "https://jom-eja.vercel.app",
    siteName: "Jom Eja",
    images: [
      {
        url: "/images/chrome-preview.png",
        width: 1200,
        height: 630,
        alt: "Jom Eja - Aplikasi Kad Imbas Bahasa Melayu",
      },
    ],
    locale: "ms_MY",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jom Eja - Aplikasi Kad Imbas Bahasa Melayu",
    description:
      "Aplikasi pembelajaran interaktif untuk menguasai suku kata Bahasa Melayu dengan pelbagai mod latihan dan analisis prestasi.",
    images: ["/images/chrome-preview.png"],
    creator: "@jomeja",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      {
        url: "/images/tab-web.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    shortcut: "/images/tab-web.png",
    apple: [
      {
        url: "/images/tab-web.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
  },
  manifest: "/manifest.json",
  verification: {
    google: "your-google-verification-code",
  },
    generator: 'v0.app'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fda4af" },
    { media: "(prefers-color-scheme: dark)", color: "#fda4af" },
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ms">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <ProfileProvider>{children}</ProfileProvider> {/* Wrap with ProfileProvider */}
      </body>
    </html>
  )
}
