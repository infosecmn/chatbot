const products = {
  weight_loss: {
    name: 'Жин хасах багц',
    keyword: [
      // Монгол
      'жин', 'турах', 'тураах', 'өөх', 'хасах', 'тарга', 'таргалах',
      'шатаах', 'калори', 'гэдэс', 'хэвлий', 'нимгэн', 'нарийн',
      'хоол', 'хоолны', 'диет', 'туранхай', 'жингээ',
      // Latin
      'weight', 'slim', 'diet', 'fat', 'lose', 'thin', 'skinny',
      'carnitine', 'fiber',
    ],
    message: [
      'Жин хасахад хамгийн үр дүнтэй багц 👇\n',
      '🔥 L-Carnitine – өөх шатаана',
      '🔥 Fiber – гэдэс цэвэрлэнэ',
      '🔥 Vitamin – бодисын солилцоо\n',
      '💡 Энэ 3-ыг хамт хэрэглэвэл илүү хурдан үр дүн гарна\n',
      '👉 Багцаар авах уу?',
    ].join('\n'),
  },

  muscle: {
    name: 'Булчин нэмэх багц',
    keyword: [
      // Монгол
      'булчин', 'протейн', 'фитнес', 'өсгөх', 'тамир', 'дасгал',
      'хүч', 'хүчтэй', 'бүдүүн', 'давтал', 'хөнгөн атлет',
      'өргөх', 'тэмцээн', 'бариа', 'тамирчин', 'биеийн',
      // Latin
      'muscle', 'protein', 'gym', 'fitness', 'bcaa', 'whey',
      'workout', 'bodybuilding', 'gainz', 'gains', 'strong',
      'bulk', 'mass',
    ],
    message: [
      'Булчин нэмэх багц 👇\n',
      '💪 Whey Protein – булчин тэжээнэ',
      '💪 BCAA – сэргээн засварлана',
      '💪 Omega-3 – үе мөчийг хамгаална\n',
      '💡 Булчин алдахгүй, хурдан өсгөнө\n',
      '👉 Багцаар авах уу?',
    ].join('\n'),
  },

  immunity: {
    name: 'Дархлаа дэмжих багц',
    keyword: [
      // Монгол
      'дархлаа', 'витамин', 'бие', 'эрүүл', 'эрүүл мэнд', 'өвдөх',
      'томуу', 'ханиад', 'халуун', 'даах', 'ядрах', 'ядарч',
      'сэргээх', 'нүүр', 'арьс', 'чийг', 'хуурай', 'унтах',
      'нойр', 'стресс', 'толгой', 'толгой өвд', 'зүрх', 'зүрхний',
      'цус', 'цусны', 'элэг', 'бөөр', 'ходоод', 'шүд', 'яс',
      'үе', 'үе мөч', 'мэдрэл', 'тархи', 'нүд', 'нүдний',
      'хоолой', 'ханьцаар', 'сэтгэл', 'уур', 'чийрэг',
      // Latin
      'health', 'immune', 'immunity', 'vitamin', 'omega',
      'multivitamin', 'energy', 'sleep', 'stress', 'skin',
      'cold', 'flu', 'tired', 'fatigue',
    ],
    message: [
      'Дархлаа дэмжих багц 👇\n',
      '❤️ Multivitamin – бие бүрэн тэжээнэ',
      '❤️ Vitamin C – дархлааг хүчирхэгжүүлнэ',
      '❤️ Omega-3 – зүрх судасны эрүүл мэнд\n',
      '💡 Өдөр бүр хэрэглэвэл бие сайжирна\n',
      '👉 АВАХ уу?',
    ].join('\n'),
  },
};

function findProduct(text) {
  const lower = text.toLowerCase();
  for (const [key, product] of Object.entries(products)) {
    if (product.keyword.some((kw) => lower.includes(kw))) {
      return { key, ...product };
    }
  }
  return null;
}

function getAllProductsMenu() {
  return [
    'Танд ямар зорилго байна? 👇\n',
    '1️⃣ Жин хасах',
    '2️⃣ Булчин нэмэх',
    '3️⃣ Дархлаа дэмжих\n',
    'Дугаараа бичээрэй 👇',
  ].join('\n');
}

function getProductByNumber(num) {
  const map = { '1': 'weight_loss', '2': 'muscle', '3': 'immunity' };
  const key = map[num];
  if (key && products[key]) return { key, ...products[key] };
  return null;
}

module.exports = { products, findProduct, getAllProductsMenu, getProductByNumber };
