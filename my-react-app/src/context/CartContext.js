import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { API } from '../services/api';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return action.payload;
    case 'ADD_TO_CART':
      const existingItem = state.find(item => item.id === action.payload.id);
      if (existingItem) {
        return state.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...state, { ...action.payload, quantity: action.payload.quantity || 1 }];
    case 'REMOVE_FROM_CART':
      return state.filter(item => item.id !== action.payload);
    case 'UPDATE_QUANTITY':
      return state.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    case 'UPDATE_CART_ITEM':
      return state.map(item =>
        item.id === action.payload.id
          ? { ...item, ...action.payload.updates }
          : item
      );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [cart, dispatch] = useReducer(cartReducer, []);
  const [isInitialized, setIsInitialized] = useState(false);

  // 從 API 載入購物車
  useEffect(() => {
    const loadCart = async () => {
      try {
        console.log('🛒 從 API 載入購物車資料');
        const cartData = await API.cart.get();
        console.log('✅ 成功載入購物車:', cartData);
        dispatch({ type: 'LOAD_CART', payload: cartData });
      } catch (error) {
        console.error('❌ 購物車資料載入失敗:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    loadCart();
  }, []);

  // 保存購物車到 API（使用防抖避免頻繁儲存）
  useEffect(() => {
    // 只有在初始化完成後才保存
    if (isInitialized) {
      const timer = setTimeout(async () => {
        try {
          console.log('💾 保存購物車到 API:', cart);
          await API.cart.update(cart);
          console.log('✅ 購物車已成功保存');
        } catch (error) {
          console.error('❌ 購物車儲存失敗:', error);
          alert('購物車儲存失敗！請稍後再試。');
        }
      }, 300); // 延遲 300ms 保存，避免連續操作導致覆蓋

      return () => clearTimeout(timer);
    }
  }, [cart, isInitialized]);

  const addToCart = (product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (productId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
    }
  };

  const updateCartItem = (productId, updates) => {
    dispatch({ type: 'UPDATE_CART_ITEM', payload: { id: productId, updates } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    clearCart,
    getCartTotal,
    getCartItemsCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};