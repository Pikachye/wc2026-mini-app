export default async function handler(
  req,
  res
) {

  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzHf61ynVErfQCbI0orOiRPxrISSIaiDBI8IqLlFQbHCvN4N67SovfXv1nqLuABCH6v/exec';

  try {

    const action =
      req.query.action;

    const vkId =
      req.query.vk_id;

    let url =
      `${GOOGLE_SCRIPT_URL}?action=${action}`;

    if (vkId) {

      url +=
        `&vk_id=${vkId}`;
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