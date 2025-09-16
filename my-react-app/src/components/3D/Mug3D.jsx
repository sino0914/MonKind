import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

// ✅ Hook: 建立帶上下留白的 Texture
function useTextureWithMargins(designElements, product, topMargin = 0.1, bottomMargin = 0.1, handleWidth = 0.25) {
  const [texture, setTexture] = useState(null);

  useEffect(() => {
    if (!designElements.length || !product.printArea) {
      // 沒有設計元素時，創建白色材質
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 384;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const newTexture = new THREE.CanvasTexture(canvas);
      newTexture.needsUpdate = true;
      setTexture(newTexture);
      return;
    }

    // 創建設計畫布
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext("2d");

    // 白色背景
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 計算可繪製區域（上下留白）
    const availableHeight = canvas.height * (1 - topMargin - bottomMargin);
    const startY = canvas.height * topMargin;

    // 繪製設計元素
    designElements.forEach((element) => {
      if (element.type === 'text') {
        // 計算文字在設計區域內的相對位置
        const relativeX = element.x - product.printArea.x;
        const relativeY = element.y - product.printArea.y;

        // 只繪製在設計區域內的文字
        if (relativeX >= 0 && relativeX <= product.printArea.width &&
            relativeY >= 0 && relativeY <= product.printArea.height) {

          // 轉換為canvas座標
          const canvasX = (relativeX / product.printArea.width) * canvas.width;
          const canvasY = startY + (relativeY / product.printArea.height) * availableHeight;

          ctx.font = `${element.fontSize * 2}px ${element.fontFamily}`;
          ctx.fillStyle = element.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(element.content, canvasX, canvasY);
        }
      }
    });

    // 👉 把手留白 (在右側畫一個白色矩形)
    const blankWidth = canvas.width * handleWidth;
    ctx.fillStyle = "white";
    ctx.fillRect(canvas.width - blankWidth, 0, blankWidth, canvas.height);

    // 輸出成 Texture
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.needsUpdate = true;
    setTexture(newTexture);

  }, [designElements, product.printArea, topMargin, bottomMargin, handleWidth]);

  return texture;
}

// 馬克杯3D模型組件
function MugMesh({ designElements, product }) {
  const meshRef = useRef();
  const texture = useTextureWithMargins(designElements, product, 0.1, 0.1, 0.25);

  // 移除自動旋轉，保持UV固定
  // useFrame(() => {
  //   if (meshRef.current) {
  //     meshRef.current.rotation.y += 0.005;
  //   }
  // });

  useEffect(() => {
    if (texture) {
      texture.needsUpdate = true;
    }
  }, [texture]);

  return (
    <mesh ref={meshRef} key={texture ? texture.uuid : "empty"}>
      <cylinderGeometry args={[1, 1, 1.5, 64, 1, false]} />

      {/* 側面 */}
      <meshStandardMaterial
        attach="material-0"
        map={texture || null}
        color={texture ? "white" : "white"}
        side={THREE.DoubleSide}
        mapOffset={[0.25, 0]}
      />

      {/* 上下蓋 */}
      <meshStandardMaterial attach="material-1" color="gray" />
      <meshStandardMaterial attach="material-2" color="gray" />
    </mesh>
  );
}

// 把手組件
function MugHandle() {
  return (
    <mesh position={[1.1, 0, 0]} rotation={[0, 0, 0]}>
      <torusGeometry args={[0.3, 0.05, 8, 16, Math.PI]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

// 主要的3D馬克杯組件
const Mug3D = ({ designElements = [], product }) => {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 1, 3], fov: 50 }}
        style={{ background: '#f0f0f0' }}
      >
        {/* 環境光 */}
        <ambientLight intensity={0.6} />

        {/* 主光源 */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
        />

        {/* 馬克杯主體 */}
        <MugMesh designElements={designElements} product={product} />

        {/* 把手 */}
        <MugHandle />

        {/* 軌道控制 */}
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>
    </div>
  );
};

export default Mug3D;