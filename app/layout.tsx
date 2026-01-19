import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // 1️⃣ Title & description
  title: {
    default: "CareLink AI | Hospital AI Receptionist",
    template: "%s | CareLink AI",
  },
  description:
    "CareLink AI is a RAG-based hospital AI receptionist that helps patients with appointments, doctor availability, hospital services, and FAQs.",

  // 2️⃣ Keywords
  keywords: [
    "CareLink AI",
    "Hospital AI Receptionist",
    "Healthcare AI",
    "Medical Chatbot",
    "RAG AI Hospital",
  ],

  // 3️⃣ Author
  authors: [{ name: "CareLink AI Team" }],
  creator: "CareLink AI",

  // 4️⃣ Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },

  // 5️⃣ OpenGraph
  openGraph: {
    title: "CareLink AI | Hospital AI Receptionist",
    description:
      "An intelligent RAG-based AI receptionist for hospitals and clinics.",
    url: "https://citycare.ihteshamulhaq.com",
    siteName: "CareLink AI",
    images: [
      {
        url: "/carelinkai.png",
        width: 1200,
        height: 630,
        alt: "CareLink AI Hospital Assistant",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  // 6️⃣ Twitter
  twitter: {
    card: "summary_large_image",
    title: "CareLink AI | Hospital AI Receptionist",
    description:
      "Smart AI-powered hospital receptionist built using RAG.",
    images: ["/carelinkai.png"],
  },

  // 7️⃣ App info
  applicationName: "CareLink AI",
  category: "Healthcare",

  // 8️⃣ Canonical
  alternates: {
    canonical: "https://citycare.ihteshamulhaq.com",
  },

  // 9️⃣ Icons
  icons: {
    icon: "/carelinkai.png",
    apple: "/carelinkai.png",
  },

  // 🔟 Base URL
  metadataBase: new URL("https://citycare.ihteshamulhaq.com"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider>
          {children}
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
