import React, {
  useEffect,
  useState
} from 'react';

import bridge from '@vkontakte/vk-bridge';

import {
  AppRoot,
  Panel,
  PanelHeader,
  Group,
  Header,
  Cell,
  Div,
  Input,
  Button,
  Tabs,
  TabsItem,
  Select
} from '@vkontakte/vkui';

export function App() {

  const [matches, setMatches] =
    useState([]);

  const [leaders, setLeaders] =
    useState([]);

  const [predictions,
    setPredictions] =
    useState({});

  const [activeTab,
    setActiveTab] =
    useState('matches');

  const [user,
    setUser] =
    useState({

      id: 999999,
      first_name: 'Player'
    });

  useEffect(() => {

    init();

  }, []);

  async function init() {

    console.log(
      'INIT START'
    );

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
                3000
              )
          )
        ]);

      console.log(
        'VK USER:',
        vkUser
      );

      setUser(vkUser);

    } catch (e) {

      console.log(
        'USER FALLBACK:',
        e
      );
    }

    loadMatches();
    loadLeaderboard();
  }

  async function loadMatches() {

    try {

      const response =
        await fetch(
          '/api/data?action=matches'
        );

      console.log(
        'MATCHES RESPONSE:',
        response
      );

      const data =
        await response.json();

      console.log(
        'MATCHES DATA:',
        data
      );

      setMatches(data);

    } catch (e) {

      console.log(
        'MATCHES ERROR:',
        e
      );
    }
  }

  async function loadLeaderboard() {

    try {

      const response =
        await fetch(
          '/api/data?action=leaderboard'
        );

      const data =
        await response.json();

      console.log(
        'LEADERBOARD:',
        data
      );

      setLeaders(data);

    } catch (e) {

      console.log(
        'LEADERBOARD ERROR:',
        e
      );
    }
  }

  async function savePrediction(
    match
  ) {

    try {

      const pred =
        predictions[
          match[0]
        ];

      if (!pred) {

        alert(
          'Введите прогноз'
        );

        return;
      }

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
        pred.pred1 || 0
      );

      formData.append(
        'pred2',
        pred.pred2 || 0
      );

      const response =
        await fetch(
          '/api/save',
          {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded'
            },

            body:
              formData.toString()
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
        'Прогноз сохранён'
      );

      loadLeaderboard();

    } catch (e) {

      console.log(e);

      alert(
        'Ошибка сохранения'
      );
    }
  }

  async function updateMatch(
    match
  ) {

    try {

      const response =
        await fetch(
          '/api/admin',
          {

            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({

                match_id:
                  match[0],

                score1:
                  match[6],

                score2:
                  match[7],

                status:
                  match[8]
              })
          }
        );

      const data =
        await response.json();

      console.log(data);

      if (data.error) {

        alert(
          data.error
        );

        return;
      }

      alert(
        'Матч обновлён'
      );

      setTimeout(() => {

        loadMatches();
        loadLeaderboard();

      }, 1000);

    } catch (e) {

      console.log(e);

      alert(
        'Ошибка'
      );
    }
  }

  return (

    <AppRoot>

      <Panel>

        <PanelHeader>
          Прогнозы ЧМ-2026
        </PanelHeader>

        <Tabs>

          <TabsItem
            selected={
              activeTab ===
              'matches'
            }

            onClick={() =>
              setActiveTab(
                'matches'
              )
            }
          >
            Матчи
          </TabsItem>

          <TabsItem
            selected={
              activeTab ===
              'leaders'
            }

            onClick={() =>
              setActiveTab(
                'leaders'
              )
            }
          >
            🏆 Лидеры
          </TabsItem>

          <TabsItem
            selected={
              activeTab ===
              'admin'
            }

            onClick={() =>
              setActiveTab(
                'admin'
              )
            }
          >
            ⚙️ Админ
          </TabsItem>

        </Tabs>

        {
          activeTab ===
          'leaders'
          && (

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
          )
        }

        {
          activeTab ===
          'matches'
          && (

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

                      {' '}

                      {
                        match[8] ===
                        'finished'
                        ||
                        match[8] ===
                        'live'
                          ? ` ${match[6]}:${match[7]} `
                          : ' vs '
                      }

                      {match[5]}

                    </div>

                    <div
                      style={{
                        marginBottom: 8,
                        color: '#777'
                      }}
                    >

                      {match[3]}

                      <div
                        style={{
                          marginTop: 4,
                          fontWeight: 600
                        }}
                      >

                        {
                          match[8] ===
                          'scheduled'
                          &&
                          '⏳ Скоро'
                        }

                        {
                          match[8] ===
                          'live'
                          &&
                          '🔴 LIVE'
                        }

                        {
                          match[8] ===
                          'finished'
                          &&
                          '✅ Завершён'
                        }

                      </div>

                    </div>

                    {
                      match[8] ===
                      'scheduled'
                      ? (

                        <>

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

                        </>

                      ) : (

                        <div
                          style={{
                            marginTop: 8,
                            fontWeight: 600
                          }}
                        >

                          Ваш прогноз:

                          {' '}

                          {
                            predictions[
                              match[0]
                            ]?.pred1 ?? '-'
                          }

                          :

                          {
                            predictions[
                              match[0]
                            ]?.pred2 ?? '-'
                          }

                        </div>
                      )
                    }

                  </Div>
                )
              )}

            </Group>
          )
        }

        {
          activeTab ===
          'admin'
          && (

            <Group
              header={
                <Header mode="secondary">
                  ⚙️ Админ-панель
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
                        display: 'flex',
                        gap: 8,
                        marginBottom: 8
                      }}
                    >

                      <Input
                        type="number"

                        value={
                          match[6]
                        }

                        onChange={(e) => {

                          const updated =
                            [...matches];

                          const index =
                            updated.findIndex(
                              m =>
                                m[0] ===
                                match[0]
                            );

                          updated[index][6] =
                            e.target.value;

                          setMatches(
                            updated
                          );
                        }}
                      />

                      <Input
                        type="number"

                        value={
                          match[7]
                        }

                        onChange={(e) => {

                          const updated =
                            [...matches];

                          const index =
                            updated.findIndex(
                              m =>
                                m[0] ===
                                match[0]
                            );

                          updated[index][7] =
                            e.target.value;

                          setMatches(
                            updated
                          );
                        }}
                      />

                    </div>

                    <Select

                      value={
                        match[8]
                      }

                      onChange={(e) => {

                        const updated =
                          [...matches];

                        const index =
                          updated.findIndex(
                            m =>
                              m[0] ===
                              match[0]
                          );

                        updated[index][8] =
                          e.target.value;

                        setMatches(
                          updated
                        );
                      }}
                    >

                      <option value="scheduled">
                        scheduled
                      </option>

                      <option value="live">
                        live
                      </option>

                      <option value="finished">
                        finished
                      </option>

                    </Select>

                    <div
                      style={{
                        marginTop: 8
                      }}
                    >

                      <Button
                        stretched

                        onClick={() =>
                          updateMatch(
                            match
                          )
                        }
                      >
                        Сохранить матч
                      </Button>

                    </div>

                  </Div>
                )
              )}

            </Group>
          )
        }

      </Panel>

    </AppRoot>
  );
}