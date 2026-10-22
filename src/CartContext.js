import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';

const CartContext = createContext(null);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }) {
  const [shop, setShop] = useState(null); // one shop per order
  const [items, setItems] = useState({}); // { productId: { id, name, price, qty } }

  const clear = () => {
    setShop(null);
    setItems({});
  };

  const add = (forShop, product) => {
    if (shop && shop.id !== forShop.id && Object.keys(items).length > 0) {
      Alert.alert(
        'Start a new cart?',
        `Your cart has items from ${shop.name}. One order can only have one shop.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'New cart',
            style: 'destructive',
            onPress: () => {
              setShop(forShop);
              setItems({ [product.id]: { id: product.id, name: product.name, price: product.price, qty: 1 } });
            },
          },
        ]
      );
      return;
    }
    setShop(forShop);
    setItems((prev) => {
      const cur = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          id: product.id,
          name: product.name,
          price: product.price,
          qty: (cur?.qty || 0) + 1,
        },
      };
    });
  };

  const remove = (productId) => {
    setItems((prev) => {
      const cur = prev[productId];
      if (!cur) return prev;
      const next = { ...prev };
      if (cur.qty <= 1) delete next[productId];
      else next[productId] = { ...cur, qty: cur.qty - 1 };
      if (Object.keys(next).length === 0) setShop(null);
      return next;
    });
  };

  const list = Object.values(items);
  const count = list.reduce((n, i) => n + i.qty, 0);
  const subtotal = list.reduce((n, i) => n + i.qty * Number(i.price || 0), 0);

  return (
    <CartContext.Provider value={{ shop, items, list, count, subtotal, add, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}
