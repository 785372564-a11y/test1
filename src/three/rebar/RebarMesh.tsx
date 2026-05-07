import * as THREE from 'three';
import { useMemo } from 'react';
import { FilletedPolylineCurve3, defaultBendRadius } from './RebarCurve';
import type { Rebar } from './types';
import { getSteelMaterial } from '@/three/materials/steel';
import { useViewStore } from '@/store/viewStore';

interface Props {
  rebar: Rebar;
  /** 单位转换：mm -> 场景米。默认 0.001 */
  scale?: number;
}

const TUBE_RADIAL = 14;
const TUBE_SEG_PER_M = 30;

export default function RebarMesh({ rebar, scale = 0.001 }: Props) {
  const renderMode = useViewStore((s) => s.renderMode);
  const selectedId = useViewStore((s) => s.selectedRebarId);
  const setSel = useViewStore((s) => s.set);

  const geom = useMemo(() => {
    const r = rebar.bendRadius ?? defaultBendRadius(rebar.diameter, rebar.grade);
    const curve = new FilletedPolylineCurve3(rebar.polyline, r);
    const len = curve.getLength();
    if (len <= 0) {
      console.warn('[Rebar] zero-length curve', rebar.id, rebar.polyline);
    }
    const tubular = Math.max(20, Math.min(800, Math.round((len * scale) * TUBE_SEG_PER_M)));
    // 注意：curve 顶点在 mm 空间，半径也用 mm；统一由外层 mesh/instance 的 scale 转换到米
    const g = new THREE.TubeGeometry(curve, tubular, rebar.diameter / 2, TUBE_RADIAL, false);
    // 检查首点是否 NaN，定位 Curve 实现 bug
    const pos = g.attributes.position;
    if (pos.count > 0) {
      const x = pos.getX(0), y = pos.getY(0), z = pos.getZ(0);
      if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) {
        console.error('[Rebar] NaN in TubeGeometry', rebar.id, rebar.polyline);
      }
    }
    return g;
  }, [rebar, scale]);

  const mat = useMemo(
    () => getSteelMaterial({ role: rebar.role, grade: rebar.grade, mode: renderMode }),
    [rebar.role, rebar.grade, renderMode],
  );

  const isSelected = selectedId === rebar.id;
  const matFinal = useMemo(() => {
    if (!isSelected) return mat;
    const m = mat.clone();
    m.emissive = new THREE.Color('#fff');
    m.emissiveIntensity = 0.4;
    return m;
  }, [mat, isSelected]);

  if (!rebar.instances || rebar.instances.length === 0) {
    return (
      <mesh
        geometry={geom}
        material={matFinal}
        scale={[scale, scale, scale]}
        castShadow
        receiveShadow
        onClick={(e) => { e.stopPropagation(); setSel({ selectedRebarId: rebar.id }); }}
      />
    );
  }

  // 实例化（箍筋）
  return (
    <InstancedRebar geom={geom} mat={matFinal} rebar={rebar} scale={scale} />
  );
}

function InstancedRebar({
  geom, mat, rebar, scale,
}: { geom: THREE.BufferGeometry; mat: THREE.Material; rebar: Rebar; scale: number }) {
  const setSel = useViewStore((s) => s.set);
  const ref = useMemo(() => ({ obj: null as THREE.InstancedMesh | null }), []);
  const instances = rebar.instances!;
  const matrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const out: THREE.Matrix4[] = [];
    for (const inst of instances) {
      dummy.position.set(inst.offset[0] * scale, inst.offset[1] * scale, inst.offset[2] * scale);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      out.push(dummy.matrix.clone());
    }
    return out;
  }, [instances, scale]);

  return (
    <instancedMesh
      ref={(o: THREE.InstancedMesh | null) => {
        ref.obj = o;
        if (o) {
          for (let i = 0; i < matrices.length; i++) o.setMatrixAt(i, matrices[i]);
          o.instanceMatrix.needsUpdate = true;
          o.count = matrices.length;
          o.castShadow = true;
          o.receiveShadow = true;
        }
      }}
      args={[geom, mat, instances.length]}
      onClick={(e) => { e.stopPropagation(); setSel({ selectedRebarId: rebar.id }); }}
    />
  );
}
