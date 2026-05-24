const SHEET_ID =
  '14CV_M0dr_fYEuG7Stpe9GsienUxC0awP64L3VNDCvrw';

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

  const sheet =
    SpreadsheetApp
      .openById(SHEET_ID)
      .getSheetByName(
        'leaderboard'
      );

  return sheet
    .getDataRange()
    .getValues();
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

        // ТОЧНЫЙ СЧЕТ

        if (
          pred1 === real1 &&
          pred2 === real2
        ) {

          points = 4;
        }

        // РАЗНИЦА

        else if (
          (pred1 - pred2) ===
          (real1 - real2)
        ) {

          points = 3;
        }

        // ИСХОД

        else {

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

          if (
            predResult ===
            realResult
          ) {

            points = 2;
          }
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

  leaderboardSheet.clear();

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