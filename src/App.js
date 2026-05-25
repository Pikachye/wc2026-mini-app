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

async function loadPredictions(
  vkId
) {

  try {

    const response =
      await fetch(

        `/api/data?action=predictions&vk_id=${vkId}`
      );

console.log(
  'PRED RESPONSE',
  response
);

    const result =
  await response.json();

console.log(
  'PRED JSON',
  result
);

const data =
  result || [];

    console.log(
      'PREDICTIONS:',
      data
    );

    const formatted = {};

    data.forEach(
      (row) => {

        formatted[
  String(row[3])
] = {

  pred1:
    row[4],

  pred2:
    row[5],

  points:
    row[6]
};
      }
    );

    setPredictions(
      formatted
    );

  } catch (e) {

    console.log(
      'PREDICTIONS ERROR:',
      e
    );
  }
}

  const [
    user,
    setUser
  ] = useState(null);

  const [
    activeTab,
    setActiveTab
    ] = useState(
    'matches'
  );

  const [
  activeStage,
  setActiveStage
] = useState(
  't1'
);

  const [
  loading,
  setLoading
  ] = useState(true);

  const ADMIN_IDS = [
  '471037'
];

const isAdmin =
  ADMIN_IDS.includes(
    String(user?.id)
  );

  useEffect(() => {

  loadMatches();
  loadLeaderboard();

  init();

}, []);

const init = async () => {

  console.log('INIT START');

  try {

    await bridge.send(
      'VKWebAppInit'
    );

    let vkUser = null;

    // 5 попыток получить VK ID
    for (
      let i = 0;
      i < 5;
      i++
    ) {

      try {

        vkUser =
          await bridge.send(
            'VKWebAppGetUserInfo'
          );

        console.log(
          'VK USER:',
          vkUser
        );

        // если ID есть
        if (vkUser?.id) {
          break;
        }

      } catch (e) {

        console.log(
          'RETRY ERROR:',
          e
        );
      }

      // ждём 1 сек
      await new Promise(
        resolve =>
          setTimeout(
            resolve,
            1000
          )
      );
    }

    // если ID так и не получили
    if (!vkUser?.id) {

      alert(
        'Не удалось получить VK ID'
      );

      return;
    }

    setUser({
      id: vkUser.id,
      name:
        vkUser.first_name
    });

    loadPredictions(
      vkUser.id
    );

  } catch (e) {

    console.log(
      'VK AUTH ERROR:',
      e
    );

    alert(
      'Ошибка VK авторизации'
    );
  }
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

          setLoading(false);
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

          const sorted =
  data
    .slice(1)
    .sort(
      (a, b) =>
        Number(b[2]) -
        Number(a[2])
    );

setLeaders(
  sorted
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
  String(match[0])
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

    if (loading) {

  return (

    <AppRoot>

      <Panel>

        <PanelHeader>
          Прогнозы ЧМ-2026
        </PanelHeader>

        <Div
          style={{
            paddingTop: 80,
            textAlign: 'center'
          }}
        >

          <img
            src="/loading.png"
            alt="loading"
            style={{
              width: 160,
              marginBottom: 24
            }}
          />

          <div
            style={{
              fontSize: 18,
              fontWeight: 600
            }}
          >

            ⚽ Загрузка...

          </div>

        </Div>

      </Panel>

    </AppRoot>
  );
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
           ⚽ Матчи
          </TabsItem>

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

  style={{

    marginBottom: 8,

    background:

      String(
        leader[0]
      ) ===
      String(
        user?.id
      )

        ? 'rgba(76, 175, 80, 0.15)'

        : 'transparent',

    borderRadius: 12,

    border:

      String(
        leader[0]
      ) ===
      String(
        user?.id
      )

        ? '2px solid #4CAF50'

        : 'none'
  }}
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

  <>
            <Tabs
  style={{
    marginBottom: 12
  }}
>

  {
    [
  't1',
  't2',
  't3',
  'r16',
  'r8',
  'qf',
  'sf',
  'final'
].map(
      (stage) => (

        <TabsItem
          key={stage}

          selected={
            activeStage ===
            stage
          }

          onClick={() =>
            setActiveStage(
              stage
            )
          }
        >
          {
  stage === 't1'
    ? 'Тур 1'

  : stage === 't2'
    ? 'Тур 2'

  : stage === 't3'
    ? 'Тур 3'

  : stage === 'r16'
    ? '1/16'

  : stage === 'r8'
    ? '1/8'

  : stage === 'qf'
    ? '1/4'

  : stage === 'sf'
    ? '1/2'

  : stage === 'final'
    ? 'Финал'

  : stage
}
        </TabsItem>
      )
    )
  }

</Tabs>
            <Group
            
              header={
                <Header mode="secondary">
                  Матчи
                </Header>
              }
            >

              {
                matches
  .filter(
    (match) =>
      match[1] ===
      activeStage
  )
  .map(
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
  {
    (() => {

      const date =
        new Date(match[3]);

      const datePart =
        date.toLocaleDateString(
          'ru-RU',
          {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }
        );

      const timePart =
        date.toLocaleTimeString(
          'ru-RU',
          {
            hour: '2-digit',
            minute: '2-digit'
          }
        );

      return `${datePart}, ${timePart}`;

    })()
  }

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

  {match[8] === 'finished' && (

  <div
    style={{
      marginTop: 8
    }}
  >

    <div
      style={{
        color: 'green',
        fontWeight: 600
      }}
    >
      ✅ Завершён
    </div>

    {
      predictions[
        match[0]
      ] && (

        <div
          style={{
            marginTop: 4,
            fontWeight: 600
          }}
        >

          🏆

          {' '}

          +

          {
            predictions[
              match[0]
            ]?.points || 0
          }

          {' '}

          очков

        </div>
      )
    }

  </div>
)}

</div>
                      </div>

                      {
  match[8] ===
  'scheduled'
  ? (

    <>

      {
        predictions[
          String(match[0])
        ] && (

          <div
            style={{
              marginBottom: 8,
              fontSize: 14,
              color: '#666',
              fontWeight: 600
            }}
          >

            Ваш текущий прогноз:

            {' '}

            {
              predictions[
                String(match[0])
              ]?.pred1
            }

            :

            {
              predictions[
                String(match[0])
              ]?.pred2
            }

          </div>
        )
      }

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
  String(match[0])
]?.pred1 || ''
          }

          onChange={(e) => {

            setPredictions({

              ...predictions,

              [match[0]]: {

                ...predictions[
  String(match[0])
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
  String(match[0])
]?.pred2 || ''
          }

          onChange={(e) => {

            setPredictions({

              ...predictions,

              [match[0]]: {

                ...predictions[
  String(match[0])
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

  predictions[
  String(match[0])
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
  String(match[0])
]?.pred1
      }

      :

      {
        predictions[
  String(match[0])
]?.pred2
      }

    </div>

  ) : null
)
}

                    </Div>
                  )
                )
              }

            </Group>

          </>

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