import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Check, X, Store as StoreIcon, Truck, CreditCard, AlertCircle } from "lucide-react";

function ConnectedBadge({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${ok ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "bg-pink-500/15 text-pink-300 border border-pink-500/30"}`}>
      {ok ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {label}
    </span>
  );
}

export default function AdminSettings() {
  const [s, setS] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState("store");
  const [testing, setTesting] = useState("");

  const load = () => api.get("/settings").then((r) => setS(r.data));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    try { await api.put("/settings", s); setMsg("Saved ✓"); load(); }
    catch (e) { setMsg(e.response?.data?.detail || "Save failed"); }
    finally { setSaving(false); setTimeout(() => setMsg(""), 2400); }
  };

  const testRzp = async () => {
    setTesting("rzp");
    try { await api.post("/integrations/razorpay/test"); setMsg("Razorpay ✓ live keys verified"); }
    catch (e) { setMsg(e.response?.data?.detail || "Razorpay test failed"); }
    finally { setTesting(""); setTimeout(() => setMsg(""), 4000); }
  };
  const testSr = async () => {
    setTesting("sr");
    try { await api.post("/integrations/shiprocket/test"); setMsg("Shiprocket ✓ logged in"); load(); }
    catch (e) { setMsg(e.response?.data?.detail || "Shiprocket test failed"); }
    finally { setTesting(""); setTimeout(() => setMsg(""), 4000); }
  };

  const disconnect = async (which) => {
    if (!window.confirm(`Disconnect ${which}?`)) return;
    await api.post(`/integrations/${which}/disconnect`);
    setMsg(`${which} disconnected`);
    load();
    setTimeout(() => setMsg(""), 2400);
  };

  const tabs = [
    { id: "store",    label: "Store",     I: StoreIcon },
    { id: "shipping", label: "Shipping",  I: Truck },
    { id: "payments", label: "Payments",  I: CreditCard },
  ];

  return (
    <div data-testid="admin-settings">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h1 className="font-display-navy text-4xl chrome-text-navy">Settings</h1>
        <div className="flex gap-2">
          <ConnectedBadge ok={s.razorpay_connected}   label={`Razorpay ${s.razorpay_connected ? "connected" : "not connected"}`} />
          <ConnectedBadge ok={s.shiprocket_connected} label={`Shiprocket ${s.shiprocket_connected ? "connected" : "not connected"}`} />
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-b border-white/5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            data-testid={`settings-tab-${t.id}`}
            className={`flex items-center gap-2 px-4 py-2 text-sm transition-all ${
              tab === t.id ? "border-b-2 border-emerald-400 text-emerald-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <t.I className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={save} className="admin-card p-6 mt-4 max-w-2xl space-y-5">
        {tab === "store" && (
          <>
            <Field label="Store name">
              <input data-testid="setting-store-name" value={s.store_name || ""} onChange={(e) => setS({...s, store_name: e.target.value})} className="form-input" />
            </Field>
            <Field label="Contact email">
              <input data-testid="setting-email" value={s.contact_email || ""} onChange={(e) => setS({...s, contact_email: e.target.value})} className="form-input" />
            </Field>
            <Field label="Instagram handle">
              <input data-testid="setting-instagram" value={s.instagram || ""} onChange={(e) => setS({...s, instagram: e.target.value})} className="form-input" placeholder="@coveredit" />
            </Field>
          </>
        )}

        {tab === "shipping" && (
          <>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <AlertCircle className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <b>Shiprocket auto-shipment.</b> When credentials are set & connection tested, every COD/paid order auto-creates a shipment with AWB & courier. Without credentials, AWBs are mocked as <code>SR{"{order-prefix}"}</code> so the site stays live.
              </div>
            </div>
            <Field label="Pickup pincode" hint="Used as the dispatch location in Shiprocket.">
              <input data-testid="setting-pickup" value={s.pickup_pincode || ""} onChange={(e) => setS({...s, pickup_pincode: e.target.value})} className="form-input" placeholder="400043" />
            </Field>
            <Field label="Shiprocket email">
              <input data-testid="setting-sr-email" value={s.shiprocket_email || ""} onChange={(e) => setS({...s, shiprocket_email: e.target.value})} className="form-input" placeholder="you@example.com" autoComplete="off" />
            </Field>
            <Field label="Shiprocket password" hint="Stored on server only — never returned to the browser after saving.">
              <input data-testid="setting-sr-password" type="password" value={s.shiprocket_password || ""} onChange={(e) => setS({...s, shiprocket_password: e.target.value})} className="form-input" placeholder={s.shiprocket_connected ? "•••••• (saved)" : "Enter password"} autoComplete="new-password" />
            </Field>
            <div className="flex gap-2 flex-wrap">
              <button type="button" disabled={testing==='sr' || !s.shiprocket_connected} onClick={testSr} className="btn-ghost-navy disabled:opacity-50" data-testid="test-sr-btn">
                {testing==='sr' ? "Testing…" : "Test Shiprocket connection"}
              </button>
              {s.shiprocket_connected && (
                <button type="button" onClick={() => disconnect("shiprocket")} className="btn-ghost-navy text-pink-300" data-testid="disconnect-sr-btn">Disconnect</button>
              )}
              <a href="https://app.shiprocket.in/seller/dashboard" target="_blank" rel="noreferrer" className="text-xs self-center text-emerald-300 underline">Shiprocket dashboard ↗</a>
            </div>
          </>
        )}

        {tab === "payments" && (
          <>
            <div className="flex items-start gap-2 text-xs text-slate-400">
              <AlertCircle className="w-4 h-4 mt-0.5 text-emerald-400 shrink-0" />
              <div>
                <b>Razorpay</b> powers UPI, BHIM, PhonePe, Cards & NetBanking on checkout. When keys are not configured, customers can still order via <b>Cash on Delivery</b>. Get keys at <a className="underline text-emerald-300" target="_blank" rel="noreferrer" href="https://dashboard.razorpay.com/app/keys">dashboard.razorpay.com → API Keys</a>.
              </div>
            </div>
            <Field label="Razorpay Key ID" hint="Starts with rzp_test_ or rzp_live_">
              <input data-testid="setting-rzp-key" value={s.razorpay_key_id || ""} onChange={(e) => setS({...s, razorpay_key_id: e.target.value})} className="form-input" placeholder="rzp_test_XXXXXXXXXX" autoComplete="off" />
            </Field>
            <Field label="Razorpay Key Secret" hint="Kept server-side only. Re-enter to update.">
              <input data-testid="setting-rzp-secret" type="password" value={s.razorpay_key_secret || ""} onChange={(e) => setS({...s, razorpay_key_secret: e.target.value})} className="form-input" placeholder={s.razorpay_connected ? "•••••• (saved)" : "Enter secret"} autoComplete="new-password" />
            </Field>
            <Field label="Razorpay Webhook Secret (optional)" hint="If you've set up a webhook on the Razorpay dashboard.">
              <input data-testid="setting-rzp-webhook" type="password" value={s.razorpay_webhook_secret || ""} onChange={(e) => setS({...s, razorpay_webhook_secret: e.target.value})} className="form-input" placeholder={s.razorpay_webhook_secret ? "•••••• (saved)" : ""} autoComplete="new-password" />
            </Field>
            <div className="flex gap-2 flex-wrap">
              <button type="button" disabled={testing==='rzp' || !s.razorpay_connected} onClick={testRzp} className="btn-ghost-navy disabled:opacity-50" data-testid="test-rzp-btn">
                {testing==='rzp' ? "Testing…" : "Test Razorpay connection"}
              </button>
              {s.razorpay_connected && (
                <button type="button" onClick={() => disconnect("razorpay")} className="btn-ghost-navy text-pink-300" data-testid="disconnect-rzp-btn">Disconnect</button>
              )}
              <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" className="text-xs self-center text-emerald-300 underline">Razorpay keys page ↗</a>
            </div>
            <div className="text-xs text-slate-500 border-t border-white/5 pt-3">
              <b>Methods enabled for customers:</b> Cash on Delivery {s.razorpay_connected && "· UPI · BHIM · PhonePe · Cards"}
            </div>
          </>
        )}

        <div className="border-t border-white/5 pt-4 flex items-center gap-3">
          <button disabled={saving} className="btn-chrome-navy" data-testid="save-settings-btn">{saving ? "Saving…" : "Save settings"}</button>
          {msg && <span className="text-emerald-300 text-sm">{msg}</span>}
        </div>
      </form>

      <style>{`.form-input{width:100%;padding:10px 12px;border-radius:8px;background:#0e0f12;border:1px solid #24262c;color:#e8e8ed;outline:none;font-family:"Space Grotesk",monospace}.form-input:focus{border-color:#15a678}`}</style>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek">{label}</div>
      {hint && <div className="text-[11px] text-slate-500 mb-1">{hint}</div>}
      <div className={hint ? "" : "mt-1"}>{children}</div>
    </label>
  );
}
