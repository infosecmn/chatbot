const { sendText, sendQuickReplies } = require('./messenger');
const { getSession, resetSession } = require('./sessions');
const { findProduct, getAllProductsMenu, getProductByNumber } = require('./products');
const MSG = require('./messages');
const { scheduleFollowup } = require('./followup');

// Latin -> Mongolian transliteration map
const LATIN_MAP = {
  // Global commands
  'operator': 'оператор', 'dahin': 'дахин', 'ehleh': 'эхлэх', 'reset': 'дахин', 'heruul': 'хэрүүл',
  // Positive
  'tiim': 'тийм', 'za': 'за', 'avah': 'авах', 'avna': 'авна', 'avmaar': 'авмаар',
  'avya': 'авъя', 'bolno': 'болно', 'zahialah': 'захиалах', 'zahialna': 'захиална',
  'zuv': 'зөв', 'sain': 'сайн', 'goyo': 'гоё', 'husч': 'хүсч', 'medeh': 'мэдэх',
  'une': 'үнэ', 'sonirhoz': 'сонирхож',
  // Negative
  'ugui': 'үгүй', 'bolih': 'болих', 'daraa': 'дараа', 'hereggui': 'хэрэггүй',
  'baihgui': 'байхгүй', 'bolohgui': 'болохгүй', 'oilgohgui': 'ойлгохгүй',
  // Products / goals
  'jin': 'жин', 'turah': 'турах', 'bulchin': 'булчин', 'darhlaa': 'дархлаа',
  'vitamin': 'витамин', 'eruul': 'эрүүл', 'protein': 'протейн',
  'gym': 'фитнес', 'slim': 'турах', 'diet': 'турах',
};

// Transliterate Latin text to Mongolian
function transliterate(text) {
  let result = text;
  for (const [latin, cyrillic] of Object.entries(LATIN_MAP)) {
    const regex = new RegExp(`\\b${latin}\\b`, 'gi');
    result = result.replace(regex, cyrillic);
  }
  return result;
}

// Comment trigger keywords
const COMMENT_TRIGGERS = ['үнэ', 'ямар', 'хэд', 'авах', 'мэдээлэл', 'price', 'info', 'захиалах', 'хэрхэн'];

function isCommentTrigger(text) {
  const lower = text.toLowerCase();
  return COMMENT_TRIGGERS.some((kw) => lower.includes(kw));
}

async function handleMessage(senderId, text) {
  const session = getSession(senderId);
  const lower = transliterate(text.toLowerCase().trim());

  // Toggle argue mode
  if (lower === 'хэрүүл') {
    session.argueMode = !session.argueMode;
    const status = session.argueMode ? 'идэвхжлээ 🔥' : 'унтарлаа 😌';
    await sendText(senderId, `Хэрүүл горим ${status}`);
    return;
  }

  // Global commands
  if (lower === 'оператор' || lower === 'operator') {
    session.state = 'OPERATOR';
    await sendText(senderId, MSG.OPERATOR);
    return;
  }

  if (lower === 'дахин' || lower === 'reset' || lower === 'эхлэх' || lower === 'hi' || lower === 'hello' || lower === 'сайн байна уу') {
    resetSession(senderId);
    await sendQuickReplies(senderId, MSG.WELCOME, MSG.WELCOME_REPLIES);
    return;
  }

  switch (session.state) {
    case 'NEW':
      await handleNew(senderId, session, lower);
      break;
    case 'HOOK':
    case 'GOAL':
      await handleGoal(senderId, session, lower);
      break;
    case 'PRODUCT':
      await handleProductResponse(senderId, session, lower);
      break;
    case 'TRUST':
      await handleTrustResponse(senderId, session, lower);
      break;
    case 'URGENCY':
      await handleUrgencyResponse(senderId, session, lower);
      break;
    case 'CLOSE':
      await handleOrder(senderId, session, text, lower);
      break;
    case 'DONE':
      await sendQuickReplies(
        senderId,
        'Таны захиалга баталгаажсан ✅\nӨөр юу хэрэгтэй вэ?',
        [
          { title: '📋 Өөр бүтээгдэхүүн', payload: 'ДАХИН' },
          { title: '📞 Оператор', payload: 'ОПЕРАТОР' },
        ]
      );
      break;
    default:
      await handleNew(senderId, session, lower);
  }
}

// NEW -> GOAL
async function handleNew(senderId, session, text) {
  // Check if text already contains a product hint
  const product = findProduct(text);
  if (product) {
    session.product = product;
    session.state = 'PRODUCT';
    await sendQuickReplies(senderId, product.message, MSG.PRODUCT_REPLIES);
    scheduleFollowup(senderId);
    return;
  }

  // Check if it's a goal number
  const byNum = getProductByNumber(text.trim());
  if (byNum) {
    session.product = byNum;
    session.state = 'PRODUCT';
    await sendQuickReplies(senderId, byNum.message, MSG.PRODUCT_REPLIES);
    scheduleFollowup(senderId);
    return;
  }

  session.state = 'GOAL';
  await sendQuickReplies(senderId, MSG.WELCOME, MSG.WELCOME_REPLIES);
  scheduleFollowup(senderId);
}

