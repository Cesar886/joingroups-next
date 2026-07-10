"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { IconSearch, IconUsers, IconTrophy, IconEye, IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import slugify from '@/lib/slugify';
import classes from '@/app/styles/ClanClashRoyale.module.css';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const API_URL = '';

function filterData(data, search) {
  const q = search.toLowerCase().trim();
  if (!q) return data;

  return data.filter((item) => {
    const categories = Array.isArray(item.categories)
      ? item.categories.join(' ')
      : item.categories || '';
    const description = typeof item.description === 'object'
      ? Object.values(item.description || {}).join(' ')
      : item.description || '';

    return (
      item.name?.toLowerCase().includes(q) ||
      categories.toLowerCase().includes(q) ||
      description.toLowerCase().includes(q)
    );
  });
}

const FAQ_ITEMS = [
  { q: 'mobile0.acordion.clashroyale.p1.q', a: 'mobile0.acordion.clashroyale.p1.a' },
  { q: 'mobile0.acordion.clashroyale.p2.q', aKey: 'p2' },
  { q: 'mobile0.acordion.clashroyale.p3.q', aKey: 'p3' },
  { q: 'mobile0.acordion.clashroyale.p4.q', aKey: 'p4' },
  { q: 'mobile0.acordion.clashroyale.p5.q', a: 'mobile0.acordion.clashroyale.p5.a' },
];

function FaqItem({ q, a, aKey, question, answer, t }) {
  const [open, setOpen] = useState(false);

  const renderAnswer = () => {
    if (answer) return <p className={classes.faqAnswer}>{answer}</p>;
    if (a) return <p className={classes.faqAnswer}>{t(a)}</p>;

    const base = `mobile0.acordion.clashroyale.${aKey}.a`;
    const linkHref = aKey === 'p4' ? '/clanes/publicar-clan' : '/clanes';

    return (
      <p className={classes.faqAnswer}>
        {t(`${base}.1`)}{' '}
        <Link href={linkHref}>JoinGroups</Link>{' '}
        {t(`${base}.2`)}
      </p>
    );
  };

  return (
    <div className={classes.faqItem}>
      <button className={classes.faqQuestion} onClick={() => setOpen((o) => !o)}>
        <span>{question || t(q)}</span>
        <IconChevronDown
          size={15}
          className={`${classes.faqChevron} ${open ? classes.faqChevronOpen : ''}`}
        />
      </button>
      {open && renderAnswer()}
    </div>
  );
}

const POSITIONS = [
  { bottom: '24px', right: '24px' },
  { bottom: '24px', left: '24px' },
  { top: '72px', right: '24px' },
  { top: '72px', left: '24px' },
];

