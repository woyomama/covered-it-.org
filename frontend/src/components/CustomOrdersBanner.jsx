import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Instagram, Sparkles } from "lucide-react";

/**
 * Slim, dismissible banner that nudges customers to DM IG for custom orders.
 * Pulls the IG handle from /api/settings → admin can edit any time in /admin/settings → Store.
 */
export default function CustomOrdersBanner({ tone = "pink" }) {
  const [handle, setHandle] = useState("");
  useEffect(() => {
    api.get("/settings").then((r) => {
      const ig = (r.data?.instagram || "").trim().replace(/^@/, "");
      setHandle(ig);
    }).catch(() => {});
  }, []);

  const url = handle
    ? (handle.startsWith("http") ? handle : `https://instagram.com/${handle}`)
    : "";

  const isNavy = tone === "navy";

  return (
    <div
      data-testid="custom-orders-banner"
      className={`relative overflow-hidden ${isNavy
        ? "bg-gradient-to-r from-emerald-500/10 via-slate-900 to-emerald-500/10 border-y border-emerald-500/30 text-emerald-50"
        : "bg-gradient-to-r from-pink-100 via-pink-50 to-pink-100 border-y border-pink-300 text-pink-900"}`}
    >
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-2.5 flex items-center justify-center gap-3 flex-wrap">
        <Sparkles className={`w-4 h-4 ${isNavy ? "text-emerald-300" : "text-pink-700"}`} />
        <span className="font-mono-sleek text-xs uppercase tracking-widest">
          ✦ Want a custom case? We make&apos;em.
        </span>
        {handle ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            data-testid="banner-ig-link"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all hover-pop ${isNavy
              ? "bg-emerald-400 text-slate-900 hover:bg-emerald-300"
              : "bg-pink-600 text-white hover:bg-pink-700"}`}
          >
            <Instagram className="w-3.5 h-3.5" /> DM @{handle.replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/$/, "")}
          </a>
        ) : (
          <span className={`text-xs ${isNavy ? "text-emerald-200" : "text-pink-700"}`}>
            <Instagram className="w-3.5 h-3.5 inline mr-1" />
            DM us on Instagram <span className="opacity-60">(admin: set @handle in /admin/settings)</span>
          </span>
        )}
        <span className="font-mono-sleek text-xs uppercase tracking-widest opacity-70 hidden md:inline">
          · pick your phone, your colour, your aesthetic 🔒
        </span>
      </div>
    </div>
  );
}
