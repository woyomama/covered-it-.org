"""
Covered IT! v2 — FastAPI Backend
Phone case e-commerce with Her/Him/Collab/Charms sections.
"""
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, EmailStr
from motor.motor_asyncio import AsyncIOMotorClient

# ---------- Config ----------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@coveredit.in").lower()
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "admin123")
JWT_ALG = "HS256"

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="Covered IT! v2 API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
log = logging.getLogger("coveredit")


# ---------- Helpers ----------
def hash_password(p: str) -> str:
    return bcrypt.hashpw(p.encode(), bcrypt.gensalt()).decode()


def verify_password(p: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(p.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str, email: str, minutes: int = 60 * 24 * 7) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=minutes),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user or user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return user


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def clean(doc: dict) -> dict:
    if not doc:
        return doc
    doc.pop("_id", None)
    return doc


# ---------- Models ----------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProductIn(BaseModel):
    name: str
    slug: Optional[str] = None
    description: str = ""
    price: float
    mrp: Optional[float] = None
    category: Literal["her", "him", "collab", "charms"]
    images: List[str] = []
    compatible_models: List[str] = []
    stock: int = 100
    tags: List[str] = []
    featured: bool = False
    aesthetic: Optional[str] = None  # extra tag e.g. "Y2K", "Chrome"


class ProductOut(ProductIn):
    id: str
    created_at: str


class PhoneModelIn(BaseModel):
    brand: str
    series: Optional[str] = ""
    name: str  # e.g. "iPhone 15 Pro"


class PhoneModelOut(PhoneModelIn):
    id: str


class CartItem(BaseModel):
    product_id: str
    name: str
    price: float
    qty: int = 1
    phone_model: str
    image: Optional[str] = ""
    category: Optional[str] = ""


class Address(BaseModel):
    full_name: str
    phone: str
    email: EmailStr
    address_line1: str
    address_line2: Optional[str] = ""
    city: str
    state: str
    pincode: str
    country: str = "India"


class OrderIn(BaseModel):
    items: List[CartItem]
    address: Address
    coupon_code: Optional[str] = None
    payment_method: Literal["cod", "upi", "phonepe", "bhim", "card", "prepaid"] = "cod"
    notes: Optional[str] = ""


class CouponIn(BaseModel):
    code: str
    type: Literal["percentage", "flat"] = "percentage"
    value: float
    min_order: float = 0
    active: bool = True


class CouponApply(BaseModel):
    code: str
    subtotal: float


class ReelIn(BaseModel):
    title: str
    video_url: str
    thumbnail: str
    product_id: Optional[str] = None
    caption: Optional[str] = ""


# =====================================================
#  AUTH
# =====================================================
@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"], user["email"])
    response.set_cookie("access_token", token, httponly=True, samesite="lax", max_age=60 * 60 * 24 * 7, path="/")
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "name": user.get("name"), "role": user["role"]}}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def auth_me(admin=Depends(get_current_admin)):
    return admin


# =====================================================
#  PRODUCTS
# =====================================================
def _slugify(s: str) -> str:
    import re
    s = re.sub(r"[^a-zA-Z0-9]+", "-", s.lower()).strip("-")
    return s or str(uuid.uuid4())[:8]


