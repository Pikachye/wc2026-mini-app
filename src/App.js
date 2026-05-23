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

  const [
    matches,
    setMatches
  ] = useState([]);

  const [
    leaders,
    setLeaders
  ] = useState([]);

  const [
    predictions,
    setPredictions
  ] = useState({});

  const [
    user,
    setUser
  ] = useState(null);

  const [
    activeTab,
    setActiveTab
  ] = useState(
    'leaderboard'
  );

  const ADMIN_ID = 471037;

  const isAdmin =
    Number(user?.id) ===
    ADMIN_ID;

  useEffect(() => {

    init();

  }, []);

  const init = async () => {

    console.log(
      'INIT START'
    );

    try {

      await bridge.send(
        'VKWebAppInit'
      );

      const timeout =
        new Promise(
          (_, reject) =>

            setTimeout(
              () =>
                reject(
                  'VK TIMEOUT'
                ),
              3000
            )
        );

      const vkUser =
        await Promise.race([

          bridge.send(
            'VKWebAppGetUserInfo'
          ),

          timeout
        ]);

      console.log(
        'VK USER:',
        vkUser
      );

      setUser({
        id: vkUser.id,
        name:
          vkUser.first_name
      });

    } catch (e) {

      console.log(
        'USER FALLBACK:',
        e
      );

      setUser({
        id: 999999,
        name: 'Player'
      });
    }

    setTimeout(() => {

  loadMatches();
  loadLeaderboard();

}, 1000);
  };

  const loadMatches =
    async () => {

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

        if (
          Array.isArray(data)
        ) {

          setMatches(
            data.slice(1)
          );
        }

      } catch (e) {

        console.log(
          'MATCHES ERROR:',
          e
        );
      }
    };

  const loadLeaderboard =
    async () => {

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

        if (
          Array.isArray(data)
        ) {

          setLeaders(
            data.slice(1)
          );
        }

      } catch (e) {

        console.log(
          'LEADERBOARD ERROR:',
          e
        );
      }
    };

  const savePrediction =
    async (match) => {

      try {

        const prediction =
          predictions[
            match[0]
          ];

        if (
          !prediction
        ) {

          alert(
            'Введите прогноз'
          );

          return;
        }

        const response =
          await fetch(
            '/api/save',
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  vk_id:
                    user?.id,

                  user_name:
                    user?.name,

                  match_id:
                    match[0],

                  pred1:
                    prediction.pred1,

                  pred2:
                    prediction.pred2
                })
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

        console.error(e);

        alert(
          'Ошибка сохранения'
        );
      }
    };

  const updateMatch =
    async (match) => {

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

        loadMatches();
        loadLeaderboard();

      } catch (e) {

        console.error(e);

        alert(
          'Ошибка'
        );
      }
    };

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
              'leaderboard'
            }

            onClick={() =>
              setActiveTab(
                'leaderboard'
              )
            }
          >
            🏆 Лидеры
          </TabsItem>

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

          {
            isAdmin && (

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
            )
          }

        </Tabs>

        {
          activeTab ===
          'leaderboard'
          &&
          (

            <Group
              header={
                <Header mode="secondary">
                  🏆 Лидеры
                </Header>
              }
            >

              {
                leaders.map(
                  (
                    leader,
                    index
                  ) => {

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
                          medals[index]
                          ||
                          `#${index + 1}`
                        }

                        {' '}

                        {leader[1]}

                      </Cell>
                    );
                  }
                )
              }

            </Group>
          )
        }

        {
          activeTab ===
          'matches'
          &&
          (

            <Group
              header={
                <Header mode="secondary">
                  Матчи
                </Header>
              }
            >

              {
                matches.map(
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

    {
  predictions[
    match[0]
  ]
  ? (

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
        ]?.pred1
      }

      :

      {
        predictions[
          match[0]
        ]?.pred2
      }

    </div>

  ) : null
}
  )
}

                    </Div>
                  )
                )
              }

            </Group>
          )
        }

        {
          activeTab ===
          'admin'
          &&
          isAdmin
          &&
          (

            <Group
              header={
                <Header mode="secondary">
                  ⚙️ Админ-панель
                </Header>
              }
            >

              {
                matches.map(
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

                          defaultValue={
                            match[6]
                          }

                          onChange={(e) => {

  const updated =
    [...matches];

  const index =
    updated.findIndex(
      m => m[0] === match[0]
    );

  updated[index][6] =
    e.target.value;

  setMatches(updated);
}}
                        />

                        <Input
                          type="number"

                          defaultValue={
                            match[7]
                          }

                          onChange={(e) => {

                            const updated =
  [...matches];

const index =
  updated.findIndex(
    m => m[0] === match[0]
  );

updated[index][7] =
  e.target.value;

setMatches(updated);
                          }}
                        />

                      </div>

                      <Select

                        value={
                          match[8]
                        }

                        options={[

                          {
                            label:
                              'scheduled',

                            value:
                              'scheduled'
                          },

                          {
                            label:
                              'live',

                            value:
                              'live'
                          },

                          {
                            label:
                              'finished',

                            value:
                              'finished'
                          }
                        ]}

                        onChange={(e) => {

                          const updated =
  [...matches];

const index =
  updated.findIndex(
    m => m[0] === match[0]
  );

updated[index][8] =
  e.target.value;

setMatches(updated);
                        }}
                      />

                      <div
                        style={{
                          marginTop: 12
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
                )
              }

            </Group>
          )
        }

      </Panel>

    </AppRoot>
  );
}