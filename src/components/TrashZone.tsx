import type { Ref } from 'react';
import { TrashIcon } from './icons';

interface TrashZoneProps {
  ref: Ref<HTMLDivElement>;
  visible: boolean;
  active: boolean;
  swallowing: boolean;
  onSwallowed: () => void;
}

export function TrashZone({ ref, visible, active, swallowing, onSwallowed }: TrashZoneProps) {
  const className = [
    'trash',
    visible && 'trash--visible',
    active && 'trash--active',
    swallowing && 'trash--swallowing',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={ref} className={className} aria-hidden={!visible} onAnimationEnd={onSwallowed}>
      <TrashIcon />
      <span>{active ? 'Release to delete' : 'Drop here to delete'}</span>
    </div>
  );
}
