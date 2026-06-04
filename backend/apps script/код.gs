const SHEET_ID =
  '14CV_M0dr_fYEuG7Stpe9GsienUxC0awP64L3VNDCvrw';

const VK_GROUP_TOKEN = 'vk1.a.ciwy7l3KCPkFmSKcZuixDiF3BUqP69D_DmuKpNWBFSiJVLeuKCD8jjtXjuLUYyc-dVlRiH2o4CmeqBsOUtx21HonPtajz5W9WYRpmwaTW4XcD5KGnWUjxAtxoVxdOKItUGuZNjwodaRz2NPWyE4dc2rJ-06DzP2nFmcCuEszK2ZJePX-E5z6DCuM-Nj8pp--wOg-BchH3EDOQmbAtvId0w';

function jsonOutput(data) {

  return ContentService
    .createTextOutput(
      JSON.stringify(data)
    )
    .setMimeType(
      ContentService
        .MimeType
        .JSON
    );
}

function doGet(e) {

  const action =
    e.parameter.action;

  if (action === 'matches') {

    return jsonOutput(
      getMatches()
    );
  }

  if (action === 'leaderboard') {

    return jsonOutput(
      getLeaderboard()
    );
  }

if (
  action ===
  'predictions'
) {

  return jsonOutput(

    getPredictions(
      e.parameter.vk_id
    )
  );
}

if (
  action ===
  'winner_prediction'
) {

  return jsonOutput(

    getWinnerPrediction(
      e.parameter.vk_id
    )
  );
}

  return jsonOutput({
    error:
      'Unknown action'
  });
}

function doPost(e) {

  try {

if (
  e.postData &&
  e.postData.contents
) {

  const body =
    JSON.parse(
      e.postData.contents
    );

  if (body.admin) {

    return jsonOutput(
      updateMatch(body)
    );
  }
}

    const data =
  JSON.parse(
    e.postData.contents
  );

  if (
  data.action ===
  'save_winner_prediction'
) {

  return jsonOutput(
    saveWinnerPrediction(
      data
    )
  );
}

    const result =
      savePrediction(data);

    return jsonOutput(result);

  } catch (err) {

    return jsonOutput({

      error:
        err.toString()
    });
  }
}

function getMatches() {

  const sheet =
    SpreadsheetApp
      .openById(SHEET_ID)
      .getSheetByName(
        'matches'
      );

  return sheet
    .getDataRange()
    .getValues();
}

function getLeaderboard() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      'leaderboard'
    );

  const winnersSheet =
    spreadsheet.getSheetByName(
      'winner_predictions'
    );

  const winnersRows =
    winnersSheet
      ? winnersSheet
          .getDataRange()
          .getValues()
      : [];

  const winnersMap = {};

  winnersRows.forEach(
    (row, index) => {

      if (index === 0) {
        return;
      }

      winnersMap[
        String(row[0])
      ] = row[2];
    }
  );

  const settingsSheet =
  spreadsheet.getSheetByName(
    'settings'
  );

let realWinner = '';

if (settingsSheet) {

  const settingsRows =
    settingsSheet
      .getDataRange()
      .getValues();

  const winnerRow =
    settingsRows.find(
      row =>
        row[0] ===
        'world_cup_winner'
    );

  if (winnerRow) {

    realWinner =
      winnerRow[1];
  }
}

  const leaderboardRows =
  sheet
    .getDataRange()
    .getValues()
    .filter(
      (row, index) => {

        if (index === 0) {
          return true;
        }

        return (
          String(row[0]) !== 'vk_id' &&
          String(row[1]) !== 'user_name'
        );
      }
    );

return leaderboardRows.map(
    (row, index) => {

      if (index === 0) {

        return [
          row[0],
          row[1],
          row[2],
          'winner'
        ];
      }

      const predictedWinner =
  winnersMap[
    String(row[0])
  ] || '';

const bonusPoints =

  predictedWinner &&
  realWinner &&
  predictedWinner === realWinner

    ? 12

    : 0;

return [

  row[0],

  row[1],

  Number(row[2]) +
    bonusPoints,

  predictedWinner,

  bonusPoints
];
    }
  );
}

function getPredictions(
  vkId
) {

  const sheet =
    SpreadsheetApp
      .openById(
        SHEET_ID
      )
      .getSheetByName(
        'predictions'
      );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  return rows.filter(
    (row, index) => {

      if (index === 0) {
        return false;
      }

      const rowVkId =
        String(
          row[1]
        ).trim();

      const requestVkId =
        String(
          vkId
        ).trim();

      return (
        rowVkId ===
        requestVkId
      );
    }
  );
}

