export default async function handler(
  req,
  res
) {

  try {

    const action =
      req.query.action;

    const response =
      await fetch(

        `https://script.google.com/macros/s/AKfycbzHf61ynVErfQCbI0orOiRPxrISSIaiDBI8IqLlFQbHCvN4N67SovfXv1nqLuABCH6v/exec?action=${action}`,

        {
          method: 'GET',
          redirect: 'follow'
        }
      );

    const text =
      await response.text();

    console.log(
      'RAW RESPONSE:',
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