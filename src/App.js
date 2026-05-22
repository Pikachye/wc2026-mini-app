import React, {
  useEffect,
  useState
} from 'react';

import {
  AdaptivityProvider,
  AppRoot,
  Panel,
  PanelHeader,
  Group,
  Card,
  Div,
  Button,
  Input
} from '@vkontakte/vkui';

const API_URL =
  'https://script.google.com/macros/s/AKfycbyCO0iwlKRUr6BcPf7TPw6-3WtcL1ayDLSGqPcAhuQo96O9cQEY_4ZOw3a4Uh48XOA/exec';

export const App = () => {
  const [matches, setMatches] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [predictions, setPredictions] =
    useState({});

  useEffect(() => {
    async function loadMatches() {
      try {
        const response = await fetch(
          API_URL + '?action=matches'
        );

        const data =
          await response.json();

        setMatches(data.slice(1));

        setLoading(false);
      } catch (e) {
        console.error(e);
      }
    }

    loadMatches();
  }, []);

  async function savePrediction(
    matchId
  ) {
    const prediction =
      predictions[matchId];

    if (!prediction) {
      alert(
        'Введите прогноз'
      );

      return;
    }

    try {
      await fetch(API_URL, {
        method: 'POST',

        body: JSON.stringify({

  vk_id:
    user.id,

  user_name:
    user.first_name,

  match_id:
    match[0],

  pred1,
  pred2
})
      });

      alert(
        'Прогноз сохранён'
      );
    } catch (e) {
      console.error(e);

      alert('Ошибка');
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: 20
        }}
      >
        Загрузка...
      </div>
    );
  }

  return (
    <AdaptivityProvider>
      <AppRoot>
        <Panel>
          <PanelHeader>
            Прогнозы ЧМ-2026
          </PanelHeader>

          {matches.map((match) => (
            <Group key={match[0]}>
              <Card mode="shadow">
                <Div>
                  <h3>
                    {match[4]} vs {match[5]}
                  </h3>

                  <p>
                    {new Date(
                      match[3]
                    ).toLocaleString()}
                  </p>

                  <div
                    style={{
                      display:
                        'flex',

                      gap: 10,

                      marginBottom: 12
                    }}
                  >
                    <Input
                      type="number"

                      placeholder="0"

                      onChange={(e) => {
                        setPredictions({
                          ...predictions,

                          [match[0]]: {
                            ...predictions[
                              match[0]
                            ],

                            pred1:
                              e.target
                                .value
                          }
                        });
                      }}
                    />

                    <Input
                      type="number"

                      placeholder="0"

                      onChange={(e) => {
                        setPredictions({
                          ...predictions,

                          [match[0]]: {
                            ...predictions[
                              match[0]
                            ],

                            pred2:
                              e.target
                                .value
                          }
                        });
                      }}
                    />
                  </div>

                  <Button
                    stretched

                    onClick={() =>
                      savePrediction(
                        match[0]
                      )
                    }
                  >
                    Сохранить прогноз
                  </Button>
                </Div>
              </Card>
            </Group>
          ))}
        </Panel>
      </AppRoot>
    </AdaptivityProvider>
  );
};