function getWinnerPrediction(
  vkId
) {

  const sheet =
    SpreadsheetApp
      .openById(
        SHEET_ID
      )
      .getSheetByName(
        'winner_predictions'
      );

  if (!sheet) {
    return null;
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const found =
    rows.find(
      (row, index) => {

        if (index === 0) {
          return false;
        }

        return (
          String(row[0]) ===
          String(vkId)
        );
      }
    );

  return found || null;
}

function savePrediction(data) {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const matchesSheet =
    spreadsheet.getSheetByName(
      'matches'
    );

  const predictionsSheet =
    spreadsheet.getSheetByName(
      'predictions'
    );

  const matches =
    matchesSheet
      .getDataRange()
      .getValues();

  const match =
    matches.find(
      row =>
        Number(row[0]) ===
        Number(data.match_id)
    );

  if (!match) {

    return {
      error:
        'Match not found'
    };
  }

  const matchDate =
    new Date(match[3]);

  if (
    new Date() >= matchDate
  ) {

    return {
      error:
        'Match already started'
    };
  }

  const rows =
    predictionsSheet
      .getDataRange()
      .getValues();

  const existingIndex =
    rows.findIndex(
      (row, index) => {

        if (index === 0) {
          return false;
        }

        return (
          Number(row[1]) ===
            Number(data.vk_id)
          &&
          Number(row[3]) ===
            Number(data.match_id)
        );
      }
    );

  // UPDATE

  // UPDATE

if (existingIndex !== -1) {

  predictionsSheet
    .getRange(
      existingIndex + 1,
      5
    )
    .setValue(
      Number(data.pred1)
    );

  predictionsSheet
    .getRange(
      existingIndex + 1,
      6
    )
    .setValue(
      Number(data.pred2)
    );

  predictionsSheet
    .getRange(
      existingIndex + 1,
      8
    )
    .setValue(
      new Date()
    );

  calculateLeaderboard();

  return {
    success: true,
    updated: true
  };
}

  // CREATE

  predictionsSheet.appendRow([

    Date.now(),

    data.vk_id,

    data.user_name,

    data.match_id,

    Number(data.pred1),

    Number(data.pred2),

    0,

    new Date(),

    false
  ]);

  calculateLeaderboard();

  return {
    success: true
  };
}

function saveWinnerPrediction(
  data
) {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      'winner_predictions'
    );

  if (!sheet) {

    return {
      error:
        'Лист winner_predictions не найден'
    };
  }

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const existingIndex =
    rows.findIndex(
      (row, index) => {

        if (index === 0) {
          return false;
        }

        return (
          String(row[0]) ===
          String(data.vk_id)
        );
      }
    );

  const now =
    new Date();

  const DEADLINE =
  new Date(
    '2026-06-11T19:00:00+03:00'
  );

  if (existingIndex !== -1) {

    if (now > DEADLINE) {

  return {
    error:
      'Выбор победителя уже заблокирован'
  };
}

    sheet
      .getRange(
        existingIndex + 1,
        3
      )
      .setValue(
        data.winner
      );

    sheet.getRange(
    existingIndex + 1,
    5
  )
  .setValue(
    now
  );

calculateLeaderboard();

return {
  success: true,
  updated: true
};
  }

  sheet.appendRow([

  data.vk_id,

  data.user_name,

  data.winner,

  now,

  now
]);

calculateLeaderboard();

return {
  success: true,
  created: true
};
}

