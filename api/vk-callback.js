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

    if (
  text !== 'начать' &&
  text !== 'хочу играть'
) {
  return res.status(200).send('ok');
}
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
      '⚽ Добро пожаловать в Прогнозы ЧМ-2026!\n\n🏆 Делай прогнозы и соревнуйся с другими участниками.',
    keyboard: JSON.stringify({
      inline: false,
      buttons: [
        [
          {
            action: {
              type: 'open_link',
              link: APP_LINK,
              label: '🏆 Открыть приложение'
            }
          }
        ]
      ]
    })
  })
});
  }

  return res.status(200).send('ok');
}