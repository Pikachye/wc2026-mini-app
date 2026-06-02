export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  if (req.method !== 'POST') {
    return res.status(200).send('ok');
  }

  const body = typeof req.body === 'string'
    ? JSON.parse(req.body)
    : req.body;

  if (body.type === 'confirmation') {
    return res.status(200).send('04159491');
  }

  if (body.type === 'message_new') {
    // позже сюда добавим отправку ссылки
  }

  return res.status(200).send('ok');
}