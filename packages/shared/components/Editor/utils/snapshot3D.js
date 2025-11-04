/**
 * 3D 快照生成工具
 * 用於生成帶有貼圖的 3D 模型快照
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * 生成 UV 貼圖 Canvas
 * @param {Object} product - 商品資料
 * @param {Array} designElements - 設計元素
 * @param {string} backgroundColor - 背景顏色
 * @returns {Promise<HTMLCanvasElement|null>}
 */
const generateUVTexture = async (product, designElements, backgroundColor) => {
  if (!product || !product.printArea) return null;

  const { width: printWidth, height: printHeight } = product.printArea;

  // 3D 使用正方形畫布
  const maxSize = Math.max(printWidth, printHeight);
  const canvasWidth = maxSize;
  const canvasHeight = maxSize;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // 解析度倍率
  const scale = 3;
  canvas.width = canvasWidth * scale;
  canvas.height = canvasHeight * scale;
  ctx.scale(scale, scale);

  // 先白底，避免透明導致 three.js 看起來發黑
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 設計區域塗上背景色
  if (backgroundColor && backgroundColor !== '#ffffff') {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, printWidth, printHeight);
  }

  // 載入圖片工具
  const loadImage = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });

  // 依 zIndex 排序
  const sorted = [...designElements].sort(
    (a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)
  );

  // 逐一繪製元素
  for (const el of sorted) {
    if (!el) continue;

    // 設計區相對位置
    const relX = el.x - product.printArea.x;
    const relY = el.y - product.printArea.y;

    // 超出設計區就略過
    if (relX < 0 || relY < 0 || relX >= printWidth || relY >= printHeight) {
      continue;
    }

    if (el.type === 'text') {
      ctx.save();
      ctx.fillStyle = el.color || '#000000';
      ctx.font = `${el.fontWeight || 'normal'} ${el.fontStyle || 'normal'} ${
        el.fontSize || 16
      }px ${el.fontFamily || 'Arial'}`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      if (el.rotation && el.rotation !== 0) {
        ctx.translate(relX, relY);
        ctx.rotate((el.rotation * Math.PI) / 180);
        ctx.fillText(el.content || '', 0, 0);
      } else {
        ctx.fillText(el.content || '', relX, relY);
      }

      ctx.restore();
    }

    if (el.type === 'image') {
      let img = el.imageElement;
      if (!img && el.url) img = await loadImage(el.url);
      if (img) {
        // 計算實際渲染尺寸（考慮自由變形 scaleX/scaleY）
        const baseW = el.width || 100;
        const baseH = el.height || 100;
        const w = baseW * (el.scaleX || 1);
        const h = baseH * (el.scaleY || 1);

        ctx.save();

        if (el.rotation && el.rotation !== 0) {
          ctx.translate(relX, relY);
          ctx.rotate((el.rotation * Math.PI) / 180);

          // 檢查是否有蒙版數據
          if (el.hasMask && el.mask) {
            // 繪製蒙版後的圖片
            const mask = el.mask;

            // 計算蒙版在圖片中的位置（相對於圖片左上角）
            const maskLeft = mask.x - mask.width / 2;
            const maskTop = mask.y - mask.height / 2;
            const maskRight = mask.x + mask.width / 2;
            const maskBottom = mask.y + mask.height / 2;

            // 轉換為百分比
            const topPercent = maskTop / el.height;
            const rightPercent = 1 - maskRight / el.width;
            const bottomPercent = 1 - maskBottom / el.height;
            const leftPercent = maskLeft / el.width;

            // 計算實際剪裁區域（像素）
            const clipTop = topPercent * h;
            const clipRight = rightPercent * w;
            const clipBottom = bottomPercent * h;
            const clipLeft = leftPercent * w;

            // 應用剪裁
            ctx.save();
            ctx.beginPath();
            ctx.rect(
              -w / 2 + clipLeft,
              -h / 2 + clipTop,
              w - clipLeft - clipRight,
              h - clipTop - clipBottom
            );
            ctx.clip();
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
            ctx.restore();
          } else {
            // 無蒙版，直接繪製
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
          }
        } else {
          // 檢查是否有蒙版數據
          if (el.hasMask && el.mask) {
            // 繪製蒙版後的圖片
            const mask = el.mask;

            // 計算蒙版在圖片中的位置（相對於圖片左上角）
            const maskLeft = mask.x - mask.width / 2;
            const maskTop = mask.y - mask.height / 2;
            const maskRight = mask.x + mask.width / 2;
            const maskBottom = mask.y + mask.height / 2;

            // 轉換為百分比
            const topPercent = maskTop / el.height;
            const rightPercent = 1 - maskRight / el.width;
            const bottomPercent = 1 - maskBottom / el.height;
            const leftPercent = maskLeft / el.width;

            // 計算實際剪裁區域（像素）
            const clipTop = topPercent * h;
            const clipRight = rightPercent * w;
            const clipBottom = bottomPercent * h;
            const clipLeft = leftPercent * w;

            // 應用剪裁
            ctx.save();
            ctx.beginPath();
            ctx.rect(
              relX - w / 2 + clipLeft,
              relY - h / 2 + clipTop,
              w - clipLeft - clipRight,
              h - clipTop - clipBottom
            );
            ctx.clip();
            ctx.drawImage(img, relX - w / 2, relY - h / 2, w, h);
            ctx.restore();
          } else {
            // 無蒙版，直接繪製
            ctx.drawImage(img, relX - w / 2, relY - h / 2, w, h);
          }
        }

        ctx.restore();
      }
    }
  }

  return canvas;
};

