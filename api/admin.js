export default async function handler(
  req,
  res
) {

  try {

    const response =
      await fetch(

        'https://script.google.com/macros/s/AKfycbzHf61ynVErfQCbI0orOiRPxrISSIaiDBI8IqLlFQbHCvN4N67SovfXv1nqLuABCH6v/exec',

        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({

              admin: true,

              ...req.body
            })
        }
      );

    const text =
      await response.text();

    try {

      return res
        .status(200)
        .json(
          JSON.parse(text)
        );

    } catch {

      return res
        .status(500)
        .json({
          error: text
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