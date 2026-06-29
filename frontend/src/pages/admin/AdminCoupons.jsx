import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Trash2, Plus } from "lucide-react";

export default function AdminCoupons() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ code: "", type: "percentage", value: 10, min_order: 0, active: true });
  const load = () => api.get("/coupons").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const create = async (e) => {
    e.preventDefault();
    await api.post("/coupons", { ...form, value: Number(form.value), min_order: Number(form.min_order) });
    setForm({ code: "", type: "percentage", value: 10, min_order: 0, active: true });
    load();
  };
  const del = async (id) => { await api.delete(`/coupons/${id}`); load(); };
  return (
    <div data-testid="admin-coupons">
      <h1 className="font-display-navy text-4xl chrome-text-navy">Coupons</h1>
      <form onSubmit={create} className="admin-card p-4 mt-6 grid md:grid-cols-5 gap-3 items-end">
        <Inp label="Code"><input data-testid="coupon-code" value={form.code} onChange={(e)=>setForm({...form,code:e.target.value.toUpperCase()})} className="form-input" required /></Inp>
        <Inp label="Type">
          <select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} className="form-input">
            <option value="percentage">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
        </Inp>
        <Inp label="Value"><input data-testid="coupon-value" type="number" value={form.value} onChange={(e)=>setForm({...form,value:e.target.value})} className="form-input" required /></Inp>
        <Inp label="Min order (₹)"><input data-testid="coupon-min" type="number" value={form.min_order} onChange={(e)=>setForm({...form,min_order:e.target.value})} className="form-input" /></Inp>
        <button className="btn-chrome-navy h-fit" data-testid="add-coupon-btn"><Plus className="w-3 h-3" /> Add</button>
      </form>

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((c) => (
          <div key={c.id} className="admin-card p-4 flex justify-between items-start" data-testid={`coupon-${c.code}`}>
            <div>
              <div className="font-display-navy text-2xl chrome-text-navy">{c.code}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-mono-sleek mt-1">{c.type === "percentage" ? `${c.value}%` : `₹${c.value}`} off · min ₹{c.min_order}</div>
            </div>
            <button onClick={() => del(c.id)} className="text-pink-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      <style>{`.form-input{width:100%;padding:8px 10px;border-radius:6px;background:#0e0f12;border:1px solid #24262c;color:#e8e8ed;outline:none}.form-input:focus{border-color:#15a678}`}</style>
    </div>
  );
}
function Inp({ label, children }) {
  return <label className="block"><div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek mb-1">{label}</div>{children}</label>;
}
