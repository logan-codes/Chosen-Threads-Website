import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";
import { Toaster } from 'sonner';

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Chosen Threads ",
  description: "Exquisite custom clothing and bespoke tailoring for the discerning individual.",
  icons: {
    icon: "logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="antialiased font-sans">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
