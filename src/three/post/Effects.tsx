import { EffectComposer, N8AO, SMAA, Bloom } from '@react-three/postprocessing';
import { useViewStore } from '@/store/viewStore';

export default function Effects() {
  const enabled = useViewStore((s) => s.postFx);
  if (!enabled) return null;
  return (
    <EffectComposer multisampling={0}>
      <N8AO aoRadius={0.4} intensity={2.5} distanceFalloff={0.6} quality="medium" />
      <Bloom mipmapBlur intensity={0.18} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
      <SMAA />
    </EffectComposer>
  );
}
