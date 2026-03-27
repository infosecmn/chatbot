const products = {
  weight_loss: {
    name: 'Жин хасах багц',
    keyword: [
      'жин', 'турах', 'тураах', 'өөх', 'хасах', 'тарга', 'таргалах',
      'шатаах', 'калори', 'гэдэс', 'хэвлий', 'нимгэн', 'нарийн',
      'хоол', 'хоолны', 'диет', 'туранхай', 'жингээ',
      'weight', 'slim', 'diet', 'fat', 'lose', 'thin',
      'carnitine', 'fiber',
    ],
    message:
      '🔥 L-Carnitine – өөх шатааж жин хасна\n' +
      '🔥 Fiber – гэдэсийг цэвэрлэж хордлого гаргана\n' +
      '🔥 Vitamin Complex – бодисын солилцоог хурдасгана\n\n' +
      'Энэ гурвыг хамт хэрэглэвэл 2-3 долоо хоногт үр дүн мэдрэгдэж эхэлдэг 💪',
  },

  muscle: {
    name: 'Булчин нэмэх багц',
    keyword: [
      'булчин', 'протейн', 'фитнес', 'өсгөх', 'тамир', 'дасгал',
      'хүч', 'хүчтэй', 'бүдүүн', 'давтал', 'өргөх', 'тамирчин', 'биеийн',
      'muscle', 'protein', 'gym', 'fitness', 'bcaa', 'whey',
      'workout', 'bodybuilding', 'gains', 'strong', 'bulk', 'mass',
    ],
    message:
      '💪 Whey Protein – булчинг хооллож өсгөнө\n' +
      '💪 BCAA – дасгалын дараа хурдан сэргээнэ\n' +
      '💪 Omega-3 – үе мөчийг хамгаалж, үрэвслийг бууруулна\n\n' +
      'Gym-д явдаг хүмүүс энэ гурвыг заавал хэрэглэдэг шүү 🏋️',
  },

  immunity: {
    name: 'Дархлаа дэмжих багц',
    keyword: [
      'дархлаа', 'витамин', 'бие', 'эрүүл', 'эрүүл мэнд', 'өвдөх',
      'томуу', 'ханиад', 'халуун', 'даах', 'ядрах', 'ядарч',
      'сэргээх', 'нүүр', 'арьс', 'чийг', 'нойр', 'стресс',
      'толгой', 'зүрх', 'зүрхний', 'цус', 'элэг', 'бөөр',
      'ходоод', 'яс', 'үе', 'мэдрэл', 'тархи', 'нүд',
      'health', 'immune', 'immunity', 'vitamin', 'omega',
      'energy', 'sleep', 'stress', 'skin', 'cold', 'flu', 'tired',
    ],
    message:
      '❤️ Multivitamin – биед хэрэгтэй бүх шим тэжээлийг нөхнө\n' +
      '❤️ Vitamin C – дархлааг хүчирхэгжүүлж ханиадаас хамгаална\n' +
      '❤️ Omega-3 – зүрх судас, тархины үйл ажиллагааг дэмжинэ\n\n' +
      'Өдөр бүр уувал бие сэргэлэн, өвчинд тэсвэртэй болдог 🌿',
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
