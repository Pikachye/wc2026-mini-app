import React, {
  useEffect,
  useState,
  useCallback,
  useMemo
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
  Select,
  Snackbar
} from '@vkontakte/vkui';

export function App() {

  const [matches, setMatches] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [predictionsLoaded, setPredictionsLoaded] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('matches');
  const [activeStage, setActiveStage] = useState('t1');
  const [wizardMode, setWizardMode] = useState(true);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [videoReady, setVideoReady] = useState(false);
  const [snackbar, setSnackbar] = useState(null);
  
  // ОТДЕЛЬНЫЙ STATE ДЛЯ ВРЕМЕННЫХ ПРОГНОЗОВ (то что вводит пользователь)
  const [tempPredictions, setTempPredictions] = useState({});

  const ADMIN_IDS = ['471037'];
  const isAdmin = ADMIN_IDS.includes(String(user?.id));

  // Мемоизированные вычисления
  const filteredMatches = useMemo(() => 
    matches.filter((match) => match[1] === activeStage),
    [matches, activeStage]
  );

  // Функция получения прогноза (сначала из временных, потом из сохраненных)
  const getPrediction = useCallback((matchId) => {
    const temp = tempPredictions[String(matchId)];
    const saved = predictions[String(matchId)];
    
    if (temp && (temp.pred1 !== undefined || temp.pred2 !== undefined)) {
      return {
        pred1: temp.pred1 !== undefined ? temp.pred1 : saved?.pred1 || '',
        pred2: temp.pred2 !== undefined ? temp.pred2 : saved?.pred2 || '',
        points: saved?.points || 0
      };
    }
    return saved || { pred1: '', pred2: '', points: 0 };
  }, [tempPredictions, predictions]);

  const isPredicted = useCallback((matchId) => {
    const match = filteredMatches.find((m) => String(m[0]) === String(matchId));
    
    if (match && String(match[8]) === 'finished') {
      return true;
    }
    
    const prediction = getPrediction(matchId);
    return prediction && prediction.pred1 !== '' && prediction.pred2 !== '';
  }, [filteredMatches, getPrediction]);

  const allPredicted = useMemo(() => 
    filteredMatches.every((match) => isPredicted(match[0])),
    [filteredMatches, isPredicted]
  );

  const currentMatch = filteredMatches[currentMatchIndex];

  // Загрузка данных
  const loadPredictions = useCallback(async (vkId) => {
    try {
      const response = await fetch(`/api/data?action=predictions&vk_id=${vkId}`);
      const result = await response.json();
      const data = result || [];
      
      const formatted = {};
      data.forEach((row) => {
        formatted[String(row[3])] = {
          pred1: row[4] || '',
          pred2: row[5] || '',
          points: Number(row[6]) || 0
        };
      });
      
      setPredictions(formatted);
      setPredictionsLoaded(true);
    } catch (e) {
      console.log('PREDICTIONS ERROR:', e);
    }
  }, []);

  const loadMatches = useCallback(async () => {
    try {
      const response = await fetch('/api/data?action=matches');
      const data = await response.json();
      if (Array.isArray(data)) {
        setMatches(data.slice(1));
        setLoading(false);
      }
    } catch (e) {
      console.log('MATCHES ERROR:', e);
      setLoading(false);
    }
  }, []);

  const loadLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/data?action=leaderboard');
      const data = await response.json();
      if (Array.isArray(data)) {
        const sorted = data.slice(1).sort((a, b) => Number(b[2]) - Number(a[2]));
        setLeaders(sorted);
      }
    } catch (e) {
      console.log('LEADERBOARD ERROR:', e);
    }
  }, []);

  // Функция обновления временного прогноза
  const updateTempPrediction = useCallback((matchId, field, value) => {
    setTempPredictions(prev => ({
      ...prev,
      [String(matchId)]: {
        ...prev[String(matchId)],
        [field]: value
      }
    }));
  }, []);

  // Переход к следующему непредсказанному матчу
  const goToNextUnpredicted = useCallback(() => {
    if (!wizardMode) return;
    
    const nextIndex = filteredMatches.findIndex(
      (match, idx) => idx > currentMatchIndex && !isPredicted(match[0])
    );
    
    if (nextIndex >= 0) {
      setCurrentMatchIndex(nextIndex);
    } else {
      const firstIndex = filteredMatches.findIndex((match) => !isPredicted(match[0]));
      if (firstIndex >= 0 && firstIndex !== currentMatchIndex) {
        setCurrentMatchIndex(firstIndex);
      } else if (firstIndex === -1) {
        setWizardMode(false);
      }
    }
    
    // Очищаем временные прогнозы при переходе
    setTempPredictions({});
  }, [wizardMode, filteredMatches, currentMatchIndex, isPredicted]);

  // Сохранение прогноза
  const savePrediction = useCallback(async (match) => {
    try {
      const prediction = getPrediction(match[0]);
      
      if (!prediction || prediction.pred1 === '' || prediction.pred2 === '') {
        alert('Введите прогноз');
        return;
      }
      
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)}>
          ⏳ Сохраняем прогноз...
        </Snackbar>
      );
      
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vk_id: user?.id,
          user_name: user?.name,
          match_id: match[0],
          pred1: prediction.pred1,
          pred2: prediction.pred2
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
        setSnackbar(null);
        return;
      }
      
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)}>
          ✅ Прогноз сохранён
        </Snackbar>
      );
      
      // Очищаем временный прогноз для этого матча
      setTempPredictions(prev => {
        const newTemp = { ...prev };
        delete newTemp[String(match[0])];
        return newTemp;
      });
      
      await loadPredictions(user?.id);
      await loadLeaderboard();
      
      // Переходим к следующему матчу
      setTimeout(() => {
        goToNextUnpredicted();
      }, 100);
      
    } catch (e) {
      console.error(e);
      alert('Ошибка сохранения');
      setSnackbar(null);
    }
  }, [getPrediction, user, loadPredictions, loadLeaderboard, goToNextUnpredicted]);

  // Админское обновление матча
  const updateMatch = useCallback(async (match) => {
    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: match[0],
          score1: match[6],
          score2: match[7],
          status: match[8]
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }
      
      setSnackbar(
        <Snackbar onClose={() => setSnackbar(null)}>
          ✅ Матч обновлен
        </Snackbar>
      );
      
      await loadMatches();
      await loadLeaderboard();
      await loadPredictions(user?.id);
      
    } catch (e) {
      console.error(e);
      alert('Ошибка');
    }
  }, [loadMatches, loadLeaderboard, loadPredictions, user]);

  // Инициализация VK
  const init = useCallback(async () => {
    try {
      await bridge.send('VKWebAppInit');
      let vkUser = null;
      
      for (let i = 0; i < 5; i++) {
        try {
          vkUser = await bridge.send('VKWebAppGetUserInfo');
          if (vkUser?.id) break;
        } catch (e) {
          console.log('RETRY ERROR:', e);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!vkUser?.id) {
        alert('Не удалось получить VK ID');
        setLoading(false);
        return;
      }
      
      setUser({ id: vkUser.id, name: vkUser.first_name });
      await loadPredictions(vkUser.id);
      
    } catch (e) {
      console.log('VK AUTH ERROR:', e);
      alert('Ошибка VK авторизации');
      setLoading(false);
    }
  }, [loadPredictions]);

  // Эффекты
  useEffect(() => {
    loadMatches();
    loadLeaderboard();
    init();
  }, []);

  // Эффект для обновления режима визарда
  useEffect(() => {
    if (allPredicted) {
      setWizardMode(false);
    } else {
      const firstUnpredicted = filteredMatches.findIndex((match) => !isPredicted(match[0]));
      if (firstUnpredicted >= 0 && !wizardMode) {
        setWizardMode(true);
        setCurrentMatchIndex(firstUnpredicted);
      }
    }
  }, [allPredicted, filteredMatches, isPredicted, wizardMode]);

  // Эффект для сброса индекса при смене этапа (ТОЛЬКО при смене этапа!)
  useEffect(() => {
    if (!predictionsLoaded || filteredMatches.length === 0) {
      return;
    }
    
    const firstUnpredicted = filteredMatches.findIndex((match) => !isPredicted(match[0]));
    const newIndex = firstUnpredicted >= 0 ? firstUnpredicted : 0;
    
    if (newIndex !== currentMatchIndex) {
      setCurrentMatchIndex(newIndex);
    }
    
    if (firstUnpredicted >= 0) {
      setWizardMode(true);
    }
    
    // Очищаем временные прогнозы при смене этапа
    setTempPredictions({});
    
  }, [activeStage, predictionsLoaded]); // ТОЛЬКО эти зависимости!

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 9999
      }}>
        <video
          autoPlay
          muted
          playsInline
          onCanPlay={() => setVideoReady(true)}
          onEnded={() => setLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        >
          <source src="/loading.mp4" type="video/mp4" />
        </video>
      </div>
    );
  }

  return (
    <AppRoot>
      <Panel>
        <PanelHeader>Прогнозы ЧМ-2026</PanelHeader>
        
        {/* Табы */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 12, paddingLeft: 12, paddingRight: 12, marginBottom: 16 }}>
          {[
            { id: 'matches', label: '⚽ Матчи' },
            { id: 'leaderboard', label: '🏆 Лидеры' },
            { id: 'profile', label: '😎 Профиль' },
            ...(String(user?.id) === '471037' ? [{ id: 'admin', label: '⚙️ Админ' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                border: 'none',
                borderRadius: 12,
                padding: '10px 16px',
                whiteSpace: 'nowrap',
                fontSize: 14,
                fontWeight: 600,
                background: activeTab === tab.id ? 'var(--vkui--color_background_accent)' : 'var(--vkui--color_background_secondary)',
                color: activeTab === tab.id ? 'var(--vkui--color_text_contrast)' : 'var(--vkui--color_text_secondary)',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Лидерборд */}
        {activeTab === 'leaderboard' && (
          <Group header={<Header mode="secondary">🏆 Лидеры</Header>}>
            {leaders.map((leader, index) => {
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <Cell
                  key={index}
                  subtitle={leader[2] + ' очков'}
                  style={{
                    marginBottom: 8,
                    background: String(leader[0]) === String(user?.id) ? 'rgba(76, 175, 80, 0.15)' : 'transparent',
                    borderRadius: 12,
                    border: String(leader[0]) === String(user?.id) ? '2px solid #4CAF50' : 'none'
                  }}
                >
                  {medals[index] || `#${index + 1}`} {leader[1]}
                </Cell>
              );
            })}
          </Group>
        )}

        {/* Профиль */}
        {activeTab === 'profile' && (
          <Group header={<Header mode="secondary">😎 Профиль</Header>}>
            <Div>
              <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>
                {user?.name}
                <div style={{ marginBottom: 12 }}>
                  🏆 Место: {leaders.findIndex(l => String(l[0]) === String(user?.id)) + 1}
                </div>
              </div>
              <div style={{ marginBottom: 8 }}>⭐ Очки: {leaders.find(l => String(l[0]) === String(user?.id))?.[2] || 0}</div>
              <div style={{ marginBottom: 8 }}>⚽ Прогнозов: {Object.keys(predictions).length}</div>
              <div style={{ marginBottom: 8 }}>🎯 Точных счетов: {Object.values(predictions).filter(p => p.points === 4).length}</div>
              <div style={{ marginBottom: 8 }}>📊 Угаданных разниц: {Object.values(predictions).filter(p => p.points === 3).length}</div>
              <div style={{ marginBottom: 8 }}>✅ Угаданных исходов: {Object.values(predictions).filter(p => p.points === 2).length}</div>
            </Div>
          </Group>
        )}

        {/* Матчи */}
        {activeTab === 'matches' && (
          <>
            {/* Стадии */}
            <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: 12 }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 12, paddingLeft: 12, paddingRight: 12, marginBottom: 16 }}>
                {['t1', 't2', 't3', 'r16', 'r8', 'qf', 'sf', 'final'].map((stage) => (
                  <button
                    key={stage}
                    onClick={() => {
                      setActiveStage(stage);
                      setWizardMode(true);
                      setTempPredictions({}); // Очищаем временные прогнозы
                    }}
                    style={{
                      border: 'none',
                      borderRadius: 12,
                      padding: '10px 16px',
                      whiteSpace: 'nowrap',
                      fontSize: 14,
                      fontWeight: 600,
                      background: activeStage === stage ? 'var(--vkui--color_background_accent)' : 'var(--vkui--color_background_secondary)',
                      color: activeStage === stage ? 'var(--vkui--color_text_contrast)' : 'var(--vkui--color_text_secondary)',
                      cursor: 'pointer'
                    }}
                  >
                    {stage === 't1' ? 'Тур 1' : stage === 't2' ? 'Тур 2' : stage === 't3' ? 'Тур 3' : stage === 'r16' ? '1/16' : stage === 'r8' ? '1/8' : stage === 'qf' ? '1/4' : stage === 'sf' ? '1/2' : stage === 'final' ? 'Финал' : stage}
                  </button>
                ))}
              </div>
            </div>

            {/* Прогресс-бар */}
            {wizardMode && filteredMatches.length > 0 && (
              <Div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>
                  Прогноз {Math.min(currentMatchIndex + 1, filteredMatches.length)} из {filteredMatches.length}
                </div>
                <div style={{ width: '100%', height: 8, background: '#2c2d2e', borderRadius: 999 }}>
                  <div style={{ 
                    width: `${(Math.min(currentMatchIndex + 1, filteredMatches.length) / filteredMatches.length) * 100}%`, 
                    height: '100%', 
                    background: '#2688eb', 
                    borderRadius: 999, 
                    transition: '0.3s' 
                  }} />
                </div>
              </Div>
            )}

            {/* Список матчей */}
            <Group header={<Header mode="secondary">Матчи</Header>}>
              {(wizardMode ? (currentMatch ? [currentMatch] : []) : filteredMatches).filter(Boolean).map((match) => {
                const prediction = getPrediction(match[0]);
                return (
                  <Div key={match[0]} style={{ borderBottom: '1px solid #eee' }}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>
                      {match[4]} {match[8] === 'finished' || match[8] === 'live' ? ` ${match[6]}:${match[7]} ` : ' vs '} {match[5]}
                    </div>
                    
                    <div style={{ marginBottom: 8, color: '#777' }}>
                      {(() => {
                        const date = new Date(match[3]);
                        return `${date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}, ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
                      })()}
                      
                      <div style={{ marginTop: 4, fontWeight: 600 }}>
                        {match[8] === 'scheduled' && '⏳ Скоро'}
                        {match[8] === 'finished' && (
                          <div style={{ marginTop: 8 }}>
                            <div style={{ color: 'green', fontWeight: 600 }}>✅ Завершён</div>
                            {predictions[String(match[0])] && (
                              <div style={{ marginTop: 4, fontWeight: 600 }}>🏆 +{predictions[String(match[0])]?.points || 0} очков</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {match[8] === 'scheduled' ? (
                      <>
                        {prediction && prediction.pred1 && prediction.pred2 && (
                          <div style={{ marginBottom: 8, fontSize: 14, color: '#666', fontWeight: 600 }}>
                            Ваш текущий прогноз: {prediction.pred1}:{prediction.pred2}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                          <Input
                            type="number"
                            placeholder="0"
                            value={tempPredictions[String(match[0])]?.pred1 !== undefined ? tempPredictions[String(match[0])].pred1 : (predictions[String(match[0])]?.pred1 || '')}
                            onChange={(e) => updateTempPrediction(match[0], 'pred1', e.target.value)}
                          />
                          <Input
                            type="number"
                            placeholder="0"
                            value={tempPredictions[String(match[0])]?.pred2 !== undefined ? tempPredictions[String(match[0])].pred2 : (predictions[String(match[0])]?.pred2 || '')}
                            onChange={(e) => updateTempPrediction(match[0], 'pred2', e.target.value)}
                          />
                        </div>
                        
                        <Button size="m" stretched onClick={() => savePrediction(match)}>
                          Сохранить прогноз
                        </Button>
                        
                        {wizardMode && (
                          <Button size="m" stretched mode="secondary" style={{ marginTop: 8 }} onClick={goToNextUnpredicted}>
                            {filteredMatches.some((m, idx) => idx > currentMatchIndex && !isPredicted(m[0])) ? 'Далее →' : 'Открыть список'}
                          </Button>
                        )}
                      </>
                    ) : (
                      prediction && prediction.pred1 && prediction.pred2 && (
                        <div style={{ marginTop: 8, fontWeight: 600 }}>
                          Ваш прогноз: {prediction.pred1}:{prediction.pred2}
                        </div>
                      )
                    )}
                  </Div>
                );
              })}
            </Group>
          </>
        )}

        {/* Админка */}
        {activeTab === 'admin' && isAdmin && (
          <Group header={<Header mode="secondary">⚙️ Админ-панель</Header>}>
            {matches.map((match) => (
              <Div key={match[0]} style={{ borderBottom: '1px solid #eee' }}>
                <div style={{ marginBottom: 8, fontWeight: 600 }}>{match[4]} vs {match[5]}</div>
                
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <Input
                    type="number"
                    defaultValue={match[6]}
                    onChange={(e) => {
                      const updated = [...matches];
                      const index = updated.findIndex(m => m[0] === match[0]);
                      updated[index][6] = e.target.value;
                      setMatches(updated);
                    }}
                  />
                  <Input
                    type="number"
                    defaultValue={match[7]}
                    onChange={(e) => {
                      const updated = [...matches];
                      const index = updated.findIndex(m => m[0] === match[0]);
                      updated[index][7] = e.target.value;
                      setMatches(updated);
                    }}
                  />
                </div>
                
                <Select
                  value={match[8]}
                  options={[
                    { label: 'scheduled', value: 'scheduled' },
                    { label: 'live', value: 'live' },
                    { label: 'finished', value: 'finished' }
                  ]}
                  onChange={(e) => {
                    const updated = [...matches];
                    const index = updated.findIndex(m => m[0] === match[0]);
                    updated[index][8] = e.target.value;
                    setMatches(updated);
                  }}
                />
                
                <div style={{ marginTop: 12 }}>
                  <Button stretched onClick={() => updateMatch(match)}>
                    Сохранить матч
                  </Button>
                </div>
              </Div>
            ))}
          </Group>
        )}

        {snackbar}
      </Panel>
    </AppRoot>
  );
}