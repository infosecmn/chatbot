const { sendText, sendQuickReplies } = require('./messenger');
const { getSession, resetSession } = require('./sessions');
const { findProduct, getAllProductsMenu, getProductByNumber } = require('./products');
const MSG = require('./messages');
const { scheduleFollowup } = require('./followup');

// Latin -> Mongolian transliteration map
const LATIN_MAP = {
  // Global commands
  'operator': 'оператор', 'dahin': 'дахин', 'ehleh': 'эхлэх', 'reset': 'дахин',
  'heruul': 'хэрүүл', 'menu': 'дахин', 'start': 'эхлэх',

  // Greetings
  'sain': 'сайн', 'baina': 'байна', 'uu': 'уу', 'sainuu': 'сайн уу',
  'saixan': 'сайхан', 'zugeer': 'зүгээр',

  // Positive responses
  'tiim': 'тийм', 'za': 'за', 'avah': 'авах', 'avna': 'авна', 'avmaar': 'авмаар',
  'avya': 'авъя', 'bolno': 'болно', 'zahialah': 'захиалах', 'zahialna': 'захиална',
  'zuv': 'зөв', 'goyo': 'гоё', 'goye': 'гоё', 'goe': 'гоё',
  'husч': 'хүсч', 'husej': 'хүсэж', 'husne': 'хүснэ',
  'une': 'үнэ', 'sonirhoz': 'сонирхож', 'sonirhoj': 'сонирхож',
  'heregtei': 'хэрэгтэй', 'iim': 'ийм', 'zaa': 'за', 'zaaa': 'за',
  'ok': 'за', 'okay': 'за', 'yup': 'тийм', 'yep': 'тийм',
  'hamar': 'хамар', 'aviya': 'авъя', 'avch': 'авч',
  'medeh': 'мэдэх', 'medehleh': 'мэдэхлэх',
  'hүseh': 'хүсэх', 'sonirh': 'сонирх',

  // Negative responses
  'ugui': 'үгүй', 'bolih': 'болих', 'daraa': 'дараа',
  'hereggui': 'хэрэггүй', 'baihgui': 'байхгүй',
  'bolohgui': 'болохгүй', 'oilgohgui': 'ойлгохгүй',
  'avahgui': 'авахгүй', 'husehgui': 'хүсэхгүй',
  'medehgui': 'мэдэхгүй', 'sonirohgui': 'сонирхохгүй',
  'ilduu': 'илдүү', 'ildүү': 'илдүү', 'yavah': 'явах',
  'uuchlaarai': 'уучлаарай', 'bayrtai': 'баяртай',

  // Products / goals - weight loss
  'jin': 'жин', 'turah': 'турах', 'turaah': 'тураах', 'turna': 'турна',
  'ooh': 'өөх', 'uuh': 'өөх', 'hasah': 'хасах', 'hasna': 'хасна',
  'slim': 'турах', 'diet': 'турах', 'weight': 'жин',
  'calorie': 'калори', 'kalori': 'калори',
  'targa': 'тарга', 'targalah': 'таргалах', 'turaaх': 'тураах',
  'shahah': 'шахах', 'shataah': 'шатаах',

  // Products / goals - muscle
  'bulchin': 'булчин', 'muscle': 'булчин', 'protein': 'протейн',
  'proteiin': 'протейн', 'gym': 'фитнес', 'fitness': 'фитнес',
  'fitnes': 'фитнес', 'osgoh': 'өсгөх', 'tamir': 'тамир',
  'dasgal': 'дасгал', 'huch': 'хүч', 'huchtei': 'хүчтэй',
  'bodybuilding': 'булчин', 'workout': 'дасгал', 'bcaa': 'булчин',

  // Products / goals - immunity
  'darhlaa': 'дархлаа', 'vitamin': 'витамин', 'eruul': 'эрүүл',
  'eruul mend': 'эрүүл мэнд', 'bie': 'бие', 'health': 'эрүүл',
  'immune': 'дархлаа', 'immunity': 'дархлаа',
  'omega': 'дархлаа', 'multivitamin': 'витамин',
  'hanalga': 'ханалга', 'shahtah': 'шахтах',
  'uvduh': 'өвдөх', 'ovdoh': 'өвдөх', 'haluun': 'халуун',
  'tomuu': 'томуу', 'haniad': 'ханиад', 'daah': 'даах',

  // General health terms
  'эмчилгээ': 'эмчилгээ', 'emchilgee': 'эмчилгээ',
  'shuud': 'шууд', 'hurdan': 'хурдан', 'udaan': 'удаан',
  'saihan': 'сайхан', 'muhai': 'муухай',
  'zurhni': 'зүрхний', 'zurh': 'зүрх',
  'hadgalah': 'хадгалах', 'hudaldan': 'худалдан',
  'bagts': 'багц', 'bagc': 'багц',
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
const COMMENT_TRIGGERS = [
  'үнэ', 'ямар', 'хэд', 'авах', 'мэдээлэл', 'price', 'info', 'захиалах', 'хэрхэн',
  'хэдтэй', 'хэд вэ', 'зарна', 'зарах', 'хямдрал', 'хямд', 'хаанаас', 'хаана',
  'сонирхож', 'надад', 'хэрэгтэй', 'хэрхэн авах', 'юу вэ', 'тайлбар',
  'une', 'hed', 'avah', 'haana', 'hamgiin',
];

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

  const greetings = [
    'дахин', 'reset', 'эхлэх', 'hi', 'hello', 'hey', 'yo',
    'сайн байна уу', 'сайн уу', 'сайнуу', 'байна уу', 'юу байна',
    'сайн бна уу', 'мэнд', 'мэндээ', 'зугаатай', 'зөгөөр',
  ];
  if (greetings.some((g) => lower === g || lower.startsWith(g + ' '))) {
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
    await sendQuickReplies(senderId, MSG.TRUST, MSG.URGENCY_REPLIES);
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
    // Шууд үгүйсгэх
    'үгүй', 'үгүйээ', 'болих', 'болихоо', 'болиход', 'дараа', 'дараагаар',
    'no', 'nah', 'nope', 'нет',
    // -гүй дагавар
    'хэрэггүй', 'байхгүй', 'болохгүй', 'ойлгохгүй',
    'авахгүй', 'хүсэхгүй', 'мэдэхгүй', 'сонирхохгүй',
    'чадахгүй', 'идэхгүй', 'хэрэглэхгүй', 'хариулахгүй',
    'захиалахгүй', 'итгэхгүй', 'таалагдахгүй', 'хүлээхгүй',
    // Баяртай / татгалзах
    'баяртай', 'явъя', 'явах', 'болсон', 'болчихсон',
    'хэрэг алга', 'шаардлагагүй', 'огт', 'хэзээ ч',
    'салах', 'гараад', 'устгах',
  ];
  return negatives.some((n) => text.includes(n));
}

