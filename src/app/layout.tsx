import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google"; // Importamos Playfair
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
// Fuente para Titulares de Lujo
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair', // Variable CSS para usarla
});

export const metadata: Metadata = {
  title: {
    default: "MIVIS STUDIO | Salón de Belleza & Spa Exclusivo",
    template: "%s | MIVIS STUDIO"
  },
  description: "Reserva tu cita en Mivis Studio. Expertos en Manicure, Pedicure, Uñas Acrílicas, Maquillaje Profesional y Estilismo. La mejor experiencia de belleza y cuidado personal.",
  keywords: ["Mivis Studio", "Salón de Belleza", "Manicure", "Pedicure", "Uñas Acrílicas", "Maquillaje", "Estilismo", "Belleza", "Spa", "Citas Online"],
  authors: [{ name: "Mivis Studio Team" }],
  creator: "Mivis Studio",
  publisher: "Mivis Studio",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "MIVIS STUDIO | Tu Momento de Brillar",
    description: "Agenda tu cita hoy mismo. Servicios exclusivos de uñas, maquillaje y cabello en un ambiente de lujo.",
    url: 'https://mivisstudio.com',
    siteName: 'Mivis Studio',
    locale: 'es_PE',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "MIVIS STUDIO | Salón de Belleza",
    description: "Expertos en belleza y cuidado personal. Reserva tu cita online.",
  },
  category: 'beauty',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} ${playfair.variable} bg-[#0f2a24] text-[#e0e7e4]`}>
        {/* bg-[#0f2a24] es un VERDE PETRÓLEO PROFUNDO muy elegante */}
        {/* text-[#e0e7e4] es un blanco hueso/menta muy suave */}
        {children}
      </body>
    </html>
  );
}
