const { sendText, sendQuickReplies } = require('./messenger');
const { getSession, resetSession } = require('./sessions');
const { findProduct, getAllProductsMenu, getProductByNumber } = require('./products');
const MSG = require('./messages');
const { scheduleFollowup } = require('./followup');

// Comment trigger keywords
const COMMENT_TRIGGERS = ['үнэ', 'ямар', 'хэд', 'авах', 'мэдээлэл', 'price', 'info', 'захиалах', 'хэрхэн'];

function isCommentTrigger(text) {
  const lower = text.toLowerCase();
  return COMMENT_TRIGGERS.some((kw) => lower.includes(kw));
}

async function handleMessage(senderId, text) {
  const session = getSession(senderId);
  const lower = text.toLowerCase().trim();

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
      await handleOrder(senderId, session, text);
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
async function handleOrder(senderId, session, text) {
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

// Helpers
function isPositive(text) {
  const positives = [
    'тийм', 'за', 'авах', 'авна', 'авмаар', 'yes', 'ok', 'ок',
    'авъя', 'болно', 'захиалах', 'захиална', 'зөв', 'сайн', 'гоё',
    'авья', 'хүсч', 'сонирхож', 'мэдэх', 'үнэ',
  ];
  return positives.some((p) => text.includes(p));
}

function isNegative(text) {
  const negatives = [
    'үгүй', 'болих', 'дараа', 'no', 'нет', 'хэрэггүй',
    'байхгүй', 'болохгүй', 'ойлгохгүй',
  ];
  return negatives.some((n) => text.includes(n));
}

module.exports = { handleMessage, isCommentTrigger };
