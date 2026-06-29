import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ArrowRight, Sparkles, Lock, Heart } from "lucide-react";

export default function Landing() {
  const [products, setProducts] = useState({ her: [], him: [], charms: [], collab: [] });

  useEffect(() => {
    api.get("/products", { params: { featured: true, limit: 12 } }).then((r) => {
      const grouped = { her: [], him: [], charms: [], collab: [] };
      r.data.forEach((p) => { if (grouped[p.category]) grouped[p.category].push(p); });
      setProducts(grouped);
    });
  }, []);

  return (
    <div data-testid="landing-page">
      <Nav tone="collab" />

      {/* HERO — split chrome */}
      <section className="collab-split relative overflow-hidden">
        <div className="absolute inset-0 her-grain opacity-30 pointer-events-none"></div>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-12 relative">
          {/* left — her side */}
          <div className="rise-in">
            <div className="chip-pink mb-6"><Sparkles className="w-3 h-3" /> Drop 01 — Y2K Chrome</div>
            <h1 className="font-display-pink text-7xl lg:text-9xl leading-[0.85] chrome-text-pink">
              Covered.<br/>Locked.<br/>Iconic.
            </h1>
            <p className="mt-6 max-w-md font-bricolage text-slate-700 text-lg">
              Phone cases & charms designed for the locked-in girlies. Pink chrome melt, white lilies, ribbon bows.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <Link to="/her" className="btn-chrome-pink" data-testid="hero-cta-her">Shop Her <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/charms" className="btn-ghost-pink" data-testid="hero-cta-charms">Charms ✿</Link>
            </div>
          </div>

          {/* right — him side */}
          <div className="rise-in rise-in-2 lg:text-right">
            <div className="inline-flex chip-navy mb-6"><Lock className="w-3 h-3" /> Midnight Drop</div>
            <h1 className="font-display-navy text-7xl lg:text-9xl leading-[0.85] chrome-text-navy">
              For The<br/>Quiet<br/>Killers.
            </h1>
            <p className="mt-6 max-w-md lg:ml-auto font-bricolage text-slate-300 text-lg">
              Midnight navy, liquid metal swirls, cracked stone. Built for boys who don't need a logo.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap lg:justify-end">
              <Link to="/him" className="btn-chrome-navy" data-testid="hero-cta-him">Shop Him <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/collab" className="btn-ghost-navy" data-testid="hero-cta-collab">See Collab</Link>
            </div>
          </div>
        </div>

        {/* floating deco */}
        <div className="deco-float" style={{ top: '10%', left: '8%', animationDelay: '0s' }}>♡</div>
        <div className="deco-float" style={{ top: '70%', left: '14%', animationDelay: '1.2s' }}>✿</div>
        <div className="deco-float" style={{ top: '20%', right: '40%', animationDelay: '2s' }}>★</div>
        <div className="deco-float" style={{ top: '80%', right: '12%', animationDelay: '0.6s', color: '#15a678' }}>◆</div>
      </section>

      {/* marquee */}
      <section className="bg-black py-4 border-y border-pink-200">
        <div className="marquee">
          <div className="marquee-track">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className="text-3xl font-display-pink chrome-text-pink whitespace-nowrap">
                LOCKED IN · LOCKED IN · LOCKED IN ·
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* featured grids */}
      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="chip-pink mb-3">New Arrivals</div>
            <h2 className="font-display-pink text-5xl chrome-text-pink">For Her</h2>
          </div>
          <Link to="/her" className="btn-ghost-pink" data-testid="see-all-her">See all →</Link>
        </div>
        <Grid items={products.her} tone="pink" />
      </section>

      <section className="him-bg him-stone">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="chip-navy mb-3">Midnight</div>
              <h2 className="font-display-navy text-5xl chrome-text-navy">For Him</h2>
            </div>
            <Link to="/him" className="btn-ghost-navy" data-testid="see-all-him">See all →</Link>
          </div>
          <Grid items={products.him} tone="navy" />
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="chip-pink mb-3"><Heart className="w-3 h-3" /> Y2K Charms</div>
            <h2 className="font-display-pink text-5xl chrome-text-pink">Charms</h2>
          </div>
          <Link to="/charms" className="btn-ghost-pink" data-testid="see-all-charms">See all →</Link>
        </div>
        <Grid items={products.charms} tone="pink" />
      </section>

      <Footer tone="pink" />
    </div>
  );
}

import ProductCard from "@/components/ProductCard";
function Grid({ items, tone }) {
  if (!items.length) return <div className="grid grid-cols-2 md:grid-cols-4 gap-6">{[0,1,2,3].map((i)=>(<div key={i} className="skeleton aspect-[4/5] rounded-2xl" />))}</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} tone={tone} />)}
    </div>
  );
}
