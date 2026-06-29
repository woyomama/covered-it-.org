import { NavLink, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/Auth";
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Film, Smartphone, Settings, LogOut, Lock } from "lucide-react";

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const nav = useNavigate();
  if (loading) return <div className="admin-shell grid place-items-center">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;

  const links = [
    { to: "/admin",          label: "Dashboard", I: LayoutDashboard, end: true },
    { to: "/admin/products", label: "Products",  I: Package },
    { to: "/admin/orders",   label: "Orders",    I: ShoppingCart },
    { to: "/admin/customers",label: "Customers", I: Users },
    { to: "/admin/coupons",  label: "Coupons",   I: Tag },
    { to: "/admin/reels",    label: "Reels",     I: Film },
    { to: "/admin/models",   label: "Phone Models", I: Smartphone },
    { to: "/admin/settings", label: "Settings",  I: Settings },
  ];

  return (
    <div className="admin-shell flex" data-testid="admin-layout">
      <aside className="w-64 min-h-screen border-r border-white/5 p-5">
        <div className="flex items-center gap-2 text-lg font-display-navy chrome-text-navy"><Lock className="w-4 h-4" /> Covered IT! HQ</div>
        <nav className="mt-8 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              data-testid={`admin-nav-${l.label.toLowerCase().replace(/ /g,'-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${isActive ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" : "text-slate-300 hover:bg-white/5"}`
              }
            >
              <l.I className="w-4 h-4" /> {l.label}
            </NavLink>
          ))}
        </nav>
        <button data-testid="admin-logout" onClick={async () => { await logout(); nav("/login"); }} className="mt-8 flex items-center gap-2 text-slate-400 text-sm hover:text-pink-400">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
