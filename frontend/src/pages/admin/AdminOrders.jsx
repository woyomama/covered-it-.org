import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => { api.get("/orders").then((r) => setOrders(r.data)); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status?status=${status}`);
    setOrders((o) => o.map((x) => x.id === id ? { ...x, status } : x));
  };

  return (
    <div data-testid="admin-orders">
      <h1 className="font-display-navy text-4xl chrome-text-navy">Orders</h1>
      <p className="text-sm text-slate-400 mt-1 font-mono-sleek uppercase tracking-widest">{orders.length} total</p>

      <div className="mt-6 space-y-3">
        {orders.map((o) => (
          <div key={o.id} className="admin-card p-5" data-testid={`order-row-${o.id}`}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek">#{o.id.slice(0,8)}</div>
                <div className="font-semibold mt-1">{o.address.full_name}</div>
                <div className="text-xs text-slate-400">{o.address.email} · {o.address.phone}</div>
                <div className="text-xs text-slate-400">{o.address.city}, {o.address.state} {o.address.pincode}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-display-navy text-emerald-300">₹{o.total}</div>
                <div className="text-xs text-slate-400">{o.payment_method.toUpperCase()}</div>
                <select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)} data-testid={`order-status-${o.id}`} className="mt-2 px-3 py-1 rounded bg-black/40 border border-white/10 text-xs">
                  {["pending","confirmed","shipped","delivered","cancelled"].map((s)=><option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-3 border-t border-white/5 pt-3 grid md:grid-cols-2 gap-2 text-sm">
              {o.items.map((i, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  {i.image ? <img src={i.image} className="w-10 h-10 rounded object-cover" alt="" /> : <div className="w-10 h-10 rounded bg-white/5" />}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{i.name}</div>
                    <div className="text-xs text-slate-400">{i.phone_model || "—"} · qty {i.qty}</div>
                  </div>
                  <div className="text-emerald-300">₹{i.price * i.qty}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {!orders.length && <div className="text-slate-500">No orders yet.</div>}
      </div>
    </div>
  );
}
