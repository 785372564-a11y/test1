import { useModelStore } from '@/store/modelStore';
import Beam from './Beam';
import Column from './Column';
import Slab from './Slab';
import Wall from './Wall';
import Foundation from './Foundation';

export default function ComponentRouter() {
  const kind = useModelStore((s) => s.kind);
  switch (kind) {
    case 'beam': return <Beam />;
    case 'column': return <Column />;
    case 'slab': return <Slab />;
    case 'wall': return <Wall />;
    case 'foundation': return <Foundation />;
  }
}
