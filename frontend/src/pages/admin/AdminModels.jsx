import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Trash2, Edit, Search } from "lucide-react";

export default function AdminModels() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ brand: "", series: "", name: "" });
  const [editing, setEditing] = useState(null);

  const load = () => api.get("/phone-models").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  const create = async (e) => { e.preventDefault(); await api.post("/phone-models", form); setForm({ brand: "", series: "", name: "" }); load(); };
  const save = async () => { await api.put(`/phone-models/${editing.id}`, { brand: editing.brand, series: editing.series, name: editing.name }); setEditing(null); load(); };
  const del = async (id) => { if (!window.confirm("Delete this model?")) return; await api.delete(`/phone-models/${id}`); load(); };

  const filtered = list.filter((m) => !search || `${m.brand} ${m.name}`.toLowerCase().includes(search.toLowerCase()));
  const byBrand = filtered.reduce((acc, m) => { (acc[m.brand] = acc[m.brand] || []).push(m); return acc; }, {});

  return (
    <div data-testid="admin-models">
      <h1 className="font-display-navy text-4xl chrome-text-navy">Phone Models</h1>
      <p className="text-sm text-slate-400 mt-1 font-mono-sleek uppercase tracking-widest">{list.length} models · used in product compatibility & search</p>

      <form onSubmit={create} className="admin-card p-4 mt-6 grid md:grid-cols-4 gap-3 items-end">
        <Field label="Brand"><input data-testid="model-brand" value={form.brand} onChange={(e)=>setForm({...form,brand:e.target.value})} className="form-input" placeholder="Apple, Samsung…" required /></Field>
        <Field label="Series"><input data-testid="model-series" value={form.series} onChange={(e)=>setForm({...form,series:e.target.value})} className="form-input" placeholder="iPhone, Galaxy S…" /></Field>
        <Field label="Model name"><input data-testid="model-name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} className="form-input" placeholder="iPhone 15 Pro" required /></Field>
        <button className="btn-chrome-navy h-fit" data-testid="add-model-btn"><Plus className="w-3 h-3" /> Add model</button>
      </form>

      <div className="mt-6 admin-card px-4 py-2 flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input data-testid="models-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search brand or model…" className="flex-1 bg-transparent outline-none" />
      </div>

      <div className="mt-6 space-y-6">
        {Object.entries(byBrand).map(([brand, items]) => (
          <div key={brand} className="admin-card p-5">
            <div className="font-display-navy text-2xl chrome-text-navy">{brand} <span className="text-xs text-slate-400 ml-2">{items.length}</span></div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {items.map((m) => (
                <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded bg-white/5" data-testid={`model-row-${m.id}`}>
                  <div className="text-sm truncate">{m.name}</div>
                  <div className="flex gap-1">
                    <button onClick={() => setEditing(m)} className="text-slate-400 hover:text-emerald-300" data-testid={`edit-model-${m.id}`}><Edit className="w-3 h-3" /></button>
                    <button onClick={() => del(m.id)} className="text-pink-400"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/80 grid place-items-center z-50">
          <div className="admin-card w-full max-w-md p-6 mx-4">
            <h2 className="font-display-navy text-2xl chrome-text-navy">Edit model</h2>
            <div className="mt-4 space-y-3">
              <input value={editing.brand} onChange={(e)=>setEditing({...editing,brand:e.target.value})} className="form-input" />
              <input value={editing.series||""} onChange={(e)=>setEditing({...editing,series:e.target.value})} className="form-input" placeholder="Series" />
              <input value={editing.name} onChange={(e)=>setEditing({...editing,name:e.target.value})} className="form-input" />
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <button onClick={() => setEditing(null)} className="btn-ghost-navy">Cancel</button>
              <button onClick={save} className="btn-chrome-navy" data-testid="save-model-btn">Save</button>
            </div>
          </div>
        </div>
      )}

      <style>{`.form-input{width:100%;padding:8px 10px;border-radius:6px;background:#0e0f12;border:1px solid #24262c;color:#e8e8ed;outline:none}.form-input:focus{border-color:#15a678}`}</style>
    </div>
  );
}
function Field({ label, children }) {
  return <label className="block"><div className="text-xs uppercase tracking-widest text-slate-400 font-mono-sleek mb-1">{label}</div>{children}</label>;
}
