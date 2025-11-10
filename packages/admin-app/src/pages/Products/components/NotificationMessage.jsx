import React from 'react';

/**
 * NotificationMessage Component
 * 顯示懸浮通知訊息
 *
 * @param {Object} notification - 通知物件 { message: string, type: 'success' | 'error' | 'warning' | 'info' }
 */
const NotificationMessage = ({ notification }) => {
  if (!notification) return null;

  const getTypeStyles = (type) => {
    const styles = {
      success: 'bg-green-500 text-white',
      error: 'bg-red-500 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-500 text-white',
    };
    return styles[type] || styles.success;
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${getTypeStyles(
        notification.type
      )}`}
    >
      <div className="flex items-center">
        <div className="flex-1">
          <span className="text-sm font-medium">{notification.message}</span>
        </div>
        <div className="ml-3 w-2 h-2 rounded-full bg-white animate-pulse"></div>
      </div>
    </div>
  );
};

export default NotificationMessage;