function isPositive(text) {
  // Negative-тэй давхцахгүйн тулд эхлээд negative шалгана
  if (isNegative(text)) return false;
  const positives = [
    // Шууд зөвшөөрөх
    'тийм', 'тиймээ', 'за', 'заа', 'зааа', 'зүгээр',
    'yes', 'yeah', 'yep', 'yup', 'ok', 'okay', 'ок', 'окей',
    // Авах хүсэх
    'авах', 'авна', 'авмаар', 'авъя', 'авья', 'авч',
    'авлаа', 'авмаар байна', 'авахыг', 'аваад',
    // Захиалах
    'захиалах', 'захиална', 'захиалъя', 'захиалмаар',
    // Сонирхол
    'болно', 'болъё', 'болъе', 'яваарай', 'явуул',
    'зөв', 'гоё', 'гое', 'зөвшөөр', 'таалагд',
    'хүсч', 'хүсэж', 'хүснэ', 'хүсмээр',
    'сонирхож', 'сонирхолтой', 'сонирхоод',
    'хэрэгтэй', 'надад хэрэгтэй',
    'мэдмээр', 'мэдэхийг',
    // Үнэ / дэлгэрэнгүй
    'үнэ', 'хэд вэ', 'хэдтэй', 'ямар үнэ',
    'дэлгэрэнгүй', 'тайлбарла',
    // Сэтгэл хөдлөл
    'гайгүй', 'дажгүй', 'сайхан', 'их сайн', 'маш сайн',
    'супер', 'класс', 'ваау', 'вау', 'wow',
  ];
  return positives.some((p) => text.includes(p));
}

module.exports = { handleMessage, isCommentTrigger };
