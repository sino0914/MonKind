import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, Environment, Grid } from '@react-three/drei';
import * as THREE from 'three';

// GLB模型組件
function GLBModel({ url, showWireframe = false, uvOverlay = false }) {
  const group = useRef();
  const { scene, materials } = useGLTF(url);

  // 複製場景以避免修改原始資料
  const clonedScene = scene.clone();

  useEffect(() => {
    if (showWireframe && materials) {
      Object.values(materials).forEach(material => {
        if (material) {
          material.wireframe = showWireframe;
        }
      });
    }
  }, [showWireframe, materials]);

  useFrame(() => {
    if (group.current) {
      group.current.rotation.y += 0.005; // 自動旋轉
    }
  });

  return (
    <group ref={group}>
      <primitive object={clonedScene} />
    </group>
  );
}

// 載入指示器
function LoadingSpinner() {
  return (
    <Html center>
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="mt-2 text-sm text-gray-600">載入3D模型中...</div>
      </div>
    </Html>
  );
}

// 主要GLB查看器組件
export default function GLBViewer({
  glbUrl,
  className = "",
  showControls = true,
  autoRotate = true
}) {
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraPosition, setCameraPosition] = useState([5, 5, 5]);

  if (!glbUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">尚未上傳3D模型</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {/* 環境光和方向光 */}
          <Environment preset="studio" />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={0.5} />

          {/* 網格地面 */}
          {showGrid && (
            <Grid
              position={[0, -2, 0]}
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor={'#6f6f6f'}
              sectionSize={2}
              sectionThickness={1}
              sectionColor={'#9d4b4b'}
              fadeDistance={25}
              fadeStrength={1}
            />
          )}

          {/* GLB模型 */}
          <GLBModel
            url={glbUrl}
            showWireframe={showWireframe}
          />

          {/* 軌道控制器 */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>

      {/* 控制面板 */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 rounded-lg p-3 space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="wireframe"
              checked={showWireframe}
              onChange={(e) => setShowWireframe(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="wireframe" className="text-white text-sm cursor-pointer">
              線框模式
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="grid"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="grid" className="text-white text-sm cursor-pointer">
              顯示網格
            </label>
          </div>
        </div>
      )}

      {/* 視角控制 */}
      {showControls && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 rounded-lg p-3">
          <div className="text-white text-xs mb-2">視角預設</div>
          <div className="grid grid-cols-2 gap-1">
            <button
              onClick={() => setCameraPosition([0, 0, 5])}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              正面
            </button>
            <button
              onClick={() => setCameraPosition([5, 0, 0])}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              側面
            </button>
            <button
              onClick={() => setCameraPosition([0, 5, 0])}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              頂部
            </button>
            <button
              onClick={() => setCameraPosition([5, 5, 5])}
              className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-white rounded"
            >
              等角
            </button>
          </div>
        </div>
      )}

      {/* 底部資訊 */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 rounded-lg px-3 py-1">
        <div className="text-white text-xs">
          🖱️ 拖拽旋轉 | 🔄 滾輪縮放 | ⌨️ 右鍵平移
        </div>
      </div>
    </div>
  );
}