# Covered IT! v2 — PRD

## Original Problem Statement
Phone case e-commerce: Her (pink chrome Y2K), Him (midnight navy), Collab, Charms. Multi-phone-model compat per product, search by model, mandatory phone-model picker at checkout. Coupons MAINCHAR10/LOCKEDIN20. Shiprocket auto-shipment + admin panel. Publish today.

## Tech Stack
FastAPI + Motor (MongoDB) + JWT/bcrypt · React 19 + react-router-dom v7 + Tailwind + Axios + Razorpay Checkout (lazy-loaded) · Display fonts Boska, Clash Display, Editorial New, Bricolage Grotesque, Space Grotesk

## Architecture
- Backend: `/app/backend/server.py` (~1100 lines) — auto-seeds admin, 80+ phone models, 16 products, 2 coupons
- Frontend: `src/pages/*` + `src/pages/admin/*` + `src/components/*` + contexts (Auth, Cart)
- API base: `${REACT_APP_BACKEND_URL}/api`

## What's implemented (Jan 2026)
✅ Auth (JWT bearer + httpOnly cookie, idempotent admin seed)
✅ Products CRUD with multi-model compatibility array & step-by-step admin form
✅ Phone Models CRUD (~80 seeded: Apple/Samsung/OnePlus/Oppo/Vivo/Realme/Xiaomi/Nothing)
✅ Coupons (MAINCHAR10 10% min ₹499, LOCKEDIN20 20% min ₹999)
✅ Orders + tracking page (4-step progress: Placed → Locked In → Shipped → Delivered)
✅ Customers aggregation + analytics
✅ Reels CRUD
✅ Search by phone model / brand / tag
✅ All 4 customer sections live: /her (animated Y2K flip-phone viewfinder), /him (midnight navy with stone texture + "He's that guy. *period.*"), /collab (split aesthetic), /charms (6 sellable charms ₹199-459)
✅ Mandatory phone-model picker per cart item
✅ Success screen "LOCKED IN! 🔒"
✅ **Zone-based shipping** (Mumbai ₹39, Maharashtra ₹59, Metros ₹69, Rest ₹89, FREE above ₹799)
✅ **COD handling fee ₹39** auto-added when COD selected
✅ **Live quote endpoint** — re-prices as pincode/payment/coupon changes
✅ "Add ₹X more for FREE shipping" hint on checkout
✅ Admin Settings — 3 tabs (Store, Shipping, Payments) with connection badges
✅ Razorpay integration scaffolded — UPI/BHIM/PhonePe/Card all flow through Razorpay popup once keys are pasted (server-side HMAC signature verify)
✅ Shiprocket integration scaffolded — real-API call when creds configured, mock AWB fallback otherwise
✅ Test/Disconnect buttons for both integrations
✅ Editable shipping config (free_shipping_threshold, cod_fee) in admin
✅ 41/41 backend tests passing on initial e2e suite

## Mocked / pending real creds
- 🟡 Razorpay: scaffold ready, customer needs to paste Key ID + Key Secret in /admin/settings → Payments → test → live
- 🟡 Shiprocket: scaffold ready, customer needs to paste email/password in /admin/settings → Shipping → test → live. Falls back to `SR{order-prefix}` mock AWB if not configured.

## Default settings
- Pickup pincode: 400043 (Mumbai)
- COD fee: ₹39
- Free shipping threshold: ₹799
- Admin: admin@coveredit.in / admin123

## Backlog (P1/P2)
- OTP verify phone before COD (reduces RTO 40-60%)
- "Complete the look" charm upsell on product page
- Real image upload (Cloudinary)
- Email/SMS notifications
- Customer accounts + order history by email
- Inventory deduction on order
- Refund/exchange flow
- Webhook signature verify for Razorpay webhooks
- /reels playback page for customers

## Next Tasks
1. User pastes Razorpay test keys → verify UPI checkout end-to-end
2. User completes Shiprocket KYC + adds "Primary" pickup → verify real AWB
3. Switch Razorpay to live mode after 1-2 test orders
