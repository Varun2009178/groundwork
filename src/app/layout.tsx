import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Groundwork — Give your AI the full picture",
  description: "Turn plain English into structured database context files that AI tools actually understand.",
  openGraph: {
    title: "Groundwork — Give your AI the full picture",
    description: "Turn plain English into structured database context files that AI tools actually understand.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Groundwork — Give your AI the full picture",
    description: "Turn plain English into structured database context files that AI tools actually understand.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
