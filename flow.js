const { sendText, sendQuickReplies } = require('./messenger');
const { getSession, resetSession } = require('./sessions');
const { findProduct, getAllProductsMenu, getProductByNumber } = require('./products');
const MSG = require('./messages');
const { scheduleFollowup } = require('./followup');
const pick = MSG.pick;

// ===== Latin -> Mongolian transliteration =====
const LATIN_MAP = {
  // Commands
  'operator': 'оператор', 'dahin': 'дахин', 'ehleh': 'эхлэх', 'reset': 'дахин',
  'heruul': 'хэрүүл', 'menu': 'дахин', 'start': 'эхлэх',
  // Greetings
  'sainuu': 'сайн уу', 'sain': 'сайн', 'baina': 'байна',
  'mendee': 'мэндээ', 'mend': 'мэнд',
  // Positive
  'tiim': 'тийм', 'za': 'за', 'avah': 'авах', 'avna': 'авна', 'avmaar': 'авмаар',
  'avya': 'авъя', 'bolno': 'болно', 'zahialah': 'захиалах', 'zahialna': 'захиална',
  'zuv': 'зөв', 'goyo': 'гоё', 'goye': 'гоё', 'goe': 'гоё',
  'husej': 'хүсэж', 'husne': 'хүснэ', 'husemeer': 'хүсэмээр',
  'une': 'үнэ', 'sonirhoj': 'сонирхож', 'heregtei': 'хэрэгтэй',
  'ok': 'за', 'okay': 'за', 'yep': 'тийм', 'yup': 'тийм',
  'aviya': 'авъя', 'avchi': 'авч', 'avchih': 'авчих',
  'delgerengui': 'дэлгэрэнгүй', 'tailbar': 'тайлбар',
  // Negative
  'ugui': 'үгүй', 'bolih': 'болих', 'daraa': 'дараа',
  'hereggui': 'хэрэггүй', 'baihgui': 'байхгүй',
  'bolohgui': 'болохгүй', 'oilgohgui': 'ойлгохгүй',
  'avahgui': 'авахгүй', 'husehgui': 'хүсэхгүй',
  'medehgui': 'мэдэхгүй', 'sonirohgui': 'сонирхохгүй',
  'bayrtai': 'баяртай', 'yavah': 'явах',
  // Products - weight
  'jin': 'жин', 'turah': 'турах', 'turaah': 'тураах', 'turna': 'турна',
  'ooh': 'өөх', 'hasah': 'хасах', 'diet': 'турах', 'slim': 'турах',
  'targa': 'тарга', 'shataah': 'шатаах', 'kalori': 'калори',
  'gedes': 'гэдэс', 'hevlii': 'хэвлий', 'hoool': 'хоол',
  // Products - muscle
  'bulchin': 'булчин', 'protein': 'протейн', 'gym': 'фитнес',
  'fitness': 'фитнес', 'osgoh': 'өсгөх', 'tamir': 'тамир',
  'dasgal': 'дасгал', 'huch': 'хүч', 'workout': 'дасгал',
  'bcaa': 'булчин', 'muscle': 'булчин',
  // Products - immunity
  'darhlaa': 'дархлаа', 'vitamin': 'витамин', 'eruul': 'эрүүл',
  'bie': 'бие', 'health': 'эрүүл', 'immune': 'дархлаа',
  'omega': 'дархлаа', 'tomuu': 'томуу', 'haniad': 'ханиад',
  'ovdoh': 'өвдөх', 'noir': 'нойр', 'stress': 'стресс',
  'ars': 'арьс', 'tolgo': 'толгой', 'zurhni': 'зүрхний',
  'eleg': 'элэг', 'hodood': 'ходоод', 'yas': 'яс',
  // General
  'bagts': 'багц', 'bagc': 'багц', 'hurdan': 'хурдан', 'shuud': 'шууд',
  'hed': 'хэд', 'haana': 'хаана', 'yamar': 'ямар',
  'hudaldah': 'худалдах', 'zahialga': 'захиалга',
};

function transliterate(text) {
  let result = text;
  for (const [latin, cyrillic] of Object.entries(LATIN_MAP)) {
    const regex = new RegExp(`\\b${latin}\\b`, 'gi');
    result = result.replace(regex, cyrillic);
  }
  return result;
}

// ===== Comment triggers =====
const COMMENT_TRIGGERS = [
  'үнэ', 'ямар', 'хэд', 'авах', 'мэдээлэл', 'захиалах', 'хэрхэн',
  'хэдтэй', 'зарна', 'хямдрал', 'хаана', 'сонирхож', 'хэрэгтэй',
  'price', 'info', 'how', 'buy', 'une', 'hed', 'avah', 'haana',
];

function isCommentTrigger(text) {
  const lower = text.toLowerCase();
  return COMMENT_TRIGGERS.some((kw) => lower.includes(kw));
}

