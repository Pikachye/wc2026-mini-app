export default async function handler(
  req,
  res
) {

  const GOOGLE_SCRIPT_URL =
    'https://script.google.com/macros/s/AKfycbzHf61ynVErfQCbI0orOiRPxrISSIaiDBI8IqLlFQbHCvN4N67SovfXv1nqLuABCH6v/exec';

  try {

    const response =
      await fetch(
        GOOGLE_SCRIPT_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify(
              req.body
            )
        }
      );

    const data =
      await response.json();

    res.status(200).json(
      data
    );

  } catch (e) {

    res.status(500).json({

      error:
        e.toString()
    });
  }
}