import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminSettings() {
  const [s, setS] = useState({ pickup_pincode: "400043", store_name: "Covered IT!" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => { api.get("/settings").then((r) => setS({ ...s, ...r.data })); /* eslint-disable-next-line */ }, []);
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    await api.put("/settings", s);
    setMsg("Saved ✓"); setSaving(false);
    setTimeout(() => setMsg(""), 2000);
  };
  return (
    <div data-testid="admin-settings">
      <h1 className="font-display-navy text-4xl chrome-text-navy">Settings</h1>
      <form onSubmit={save} className="admin-card p-6 mt-6 max-w-xl space-y-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek mb-1">Store name</div>
          <input value={s.store_name || ""} onChange={(e) => setS({...s, store_name: e.target.value})} className="form-input" data-testid="setting-store-name" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek mb-1">Pickup pincode (Shiprocket)</div>
          <input value={s.pickup_pincode || ""} onChange={(e) => setS({...s, pickup_pincode: e.target.value})} className="form-input" data-testid="setting-pickup" />
          <p className="text-xs text-slate-500 mt-1">Used by Shiprocket auto-shipment. Default 400043 (Mumbai).</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek mb-1">Contact email</div>
          <input value={s.contact_email || ""} onChange={(e) => setS({...s, contact_email: e.target.value})} className="form-input" data-testid="setting-email" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek mb-1">Instagram</div>
          <input value={s.instagram || ""} onChange={(e) => setS({...s, instagram: e.target.value})} className="form-input" data-testid="setting-instagram" />
        </div>
        <button disabled={saving} className="btn-chrome-navy" data-testid="save-settings-btn">{saving ? "Saving…" : "Save settings"}</button>
        {msg && <span className="ml-3 text-emerald-300 text-sm">{msg}</span>}
      </form>
      <style>{`.form-input{width:100%;padding:10px 12px;border-radius:8px;background:#0e0f12;border:1px solid #24262c;color:#e8e8ed;outline:none}.form-input:focus{border-color:#15a678}`}</style>
    </div>
  );
}
