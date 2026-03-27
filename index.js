const express = require('express');
const config = require('./config');
const { handleMessage, isCommentTrigger } = require('./flow');
const { sendText, replyToComment, sendPrivateReply } = require('./messenger');
const MSG = require('./messages');

const app = express();
app.use(express.json());

// ===== Health check =====
app.get('/', (req, res) => {
  res.send('Siberian Wellness Chatbot is running 🤖');
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
        // Quick reply payload-г text-ээс илүү ашиглах
        const text = event.message.quick_reply?.payload || event.message.text;
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
          const pick = MSG.pick;
          await replyToComment(commentId, pick(MSG.HOOK_COMMENT_REPLY));
          // Send private message - start conversation
          try {
            await sendPrivateReply(commentId, pick(MSG.HOOK_DM));
          } catch (err) {
            console.error('Private reply failed:', err.message);
          }
        }
      }
    }
  }
});

// ===== Privacy Policy =====
app.get('/privacy-policy', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Siberian Wellness</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #333; }
    h1 { color: #1a73e8; }
    h2 { color: #444; margin-top: 30px; }
    p { margin: 10px 0; }
  </style>
</head>
<body>
  <h1>Privacy Policy</h1>
  <p><strong>Last updated:</strong> March 27, 2026</p>
  <p><strong>Siberian Wellness</strong> ("we", "our", "us") operates a Facebook Messenger chatbot that helps customers learn about and purchase health and supplement products.</p>

  <h2>Information We Collect</h2>
  <p>When you interact with our chatbot through Facebook Messenger, we may collect:</p>
  <ul>
    <li>Your Facebook profile name and profile picture (as provided by Facebook)</li>
    <li>Your Facebook Page-Scoped User ID</li>
    <li>Messages you send to our chatbot</li>
    <li>Order information you voluntarily provide (name, phone number, delivery address)</li>
  </ul>

  <h2>How We Use Your Information</h2>
  <ul>
    <li>To respond to your messages and provide product information</li>
    <li>To process and fulfill your orders</li>
    <li>To send follow-up messages about your inquiry</li>
    <li>To connect you with a human operator when requested</li>
  </ul>

  <h2>Data Sharing</h2>
  <p>We do not sell, trade, or share your personal information with third parties, except as necessary to fulfill your orders or as required by law.</p>

  <h2>Data Retention</h2>
  <p>Conversation data is stored temporarily during your session. Order information is retained only as long as necessary to complete your transaction.</p>

  <h2>Your Rights</h2>
  <p>You may request deletion of your data at any time by contacting us. You can stop interacting with the chatbot at any time.</p>

  <h2>Facebook Platform</h2>
  <p>Our chatbot operates on the Facebook Messenger platform. Your use of Facebook is governed by Facebook's own privacy policy and terms of service.</p>

  <h2>Contact Us</h2>
  <p>If you have questions about this privacy policy, contact us at:</p>
  <p>Email: <a href="mailto:bayarmagnai@infosec.mn">bayarmagnai@infosec.mn</a></p>
</body>
</html>`);
});

// ===== Start server =====
app.listen(config.PORT, () => {
  console.log(`Siberian Wellness Bot running on port ${config.PORT}`);
  console.log(`Webhook URL: https://your-domain.com/webhook`);
});
