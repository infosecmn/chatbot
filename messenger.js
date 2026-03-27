const axios = require('axios');
const config = require('./config');

const API = 'https://graph.facebook.com/v19.0';

async function sendText(recipientId, text) {
  try {
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
