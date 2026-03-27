const { sendText, sendQuickReplies } = require('./messenger');
const { getSession, resetSession } = require('./sessions');
const { findProduct, getAllProductsMenu, getProductByNumber } = require('./products');
const MSG = require('./messages');
const { scheduleFollowup } = require('./followup');

// Comment trigger keywords
const COMMENT_TRIGGERS = ['үнэ', 'ямар', 'хэд', 'авах', 'мэдээлэл', 'price', 'info'];

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

  if (lower === 'дахин' || lower === 'reset' || lower === 'эхлэх') {
    resetSession(senderId);
    await sendText(senderId, MSG.WELCOME);
    await sendQuickReplies(senderId, MSG.GOAL_ASK, ['1', '2', '3']);
    return;
  }

  switch (session.state) {
    case 'NEW':
      await handleNew(senderId, session, lower);
      break;
    case 'HOOK':
      await handleGoal(senderId, session, lower);
      break;
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
      await sendText(senderId, 'Таны захиалга баталгаажсан ✅\nАсуулт байвал "ОПЕРАТОР" гэж бичнэ үү');
      break;
    default:
      await handleNew(senderId, session, lower);
  }
}

// NEW -> HOOK -> GOAL
async function handleNew(senderId, session, text) {
  // Check if text already contains a product hint
  const product = findProduct(text);
  if (product) {
    session.product = product;
    session.state = 'PRODUCT';
    await sendText(senderId, product.message);
    scheduleFollowup(senderId);
    return;
  }

  session.state = 'GOAL';
  await sendText(senderId, MSG.WELCOME);
  await sendQuickReplies(senderId, MSG.GOAL_ASK, ['1', '2', '3']);
  scheduleFollowup(senderId);
}

// GOAL -> PRODUCT
async function handleGoal(senderId, session, text) {
  // Try number selection
  const byNum = getProductByNumber(text.trim());
  if (byNum) {
    session.product = byNum;
    session.state = 'PRODUCT';
    await sendText(senderId, byNum.message);
    return;
  }

  // Try keyword match
  const product = findProduct(text);
  if (product) {
    session.product = product;
    session.state = 'PRODUCT';
    await sendText(senderId, product.message);
    return;
  }

  // Can't understand
  session.state = 'GOAL';
  await sendQuickReplies(senderId, MSG.GOAL_ASK, ['1', '2', '3']);
}

// PRODUCT -> TRUST (user says yes/interested)
async function handleProductResponse(senderId, session, text) {
  if (isPositive(text)) {
    session.state = 'TRUST';
    await sendText(senderId, MSG.TRUST);
    // Auto advance to urgency after trust
    setTimeout(async () => {
      session.state = 'URGENCY';
      await sendText(senderId, MSG.URGENCY);
    }, 2000);
    return;
  }

  if (isNegative(text)) {
    session.state = 'GOAL';
    await sendQuickReplies(senderId, 'Өөр бүтээгдэхүүн сонирхож байна уу? 👇', ['1', '2', '3']);
    return;
  }

  // Repeat product info
  await sendText(senderId, session.product?.message || MSG.GOAL_ASK);
}

// TRUST -> URGENCY -> CLOSE
async function handleTrustResponse(senderId, session, text) {
  session.state = 'URGENCY';
  await sendText(senderId, MSG.URGENCY);
}

async function handleUrgencyResponse(senderId, session, text) {
  if (isPositive(text)) {
    session.state = 'CLOSE';
    await sendText(senderId, MSG.ORDER_ASK);
    return;
  }

  if (isNegative(text)) {
    scheduleFollowup(senderId);
    await sendText(senderId, 'Ойлголоо 😊 Дараа дахин бичээрэй!');
    return;
  }

  session.state = 'CLOSE';
  await sendText(senderId, MSG.ORDER_ASK);
}

// CLOSE -> DELIVERY (collect order info)
async function handleOrder(senderId, session, text) {
  // Try to parse order info from the message
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length >= 2) {
    // Got structured order info
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
  const positives = ['тийм', 'за', 'авах', 'авна', 'авмаар', 'yes', 'ok', 'ок', 'авъя', 'болно', 'захиалах', 'захиална'];
  return positives.some((p) => text.includes(p));
}

function isNegative(text) {
  const negatives = ['үгүй', 'болихоо', 'дараа', 'no', 'нет', 'хэрэггүй'];
  return negatives.some((n) => text.includes(n));
}

module.exports = { handleMessage, isCommentTrigger };
