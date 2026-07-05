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
    aesthetic: Optional[str] = None


class ProductOut(ProductIn):
    id: str
    created_at: str


class PhoneModelIn(BaseModel):
    brand: str
    series: Optional[str] = ""
    name: str


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
    response.set_cookie("access_token", token, httponly=True, samesite="none", secure=True, max_age=60 * 60 * 24 * 7, path="/")
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
    s = await _settings_raw() if "_settings_raw" in globals() else {}
    email = s.get("shiprocket_email")
    password = s.get("shiprocket_password")
    token = s.get("shiprocket_token")
    if not (email and password):
        return {"awb": f"SR{order['id'][:8].upper()}", "courier": "Shiprocket-Mock", "tracking_url": f"/track/{order['id']}", "mocked": True}
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
PINCODE_ZONES = {
    "metro_local":  {"prefix": ("400", "401", "402", "403", "410", "411", "421"), "fee": 39, "name": "Mumbai / MMR"},
    "state":        {"prefix": ("4",), "fee": 59, "name": "Maharashtra"},
    "metro":        {"prefix": ("110", "560", "600", "700", "500", "800", "380", "560"), "fee": 69, "name": "Metro"},
}
DEFAULT_SHIPPING = 89
COD_FEE_DEFAULT = 39
FREE_SHIPPING_THRESHOLD_DEFAULT = 799


def _shipping_for_pincode(pincode: str | None, subtotal: float, free_threshold: int) -> tuple[int, str]:
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
            order
