import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/context/Cart";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Trash2, Tag, Lock, Check } from "lucide-react";

export default function Checkout() {
  const nav = useNavigate();
  const { items, updateQty, setModel, removeItem, subtotal, clear } = useCart();
  const [models, setModels] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [couponMsg, setCouponMsg] = useState("");
  const [addr, setAddr] = useState({
    full_name: "", phone: "", email: "",
    address_line1: "", address_line2: "",
    city: "", state: "", pincode: "", country: "India",
  });
  const [payment, setPayment] = useState("cod");
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  useEffect(() => { api.get("/phone-models").then((r) => setModels(r.data)); }, []);

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const { data } = await api.post("/coupons/apply", { code: coupon.trim(), subtotal });
      setDiscount(data.discount);
      setCouponMsg(`✓ ₹${data.discount} off applied`);
    } catch (e) {
      setDiscount(0);
      setCouponMsg(e.response?.data?.detail || "Invalid code");
    }
  };

  const shipping = subtotal >= 499 ? 0 : 49;
  const total = Math.max(0, subtotal - discount + shipping);

  const place = async (e) => {
    e.preventDefault();
    if (!items.length) return;
    for (const i of items) {
      if (i.category !== "charms" && !i.phone_model) {
        alert("Please select a phone model for every item.");
        return;
      }
    }
    setPlacing(true);
    try {
      const { data } = await api.post("/orders", {
        items, address: addr, coupon_code: coupon || null, payment_method: payment, notes: "",
      });
      setPlaced(data);
      clear();
    } catch (e) {
      alert(e.response?.data?.detail || "Order failed");
    } finally { setPlacing(false); }
  };

  if (placed) {
    const isHer = placed.items.some((i) => i.category === "her" || i.category === "charms");
    return (
      <div className={isHer ? "her-bg her-grain min-h-screen" : "him-bg him-stone min-h-screen text-slate-100"} data-testid="order-success">
        <Nav tone={isHer ? "pink" : "navy"} />
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className={isHer ? "chip-pink mx-auto" : "chip-navy mx-auto inline-flex"}>
            <Check className="w-3 h-3" /> Order #{placed.id.slice(0,8)}
          </div>
          <h1 className={`mt-6 text-7xl md:text-9xl ${isHer ? "font-display-pink chrome-text-pink" : "font-display-navy chrome-text-navy"}`}>
            LOCKED IN! 🔒
          </h1>
          <p className={`mt-4 text-lg ${isHer ? "text-slate-700" : "text-slate-300"} font-bricolage`}>
            Your order is confirmed. We'll text the tracking link to {placed.address.phone}.
          </p>
          <div className={`mt-8 ${isHer ? "card-pink" : "card-navy"} p-6 text-left`}>
            <div className="text-xs uppercase tracking-widest font-mono-sleek opacity-60 mb-2">Tracking</div>
            <div className="font-mono-sleek text-sm">{placed.shipment?.awb || "Pending dispatch"}</div>
            <div className="mt-4 text-xs uppercase tracking-widest font-mono-sleek opacity-60 mb-2">Total Paid</div>
            <div className="font-display-pink text-3xl">₹{placed.total}</div>
          </div>
          <div className="mt-8 flex gap-3 justify-center">
            <button onClick={() => nav(`/track/${placed.id}`)} className={isHer ? "btn-chrome-pink" : "btn-chrome-navy"} data-testid="track-order-btn">Track this order</button>
            <button onClick={() => nav("/")} className={isHer ? "btn-ghost-pink" : "btn-ghost-navy"}>Keep shopping</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" data-testid="checkout-page">
      <Nav tone="pink" />
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 grid lg:grid-cols-[1fr,420px] gap-10">
        <form onSubmit={place} className="space-y-8">
          <section>
            <h2 className="font-display-pink text-3xl chrome-text-pink">Your cart</h2>
            {items.length === 0 && <p className="mt-4 text-slate-500">Empty. Go shop the drop ✿</p>}
            <div className="mt-4 space-y-3">
              {items.map((i) => {
                const key = `${i.product_id}|${i.phone_model || "_none_"}`;
                const needsModel = i.category !== "charms";
                const compat = models.map((m) => m.name);
                return (
                  <div key={key} className="card-pink p-4 flex gap-4 items-center" data-testid={`cart-item-${i.product_id}`}>
                    {i.image ? <img src={i.image} alt="" className="w-20 h-20 rounded-lg object-cover" /> : <div className="w-20 h-20 rounded-lg bg-pink-100" />}
                    <div className="flex-1 min-w-0">
                      <div className="font-bricolage font-semibold">{i.name}</div>
                      <div className="text-xs uppercase tracking-widest text-pink-700 font-mono-sleek">{i.category}</div>
                      {needsModel && (
                        <select
                          data-testid={`cart-model-select-${i.product_id}`}
                          value={i.phone_model || ""}
                          onChange={(e) => setModel(key, e.target.value)}
                          className="mt-2 w-full text-sm px-3 py-2 rounded-md border border-pink-200 bg-white"
                          required
                        >
                          <option value="">— Phone model (required) —</option>
                          {compat.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-display-pink text-xl text-pink-700">₹{i.price * i.qty}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <button type="button" onClick={() => updateQty(key, i.qty - 1)} className="w-7 h-7 rounded-full border border-pink-300">−</button>
                        <span data-testid={`cart-qty-${i.product_id}`} className="w-6 text-center">{i.qty}</span>
                        <button type="button" onClick={() => updateQty(key, i.qty + 1)} className="w-7 h-7 rounded-full border border-pink-300">+</button>
                      </div>
                      <button type="button" onClick={() => removeItem(key)} className="mt-2 text-pink-700 text-xs" data-testid={`cart-remove-${i.product_id}`}><Trash2 className="w-3 h-3 inline" /> remove</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {items.length > 0 && (
            <>
              <section>
                <h2 className="font-display-pink text-3xl chrome-text-pink">Shipping</h2>
                <div className="mt-4 grid md:grid-cols-2 gap-3">
                  <Input label="Full name" v={addr.full_name} onChange={(v)=>setAddr({...addr,full_name:v})} testid="ship-name" required />
                  <Input label="Phone" v={addr.phone} onChange={(v)=>setAddr({...addr,phone:v})} testid="ship-phone" required />
                  <Input label="Email" type="email" v={addr.email} onChange={(v)=>setAddr({...addr,email:v})} testid="ship-email" required />
                  <Input label="Pincode" v={addr.pincode} onChange={(v)=>setAddr({...addr,pincode:v})} testid="ship-pincode" required />
                  <Input label="Address line 1" v={addr.address_line1} onChange={(v)=>setAddr({...addr,address_line1:v})} testid="ship-addr1" required full />
                  <Input label="Address line 2 (optional)" v={addr.address_line2} onChange={(v)=>setAddr({...addr,address_line2:v})} testid="ship-addr2" full />
                  <Input label="City" v={addr.city} onChange={(v)=>setAddr({...addr,city:v})} testid="ship-city" required />
                  <Input label="State" v={addr.state} onChange={(v)=>setAddr({...addr,state:v})} testid="ship-state" required />
                </div>
              </section>

              <section>
                <h2 className="font-display-pink text-3xl chrome-text-pink">Payment</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {["cod","prepaid"].map((m) => (
                    <label key={m} className={`p-4 rounded-lg border-2 cursor-pointer ${payment===m ? "border-pink-500 bg-pink-50" : "border-pink-200"}`}>
                      <input type="radio" name="pay" checked={payment===m} onChange={() => setPayment(m)} className="mr-2" data-testid={`pay-${m}`} />
                      {m === "cod" ? "Cash on Delivery" : "Prepaid (UPI / Cards)"}
                    </label>
                  ))}
                </div>
                {payment === "prepaid" && <p className="text-xs text-slate-500 mt-2">Prepaid mocked for now — pay on delivery to confirm fastest.</p>}
              </section>
            </>
          )}
        </form>

        {/* summary */}
        {items.length > 0 && (
          <aside>
            <div className="card-pink p-6 sticky top-24">
              <h3 className="font-display-pink text-2xl chrome-text-pink">Order summary</h3>
              <div className="mt-4 space-y-2 text-sm">
                <Row k="Subtotal" v={`₹${subtotal}`} />
                <Row k="Shipping" v={shipping === 0 ? "FREE" : `₹${shipping}`} />
                {discount > 0 && <Row k="Discount" v={`− ₹${discount}`} cls="text-pink-700" />}
                <div className="border-t border-pink-200 pt-3 mt-3 flex justify-between font-display-pink text-2xl text-pink-800">
                  <span>Total</span><span data-testid="checkout-total">₹{total}</span>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-xs uppercase tracking-widest font-mono-sleek text-pink-700 flex items-center gap-2"><Tag className="w-3 h-3" /> Coupon</label>
                <div className="mt-2 flex gap-2">
                  <input data-testid="coupon-input" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="MAINCHAR10" className="flex-1 px-3 py-2 rounded-md border border-pink-200" />
                  <button type="button" onClick={applyCoupon} className="btn-ghost-pink" data-testid="apply-coupon-btn">Apply</button>
                </div>
                {couponMsg && <div className="mt-2 text-xs">{couponMsg}</div>}
              </div>

              <button onClick={place} disabled={placing} className="btn-chrome-pink w-full mt-6" data-testid="place-order-btn">
                {placing ? "Placing…" : <><Lock className="w-4 h-4" /> Lock It In · ₹{total}</>}
              </button>
            </div>
          </aside>
        )}
      </div>
      <Footer tone="pink" />
    </div>
  );
}

function Row({ k, v, cls = "" }) {
  return <div className="flex justify-between"><span className="text-slate-500">{k}</span><span className={cls}>{v}</span></div>;
}

function Input({ label, v, onChange, testid, type="text", required, full }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label className="text-xs uppercase tracking-widest text-pink-700 font-mono-sleek">{label}</label>
      <input data-testid={testid} type={type} value={v} required={required} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-md border border-pink-200 outline-none focus:border-pink-500 bg-white" />
    </div>
  );
}