@api.get("/products")
async def list_products(
    category: Optional[str] = None,
    featured: Optional[bool] = None,
    search: Optional[str] = None,
    model: Optional[str] = None,
    limit: int = 100,
):
    q = {}
    if category:
        q["category"] = category
    if featured is not None:
        q["featured"] = featured
    if model:
        q["compatible_models"] = {"$regex": model, "$options": "i"}
    if search:
        q["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"compatible_models": {"$regex": search, "$options": "i"}},
            {"tags": {"$regex": search, "$options": "i"}},
        ]
    docs = await db.products.find(q, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api.get("/products/{pid}")
async def get_product(pid: str):
    doc = await db.products.find_one({"$or": [{"id": pid}, {"slug": pid}]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    return doc


@api.post("/products")
async def create_product(body: ProductIn, admin=Depends(get_current_admin)):
    pid = str(uuid.uuid4())
    slug = body.slug or _slugify(body.name)
    if await db.products.find_one({"slug": slug}):
        slug = f"{slug}-{pid[:6]}"
    doc = {**body.model_dump(), "id": pid, "slug": slug, "created_at": now_iso()}
    await db.products.insert_one(doc)
    return clean(doc)


@api.put("/products/{pid}")
async def update_product(pid: str, body: ProductIn, admin=Depends(get_current_admin)):
    updates = body.model_dump()
    if not updates.get("slug"):
        updates["slug"] = _slugify(updates["name"])
    res = await db.products.find_one_and_update({"id": pid}, {"$set": updates}, return_document=True)
    if not res:
        raise HTTPException(404, "Not found")
    return clean(res)


@api.delete("/products/{pid}")
async def delete_product(pid: str, admin=Depends(get_current_admin)):
    await db.products.delete_one({"id": pid})
    return {"ok": True}


# =====================================================
#  PHONE MODELS
# =====================================================
@api.get("/phone-models")
async def list_models(search: Optional[str] = None, brand: Optional[str] = None, limit: int = 500):
    q = {}
    if brand:
        q["brand"] = brand
    if search:
        q["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}},
            {"series": {"$regex": search, "$options": "i"}},
        ]
    docs = await db.phone_models.find(q, {"_id": 0}).sort([("brand", 1), ("name", 1)]).to_list(limit)
    return docs


@api.post("/phone-models")
async def create_model(body: PhoneModelIn, admin=Depends(get_current_admin)):
    mid = str(uuid.uuid4())
    doc = {**body.model_dump(), "id": mid}
    await db.phone_models.insert_one(doc)
    return clean(doc)


@api.put("/phone-models/{mid}")
async def update_model(mid: str, body: PhoneModelIn, admin=Depends(get_current_admin)):
    res = await db.phone_models.find_one_and_update({"id": mid}, {"$set": body.model_dump()}, return_document=True)
    if not res:
        raise HTTPException(404, "Not found")
    return clean(res)


@api.delete("/phone-models/{mid}")
async def delete_model(mid: str, admin=Depends(get_current_admin)):
    await db.phone_models.delete_one({"id": mid})
    return {"ok": True}


# =====================================================
#  COUPONS
# =====================================================
@api.get("/coupons")
async def list_coupons(admin=Depends(get_current_admin)):
    return await db.coupons.find({}, {"_id": 0}).to_list(200)


@api.post("/coupons")
async def create_coupon(body: CouponIn, admin=Depends(get_current_admin)):
    cid = str(uuid.uuid4())
    doc = {**body.model_dump(), "id": cid, "code": body.code.upper(), "created_at": now_iso()}
    if await db.coupons.find_one({"code": doc["code"]}):
        raise HTTPException(400, "Coupon code exists")
    await db.coupons.insert_one(doc)
    return clean(doc)


@api.delete("/coupons/{cid}")
async def delete_coupon(cid: str, admin=Depends(get_current_admin)):
    await db.coupons.delete_one({"id": cid})
    return {"ok": True}


@api.post("/coupons/apply")
async def apply_coupon(body: CouponApply):
    coupon = await db.coupons.find_one({"code": body.code.upper(), "active": True}, {"_id": 0})
    if not coupon:
        raise HTTPException(404, "Invalid coupon")
    if body.subtotal < coupon.get("min_order", 0):
        raise HTTPException(400, f"Minimum order ₹{coupon['min_order']} required")
    if coupon["type"] == "percentage":
        discount = round(body.subtotal * (coupon["value"] / 100), 2)
    else:
        discount = float(coupon["value"])
    return {"discount": discount, "coupon": coupon}


# =====================================================
#  ORDERS
# =====================================================
async def _shiprocket_create_shipment(order: dict) -> dict:
    """
    Shiprocket auto-shipment.
    Falls back to mocked AWB when creds are not configured in /admin/settings.
    DO NOT remove the mock path — it's the publish-day fallback.
    """
    s = await _settings_raw() if "_settings_raw" in globals() else {}
    email = s.get("shiprocket_email")
    password = s.get("shiprocket_password")
    token = s.get("shiprocket_token")
    # No creds → mock
    if not (email and password):
        return {"awb": f"SR{order['id'][:8].upper()}", "courier": "Shiprocket-Mock", "tracking_url": f"/track/{order['id']}", "mocked": True}
    # Try real Shiprocket
    try:
        import requests as _rq
        if not token:
            r = _rq.post("https://apiv2.shiprocket.in/v1/external/auth/login",
                         json={"email": email, "password": password}, timeout=15)
            if r.status_code == 200:
                token = r.json().get("token")
                await db.settings.update_one({"id": "store"}, {"$set": {"shiprocket_token": token}})
        if not token:
            return {"awb": f"SR{order['id'][:8].upper()}", "courier": "Shiprocket-Mock-NoToken", "tracking_url": f"/track/{order['id']}", "mocked": True}
        addr = order["address"]
        items = order["items"]
        payload = {
            "order_id": order["id"][:40],
            "order_date": order["created_at"][:10],
            "pickup_location": "Primary",
            "billing_customer_name": addr["full_name"],
            "billing_last_name": "",
            "billing_address": addr["address_line1"],
            "billing_address_2": addr.get("address_line2") or "",
            "billing_city": addr["city"],
            "billing_pincode": addr["pincode"],
            "billing_state": addr["state"],
            "billing_country": addr.get("country") or "India",
            "billing_email": addr["email"],
            "billing_phone": addr["phone"],
            "shipping_is_billing": True,
            "order_items": [{"name": i["name"], "sku": i["product_id"][:24], "units": i["qty"], "selling_price": i["price"]} for i in items],
            "payment_method": "COD" if order["payment_method"] == "cod" else "Prepaid",
            "sub_total": order["subtotal"],
            "length": 12, "breadth": 8, "height": 3, "weight": 0.1,
        }
        r2 = _rq.post(
            "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
            json=payload, headers={"Authorization": f"Bearer {token}"}, timeout=20,
        )
        data = r2.json() if r2.text else {}
        if r2.status_code in (200, 201):
            return {
                "awb": data.get("awb_code") or f"SR{order['id'][:8].upper()}",
                "courier": data.get("courier_name") or "Shiprocket",
                "shipment_id": data.get("shipment_id"),
                "order_id_sr": data.get("order_id"),
                "tracking_url": data.get("tracking_url") or f"/track/{order['id']}",
                "mocked": False,
            }
        log.error(f"Shiprocket create order non-200: {r2.status_code} {r2.text[:300]}")
        return {"awb": f"SR{order['id'][:8].upper()}", "courier": "Shiprocket-Mock-Error", "tracking_url": f"/track/{order['id']}", "mocked": True, "error": r2.text[:200]}
    except Exception as e:
        log.error(f"Shiprocket failed: {e}")
        return {"awb": f"SR{order['id'][:8].upper()}", "courier": "Shiprocket-Mock-Exception", "tracking_url": f"/track/{order['id']}", "mocked": True}


# =====================================================
#  SHIPPING & COD FEE CALCULATOR
# =====================================================
# India pincode zones — first digit decides delivery zone.
# Mumbai pickup (400043) → cheapest for Maharashtra (4xxxxx).
PINCODE_ZONES = {
    "metro_local":  {"prefix": ("400", "401", "402", "403", "410", "411", "421"), "fee": 39, "name": "Mumbai / MMR"},
    "state":        {"prefix": ("4",), "fee": 59, "name": "Maharashtra"},
    "metro":        {"prefix": ("110", "560", "600", "700", "500", "800", "380", "560"), "fee": 69, "name": "Metro"},
}
DEFAULT_SHIPPING = 89  # rest of India
COD_FEE_DEFAULT = 39
FREE_SHIPPING_THRESHOLD_DEFAULT = 799


def _shipping_for_pincode(pincode: str | None, subtotal: float, free_threshold: int) -> tuple[int, str]:
    """Returns (fee, zone_name)."""
    if subtotal >= free_threshold:
        return 0, "Free"
    if not pincode:
        return DEFAULT_SHIPPING, "Standard"
    pin = str(pincode).strip()
    for z in PINCODE_ZONES.values():
        if pin.startswith(z["prefix"]):
            return z["fee"], z["name"]
    return DEFAULT_SHIPPING, "Rest of India"


async def _compute_quote(items: list, pincode: str | None, payment_method: str, coupon_code: str | None) -> dict:
    s = await _settings_raw()
    cod_fee_amt = int(s.get("cod_fee", COD_FEE_DEFAULT))
    free_thr = int(s.get("free_shipping_threshold", FREE_SHIPPING_THRESHOLD_DEFAULT))
    subtotal = round(sum(float(i["price"]) * int(i["qty"]) for i in items), 2)
    discount = 0.0
    coupon_used = None
    if coupon_code:
        c = await db.coupons.find_one({"code": coupon_code.upper(), "active": True}, {"_id": 0})
        if c and subtotal >= c.get("min_order", 0):
            discount = round(subtotal * (c["value"] / 100), 2) if c["type"] == "percentage" else float(c["value"])
            coupon_used = coupon_code.upper()
    shipping, zone = _shipping_for_pincode(pincode, subtotal, free_thr)
    cod_fee = cod_fee_amt if payment_method == "cod" else 0
    total = round(max(0, subtotal - discount) + shipping + cod_fee, 2)
    return {
        "subtotal": subtotal,
        "discount": discount,
        "coupon_code": coupon_used,
        "shipping": shipping,
        "shipping_zone": zone,
        "free_shipping_threshold": free_thr,
        "cod_fee": cod_fee,
        "total": total,
    }


class QuoteIn(BaseModel):
    items: List[CartItem]
    pincode: Optional[str] = None
    payment_method: Literal["cod", "upi", "phonepe", "bhim", "card", "prepaid"] = "cod"
    coupon_code: Optional[str] = None


@api.post("/checkout/quote")
async def checkout_quote(body: QuoteIn):
    return await _compute_quote([i.model_dump() for i in body.items], body.pincode, body.payment_method, body.coupon_code)


@api.post("/orders")
async def create_order(body: OrderIn):
    items_d = [i.model_dump() for i in body.items]
    q = await _compute_quote(items_d, body.address.pincode, body.payment_method, body.coupon_code)
    oid = str(uuid.uuid4())
    order = {
        "id": oid,
        "items": items_d,
        "address": body.address.model_dump(),
        "subtotal": q["subtotal"],
        "discount": q["discount"],
        "shipping": q["shipping"],
        "shipping_zone": q["shipping_zone"],
        "cod_fee": q["cod_fee"],
        "total": q["total"],
        "coupon_code": q["coupon_code"],
        "payment_method": body.payment_method,
        "payment_status": "pending" if body.payment_method != "cod" else "cod",
        "notes": body.notes,
        "status": "pending",
        "shipment": None,
        "created_at": now_iso(),
    }
    if body.payment_method == "cod":
        try:
            ship = await _shiprocket_create_shipment(order)
            order["shipment"] = ship
            order["status"] = "confirmed"
        except Exception as e:
            log.error(f"shiprocket failed: {e}")
    await db.orders.insert_one(order)
    return clean(order)


@api.get("/orders/{oid}")
async def get_order(oid: str):
    doc = await db.orders.find_one({"id": oid}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Not found")
    return doc


@api.get("/orders")
async def list_orders(admin=Depends(get_current_admin), limit: int = 200):
    return await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)


@api.put("/orders/{oid}/status")
async def update_order_status(oid: str, status: str = Query(...), admin=Depends(get_current_admin)):
    res = await db.orders.find_one_and_update({"id": oid}, {"$set": {"status": status}}, return_document=True)
    if not res:
        raise HTTPException(404, "Not found")
    return clean(res)


# =====================================================
#  REELS
# =====================================================
@api.get("/reels")
async def list_reels(limit: int = 50):
    return await db.reels.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)


@api.post("/reels")
async def create_reel(body: ReelIn, admin=Depends(get_current_admin)):
    rid = str(uuid.uuid4())
    doc = {**body.model_dump(), "id": rid, "created_at": now_iso()}
    await db.reels.insert_one(doc)
    return clean(doc)


@api.delete("/reels/{rid}")
async def delete_reel(rid: str, admin=Depends(get_current_admin)):
    await db.reels.delete_one({"id": rid})
    return {"ok": True}


# =====================================================
#  ANALYTICS
# =====================================================
@api.get("/analytics/summary")
async def analytics_summary(admin=Depends(get_current_admin)):
    total_orders = await db.orders.count_documents({})
    total_products = await db.products.count_documents({})
    revenue_pipeline = await db.orders.aggregate([{"$group": {"_id": None, "total": {"$sum": "$total"}}}]).to_list(1)
    revenue = revenue_pipeline[0]["total"] if revenue_pipeline else 0
    pending = await db.orders.count_documents({"status": "pending"})
    confirmed = await db.orders.count_documents({"status": "confirmed"})
    by_cat = {}
    async for d in db.products.aggregate([{"$group": {"_id": "$category", "n": {"$sum": 1}}}]):
        by_cat[d["_id"]] = d["n"]
    customers = len(set([o["address"]["email"] async for o in db.orders.find({}, {"address.email": 1})]))
    recent = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "total_orders": total_orders,
        "total_products": total_products,
        "revenue": revenue,
        "pending": pending,
        "confirmed": confirmed,
        "by_category": by_cat,
        "customers": customers,
        "recent_orders": recent,
    }


@api.get("/customers")
async def list_customers(admin=Depends(get_current_admin)):
    pipeline = [
        {"$group": {
            "_id": "$address.email",
            "name": {"$first": "$address.full_name"},
            "phone": {"$first": "$address.phone"},
            "orders": {"$sum": 1},
            "spend": {"$sum": "$total"},
            "last_order": {"$max": "$created_at"},
        }},
        {"$sort": {"spend": -1}},
    ]
    out = []
    async for d in db.orders.aggregate(pipeline):
        d["email"] = d.pop("_id")
        out.append(d)
    return out


# =====================================================
#  WEBHOOKS  (DO NOT MODIFY)
# =====================================================
@api.post("/webhooks/shiprocket")
async def shiprocket_webhook(payload: dict):
    awb = payload.get("awb")
    status = payload.get("current_status") or payload.get("status")
    order_id = payload.get("order_id")
    if order_id:
        await db.orders.update_one({"id": order_id}, {"$set": {"shipment.status": status, "shipment.awb": awb}})
    return {"received": True}


# =====================================================
#  SETTINGS / META  (with secret-safe responses)
# =====================================================
_SECRET_KEYS = {"razorpay_key_secret", "razorpay_webhook_secret", "shiprocket_password"}

def _mask_settings(s: dict) -> dict:
    out = dict(s or {})
    for k in _SECRET_KEYS:
        if out.get(k):
            out[k] = "•" * 6 + str(out[k])[-4:]
    # also flag which integrations are connected
    out["razorpay_connected"] = bool((s or {}).get("razorpay_key_id") and (s or {}).get("razorpay_key_secret"))
    out["shiprocket_connected"] = bool((s or {}).get("shiprocket_email") and (s or {}).get("shiprocket_password"))
    return out


async def _settings_raw() -> dict:
    return await db.settings.find_one({"id": "store"}, {"_id": 0}) or {}


@api.get("/settings")
async def get_settings():
    s = await _settings_raw()
    base = {
        "id": "store",
        "pickup_pincode": os.environ.get("PICKUP_PINCODE", "400043"),
        "store_name": "Covered IT!",
    }
    return _mask_settings({**base, **s})


@api.put("/settings")
async def update_settings(body: dict, admin=Depends(get_current_admin)):
    body.pop("id", None)
    # only persist non-empty fields so masked placeholders don't overwrite secrets
    updates = {k: v for k, v in body.items() if v not in ("", None) and not (isinstance(v, str) and v.startswith("••••••"))}
    updates["id"] = "store"
    await db.settings.update_one({"id": "store"}, {"$set": updates}, upsert=True)
    s = await _settings_raw()
    return _mask_settings(s)


@api.get("/payments/methods")
async def payment_methods():
    """Public — tells the checkout which payment options to show."""
    s = await _settings_raw()
    rzp = bool(s.get("razorpay_key_id") and s.get("razorpay_key_secret"))
    methods = [{"id": "cod", "label": "Cash on Delivery", "enabled": True}]
    methods.append({"id": "upi",     "label": "UPI",      "enabled": rzp, "provider": "razorpay"})
    methods.append({"id": "phonepe", "label": "PhonePe",  "enabled": rzp, "provider": "razorpay"})
    methods.append({"id": "bhim",    "label": "BHIM",     "enabled": rzp, "provider": "razorpay"})
    methods.append({"id": "card",    "label": "Card",     "enabled": rzp, "provider": "razorpay"})
    return {"methods": methods, "razorpay_key_id": s.get("razorpay_key_id") if rzp else None}


# =====================================================
#  PAYMENTS — Razorpay
# =====================================================
import razorpay as _razorpay
import hmac as _hmac
import hashlib as _hashlib


async def _rzp_client():
    s = await _settings_raw()
    kid = s.get("razorpay_key_id")
    sec = s.get("razorpay_key_secret")
    if not kid or not sec:
        raise HTTPException(400, "Razorpay not configured. Connect it in /admin/settings.")
    return _razorpay.Client(auth=(kid, sec)), kid, sec


class RzpOrderIn(BaseModel):
    amount: float  # in INR (we convert to paise)
    order_id: str  # our internal order id


@api.post("/payments/razorpay/order")
async def create_razorpay_order(body: RzpOrderIn):
    client_rzp, kid, _ = await _rzp_client()
    paise = int(round(body.amount * 100))
    rzp_order = client_rzp.order.create({
        "amount": paise,
        "currency": "INR",
        "receipt": body.order_id[:40],
        "payment_capture": 1,
    })
    await db.orders.update_one(
        {"id": body.order_id},
        {"$set": {"razorpay.order_id": rzp_order["id"], "razorpay.amount": paise, "razorpay.status": "created"}},
    )
    return {"key_id": kid, "order_id": rzp_order["id"], "amount": paise, "currency": "INR"}


class RzpVerifyIn(BaseModel):
    order_id: str  # our internal order id
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@api.post("/payments/razorpay/verify")
async def verify_razorpay(body: RzpVerifyIn):
    _, _, secret = await _rzp_client()
    expected = _hmac.new(
        secret.encode(),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
        _hashlib.sha256,
    ).hexdigest()
    if not _hmac.compare_digest(expected, body.razorpay_signature):
        raise HTTPException(400, "Invalid Razorpay signature")
    await db.orders.update_one(
        {"id": body.order_id},
        {"$set": {
            "payment_status": "paid",
            "status": "confirmed",
            "razorpay.payment_id": body.razorpay_payment_id,
            "razorpay.signature": body.razorpay_signature,
            "razorpay.status": "paid",
        }},
    )
    # Trigger shipment now that we've been paid
    order = await db.orders.find_one({"id": body.order_id}, {"_id": 0})
    if order and not order.get("shipment"):
        try:
            ship = await _shiprocket_create_shipment(order)
            await db.orders.update_one({"id": body.order_id}, {"$set": {"shipment": ship}})
            order["shipment"] = ship
        except Exception as e:
            log.error(f"shiprocket post-payment failed: {e}")
    return {"ok": True, "order": order}


# =====================================================
#  INTEGRATION TESTS (admin click-to-test)
# =====================================================
@api.post("/integrations/razorpay/disconnect")
async def disconnect_razorpay(admin=Depends(get_current_admin)):
    await db.settings.update_one({"id": "store"}, {"$unset": {"razorpay_key_id": "", "razorpay_key_secret": "", "razorpay_webhook_secret": ""}})
    return {"ok": True}


@api.post("/integrations/shiprocket/disconnect")
async def disconnect_shiprocket(admin=Depends(get_current_admin)):
    await db.settings.update_one({"id": "store"}, {"$unset": {"shiprocket_email": "", "shiprocket_password": "", "shiprocket_token": ""}})
    return {"ok": True}


@api.post("/integrations/razorpay/test")
async def test_razorpay(admin=Depends(get_current_admin)):
    try:
        client_rzp, _, _ = await _rzp_client()
        # create a tiny test order
        t = client_rzp.order.create({"amount": 100, "currency": "INR", "receipt": "ci-test"})
        return {"ok": True, "test_order_id": t.get("id")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Razorpay test failed: {e}")


@api.post("/integrations/shiprocket/test")
async def test_shiprocket(admin=Depends(get_current_admin)):
    s = await _settings_raw()
    email = s.get("shiprocket_email")
    password = s.get("shiprocket_password")
    if not email or not password:
        raise HTTPException(400, "Shiprocket not configured")
    try:
        import requests
        r = requests.post(
            "https://apiv2.shiprocket.in/v1/external/auth/login",
            json={"email": email, "password": password}, timeout=15,
        )
        if r.status_code != 200:
            raise HTTPException(400, f"Shiprocket auth failed: {r.text[:200]}")
        token = r.json().get("token")
        await db.settings.update_one({"id": "store"}, {"$set": {"shiprocket_token": token}})
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Shiprocket test failed: {e}")


# =====================================================
#  STARTUP / SEED
# =====================================================
PHONE_MODELS_SEED = [
    # Apple
    ("Apple", "iPhone", "iPhone 13"), ("Apple", "iPhone", "iPhone 13 Mini"),
    ("Apple", "iPhone", "iPhone 13 Pro"), ("Apple", "iPhone", "iPhone 13 Pro Max"),
    ("Apple", "iPhone", "iPhone 14"), ("Apple", "iPhone", "iPhone 14 Plus"),
    ("Apple", "iPhone", "iPhone 14 Pro"), ("Apple", "iPhone", "iPhone 14 Pro Max"),
    ("Apple", "iPhone", "iPhone 15"), ("Apple", "iPhone", "iPhone 15 Plus"),
    ("Apple", "iPhone", "iPhone 15 Pro"), ("Apple", "iPhone", "iPhone 15 Pro Max"),
    ("Apple", "iPhone", "iPhone 16"), ("Apple", "iPhone", "iPhone 16 Plus"),
    ("Apple", "iPhone", "iPhone 16 Pro"), ("Apple", "iPhone", "iPhone 16 Pro Max"),
    # Samsung S series
    ("Samsung", "Galaxy S", "Galaxy S21"), ("Samsung", "Galaxy S", "Galaxy S21+"),
    ("Samsung", "Galaxy S", "Galaxy S21 Ultra"),
    ("Samsung", "Galaxy S", "Galaxy S22"), ("Samsung", "Galaxy S", "Galaxy S22+"),
    ("Samsung", "Galaxy S", "Galaxy S22 Ultra"),
    ("Samsung", "Galaxy S", "Galaxy S23"), ("Samsung", "Galaxy S", "Galaxy S23+"),
    ("Samsung", "Galaxy S", "Galaxy S23 Ultra"), ("Samsung", "Galaxy S", "Galaxy S23 FE"),
    ("Samsung", "Galaxy S", "Galaxy S24"), ("Samsung", "Galaxy S", "Galaxy S24+"),
    ("Samsung", "Galaxy S", "Galaxy S24 Ultra"),
    # Samsung Note
    ("Samsung", "Galaxy Note", "Galaxy Note 20"), ("Samsung", "Galaxy Note", "Galaxy Note 20 Ultra"),
    # Samsung A
    ("Samsung", "Galaxy A", "Galaxy A14"), ("Samsung", "Galaxy A", "Galaxy A24"),
    ("Samsung", "Galaxy A", "Galaxy A34"), ("Samsung", "Galaxy A", "Galaxy A54"),
    ("Samsung", "Galaxy A", "Galaxy A55"), ("Samsung", "Galaxy A", "Galaxy A05s"),
    # OnePlus
    ("OnePlus", "Number Series", "OnePlus 9"), ("OnePlus", "Number Series", "OnePlus 9 Pro"),
    ("OnePlus", "Number Series", "OnePlus 10 Pro"), ("OnePlus", "Number Series", "OnePlus 10R"),
    ("OnePlus", "Number Series", "OnePlus 11"), ("OnePlus", "Number Series", "OnePlus 11R"),
    ("OnePlus", "Number Series", "OnePlus 12"), ("OnePlus", "Number Series", "OnePlus 12R"),
    ("OnePlus", "Number Series", "OnePlus 13"), ("OnePlus", "Nord", "OnePlus Nord 3"),
    ("OnePlus", "Nord", "OnePlus Nord CE 3"), ("OnePlus", "Nord", "OnePlus Nord CE 4"),
    # Oppo
    ("Oppo", "A Series", "Oppo A5s"), ("Oppo", "A Series", "Oppo A17"),
    ("Oppo", "A Series", "Oppo A57"), ("Oppo", "A Series", "Oppo A78"),
    ("Oppo", "Reno", "Oppo Reno 8"), ("Oppo", "Reno", "Oppo Reno 10"),
    ("Oppo", "Reno", "Oppo Reno 11"), ("Oppo", "Reno", "Oppo Reno 12"),
    ("Oppo", "F Series", "Oppo F21 Pro"), ("Oppo", "F Series", "Oppo F23"), ("Oppo", "F Series", "Oppo F25"),
    # Vivo
    ("Vivo", "Y Series", "Vivo Y20"), ("Vivo", "Y Series", "Vivo Y22"),
    ("Vivo", "Y Series", "Vivo Y100"), ("Vivo", "V Series", "Vivo V25"),
    ("Vivo", "V Series", "Vivo V27"), ("Vivo", "V Series", "Vivo V29"),
    ("Vivo", "V Series", "Vivo V30"), ("Vivo", "X Series", "Vivo X80"),
    ("Vivo", "X Series", "Vivo X90"), ("Vivo", "X Series", "Vivo X100"),
    # Realme
    ("Realme", "C Series", "Realme C33"), ("Realme", "C Series", "Realme C53"),
    ("Realme", "C Series", "Realme C55"), ("Realme", "Narzo", "Realme Narzo 60"),
    ("Realme", "Narzo", "Realme Narzo N55"), ("Realme", "GT", "Realme GT Neo 3"),
    ("Realme", "GT", "Realme GT 6"),
    # Xiaomi / Redmi
    ("Xiaomi", "Redmi Note", "Redmi Note 11"), ("Xiaomi", "Redmi Note", "Redmi Note 12"),
    ("Xiaomi", "Redmi Note", "Redmi Note 12 Pro"), ("Xiaomi", "Redmi Note", "Redmi Note 13"),
    ("Xiaomi", "Redmi Note", "Redmi Note 13 Pro"), ("Xiaomi", "Redmi K", "Redmi K50"),
    ("Xiaomi", "Redmi K", "Redmi K60"), ("Xiaomi", "Mi", "Xiaomi 13"),
    ("Xiaomi", "Mi", "Xiaomi 14"),
    # Nothing
    ("Nothing", "Phone", "Nothing Phone 1"), ("Nothing", "Phone", "Nothing Phone 2"),
    ("Nothing", "Phone", "Nothing Phone 2a"), ("Nothing", "Phone", "Nothing Phone 3"),
]


PRODUCTS_SEED_HER = [
    {
        "name": "Pink Chrome Melt Case",
        "price": 599, "mrp": 899,
        "description": "Drippy chrome melt finish in baby pink. Glossy, mirror-like, Y2K-coded.",
        "images": [
            "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=900",
            "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=900",
        ],
        "tags": ["chrome", "y2k", "liquid-metal", "pink"],
        "aesthetic": "Pink Chrome",
        "featured": True,
    },
    {
        "name": "Liquid Lily Mirror Case",
        "price": 549, "mrp": 799,
        "description": "White lilies floating in chrome silver. Mirror-back finish.",
        "images": [
            "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=900",
            "https://images.unsplash.com/photo-1604671801908-6f0c6a092c05?w=900",
        ],
        "tags": ["chrome", "lily", "mirror", "pink"],
        "aesthetic": "Y2K Lily",
        "featured": True,
    },
    {
        "name": "Satin Heart Ribbon Case",
        "price": 499, "mrp": 699,
        "description": "Satin pink with embedded heart charms and ribbon detailing.",
        "images": [
            "https://images.unsplash.com/photo-1601593346740-925612772716?w=900",
            "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=900",
        ],
        "tags": ["satin", "heart", "ribbon", "pink"],
        "aesthetic": "Satin Pink",
        "featured": False,
    },
    {
        "name": "Star Girl Holo Case",
        "price": 649, "mrp": 899,
        "description": "Holographic stars across a sugar-pink chrome backdrop.",
        "images": [
            "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=900",
            "https://images.unsplash.com/photo-1565378435245-ec3a47c10ddf?w=900",
        ],
        "tags": ["holo", "stars", "y2k", "pink"],
        "aesthetic": "Holo Star",
        "featured": True,
    },
]

PRODUCTS_SEED_HIM = [
    {
        "name": "Midnight Liquid Metal Case",
        "price": 649, "mrp": 899,
        "description": "Liquid metal swirls on midnight navy. Tactile, weighty, dangerous.",
        "images": [
            "https://images.unsplash.com/photo-1592286927505-1def25115558?w=900",
            "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=900",
        ],
        "tags": ["liquid-metal", "navy", "midnight"],
        "aesthetic": "Liquid Metal",
        "featured": True,
    },
    {
        "name": "Cracked Stone Navy Case",
        "price": 599, "mrp": 799,
        "description": "Hand-finished cracked stone texture over navy base. No two are identical.",
        "images": [
            "https://images.unsplash.com/photo-1567113463224-da257e7e2c9a?w=900",
            "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=900",
        ],
        "tags": ["stone", "navy", "texture"],
        "aesthetic": "Cracked Stone",
        "featured": True,
    },
    {
        "name": "Emerald Edge Navy Case",
        "price": 699, "mrp": 999,
        "description": "Midnight navy with emerald (#15A678) liquid accents along the edge.",
        "images": [
            "https://images.unsplash.com/photo-1556656793-08538906a9f8?w=900",
            "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=900",
        ],
        "tags": ["emerald", "navy", "premium"],
        "aesthetic": "Midnight",
        "featured": False,
    },
    {
        "name": "Steel Grain Stealth Case",
        "price": 749, "mrp": 1099,
        "description": "Brushed steel grain with subtle navy underglow. Stealth premium.",
        "images": [
            "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=900",
            "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=900",
        ],
        "tags": ["steel", "premium", "stealth"],
        "aesthetic": "Steel",
        "featured": True,
    },
]

PRODUCTS_SEED_COLLAB = [
    {
        "name": "Split Soul Case — Pink x Navy",
        "price": 799, "mrp": 1099,
        "description": "Half pink chrome, half midnight navy. The collab piece for the in-between.",
        "images": [
            "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=900",
            "https://images.unsplash.com/photo-1592286927505-1def25115558?w=900",
        ],
        "tags": ["collab", "split", "unisex"],
        "aesthetic": "Split Soul",
        "featured": True,
    },
    {
        "name": "Duality Mirror Case",
        "price": 749, "mrp": 999,
        "description": "Mirror finish with pink and navy melting into each other.",
        "images": [
            "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=900",
            "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=900",
        ],
        "tags": ["collab", "mirror", "unisex"],
        "aesthetic": "Duality",
        "featured": True,
    },
]

PRODUCTS_SEED_CHARMS = [
    {
        "name": "Crystal Heart Phone Charm",
        "price": 249, "mrp": 399,
        "description": "Faceted crystal heart with chrome chain. Clips onto any case loop.",
        "images": [
            "https://images.unsplash.com/photo-1601593346740-925612772716?w=900",
            "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=900",
        ],
        "tags": ["charm", "heart", "crystal"],
        "aesthetic": "Crystal",
        "featured": True,
    },
    {
        "name": "Pink Ribbon Bow Charm",
        "price": 199, "mrp": 299,
        "description": "Satin pink bow with chrome ring. Coquette-coded.",
        "images": [
            "https://images.unsplash.com/photo-1601593346740-925612772716?w=900",
            "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=900",
        ],
        "tags": ["charm", "bow", "ribbon"],
        "aesthetic": "Bow",
        "featured": True,
    },
    {
        "name": "Y2K Holo Star Charm",
        "price": 299, "mrp": 449,
        "description": "Iridescent holographic star pendant. Catches every light.",
        "images": [
            "https://images.unsplash.com/photo-1574944985070-8f3ebc6b79d2?w=900",
            "https://images.unsplash.com/photo-1565378435245-ec3a47c10ddf?w=900",
        ],
        "tags": ["charm", "star", "holo", "y2k"],
        "aesthetic": "Holo Star",
        "featured": False,
    },
    {
        "name": "Chrome Butterfly Charm",
        "price": 349, "mrp": 499,
        "description": "Liquid-chrome butterfly with bead detail.",
        "images": [
            "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=900",
            "https://images.unsplash.com/photo-1592890288564-76628a30a657?w=900",
        ],
        "tags": ["charm", "butterfly", "chrome"],
        "aesthetic": "Chrome",
        "featured": True,
    },
    {
        "name": "Glass Lily Charm",
        "price": 399, "mrp": 549,
        "description": "Hand-finished glass lily with chrome cap and satin tassel.",
        "images": [
            "https://images.unsplash.com/photo-1567113463300-102a7eb3cb26?w=900",
            "https://images.unsplash.com/photo-1601593346740-925612772716?w=900",
        ],
        "tags": ["charm", "lily", "glass"],
        "aesthetic": "Glass",
        "featured": False,
    },
    {
        "name": "Pearl Drip Charm",
        "price": 459, "mrp": 599,
        "description": "Cascading pearls on a chrome chain. Boudoir-core.",
        "images": [
            "https://images.unsplash.com/photo-1601593346740-925612772716?w=900",
            "https://images.unsplash.com/photo-1567721913486-6585f069b332?w=900",
        ],
        "tags": ["charm", "pearl", "drip"],
        "aesthetic": "Pearl",
        "featured": True,
    },
]


async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": "Admin",
            "role": "admin",
            "created_at": now_iso(),
        })
        log.info(f"Seeded admin: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}})
        log.info("Admin password reset to .env value")


async def seed_phone_models():
    if await db.phone_models.count_documents({}) > 0:
        return
    docs = [{"id": str(uuid.uuid4()), "brand": b, "series": s, "name": n} for (b, s, n) in PHONE_MODELS_SEED]
    if docs:
        await db.phone_models.insert_many(docs)
        log.info(f"Seeded {len(docs)} phone models")


async def seed_products():
    if await db.products.count_documents({}) > 0:
        return
    # popular default models for case compatibility
    popular = [
        "iPhone 13", "iPhone 14", "iPhone 14 Pro", "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Pro",
        "Galaxy S23", "Galaxy S24", "Galaxy S24 Ultra", "Galaxy A54", "Galaxy A55",
        "OnePlus 11", "OnePlus 12", "OnePlus Nord 3",
        "Oppo Reno 11", "Oppo F25", "Oppo A78",
        "Vivo V29", "Vivo V30", "Vivo Y100",
        "Realme Narzo 60", "Realme C55",
        "Redmi Note 13 Pro", "Redmi Note 13", "Xiaomi 14",
        "Nothing Phone 2", "Nothing Phone 2a",
    ]
    seed_blocks = [
        ("her", PRODUCTS_SEED_HER),
        ("him", PRODUCTS_SEED_HIM),
        ("collab", PRODUCTS_SEED_COLLAB),
        ("charms", PRODUCTS_SEED_CHARMS),
    ]
    docs = []
    for cat, items in seed_blocks:
        for p in items:
            pid = str(uuid.uuid4())
            slug = _slugify(p["name"])
            compat = popular if cat != "charms" else []  # charms attach to any case
            docs.append({
                **p,
                "id": pid,
                "slug": slug,
                "category": cat,
                "stock": 100,
                "compatible_models": compat,
                "created_at": now_iso(),
            })
    if docs:
        await db.products.insert_many(docs)
        log.info(f"Seeded {len(docs)} products")


async def seed_coupons():
    for c in [
        {"code": "MAINCHAR10", "type": "percentage", "value": 10, "min_order": 499, "active": True},
        {"code": "LOCKEDIN20", "type": "percentage", "value": 20, "min_order": 999, "active": True},
    ]:
        if not await db.coupons.find_one({"code": c["code"]}):
            await db.coupons.insert_one({**c, "id": str(uuid.uuid4()), "created_at": now_iso()})


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.products.create_index("slug", unique=True)
    await db.products.create_index("category")
    await db.phone_models.create_index([("brand", 1), ("name", 1)])
    await db.coupons.create_index("code", unique=True)
    await db.orders.create_index("created_at")
    await seed_admin()
    await seed_phone_models()
    await seed_products()
    await seed_coupons()
    log.info("Covered IT! v2 ready 🔒")


@app.on_event("shutdown")
async def shutdown():
    client.close()


@api.get("/")
async def root():
    return {"app": "Covered IT! v2", "status": "locked in"}


# Include router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
