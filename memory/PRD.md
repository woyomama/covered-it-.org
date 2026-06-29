# Covered IT! v2 — PRD

## Original Problem Statement
Phone case e-commerce site (Covered IT! v2). Four sections — Her (pink chrome Y2K with animated flip-phone), Him (midnight navy / liquid metal / cracked stone), Collab (split aesthetic), Charms (chrome + glass + bow). Multi-phone-model compatibility per product, search-by-model, mandatory phone-model picker at checkout, coupons, Shiprocket auto-shipment (stub), full admin panel. Publish today.

## Tech Stack
- Backend: FastAPI + Motor (MongoDB) + JWT + bcrypt
- Frontend: React 19 + react-router-dom v7 + Tailwind CSS + Axios + lucide-react
- Display fonts: Boska, Clash Display, Editorial New, Bricolage Grotesque, Space Grotesk

## Architecture
- Backend single file: `/app/backend/server.py` (~900 lines) — auto-seeds admin, 80+ phone models, 16 products, 2 coupons on startup
- Frontend pages: `/app/frontend/src/pages/*` + `/app/frontend/src/pages/admin/*`
- Contexts: `Auth` (localStorage `ci_token` + Bearer + httpOnly cookie), `Cart` (localStorage `ci_cart_v1`)
- API base: `${REACT_APP_BACKEND_URL}/api`

## User Personas
1. **Gen-Z customer (Her)** — wants Y2K chrome aesthetic, charms, fast checkout
2. **Gen-Z customer (Him)** — wants midnight navy, no logos, premium feel
3. **Founder/Admin** — needs clear product CRUD, phone model picker, order tracking

## Core Requirements (Static)
- 4 sections: /her /him /collab /charms with distinct moodboards
- Phone model database, used in product compatibility & search
- Mandatory model picker per cart item at checkout (non-charm)
- Order success copy "LOCKED IN! 🔒"
- Coupons: MAINCHAR10 (10%, min 499), LOCKEDIN20 (20%, min 999)
- Shiprocket auto-shipment stub (DO NOT MODIFY)
- Pickup pincode 400043
- Admin: admin@coveredit.in / admin123

## Implemented (Jan 2026)
✅ Backend: auth, products CRUD, phone-models CRUD, coupons CRUD, orders, customers, analytics, reels, webhooks, settings
✅ Frontend public: Landing, Her (with animated flip-phone viewfinder), Him, Collab, Charms, Product page, Search, Checkout, Track, Login
✅ Frontend admin: Dashboard, Products (step-by-step form with multi-model picker), Orders, Customers, Coupons, Reels, Phone Models (~80 seeded), Settings
✅ Mandatory phone-model picker per cart item
✅ Coupons apply at checkout
✅ Order success page shows "LOCKED IN! 🔒"
✅ Shiprocket auto-shipment stub creates AWB on order placement
✅ Brand voice: "He's that guy. *period.*" for Him, "Her era is iconic" for Her
✅ Fixed FI ligature rendering bug (renamed Confirmed → Locked In)
✅ 41/41 backend pytest tests passing, frontend e2e verified

## Backlog (P1/P2)
- [ ] Real Stripe/Razorpay prepaid integration (currently mocked)
- [ ] Real Shiprocket OAuth + auto-shipment API (currently stub returning SR-prefix AWB)
- [ ] Image upload to S3/Cloudinary in admin form (currently URL paste)
- [ ] Reels playback page for customers (/reels)
- [ ] Wishlist / favourites
- [ ] Customer accounts + order history by email
- [ ] Rate limiting on /api/orders + /api/auth/login
- [ ] Email/SMS notifications for order confirmation
- [ ] Inventory deduction on order place
- [ ] Refund/exchange flow

## Next Tasks
1. Hook real Shiprocket API once user provides credentials
2. Wire Razorpay for prepaid orders
3. Real image upload via Cloudinary or S3
