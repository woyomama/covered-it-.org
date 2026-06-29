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
                <div className="text-xs text-emerald-400 mt-1">{(p.compatible_models||[]).length} models</div>
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

            {/* Step 2 */}
            <Section title="2 · Pricing & Stock" hint="Money & inventory.">
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Price (₹)" hint="What you sell it for."><input data-testid="form-price" type="number" value={editing.price} onChange={(e) => setEditing({...editing, price: e.target.value})} className="form-input" /></Field>
                <Field label="MRP (₹)" hint="Original price, shown with strike-through."><input data-testid="form-mrp" type="number" value={editing.mrp || ""} onChange={(e) => setEditing({...editing, mrp: e.target.value})} className="form-input" /></Field>
                <Field label="Stock" hint="Units available."><input data-testid="form-stock" type="number" value={editing.stock} onChange={(e) => setEditing({...editing, stock: e.target.value})} className="form-input" /></Field>
              </div>
            </Section>

            {/* Step 3 */}
            <Section title="3 · Description" hint="Tell the story — 1-2 punchy lines.">
              <textarea data-testid="form-description" value={editing.description} onChange={(e) => setEditing({...editing, description: e.target.value})} className="form-input min-h-[100px]" />
            </Section>

            {/* Step 4 */}
            <Section title="4 · Images" hint="Paste image URLs, one per line. First image is the cover.">
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

            {/* Step 5 */}
            <Section title="5 · Compatible phone models" hint="Pick every model this case fits. Customers will only see this product when they search those models.">
              <ModelPicker models={models} selected={editing.compatible_models || []} onChange={(arr) => setEditing({...editing, compatible_models: arr})} />
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
  const byBrand = models.reduce((acc, m) => {
    if (q && !m.name.toLowerCase().includes(q.toLowerCase()) && !m.brand.toLowerCase().includes(q.toLowerCase())) return acc;
    (acc[m.brand] = acc[m.brand] || []).push(m);
    return acc;
  }, {});
  const has = (name) => selected.includes(name);
  const toggle = (name) => onChange(has(name) ? selected.filter((s) => s !== name) : [...selected, name]);

  return (
    <div>
      <div className="flex items-center gap-2">
        <input data-testid="form-model-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand / model (e.g. Oppo, iPhone 15)" className="form-input" />
        <button type="button" onClick={() => onChange([])} className="btn-ghost-navy text-xs">Clear</button>
      </div>
      <div className="mt-2 text-xs text-emerald-400">{selected.length} selected</div>
      <div className="mt-3 max-h-72 overflow-y-auto pr-2 space-y-3">
        {Object.entries(byBrand).map(([brand, list]) => (
          <div key={brand}>
            <div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek mb-1">{brand}</div>
            <div className="flex flex-wrap gap-2">
              {list.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.name)}
                  data-testid={`form-model-toggle-${m.id}`}
                  className={`px-3 py-1.5 rounded-full text-xs transition-all ${has(m.name) ? "bg-emerald-500 text-slate-900" : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"}`}
                >{m.name}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
