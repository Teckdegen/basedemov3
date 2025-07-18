
interface TelegramMessage {
  userId: string;
  walletAddress: string;
  timestamp: string;
}

const TELEGRAM_BOT_TOKEN = '7914517071:AAE72Eeby7pgghoH3gKAkj6jL3om_glG27c';
const TELEGRAM_CHAT_ID = '6213503516';

export const sendNewUserAlert = async (walletAddress: string): Promise<void> => {
  try {
    const message = `🚀 *New User Alert!*\n\n` +
      `💰 Wallet Address: \`${walletAddress}\`\n` +
      `⏰ Time: ${new Date().toLocaleString()}\n` +
      `🌐 Platform: Base Demo Trading\n\n` +
      `A new user has joined the platform!`;

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (!response.ok) {
      console.error('Failed to send Telegram notification:', response.statusText);
    } else {
      console.log('Telegram notification sent successfully');
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
};
