import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Rajdhani } from "next/font/google";
import "./globals.css";
import { getSiteContactSettings } from "@/lib/site-contact";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Angular, esports-style display font for headings — Plus Jakarta Sans stays
// on body copy and form controls so the site stays readable, not gimmicky.
const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NgeStore — Top Up Game Cepat & Aman",
    template: "%s · NgeStore",
  },
  description:
    "Top up diamond, UC, dan voucher game favoritmu di NgeStore. Proses cepat, harga bersahabat, pembayaran aman lewat QRIS, e-wallet, dan transfer bank.",
};

export const viewport = {
  themeColor: "#0b0e1a",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Contact info in the footer is cosmetic — a DB hiccup here must never take
  // down every page on the site (including this layout's own error/not-found
  // pages), so fall back to "no contact section" instead of throwing.
  const contact = await getSiteContactSettings().catch(() => ({
    csWhatsapp: null,
    csEmail: null,
  }));

  return (
    <html
      lang="id"
      className={`${plusJakartaSans.variable} ${rajdhani.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer csWhatsapp={contact.csWhatsapp} csEmail={contact.csEmail} />
      </body>
    </html>
  );
}
