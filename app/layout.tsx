import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The Pentagon (Parody Edition)",
  description: "A parody website for a prompt-injection capture-the-flag classroom exercise.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <div className="bg-gold text-navy text-center text-xs font-semibold tracking-wide py-1.5 px-4">
          PARODY SITE · Fictional training exercise · Not affiliated with any government agency
        </div>
        <header className="bg-navy text-white border-b-4 border-gold">
          <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <span aria-hidden className="text-3xl leading-none">⬟</span>
              <span className="font-serif text-xl sm:text-2xl font-bold tracking-wide">
                THE PENTAGON <span className="text-gold text-sm font-sans font-semibold align-middle">(Parody Edition)</span>
              </span>
            </Link>
            <nav className="flex gap-1 text-sm font-semibold">
              <Link href="/" className="px-3 py-2 rounded hover:bg-white/10">Home</Link>
              <Link href="/ask" className="px-3 py-2 rounded bg-gold text-navy hover:brightness-110">Ask the Corporal</Link>
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="bg-navy text-white/70 text-xs text-center py-6 px-4">
          © Nobody. All five sides reserved. · This is a classroom CTF range: please attack responsibly.
        </footer>
      </body>
    </html>
  );
}
