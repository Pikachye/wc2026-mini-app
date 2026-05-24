export default async function handler(
  req,
  res
) {

  const GOOGLE_SCRIPT_URL =
    'ТВОЙ_APPS_SCRIPT_URL';

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