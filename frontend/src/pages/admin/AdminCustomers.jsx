import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminCustomers() {
  const [list, setList] = useState([]);
  useEffect(() => { api.get("/customers").then((r) => setList(r.data)); }, []);
  return (
    <div data-testid="admin-customers">
      <h1 className="font-display-navy text-4xl chrome-text-navy">Customers</h1>
      <p className="text-sm text-slate-400 mt-1 font-mono-sleek uppercase tracking-widest">{list.length} unique buyers</p>
      <div className="mt-6 admin-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-slate-400 text-xs uppercase tracking-widest">
            <tr><th className="p-3 text-left">Name</th><th className="p-3 text-left">Email</th><th className="p-3 text-left">Phone</th><th className="p-3 text-right">Orders</th><th className="p-3 text-right">Spend</th></tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.email} className="border-t border-white/5" data-testid={`customer-row-${c.email}`}>
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-slate-400">{c.email}</td>
                <td className="p-3 text-slate-400">{c.phone}</td>
                <td className="p-3 text-right">{c.orders}</td>
                <td className="p-3 text-right text-emerald-300">₹{c.spend}</td>
              </tr>
            ))}
            {!list.length && <tr><td colSpan="5" className="p-6 text-center text-slate-500">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
