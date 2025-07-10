import fetch from 'node-fetch';

export default async function handler(req, res) {
  const puuid = req.query.puuid;
  if (!puuid) return res.status(400).json({ error: 'Missing puuid parameter' });

  const API_KEY = process.env.RIOT_API_KEY;
  if (!API_KEY) return res.status(500).json({ error: 'Riot API key not set' });

  // 1) Puxa lista de partidas competitivas
  const listUrl = `https://americas.api.riotgames.com/val/match/v1/matchlists/by-puuid/${puuid}?type=competitive&start=0&count=20`;
  const listResp = await fetch(listUrl, {
    headers: { 'X-Riot-Token': API_KEY }
  });
  if (!listResp.ok) {
    return res.status(listResp.status)
      .json({ error: 'Erro ao obter matchlist', status: listResp.status });
  }
  const history = (await listResp.json()).history;

  // 2) Conta wins/losses
  let wins = 0, losses = 0;
  for (const m of history) {
    const matchResp = await fetch(
      `https://americas.api.riotgames.com/val/match/v1/matches/${m.matchId}`, {
        headers: { 'X-Riot-Token': API_KEY }
      }
    );
    if (!matchResp.ok) {
      // opcional: continuar ou abortar?
      continue;
    }
    const match = await matchResp.json();
    const player = match.players.all_players.find(p => p.puuid === puuid);
    player.stats.win ? wins++ : losses++;
  }

  // 3) Retorna JSON
  res.status(200).json({ wins, losses });
}
