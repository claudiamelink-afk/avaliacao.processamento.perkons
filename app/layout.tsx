import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Seleção Processamento", description: "Plataforma de avaliação de candidatos para processamento e análise de imagens." };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="pt-BR"><body>{children}</body></html>; }
