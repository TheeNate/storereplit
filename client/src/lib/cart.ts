import { useState, useEffect } from 'react';

export interface CartItem {
  designId: number;
  sizeOptionId: number;
  designTitle: string;
  designImage: string;
  sizeOptionName: string;
  price: string;
  quantity: number;
  customerInfo?: {
    name: string;
    email: string;
    address: string;
    notes?: string;
  };
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

const CART_STORAGE_KEY = 'btc-glass-cart';

// Load cart from localStorage
const loadCartFromStorage = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading cart from storage:', error);
    return [];
  }
};

// Save cart to localStorage
const saveCartToStorage = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to storage:', error);
  }
};

// Calculate cart totals
const calculateCartTotals = (items: CartItem[]) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  
  return { totalItems, totalPrice };
};

// Custom hook for cart management
export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart on mount
  useEffect(() => {
    const storedItems = loadCartFromStorage();
    setItems(storedItems);
    setIsLoaded(true);
  }, []);

  // Save cart whenever items change
  useEffect(() => {
    if (isLoaded) {
      saveCartToStorage(items);
    }
  }, [items, isLoaded]);

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        cartItem => cartItem.designId === item.designId && cartItem.sizeOptionId === item.sizeOptionId
      );

      if (existingItemIndex >= 0) {
        // Item exists, increment quantity
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += 1;
        return updatedItems;
      } else {
        // New item, add to cart
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (designId: number, sizeOptionId: number) => {
    setItems(prevItems => 
      prevItems.filter(item => 
        !(item.designId === designId && item.sizeOptionId === sizeOptionId)
      )
    );
  };

  const updateQuantity = (designId: number, sizeOptionId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(designId, sizeOptionId);
      return;
    }

    setItems(prevItems =>
      prevItems.map(item =>
        item.designId === designId && item.sizeOptionId === sizeOptionId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getCartState = (): CartState => {
    const { totalItems, totalPrice } = calculateCartTotals(items);
    return { items, totalItems, totalPrice };
  };

  return {
    ...getCartState(),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isLoaded,
  };
};