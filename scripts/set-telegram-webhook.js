const TOKEN = "8020294497:AAE_mbbVAtgkxkvN61QSPYmXB1sAWJ7JBg8";
const WEBHOOK_URL = "https://TU-DOMINIO-DE-VERCEL.vercel.app/api/telegram/webhook";

async function setWebhook() {
    const response = await fetch(`https://api.telegram.org/bot${TOKEN}/setWebhook?url=${WEBHOOK_URL}`);
    const data = await response.json();
    console.log(data);
}

setWebhook();
