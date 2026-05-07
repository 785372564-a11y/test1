import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewcube, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import Effects from './post/Effects';
import ComponentRouter from './components/ComponentRouter';
import { useViewStore } from '@/store/viewStore';

export default function Scene() {
  const showGrid = useViewStore((s) => s.showGrid);
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [4.5, 3.5, 5], fov: 40, near: 0.05, far: 200 }}
      gl={{ antialias: true, logarithmicDepthBuffer: true, localClippingEnabled: true } as any}
    >
      <color attach="background" args={['#ffffff']} />

      <hemisphereLight args={['#ffffff', '#d8dde6', 0.7]} />

      <directionalLight
        position={[6, 10, 4]}
        intensity={2.4}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-8}
        shadow-bias={-0.0002}
      />
      <directionalLight position={[-5, 4, -3]} intensity={0.8} color="#a8c4ff" />
      <directionalLight position={[2, -3, 5]} intensity={0.4} color="#fff5e0" />
      <ambientLight intensity={0.35} />

      <Suspense fallback={null}>
        <ComponentRouter />
      </Suspense>

      <ContactShadows position={[0, -0.001, 0]} opacity={0.5} blur={2.5} far={6} resolution={1024} />

      {showGrid && (
        <Grid
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={0.5}
          cellColor="#334155"
          sectionSize={2}
          sectionThickness={1.2}
          sectionColor="#64748b"
          fadeDistance={25}
          fadeStrength={1}
          infiniteGrid
          position={[0, -0.0005, 0]}
        />
      )}

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={0.8} maxDistance={30} />
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewcube color="#0ea5e9" textColor="#fff" strokeColor="#1e293b" />
      </GizmoHelper>

      <Effects />
    </Canvas>
  );
}
