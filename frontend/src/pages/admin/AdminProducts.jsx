import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Edit, Trash2, X, Image as ImgIcon, Search } from "lucide-react";

const blank = {
  name: "", description: "", price: 0, mrp: 0, category: "her",
  images: [], compatible_models: [], stock: 100, tags: [], featured: false, aesthetic: "",
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [models, setModels] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => api.get("/products", { params: { limit: 500 } }).then((r) => setItems(r.data));
  useEffect(() => { load(); api.get("/phone-models").then((r) => setModels(r.data)); }, []);

  const save = async () => {
    const body = { ...editing, price: Number(editing.price), mrp: Number(editing.mrp || 0), stock: Number(editing.stock || 0) };
    if (editing.id) await api.put(`/products/${editing.id}`, body);
    else await api.post("/products", body);
    setEditing(null); load();
  };

  const del = async (id) => { if (!window.confirm("Delete this product?")) return; await api.delete(`/products/${id}`); load(); };

  const filtered = items.filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div data-testid="admin-products">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display-navy text-4xl chrome-text-navy">Products</h1>
          <p className="text-sm text-slate-400 mt-1 font-mono-sleek uppercase tracking-widest">Drops, charms, collab</p>
        </div>
        <button onClick={() => setEditing({ ...blank })} className="btn-chrome-navy" data-testid="new-product-btn"><Plus className="w-4 h-4" /> New product</button>
      </div>

      <div className="mt-6 flex items-center gap-2 admin-card px-4 py-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input data-testid="products-search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" className="flex-1 bg-transparent outline-none" />
      </div>

      <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div key={p.id} className="admin-card p-4" data-testid={`product-row-${p.id}`}>
            <div className="flex gap-3">
              {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-20 h-20 rounded object-cover bg-white/5" /> : <div className="w-20 h-20 rounded bg-white/5" />}
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-slate-400">{p.category} · ₹{p.price} · stock {p.stock}</div>
                {p.category === "charms" ? (
                  <div className="text-[10px] text-pink-300 mt-1 inline-block px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30">Any case loop</div>
                ) : (p.compatible_models || []).length === 0 ? (
                  <div className="text-[10px] text-pink-300 mt-1 inline-block px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30">⚠ no models — hidden from search</div>
                ) : (
                  <div className="text-[10px] text-emerald-300 mt-1 inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30" title={(p.compatible_models || []).join(", ")}>
                    ✓ {p.compatible_models.length} phone models
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setEditing(p)} className="btn-ghost-navy text-xs" data-testid={`edit-product-${p.id}`}><Edit className="w-3 h-3" /> Edit</button>
              <button onClick={() => del(p.id)} className="btn-ghost-navy text-xs"><Trash2 className="w-3 h-3" /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/80 grid place-items-center z-50 overflow-auto" data-testid="product-modal">
          <div className="admin-card w-full max-w-3xl p-6 my-12 mx-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display-navy text-3xl chrome-text-navy">{editing.id ? "Edit product" : "New product"}</h2>
              <button onClick={() => setEditing(null)}><X /></button>
            </div>

            {/* Step 1 */}
            <Section title="1 · Basics" hint="What's the product called and where does it belong?">
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Name" hint="The display name customers see.">
                  <input data-testid="form-name" value={editing.name} onChange={(e) => setEditing({...editing, name: e.target.value})} className="form-input" />
                </Field>
                <Field label="Category" hint="Which section this product appears in.">
                  <select data-testid="form-category" value={editing.category} onChange={(e) => setEditing({...editing, category: e.target.value})} className="form-input">
                    <option value="her">Her — Pink Chrome</option>
                    <option value="him">Him — Midnight Navy</option>
                    <option value="collab">Collab — Split</option>
                    <option value="charms">Charms</option>
                  </select>
                </Field>
                <Field label="Aesthetic tag" hint="One-word vibe shown on the product card (e.g. Chrome, Bow).">
                  <input data-testid="form-aesthetic" value={editing.aesthetic || ""} onChange={(e) => setEditing({...editing, aesthetic: e.target.value})} className="form-input" />
                </Field>
                <Field label="Featured?" hint="Show on landing page in featured grid.">
                  <label className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={!!editing.featured} onChange={(e) => setEditing({...editing, featured: e.target.checked})} data-testid="form-featured" />
                    Show on homepage
                  </label>
                </Field>
              </div>
            </Section>

            {/* Step 2 — model picker promoted to be more visible */}
            <Section title="2 · Compatible phone models" hint="🔥 IMPORTANT — Pick every phone model this case fits. The product will appear on the storefront ONLY when customers search those models. Charms can skip this.">
              <ModelPicker models={models} selected={editing.compatible_models || []} onChange={(arr) => setEditing({...editing, compatible_models: arr})} />
            </Section>

            {/* Step 3 */}
            <Section title="3 · Pricing & Stock" hint="Money & inventory.">
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Price (₹)" hint="What you sell it for."><input data-testid="form-price" type="number" value={editing.price} onChange={(e) => setEditing({...editing, price: e.target.value})} className="form-input" /></Field>
                <Field label="MRP (₹)" hint="Original price, shown with strike-through."><input data-testid="form-mrp" type="number" value={editing.mrp || ""} onChange={(e) => setEditing({...editing, mrp: e.target.value})} className="form-input" /></Field>
                <Field label="Stock" hint="Units available."><input data-testid="form-stock" type="number" value={editing.stock} onChange={(e) => setEditing({...editing, stock: e.target.value})} className="form-input" /></Field>
              </div>
            </Section>

            {/* Step 4 */}
            <Section title="4 · Description" hint="Tell the story — 1-2 punchy lines.">
              <textarea data-testid="form-description" value={editing.description} onChange={(e) => setEditing({...editing, description: e.target.value})} className="form-input min-h-[100px]" />
            </Section>

            {/* Step 5 */}
            <Section title="5 · Images" hint="Paste image URLs, one per line. First image is the cover.">
              <textarea
                data-testid="form-images"
                value={(editing.images || []).join("\n")}
                onChange={(e) => setEditing({...editing, images: e.target.value.split("\n").map(s=>s.trim()).filter(Boolean)})}
                className="form-input min-h-[80px] font-mono-sleek text-xs"
                placeholder="https://images.unsplash.com/photo-...&#10;https://..."
              />
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {(editing.images || []).map((src, i) => (
                  <img key={i} src={src} alt="" className="w-16 h-16 rounded object-cover border border-white/10" />
                ))}
              </div>
            </Section>

            <Section title="6 · Tags" hint="Comma-separated keywords for search (e.g. y2k, chrome, pink).">
              <input data-testid="form-tags" value={(editing.tags || []).join(", ")} onChange={(e) => setEditing({...editing, tags: e.target.value.split(",").map(s=>s.trim()).filter(Boolean)})} className="form-input" />
            </Section>

            <div className="mt-8 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="btn-ghost-navy">Cancel</button>
              <button onClick={save} className="btn-chrome-navy" data-testid="save-product-btn">Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-input { width: 100%; padding: 10px 12px; border-radius: 8px; background: #0e0f12; border: 1px solid #24262c; color: #e8e8ed; outline: none; }
        .form-input:focus { border-color: #15a678; }
      `}</style>
    </div>
  );
}

function Section({ title, hint, children }) {
  return (
    <div className="mt-6 pt-6 border-t border-white/5">
      <div className="font-display-navy text-lg text-emerald-300">{title}</div>
      <div className="text-xs text-slate-400 font-mono-sleek uppercase tracking-widest mt-1 mb-3">{hint}</div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek">{label}</div>
      <div className="text-[11px] text-slate-500 mb-1">{hint}</div>
      {children}
    </label>
  );
}

function ModelPicker({ models, selected, onChange }) {
  const [q, setQ] = useState("");
  const allByBrand = models.reduce((acc, m) => {
    (acc[m.brand] = acc[m.brand] || []).push(m);
    return acc;
  }, {});
  const byBrand = models.reduce((acc, m) => {
    if (q && !m.name.toLowerCase().includes(q.toLowerCase()) && !m.brand.toLowerCase().includes(q.toLowerCase())) return acc;
    (acc[m.brand] = acc[m.brand] || []).push(m);
    return acc;
  }, {});
  const has = (name) => selected.includes(name);
  const toggle = (name) => onChange(has(name) ? selected.filter((s) => s !== name) : [...selected, name]);
  const selectAllBrand = (brand) => {
    const names = (allByBrand[brand] || []).map((m) => m.name);
    const set = new Set([...selected, ...names]);
    onChange([...set]);
  };
  const clearBrand = (brand) => {
    const names = new Set((allByBrand[brand] || []).map((m) => m.name));
    onChange(selected.filter((n) => !names.has(n)));
  };

  return (
    <div>
      {/* live summary banner */}
      <div className="mb-3 p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-emerald-300 font-display-navy text-lg">
              Available for <span className="chrome-text-navy">{selected.length}</span> of {models.length} phones
            </div>
            <div className="text-[11px] text-slate-400 font-mono-sleek uppercase tracking-widest">
              {selected.length === 0 ? "⚠ Customers won't see this product in search until you pick at least one model" : "Customers searching these will find this product"}
            </div>
          </div>
          {selected.length > 0 && (
            <button type="button" onClick={() => onChange([])} className="btn-ghost-navy text-xs">Clear all</button>
          )}
        </div>
        {/* selected chips preview */}
        {selected.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto" data-testid="model-picker-selected">
            {selected.slice(0, 30).map((name) => (
              <span key={name} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                {name}
                <button type="button" onClick={() => toggle(name)} className="hover:text-pink-300">×</button>
              </span>
            ))}
            {selected.length > 30 && <span className="text-[11px] text-slate-400 self-center">+ {selected.length - 30} more</span>}
          </div>
        )}
      </div>

      {/* search bar */}
      <div className="flex items-center gap-2">
        <input data-testid="form-model-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔎 Filter brand / model (e.g. Oppo, iPhone 15)" className="form-input" />
      </div>

      <div className="mt-3 max-h-80 overflow-y-auto pr-2 space-y-3">
        {Object.entries(byBrand).map(([brand, list]) => {
          const brandAll = allByBrand[brand] || [];
          const selectedCount = brandAll.filter((m) => has(m.name)).length;
          const allSelected = selectedCount === brandAll.length;
          return (
            <div key={brand} className="border-t border-white/5 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm uppercase tracking-widest text-slate-300 font-mono-sleek">
                  {brand}
                  <span className="ml-2 text-[10px] text-emerald-400">{selectedCount}/{brandAll.length}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => (allSelected ? clearBrand(brand) : selectAllBrand(brand))}
                    data-testid={`brand-toggle-${brand}`}
                    className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${allSelected ? "bg-pink-500/15 text-pink-300 border border-pink-500/30" : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"} hover:opacity-80`}
                  >
                    {allSelected ? `Unselect all ${brand}` : `Select all ${brand}`}
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.name)}
                    data-testid={`form-model-toggle-${m.id}`}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${has(m.name) ? "bg-emerald-500 text-slate-900 font-semibold" : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:border-emerald-500/40"}`}
                  >{m.name}</button>
                ))}
              </div>
            </div>
          );
        })}
        {Object.keys(byBrand).length === 0 && (
          <div className="text-center text-slate-500 py-6 text-sm">No models match &quot;{q}&quot;. Add one in /admin/models.</div>
        )}
      </div>
    </div>
  );
}
