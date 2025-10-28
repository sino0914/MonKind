import { useState } from 'react';

/**
 * 自由變形 Hook
 * 管理非等比例縮放模式的狀態
 */
const useFreeTransform = () => {
  const [isFreeTransform, setIsFreeTransform] = useState(false);

  /**
   * 切換自由變形模式
   */
  const toggleFreeTransform = () => {
    setIsFreeTransform(prev => !prev);
    console.log('🔲 自由變形模式:', !isFreeTransform);
  };

  /**
   * 啟用自由變形模式
   */
  const enableFreeTransform = () => {
    setIsFreeTransform(true);
    console.log('🔲 啟用自由變形模式');
  };

  /**
   * 禁用自由變形模式
   */
  const disableFreeTransform = () => {
    setIsFreeTransform(false);
    console.log('🔲 禁用自由變形模式');
  };

  return {
    isFreeTransform,
    toggleFreeTransform,
    enableFreeTransform,
    disableFreeTransform
  };
};

export default useFreeTransform;
