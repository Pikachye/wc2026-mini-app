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
            ),

          redirect: 'follow'
        }
      );

    const text =
      await response.text();

    console.log(
      text
    );

    try {

      const data =
        JSON.parse(text);

      return res
        .status(200)
        .json(data);

    } catch {

      return res
        .status(500)
        .json({

          error:
            text
        });
    }

  } catch (e) {

    return res
      .status(500)
      .json({

        error:
          e.toString()
      });
  }
}