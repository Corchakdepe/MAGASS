'use client';

import { usePathname, useRouter } from 'next/navigation';
import {
  SidebarHeader,
  SidebarContent as SidebarBody,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {Home, Settings, FolderOpen, ChartArea, Map, Play, Filter} from 'lucide-react';
import { TbMapCog } from 'react-icons/tb';

export default function SidebarContentComponent() {
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
    { id: 'simulations', label: 'Simulations', icon: Play, path: '/simulador' },
    { id: 'analyticsGraphCreator', label: 'Analytics graph creator', icon: ChartArea, path: '/analyticsGraphCreator' },
    { id: 'analyticsMapCreator', label: 'Analytics map creator', icon: TbMapCog, path: '/analyticsMapCreator' },
    { id: 'filter', label: 'Filter', icon: Filter, path: '/filters' },
    { id: 'maps', label: 'Maps visualizations', icon: Map, path: '/maps' },
    { id: 'history', label: 'History', icon: FolderOpen, path: '/history' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const isActive = (itemPath: string) => {
    if (itemPath === '/') return pathname === '/';
    return pathname === itemPath || pathname.startsWith(itemPath + '/');
  };

  return (
    <>
      <SidebarHeader className="p-4">
        <h2 className="text-xl font-semibold font-headline">BikeSim</h2>
      </SidebarHeader>
      <SidebarBody className="p-4">
        <nav className="space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={isActive(item.path) ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => router.push(item.path)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </SidebarBody>
      <SidebarFooter className="p-4 border-t">
        <p className="text-xs text-muted-foreground">v1.0.0</p>
      </SidebarFooter>
    </>
  );
}
