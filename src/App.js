import {
  useEffect,
  useState
} from 'react';

import {
  AppRoot,
  Panel,
  PanelHeader,
  Group,
  Cell,
  Button,
  Div,
  Input,
  Header
} from '@vkontakte/vkui';

import bridge from '@vkontakte/vk-bridge';

const API_URL =
  'https://script.google.com/macros/s/AKfycbyCO0iwlKRUr6BcPf7TPw6-3WtcL1ayDLSGqPcAhuQo96O9cQEY_4ZOw3a4Uh48XOA/exec';

export default function App() {

  const [matches, setMatches] =
    useState([]);

  const [leaders, setLeaders] =
    useState([]);

  const [user, setUser] =
    useState(null);

  const [predictions, setPredictions] =
    useState({});

  useEffect(() => {

    async function init() {

      // VK USER
      try {

        const vkUser =
          await bridge.send(
            'VKWebAppGetUserInfo'
          );

        setUser(vkUser);

      } catch (e) {

        console.log(e);

        // fallback
        setUser({
          id: 999999,
          first_name: 'Player'
        });
      }

      // MATCHES
      const matchesResponse =
        await fetch(
          API_URL +
          '?action=matches'
        );

      const matchesData =
        await matchesResponse.json();

      setMatches(
        matchesData.slice(1)
      );

      // LEADERBOARD
      const leaderboardResponse =
        await fetch(
          API_URL +
          '?action=leaderboard'
        );

      const leaderboardData =
        await leaderboardResponse.json();

      setLeaders(
        leaderboardData.slice(1)
      );
    }

    init();

  }, []);

  async function savePrediction(match) {

    if (!user) {
      return;
    }

    const pred =
      predictions[match[0]];

    if (!pred) {
      return;
    }

    try {

      const response =
        await fetch(
          API_URL,
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body: JSON.stringify({

              vk_id:
                user.id,

              user_name:
                user.first_name,

              match_id:
                match[0],

              pred1:
                Number(pred.pred1),

              pred2:
                Number(pred.pred2)
            })
          }
        );

      const data =
        await response.json();

      console.log(data);

      if (data.error) {

        alert(data.error);

        return;
      }

      alert(
        data.updated
          ? 'Прогноз обновлен'
          : 'Прогноз сохранен'
      );

    } catch (e) {

      console.log(e);

      alert(
        'Ошибка сохранения'
      );
    }
  }

  return (

    <AppRoot>

      <Panel>

        <PanelHeader>
          Прогнозы ЧМ-2026
        </PanelHeader>

        {/* LEADERBOARD */}

        <Group
          header={
            <Header mode="secondary">
              🏆 Лидеры
            </Header>
          }
        >

          {leaders.map(
            (leader, index) => {

              const medals = [
                '🥇',
                '🥈',
                '🥉'
              ];

              return (

                <Cell
                  key={index}
                  subtitle={
                    leader[2] +
                    ' очков'
                  }
                >

                  {
                    medals[index] ||
                    `#${index + 1}`
                  }

                  {' '}

                  {leader[1]}

                </Cell>
              );
            }
          )}

        </Group>

        {/* MATCHES */}

        <Group
          header={
            <Header mode="secondary">
              Матчи
            </Header>
          }
        >

          {matches.map(
            (match) => (

              <Div
                key={match[0]}
                style={{
                  borderBottom:
                    '1px solid #eee'
                }}
              >

                <div
                  style={{
                    marginBottom: 8,
                    fontWeight: 600
                  }}
                >
                  {match[4]}
                  {' vs '}
                  {match[5]}
                </div>

                <div
                  style={{
                    marginBottom: 8,
                    color: '#777'
                  }}
                >
                  {match[3]}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginBottom: 8
                  }}
                >

                  <Input
                    type="number"
                    placeholder="0"

                    value={
                      predictions[match[0]]
                        ?.pred1 || ''
                    }

                    onChange={(e) => {

                      setPredictions({

                        ...predictions,

                        [match[0]]: {

                          ...predictions[
                            match[0]
                          ],

                          pred1:
                            e.target.value
                        }
                      });
                    }}
                  />

                  <Input
                    type="number"
                    placeholder="0"

                    value={
                      predictions[match[0]]
                        ?.pred2 || ''
                    }

                    onChange={(e) => {

                      setPredictions({

                        ...predictions,

                        [match[0]]: {

                          ...predictions[
                            match[0]
                          ],

                          pred2:
                            e.target.value
                        }
                      });
                    }}
                  />

                </div>

                <Button
                  size="m"
                  stretched
                  onClick={() =>
                    savePrediction(match)
                  }
                >
                  Сохранить прогноз
                </Button>

              </Div>
            )
          )}

        </Group>

      </Panel>

    </AppRoot>
  );
}