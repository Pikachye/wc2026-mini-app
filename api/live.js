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
              process.env.FOOTBALL_DATA_KEY
          }
        }
      );

    const data =
      await response.json();

    const matches =
      data.matches.map(
        (match) => ({

          id:
            match.id,

          home:
            match.homeTeam.name,

          away:
            match.awayTeam.name,

          score1:
            match.score.fullTime.home,

          score2:
            match.score.fullTime.away,

          status:
            match.status,

          utcDate:
            match.utcDate,

          winner:
            match.score.winner
        })
      );

    res.status(200).json(
      matches
    );

  } catch (e) {

    res.status(500).json({
      error: e.toString()
    });
  }
}