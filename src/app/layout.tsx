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
  title: "MIVIS STUDIO - Exclusivity & Beauty",
  description: "Sistema de Gestión Premium",
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
