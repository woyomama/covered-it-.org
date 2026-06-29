import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Instagram, MessageCircle } from "lucide-react";
import api from "@/lib/api";

export default function Footer({ tone = "pink" }) {
  const isNavy = tone === "navy";
  const [settings, setSettings] = useState({});
  useEffect(() => { api.get("/settings").then((r) => setSettings(r.data || {})).catch(()=>{}); }, []);

  const ig = (settings.instagram || "").trim().replace(/^@/, "");
  const igUrl = ig
    ? (ig.startsWith("http") ? ig : `https://instagram.com/${ig}`)
    : "https://instagram.com";
  const igDisplay = ig
    ? `@${ig.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}`
    : "Set in /admin/settings";
  const email = settings.contact_email || "hello@coveredit.in";

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
          <div className="text-xs uppercase tracking-widest font-mono-sleek mb-3 opacity-60">Custom Orders</div>
          <p className="text-sm font-bricolage">
            Want your own design, name, colour or aesthetic? <b>We take custom orders.</b> Just DM us on Instagram with your phone model + idea.
          </p>
          <a
            href={igUrl}
            target="_blank"
            rel="noreferrer"
            data-testid="footer-ig-link"
            className={`mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold ${isNavy ? "bg-emerald-400 text-slate-900 hover:bg-emerald-300" : "bg-pink-600 text-white hover:bg-pink-700"}`}
          >
            <Instagram className="w-4 h-4" /> {igDisplay}
          </a>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest font-mono-sleek mb-3 opacity-60">Support</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/track" className="hover:underline">Track Order</Link></li>
            <li>
              <a href={`mailto:${email}`} className="hover:underline inline-flex items-center gap-1">
                <MessageCircle className="w-3 h-3" /> {email}
              </a>
            </li>
            <li className="pt-2">Use <span className={`px-2 py-0.5 rounded ${isNavy ? "bg-emerald-500/15 text-emerald-300" : "bg-pink-200 text-pink-900"}`}>MAINCHAR10</span> for 10% off</li>
            <li>Use <span className={`px-2 py-0.5 rounded ${isNavy ? "bg-emerald-500/15 text-emerald-300" : "bg-pink-200 text-pink-900"}`}>LOCKEDIN20</span> above ₹999</li>
          </ul>
        </div>
      </div>
      <div className={`text-center text-xs py-4 ${isNavy ? "border-t border-white/10 text-slate-400" : "border-t border-pink-200 text-slate-500"}`}>
        © {new Date().getFullYear()} Covered IT! · Locked in, always.
      </div>
    </footer>
  );
}
