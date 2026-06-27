'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { IconSearch, IconUsers, IconTrophy, IconEye, IconChevronDown, IconChevronRight, IconPlus } from '@tabler/icons-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import slugify from '@/lib/slugify';
import classes from '@/app/styles/ClanClashRoyale.module.css';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const API_URL = '';

function filterData(data, search) {
  const q = search.toLowerCase().trim();
  if (!q) return data;
  return data.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    item.categories?.toLowerCase().includes(q)
  );
}

const FAQ_ITEMS = [
  { q: 'mobile0.acordion.clashroyale.p1.q', a: 'mobile0.acordion.clashroyale.p1.a' },
  { q: 'mobile0.acordion.clashroyale.p2.q', aKey: 'p2' },
  { q: 'mobile0.acordion.clashroyale.p3.q', aKey: 'p3' },
  { q: 'mobile0.acordion.clashroyale.p4.q', aKey: 'p4' },
  { q: 'mobile0.acordion.clashroyale.p5.q', a: 'mobile0.acordion.clashroyale.p5.a' },
  { q: 'mobile0.acordion.clashroyale.p6.q', a: 'mobile0.acordion.clashroyale.p6.a' },
  { q: 'mobile0.acordion.clashroyale.p7.q', aKey: 'p7' },
  { q: 'mobile0.acordion.clashroyale.p8.q', a: 'mobile0.acordion.clashroyale.p8.a' },
  { q: 'mobile0.acordion.clashroyale.p9.q', aKey: 'p9' },
  { q: 'mobile0.acordion.clashroyale.p10.q', a: 'mobile0.acordion.clashroyale.p10.a' },
];

function FaqItem({ q, a, aKey, t }) {
  const [open, setOpen] = useState(false);

  const renderAnswer = () => {
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
      <button className={classes.faqQuestion} onClick={() => setOpen(o => !o)}>
        <span>{t(q)}</span>
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

export default function ClashRoyaleClient({ initialData }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const baseLang = i18n.language.split('-')[0];

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
        } catch { /* silent */ }
      }
      setClanDetails(details);
    };
    if (data.length) fetchDetails();
  }, [data]);

  useEffect(() => {
    const id = setInterval(() => {
      let next;
      do { next = Math.floor(Math.random() * POSITIONS.length); }
      while (next === posRef.current);
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
      ? row.description[baseLang] || row.description[i18n.language] || row.description['es']
      : row.description;

  return (
    <div className={classes.pageBg}>
      <div className={classes.wrapper}>

        {/* Hero */}
        <div className={classes.hero}>
          <div className={classes.eyebrow}>
            <span className={classes.eyebrowDot} />
            Directorio verificado
          </div>
          <h1 className={classes.pageTitle}>Clanes de Clash Royale</h1>
          <p className={classes.pageSub}>
            Encuentra tu clan ideal · {sortedData.length} clanes disponibles
          </p>
        </div>

        {/* Game switcher */}
        <div className={classes.gameRow}>
          <button className={`${classes.gameBtn} ${classes.gameBtnActive}`}>
            <img src="/clashRoyaleFondo1.png" alt="Clash Royale" style={{ width: 18, height: 18, borderRadius: 4 }} />
            Clash Royale
          </button>
          <button className={classes.gameBtn} onClick={() => router.push('/clanes/clanes-de-clash-of-clans')}>
            <img src="/clashOfClansFondo.png" alt="Clash of Clans" style={{ width: 18, height: 18, borderRadius: 4 }} />
            Clash of Clans
          </button>
        </div>

        {/* Search */}
        <div className={classes.controlsBar}>
          <div className={classes.searchBox}>
            <IconSearch size={15} className={classes.searchIcon} />
            <input
              className={classes.searchInput}
              placeholder={t('Buscar por nombre, categoría...')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Promo banner */}
        <div className={classes.promoBanner}>
          <div className={classes.promoBannerIcon}>
            <img src="/clashRoyaleFondo1.png" alt="Clash Royale" style={{ width: 28, height: 28, borderRadius: 4 }} />
          </div>
          <div className={classes.promoBannerBody}>
            <strong>¿Eres líder de clan?</strong>
            <p>Publica tu clan gratis en JoinGroups y recluta jugadores activos para dominar la arena.</p>
          </div>
        </div>

        {/* Cards */}
        {currentGroups.length > 0 ? currentGroups.map((row, idx) => {
          const slug = row.slug || slugify(row.name);
          const info = clanDetails[row.tag]?.info;
          const desc = getDesc(row);
          const members = info?.members ?? row.members;
          const trophies = info?.requiredTrophies ?? row.requiredTrophies;
          const views = row.visitas ?? 0;

          return (
            <div
              key={`${row.id}-${idx}`}
              className={classes.clanCard}
              onClick={() => router.push(`/clanes/clanes-de-clash-royale/${slug}`)}
            >
              <div className={classes.clanCardTop}>
                <div className={classes.clanAvatar}>
                  <img src="/clashRoyaleFondo1.png" alt="CR" />
                </div>
                <div className={classes.clanInfo}>
                  <div className={classes.clanName}>{info?.name ?? row.name}</div>
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

              {desc && <div className={classes.clanDesc}>{desc}</div>}

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
            </div>
          );
        }) : (
          <div className={classes.emptyState}>{t('No se encontraron resultados.')}</div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={classes.pagination}>
            <button className={classes.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>««</button>
            <button className={classes.pageBtn} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>← {t('Anterior')}</button>
            <span className={classes.pageInfo}>{currentPage} / {totalPages}</span>
            <button className={classes.pageBtn} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}>{t('Siguiente')} →</button>
          </div>
        )}

        {/* FAQ */}
        <div className={classes.faqSection}>
          <p className={classes.faqTitle}>{t('mobile0.acordion.clashroyale.titulo')}</p>
          {FAQ_ITEMS.map((item, i) => (
            <FaqItem key={i} {...item} t={t} />
          ))}
        </div>

        {/* Footer CTA */}
        <div className={classes.footerCta}>
          <p className={classes.footerCtaTitle}>¿Buscas los mejores clanes de Clash Royale?</p>
          <p className={classes.footerCtaText}>
            Miles de jugadores y líderes ya confían en{' '}
            <a href="https://www.joingroups.pro/clanes/clanes-de-clash-royale">JoinGroups</a>{' '}
            para encontrar y gestionar sus clanes. Si eres líder, puedes{' '}
            <Link href="/clanes/publicar-clan" style={{ color: '#EF4444', fontWeight: 600, textDecoration: 'none' }}>
              publicar tu clan gratis
            </Link>{' '}
            y empezar a reclutar hoy.
          </p>
        </div>

      </div>

      {/* Floating publish button */}
      <Link
        href="/clanes/publicar-clan"
        className={classes.floatingBtn}
        style={POSITIONS[posIdx]}
      >
        <IconPlus size={14} />
        {t('Publica tu clan')}
      </Link>
    </div>
  );
}
