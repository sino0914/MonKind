import React, { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  useGLTF,
  Html,
  Environment,
  Grid,
} from "@react-three/drei";
import * as THREE from "three";

// GLB模型組件
function GLBModel({
  url,
  showWireframe = false,
  uvOverlay = false,
  rotation = [0, 0, 0],
  uvMapping,
  testTexture,
}) {
  const group = useRef();
  const { scene, materials } = useGLTF(url);

  // 複製場景以避免修改原始資料
  const clonedScene = scene.clone();

  useEffect(() => {
    if (showWireframe && materials) {
      Object.values(materials).forEach((material) => {
        if (material) {
          material.wireframe = showWireframe;
        }
      });
    }

    // 應用測試貼圖和 UV 設定
    if (testTexture && uvMapping && materials) {
      Object.values(materials).forEach((material) => {
        if (material) {
          // 建立新的貼圖
          const texture = new THREE.CanvasTexture(testTexture);
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          // 應用 UV 偏移和縮放（翻轉 Y 軸）
          if (uvMapping.defaultUV) {
            const { u, v, width, height } = uvMapping.defaultUV;
            texture.offset.set(u - width / 2, v - height / 2);
            texture.repeat.set(width, -height); // 負值來翻轉 Y 軸
          }

          // 用 LinearSRGBColorSpace 以避免發白
          texture.colorSpace = THREE.SRGBColorSpace;

          // 設定到材質
          material.map = texture;
          material.needsUpdate = true;
        }
      });
    }
  }, [showWireframe, materials, testTexture, uvMapping]);

  return (
    <group ref={group}>
      <primitive object={clonedScene} rotation={rotation} />
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
  autoRotate = true,
  uvMapping,
  testTexture,
}) {
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraPosition, setCameraPosition] = useState([1, 1, 1]);

  if (!glbUrl) {
    return (
      <div
        className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}
      >
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">尚未上傳3D模型</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: cameraPosition, fov: 50 }}
        style={{ width: "100%", height: "100%" }}
      >
        <Suspense fallback={<LoadingSpinner />}>
          {/* 環境光和方向光 */}
          <Environment preset="city" />
          <ambientLight intensity={1} />
          <directionalLight position={[15, 5, 5]} intensity={5} castShadow />
          <directionalLight position={[-15, 5, 15]} intensity={6} castShadow />
          <pointLight position={[-10, -10, -5]} intensity={2.2} />

          {/* 網格地面 */}
          {false && (
            <Grid
              position={[0, -1, 0]}
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor={"#6f6f6f"}
              sectionSize={2}
              sectionThickness={1}
              sectionColor={"#9d4b4b"}
              fadeDistance={25}
              fadeStrength={1}
            />
          )}

          {/* GLB模型 */}
          <GLBModel
            url={glbUrl}
            showWireframe={showWireframe}
            rotation={[0, 2.5, 0]}
            uvMapping={uvMapping}
            testTexture={testTexture}
          />

          {/* 軌道控制器 */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            target={[0, 0.3, 0]}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
