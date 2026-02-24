'use client';

import {usePathname, useRouter} from 'next/navigation';
import {
    SidebarHeader,
    SidebarContent as SidebarBody,
    SidebarFooter,
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {Home, Settings, FolderOpen, ChartArea, Play, Filter, AlertTriangle} from 'lucide-react';
import {TbMapCog} from 'react-icons/tb';
import {useLanguage} from '@/contexts/LanguageContext';
import type {SidebarNavigationProps} from '../types/sidebar';

const menuItems = [
    {id: 'dashboard', label: 'dashboard', icon: Home, path: '/'},
    {id: 'simulations', label: 'simulations', icon: Play, path: '/simulador'},
    {id: 'analyticsGraphCreator', label: 'analyticsGraphCreator', icon: ChartArea, path: '/analyticsGraphCreator'},
    {id: 'analyticsMapCreator', label: 'analyticsMapCreator', icon: TbMapCog, path: '/analyticsMapCreator'},
    {id: 'statisticsAnalyzer', label: 'statisticsGenerator', icon: TbMapCog, path: '/statisticsAnalyzer'},
    {id: 'dirComparison', label: 'dirComparison', icon: TbMapCog, path: '/dirComparison'},
    {id: 'filter', label: 'filter', icon: Filter, path: '/filters'},
    {id: 'history', label: 'history', icon: FolderOpen, path: '/history'},
    {id: 'settings', label: 'settings', icon: Settings, path: '/settings'},
];

export default function SidebarNavigation({
                                              simulationName,
                                              currentFolder,
                                          }: SidebarNavigationProps) {
    const {t} = useLanguage();
    const router = useRouter();
    const pathname = usePathname();

    const isActive = (itemPath: string) => {
        if (itemPath === '/') return pathname === '/';
        return pathname === itemPath || pathname.startsWith(itemPath + '/');
    };

    return (
        <>
            <SidebarHeader className="border-b border-surface-3/50 px-4 py-3">
                <h2 className="text-lg font-semibold text-text-primary">BikeSim</h2>
                <p className="text-xs text-text-secondary">{t('navigation')}</p>
            </SidebarHeader>

            <SidebarBody className="px-2 py-4">
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Button
                                key={item.id}
                                variant={active ? 'default' : 'ghost'}
                                className="w-full justify-start"
                                onClick={() => router.push(item.path)}
                            >
                                <Icon className="mr-2 h-4 w-4"/>
                                {t(item.label)}
                            </Button>
                        );
                    })}
                </nav>
            </SidebarBody>

            <SidebarFooter className="border-t border-surface-3/50 p-4">
                {(!simulationName || !currentFolder) && (
                    <div className="flex items-center gap-2 text-xs text-amber-600">
                        <AlertTriangle className="h-4 w-4"/>
                        <span>{t('noSimulationSelected')}</span>
                    </div>
                )}
                <div className="space-y-1 text-xs">
                    <div className="text-text-secondary">{t('currentSimulation')}:</div>
                    <div className="font-medium text-text-primary truncate">
                        {simulationName ?? t('noName')}
                    </div>
                    <div className="text-text-secondary">{t('folder')}:</div>
                    <div className="font-mono text-xs text-text-primary truncate">
                        {currentFolder ?? "—"}
                    </div>
                </div>
            </SidebarFooter>
        </>
    );
}
