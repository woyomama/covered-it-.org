import { Link } from "react-router-dom";

export default function ProductCard({ product, tone = "pink" }) {
  const isNavy = tone === "navy";
  const cardCls = isNavy ? "card-navy" : "card-pink";
  const img = (product.images && product.images[0]) || "";
  const off = product.mrp && product.mrp > product.price
    ? Math.round((1 - product.price / product.mrp) * 100)
    : 0;
  return (
    <Link to={`/product/${product.slug || product.id}`} data-testid={`product-card-${product.id}`} className={`${cardCls} block group`}>
      <div className="relative aspect-[4/5] overflow-hidden">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className={`w-full h-full ${isNavy ? "bg-slate-800" : "bg-pink-100"}`}></div>
        )}
        {off > 0 && (
          <div className={`absolute top-3 left-3 ${isNavy ? "chip-navy" : "chip-pink"}`}>-{off}% OFF</div>
        )}
        {product.aesthetic && (
          <div className={`absolute top-3 right-3 ${isNavy ? "chip-navy" : "chip-pink"}`}>{product.aesthetic}</div>
        )}
      </div>
      <div className="p-4">
        <div className={`text-xs uppercase tracking-widest font-mono-sleek ${isNavy ? "text-emerald-400/80" : "text-pink-700"}`}>
          {product.category}
        </div>
        <div className={`mt-1 font-bricolage font-semibold text-lg leading-tight ${isNavy ? "text-slate-100" : "text-slate-900"}`}>{product.name}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className={`${isNavy ? "text-emerald-300" : "text-pink-700"} font-display-${isNavy?'navy':'pink'} text-2xl`}>₹{product.price}</div>
          {product.mrp && product.mrp > product.price && (
            <div className={`text-sm line-through ${isNavy ? "text-slate-500" : "text-slate-400"}`}>₹{product.mrp}</div>
          )}
        </div>
      </div>
    </Link>
  );
}
