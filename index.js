const express = require('express');
const config = require('./config');
const { handleMessage, isCommentTrigger } = require('./flow');
const { sendText, replyToComment, sendPrivateReply } = require('./messenger');
const MSG = require('./messages');

const app = express();
app.use(express.json());

// ===== Health check =====
app.get('/', (req, res) => {
  res.send('Erhembayr Chatbot is running 🤖');
});

// ===== Webhook verification (Facebook requires this) =====
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.VERIFY_TOKEN) {
    console.log('Webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// ===== Webhook events =====
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.object !== 'page') {
    return res.sendStatus(404);
  }

  // Respond immediately to avoid timeout
  res.sendStatus(200);

  for (const entry of body.entry || []) {
    // Handle messages (Inbox)
    for (const event of entry.messaging || []) {
      if (event.message && !event.message.is_echo) {
        const senderId = event.sender.id;
        const text = event.message.text;
        if (text) {
          console.log(`MSG from ${senderId}: ${text}`);
          await handleMessage(senderId, text);
        }
      }

      // Handle postback (button clicks)
      if (event.postback) {
        const senderId = event.sender.id;
        const payload = event.postback.payload;
        console.log(`POSTBACK from ${senderId}: ${payload}`);
        await handleMessage(senderId, payload || 'эхлэх');
      }
    }

    // Handle comments on posts
    for (const change of entry.changes || []) {
      if (change.field === 'feed' && change.value.item === 'comment') {
        const comment = change.value;
        const commentId = comment.comment_id;
        const commentText = comment.message || '';
        const senderId = comment.from?.id;

        // Don't reply to own comments
        if (comment.from?.id === comment.post_id?.split('_')[0]) continue;

        console.log(`COMMENT from ${senderId}: ${commentText}`);

        if (isCommentTrigger(commentText)) {
          // Reply to comment publicly
          await replyToComment(commentId, MSG.HOOK_COMMENT_REPLY);
          // Send private message
          try {
            await sendPrivateReply(commentId, MSG.HOOK_DM);
          } catch (err) {
            console.error('Private reply failed:', err.message);
          }
        }
      }
    }
  }
});

// ===== Start server =====
app.listen(config.PORT, () => {
  console.log(`Erhembayr Bot running on port ${config.PORT}`);
  console.log(`Webhook URL: https://your-domain.com/webhook`);
});
