import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * 畫布視窗控制 Hook
 * 處理畫布的縮放和平移功能
 *
 * @param {Object} initialViewport - 初始視圖設定
 * @param {number} initialViewport.zoom - 初始縮放倍率 (0.5 ~ 3.0)
 * @param {number} initialViewport.panX - 初始 X 軸平移
 * @param {number} initialViewport.panY - 初始 Y 軸平移
 */
const useCanvasViewport = (initialViewport = null) => {
  // 縮放倍率（0.5 - 3.0）
  const [zoom, setZoom] = useState(initialViewport?.zoom ?? 1.0);
  // 平移位置
  const [pan, setPan] = useState({
    x: initialViewport?.panX ?? 0,
    y: initialViewport?.panY ?? 0
  });
  // 是否正在平移
  const [isPanning, setIsPanning] = useState(false);
  // 平移起始點
  const panStartRef = useRef({ x: 0, y: 0 });
  const panOffsetRef = useRef({ x: 0, y: 0 });

  // 縮放範圍限制
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 3.0;
  const ZOOM_STEP = 0.1;

  /**
   * 處理滾輪縮放
   * 以滑鼠位置為中心縮放，並阻止外層捲動
   */
  const handleWheel = useCallback((e) => {
    // 阻止事件冒泡和預設行為，防止觸發外層捲動
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));

    // 計算縮放中心點（以滑鼠位置為中心）
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left - rect.width / 2;
    const mouseY = e.clientY - rect.top - rect.height / 2;

    // 調整平移位置，使縮放中心在滑鼠位置
    const zoomRatio = newZoom / zoom;
    setPan({
      x: mouseX - (mouseX - pan.x) * zoomRatio,
      y: mouseY - (mouseY - pan.y) * zoomRatio,
    });

    setZoom(newZoom);
  }, [zoom, pan]);

  /**
   * 處理滑鼠按下（中鍵）
   */
  const handleMouseDown = useCallback((e) => {
    // 檢查是否為滑鼠中鍵
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY };
      panOffsetRef.current = { ...pan };
    }
  }, [pan]);

  /**
   * 處理滑鼠移動（平移）
   */
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      e.preventDefault();
      const deltaX = e.clientX - panStartRef.current.x;
      const deltaY = e.clientY - panStartRef.current.y;

      setPan({
        x: panOffsetRef.current.x + deltaX,
        y: panOffsetRef.current.y + deltaY,
      });
    }
  }, [isPanning]);

  /**
   * 處理滑鼠放開
   */
  const handleMouseUp = useCallback((e) => {
    if (e.button === 1 || isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  /**
   * 重置視圖
   */
  const resetView = useCallback(() => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
    setIsPanning(false);
  }, []);

  /**
   * 設定視圖（用於載入預設視圖或切換商品時）
   */
  const setViewport = useCallback((viewport) => {
    if (viewport) {
      setZoom(viewport.zoom ?? 1.0);
      setPan({
        x: viewport.panX ?? 0,
        y: viewport.panY ?? 0
      });
    }
    setIsPanning(false);
  }, []);

  /**
   * 當 initialViewport 變化時（例如從 API 載入商品後），更新視圖
   * 這是為了處理非同步載入的情況
   */
  useEffect(() => {
    if (initialViewport) {
      console.log('📐 套用預設視圖:', initialViewport);
      setZoom(initialViewport.zoom ?? 1.0);
      setPan({
        x: initialViewport.panX ?? 0,
        y: initialViewport.panY ?? 0
      });
    }
  }, [initialViewport?.zoom, initialViewport?.panX, initialViewport?.panY]);

  /**
   * 鍵盤快捷鍵：Ctrl+0 重置視圖
   */
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '0') {
        e.preventDefault();
        resetView();
      }
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom + delta));
        setZoom(newZoom);
      }
      if (e.key === '-') {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom - delta));
        setZoom(newZoom);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetView,zoom]);

  /**
   * 滑鼠離開時停止平移
   */
  const handleMouseLeave = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  return {
    zoom,
    pan,
    isPanning,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    resetView,
    setViewport,
    setZoom,
    setPan,
  };
};

export default useCanvasViewport;
