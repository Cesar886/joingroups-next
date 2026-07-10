'use client';

import { useState } from 'react';
import Link from 'next/link';
import { IconSearch, IconUsers, IconTrophy, IconEye, IconChevronRight, IconSwords } from '@tabler/icons-react';
import slugify from '@/lib/slugify';
import classes from '@/app/styles/ClanClashRoyale.module.css';
import { useTranslation } from 'react-i18next';

function filterData(data, search) {
  const q = search.toLowerCase().trim();
  if (!q) return data;
  return data.filter((item) => {
    const categories = Array.isArray(item.categories) ? item.categories.join(' ') : item.categories || '';
    const description = typeof item.description === 'object' ? Object.values(item.description || {}).join(' ') : item.description || '';
    return (
      item.name?.toLowerCase().includes(q) ||
      categories.toLowerCase().includes(q) ||
      description.toLowerCase().includes(q)
    );
  });
}

const REGIONAL_CONTENT = {
  mexico: {
    title: 'Clanes de Clash Royale en México',
    subtitle: 'Encuentra clanes mexicanos activos para unirte o reclutar miembros',
    intro: 'México tiene una de las comunidades más grandes y apasionadas de Clash Royale en el mundo. Unirte a un clan mexicano te permite coordinar en tu mismo huso horario, compartir estrategias en español y competir en guerras de clanes con jugadores de tu país.',
    tips: [
      'Busca clanes con alta actividad en guerras de clanes para maximizar recompensas.',
      'Clanes con buena comunicación en Discord o Telegram suelen tener mejor coordinación.',
      'Verifica los requisitos de copas antes de unirte para evitar conflictos.',
      'Si lideras un clan, publícalo gratis para atraer más miembros mexicanos.',
    ],
    cta: '¿Tienes un clan mexicano? Publica tu clan gratis y recluta jugadores de México.',
  },
  espana: {
    title: 'Clanes de Clash Royale en España',
    subtitle: 'Clanes españoles activos para todos los niveles',
    intro: 'La comunidad española de Clash Royale es una de las más competitivas de Europa. Unirte a un clan español te da acceso a jugadores experimentados, organización en guerras y un ambiente donde el español es el idioma principal.',
    tips: [
      'Los clanes españoles competitivos suelen exigir participación obligatoria en guerras.',
      'Clanes con donaciones rápidas te ayudan a subir de nivel tus cartas más rápido.',
      'Prueba diferentes clanes hasta encontrar el que mejor se adapte a tu horario.',
      'Si lideras un clan, destaca tu país en la descripción para atraer jugadores locales.',
    ],
    cta: '¿Eres líder de un clan español? Publícalo y llega a más jugadores de España.',
  },
  argentina: {
    title: 'Clanes de Clash Royale en Argentina',
    subtitle: 'Comunidad argentina de Clash Royale activa y competitiva',
    intro: 'Argentina cuenta con jugadores de Clash Royale muy talentosos y apasionados. Unirte a un clan argentino te permite compartir estrategias, participar en guerras de clanes y formar parte de una comunidad unida que comparte tu misma pasión por el juego.',
    tips: [
      'Busca clanes con actividad en el chat para asegurar buena comunicación.',
      'Clanes que participan en guerras todas las semanas suelen ser más organizados.',
      'Revisa las reglas del clan antes de unirte para evitar malentendidos.',
      'Si tienes un clan argentino, publícalo y hazlo crecer con jugadores locales.',
    ],
    cta: '¿Tienes un clan argentino? Publícalo gratis y conecta con jugadores de Argentina.',
  },
};

