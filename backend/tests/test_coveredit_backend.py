"""
Covered IT! v2 Backend API Tests
Tests cover: Auth, Products, Phone Models, Coupons, Orders, Analytics, Webhooks
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@coveredit.in"
ADMIN_PASSWORD = "admin123"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(client):
    r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "token" in data
    assert data["user"]["role"] == "admin"
    return data["token"]


@pytest.fixture
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}


# ==================== AUTH ====================
class TestAuth:
    def test_login_success(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert "token" in d and isinstance(d["token"], str) and len(d["token"]) > 10
        assert d["user"]["email"] == ADMIN_EMAIL
        assert d["user"]["role"] == "admin"
        # cookie set
        assert "access_token" in r.cookies

    def test_login_wrong_password(self, client):
        r = client.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_login_unknown_user(self, client):
        r = client.post(f"{API}/auth/login", json={"email": "nobody@x.com", "password": "x"})
        assert r.status_code == 401

    def test_auth_me_bearer(self, client, admin_token):
        r = client.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
        assert r.status_code == 200
        d = r.json()
        assert d["email"] == ADMIN_EMAIL
        assert d["role"] == "admin"

    def test_auth_me_no_token(self, client):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ==================== PRODUCTS ====================
class TestProducts:
    def test_list_all_products(self, client):
        r = client.get(f"{API}/products")
        assert r.status_code == 200
        products = r.json()
        assert isinstance(products, list)
        # Expect 16 seeded: 4 her + 4 him + 2 collab + 6 charms
        assert len(products) >= 16, f"Expected >=16 products, got {len(products)}"

    def test_filter_by_category_her(self, client):
        r = client.get(f"{API}/products", params={"category": "her"})
        assert r.status_code == 200
        products = r.json()
        assert len(products) >= 4
        for p in products:
            assert p["category"] == "her"

    def test_filter_by_category_him(self, client):
        r = client.get(f"{API}/products", params={"category": "him"})
        assert r.status_code == 200
        assert all(p["category"] == "him" for p in r.json())
        assert len(r.json()) >= 4

    def test_filter_by_category_collab(self, client):
        r = client.get(f"{API}/products", params={"category": "collab"})
        assert r.status_code == 200
        assert len(r.json()) >= 2
        assert all(p["category"] == "collab" for p in r.json())

    def test_filter_by_category_charms(self, client):
        r = client.get(f"{API}/products", params={"category": "charms"})
        assert r.status_code == 200
        assert len(r.json()) >= 6
        assert all(p["category"] == "charms" for p in r.json())

    def test_filter_by_phone_model(self, client):
        r = client.get(f"{API}/products", params={"model": "iPhone 15"})
        assert r.status_code == 200
        products = r.json()
        assert len(products) > 0
        for p in products:
            # check any compatible_model contains 'iPhone 15'
            assert any("iPhone 15" in m for m in p.get("compatible_models", []))

    def test_search_oppo(self, client):
        r = client.get(f"{API}/products", params={"search": "Oppo"})
        assert r.status_code == 200
        products = r.json()
        assert len(products) > 0
        for p in products:
            joined = " ".join([p.get("name", ""), p.get("description", "")] + p.get("compatible_models", []) + p.get("tags", []))
            assert "oppo" in joined.lower()

    def test_get_product_by_id(self, client):
        all_p = client.get(f"{API}/products").json()
        pid = all_p[0]["id"]
        r = client.get(f"{API}/products/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_create_product_requires_auth(self):
        r = requests.post(f"{API}/products", json={"name": "X", "price": 100, "category": "her"})
        assert r.status_code == 401

    def test_create_and_delete_product(self, client, auth_headers):
        payload = {
            "name": "TEST_Pytest Case",
            "price": 199,
            "category": "her",
            "description": "test",
            "images": [],
            "compatible_models": ["iPhone 15"],
            "tags": ["test"],
        }
        r = client.post(f"{API}/products", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        created = r.json()
        assert created["name"] == "TEST_Pytest Case"
        assert created["price"] == 199
        assert "id" in created and "slug" in created
        pid = created["id"]
        # verify GET
        g = client.get(f"{API}/products/{pid}")
        assert g.status_code == 200
        assert g.json()["name"] == "TEST_Pytest Case"
        # delete
        d = client.delete(f"{API}/products/{pid}", headers=auth_headers)
        assert d.status_code == 200
        # verify gone
        g2 = client.get(f"{API}/products/{pid}")
        assert g2.status_code == 404


# ==================== PHONE MODELS ====================
class TestPhoneModels:
    def test_list_phone_models(self, client):
        r = client.get(f"{API}/phone-models")
        assert r.status_code == 200
        models = r.json()
        assert len(models) >= 70, f"Expected ~80 models, got {len(models)}"
        brands = set(m["brand"] for m in models)
        expected = {"Apple", "Samsung", "OnePlus", "Oppo", "Vivo", "Realme", "Xiaomi", "Nothing"}
        assert expected.issubset(brands), f"Missing brands: {expected - brands}"

    def test_search_phone_models(self, client):
        r = client.get(f"{API}/phone-models", params={"search": "iPhone"})
        assert r.status_code == 200
        models = r.json()
        assert len(models) > 0
        assert all("iphone" in (m["name"] + m["brand"]).lower() for m in models)

    def test_filter_by_brand(self, client):
        r = client.get(f"{API}/phone-models", params={"brand": "Samsung"})
        assert r.status_code == 200
        models = r.json()
        assert len(models) > 0
        assert all(m["brand"] == "Samsung" for m in models)

    def test_create_phone_model_requires_auth(self):
        r = requests.post(f"{API}/phone-models", json={"brand": "X", "name": "Y"})
        assert r.status_code == 401

    def test_create_update_delete_model(self, client, auth_headers):
        r = client.post(f"{API}/phone-models", json={"brand": "TEST_Brand", "series": "T", "name": "TEST_Model_1"}, headers=auth_headers)
        assert r.status_code == 200
        mid = r.json()["id"]
        # update
        u = client.put(f"{API}/phone-models/{mid}", json={"brand": "TEST_Brand", "series": "T", "name": "TEST_Model_Updated"}, headers=auth_headers)
        assert u.status_code == 200
        assert u.json()["name"] == "TEST_Model_Updated"
        # delete
        d = client.delete(f"{API}/phone-models/{mid}", headers=auth_headers)
        assert d.status_code == 200


# ==================== COUPONS ====================
class TestCoupons:
    def test_apply_mainchar10_valid(self, client):
        r = client.post(f"{API}/coupons/apply", json={"code": "MAINCHAR10", "subtotal": 600})
        assert r.status_code == 200
        d = r.json()
        assert d["discount"] == 60.0

    def test_apply_mainchar10_lowercase_works(self, client):
        r = client.post(f"{API}/coupons/apply", json={"code": "mainchar10", "subtotal": 600})
        assert r.status_code == 200
        assert r.json()["discount"] == 60.0

    def test_apply_mainchar10_below_minimum(self, client):
        r = client.post(f"{API}/coupons/apply", json={"code": "MAINCHAR10", "subtotal": 400})
        assert r.status_code == 400

    def test_apply_invalid_coupon(self, client):
        r = client.post(f"{API}/coupons/apply", json={"code": "NONEXISTENT", "subtotal": 1000})
        assert r.status_code == 404

    def test_apply_lockedin20(self, client):
        r = client.post(f"{API}/coupons/apply", json={"code": "LOCKEDIN20", "subtotal": 1000})
        assert r.status_code == 200
        assert r.json()["discount"] == 200.0

    def test_list_coupons_requires_auth(self):
        assert requests.get(f"{API}/coupons").status_code == 401

    def test_list_coupons_admin(self, client, auth_headers):
        r = client.get(f"{API}/coupons", headers=auth_headers)
        assert r.status_code == 200
        codes = [c["code"] for c in r.json()]
        assert "MAINCHAR10" in codes and "LOCKEDIN20" in codes


# ==================== ORDERS ====================
@pytest.fixture(scope="session")
def sample_order_payload(client):
    products = client.get(f"{API}/products", params={"category": "her"}).json()
    p = products[0]
    return {
        "items": [{
            "product_id": p["id"],
            "name": p["name"],
            "price": p["price"],
            "qty": 1,
            "phone_model": "iPhone 15",
            "image": p["images"][0] if p.get("images") else "",
            "category": "her",
        }],
        "address": {
            "full_name": "TEST_User",
            "phone": "9999999999",
            "email": "test_pytest@coveredit.in",
            "address_line1": "1 Test Lane",
            "city": "Mumbai",
            "state": "MH",
            "pincode": "400001",
        },
        "coupon_code": "MAINCHAR10",
        "payment_method": "cod",
    }


class TestOrders:
    def test_create_order_with_coupon_and_shipping(self, client, sample_order_payload):
        r = client.post(f"{API}/orders", json=sample_order_payload)
        assert r.status_code == 200, r.text
        order = r.json()
        subtotal = sample_order_payload["items"][0]["price"]
        assert order["subtotal"] == subtotal
        # MAINCHAR10 = 10% (if subtotal >= 499)
        if subtotal >= 499:
            assert order["discount"] == round(subtotal * 0.1, 2)
            assert order["shipping"] == 0
        assert order["status"] == "confirmed"
        assert order["shipment"] is not None
        assert order["shipment"]["awb"].startswith("SR")
        assert "id" in order
        # store id for next test
        pytest.shared_order_id = order["id"]

    def test_get_order_by_id(self, client):
        oid = getattr(pytest, "shared_order_id", None)
        assert oid, "previous test should have set order id"
        r = client.get(f"{API}/orders/{oid}")
        assert r.status_code == 200
        assert r.json()["id"] == oid

    def test_get_nonexistent_order(self, client):
        r = client.get(f"{API}/orders/nonexistent-id-xyz")
        assert r.status_code == 404

    def test_list_orders_requires_auth(self):
        assert requests.get(f"{API}/orders").status_code == 401

    def test_list_orders_admin(self, client, auth_headers):
        r = client.get(f"{API}/orders", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)
        assert len(r.json()) >= 1

    def test_order_low_subtotal_has_shipping(self, client):
        # Create a charm-only order below 499
        charms = client.get(f"{API}/products", params={"category": "charms"}).json()
        cheap = min(charms, key=lambda x: x["price"])
        payload = {
            "items": [{
                "product_id": cheap["id"], "name": cheap["name"], "price": cheap["price"],
                "qty": 1, "phone_model": "", "image": "", "category": "charms"
            }],
            "address": {
                "full_name": "TEST_Low", "phone": "9999999999", "email": "test_low@coveredit.in",
                "address_line1": "1 Lane", "city": "Mumbai", "state": "MH", "pincode": "400001"
            },
            "payment_method": "cod",
        }
        r = client.post(f"{API}/orders", json=payload)
        assert r.status_code == 200
        order = r.json()
        if order["subtotal"] < 499:
            assert order["shipping"] == 49
            assert order["total"] == order["subtotal"] + 49

    def test_update_order_status(self, client, auth_headers):
        oid = getattr(pytest, "shared_order_id", None)
        assert oid
        r = client.put(f"{API}/orders/{oid}/status", params={"status": "shipped"}, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "shipped"


# ==================== ANALYTICS / CUSTOMERS ====================
class TestAnalytics:
    def test_summary_requires_auth(self):
        assert requests.get(f"{API}/analytics/summary").status_code == 401

    def test_summary(self, client, auth_headers):
        r = client.get(f"{API}/analytics/summary", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        for k in ["total_orders", "total_products", "revenue", "by_category", "customers"]:
            assert k in d
        assert d["total_products"] >= 16
        assert "her" in d["by_category"]

    def test_customers(self, client, auth_headers):
        r = client.get(f"{API}/customers", headers=auth_headers)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ==================== WEBHOOKS ====================
class TestWebhooks:
    def test_shiprocket_webhook(self, client, sample_order_payload):
        # create a fresh order in this test class so it works under xdist loadscope
        create = client.post(f"{API}/orders", json=sample_order_payload)
        assert create.status_code == 200
        oid = create.json()["id"]
        r = client.post(f"{API}/webhooks/shiprocket", json={
            "order_id": oid, "awb": "SRTESTAWB", "current_status": "in_transit"
        })
        assert r.status_code == 200
        assert r.json().get("received") is True
        # verify update
        g = client.get(f"{API}/orders/{oid}").json()
        assert g["shipment"]["status"] == "in_transit"
        assert g["shipment"]["awb"] == "SRTESTAWB"


# ==================== SETTINGS / REELS ====================
class TestSettingsReels:
    def test_get_settings(self, client):
        r = client.get(f"{API}/settings")
        assert r.status_code == 200
        assert "pickup_pincode" in r.json()

    def test_list_reels(self, client):
        r = client.get(f"{API}/reels")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_reel_requires_auth(self):
        r = requests.post(f"{API}/reels", json={"title": "x", "video_url": "x", "thumbnail": "x"})
        assert r.status_code == 401