// ===== Main handler =====
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

  // Operator
  if (lower === 'оператор' || lower === 'operator') {
    session.state = 'OPERATOR';
    await sendText(senderId, pick(MSG.OPERATOR));
    return;
  }

  // Show product menu
  if (lower === 'дахин' || lower === 'бүтээгдэхүүн' || lower === 'цэс') {
    session.state = 'GOAL';
    await sendQuickReplies(senderId, pick(MSG.PRODUCT_MENU), MSG.GOAL_REPLIES);
    return;
  }

  // Greetings / reset
  const greetings = [
    'reset', 'эхлэх', 'hi', 'hello', 'hey', 'yo',
    'сайн байна уу', 'сайн уу', 'сайнуу', 'байна уу', 'юу байна',
    'мэнд', 'мэндээ',
  ];
  if (greetings.some((g) => lower === g || lower.startsWith(g + ' '))) {
    resetSession(senderId);
    await sendQuickReplies(senderId, pick(MSG.WELCOME), MSG.WELCOME_REPLIES);
    return;
  }

  // Price inquiry from any state
  if (lower.includes('үнэ') || lower.includes('хэд') || lower === 'үнэ') {
    await sendQuickReplies(senderId, pick(MSG.PRICE), MSG.PRICE_REPLIES);
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
        pick(MSG.RETURN_DONE),
        MSG.DONE_REPLIES
      );
      break;
    case 'OPERATOR':
      await sendQuickReplies(
        senderId,
        pick(MSG.RETURN_OPERATOR),
        MSG.WELCOME_REPLIES
      );
      break;
    default:
      await handleNew(senderId, session, lower);
  }
}

// ===== NEW -> GOAL =====
async function handleNew(senderId, session, text) {
  // Product hint
  const product = findProduct(text);
  if (product) {
    session.product = product;
    session.state = 'PRODUCT';
    await sendText(senderId, pick(MSG.PRODUCT_INTRO));
    await sendQuickReplies(senderId, product.message, MSG.PRODUCT_REPLIES);
    scheduleFollowup(senderId);
    return;
  }

  // Goal number
  const byNum = getProductByNumber(text.trim());
  if (byNum) {
    session.product = byNum;
    session.state = 'PRODUCT';
    await sendText(senderId, pick(MSG.PRODUCT_INTRO));
    await sendQuickReplies(senderId, byNum.message, MSG.PRODUCT_REPLIES);
    scheduleFollowup(senderId);
    return;
  }

  session.state = 'GOAL';
  await sendQuickReplies(senderId, pick(MSG.WELCOME), MSG.WELCOME_REPLIES);
  scheduleFollowup(senderId);
}

// ===== GOAL -> PRODUCT =====
async function handleGoal(senderId, session, text) {
  const byNum = getProductByNumber(text.trim());
  if (byNum) {
    session.product = byNum;
    session.state = 'PRODUCT';
    await sendText(senderId, pick(MSG.PRODUCT_INTRO));
    await sendQuickReplies(senderId, byNum.message, MSG.PRODUCT_REPLIES);
    return;
  }

  const product = findProduct(text);
  if (product) {
    session.product = product;
    session.state = 'PRODUCT';
    await sendText(senderId, pick(MSG.PRODUCT_INTRO));
    await sendQuickReplies(senderId, product.message, MSG.PRODUCT_REPLIES);
    return;
  }

  // GOAL state-д negative хариулт → operator эсвэл баяртай
  if (isNegative(text)) {
    await sendQuickReplies(
      senderId,
      pick([
        'За ойлголоо 😊 Хэрэв дараа сонирхвол чөлөөтэй бичээрэй!',
        'Тийм үү, за за 😊 Хэрэгтэй болвол бичээрэй, би энд байна!',
        'Ойлголоо! Дараа дахин зочлоорой 😊',
      ]),
      [
        { title: '📞 Зөвлөгөө авах', payload: 'ОПЕРАТОР' },
        { title: '📋 Бүтээгдэхүүн үзэх', payload: 'ДАХИН' },
      ]
    );
    return;
  }

  await sendQuickReplies(senderId, pick(MSG.UNKNOWN), MSG.UNKNOWN_REPLIES);
}

// ===== PRODUCT -> TRUST =====
async function handleProductResponse(senderId, session, text) {
  if (isPositive(text)) {
    session.state = 'TRUST';
    await sendQuickReplies(senderId, pick(MSG.TRUST), MSG.TRUST_REPLIES);
    return;
  }

  if (isNegative(text)) {
    if (session.argueMode) {
      await sendQuickReplies(senderId, pick(MSG.OBJECTION_PRODUCT), MSG.OBJECTION_REPLIES);
      return;
    }
    session.state = 'GOAL';
    await sendQuickReplies(
      senderId,
      pick([
        'Өөр бүтээгдэхүүн сонирхож байна уу? 😊',
        'За за, өөр юу үзэх вэ? 👇',
        'Ямар бүтээгдэхүүн таарах бол? Сонгоорой 😊',
      ]),
      MSG.GOAL_REPLIES
    );
    return;
  }

  // Repeat with engagement
  await sendQuickReplies(senderId, pick(MSG.PRODUCT_FOLLOWUP), MSG.PRODUCT_REPLIES);
}

