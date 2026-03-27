const products = {
  weight_loss: {
    name: 'Жин хасах багц',
    keyword: ['жин', 'турах', 'өөх', 'weight', 'slim', 'diet', 'тураах'],
    message: [
      'Жин хасахад хамгийн үр дүнтэй багц \u{1F447}\n',
      '\u{1F525} L-Carnitine \u2013 өөх шатаана',
      '\u{1F525} Fiber \u2013 гэдэс цэвэрлэнэ',
      '\u{1F525} Vitamin \u2013 бодисын солилцоо\n',
      '\u{1F4A1} Энэ 3-ыг хамт хэрэглэвэл илүү хурдан үр дүн гарна\n',
      '\u{1F449} Багцаар авах уу?',
    ].join('\n'),
  },

  muscle: {
    name: 'Булчин нэмэх багц',
    keyword: ['булчин', 'muscle', 'protein', 'протейн', 'gym', 'фитнес', 'өсгөх'],
    message: [
      'Булчин нэмэх багц \u{1F447}\n',
      '\u{1F4AA} Whey Protein',
      '\u{1F4AA} BCAA',
      '\u{1F4AA} Omega-3\n',
      '\u{1F4A1} Булчин алдахгүй, хурдан өсгөнө\n',
      '\u{1F449} Багцаар авах уу?',
    ].join('\n'),
  },

  immunity: {
    name: 'Дархлаа дэмжих багц',
    keyword: ['дархлаа', 'витамин', 'бие', 'эрүүл', 'health', 'immune', 'vitamin'],
    message: [
      'Дархлаа дэмжих багц \u{1F447}\n',
      '\u{2764}\u{FE0F} Multivitamin',
      '\u{2764}\u{FE0F} Vitamin C',
      '\u{2764}\u{FE0F} Omega-3\n',
      '\u{1F449} Өдөр бүр хэрэглэвэл бие сайжирна\n',
      '\u{1F449} АВАХ уу?',
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
    'Танд ямар зорилго байна? \u{1F447}\n',
    '1\u{FE0F}\u{20E3} Жин хасах',
    '2\u{FE0F}\u{20E3} Булчин нэмэх',
    '3\u{FE0F}\u{20E3} Дархлаа дэмжих\n',
    'Дугаараа бичээрэй \u{1F447}',
  ].join('\n');
}

function getProductByNumber(num) {
  const map = { '1': 'weight_loss', '2': 'muscle', '3': 'immunity' };
  const key = map[num];
  if (key && products[key]) return { key, ...products[key] };
  return null;
}

module.exports = { products, findProduct, getAllProductsMenu, getProductByNumber };
