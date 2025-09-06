import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ReactQueryProvider } from "@/components/providers/ReactQueryProvider";
import { AlertProvider } from "@/components/ui/alert-system";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sarabun = Sarabun({
  weight: ["400", "700"],
  subsets: ["thai", "latin"],
  variable: "--font-sarabun",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ระบบบันทึกสุขภาพอิเล็กทรอนิกส์ | Healthcare Blockchain System",
  description: "ระบบบันทึกสุขภาพอิเล็กทรอนิกส์และการแลกเปลี่ยนข้อมูลโดยใช้เทคโนโลยีบล็อกเชน พร้อมการคาดการณ์ความเสี่ยงของโรคโดยใช้ปัญญาประดิษฐ์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${geistSans.variable} ${geistMono.variable} ${sarabun.variable}`}>
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            <AlertProvider>
              {children}
            </AlertProvider>
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
