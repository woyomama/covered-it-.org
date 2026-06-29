import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/lib/api";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get("/products", { params: { search: q } }).then((r) => { setResults(r.data); setLoading(false); });
  }, [q]);

  return (
    <div className="min-h-screen bg-white" data-testid="search-page">
      <Nav tone="pink" />
      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-10">
        <div className="chip-pink mb-3"><SearchIcon className="w-3 h-3" /> Search</div>
        <h1 className="font-display-pink text-5xl chrome-text-pink">Results for "{q}"</h1>
        <div className="mt-2 text-sm text-slate-500 font-mono-sleek uppercase tracking-widest">{results.length} found</div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
            {[0,1,2,3].map((i)=>(<div key={i} className="skeleton aspect-[4/5] rounded-2xl" />))}
          </div>
        ) : results.length === 0 ? (
          <div className="mt-12 text-center py-20">
            <p className="text-slate-500 font-bricolage">Nothing matches "{q}" yet. Try another phone model or check our drops.</p>
            <div className="mt-6 flex gap-3 justify-center">
              <Link to="/her" className="btn-chrome-pink" data-testid="search-cta-her">Shop Her</Link>
              <Link to="/him" className="btn-chrome-navy" data-testid="search-cta-him">Shop Him</Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {results.map((p) => <ProductCard key={p.id} product={p} tone={p.category === "him" ? "navy" : "pink"} />)}
          </div>
        )}
      </div>
      <Footer tone="pink" />
    </div>
  );
}
