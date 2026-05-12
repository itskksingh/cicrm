export async function sendWhatsAppReply(
  to: string, 
  text: string,
  credentials?: { accessToken: string; phoneNumberId: string }
): Promise<void> {
  const token = credentials?.accessToken || process.env.WHATSAPP_TOKEN;
  const phoneNumberId = credentials?.phoneNumberId || process.env.PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error(`[WhatsApp Error] Missing credentials (token or phoneNumberId).`);
    console.error(`[WhatsApp Error] Message to ${to} skipped to prevent system crash.`);
    return;
  }

  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body: text },
  };

  let attempt = 0;
  const maxRetries = 2;

  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return; // Success
      }

      const errText = await response.text();

      // Do not retry on 4xx (client errors)
      if (response.status >= 400 && response.status < 500) {
        console.error(`[WhatsApp API Error] Client error [${response.status}]: ${errText}`);
        throw new Error(`WhatsApp API client error: ${response.status}`);
      }

      console.warn(`[WhatsApp API Warning] Server error [${response.status}]. Attempt ${attempt + 1}/${maxRetries + 1}`);
      if (attempt === maxRetries) {
        throw new Error(`WhatsApp API server error: ${response.status}`);
      }
    } catch (error: any) {
      if (attempt === maxRetries || error.message?.includes('client error')) {
        console.error(`[WhatsApp Error] Failed to send message to ${to} after ${attempt + 1} attempts.`);
        throw error;
      }
      console.warn(`[WhatsApp API Warning] Network or server error: ${error.message}. Retrying...`);
    }

    attempt++;
    const backoffTime = 500 * Math.pow(3, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, backoffTime));
  }
}
