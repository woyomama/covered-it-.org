import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Package, ShoppingCart, IndianRupee, Users, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [s, setS] = useState(null);
  useEffect(() => { api.get("/analytics/summary").then((r) => setS(r.data)); }, []);
  if (!s) return <div>Loading…</div>;

  const cards = [
    { l: "Revenue",  v: `₹${s.revenue}`,       I: IndianRupee },
    { l: "Orders",   v: s.total_orders,        I: ShoppingCart },
    { l: "Products", v: s.total_products,      I: Package },
    { l: "Customers",v: s.customers,           I: Users },
    { l: "Pending",  v: s.pending,             I: TrendingUp },
    { l: "Locked In",v: s.confirmed,           I: TrendingUp },
  ];

  return (
    <div data-testid="admin-dashboard">
      <h1 className="font-display-navy text-4xl chrome-text-navy">Dashboard</h1>
      <p className="text-sm text-slate-400 mt-1 font-mono-sleek uppercase tracking-widest">Real-time store metrics</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.l} className="admin-card p-5">
            <c.I className="w-5 h-5 text-emerald-400" />
            <div className="mt-3 text-xs uppercase tracking-widest text-slate-400 font-mono-sleek" style={{ fontVariantLigatures: 'none', fontFeatureSettings: '"liga" 0, "dlig" 0, "clig" 0, "calt" 0' }}>{c.l}</div>
            <div className="text-3xl font-display-navy chrome-text-navy mt-1">{c.v}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 admin-card p-6">
        <h2 className="font-display-navy text-2xl">Recent orders</h2>
        <div className="mt-4 space-y-2">
          {(s.recent_orders || []).map((o) => (
            <div key={o.id} className="flex items-center justify-between border-t border-white/5 py-2 text-sm">
              <div className="font-mono-sleek text-slate-300">#{o.id.slice(0,8)}</div>
              <div>{o.address.full_name}</div>
              <div className="text-slate-400">{o.items.length} items</div>
              <div className="text-emerald-400">₹{o.total}</div>
              <div className="chip-navy">{o.status}</div>
            </div>
          ))}
          {!s.recent_orders?.length && <div className="text-slate-500 text-sm">No orders yet.</div>}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(s.by_category || {}).map(([k,v]) => (
          <div key={k} className="admin-card p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">{k}</div>
            <div className="text-2xl font-display-navy text-emerald-300">{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
