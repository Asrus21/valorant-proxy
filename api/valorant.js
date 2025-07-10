import fetch from 'node-fetch';

export default async function handler(req, res) {
  const puuid  = req.query.puuid;
  const region = req.query.region || 'br';   // default Brasil
  const size   = parseInt(req.query.size) || 20;

  if (!puuid) {
    return res.status(400).json({ error: 'Missing puuid parameter' });
  }

  // Chama o HenrikDev para os últimos X jogos
  const url = `https://api.henrikdev.xyz/valorant/v3/matches/${region}/${puuid}?size=${size}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    return res.status(resp.status).json({ error: 'HenrikDev API error', status: resp.status });
  }

  const body = await resp.json();
  if (!body.data || !Array.isArray(body.data)) {
    return res.status(500).json({ error: 'Invalid data from HenrikDev', body });
  }

  // Conta vitórias e derrotas
  let wins = 0, losses = 0;
  for (const match of body.data) {
    // every match has match.players.all_players and match.teams
    const player = match.players.all_players.find(p => p.puuid === puuid);
    if (!player) continue;
    // player.team is "Blue" ou "Red"
    const teamKey = player.team.toLowerCase();       // "blue" ou "red"
    const hasWon  = match.teams[teamKey].has_won;
    hasWon ? wins++ : losses++;
  }

  return res.status(200).json({ wins, losses });
}
