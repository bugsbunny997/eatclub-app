# 🍔 EatClub — Food Ordering App

A full-featured food ordering web application with **customer ordering** and **admin CRM** workflows. Built with pure HTML, CSS, and JavaScript — no framework or build step required.

## 🚀 Live Demo
**[Open the App](https://YOUR_USERNAME.github.io/eatclub-app)**

## ✨ Features

### Customer Flow
- Browse two featured brands (Burger House 🍔 & Pizza Palace 🍕)
- View categorised menus with prices and descriptions
- Add items to cart with quantity controls
- Checkout with delivery details and payment selection
- Real-time order tracking timeline
- Rotating promotional ad banners

### Admin CRM
- Live incoming orders list
- Accept → Kitchen timer → Food Ready → Dispatch → Delivered workflow
- 10-minute countdown timer after order acceptance
- Call Customer / Call Delivery actions
- Full order lifecycle management

## 🔑 Test Credentials

| Role | Email | Password |
|---|---|---|
| Customer | `customer@test.com` | `password` |
| Admin | `admin@test.com` | `password` |

## 📁 Project Structure

```
eatclub-app/
├── index.html       # App shell
├── style.css        # Design system (dark mode, animations)
├── data.js          # Brand & menu dummy data
├── state.js         # Auth, cart, orders, navigation
├── components.js    # Navbar, login modal, cart drawer
├── pages.js         # All page renderers
└── app.js           # Router + event delegation
```

## 🖥 Usage

Just open `index.html` in any browser — no server or build step needed!
