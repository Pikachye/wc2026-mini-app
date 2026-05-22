export default async function handler(
  req,
  res
) {

  if (
    req.method !== 'POST'
  ) {

    return res
      .status(405)
      .json({
        error:
          'Method not allowed'
      });
  }

  try {

    const response =
      await fetch(

      'https://script.google.com/macros/s/AKfycbyCO0iwlKRUr6BcPf7TPw6-3WtcL1ayDLSGqPcAhuQo96O9cQEY_4ZOw3a4Uh48XOA/exec',

        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/x-www-form-urlencoded'
          },

          body:
            new URLSearchParams(
              req.body
            )
        }
      );

    const data =
      await response.json();

    return res
      .status(200)
      .json(data);

  } catch (e) {

    return res
      .status(500)
      .json({

        error:
          e.toString()
      });
  }
}