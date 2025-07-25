// src/lib/clashRoyaleApi.jsx

async function callAPI(tag, type) {
    const res = await fetch(`http://localhost:3000/api/clash?tag=${encodeURIComponent(tag)}&type=${type}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    console.error('Error desde API interna:', res.status, error);
    throw new Error(`Error al obtener ${type}`);
  }

  return res.json();
}

// ------------------- Clanes -------------------

export const getClanInfo = (clanTag) => callAPI(clanTag, 'info');
export const getClanMembers = (clanTag) => callAPI(clanTag, 'members');
export const getCurrentWar = (clanTag) => callAPI(clanTag, 'war');
export const getClanWarLog = (clanTag) => callAPI(clanTag, 'warlog');
export const getCurrentRiverRace = (clanTag) => callAPI(clanTag, 'riverrace');
export const getRiverRaceLog = (clanTag) => callAPI(clanTag, 'riverracelog');

// ------------------- Jugadores -------------------

export const getPlayerInfo = (playerTag) => callAPI(playerTag, 'player');
export const getUpcomingChests = (playerTag) => callAPI(playerTag, 'chests');
export const getBattleLog = (playerTag) => callAPI(playerTag, 'battlelog');

// ------------------- Cartas -------------------

export const getCards = () => callAPI('', 'cards');
