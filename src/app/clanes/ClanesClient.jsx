'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  IconChevronRight,
  IconEye,
  IconPlus,
  IconSearch,
  IconSwords,
} from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import slugify from '@/lib/slugify';
import styles from '@/app/styles/TableSortClanes.module.css';

const POSITIONS = [
  { bottom: '24px', right: '24px' },
  { bottom: '24px', left: '24px' },
  { top: '72px', right: '24px' },
  { top: '72px', left: '24px' },
];

function filterData(data, search) {
  const q = search.toLowerCase().trim();
  if (!q) return data;

  return data.filter((item) =>
    item.name?.toLowerCase().includes(q) ||
    item.categories?.toLowerCase().includes(q) ||
    item.tipo?.toLowerCase().includes(q)
  );
}

const getGameInfo = (tipo) => {
  const isRoyale = tipo === 'clash-royale';
  return {
    label: isRoyale ? 'Clash Royale' : 'Clash of Clans',
    icon: isRoyale ? '/clashRoyaleFondo1.webp' : '/clashOfClansFondo.webp',
    className: isRoyale ? styles.avatarRoyale : styles.avatarCoc,
  };
};

export default function ClanesClient({ serverData }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const baseLang = (i18n.language || 'es').split('-')[0];

  const [data] = useState(serverData || []);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(serverData || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [posIdx, setPosIdx] = useState(0);
  const posRef = useRef(0);

  const groupsPerPage = 12;

  useEffect(() => {
    setSortedData(filterData(data, search));
    setCurrentPage(1);
  }, [data, search]);

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

  const indexOfLastGroup = currentPage * groupsPerPage;
  const indexOfFirstGroup = indexOfLastGroup - groupsPerPage;
  const currentGroups = sortedData.slice(indexOfFirstGroup, indexOfLastGroup);
  const totalPages = Math.ceil(sortedData.length / groupsPerPage);

  const getDesc = (row) =>
    typeof row.description === 'object'
      ? row.description[baseLang] || row.description[i18n.language] || row.description.es
      : row.description;

  return (
    <>
      <div className={styles.pageBg}>
        <div className={styles.wrapper}>
          <section className={styles.hero}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Directorio gamer
            </div>
            <h1 className={styles.pageTitle}>Clanes de Clash Royale y Clash of Clans</h1>
            <p className={styles.pageSub}>
              Encuentra clanes activos de Clash Royale y Clash of Clans · {sortedData.length} clanes disponibles
            </p>
          </section>

          <div className={styles.gameRow}>
            <button className={`${styles.gameBtn} ${styles.gameBtnActive}`}>
              <IconSwords size={15} />
              Todos los clanes
            </button>
            <button className={styles.gameBtn} onClick={() => router.push('/clanes/clanes-de-clash-royale')}>
              <img src="/clashRoyaleFondo1.webp" alt="Clash Royale" className={styles.gameIcon} />
              Clash Royale
            </button>
            <button className={styles.gameBtn} onClick={() => router.push('/clanes/clanes-de-clash-of-clans')}>
              <img src="/clashOfClansFondo.webp" alt="Clash of Clans" className={styles.gameIcon} />
              Clash of Clans
            </button>
          </div>

          <div className={styles.controlsBar}>
            <div className={styles.searchBox}>
              <IconSearch size={15} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder={t('Buscar por nombre, categoría o contenido...')}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.promoBanner}>
            <div className={styles.promoBannerIcon}>
              <IconSwords size={20} />
            </div>
            <div className={styles.promoBannerBody}>
              <strong>¿Eres líder de clan?</strong>
              <p>Publica tu clan gratis en JoinGroups y recluta jugadores activos para crecer más rápido.</p>
            </div>
            <Link href="/clanes/publicar-clan" className={styles.promoAction}>
              <IconPlus size={14} /> Publicar
            </Link>
          </div>

          {currentGroups.length > 0 ? currentGroups.map((row, idx) => {
            const slug = row.slug || slugify(row.name);
            const desc = getDesc(row);
            const game = getGameInfo(row.tipo);
            const href = `/clanes/clanes-de-${row.tipo}/${slug}`;

            return (
              <Link
                key={`${row.id}-${slug}-${idx}`}
                href={href}
                className={styles.clanCard}
              >
                <article>
                <div className={styles.clanCardTop}>
                  <div className={`${styles.clanAvatar} ${game.className}`}>
                    <img src={game.icon} alt={game.label} />
                  </div>
                  <div className={styles.clanInfo}>
                    <div className={styles.clanName}>{row.name}</div>
                    <div className={styles.clanMeta}>
                      {row.destacado && <span className={styles.highlightBadge}>Destacado</span>}
                      <span className={styles.gameLabel}>{game.label}</span>
                      {row.categories && <span className={styles.metaText}>{row.categories}</span>}
                    </div>
                  </div>
                  <IconChevronRight size={16} className={styles.chevron} />
                </div>

                {desc && <p className={styles.clanDesc}>{desc}</p>}

                <div className={styles.clanStats}>
                  <div className={styles.statCell}>
                    <span className={styles.statVal}>{row.categories || '—'}</span>
                    <span className={styles.statLbl}><IconSwords size={9} />Categoría</span>
                  </div>
                  <div className={styles.statCell}>
                    <span className={styles.statVal}>{row.content18 === 'Sí' ? '18+' : 'Público'}</span>
                    <span className={styles.statLbl}>Contenido</span>
                  </div>
                  <div className={styles.statCell}>
                    <span className={styles.statVal}>{row.visitas ?? 0}</span>
                    <span className={styles.statLbl}><IconEye size={9} />Vistas</span>
                  </div>
                </div>
                </article>
              </Link>
            );
          }) : (
            <div className={styles.emptyState}>{t('No se encontraron resultados.')}</div>
          )}

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>««</button>
              <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>← {t('Anterior')}</button>
              <span className={styles.pageInfo}>{currentPage} / {totalPages}</span>
              <button className={styles.pageBtn} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}>{t('Siguiente')} →</button>
            </div>
          )}

          <section className={styles.footerCta}>
            <p className={styles.footerCtaTitle}>¿Quieres que tu clan crezca?</p>
            <p className={styles.footerCtaText}>
              Publica tu clan gratuitamente en{' '}
              <Link href="/clanes/publicar-clan">JoinGroups</Link>{' '}
              y conecta con jugadores activos que comparten tu estilo de juego.
            </p>
            <Link href="/clanes/publicar-clan" className={styles.publishBtn}>
              <IconPlus size={14} /> Publicar clan gratis
            </Link>
          </section>
        </div>

        <Link
          href="/clanes/publicar-clan"
          className={styles.floatingBtn}
          style={POSITIONS[posIdx]}
        >
          <IconPlus size={14} />
          {t('Publica tu clan')}
        </Link>
      </div>
    </>
  );
}
