export async function sendTelegramNotification(message: string) {
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!telegramToken || !chatId) {
        console.warn('Telegram token or chat ID is not set. Skipping notification.');
        return;
    }

    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to send Telegram message:', errorText);
        }
    } catch (error) {
        console.error('Error sending Telegram notification:', error);
    }
}
