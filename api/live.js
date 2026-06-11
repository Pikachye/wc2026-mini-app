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

    const matches =
  data.matches.map(
    (match) => {

      let status = 'scheduled';

const now = new Date();
const matchStart = new Date(
  new Date(match.utcDate).getTime() - 3 * 60 * 60 * 1000
);

// завершён — НЕ ТРОГАЕМ
if (match.status === 'FINISHED') {
  status = 'finished';
}

// если API сам говорит live
else if (
  match.status === 'IN_PLAY' ||
  match.status === 'PAUSED'
) {
  status = 'live';
}

// если время начала уже наступило — делаем live
else if (matchStart <= now) {
  status = 'live';
}

// если ещё не начался
else {
  status = 'scheduled';
}

      return {

        match_id:
          String(match.id),

        team1:
          match.homeTeam.name,

        team2:
          match.awayTeam.name,

        score1:
          match.score.fullTime.home,

        score2:
          match.score.fullTime.away,

        status,

        utcDate:
          match.utcDate,

        winner:
          match.score.winner
      };
    }
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