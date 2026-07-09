import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";

interface CartItem {
  id: string;
  name: string;
  imageUrl?: string;
  image_path?: string;
  image?: string;
  discounted_price: number;
  original_price?: number;
  price?: number;
  quantity: number;
  tva?: string | number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage synchronously
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("florea_cart");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("florea_cart", JSON.stringify(cart));
  }, [cart]);

  // Sync cart across tabs
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "florea_cart") {
        const updatedCart = event.newValue ? JSON.parse(event.newValue) : [];
        setCart(updatedCart);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addToCart = (product: CartItem) => {
    setCart((prev) => {
      const exists = prev.find((item) => String(item.id) === String(product.id));
      if (exists) {
        // Increment quantity if already in cart
        return prev.map((item) =>
          String(item.id) === String(product.id)
            ? { ...item, quantity: item.quantity + (product.quantity || 1) }
            : item
        );
      }
      
      const resolvedDiscountedPrice = (product.discounted_price !== null && product.discounted_price !== undefined)
        ? Number(product.discounted_price)
        : Number(product.original_price || product.price || 0);

      const resolvedOriginalPrice = (product.original_price !== null && product.original_price !== undefined)
        ? Number(product.original_price)
        : Number(product.price || resolvedDiscountedPrice);

      return [
        ...prev, 
        { 
          ...product, 
          discounted_price: resolvedDiscountedPrice,
          original_price: resolvedOriginalPrice,
          quantity: product.quantity ?? 1 
        }
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => String(item.id) !== String(id)));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (String(item.id) === String(id) ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const total = cart.reduce((sum, item) => {
    const itemPrice = (item.discounted_price !== null && item.discounted_price !== undefined)
      ? Number(item.discounted_price)
      : Number(item.original_price || item.price || 0);
    return sum + itemPrice * item.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
};
