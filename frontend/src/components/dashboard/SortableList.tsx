'use client';

import { useId, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props<T extends { id: string }> {
  items: T[];
  // Receives the full new order of ids after a drop.
  onReorder: (ids: string[]) => void;
  // "list" stacks rows, "wrap" flows items like chips.
  layout?: 'list' | 'wrap';
  // Spoken to screen readers and used as the handle's label.
  label: (item: T) => string;
  // `handle` is the grip button; place it wherever it belongs in the row. Only the handle
  // starts a drag, so the other buttons in the row keep working.
  renderItem: (item: T, handle: ReactNode) => ReactNode;
}

function Row({
  id,
  label,
  layout,
  children,
}: {
  id: string;
  label: string;
  layout: 'list' | 'wrap';
  children: (handle: ReactNode) => ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      aria-label={`Reorder ${label}`}
      className="flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-1 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-accent active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="size-4">
        <path d="M7 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16 4a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 7.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM16 16a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
      </svg>
    </button>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`${layout === 'wrap' ? '' : 'w-full'} ${isDragging ? 'relative z-10 opacity-80 shadow-lg' : ''}`}
    >
      {children(handle)}
    </li>
  );
}

export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  layout = 'list',
  label,
  renderItem,
}: Props<T>) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ids = items.map((item) => item.id);
  const nameOf = (id: UniqueIdentifier) => {
    const item = items.find((it) => it.id === id);
    return item ? label(item) : 'item';
  };
  const position = (id: UniqueIdentifier) => `${ids.indexOf(String(id)) + 1} of ${ids.length}`;

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onReorder(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        // The defaults would read out raw database ids.
        announcements: {
          onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
          onDragOver: ({ active, over }) =>
            over ? `${nameOf(active.id)} is at position ${position(over.id)}.` : undefined,
          onDragEnd: ({ active, over }) =>
            over
              ? `${nameOf(active.id)} dropped at position ${position(over.id)}.`
              : `${nameOf(active.id)} dropped.`,
          onDragCancel: ({ active }) => `Cancelled. ${nameOf(active.id)} did not move.`,
        },
      }}
    >
      <SortableContext
        items={ids}
        strategy={layout === 'wrap' ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <ul className={layout === 'wrap' ? 'flex flex-wrap gap-2' : 'space-y-3'}>
          {items.map((item) => (
            <Row key={item.id} id={item.id} label={label(item)} layout={layout}>
              {(handle) => renderItem(item, handle)}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
