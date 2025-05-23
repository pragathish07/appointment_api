// telegram.js
const sendTelegramMessage = async ({ chatId, token, message }) => {
  if (!chatId || !token || !message) {
    throw new Error('Missing chatId, token, or message');
  }

  const fetch = (await import('node-fetch')).default;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message
      })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Error sending Telegram message:', error.message);
    throw error;
  }
};

module.exports = { sendTelegramMessage };