function calculateLeaderboard() {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const matchesSheet =
    spreadsheet.getSheetByName(
      'matches'
    );

  const predictionsSheet =
    spreadsheet.getSheetByName(
      'predictions'
    );

  const leaderboardSheet =
    spreadsheet.getSheetByName(
      'leaderboard'
    );

  const matches =
    matchesSheet
      .getDataRange()
      .getValues();

  const predictions =
    predictionsSheet
      .getDataRange()
      .getValues();

  const scores = {};

  predictions
  .slice(1)
  .forEach((row, index) => {

    // ПРОПУСКАЕМ ПУСТЫЕ СТРОКИ

    if (
      !row[1] ||
      !row[2]
    ) {
      return;
    }

      const vkId =
        row[1];

      const userName =
        row[2];

      const matchId =
        Number(row[3]);

      const pred1 =
        Number(row[4]);

      const pred2 =
        Number(row[5]);

      let points = 0;

      const match =
        matches.find(
          m =>
            Number(m[0]) ===
            matchId
        );

      if (
        match &&
        match[8] === 'finished'
      ) {

        const real1 =
          Number(match[6]);

        const real2 =
          Number(match[7]);

        const predResult =
  pred1 > pred2
    ? '1'
    : pred1 < pred2
    ? '2'
    : 'X';

const realResult =
  real1 > real2
    ? '1'
    : real1 < real2
    ? '2'
    : 'X';

// ТОЧНЫЙ СЧЁТ
if (
  pred1 === real1 &&
  pred2 === real2
) {

  points = 4;
}

// РАЗНИЦА, НО НЕ НИЧЬЯ
else if (
  predResult === realResult &&
  realResult !== 'X' &&
  (pred1 - pred2) ===
  (real1 - real2)
) {

  points = 3;
}

// ИСХОД / НИЧЬЯ
else if (
  predResult === realResult
) {

  points = 2;
}
      }

      // ОБНОВЛЯЕМ POINTS В predictions

      predictionsSheet
        .getRange(
          index + 2,
          7
        )
        .setValue(points);

      // LEADERBOARD

      if (!scores[vkId]) {

        scores[vkId] = {

          name: userName,

          points: 0
        };
      }

      scores[vkId].points +=
        points;
    });

    const winnerSheet =
  spreadsheet.getSheetByName(
    'winner_predictions'
  );

if (winnerSheet) {

  const winnerRows =
    winnerSheet
      .getDataRange()
      .getValues();

  winnerRows
    .slice(1)
    .forEach(row => {

      const vkId =
        String(
          Math.trunc(
            Number(row[0])
          )
        );

      const userName =
        row[1];

      if (
        !vkId ||
        vkId === 'NaN'
      ) {
        return;
      }

      if (!scores[vkId]) {

        scores[vkId] = {
          name:
            userName,
          points:
            0
        };
      }
    });
}

leaderboardSheet.clearContents();

leaderboardSheet.appendRow([
  'vk_id',
  'user_name',
  'points'
]);

  Object.entries(scores)

    .sort(
      (a, b) =>
        b[1].points -
        a[1].points
    )

    .forEach(([vkId, data]) => {

      leaderboardSheet.appendRow([

        vkId,

        data.name,

        data.points
      ]);
    });
}

function updateMatch(data) {

  const spreadsheet =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const sheet =
    spreadsheet.getSheetByName(
      'matches'
    );

  const rows =
    sheet
      .getDataRange()
      .getValues();

  const index =
    rows.findIndex(
      row =>
        Number(row[0]) ===
        Number(data.match_id)
    );

  if (index === -1) {

    return {
      error:
        'Match not found'
    };
  }

  sheet
    .getRange(
      index + 1,
      7
    )
    .setValue(
      Number(data.score1)
    );

  sheet
    .getRange(
      index + 1,
      8
    )
    .setValue(
      Number(data.score2)
    );

  sheet
    .getRange(
      index + 1,
      9
    )
    .setValue(
      data.status
    );

  calculateLeaderboard();

  return {
    success: true
  };
}

function calculatePoints(realHome, realAway, predHome, predAway) {

  if (realHome === predHome && realAway === predAway) {
    return 4;
  }

  const realDiff = realHome - realAway;
  const predDiff = predHome - predAway;

  if (realDiff === predDiff) {
    return 3;
  }

  const realResult =
    realHome > realAway ? 'home' :
    realHome < realAway ? 'away' : 'draw';

  const predResult =
    predHome > predAway ? 'home' :
    predHome < predAway ? 'away' : 'draw';

  if (realResult === predResult) {
    return 2;
  }

  return 0;
}

function processFinishedMatches() {

  calculateLeaderboard();

  Logger.log(
    'leaderboard recalculated'
  );
}

