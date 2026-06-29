import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/Auth";
import { CartProvider } from "@/context/Cart";

import Landing from "@/pages/Landing";
import Her from "@/pages/Her";
import Him from "@/pages/Him";
import Collab from "@/pages/Collab";
import Charms from "@/pages/Charms";
import Product from "@/pages/Product";
import Search from "@/pages/Search";
import Checkout from "@/pages/Checkout";
import Track from "@/pages/Track";
import Login from "@/pages/Login";

import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminCoupons from "@/pages/admin/AdminCoupons";
import AdminReels from "@/pages/admin/AdminReels";
import AdminModels from "@/pages/admin/AdminModels";
import AdminSettings from "@/pages/admin/AdminSettings";

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/her" element={<Her />} />
              <Route path="/him" element={<Him />} />
              <Route path="/collab" element={<Collab />} />
              <Route path="/charms" element={<Charms />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/search" element={<Search />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/track" element={<Track />} />
              <Route path="/track/:id" element={<Track />} />
              <Route path="/login" element={<Login />} />

              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products"  element={<AdminProducts />} />
                <Route path="orders"    element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="coupons"   element={<AdminCoupons />} />
                <Route path="reels"     element={<AdminReels />} />
                <Route path="models"    element={<AdminModels />} />
                <Route path="settings"  element={<AdminSettings />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </div>
  );
}

export default App;
