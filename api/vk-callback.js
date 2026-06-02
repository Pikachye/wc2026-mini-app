export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).send('ok');
  }

  const body = req.body;

  if (body.type === 'confirmation') {
    return res.status(200).send('04159491');
  }

  return res.status(200).send('ok');
}