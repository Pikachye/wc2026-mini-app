export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(200).send('ok');
  }

  if (req.body?.type === 'confirmation') {
    return res.status(200).send('04159491');
  }

  return res.status(200).send('ok');
}