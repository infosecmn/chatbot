# Erhembayr Facebook Chatbot

Facebook Page дээр ажиллах автомат sales chatbot.

## Flow

```
USER → HOOK → GOAL → PRODUCT → TRUST → URGENCY → CLOSE → DELIVERY
                                  ❌ Гацвал → FOLLOW-UP (30мин, 24цаг)
                                  ❌ Мэдэхгүй → ОПЕРАТОР
```

## Тохиргоо

### 1. Facebook App үүсгэх

1. https://developers.facebook.com руу ороод шинэ App үүсгэ
2. **Add Product** → **Messenger** сонго
3. **Settings → Webhooks** → Callback URL: `https://your-app.onrender.com/webhook`
4. Verify Token: `.env` файл дахь `VERIFY_TOKEN`-тэй ижил
5. Subscriptions: `messages`, `messaging_postbacks`, `feed` сонго
6. **Page Access Token** авч `.env`-д хийнэ

### 2. .env файл үүсгэх

```bash
cp .env.example .env
```

Дараах утгуудыг оруул:
- `PAGE_ACCESS_TOKEN` - Facebook Page-н token
- `VERIFY_TOKEN` - Webhook verify token (чөлөөтэй сонго)
- `APP_SECRET` - Facebook App Secret

### 3. Render.com дээр deploy хийх (ҮНЭГҮЙ)

1. GitHub руу push хий
2. https://render.com руу ороод **New Web Service**
3. GitHub repo холбо
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment Variables:** `.env` утгуудаа нэмнэ
5. Deploy дар

Render URL-аа Facebook Webhook Callback URL дээр тавь:
```
https://your-app.onrender.com/webhook
```

### 4. Локал тест хийх

```bash
npm install
cp .env.example .env
# .env файлд token-уудаа оруул
npm start
```

ngrok ашиглан tunnel нээх:
```bash
ngrok http 3000
```

## Файлын бүтэц

```
├── index.js        # Express server + webhook
├── flow.js         # Conversation state machine
├── messages.js     # All message templates (Mongolian)
├── products.js     # Product catalog & matching
├── sessions.js     # In-memory session store
├── messenger.js    # Facebook Graph API calls
├── followup.js     # Follow-up timer system
├── config.js       # Environment config
└── .env.example    # Environment template
```