function updateMatchesFromLiveAPI() {

  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  const sheet =
    ss.getSheetByName('matches');

  const rows =
    sheet.getDataRange().getValues();

  // твой live endpoint
  const response =
    UrlFetchApp.fetch(
      'https://wc2026-mini-app.vercel.app//api/live'
    );

  const matches =
    JSON.parse(
      response.getContentText()
    );

  matches.forEach((item) => {

    for (
      let i = 1;
      i < rows.length;
      i++
    ) {

      const row = rows[i];

      const matchId =
        String(row[0]);

      // ищем матч
      if (
        matchId !==
        String(item.match_id)
      ) {
        continue;
      }

      // score1
      sheet
        .getRange(i + 1, 7)
        .setValue(
          item.score1 ?? ''
        );

      // score2
      sheet
        .getRange(i + 1, 8)
        .setValue(
          item.score2 ?? ''
        );

      // status
      sheet
        .getRange(i + 1, 9)
        .setValue(
          item.status
        );

      // winner
      sheet
        .getRange(i + 1, 10)
        .setValue(
          item.winner || ''
        );
    }
  });

  // пересчет очков
  processFinishedMatches();

  Logger.log(
    'LIVE UPDATED'
  );
}

function sendDailyMatchReminder() {

  const now = new Date();

  const mskNow = new Date(
    Utilities.formatDate(
      now,
      'Europe/Moscow',
      'yyyy-MM-dd HH:mm:ss'
    )
  );

  const startDate = new Date(
    mskNow.getFullYear(),
    mskNow.getMonth(),
    mskNow.getDate(),
    16,
    0,
    0
  );

  const endDate = new Date(
    startDate
  );

  endDate.setDate(
    endDate.getDate() + 1
  );

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const matchesSheet =
    ss.getSheetByName(
      'matches'
    );

  const matches =
    matchesSheet
      .getDataRange()
      .getValues();

  const upcoming =
    matches
      .slice(1)
      .filter(row => {

        const matchDate =
          new Date(row[3]);

        const status =
          String(row[8]);

        return (
          status === 'scheduled' &&
          matchDate >= startDate &&
          matchDate < endDate
        );
      });

  if (upcoming.length === 0) {
    return;
  }

  const text =
    '⚽ Матчи ближайшего игрового окна:\n\n' +

    upcoming
      .map(row => {

        const matchDate =
          new Date(row[3]);

        const time =
          Utilities.formatDate(
            matchDate,
            'Europe/Moscow',
            'HH:mm'
          );

        return (
          time +
          ' — ' +
          row[4] +
          ' vs ' +
          row[5]
        );
      })
      .join('\n') +

    '\n\nНе забудь сделать прогноз 👀';

  sendVkReminderToAllUsers(text);
}

function sendVkReminderToAllUsers(text) {

  const ss =
    SpreadsheetApp.openById(
      SHEET_ID
    );

  const leaderboardSheet =
    ss.getSheetByName(
      'leaderboard'
    );

  const users =
    leaderboardSheet
      .getDataRange()
      .getValues()
      .slice(1);

  users.forEach(row => {

    const vkId =
  String(
    Math.trunc(
      Number(row[0])
    )
  );

    if (!vkId) {
      return;
    }

    sendVkMessage(
      vkId,
      text
    );
  });
}

function sendVkMessage(vkId, text) {

  const url =
    'https://api.vk.com/method/messages.send';

  const payload = {
    user_id: vkId,
    random_id:
  String(
    Date.now()
  ),
    message: text,
    access_token: VK_GROUP_TOKEN,
    v: '5.199'
  };

  const response =
    UrlFetchApp.fetch(
      url,
      {
        method: 'post',
        payload:
          payload,
        muteHttpExceptions: true
      }
    );

  Logger.log(
    response.getContentText()
  );
}

function createDailyMatchReminderTrigger() {

  ScriptApp
    .newTrigger(
      'sendDailyMatchReminder'
    )
    .timeBased()
    .everyDays(1)
    .atHour(12)
    .nearMinute(0)
    .inTimezone(
      'Europe/Moscow'
    )
    .create();
}

const VK_APP_TOKEN =
  '1294ec761294ec761294ec76f311d5dcce112941294ec76789b925de25780e057924a4b';

function testVkPushNotification() {

  sendVkPushNotification(
    '471037',
    '⚽ Тестовое уведомление Прогнозы ЧМ-2026'
  );
}

function sendVkPushNotification(vkId, text) {

  const url =
    'https://api.vk.com/method/notifications.sendMessage';

  const payload = {
    user_ids:
      String(vkId),

    message:
      text.slice(0, 254),

    access_token:
      VK_APP_TOKEN,

    v:
      '5.199'
  };

  const response =
    UrlFetchApp.fetch(
      url,
      {
        method: 'post',
        payload,
        muteHttpExceptions: true
      }
    );

  Logger.log(
    response.getContentText()
  );
}