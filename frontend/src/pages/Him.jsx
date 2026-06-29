import { useEffect, useState } from "react";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Hexagon, Lock, Wind } from "lucide-react";

export default function Him() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { category: "him" } }).then((r) => setProducts(r.data));
  }, []);

  return (
    <div className="him-bg him-stone min-h-screen text-slate-100" data-testid="him-page">
      <Nav tone="navy" />

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 pb-20 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative z-10">
            <div className="chip-navy mb-4"><Lock className="w-3 h-3" /> Midnight Drop · 0F2C45</div>
            <h1 className="font-display-navy text-7xl md:text-9xl leading-[0.85] chrome-text-navy">
              Stone<br/>cold.<br/>Liquid<br/>metal.
            </h1>
            <p className="mt-6 max-w-md font-bricolage text-slate-300 text-lg">
              Midnight navy. Cracked stone textures. Emerald liquid metal swirls. No logos. No noise. Just locked.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <a href="#shop" className="btn-chrome-navy" data-testid="him-shop-cta">Enter the vault</a>
              <a href="/collab" className="btn-ghost-navy" data-testid="him-collab-link">See collab</a>
            </div>
          </div>

          <div className="relative aspect-square rounded-md overflow-hidden border border-white/15">
            <div className="absolute inset-0 him-liquid"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent"></div>
            <img src="https://images.unsplash.com/photo-1592286927505-1def25115558?w=1200" alt="Midnight" className="w-full h-full object-cover mix-blend-luminosity opacity-80" />
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <Hexagon className="w-12 h-12 mx-auto text-emerald-400" />
                <div className="mt-2 font-tanker text-3xl text-slate-100">VAULT 0043</div>
                <div className="text-xs font-mono-sleek text-slate-400 uppercase tracking-widest">Mumbai · Pickup 400043</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="shop" className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="chip-navy mb-3">The Vault</div>
            <h2 className="font-display-navy text-5xl chrome-text-navy">All for Him</h2>
          </div>
          <div className="text-xs font-mono-sleek text-emerald-400 uppercase tracking-widest">{products.length} pieces</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} tone="navy" />)}
        </div>
      </section>

      <Footer tone="navy" />
    </div>
  );
}
