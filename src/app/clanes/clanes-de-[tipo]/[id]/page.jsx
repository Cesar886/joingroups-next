'use client';

import { useEffect, useState } from 'react';
import {
  collection, query, where, getDocs,
  limit, runTransaction, updateDoc
} from 'firebase/firestore';
import { db } from '@/firebase/firebase';
import { useParams } from 'next/navigation';
import { Modal, ScrollArea } from '@mantine/core';
import { showNotification } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import slugify from '@/lib/slugify';
import { useTranslation } from 'react-i18next';
import classes from '@/app/styles/DetailsClans.module.css';
import {
  IconShield, IconMapPin, IconTrophy, IconGift, IconUsers,
  IconCrown, IconStar, IconWorld, IconExternalLink,
  IconAlertTriangle, IconBrandDiscord, IconBrandWhatsapp,
  IconBrandTelegram, IconBrandFacebook, IconChevronRight,
} from '@tabler/icons-react';

const API_URL = '';

export default function GroupDetailClanes() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [clan, setClan] = useState(null);
  const [globalRank, setGlobalRank] = useState(null);
  const [localRank, setLocalRank] = useState(null);
  const [openMembers, membersHandlers] = useDisclosure(false);
  const [openReport, reportHandlers] = useDisclosure(false);
  const [sent, setSent] = useState(false);
  const [reportText, setReportText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'clanes'), where('slug', '==', id), limit(1));
        let snap = await getDocs(q);

        if (snap.empty) {
          const all = await getDocs(query(collection(db, 'clanes'), limit(1000)));
          snap = all.docs.filter(d => slugify(d.data().name) === id);
        } else {
          snap = snap.docs;
        }

        if (snap.length === 0) { setNotFound(true); return; }

        const docSnap = snap[0];
        const data = docSnap.data();
        if (!data.slug) await updateDoc(docSnap.ref, { slug: slugify(data.name) });

        if (!sessionStorage.getItem(`v-${id}`)) {
          await runTransaction(db, async trx => {
            const f = await trx.get(docSnap.ref);
            trx.update(docSnap.ref, { visitas: (f.data()?.visitas || 0) + 1 });
          });
          sessionStorage.setItem(`v-${id}`, '1');
        }

        setGroup({ id: docSnap.id, ...data, slug: data.slug || slugify(data.name) });
      } catch (e) {
        console.error(e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  useEffect(() => {
    if (!group?.tag) return;
    const tag = group.tag.startsWith('#') ? `%23${group.tag.slice(1)}` : group.tag;
    fetch(`${API_URL}/api/clash?tag=${tag}&type=full`)
      .then(r => r.json())
      .then(r => { setClan(r.info); setGlobalRank(r.globalRank ?? null); setLocalRank(r.localRank ?? null); })
      .catch(console.error);
  }, [group]);

  const formatLastSeen = (s) => {
    if (!s) return '—';
    try {
      const d = new Date(`${s.slice(0,4)}-${s.slice(4,6)}-${s.slice(6,8)}T${s.slice(9,11)}:${s.slice(11,13)}:${s.slice(13,15)}.000Z`);
      return isNaN(d) ? '—' : d.toLocaleString();
    } catch { return '—'; }
  };

  const roleLabel = r => ({ leader: 'Líder', coLeader: 'Co-Líder', elder: 'Veterano' }[r] ?? 'Miembro');
  const roleClass = r => classes[{ leader: 'roleBadgeLeader', coLeader: 'roleBadgeCoLeader', elder: 'roleBadgeElder' }[r] ?? 'roleBadgeMember'];

  if (loading) return <div className={classes.loadingState}>Cargando...</div>;
  if (notFound || !group) return <div className={classes.loadingState}>{t('Grupo no encontrado.')}</div>;

  const isOpen = clan?.type === 'open';
  const clanName = clan?.name ?? group?.name ?? 'Clan';

  return (
    <div className={classes.clanPageBg}>
      <div className={classes.pageWrapper}>

        {/* ── HERO ── */}
        <div className={classes.hero}>
          <div className={classes.heroBorder} />
          <div className={classes.heroWatermark} />

          <div className={classes.heroBody}>
            {/* Type pill */}
            <div className={classes.typePill}>
              <span className={`${classes.typeDot} ${!isOpen ? classes.typeDotClosed : ''}`} />
              {isOpen ? 'Abierto' : clan?.type === 'inviteOnly' ? 'Solo invitación' : 'Cerrado'}
            </div>

            {/* Clan name */}
            <div className={classes.clanName} data-text={clanName}>
              {clanName}
            </div>

            {/* Meta */}
            <div className={classes.heroMeta}>
              {(clan?.tag ?? group?.tag) && (
                <span className={classes.heroMetaItem}>
                  {clan?.tag ?? group?.tag}
                </span>
              )}
              {clan?.location && (
                <>
                  <span className={classes.heroDivider}>·</span>
                  <span className={classes.heroMetaItem}>
                    <IconMapPin size={11} />
                    {clan.location.name}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Trophy strip */}
          <div className={classes.trophyStrip}>
            <div className={classes.trophyCell}>
              <span className={classes.trophyNum}>
                {clan?.requiredTrophies?.toLocaleString() ?? '—'}
              </span>
              <span className={classes.trophyLbl}>
                <img src="https://cdn.royaleapi.com/static/img/ui/64x64/trophy.png" alt="" style={{ width: 11, height: 11 }} />
                Trofeos req.
              </span>
            </div>
            <div className={classes.trophyCell}>
              <span className={classes.trophyNum}>
                {clan?.clanWarTrophies?.toLocaleString() ?? '—'}
              </span>
              <span className={classes.trophyLbl}>
                <img src="https://cdn.royaleapi.com/static/img/ui/64x64/cw-trophy.png" alt="" style={{ width: 11, height: 11 }} />
                Guerra
              </span>
            </div>
            <div className={classes.trophyCell}>
              <span className={classes.trophyNum}>
                {clan?.members ?? '—'}
                <span className={classes.trophyNumSub}>/50</span>
              </span>
              <span className={classes.trophyLbl}>
                <IconUsers size={11} />
                Miembros
              </span>
            </div>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className={classes.contentCard}>

          {/* Description */}
          {clan?.description && (
            <>
              <p className={classes.desc}>{clan.description}</p>
              <div className={classes.sep} />
            </>
          )}

          {/* Stats */}
          {clan && (
            <>
              <div className={classes.sectionLabel}>Estadísticas</div>
              <div className={classes.statGrid}>
                <div className={classes.statTile}>
                  <div className={classes.statTileLbl}><IconTrophy size={10} /> Clan Score</div>
                  <div className={classes.statTileVal}>{clan.clanScore?.toLocaleString() ?? '—'}</div>
                </div>
                <div className={classes.statTile}>
                  <div className={classes.statTileLbl}><IconGift size={10} /> Donaciones/sem</div>
                  <div className={classes.statTileVal}>{clan.donationsPerWeek?.toLocaleString() ?? '—'}</div>
                </div>
                {globalRank && (
                  <div className={`${classes.statTile} ${classes.statTileGold}`}>
                    <div className={classes.statTileLbl}><IconCrown size={10} /> Ranking Global</div>
                    <div className={classes.statTileVal}>#{globalRank}</div>
                  </div>
                )}
                {localRank && (
                  <div className={`${classes.statTile} ${classes.statTileIndigo}`}>
                    <div className={classes.statTileLbl}><IconStar size={10} /> Ranking Local</div>
                    <div className={classes.statTileVal}>#{localRank}</div>
                  </div>
                )}
                {clan.location && !globalRank && !localRank && (
                  <div className={`${classes.statTile}`} style={{ gridColumn: 'span 2' }}>
                    <div className={classes.statTileLbl}><IconWorld size={10} /> Ubicación</div>
                    <div className={classes.statTileVal} style={{ fontSize: 16 }}>{clan.location.name}</div>
                  </div>
                )}
              </div>
              <div className={classes.sep} />
            </>
          )}

          {/* Members */}
          {clan?.memberList?.length > 0 && (
            <>
              <button className={classes.membersBtn} onClick={membersHandlers.open}>
                <span className={classes.membersBtnLeft}>
                  <IconUsers size={15} />
                  Ver miembros del clan
                </span>
                <span className={classes.membersBtnCount}>
                  {clan.members}/50 <IconChevronRight size={13} />
                </span>
              </button>
              <div className={classes.sep} />
            </>
          )}

          {/* Social */}
          {(group?.comunidades?.discord || group?.comunidades?.whatsapp || group?.comunidades?.telegram || group?.comunidades?.facebook) && (
            <>
              <div className={classes.sectionLabel}>Comunidades</div>
              <div className={classes.socialRow}>
                {group.comunidades.discord && (
                  <a href={group.comunidades.discord} target="_blank" rel="noopener noreferrer" className={`${classes.socialChip} ${classes.chipDiscord}`}>
                    <IconBrandDiscord size={13} /> Discord
                  </a>
                )}
                {group.comunidades.whatsapp && (
                  <a href={group.comunidades.whatsapp} target="_blank" rel="noopener noreferrer" className={`${classes.socialChip} ${classes.chipWhatsapp}`}>
                    <IconBrandWhatsapp size={13} /> WhatsApp
                  </a>
                )}
                {group.comunidades.telegram && (
                  <a href={group.comunidades.telegram} target="_blank" rel="noopener noreferrer" className={`${classes.socialChip} ${classes.chipTelegram}`}>
                    <IconBrandTelegram size={13} /> Telegram
                  </a>
                )}
                {group.comunidades.facebook && (
                  <a href={group.comunidades.facebook} target="_blank" rel="noopener noreferrer" className={`${classes.socialChip} ${classes.chipFacebook}`}>
                    <IconBrandFacebook size={13} /> Facebook
                  </a>
                )}
              </div>
              <div className={classes.sep} />
            </>
          )}

          {/* CTA */}
          <a
            href={group.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={`${classes.joinBtn} ${!group.link ? classes.joinBtnDisabled : ''}`}
            onClick={!group.link ? e => e.preventDefault() : undefined}
          >
            <IconExternalLink size={15} />
            {group.link ? `Acceder al clan · ${clanName}` : t('Enlace no disponible')}
          </a>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
            <button className={classes.reportBtn} onClick={reportHandlers.open}>
              <IconAlertTriangle size={10} />
              {t('Report Broken Link')}
            </button>
          </div>
        </div>
      </div>

      {/* ── MEMBERS MODAL ── */}
      <Modal
        opened={openMembers}
        onClose={membersHandlers.close}
        title={<span style={{ fontWeight: 800, fontSize: 15, color: '#0F0F14', letterSpacing: '-0.02em' }}>Miembros · {clan?.name}</span>}
        size="lg"
        centered
        styles={{
          content: { background: '#fff', borderRadius: 20, border: '1px solid #F0F0F0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' },
          header: { background: '#fff', borderBottom: '1px solid #F5F5F5', borderRadius: '20px 20px 0 0', padding: '1.25rem 1.5rem' },
          body: { padding: 0 },
        }}
      >
        <ScrollArea type="auto" style={{ maxHeight: '65vh' }}>
          {clan?.memberList?.length > 0 ? (
            <table className={classes.membersTable}>
              <thead>
                <tr>
                  <th>Jugador</th>
                  <th>Rol</th>
                  <th>Niv.</th>
                  <th>Trofeos</th>
                  <th>Donac.</th>
                  <th>Última vez</th>
                </tr>
              </thead>
              <tbody>
                {clan.memberList.map(m => (
                  <tr key={m.tag}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <span className={classes.memberAvatar}>{m.name.charAt(0).toUpperCase()}</span>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 12.5, color: '#111' }}>{m.name}</div>
                          <div style={{ fontSize: 10, color: '#C4C4C4' }}>{m.tag}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`${classes.roleBadge} ${roleClass(m.role)}`}>{roleLabel(m.role)}</span></td>
                    <td style={{ color: '#888', fontSize: 12 }}>{m.expLevel}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#374151' }}>
                        <img src="https://cdn.royaleapi.com/static/img/ui/64x64/trophy.png" alt="" style={{ width: 11, height: 11 }} />
                        {m.trophies?.toLocaleString()}
                      </span>
                    </td>
                    <td style={{ color: '#888', fontSize: 12 }}>{m.donations?.toLocaleString()}</td>
                    <td style={{ color: '#C4C4C4', fontSize: 10.5 }}>{formatLastSeen(m.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', padding: '2.5rem', color: '#C4C4C4', fontSize: 13 }}>Sin miembros disponibles</p>
          )}
        </ScrollArea>
      </Modal>

      {/* ── REPORT MODAL ── */}
      <Modal
        opened={openReport}
        onClose={() => { reportHandlers.close(); setReportText(''); setSent(false); }}
        title={<span style={{ fontWeight: 800, fontSize: 15, color: '#0F0F14', letterSpacing: '-0.02em' }}>{t('Report Broken Link')}</span>}
        centered
        styles={{
          content: { background: '#fff', borderRadius: 20, border: '1px solid #F0F0F0', boxShadow: '0 20px 60px rgba(0,0,0,0.12)' },
          header: { background: '#fff', borderBottom: '1px solid #F5F5F5', borderRadius: '20px 20px 0 0', padding: '1.25rem 1.5rem' },
        }}
      >
        {!sent ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0.25rem 0' }}>
            <p style={{ fontSize: 13, color: '#ABABAB', lineHeight: 1.6 }}>
              {t('Briefly describe the problem (min. 10 and max. 200 characters)):')}
            </p>
            <textarea
              maxLength={200}
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder={t('E.g. The link leads to the wrong group or no longer exists.')}
              style={{
                width: '100%', minHeight: 88, padding: '11px 13px',
                borderRadius: 12, border: '1px solid #EBEBEB',
                background: '#F8F8F8', color: '#111', fontSize: 13,
                resize: 'vertical', outline: 'none', fontFamily: 'inherit',
              }}
            />
            <div style={{ fontSize: 10.5, color: '#C4C4C4', textAlign: 'right' }}>
              {reportText.length}/200
              {reportText.length > 0 && reportText.length < 10 && ' · demasiado corto'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => { reportHandlers.close(); setReportText(''); setSent(false); }}
                style={{ background: '#F5F5F5', border: 'none', color: '#888', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
              >
                {t('Cancelar')}
              </button>
              <button
                disabled={reportText.trim().length < 10 || sending}
                onClick={async () => { setSending(true); await sendTelegramMessage('Broken link', reportText.trim()); setSending(false); setReportText(''); setSent(true); }}
                style={{
                  background: reportText.trim().length < 10 ? '#FEE2E2' : '#EF4444',
                  border: 'none',
                  color: reportText.trim().length < 10 ? '#FCA5A5' : '#fff',
                  borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 700,
                  cursor: reportText.trim().length < 10 ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? 'Enviando...' : t('Submit report')}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#16A34A', fontWeight: 700, fontSize: 14 }}>
            {t('¡The message has been sent and will be reviewed soon. Thank you for your help.!')}
          </div>
        )}
      </Modal>
    </div>
  );

  async function sendTelegramMessage(tipo, mensaje = '') {
    const chatId = -1002622285468;
    const token = "7551745963:AAFiTkb9UehxZMXNINihI8wSdlTMjaM6Lfk";
    const text = `🚨 *Nuevo reporte: ${tipo}*\nClan: ${group?.name}\nURL: ${window.location.href}\n📝 ${mensaje || 'Sin descripción'}`;
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description);
      showNotification({ title: t('Reporte enviado'), message: t('¡Gracias por ayudarnos!'), color: 'green' });
    } catch (e) {
      console.error(e);
      showNotification({ title: t('Error'), message: t('No se pudo enviar el reporte.'), color: 'red' });
    }
  }
}