export default function ClashRoyaleClient({ initialData, faqItems = [] }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const baseLang = typeof i18n.language === 'string' ? i18n.language.split('-')[0] : 'es';

  const [data] = useState(initialData || []);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(initialData || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [clanDetails, setClanDetails] = useState({});
  const [posIdx, setPosIdx] = useState(0);
  const posRef = useRef(0);

  const groupsPerPage = 12;

  useEffect(() => {
    setSortedData(filterData(data, search));
    setCurrentPage(1);
  }, [data, search]);

  useEffect(() => {
    const fetchDetails = async () => {
      const details = {};

      for (const row of data) {
        if (!row.tag) continue;
        const tag = row.tag.replace('#', '%23');

        try {
          const res = await fetch(`${API_URL}/api/clash?tag=${tag}&type=full`);
          const json = await res.json();
          details[row.tag] = json;
        } catch {
          // The landing still works with stored Firestore data when the Clash API is unavailable.
        }
      }

      setClanDetails(details);
    };

    if (data.length) fetchDetails();
  }, [data]);

  useEffect(() => {
    const id = setInterval(() => {
      let next;

      do {
        next = Math.floor(Math.random() * POSITIONS.length);
      } while (next === posRef.current);

      posRef.current = next;
      setPosIdx(next);
    }, 10000);

    return () => clearInterval(id);
  }, []);

  const indexOfLast = currentPage * groupsPerPage;
  const indexOfFirst = indexOfLast - groupsPerPage;
  const currentGroups = sortedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedData.length / groupsPerPage);

  const getDesc = (row) =>
    typeof row.description === 'object'
      ? row.description[baseLang] || row.description[i18n.language] || row.description.es
      : row.description;

  return (
    <main className={classes.pageBg}>
      <div className={classes.wrapper}>
        <section className={classes.hero}>
          <nav className={classes.breadcrumb} aria-label="Breadcrumb">
            <Link href="/">Inicio</Link>
            <span aria-hidden="true">/</span>
            <Link href="/clanes">Clanes</Link>
            <span aria-hidden="true">/</span>
            <span>Clash Royale</span>
          </nav>
          <div className={classes.eyebrow}>
            <span className={classes.eyebrowDot} />
            Directorio verificado
          </div>
          <h1 className={classes.pageTitle}>Clanes de Clash Royale</h1>
          <p className={classes.pageSub}>
            Busca clan de Clash Royale, compara opciones reales y únete a clanes activos publicados por la comunidad.
          </p>
        </section>

        <section className={classes.seoIntro} aria-labelledby="clash-royale-intro-title">
          <h2 id="clash-royale-intro-title" className={classes.sectionTitle}>
            Buscar clan de Clash Royale sin perder tiempo
          </h2>
          <p>
            JoinGroups reúne clanes de Clash Royale para jugadores que quieren unirse a una comunidad activa,
            revisar requisitos antes de entrar o encontrar clanes enfocados en guerra de clanes. Si eres líder,
            también puedes publicar clan gratis y reclutar miembros con una ficha clara.
          </p>
          <div className={classes.ctaRow}>
            <Link href="#catalogo-clanes" className={classes.primaryCta}>Buscar clan</Link>
            <Link href="/clanes/publicar-clan" className={classes.secondaryCta}>Publicar clan</Link>
          </div>
        </section>

        <div className={classes.gameRow}>
          <button className={`${classes.gameBtn} ${classes.gameBtnActive}`}>
            <img
              src="/clashRoyaleFondo1.webp"
              alt="Icono de Clash Royale"
              loading="lazy"
              decoding="async"
              style={{ width: 18, height: 18, borderRadius: 4 }}
            />
            Clash Royale
          </button>
          <button className={classes.gameBtn} onClick={() => router.push('/clanes/clanes-de-clash-of-clans')}>
            <img
              src="/clashOfClansFondo.webp"
              alt="Icono de Clash of Clans"
              loading="lazy"
              decoding="async"
              style={{ width: 18, height: 18, borderRadius: 4 }}
            />
            Clash of Clans
          </button>
        </div>

        <section id="catalogo-clanes" className={classes.catalogSection} aria-labelledby="catalogo-clanes-title">
          <div className={classes.catalogHeader}>
            <h2 id="catalogo-clanes-title" className={classes.sectionTitle}>
              Catálogo de clanes activos de Clash Royale
            </h2>
            <p className={classes.sectionLead}>
              {sortedData.length} clanes disponibles. Usa el buscador para encontrar un clan por nombre,
              categoría, estilo de juego o descripción.
            </p>
          </div>

          <div className={classes.controlsBar}>
            <div className={classes.searchBox}>
              <IconSearch size={15} className={classes.searchIcon} />
              <input
                className={classes.searchInput}
                placeholder="Buscar clan de Clash Royale por nombre o categoría..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={classes.promoBanner}>
            <div className={classes.promoBannerIcon}>
              <img
                src="/clashRoyaleFondo1.webp"
                alt="Emblema de Clash Royale para publicar un clan"
                loading="lazy"
                decoding="async"
                style={{ width: 28, height: 28, borderRadius: 4 }}
              />
            </div>
            <div className={classes.promoBannerBody}>
              <strong>¿Eres líder de clan?</strong>
              <p>Publica tu clan gratis en JoinGroups y recluta jugadores activos para guerras, donaciones y ladder.</p>
            </div>
          </div>

          {currentGroups.length > 0 ? currentGroups.map((row, idx) => {
            const slug = row.slug || slugify(row.name);
            const info = clanDetails[row.tag]?.info;
            const desc = getDesc(row);
            const members = info?.members ?? row.members;
            const trophies = info?.requiredTrophies ?? row.requiredTrophies;
            const views = row.visitas ?? 0;

            return (
              <Link
                key={`${row.id}-${idx}`}
                href={`/clanes/clanes-de-clash-royale/${slug}`}
                className={classes.clanCard}
              >
                <article>
                  <div className={classes.clanCardTop}>
                    <div className={classes.clanAvatar}>
                      <img
                        src="/clashRoyaleFondo1.webp"
                        alt={`Emblema de Clash Royale del clan ${info?.name ?? row.name}`}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className={classes.clanInfo}>
                      <h3 className={classes.clanName}>{info?.name ?? row.name}</h3>
                      <div className={classes.clanMeta}>
                        {row.destacado && (
                          <span className={classes.highlightBadge}>Destacado</span>
                        )}
                        {row.categories && (
                          <span style={{ fontSize: 11, color: '#ABABAB', fontWeight: 500 }}>{row.categories}</span>
                        )}
                      </div>
                    </div>
                    <IconChevronRight size={16} style={{ color: '#D4D4D4', flexShrink: 0 }} />
                  </div>

                  {desc && <p className={classes.clanDesc}>{desc}</p>}

                  <div className={classes.clanStats}>
                    <div className={classes.statCell}>
                      <span className={classes.statVal}>
                        {typeof members === 'number' ? `${members}/50` : '—'}
                      </span>
                      <span className={classes.statLbl}><IconUsers size={9} />Miembros</span>
                    </div>
                    <div className={classes.statCell}>
                      <span className={classes.statVal}>
                        {typeof trophies === 'number' ? trophies.toLocaleString() : '—'}
                      </span>
                      <span className={classes.statLbl}><IconTrophy size={9} />Trofeos req.</span>
                    </div>
                    <div className={classes.statCell}>
                      <span className={classes.statVal}>{views}</span>
                      <span className={classes.statLbl}><IconEye size={9} />Vistas</span>
                    </div>
                  </div>
                </article>
              </Link>
            );
          }) : (
            <div className={classes.emptyState}>No hay clanes de Clash Royale publicados por ahora.</div>
          )}
        </section>

        {totalPages > 1 && (
          <div className={classes.pagination}>
            <button className={classes.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>««</button>
            <button className={classes.pageBtn} onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>← {t('Anterior')}</button>
            <span className={classes.pageInfo}>{currentPage} / {totalPages}</span>
            <button className={classes.pageBtn} onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}>{t('Siguiente')} →</button>
          </div>
        )}

        <section className={classes.faqSection} aria-labelledby="faq-clash-royale-title">
          <h2 id="faq-clash-royale-title" className={classes.faqTitle}>
            Preguntas frecuentes sobre clanes de Clash Royale
          </h2>
          {(faqItems.length ? faqItems : FAQ_ITEMS).map((item, i) => (
            <FaqItem key={i} {...item} t={t} />
          ))}
        </section>

        <section className={classes.footerCta}>
          <p className={classes.footerCtaTitle}>¿Buscas los mejores clanes de Clash Royale?</p>
          <p className={classes.footerCtaText}>
            Miles de jugadores y líderes ya confían en{' '}
            <Link href="/clanes/clanes-de-clash-royale">JoinGroups</Link>{' '}
            para encontrar y gestionar sus clanes. Si eres líder, puedes{' '}
            <Link href="/clanes/publicar-clan" style={{ color: '#EF4444', fontWeight: 600, textDecoration: 'none' }}>
              publicar tu clan gratis
            </Link>{' '}
            y empezar a reclutar hoy.
          </p>
          <div className={classes.internalLinks}>
            <Link href="/clanes">Ver todos los clanes</Link>
            <Link href="/clanes/publicar-clan">Publicar clan de Clash Royale</Link>
            <Link href="/blog/guia-mejores-clanes-de-clash-royale-2026">Guía para elegir clan</Link>
          </div>
        </section>
      </div>

      <Link
        href="/clanes/publicar-clan"
        className={classes.floatingBtn}
        style={POSITIONS[posIdx]}
      >
        <IconPlus size={14} />
        {t('Publica tu clan')}
      </Link>
    </main>
  );
}
