import { useEffect, useState } from "react";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Sparkles } from "lucide-react";

export default function Charms() {
  const [products, setProducts] = useState([]);
  useEffect(() => { api.get("/products", { params: { category: "charms" } }).then((r) => setProducts(r.data)); }, []);

  return (
    <div className="her-bg her-grain min-h-screen" data-testid="charms-page">
      <Nav tone="pink" />

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-10 pb-12 relative">
        <div className="chip-pink mb-4"><Sparkles className="w-3 h-3" /> Chrome · Glass · Bows</div>
        <h1 className="font-display-pink text-7xl md:text-9xl leading-[0.85] chrome-text-pink">Charms.</h1>
        <p className="mt-4 max-w-2xl text-slate-700 font-bricolage text-lg">
          Hearts, ribbons, lilies, butterflies, pearls. Clip onto any case loop. ₹199 to ₹499. Coquette-coded.
        </p>

        <div className="deco-float" style={{ top: '15%', right: '4%' }}>♡</div>
        <div className="deco-float" style={{ top: '40%', right: '20%', animationDelay: '1.4s' }}>✿</div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} tone="pink" />)}
        </div>
      </section>

      <Footer tone="pink" />
    </div>
  );
}
