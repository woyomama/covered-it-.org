import { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);
const KEY = "ci_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const addItem = (product, phone_model) => {
    setItems((curr) => {
      const key = `${product.id}|${phone_model || "_none_"}`;
      const idx = curr.findIndex((i) => `${i.product_id}|${i.phone_model || "_none_"}` === key);
      if (idx >= 0) {
        const next = [...curr]; next[idx].qty += 1; return next;
      }
      return [...curr, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: (product.images || [])[0] || "",
        category: product.category,
        qty: 1,
        phone_model: phone_model || "",
      }];
    });
  };

  const updateQty = (key, qty) => {
    setItems((curr) => curr.map((i) => `${i.product_id}|${i.phone_model || "_none_"}` === key ? { ...i, qty: Math.max(1, qty) } : i));
  };

  const setModel = (key, model) => {
    setItems((curr) => curr.map((i) => `${i.product_id}|${i.phone_model || "_none_"}` === key ? { ...i, phone_model: model } : i));
  };

  const removeItem = (key) => {
    setItems((curr) => curr.filter((i) => `${i.product_id}|${i.phone_model || "_none_"}` !== key));
  };

  const clear = () => setItems([]);

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, addItem, updateQty, setModel, removeItem, clear, subtotal, count }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
