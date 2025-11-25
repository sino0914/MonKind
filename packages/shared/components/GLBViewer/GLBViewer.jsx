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

// 軸心輔助線組件 - 顯示 XYZ 三軸
function PivotHelper({ pivot, boundingBox, visible = false }) {
  if (!visible || !boundingBox) return null;

  // 計算軸心在實際座標中的位置
  const center = new THREE.Vector3();
  boundingBox.getCenter(center);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);

  // 將 -1 到 1 的比例值轉換為實際座標
  const pivotPosition = new THREE.Vector3(
    center.x + (pivot?.x || 0) * (size.x / 2),
    center.y + (pivot?.y || 0) * (size.y / 2),
    center.z + (pivot?.z || 0) * (size.z / 2)
  );

  // 輔助線長度（基於模型大小）
  const axisLength = Math.max(size.x, size.y, size.z) * 0.8;

  return (
    <group position={pivotPosition}>
      {/* X 軸 - 紅色 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-axisLength, 0, 0, axisLength, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ff0000" linewidth={2} />
      </line>
      {/* Y 軸 - 綠色 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -axisLength, 0, 0, axisLength, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00ff00" linewidth={2} />
      </line>
      {/* Z 軸 - 藍色 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, 0, -axisLength, 0, 0, axisLength])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#0088ff" linewidth={2} />
      </line>
      {/* 中心點球體 */}
      <mesh>
        <sphereGeometry args={[0.02, 16, 16]} />
        <meshBasicMaterial color="#ffff00" />
      </mesh>
    </group>
  );
}

// GLB模型組件 - Trackball 自由旋轉（類似 Blender）
function GLBModel({
  url,
  showWireframe = false,
  uvOverlay = false,
  rotation = [0, 0, 0],
  uvMapping,
  testTexture,
  isDragging,
  velocity,
  groupRef,
  pivot,
  showPivotHelper = false,
  onBoundingBoxCalculated,
}) {
  const { scene, materials } = useGLTF(url);
  const [boundingBox, setBoundingBox] = useState(null);
  const modelRef = useRef();

  // 複製場景以避免修改原始資料
  const clonedScene = scene.clone();

  // 計算模型邊界框
  useEffect(() => {
    if (clonedScene) {
      const box = new THREE.Box3().setFromObject(clonedScene);
      setBoundingBox(box);
      if (onBoundingBoxCalculated) {
        onBoundingBoxCalculated(box);
      }
    }
  }, [url]);

  // 處理慣性旋轉
  useFrame(() => {
    if (!isDragging && groupRef.current) {
      const velocityMagnitude = velocity.current.angle;

      if (velocityMagnitude > 0.0001) {
        // Trackball 慣性旋轉
        const quaternion = new THREE.Quaternion().setFromAxisAngle(
          velocity.current.axis,
          velocity.current.angle
        );
        groupRef.current.quaternion.multiplyQuaternions(quaternion, groupRef.current.quaternion);

        // 阻尼效果（減速）
        velocity.current.angle *= 0.95;
      }
    }
  });

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

  // 計算軸心偏移（用於旋轉）
  const pivotOffset = boundingBox ? (() => {
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    const size = new THREE.Vector3();
    boundingBox.getSize(size);
    return new THREE.Vector3(
      (pivot?.x || 0) * (size.x / 2),
      (pivot?.y || 0) * (size.y / 2),
      (pivot?.z || 0) * (size.z / 2)
    );
  })() : new THREE.Vector3(0, 0, 0);

  return (
    <group ref={groupRef} position={pivotOffset}>
      {/* 模型位置需要反向偏移，使旋轉軸心正確 */}
      <group position={[-pivotOffset.x, -pivotOffset.y, -pivotOffset.z]}>
        <primitive object={clonedScene} rotation={[0, 2.5, 0]} />
      </group>
      {/* 軸心輔助線 */}
      <PivotHelper
        pivot={pivot}
        boundingBox={boundingBox}
        visible={showPivotHelper}
      />
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
  pivot,
  showPivotHelper = false,
}) {
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const cameraPosition = [1, 1, 1]; // 固定攝影機位置

  // 物件旋轉狀態（整個 Canvas 都可拖曳）
  const [isDragging, setIsDragging] = useState(false);
  const previousMouse = useRef({ x: 0, y: 0 });
  const velocity = useRef({
    axis: new THREE.Vector3(0, 1, 0),
    angle: 0
  });
  const rotationSpeed = 0.005;
  const groupRef = useRef();

  // 拖拽事件處理
  const handlePointerDown = (e) => {
    // 只允許左鍵（button === 0）拖曳旋轉
    if (e.button !== 0) return;

    setIsDragging(true);
    previousMouse.current = {
      x: e.clientX,
      y: e.clientY,
    };
    velocity.current = {
      axis: new THREE.Vector3(0, 1, 0),
      angle: 0
    }; // 重置速度
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !groupRef.current) return;

    const deltaX = e.clientX - previousMouse.current.x;
    const deltaY = e.clientY - previousMouse.current.y;

    // Trackball 自由旋轉（類似 Blender）
    // 計算旋轉軸：垂直於滑鼠移動方向（Y 軸倒轉）
    const rotationAxis = new THREE.Vector3(deltaY, deltaX, 0).normalize();

    // 計算旋轉角度：基於滑鼠移動距離
    const rotationAngle = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * rotationSpeed;

    // 建立旋轉四元數
    const quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);

    // 應用旋轉到物體
    groupRef.current.quaternion.multiplyQuaternions(quaternion, groupRef.current.quaternion);

    // 記錄速度供慣性使用
    velocity.current.axis = rotationAxis;
    velocity.current.angle = rotationAngle;

    previousMouse.current = {
      x: e.clientX,
      y: e.clientY,
    };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
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
            isDragging={isDragging}
            velocity={velocity}
            groupRef={groupRef}
            pivot={pivot}
            showPivotHelper={showPivotHelper}
          />

          {/* 軌道控制器 - 禁用旋轉，保留縮放和平移 */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={false}
            target={[0, 0.3, 0]}
            autoRotate={false}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
