// ===== DUMMY DATA =====

const BRANDS = [
  {
    id: 'burger-house',
    name: 'Burger House',
    tagline: 'Bold flavours. Juicy bites. No regrets.',
    emoji: '🍔',
    bg: 'linear-gradient(135deg, #3a1a00 0%, #6b2f00 50%, #1a0a00 100%)',
    accentColor: '#ff8c2c',
    tags: ['Burgers', 'Sides', 'Drinks'],
    rating: '4.8',
    deliveryTime: '20-30 min',
    deliveryFee: '₹29',
    minOrder: '₹149',
    categories: ['Burgers', 'Sides', 'Drinks'],
    menu: [
      { id: 'bh1', name: 'Classic Smash Burger', category: 'Burgers', price: 199, emoji: '🍔', desc: 'Double smash patty, american cheese, pickles, special sauce on a brioche bun.' },
      { id: 'bh2', name: 'BBQ Bacon Burger', category: 'Burgers', price: 249, emoji: '🥓', desc: 'Crispy bacon, smoky BBQ glaze, caramelized onions, cheddar cheese.' },
      { id: 'bh3', name: 'Spicy Sriracha Burger', category: 'Burgers', price: 219, emoji: '🌶️', desc: 'Jalapeños, sriracha mayo, pepper jack cheese. Not for the faint-hearted.' },
      { id: 'bh4', name: 'Truffle Mushroom Burger', category: 'Burgers', price: 269, emoji: '🍄', desc: 'Sautéed mushrooms, truffle mayo, gruyère cheese, arugula.' },
      { id: 'bh5', name: 'Loaded Fries', category: 'Sides', price: 129, emoji: '🍟', desc: 'Crispy fries loaded with cheese sauce, jalapeños and sour cream.' },
      { id: 'bh6', name: 'Onion Rings', category: 'Sides', price: 99, emoji: '⭕', desc: 'Beer-battered golden onion rings with dipping sauce.' },
      { id: 'bh7', name: 'Coleslaw', category: 'Sides', price: 79, emoji: '🥗', desc: 'Creamy house-made coleslaw with fresh herbs.' },
      { id: 'bh8', name: 'Craft Cola', category: 'Drinks', price: 69, emoji: '🥤', desc: 'Real cane sugar cola, ice cold.' },
      { id: 'bh9', name: 'Salted Caramel Shake', category: 'Drinks', price: 149, emoji: '🥛', desc: 'Thick, creamy milkshake with salted caramel and whipped cream.' },
    ]
  },
  {
    id: 'pizza-palace',
    name: 'Pizza Palace',
    tagline: 'Wood-fired perfection, every single slice.',
    emoji: '🍕',
    bg: 'linear-gradient(135deg, #0a001a 0%, #1f0040 50%, #0a0010 100%)',
    accentColor: '#9b5de5',
    tags: ['Pizza', 'Pasta', 'Drinks'],
    rating: '4.9',
    deliveryTime: '25-35 min',
    deliveryFee: '₹39',
    minOrder: '₹199',
    categories: ['Pizza', 'Pasta', 'Drinks'],
    menu: [
      { id: 'pp1', name: 'Margherita Royale', category: 'Pizza', price: 299, emoji: '🍕', desc: 'San Marzano tomatoes, fresh mozzarella di bufala, basil, extra virgin olive oil.' },
      { id: 'pp2', name: 'Pepperoni Volcano', category: 'Pizza', price: 349, emoji: '🔥', desc: 'Double pepperoni, chilli honey drizzle on a spicy red base.' },
      { id: 'pp3', name: 'BBQ Chicken Ranch', category: 'Pizza', price: 369, emoji: '🍗', desc: 'Smoked chicken, ranch drizzle, red onion, jalapeños, mozzarella.' },
      { id: 'pp4', name: 'Four Cheese', category: 'Pizza', price: 379, emoji: '🧀', desc: 'Mozzarella, gorgonzola, gruyère and parmesan on a garlic white base.' },
      { id: 'pp5', name: 'Truffle Funghi', category: 'Pizza', price: 399, emoji: '🍄', desc: 'Wild mushrooms, truffle oil, mozzarella, fresh thyme, parmesan shavings.' },
      { id: 'pp6', name: 'Creamy Pesto Pasta', category: 'Pasta', price: 249, emoji: '🍝', desc: 'Rigatoni ribbons tossed in creamy basil pesto and toasted pine nuts.' },
      { id: 'pp7', name: 'Arrabbiata', category: 'Pasta', price: 229, emoji: '🌶️', desc: 'Penne in a fiery tomato and garlic sauce with fresh chilli.' },
      { id: 'pp8', name: 'Lemonade Spritz', category: 'Drinks', price: 89, emoji: '🍋', desc: 'Fresh squeezed lemon, mint, soda water, a pinch of sugar.' },
      { id: 'pp9', name: 'Berry Blast Shake', category: 'Drinks', price: 159, emoji: '🫐', desc: 'Mixed berry smoothie shake with vanilla ice cream.' },
    ]
  }
];

const AD_BANNERS = [
  {
    bg: 'linear-gradient(135deg, #1a0033, #3d0070)',
    icon: '🎉',
    title: '50% off your first order!',
    subtitle: 'Use code EATCLUB50 at checkout. Limited time offer.',
    border: 'rgba(155,93,229,0.4)'
  },
  {
    bg: 'linear-gradient(135deg, #001a0d, #004d24)',
    icon: '🚴',
    title: 'Free delivery all weekend',
    subtitle: 'No minimum order. Enjoy the weekend, we\'ll do the rest.',
    border: 'rgba(34,197,94,0.4)'
  },
  {
    bg: 'linear-gradient(135deg, #1a0800, #4d1f00)',
    icon: '⭐',
    title: 'Refer a friend, get ₹100',
    subtitle: 'Share your referral code. Both of you get a reward.',
    border: 'rgba(255,107,44,0.4)'
  }
];
