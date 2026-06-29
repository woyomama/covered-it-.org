import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Sparkles, Heart, Star, Flower2 } from "lucide-react";

export default function Her() {
  const [products, setProducts] = useState([]);
  const [reelIdx, setReelIdx] = useState(0);

  useEffect(() => {
    api.get("/products", { params: { category: "her" } }).then((r) => setProducts(r.data));
  }, []);

  // rotate viewfinder
  const featured = products.slice(0, 6);
  useEffect(() => {
    if (!featured.length) return;
    const t = setInterval(() => setReelIdx((i) => (i + 1) % featured.length), 2400);
    return () => clearInterval(t);
  }, [featured.length]);

  return (
    <div className="her-bg her-grain min-h-screen" data-testid="her-page">
      <Nav tone="pink" />

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 pb-20 relative overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* left text */}
          <div className="relative z-10">
            <div className="chip-pink mb-4"><Sparkles className="w-3 h-3" /> Pink Chrome Drop</div>
            <h1 className="font-display-pink text-7xl md:text-9xl leading-[0.85] chrome-text-pink">
              Her<br/>era<br/>is<br/>iconic.
            </h1>
            <p className="mt-6 max-w-md font-bricolage text-slate-700 text-lg">
              Liquid chrome melt, satin pink, white lilies, hearts & ribbons. Y2K, but make it locked in.
            </p>
            <div className="mt-8 flex gap-3 flex-wrap">
              <a href="#shop" className="btn-chrome-pink" data-testid="her-shop-cta">Shop the drop ✿</a>
              <a href="#flip" className="btn-ghost-pink" data-testid="her-view-flip">View the flip phone</a>
            </div>
          </div>

          {/* right — flip phone with rotating products */}
          <div id="flip" className="relative" data-testid="her-flip-phone">
            <div className="flip-phone">
              <div className="flip-phone-hinge"></div>
              <div className="flip-phone-viewfinder">
                <div className="flip-phone-frame-deco"></div>
                <div className="flip-phone-lens"></div>
                {featured.map((p, i) => (
                  <div
                    key={p.id}
                    className={`absolute inset-0 transition-all duration-700 ${
                      i === reelIdx ? "opacity-100 translate-x-0" : i < reelIdx ? "opacity-0 -translate-x-full" : "opacity-0 translate-x-full"
                    }`}
                  >
                    {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                    <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/85 to-transparent">
                      <div className="text-pink-200 text-xs font-mono-sleek uppercase tracking-widest">New ✿</div>
                      <div className="text-white text-lg font-bricolage font-semibold">{p.name}</div>
                      <div className="text-pink-100 font-display-pink text-2xl">₹{p.price}</div>
                    </div>
                  </div>
                ))}
                {!featured.length && <div className="grid place-items-center h-full text-pink-200 text-sm">Loading drop…</div>}
                <div className="flip-phone-bottom-bar"><span/><span/><span/></div>
              </div>
            </div>
            {/* floating charms */}
            <div className="deco-float" style={{ top: '8%', left: '-12%' }}>♡</div>
            <div className="deco-float" style={{ top: '40%', right: '-10%', animationDelay: '1s' }}>✿</div>
            <div className="deco-float" style={{ bottom: '8%', left: '-8%', animationDelay: '2s' }}>★</div>
          </div>
        </div>
      </section>

      <section id="shop" className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="chip-pink mb-3">The Edit</div>
            <h2 className="font-display-pink text-5xl chrome-text-pink">All for Her</h2>
          </div>
          <div className="text-xs font-mono-sleek text-pink-700 uppercase tracking-widest">{products.length} pieces</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} tone="pink" />)}
        </div>
      </section>

      <Footer tone="pink" />
    </div>
  );
}
