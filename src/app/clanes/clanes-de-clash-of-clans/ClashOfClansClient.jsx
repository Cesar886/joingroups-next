'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { IconSearch, IconEye, IconChevronRight, IconSwords, IconPlus } from '@tabler/icons-react';
import slugify from '@/lib/slugify';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import classes from '@/app/styles/ClanClashOfClans.module.css';

function filterData(data, search) {
  const q = search.toLowerCase().trim();
  if (!q) return data;
  return data.filter(item =>
    item.name?.toLowerCase().includes(q) ||
    item.categories?.toLowerCase().includes(q)
  );
}

export default function ClashOfClansClient({ serverData }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const baseLang = (i18n.language || 'es').split('-')[0];

  const [data] = useState(serverData || []);
  const [search, setSearch] = useState('');
  const [sortedData, setSortedData] = useState(serverData || []);
  const [currentPage, setCurrentPage] = useState(1);
  const groupsPerPage = 12;

  useEffect(() => {
    setSortedData(filterData(data, search));
    setCurrentPage(1);
  }, [data, search]);

  const indexOfLast = currentPage * groupsPerPage;
  const indexOfFirst = indexOfLast - groupsPerPage;
  const currentGroups = sortedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(sortedData.length / groupsPerPage);

  const getDesc = (row) =>
    typeof row.description === 'object'
      ? row.description[baseLang] || row.description[i18n.language] || row.description['es']
      : row.description;

  return (
    <>
      <div className={classes.pageBg}>
        <div className={classes.wrapper}>

          {/* Hero */}
          <div className={classes.hero}>
            <div className={classes.eyebrow}>
              <span className={classes.eyebrowDot} />
              Directorio verificado
            </div>
            <h1 className={classes.pageTitle}>Clanes de Clash of Clans</h1>
            <p className={classes.pageSub}>
              Encuentra tu clan ideal · {sortedData.length} clanes disponibles
            </p>
          </div>

          {/* Game switcher */}
          <div className={classes.gameRow}>
            <button className={classes.gameBtn} onClick={() => router.push('/clanes/clanes-de-clash-royale')}>
              <img src="/clashRoyaleFondo1.webp" alt="Clash Royale" style={{ width: 18, height: 18, borderRadius: 4 }} />
              Clash Royale
            </button>
            <button className={`${classes.gameBtn} ${classes.gameBtnActive}`}>
              <img src="/clashOfClansFondo.webp" alt="Clash of Clans" style={{ width: 18, height: 18, borderRadius: 4 }} />
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
              <img src="/clashOfClansFondo.webp" alt="CoC" style={{ width: 28, height: 28, borderRadius: 4 }} />
            </div>
            <div className={classes.promoBannerBody}>
              <strong>¿Eres líder de clan?</strong>
              <p>Publica tu clan gratis en JoinGroups y recluta jugadores para dominar las guerras.</p>
            </div>
          </div>

          {/* Cards */}
          {currentGroups.length > 0 ? currentGroups.map((row, idx) => {
            const slug = row.slug || slugify(row.name);
            const desc = getDesc(row);

            return (
              <div
                key={`${row.id}-${idx}`}
                className={classes.clanCard}
                onClick={() => router.push(`/clanes/clanes-de-clash-of-clans/${slug}`)}
              >
                <div className={classes.clanCardTop}>
                  <div className={classes.clanAvatar}>
                    <img src="/clashOfClansFondo.webp" alt="CoC" />
                  </div>
                  <div className={classes.clanInfo}>
                    <div className={classes.clanName}>{row.name}</div>
                    <div className={classes.clanMeta}>
                      {row.destacado && <span className={classes.highlightBadge}>Destacado</span>}
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
                    <span className={classes.statVal}>{row.categories || '—'}</span>
                    <span className={classes.statLbl}><IconSwords size={9} />Categoría</span>
                  </div>
                  <div className={classes.statCell}>
                    <span className={classes.statVal}>
                      {row.content18 === 'Sí' ? '18+' : 'Público'}
                    </span>
                    <span className={classes.statLbl}>Contenido</span>
                  </div>
                  <div className={classes.statCell}>
                    <span className={classes.statVal}>{row.visitas ?? 0}</span>
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

          {/* Footer CTA */}
          <div className={classes.footerCta}>
            <p className={classes.footerCtaTitle}>¿Quieres que tu clan crezca?</p>
            <p className={classes.footerCtaText}>
              Publica tu clan gratuitamente en{' '}
              <Link href="/clanes/publicar-clan">JoinGroups</Link>{' '}
              y conecta con jugadores activos que comparten tu estilo de juego.
            </p>
            <Link href="/clanes/publicar-clan" className={classes.publishBtn}>
              <IconPlus size={14} /> Publicar clan gratis
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
