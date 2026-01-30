import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Woohoo DSA - AI-Powered Coding Practice",
  description: "Master Data Structures & Algorithms with AI-powered evaluation. Practice LeetCode-style problems from Striver's SDE Sheet.",
  keywords: "DSA, LeetCode, Striver, SDE Sheet, Coding Practice, Interview Prep, C++",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