/**
 * 生成 3D 模型快照
 * @param {Object} product - 商品資料（包含 glbUrl）
 * @param {Array} designElements - 設計元素
 * @param {string} backgroundColor - 背景顏色
 * @param {number} width - 快照寬度
 * @param {number} height - 快照高度
 * @returns {Promise<string|null>} - 返回 base64 圖片字串
 */
export const generate3DSnapshot = async (
  product,
  designElements,
  backgroundColor,
  width = 400,
  height = 400
) => {
  const glbUrl = product?.glbUrl || product?.model3D?.glbUrl;
  if (!product || !glbUrl || product.type !== '3D') {
    console.warn('無法生成 3D 快照：商品不是 3D 類型或缺少 GLB URL');
    return null;
  }

  try {
    // 1. 生成 UV 貼圖
    const textureCanvas = await generateUVTexture(
      product,
      designElements,
      backgroundColor
    );
    if (!textureCanvas) {
      console.warn('生成 UV 貼圖失敗');
      return null;
    }

    // 2. 創建 Three.js 場景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    // 3. 創建相機
    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.set(0.5, 0.5, 1);
    camera.lookAt(0, 0.3, 0);

    // 4. 創建離屏渲染器
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);

    // 5. 添加燈光（增強亮度）
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2); // 提高環境光強度
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 3.5); // 提高主光源強度
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    const frontLight = new THREE.DirectionalLight(0xffffff, 5.2); // 新增正面補光
    frontLight.position.set(0, 5, 10);
    scene.add(frontLight);

    const pointLight = new THREE.PointLight(0xffffff, 2.2); // 提高點光源強度
    pointLight.position.set(-10, -10, -5);
    scene.add(pointLight);

    // 6. 載入 GLB 模型
    const loader = new GLTFLoader();
    const gltf = await new Promise((resolve, reject) => {
      loader.load(
        glbUrl,
        (gltf) => resolve(gltf),
        undefined,
        (error) => reject(error)
      );
    });

    // 手動收集所有材質（模擬 useGLTF 的行為）
    const materials = {};
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat, index) => {
            const key = mat.name || `material_${Object.keys(materials).length}`;
            materials[key] = mat;
          });
        } else {
          const key = child.material.name || `material_${Object.keys(materials).length}`;
          materials[key] = child.material;
        }
      }
    });

    const model = gltf.scene;
    model.rotation.y = 2.5;
    scene.add(model);

    // 7. 應用貼圖到模型
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    // 應用 UV 映射設定（與 ProductPreview 保持一致，使用固定的完整範圍）
    const uvMapping = {
      defaultUV: {
        u: 0.5,
        v: 0.5,
        width: 1,
        height: 1,
      },
    };

    if (uvMapping.defaultUV) {
      const { u, v, width: uvWidth, height: uvHeight } = uvMapping.defaultUV;
      texture.offset.set(u - uvWidth / 2, v - uvHeight / 2);
      texture.repeat.set(uvWidth, -uvHeight);
    }

    // 使用收集到的 materials 應用貼圖
    Object.values(materials).forEach((material) => {
      if (material) {
        material.map = texture;
        material.needsUpdate = true;
      }
    });

    // 8. 渲染場景
    renderer.render(scene, camera);

    // 9. 轉換為 base64
    const snapshot = canvas.toDataURL('image/jpeg', 0.85);

    // 10. 清理資源
    renderer.dispose();
    scene.traverse((object) => {
      if (object.geometry) {
        object.geometry.dispose();
      }
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    texture.dispose();

    return snapshot;
  } catch (error) {
    console.error('生成 3D 快照失敗:', error);
    return null;
  }
};
