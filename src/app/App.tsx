import Scene from '@/three/Scene';
import ParamPanel from '@/ui/ParamPanel';
import Toolbar from '@/ui/Toolbar';
import Legend from '@/ui/Legend';
import RebarTable from '@/ui/RebarTable';
import ViewControls from '@/ui/ViewControls';

export default function App() {
  return (
    <div className="relative h-screen w-screen overflow-hidden text-slate-800" style={{ background: '#ffffff' }}>
      <Scene />
      <Toolbar />
      <ParamPanel />
      <RebarTable />
      <ViewControls />
      <Legend />
    </div>
  );
}
