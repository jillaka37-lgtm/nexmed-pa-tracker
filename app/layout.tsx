import type { Metadata } from "next";
import { Inter, Merriweather, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { CartProvider } from "@/components/cart/cart-context";
import { QuickContact } from "@/components/quick-contact";
import { BeamsBackground } from "@/components/beams-background";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  weight: ["300", "400", "700"],
  subsets: ["latin"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "NexMed · Pharmacy & Health Solutions",
    template: "%s | NexMed",
  },
  description:
    "Compassionate, expert pharmacy and health care. Consultations, prescription refills, and everyday health products. Book or shop with NexMed.",
  openGraph: {
    title: "NexMed · Your Health, Our Mission.",
    description:
      "Compassionate, expert pharmacy and health care: consultations, refills, and everyday health products.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweather.variable} ${sourceCodePro.variable} h-full antialiased`}
    >
      <body className="bg-navy text-offwhite min-h-full flex flex-col">
        <BeamsBackground intensity="medium" />
        <CartProvider>
          <SiteHeader />
          <main className="relative z-10 flex-1 pt-16">{children}</main>
          <SiteFooter />
          <QuickContact />
        </CartProvider>
      </body>
    </html>
  );
}
