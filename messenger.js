const axios = require('axios');
const config = require('./config');

const API = 'https://graph.facebook.com/v19.0';
// Dynamic typing delay - short text = fast reply, long text = slower
// Min 1.5s, ~50ms per character, max 6s + random variation
function calcTypingDelay(text) {
  const base = Math.min(text.length * 50, 6000);
  const jitter = Math.random() * 1500; // 0-1.5s random
  return Math.max(1500, base + jitter);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendTypingOn(recipientId) {
  try {
    await axios.post(
      `${API}/me/messages`,
      {
        recipient: { id: recipientId },
        sender_action: 'typing_on',
      },
      { params: { access_token: config.PAGE_ACCESS_TOKEN } }
    );
  } catch (err) {
    // ignore typing indicator errors
  }
}

async function sendText(recipientId, text) {
  try {
    await sendTypingOn(recipientId);
    await delay(calcTypingDelay(text));
    await axios.post(
      `${API}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text },
        messaging_type: 'RESPONSE',
      },
      { params: { access_token: config.PAGE_ACCESS_TOKEN } }
    );
  } catch (err) {
    console.error('Send error:', err.response?.data || err.message);
  }
}

async function sendQuickReplies(recipientId, text, replies) {
  try {
    await sendTypingOn(recipientId);
    await delay(calcTypingDelay(text));
    const quick_replies = replies.map((r) =>
      typeof r === 'string'
        ? { content_type: 'text', title: r, payload: r }
        : { content_type: 'text', title: r.title, payload: r.payload }
    );
    await axios.post(
      `${API}/me/messages`,
      {
        recipient: { id: recipientId },
        message: { text, quick_replies },
        messaging_type: 'RESPONSE',
      },
      { params: { access_token: config.PAGE_ACCESS_TOKEN } }
    );
  } catch (err) {
    console.error('Quick reply error:', err.response?.data || err.message);
  }
}

async function replyToComment(commentId, text) {
  try {
    await axios.post(
      `${API}/${commentId}/replies`,
      { message: text },
      { params: { access_token: config.PAGE_ACCESS_TOKEN } }
    );
  } catch (err) {
    console.error('Comment reply error:', err.response?.data || err.message);
  }
}

async function sendPrivateReply(commentId, text) {
  try {
    await axios.post(
      `${API}/${commentId}/private_replies`,
      { message: text },
      { params: { access_token: config.PAGE_ACCESS_TOKEN } }
    );
  } catch (err) {
    console.error('Private reply error:', err.response?.data || err.message);
  }
}

module.exports = { sendText, sendQuickReplies, replyToComment, sendPrivateReply };