// GOAL -> PRODUCT
async function handleGoal(senderId, session, text) {
  // Try number selection
  const byNum = getProductByNumber(text.trim());
  if (byNum) {
    session.product = byNum;
    session.state = 'PRODUCT';
    await sendQuickReplies(senderId, byNum.message, MSG.PRODUCT_REPLIES);
    return;
  }

  // Try keyword match
  const product = findProduct(text);
  if (product) {
    session.product = product;
    session.state = 'PRODUCT';
    await sendQuickReplies(senderId, product.message, MSG.PRODUCT_REPLIES);
    return;
  }

  // Can't understand - show options with quick replies
  await sendQuickReplies(senderId, MSG.UNKNOWN, MSG.UNKNOWN_REPLIES);
}

// PRODUCT -> TRUST (user says yes/interested)
async function handleProductResponse(senderId, session, text) {
  if (isPositive(text)) {
    session.state = 'TRUST';
    await sendText(senderId, MSG.TRUST);
    // Auto advance to urgency after trust
    setTimeout(async () => {
      session.state = 'URGENCY';
      await sendQuickReplies(senderId, MSG.URGENCY, MSG.URGENCY_REPLIES);
    }, 2000);
    return;
  }

  if (isNegative(text)) {
    if (session.argueMode) {
      await sendQuickReplies(senderId, pickRandom(MSG.OBJECTION_PRODUCT), MSG.OBJECTION_REPLIES);
      return;
    }
    session.state = 'GOAL';
    await sendQuickReplies(senderId, 'Өөр бүтээгдэхүүн сонирхож байна уу? 👇', MSG.GOAL_REPLIES);
    return;
  }

  // Repeat product info with buttons
  await sendQuickReplies(
    senderId,
    session.product?.message || MSG.GOAL_ASK,
    MSG.PRODUCT_REPLIES
  );
}

// TRUST -> URGENCY -> CLOSE
async function handleTrustResponse(senderId, session, text) {
  session.state = 'URGENCY';
  await sendQuickReplies(senderId, MSG.URGENCY, MSG.URGENCY_REPLIES);
}

async function handleUrgencyResponse(senderId, session, text) {
  if (isPositive(text)) {
    session.state = 'CLOSE';
    await sendText(senderId, MSG.ORDER_ASK);
    return;
  }

  if (isNegative(text)) {
    if (session.argueMode) {
      await sendQuickReplies(senderId, pickRandom(MSG.OBJECTION_URGENCY), MSG.OBJECTION_REPLIES);
      return;
    }
    scheduleFollowup(senderId);
    await sendQuickReplies(
      senderId,
      'Ойлголоо 😊 Дараа дахин бодоорой!',
      [
        { title: '📋 Бусад бүтээгдэхүүн', payload: 'ДАХИН' },
        { title: '📞 Оператор', payload: 'ОПЕРАТОР' },
      ]
    );
    return;
  }

  // Default: assume positive
  session.state = 'CLOSE';
  await sendText(senderId, MSG.ORDER_ASK);
}

// CLOSE -> DONE (collect order info)
async function handleOrder(senderId, session, text, lower) {
  // Allow user to cancel or go back
  if (isNegative(lower)) {
    if (session.argueMode) {
      await sendQuickReplies(senderId, pickRandom(MSG.OBJECTION_CLOSE), MSG.OBJECTION_REPLIES);
      return;
    }
    session.state = 'GOAL';
    await sendQuickReplies(senderId, 'Ойлголоо 😊 Өөр юу сонирхож байна?', MSG.WELCOME_REPLIES);
    return;
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length >= 2) {
    session.order = {
      raw: text,
      timestamp: new Date().toISOString(),
      product: session.product?.name || 'unknown',
    };
    session.state = 'DONE';
    const name = lines[0].replace(/^\d+[\.\)]\s*/, '');
    await sendText(senderId, MSG.ORDER_CONFIRM(name));
    console.log('NEW ORDER:', JSON.stringify(session.order));
    return;
  }

  // Not enough info, ask again
  await sendText(senderId, MSG.ORDER_ASK);
}

// Random picker
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helpers — isNegative-г ЭХЛЭЭД шалгана (авахгүй = negative, авах = positive)
function isNegative(text) {
  const negatives = [
    'үгүй', 'болих', 'дараа', 'no', 'нет', 'хэрэггүй',
    'байхгүй', 'болохгүй', 'ойлгохгүй', 'авахгүй', 'хүсэхгүй',
    'мэдэхгүй', 'сонирхохгүй',
  ];
  return negatives.some((n) => text.includes(n));
}

function isPositive(text) {
  // Negative-тэй давхцахгүйн тулд эхлээд negative шалгана
  if (isNegative(text)) return false;
  const positives = [
    'тийм', 'за', 'авах', 'авна', 'авмаар', 'yes', 'ok', 'ок',
    'авъя', 'болно', 'захиалах', 'захиална', 'зөв', 'гоё',
    'авья', 'хүсч', 'сонирхож', 'үнэ',
  ];
  return positives.some((p) => text.includes(p));
}

module.exports = { handleMessage, isCommentTrigger };
