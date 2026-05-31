'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Overview', href: '/overview', icon: LayoutDashboard },
  { label: 'Franchises', href: '/franchises', icon: Building2 },
  { label: 'Purchase Requests', href: '/purchase-requests', icon: ShoppingCart },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-gray-200 bg-white transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-[220px]',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-gray-200 px-4">
        {!collapsed && <span className="text-sm font-semibold text-gray-900">EHB Backoffice</span>}
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary-50 font-medium text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 text-sm text-gray-500 hover:bg-gray-50"
      >
        {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
