import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { Lock, Package, Truck, Check } from "lucide-react";

export default function Track() {
  const { id: paramId } = useParams();
  const nav = useNavigate();
  const [id, setId] = useState(paramId || "");
  const [order, setOrder] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => { if (paramId) load(paramId); }, [paramId]);

  const load = async (oid) => {
    setErr(""); setOrder(null);
    try {
      const { data } = await api.get(`/orders/${oid}`);
      setOrder(data);
    } catch { setErr("Order not found"); }
  };

  const steps = ["pending", "confirmed", "shipped", "delivered"];
  const stepIdx = order ? Math.max(0, steps.indexOf(order.status)) : 0;

  return (
    <div className="min-h-screen bg-white" data-testid="track-page">
      <Nav tone="pink" />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="chip-pink mb-3"><Lock className="w-3 h-3" /> Track</div>
        <h1 className="font-display-pink text-5xl chrome-text-pink">Where's my drop?</h1>

        <form onSubmit={(e) => { e.preventDefault(); if (id) nav(`/track/${id}`); }} className="mt-6 flex gap-2">
          <input data-testid="track-input" value={id} onChange={(e)=>setId(e.target.value)} placeholder="Order ID (e.g. e6f1a2…)" className="flex-1 px-4 py-3 rounded-full border border-pink-200" />
          <button className="btn-chrome-pink" data-testid="track-search-btn">Find</button>
        </form>

        {err && <div className="mt-6 text-pink-700">{err}</div>}

        {order && (
          <div className="card-pink p-6 mt-8">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs uppercase tracking-widest font-mono-sleek text-pink-700">Order #{order.id.slice(0,8)}</div>
                <div className="font-display-pink text-3xl chrome-text-pink">{order.address.full_name}</div>
              </div>
              <div className="font-display-pink text-3xl text-pink-700">₹{order.total}</div>
            </div>

            <div className="mt-6 grid grid-cols-4 gap-2">
              {[{l:"Placed",I:Check},{l:"Locked In",I:Lock},{l:"Shipped",I:Truck},{l:"Delivered",I:Package}].map((s,i)=>(
                <div key={s.l} className={`text-center p-3 rounded-lg border ${i<=stepIdx?'bg-pink-100 border-pink-300':'bg-white border-pink-100 opacity-50'}`}>
                  <s.I className="w-5 h-5 mx-auto text-pink-700" />
                  <div className="text-xs uppercase tracking-widest font-mono-sleek mt-1">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              {order.items.map((it,i)=>(
                <div key={i} className="flex gap-3 items-center p-3 bg-white rounded-lg">
                  {it.image ? <img src={it.image} className="w-14 h-14 rounded object-cover" alt="" /> : <div className="w-14 h-14 rounded bg-pink-100" />}
                  <div className="flex-1">
                    <div className="font-bricolage font-semibold">{it.name}</div>
                    <div className="text-xs text-slate-500">{it.phone_model || "—"} · qty {it.qty}</div>
                  </div>
                  <div className="text-pink-700">₹{it.price * it.qty}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer tone="pink" />
    </div>
  );
}
