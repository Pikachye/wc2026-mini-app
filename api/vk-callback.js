const VK_TOKEN = process.env.VK_TOKEN;
const APP_LINK = 'https://vk.com/app54603960';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  const body = typeof req.body === 'string'
    ? JSON.parse(req.body)
    : req.body;

  if (body.type === 'confirmation') {
    return res.status(200).send('04159491');
  }

  if (body.type === 'message_new') {
    const msg = body.object.message;
    const text = (msg.text || '').trim().toLowerCase();

    if (text === 'начать') {
      await fetch('https://api.vk.com/method/messages.send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          access_token: VK_TOKEN,
          v: '5.199',
          peer_id: String(msg.peer_id),
          random_id: String(Date.now()),
          message:
            `Привет! 👋\n\nОткрыть приложение:\n${APP_LINK}`
        })
      });
    }
  }

  return res.status(200).send('ok');
}