export default function RegionalClansClient({ initialData, country }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [data] = useState(initialData || []);
  const [sortedData, setSortedData] = useState(initialData || []);

  const handleSearch = (value) => {
    setSearch(value);
    setSortedData(filterData(data, value));
  };

  const content = REGIONAL_CONTENT[country.slug] || REGIONAL_CONTENT.mexico;

  return (
    <div className={classes.pageBg}>
      <div className={classes.wrapper}>
        {/* Breadcrumb */}
        <nav className={classes.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span> / </span>
          <Link href="/clanes">Clanes</Link>
          <span> / </span>
          <Link href="/clanes/clanes-de-clash-royale">Clash Royale</Link>
          <span> / </span>
          <span>{country.name}</span>
        </nav>

        {/* Hero */}
        <section className={classes.hero}>
          <div className={classes.eyebrow}>
            <span className={classes.eyebrowDot} />
            Clanes por país
          </div>
          <h1 className={classes.pageTitle}>{content.title} {country.flag}</h1>
          <p className={classes.pageSub}>
            {content.subtitle} · {data.length} clanes encontrados
          </p>
        </section>

        {/* SEO Intro Content */}
        <section className={classes.seoContent}>
          <p className={classes.seoParagraph}>{content.intro}</p>
          <div className={classes.seoTips}>
            <h2>Consejos para elegir un clan en {country.name}</h2>
            <ul>
              {content.tips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Search */}
        <div className={classes.controlsBar}>
          <div className={classes.searchBox}>
            <IconSearch size={15} className={classes.searchIcon} />
            <input
              className={classes.searchInput}
              placeholder={`Buscar clanes en ${country.name}...`}
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Clan List */}
        {sortedData.length > 0 ? sortedData.map((row, idx) => {
          const slug = row.slug || slugify(row.name);
          const desc = typeof row.description === 'object'
            ? row.description.es || row.description.en || ''
            : row.description;
          const href = `/clanes/clanes-de-clash-royale/${slug}`;

          return (
            <Link key={`${row.id}-${slug}-${idx}`} href={href} className={classes.clanCard}>
              <article>
                <div className={classes.clanCardTop}>
                  <div className={`${classes.clanAvatar} ${classes.avatarRoyale}`}>
                    <img src="/clashRoyaleFondo1.webp" alt="Clash Royale" />
                  </div>
                  <div className={classes.clanInfo}>
                    <div className={classes.clanName}>{row.name}</div>
                    <div className={classes.clanMeta}>
                      {row.destacado && <span className={classes.highlightBadge}>Destacado</span>}
                      <span className={classes.gameLabel}>Clash Royale</span>
                      {row.categories && <span className={classes.metaText}>{row.categories}</span>}
                    </div>
                  </div>
                  <IconChevronRight size={16} className={classes.chevron} />
                </div>
                {desc && <p className={classes.clanDesc}>{desc}</p>}
                <div className={classes.clanStats}>
                  <div className={classes.statCell}>
                    <span className={classes.statVal}>{row.categories || '—'}</span>
                    <span className={classes.statLbl}><IconSwords size={9} />Categoría</span>
                  </div>
                  <div className={classes.statCell}>
                    <span className={classes.statVal}>{row.content18 === 'Sí' ? '18+' : 'Público'}</span>
                    <span className={classes.statLbl}>Contenido</span>
                  </div>
                  <div className={classes.statCell}>
                    <span className={classes.statVal}>{row.visitas ?? 0}</span>
                    <span className={classes.statLbl}><IconEye size={9} />Vistas</span>
                  </div>
                </div>
              </article>
            </Link>
          );
        }) : (
          <div className={classes.emptyState}>
            No encontramos clanes de Clash Royale en {country.name} todavía.{' '}
            <Link href="/clanes/publicar-clan">¡Publica el primero!</Link>
          </div>
        )}

        {/* More countries */}
        <section className={classes.footerCta}>
          <p className={classes.footerCtaTitle}>Explora clanes por país</p>
          <div className={classes.countryLinks}>
            <Link href="/clanes/clanes-de-clash-royale/mexico">🇲🇽 México</Link>
            <Link href="/clanes/clanes-de-clash-royale/espana">🇪🇸 España</Link>
            <Link href="/clanes/clanes-de-clash-royale/argentina">🇦🇷 Argentina</Link>
          </div>
        </section>

        {/* CTA */}
        <section className={classes.footerCta}>
          <p className={classes.footerCtaTitle}>¿Tienes un clan en {country.name}?</p>
          <p className={classes.footerCtaText}>{content.cta}</p>
          <Link href="/clanes/publicar-clan" className={classes.publishBtn}>
            <IconSwords size={14} /> Publicar clan gratis
          </Link>
        </section>
      </div>
    </div>
  );
}
