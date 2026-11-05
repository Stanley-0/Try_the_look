/**
 * Catalog data for Nike "Try the Look. — Runway"
 * Absolute URLs and variant IDs as specified in the exact recreation prompt.
 */

export interface ProductVariant {
  id: number;
  a: boolean;
  o: string[];
}

export interface CatalogItem {
  id: string;
  name: string;
  vendor: string;
  type: string;
  price: number;
  image: string;
  sizes: string[];
  variants: ProductVariant[];
  url: string;
}

export interface LookPiece {
  productId: string;
  tag?: string;
}

export interface LookPin {
  left: number; // percentage
  top: number;  // percentage
  tip: string;
}

export interface LookData {
  index: number;
  key: string;
  name: string;
  description: string;
  model640: string;
  original1080: string;
  piecesLabel: string;
  bundleOld: string;
  bundleNew: string;
  pieces: LookPiece[];
  pins: LookPin[];
}

export const CATALOG_ITEMS: Record<string, CatalogItem> = {
  'tatum-5-orbit-copy': {
    id: 'tatum-5-orbit-copy',
    name: 'Air Jordan 12 Retro',
    vendor: 'Nikey | Password: 1',
    type: 'From the original lookbook',
    price: 149.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit-copy.webp',
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    variants: [
      { id: 57015167025457, a: true, o: ['40'] },
      { id: 57015167058225, a: true, o: ['41'] },
      { id: 57015167090993, a: true, o: ['42'] },
      { id: 57015167123761, a: true, o: ['43'] },
      { id: 57015167156529, a: true, o: ['44'] },
      { id: 57015167189297, a: true, o: ['45'] },
      { id: 57015167222065, a: true, o: ['46'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit-copy',
  },
  'tshirt': {
    id: 'tshirt',
    name: 'Tshirt',
    vendor: 'Nike',
    type: 'From the original lookbook',
    price: 199.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tshirt.webp',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56835911582001, a: true, o: ['S'] },
      { id: 56835911614769, a: true, o: ['L'] },
      { id: 56835911647537, a: true, o: ['M'] },
      { id: 56835911680305, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/tshirt',
  },
  'sweatshirt': {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    vendor: 'Nike',
    type: 'From the original lookbook',
    price: 199.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt.webp',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56835806396721, a: true, o: ['S'] },
      { id: 56835806429489, a: true, o: ['L'] },
      { id: 56835806462257, a: true, o: ['M'] },
      { id: 56835806495025, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt',
  },
  'tatum-5-orbit': {
    id: 'tatum-5-orbit',
    name: 'Tatum 5 Orbit',
    vendor: 'Nikey | Password: 1',
    type: 'From the original lookbook',
    price: 149.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-tatum-5-orbit.webp',
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    variants: [
      { id: 57015166730545, a: true, o: ['40'] },
      { id: 57015166763313, a: true, o: ['41'] },
      { id: 57015166796081, a: true, o: ['42'] },
      { id: 57015166828849, a: true, o: ['43'] },
      { id: 57015166861617, a: true, o: ['44'] },
      { id: 57015166894385, a: true, o: ['45'] },
      { id: 57015166927153, a: true, o: ['46'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/tatum-5-orbit',
  },
  'hoodie-black': {
    id: 'hoodie-black',
    name: 'Hoodie Black',
    vendor: 'Nike',
    type: 'From the original lookbook',
    price: 199.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-hoodie-black.webp',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56836251681073, a: true, o: ['S'] },
      { id: 56836251713841, a: true, o: ['L'] },
      { id: 56836251746609, a: true, o: ['M'] },
      { id: 56836251779377, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/hoodie-black',
  },
  'sweatshirt-plus': {
    id: 'sweatshirt-plus',
    name: 'Sweatshirt Plus',
    vendor: 'Nike',
    type: 'From the original lookbook',
    price: 199.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-sweatshirt-plus.webp',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56836143743281, a: true, o: ['S'] },
      { id: 56836143776049, a: true, o: ['L'] },
      { id: 56836143808817, a: true, o: ['M'] },
      { id: 56836143841585, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/sweatshirt-plus',
  },
  'hoodie': {
    id: 'hoodie',
    name: 'Hoodie',
    vendor: 'Nike',
    type: 'From the original lookbook',
    price: 199.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-hoodie.webp',
    sizes: ['S', 'L', 'M', 'XL'],
    variants: [
      { id: 56836002185521, a: true, o: ['S'] },
      { id: 56836002218289, a: true, o: ['L'] },
      { id: 56836002251057, a: true, o: ['M'] },
      { id: 56836002283825, a: true, o: ['XL'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/hoodie',
  },
  'air-jordan-12-retro-copy': {
    id: 'air-jordan-12-retro-copy',
    name: 'Luka 5',
    vendor: 'Nikey | Password: 1',
    type: 'From the original lookbook',
    price: 149.00,
    image: 'https://reel-ref-try-the-look.vercel.app/assets/source-air-jordan-12-retro-copy.webp',
    sizes: ['40', '41', '42', '43', '44', '45', '46'],
    variants: [
      { id: 57015176364337, a: true, o: ['40'] },
      { id: 57015176397105, a: true, o: ['41'] },
      { id: 57015176429873, a: true, o: ['42'] },
      { id: 57015176462641, a: true, o: ['43'] },
      { id: 57015176495409, a: true, o: ['44'] },
      { id: 57015176528177, a: true, o: ['45'] },
      { id: 57015176560945, a: true, o: ['46'] },
    ],
    url: 'https://nike-makknzjs.myshopify.com/products/air-jordan-12-retro-copy',
  },
};

export const LOOKS_DATA: LookData[] = [
  {
    index: 0,
    key: 'bndthK',
    name: 'The City Edit',
    description: 'A charcoal knit and easy denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-1-640.webp',
    original1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-1.webp',
    piecesLabel: '3 pieces',
    bundleOld: '$547.00',
    bundleNew: '$492.30',
    pieces: [
      { productId: 'tatum-5-orbit-copy' },
      { productId: 'tshirt' },
      { productId: 'sweatshirt' },
    ],
    pins: [
      { left: 47, top: 27, tip: 'Air Jordan 12 Retro' },
      { left: 48, top: 58, tip: 'Tshirt' },
      { left: 45, top: 96, tip: 'Sweatshirt' },
    ],
  },
  {
    index: 1,
    key: 'XckgG6',
    name: 'Gallery Opening',
    description: 'A clean white tee and relaxed denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-5-640.webp',
    original1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-5.webp',
    piecesLabel: '3 pieces',
    bundleOld: '$547.00',
    bundleNew: '$492.30',
    pieces: [
      { productId: 'tatum-5-orbit' },
      { productId: 'hoodie-black', tag: 'New' },
      { productId: 'tshirt' },
    ],
    pins: [
      { left: 50, top: 28, tip: 'Tatum 5 Orbit' },
      { left: 48, top: 58, tip: 'Hoodie Black' },
      { left: 45, top: 88, tip: 'Tshirt' },
    ],
  },
  {
    index: 2,
    key: 'rLfAhC',
    name: 'Gallery Opening',
    description: 'Olive knitwear. A grounded palette.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-4-640.webp',
    original1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-4.webp',
    piecesLabel: '3 pieces',
    bundleOld: '$547.00',
    bundleNew: '$492.30',
    pieces: [
      { productId: 'sweatshirt-plus' },
      { productId: 'tatum-5-orbit', tag: 'New' },
      { productId: 'tshirt' },
    ],
    pins: [
      { left: 50, top: 28, tip: 'Sweatshirt Plus' },
      { left: 48, top: 58, tip: 'Tatum 5 Orbit' },
      { left: 45, top: 88, tip: 'Tshirt' },
    ],
  },
  {
    index: 3,
    key: 'FKg67q',
    name: 'Studio Day',
    description: 'Black, white and laid-back denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-6-640.webp',
    original1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-6.webp',
    piecesLabel: '3 pieces',
    bundleOld: '$547.00',
    bundleNew: '$492.30',
    pieces: [
      { productId: 'hoodie-black' },
      { productId: 'tatum-5-orbit-copy' },
      { productId: 'tshirt' },
    ],
    pins: [
      { left: 50, top: 28, tip: 'Hoodie Black' },
      { left: 48, top: 58, tip: 'Air Jordan 12 Retro' },
      { left: 45, top: 88, tip: 'Tshirt' },
    ],
  },
  {
    index: 4,
    key: '8KREEE',
    name: 'Studio Day',
    description: 'Burgundy layers. A tailored perspective.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-3-640.webp',
    original1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-3.webp',
    piecesLabel: '3 pieces',
    bundleOld: '$547.00',
    bundleNew: '$492.30',
    pieces: [
      { productId: 'sweatshirt' },
      { productId: 'tatum-5-orbit' },
      { productId: 'tshirt' },
    ],
    pins: [
      { left: 50, top: 28, tip: 'Sweatshirt' },
      { left: 48, top: 58, tip: 'Tatum 5 Orbit' },
      { left: 45, top: 88, tip: 'Tshirt' },
    ],
  },
  {
    index: 5,
    key: 'N3bfm9',
    name: 'Studio Day',
    description: 'A grey crew and your favourite denim.',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-2-640.webp',
    original1080: 'https://reel-ref-try-the-look.vercel.app/assets/original-look-2.webp',
    piecesLabel: '3 pieces',
    bundleOld: '$547.00',
    bundleNew: '$492.30',
    pieces: [
      { productId: 'hoodie' },
      { productId: 'air-jordan-12-retro-copy' },
      { productId: 'tshirt' },
    ],
    pins: [
      { left: 50, top: 28, tip: 'Hoodie' },
      { left: 48, top: 58, tip: 'Luka 5' },
      { left: 45, top: 88, tip: 'Tshirt' },
    ],
  },
];
