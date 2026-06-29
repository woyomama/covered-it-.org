import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/Auth";
import { Lock } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@coveredit.in");
  const [password, setPassword] = useState("admin123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      await login(email, password);
      nav("/admin");
    } catch (ex) {
      setErr(ex.response?.data?.detail || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-[#0e0f12] text-slate-100" data-testid="login-page">
      <form onSubmit={submit} className="w-full max-w-md p-8 rounded-2xl bg-[#16181d] border border-[#24262c]">
        <div className="chip-navy inline-flex"><Lock className="w-3 h-3" /> Admin</div>
        <h1 className="font-display-navy text-4xl chrome-text-navy mt-4">Locked-in HQ</h1>
        <p className="text-sm text-slate-400 mt-2">Sign in to manage Covered IT!</p>

        <label className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek block mt-6">Email</label>
        <input data-testid="login-email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-md bg-black/40 border border-white/10" />

        <label className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek block mt-4">Password</label>
        <input data-testid="login-password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full mt-1 px-4 py-3 rounded-md bg-black/40 border border-white/10" />

        {err && <div data-testid="login-error" className="mt-3 text-pink-400 text-sm">{err}</div>}

        <button disabled={loading} className="btn-chrome-navy w-full mt-6" data-testid="login-submit">{loading ? "Signing in…" : "Lock in"}</button>
      </form>
    </div>
  );
}