// ===== TRUST -> URGENCY =====
async function handleTrustResponse(senderId, session, text) {
  if (isPositive(text)) {
    session.state = 'CLOSE';
    await sendText(senderId, pick(MSG.ORDER_ASK));
    return;
  }

  if (isNegative(text)) {
    if (session.argueMode) {
      await sendQuickReplies(senderId, pick(MSG.OBJECTION_PRODUCT), MSG.OBJECTION_REPLIES);
      return;
    }
    // Hesitate - push to urgency
    session.state = 'URGENCY';
    await sendQuickReplies(senderId, pick(MSG.HESITATE), MSG.HESITATE_REPLIES);
    return;
  }

  // Default: push to urgency
  session.state = 'URGENCY';
  await sendQuickReplies(senderId, pick(MSG.URGENCY), MSG.URGENCY_REPLIES);
}

// ===== URGENCY -> CLOSE =====
async function handleUrgencyResponse(senderId, session, text) {
  if (isPositive(text)) {
    session.state = 'CLOSE';
    await sendText(senderId, pick(MSG.ORDER_ASK));
    return;
  }

  if (isNegative(text)) {
    if (session.argueMode) {
      await sendQuickReplies(senderId, pick(MSG.OBJECTION_URGENCY), MSG.OBJECTION_REPLIES);
      return;
    }
    // Don't give up easily - hesitate
    session.state = 'URGENCY';
    scheduleFollowup(senderId);
    await sendQuickReplies(senderId, pick(MSG.HESITATE), MSG.HESITATE_REPLIES);
    return;
  }

  // Default: assume interested, push to close
  session.state = 'CLOSE';
  await sendText(senderId, pick(MSG.ORDER_ASK));
}

// ===== CLOSE -> DONE =====
async function handleOrder(senderId, session, text, lower) {
  if (isNegative(lower)) {
    if (session.argueMode) {
      await sendQuickReplies(senderId, pick(MSG.OBJECTION_CLOSE), MSG.OBJECTION_REPLIES);
      return;
    }
    session.state = 'GOAL';
    await sendQuickReplies(
      senderId,
      pick([
        'Ойлголоо 😊 Өөр юу сонирхож байна?',
        'За за, өөр бүтээгдэхүүн үзэх үү? 😊',
      ]),
      MSG.WELCOME_REPLIES
    );
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

  // Not enough info
  await sendText(senderId, pick([
    'Нэр, утас, хаягаа бичээд явуулаарай 😊',
    'Мэдээлэл дутуу байна 😅 Нэр, утас, хаягаа бичнэ үү!',
    'Бараг боллоо! Нэр, утас, хаягаа дараалуулаад бичээрэй 👇',
  ]));
}

// ===== Helpers =====
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function isNegative(text) {
  const negatives = [
    'үгүй', 'үгүйээ', 'болих', 'болихоо', 'дараа', 'дараагаар',
    'no', 'nah', 'nope', 'нет',
    'хэрэггүй', 'байхгүй', 'болохгүй', 'ойлгохгүй',
    'авахгүй', 'хүсэхгүй', 'мэдэхгүй', 'сонирхохгүй',
    'чадахгүй', 'хэрэглэхгүй', 'захиалахгүй', 'итгэхгүй',
    'таалагдахгүй', 'хүлээхгүй',
    'баяртай', 'явъя', 'явах', 'болсон', 'болчихсон',
    'хэрэг алга', 'шаардлагагүй', 'огт', 'хэзээ ч',
  ];
  return negatives.some((n) => text.includes(n));
}

function isPositive(text) {
  if (isNegative(text)) return false;
  const positives = [
    'тийм', 'тиймээ', 'за', 'заа', 'зааа', 'зүгээр',
    'yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'ок', 'окей',
    'авах', 'авна', 'авмаар', 'авъя', 'авья', 'авч', 'авчих',
    'авлаа', 'аваад',
    'захиалах', 'захиална', 'захиалъя', 'захиалмаар',
    'болно', 'болъё', 'болъе', 'явуул',
    'зөв', 'гоё', 'гое', 'зөвшөөр', 'таалагд',
    'хүсч', 'хүсэж', 'хүснэ', 'хүсмээр',
    'сонирхож', 'сонирхолтой', 'сонирхоод',
    'хэрэгтэй', 'надад хэрэгтэй',
    'дэлгэрэнгүй', 'тайлбарла',
    'гайгүй', 'дажгүй', 'сайхан', 'их сайн', 'маш сайн',
    'супер', 'класс', 'ваау', 'вау', 'wow',
  ];
  return positives.some((p) => text.includes(p));
}

module.exports = { handleMessage, isCommentTrigger };
