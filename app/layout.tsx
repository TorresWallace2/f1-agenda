import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agenda F1 & F2",
  description: "Calendário F1 e F2 em horário de Brasília com integração Google Agenda."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
