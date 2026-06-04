export default async function handler(
  req,
  res
) {

  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzMN7N3F1Qe6gulh9sCPDWiADuFJP-YbuXw5DlakoZDHIH4Nvl4ph0FWUSV0DgxuQaP/exec';

  try {

    const action =
      req.query.action;

    const vkId =
  req.query.vk_id;

const matchId =
  req.query.match_id;

let url =
  `${GOOGLE_SCRIPT_URL}?action=${action}`;

if (vkId) {

  url +=
    `&vk_id=${encodeURIComponent(vkId)}`;
}

if (matchId) {

  url +=
    `&match_id=${encodeURIComponent(matchId)}`;
}

    const response =
      await fetch(url);

    const data =
      await response.json();

    res.status(200).json(data);

  } catch (e) {

    res.status(500).json({

      error:
        e.toString()
    });
  }
}