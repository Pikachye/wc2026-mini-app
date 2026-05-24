export default async function handler(
  req,
  res
) {

  try {

    const response =
      await fetch(
        'https://api.football-data.org/v4/competitions/WC/matches',
        {
          headers: {
            'X-Auth-Token':
              '74ed6f5eb7f845e296a983abf4efc2f3'
          }
        }
      );

    const data =
      await response.json();

    const matches = [

  {
    match_id: '537327',
    team1: 'Germany',
    team2: 'Brazil',
    score1: 2,
    score2: 1,
    status: 'finished',
    winner: 'HOME_TEAM'
  }

];

res.status(200).json(matches);

return;

  } catch (e) {

    res.status(500).json({
      error: e.toString()
    });
  }
}