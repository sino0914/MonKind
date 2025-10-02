import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';

const CartContext = createContext();

// 簡化版的圖片優化（從 storageUtils.js 借用邏輯）
const optimizeCartData = (cart) => {
  return cart.map(item => {
    if (item.designData && item.designData.elements) {
      // 優化設計數據中的圖片
      const optimizedElements = item.designData.elements.map(element => {
        if (element.type === 'image' && element.url && element.url.startsWith('data:')) {
          // 移除 base64 圖片，只保留引用標記
          return {
            ...element,
            url: 'removed_for_storage', // 標記為已移除
            _note: '圖片因容量限制已移除，請重新設計'
          };
        }
        return element;
      });

      return {
        ...item,
        designData: {
          ...item.designData,
          elements: optimizedElements
        }
      };
    }
    return item;
  });
};

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
      return [...state, { ...action.payload, quantity: 1 }];
    case 'REMOVE_FROM_CART':
      return state.filter(item => item.id !== action.payload);
    case 'UPDATE_QUANTITY':
      return state.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
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

  useEffect(() => {
    const savedCart = localStorage.getItem('shopping-cart');
    console.log('🛒 載入購物車資料:', savedCart);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('✅ 成功解析購物車:', parsedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('❌ 購物車資料解析失敗:', error);
        localStorage.removeItem('shopping-cart');
      }
    } else {
      console.log('📭 沒有找到購物車資料');
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // 只有在初始化完成後才保存
    if (isInitialized) {
      console.log('💾 保存購物車到 localStorage:', cart);

      try {
        // 優化購物車數據，移除大型圖片
        const optimizedCart = optimizeCartData(cart);
        const cartString = JSON.stringify(optimizedCart);

        // 檢查大小
        const sizeKB = new Blob([cartString]).size / 1024;
        console.log(`購物車大小: ${sizeKB.toFixed(2)} KB`);

        if (sizeKB > 2048) {
          console.warn('購物車數據過大，已優化但仍可能導致儲存失敗');
        }

        localStorage.setItem('shopping-cart', cartString);
      } catch (error) {
        console.error('購物車儲存失敗:', error);

        if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
          alert('購物車儲存失敗：儲存空間不足！\n\n建議：\n1. 清理舊草稿或圖片\n2. 直接結帳而不儲存到購物車\n3. 使用「測試輸出」功能匯出設計');
        }
      }
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