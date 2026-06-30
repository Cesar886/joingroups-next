import Link from "next/link";

export const metadata = {
  title: "Grupos de Telegram 2026 | Buscar Grupos por Categoría",
  description:
    "Encuentra grupos de Telegram por categoría: tributos, caseros, packs y más. Todos los grupos verificados y actualizados en 2026.",
  alternates: {
    canonical: "https://www.joingroups.lat/telegram/grupos",
  },
  openGraph: {
    title: "Grupos de Telegram | Todas las Categorías 2026",
    description:
      "Busca grupos de Telegram por categoría. Miles de grupos verificados.",
    url: "https://www.joingroups.lat/telegram/grupos",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GruposTelegramPage() {
  return (
    <main>
      <h1>Grupos de Telegram 2026</h1>
      <p>
        Explora todos los grupos de Telegram organizados por categoría. Grupos
        verificados y actualizados diariamente.
      </p>
      <nav>
        <Link href="/telegram/tributos">Tributos</Link>
        <Link href="/telegram/grupos-caseros">Grupos Caseros España</Link>
        <Link href="/telegram/packs">Packs</Link>
      </nav>
      {/* Lista general de grupos */}
    </main>
  );
}
