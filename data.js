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
  },
  {
    id: 'sushi-station',
    name: 'Sushi Station',
    tagline: 'Freshness from the sea, crafted with love.',
    emoji: '🍣',
    bg: 'linear-gradient(135deg, #001a1a 0%, #003333 50%, #000d0d 100%)',
    accentColor: '#00d4aa',
    tags: ['Sushi', 'Rolls', 'Drinks'],
    rating: '4.7',
    deliveryTime: '30-40 min',
    deliveryFee: '₹49',
    minOrder: '₹249',
    categories: ['Sushi', 'Rolls', 'Drinks'],
    menu: [
      { id: 'ss1', name: 'Salmon Nigiri', category: 'Sushi', price: 299, emoji: '🍣', desc: 'Fresh Atlantic salmon over hand-pressed seasoned sushi rice.' },
      { id: 'ss2', name: 'Tuna Nigiri', category: 'Sushi', price: 329, emoji: '🐟', desc: 'Premium bluefin tuna slice on perfectly shaped rice.' },
      { id: 'ss3', name: 'Dragon Roll', category: 'Rolls', price: 449, emoji: '🐉', desc: 'Shrimp tempura, avocado, cucumber topped with ripe avocado slices.' },
      { id: 'ss4', name: 'Rainbow Roll', category: 'Rolls', price: 499, emoji: '🌈', desc: 'California roll crowned with assorted sashimi and tobiko.' },
      { id: 'ss5', name: 'Spicy Tuna Roll', category: 'Rolls', price: 399, emoji: '🌶️', desc: 'Tuna tataki with spicy sriracha mayo, cucumber and sesame.' },
      { id: 'ss6', name: 'Edamame', category: 'Sushi', price: 119, emoji: '🫛', desc: 'Steamed salted edamame pods — light, healthy, addictive.' },
      { id: 'ss7', name: 'Miso Soup', category: 'Drinks', price: 89, emoji: '🍜', desc: 'Traditional Japanese miso soup with tofu and wakame seaweed.' },
      { id: 'ss8', name: 'Matcha Latte', category: 'Drinks', price: 149, emoji: '🍵', desc: 'Ceremonial grade matcha with creamy steamed oat milk.' },
    ]
  },
  {
    id: 'chaat-corner',
    name: 'Chaat Corner',
    tagline: 'Street flavours that feel like home.',
    emoji: '🥘',
    bg: 'linear-gradient(135deg, #1a0a00 0%, #4d2a00 50%, #0d0500 100%)',
    accentColor: '#ffaa00',
    tags: ['Chaat', 'Snacks', 'Drinks'],
    rating: '4.6',
    deliveryTime: '15-25 min',
    deliveryFee: '₹19',
    minOrder: '₹99',
    categories: ['Chaat', 'Snacks', 'Drinks'],
    menu: [
      { id: 'cc1', name: 'Pani Puri (6 pcs)', category: 'Chaat', price: 89, emoji: '🫙', desc: 'Crispy hollow puris with tangy tamarind water and spiced potato filling.' },
      { id: 'cc2', name: 'Sev Puri', category: 'Chaat', price: 99, emoji: '🥙', desc: 'Flat puris topped with potatoes, pomegranate, mint & tamarind chutneys and sev.' },
      { id: 'cc3', name: 'Dahi Puri', category: 'Chaat', price: 109, emoji: '🍶', desc: 'Puris filled with cool yogurt, sweet tamarind, mint chutneys and crispy sev.' },
      { id: 'cc4', name: 'Bhel Puri', category: 'Chaat', price: 99, emoji: '🌾', desc: 'Puffed rice tossed with veggies, tamarind, and spice chutneys.' },
      { id: 'cc5', name: 'Aloo Tikki', category: 'Snacks', price: 119, emoji: '🥔', desc: 'Golden-crispy spiced potato patties with chutneys and chilled yogurt.' },
      { id: 'cc6', name: 'Samosa (2 pcs)', category: 'Snacks', price: 79, emoji: '🫓', desc: 'Flaky golden pastry stuffed with spiced potatoes, peas and herbs.' },
      { id: 'cc7', name: 'Masala Chai', category: 'Drinks', price: 49, emoji: '☕', desc: 'Bold Indian spiced tea with ginger, cardamom and condensed milk.' },
      { id: 'cc8', name: 'Aam Panna', category: 'Drinks', price: 69, emoji: '🥭', desc: 'Refreshing chilled raw mango drink with mint, cumin and black salt.' },
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
