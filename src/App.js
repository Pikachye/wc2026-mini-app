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

export function App() {

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

      console.log(
        'INIT START'
      );

      // USER

      try {

        const vkUser =
          await Promise.race([

            bridge.send(
              'VKWebAppGetUserInfo'
            ),

            new Promise(
              (_, reject) =>
                setTimeout(
                  () =>
                    reject(
                      'VK TIMEOUT'
                    ),
                  2000
                )
            )
          ]);

        console.log(
          'USER:',
          vkUser
        );

        setUser(vkUser);

      } catch (e) {

        console.log(
          'USER FALLBACK:',
          e
        );

        setUser({
          id: 999999,
          first_name: 'Player'
        });
      }

      // MATCHES

      try {

        const matchesResponse =
          await fetch(
            API_URL +
            '?action=matches'
          );

        console.log(
          'MATCHES RESPONSE:',
          matchesResponse
        );

        const matchesData =
          await matchesResponse.json();

        console.log(
          'MATCHES DATA:',
          matchesData
        );

        if (
          Array.isArray(
            matchesData
          )
        ) {

          setMatches(
            matchesData.slice(1)
          );
        }

      } catch (e) {

        console.log(
          'MATCHES ERROR:',
          e
        );
      }

      // LEADERBOARD

      try {

        const leaderboardResponse =
          await fetch(
            API_URL +
            '?action=leaderboard'
          );

        const leaderboardData =
          await leaderboardResponse.json();

        console.log(
          'LEADERBOARD:',
          leaderboardData
        );

        if (
          Array.isArray(
            leaderboardData
          )
        ) {

          setLeaders(
            leaderboardData.slice(1)
          );
        }

      } catch (e) {

        console.log(
          'LEADERBOARD ERROR:',
          e
        );
      }
    }

    init();

  }, []);

  async function savePrediction(
    match
  ) {

    if (!user) {
      return;
    }

    const pred =
      predictions[match[0]];

    if (!pred) {

      alert(
        'Введите прогноз'
      );

      return;
    }

    try {

      const formData =
        new URLSearchParams();

      formData.append(
        'vk_id',
        user.id
      );

      formData.append(
        'user_name',
        user.first_name
      );

      formData.append(
        'match_id',
        match[0]
      );

      formData.append(
        'pred1',
        Number(pred.pred1)
      );

      formData.append(
        'pred2',
        Number(pred.pred2)
      );

      const response =
        await fetch(
          '/api/save',
          {
            method: 'POST',

            body: formData
          }
        );

      console.log(
        'POST RESPONSE:',
        response
      );

      const data =
        await response.json();

      console.log(
        'POST DATA:',
        data
      );

      if (data.error) {

        alert(
          data.error
        );

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
                      predictions[
                        match[0]
                      ]?.pred1 || ''
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
                      predictions[
                        match[0]
                      ]?.pred2 || ''
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
                    savePrediction(
                      match
                    )
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