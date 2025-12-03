// Expected input:
// {
//   "messageId": "rmdr_123",
//   "channel": "sms" | "whatsapp",
//   "to": "+6591234567",
//   "plantName": "Chili Padi",
//   "action": "water",
//   "dueAt": "2025-11-25T19:30:00+08:00",
//   "tz": "Asia/Singapore",
//   "notes": "Use room-temp water"
// }

import twilio from "twilio";

const sms = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const FROM = process.env.TWILIO_FROM;

function normalize(channel, num) {
  return channel === "whatsapp"
    ? (num.startsWith("whatsapp:") ? num : `whatsapp:${num}`)
    : num;
}

function formatBody({ action, plantName, dueAt, tz, notes }) {
  const when = new Date(dueAt).toLocaleString("en-SG", {
    timeZone: tz || "Asia/Singapore",
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
  });
  return (
    `🌿 PlantPal Reminder 🌿\n` +
    `It's time to ${action} your ${plantName}!\n` +
    `🗓️ ${when}` +
    (notes ? `\n💬 Note: ${notes}` : "")
  );
}

export const handler = async (event) => {
  const p = typeof event === "string" ? JSON.parse(event) : event;
  const required = ["messageId", "channel", "to", "plantName", "action", "dueAt"];
  const missing = required.filter(k => !p?.[k]);
  if (missing.length) {
    return { ok: false, error: `Missing fields: ${missing.join(", ")}`, messageId: p?.messageId || null };
  }

  const from = normalize(p.channel, FROM);
  const to = normalize(p.channel, p.to);
  const body = formatBody(p);

  try {
    const res = await sms.messages.create({ from, to, body });
    return {
      ok: true,
      messageId: p.messageId,
      sid: res.sid,
      to: p.to,
      sentAt: new Date().toISOString()
    };
  } catch (e) {
    return {
      ok: false,
      messageId: p.messageId,
      error: e.message
    };
  }
};
