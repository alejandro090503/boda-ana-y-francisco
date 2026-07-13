import type { Metadata } from "next";
import { Cormorant_Garamond, Great_Vibes, Inter, Dancing_Script } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-ampersand",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ana Laura & Francisco — 10 Octubre 2026",
  description: "Nos casamos el 10 de octubre de 2026 en San Juan del Río, Querétaro. ¡Estás invitado a celebrar con nosotros!",
  openGraph: {
    title: "Ana Laura & Francisco — 10 Octubre 2026",
    description: "Nos casamos el 10 de octubre de 2026 en San Juan del Río, Querétaro. ¡Estás invitado a celebrar con nosotros!",
    siteName: "Boda Ana Laura & Francisco",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "https://boda-ana-y-francisco.vercel.app/sobre-og.png?v=3",
        width: 1200,
        height: 630,
        alt: "Invitación de boda Ana Laura & Francisco — 10 Octubre 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ana Laura & Francisco — 10 Octubre 2026",
    description: "Nos casamos el 10 de octubre de 2026 en San Juan del Río, Querétaro.",
    images: ["https://boda-ana-y-francisco.vercel.app/sobre-og.png?v=3"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${greatVibes.variable} ${dancingScript.variable} ${inter.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
