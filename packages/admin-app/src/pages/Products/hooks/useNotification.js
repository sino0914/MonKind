import { useState, useCallback } from 'react';

/**
 * useNotification Hook
 * 管理通知訊息的顯示和隱藏
 */
export const useNotification = () => {
  const [notification, setNotification] = useState(null);

  /**
   * 顯示通知訊息
   * @param {string} message - 訊息內容
   * @param {string} type - 訊息類型 ('success' | 'error' | 'warning' | 'info')
   * @param {number} duration - 顯示時長(毫秒)，預設3000
   */
  const showNotification = useCallback((message, type = 'success', duration = 3000) => {
    setNotification({ message, type });

    if (duration > 0) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  }, []);

  /**
   * 顯示成功訊息
   */
  const showSuccess = useCallback((message, duration) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  /**
   * 顯示錯誤訊息
   */
  const showError = useCallback((message, duration) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  /**
   * 顯示警告訊息
   */
  const showWarning = useCallback((message, duration) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  /**
   * 顯示資訊訊息
   */
  const showInfo = useCallback((message, duration) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  /**
   * 手動關閉通知
   */
  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
  };
};
