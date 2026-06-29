import { useEffect, useState } from "react";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CustomOrdersBanner from "@/components/CustomOrdersBanner";
import ProductCard from "@/components/ProductCard";

export default function Collab() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    api.get("/products", { params: { category: "collab" } }).then((r) => setProducts(r.data));
  }, []);

  return (
    <div data-testid="collab-page">
      <Nav tone="collab" />
      <CustomOrdersBanner tone="pink" />

      <section className="collab-split relative">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="chip-pink mb-3">A Two-Sided Drop</div>
            <h1 className="font-display-collab text-7xl md:text-8xl leading-[0.9] chrome-text-pink">
              Split<br/>Souls.
            </h1>
            <p className="mt-6 max-w-md text-slate-700 font-bricolage">
              Half pink chrome, half midnight navy. For the in-between, the contradictions, the lovers.
            </p>
          </div>
          <div>
            <h2 className="font-display-collab text-7xl md:text-8xl leading-[0.9] chrome-text-navy lg:text-right">
              One<br/>Drop.
            </h2>
            <p className="mt-6 max-w-md lg:ml-auto text-slate-300 font-bricolage">
              Designed unisex. Mirror finishes. Liquid metal. Worn by everyone locked in.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-b from-[#0a1a2f] to-[#fff5f9]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} tone={i % 2 === 0 ? "pink" : "navy"} />
            ))}
            {!products.length && <div className="col-span-full text-center text-slate-400">Loading drop…</div>}
          </div>
        </div>
      </section>

      <Footer tone="pink" />
    </div>
  );
}
