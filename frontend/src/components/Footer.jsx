import { Link } from "react-router-dom";

export default function Footer({ tone = "pink" }) {
  const isNavy = tone === "navy";
  return (
    <footer className={`mt-20 border-t ${isNavy ? "border-white/10 bg-[#061427] text-slate-300" : "border-pink-200 bg-pink-50/40 text-slate-700"}`} data-testid="site-footer">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12 grid md:grid-cols-4 gap-10">
        <div>
          <div className={`text-2xl ${isNavy ? "chrome-text-navy font-display-navy" : "chrome-text-pink font-display-pink"}`}>Covered IT!</div>
          <p className="mt-3 text-sm font-bricolage opacity-80">Phone cases & charms for the locked-in girlies & boys. Pickup from Mumbai 400043.</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest font-mono-sleek mb-3 opacity-60">Shop</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/her" className="hover:underline">For Her</Link></li>
            <li><Link to="/him" className="hover:underline">For Him</Link></li>
            <li><Link to="/collab" className="hover:underline">Collab</Link></li>
            <li><Link to="/charms" className="hover:underline">Charms</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest font-mono-sleek mb-3 opacity-60">Support</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/track" className="hover:underline">Track Order</Link></li>
            <li><a href="mailto:hello@coveredit.in" className="hover:underline">hello@coveredit.in</a></li>
            <li><a href="https://instagram.com" className="hover:underline">Instagram</a></li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest font-mono-sleek mb-3 opacity-60">Codes</div>
          <p className="text-sm">Use <span className={`px-2 py-0.5 rounded ${isNavy ? "bg-emerald-500/15 text-emerald-300" : "bg-pink-200 text-pink-900"}`}>MAINCHAR10</span> for 10% off</p>
          <p className="text-sm mt-2">Use <span className={`px-2 py-0.5 rounded ${isNavy ? "bg-emerald-500/15 text-emerald-300" : "bg-pink-200 text-pink-900"}`}>LOCKEDIN20</span> above ₹999</p>
        </div>
      </div>
      <div className={`text-center text-xs py-4 ${isNavy ? "border-t border-white/10 text-slate-400" : "border-t border-pink-200 text-slate-500"}`}>
        © {new Date().getFullYear()} Covered IT! · Locked in, always.
      </div>
    </footer>
  );
}
