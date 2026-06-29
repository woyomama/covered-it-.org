import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Trash2, Plus } from "lucide-react";

export default function AdminReels() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: "", video_url: "", thumbnail: "", product_id: "", caption: "" });
  const load = () => api.get("/reels").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);
  const create = async (e) => { e.preventDefault(); await api.post("/reels", form); setForm({ title: "", video_url: "", thumbnail: "", product_id: "", caption: "" }); load(); };
  const del = async (id) => { await api.delete(`/reels/${id}`); load(); };
  return (
    <div data-testid="admin-reels">
      <h1 className="font-display-navy text-4xl chrome-text-navy">Reels</h1>
      <form onSubmit={create} className="admin-card p-4 mt-6 grid md:grid-cols-2 gap-3">
        <input data-testid="reel-title" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="form-input" required />
        <input data-testid="reel-thumb" placeholder="Thumbnail URL" value={form.thumbnail} onChange={(e)=>setForm({...form,thumbnail:e.target.value})} className="form-input" required />
        <input data-testid="reel-video" placeholder="Video URL (mp4 or YT link)" value={form.video_url} onChange={(e)=>setForm({...form,video_url:e.target.value})} className="form-input md:col-span-2" required />
        <input placeholder="Caption" value={form.caption} onChange={(e)=>setForm({...form,caption:e.target.value})} className="form-input md:col-span-2" />
        <button className="btn-chrome-navy md:col-span-2" data-testid="add-reel-btn"><Plus className="w-3 h-3" /> Add reel</button>
      </form>
      <div className="mt-6 grid md:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map((r) => (
          <div key={r.id} className="admin-card p-3">
            {r.thumbnail ? (
              <img src={r.thumbnail} alt="" className="w-full aspect-[9/16] rounded object-cover" />
            ) : (
              <div className="w-full aspect-[9/16] rounded bg-white/5" />
            )}
            <div className="mt-2 font-semibold">{r.title}</div>
            <button onClick={() => del(r.id)} className="mt-2 text-pink-400 text-xs"><Trash2 className="w-3 h-3 inline" /> Delete</button>
          </div>
        ))}
        {!list.length && <div className="text-slate-500 col-span-full">No reels yet.</div>}
      </div>
      <style>{`.form-input{width:100%;padding:10px 12px;border-radius:8px;background:#0e0f12;border:1px solid #24262c;color:#e8e8ed;outline:none}.form-input:focus{border-color:#15a678}`}</style>
    </div>
  );
}
