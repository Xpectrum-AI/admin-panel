import React, { useRef, useState, useEffect } from 'react';
import { Ellipsis } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  actions: ActionMenuItem[];
}

export default function ActionMenu({ actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [renderAbove, setRenderAbove] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) && btnRef.current && !btnRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const estimatedMenuHeight = 180; // px, adjust if your menu is taller
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < estimatedMenuHeight && spaceAbove > estimatedMenuHeight) {
        setRenderAbove(true);
      } else {
        setRenderAbove(false);
      }
    }
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={btnRef}
        className="p-1 rounded hover:bg-gray-100"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="sr-only">Actions</span>
        <Ellipsis />
      </button>
      {open && (
        <div
          className={`absolute right-0 z-50 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 ring-1 ring-black/5 py-2 animate-fade-in ${renderAbove ? 'bottom-full mb-2' : 'mt-2'}`}
        >
          {actions.map((action, idx) => (
            <button
              key={action.label}
              className={`flex items-center w-full px-4 py-2 text-left text-base gap-3 hover:bg-gray-50 focus:outline-none transition ${action.danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'}`}
              onClick={() => {
                setOpen(false);
                action.onClick();
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
} 