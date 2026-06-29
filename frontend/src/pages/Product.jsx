import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useCart } from "@/context/Cart";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { ShoppingBag, Check, Truck, Lock } from "lucide-react";

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const { addItem } = useCart();
  const [p, setP] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [model, setModel] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => { api.get(`/products/${id}`).then((r) => setP(r.data)); }, [id]);

  if (!p) return (
    <div><Nav tone="pink" /><div className="max-w-6xl mx-auto p-12">Loading…</div></div>
  );

  const isNavy = p.category === "him";
  const tone = isNavy ? "navy" : "pink";
  const needsModel = p.category !== "charms" && (p.compatible_models || []).length > 0;

  const handleAdd = () => {
    if (needsModel && !model) return;
    addItem(p, model);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={isNavy ? "him-bg him-stone min-h-screen text-slate-100" : "her-bg her-grain min-h-screen"} data-testid="product-page">
      <Nav tone={tone} />
      <div className="max-w-[1280px] mx-auto px-6 lg:px-10 py-10 grid lg:grid-cols-2 gap-10">
        {/* gallery */}
        <div>
          <div className={`aspect-square rounded-2xl overflow-hidden ${isNavy ? "border border-white/10" : "border border-pink-200"}`}>
            <img src={p.images?.[imgIdx]} alt={p.name} className="w-full h-full object-cover" data-testid="product-main-image" />
          </div>
          <div className="mt-4 grid grid-cols-5 gap-3">
            {(p.images || []).map((src, i) => (
              <button key={i} onClick={() => setImgIdx(i)} className={`aspect-square rounded-lg overflow-hidden border-2 ${i===imgIdx ? (isNavy?'border-emerald-400':'border-pink-500') : (isNavy?'border-white/10':'border-pink-100')}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* info */}
        <div>
          <div className={isNavy ? "chip-navy" : "chip-pink"}>{p.aesthetic || p.category}</div>
          <h1 className={`mt-3 text-5xl leading-tight ${isNavy ? "font-display-navy chrome-text-navy" : "font-display-pink chrome-text-pink"}`}>{p.name}</h1>
          <p className={`mt-4 font-bricolage ${isNavy ? "text-slate-300" : "text-slate-700"}`}>{p.description}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <div className={`text-4xl ${isNavy?'text-emerald-300 font-display-navy':'text-pink-700 font-display-pink'}`}>₹{p.price}</div>
            {p.mrp && p.mrp > p.price && <div className={`line-through ${isNavy?'text-slate-500':'text-slate-400'}`}>₹{p.mrp}</div>}
            {p.mrp && p.mrp > p.price && <div className={isNavy ? "chip-navy" : "chip-pink"}>{Math.round((1 - p.price/p.mrp)*100)}% off</div>}
          </div>

          {needsModel && (
            <div className="mt-8" data-testid="model-picker">
              <label className={`text-xs uppercase tracking-widest font-mono-sleek mb-2 block ${isNavy?'text-emerald-400':'text-pink-700'}`}>Pick your phone model</label>
              <select
                data-testid="product-model-select"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full px-4 py-3 rounded-lg outline-none ${isNavy?'bg-white/5 border border-white/20 text-slate-100':'bg-white border border-pink-200 text-slate-900'}`}
              >
                <option value="">— Select model —</option>
                {(p.compatible_models || []).map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div className="mt-8 flex gap-3 flex-wrap">
            <button
              onClick={handleAdd}
              disabled={needsModel && !model}
              data-testid="add-to-cart-btn"
              className={`${isNavy ? "btn-chrome-navy" : "btn-chrome-pink"} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {added ? <><Check className="w-4 h-4" /> Added</> : <><ShoppingBag className="w-4 h-4" /> Add to cart</>}
            </button>
            <button
              onClick={() => { handleAdd(); setTimeout(() => nav("/checkout"), 200); }}
              disabled={needsModel && !model}
              data-testid="buy-now-btn"
              className={isNavy ? "btn-ghost-navy" : "btn-ghost-pink"}
            >Buy now</button>
          </div>

          <div className={`mt-10 grid grid-cols-3 gap-4 text-xs font-mono-sleek uppercase tracking-widest ${isNavy?'text-slate-400':'text-slate-600'}`}>
            <div className="flex items-center gap-2"><Truck className="w-4 h-4" /> Free above ₹499</div>
            <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> Locked-in fit</div>
            <div className="flex items-center gap-2"><Check className="w-4 h-4" /> 7-day returns</div>
          </div>
        </div>
      </div>
      <Footer tone={tone} />
    </div>
  );
}
