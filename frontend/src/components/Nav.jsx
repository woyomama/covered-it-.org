import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "@/context/Cart";
import { useState, useEffect } from "react";
import { Search, ShoppingBag, Heart, Lock } from "lucide-react";

export default function Nav({ tone = "pink" }) {
  const loc = useLocation();
  const nav = useNavigate();
  const { count } = useCart();
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", on);
    return () => window.removeEventListener("scroll", on);
  }, []);

  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) nav(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  const isNavy = tone === "navy";
  const isCollab = tone === "collab";

  const wrap = isNavy
    ? `${scrolled ? "glass-navy" : "bg-transparent"} text-slate-100`
    : isCollab
    ? "glass-pink text-slate-900"
    : `${scrolled ? "glass-pink" : "bg-transparent"} text-slate-900`;

  return (
    <header className={`sticky top-0 z-50 transition-all ${wrap}`} data-testid="main-nav">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-4 flex items-center gap-6">
        <Link to="/" data-testid="brand-link" className={`shrink-0 flex items-center gap-2 font-display-pink text-2xl ${isNavy ? "chrome-text-navy" : "chrome-text-pink"}`}>
          <Lock className="w-5 h-5" /> Covered IT!
        </Link>

        <nav className="hidden md:flex items-center gap-1 font-mono-sleek text-sm uppercase tracking-wider">
          <NavItem to="/her"    label="Her"     active={loc.pathname==='/her'}    tone={tone} testid="nav-her" />
          <NavItem to="/him"    label="Him"     active={loc.pathname==='/him'}    tone={tone} testid="nav-him" />
          <NavItem to="/collab" label="Collab"  active={loc.pathname==='/collab'} tone={tone} testid="nav-collab" />
          <NavItem to="/charms" label="Charms"  active={loc.pathname==='/charms'} tone={tone} testid="nav-charms" />
        </nav>

        <form onSubmit={submit} className="flex-1 max-w-md ml-auto md:ml-0" data-testid="nav-search-form">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${isNavy ? "bg-white/5 border-white/20 text-slate-200" : "bg-white/70 border-pink-200 text-slate-900"}`}>
            <Search className="w-4 h-4 opacity-60" />
            <input
              data-testid="nav-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder='try "Oppo A5s" or "iPhone 15"'
              className="bg-transparent outline-none flex-1 text-sm font-bricolage placeholder:opacity-60"
            />
          </div>
        </form>

        <Link to="/track" className={`hidden md:inline font-mono-sleek text-xs uppercase tracking-widest ${isNavy ? "text-slate-300 hover:text-emerald-400" : "text-pink-700 hover:text-pink-900"}`} data-testid="nav-track">
          Track
        </Link>

        <Link to="/checkout" data-testid="nav-cart" className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-full ${isNavy ? "border border-white/20" : "border border-pink-200"}`}>
          <ShoppingBag className="w-4 h-4" />
          <span className="text-xs font-mono-sleek">CART</span>
          {count > 0 && (
            <span data-testid="nav-cart-count" className={`absolute -top-1 -right-1 text-[10px] w-5 h-5 grid place-items-center rounded-full ${isNavy ? "bg-emerald-500 text-slate-900" : "bg-pink-500 text-white"}`}>{count}</span>
          )}
        </Link>
      </div>
    </header>
  );
}

function NavItem({ to, label, active, tone, testid }) {
  const isNavy = tone === "navy";
  return (
    <Link
      to={to}
      data-testid={testid}
      className={`px-3 py-1.5 rounded-full transition-all hover-pop ${
        active
          ? isNavy
            ? "bg-emerald-400/20 text-emerald-300 border border-emerald-400/40"
            : "bg-pink-200/70 text-pink-900 border border-pink-300"
          : isNavy
            ? "text-slate-300 hover:bg-white/5"
            : "text-slate-800 hover:bg-pink-100"
      }`}
    >
      {label}
    </Link>
  );
}
