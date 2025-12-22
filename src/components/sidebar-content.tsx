'use client';

import {usePathname, useRouter} from 'next/navigation';
import {
    SidebarHeader,
    SidebarContent as SidebarBody,
    SidebarFooter,
} from '@/components/ui/sidebar';
import {Button} from '@/components/ui/button';
import {Home, Settings, FolderOpen, ChartArea, Map, Play, Filter} from 'lucide-react';
import {TbMapCog} from 'react-icons/tb';
import React from "react";

type SidebarContentProps = {
    simulationName?: string | null;
    currentFolder?: string | null;
};

export default function SidebarContentComponent({
                                                    simulationName,
                                                    currentFolder,
                                                }: SidebarContentProps) {
    const router = useRouter();
    const pathname = usePathname();

    const menuItems = [
        {id: 'dashboard', label: 'Dashboard', icon: Home, path: '/'},
        {id: 'simulations', label: 'Simulations', icon: Play, path: '/simulador'},
        {
            id: 'analyticsGraphCreator',
            label: 'Analytics graph creator',
            icon: ChartArea,
            path: '/analyticsGraphCreator'
        },
        {id: 'analyticsMapCreator', label: 'Analytics map creator', icon: TbMapCog, path: '/analyticsMapCreator'},

        {id: 'filter', label: 'Filter', icon: Filter, path: '/filters'},
        {id: 'history', label: 'History', icon: FolderOpen, path: '/history'},
        {id: 'settings', label: 'Settings', icon: Settings, path: '/settings'},
    ];

    const isActive = (itemPath: string) => {
        if (itemPath === '/') return pathname === '/';
        return pathname === itemPath || pathname.startsWith(itemPath + '/');
    };

    return (
        <>
            <SidebarHeader className="p-4 border-b border-surface-3 bg-surface-1/85 backdrop-blur-md">
                <div className="space-y-1">
                    <h2 className="text-base font-semibold font-headline text-text-primary">
                        BikeSim
                    </h2>
                    <div className="text-[11px] text-text-secondary">Navigation</div>
                </div>
            </SidebarHeader>

            <SidebarBody className="p-3 bg-surface-1/70 backdrop-blur-md">
                <nav className="space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);

                        return (
                            <Button
                                key={item.id}
                                variant="ghost"
                                className={[
                                    "w-full justify-start h-9 px-3",
                                    "rounded-md",
                                    "text-xs",
                                    "transition-colors",
                                    active
                                        ? "bg-accent-soft text-accent hover:bg-accent-soft"
                                        : "text-text-secondary hover:text-text-primary hover:bg-surface-0/70",
                                    "focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-0",
                                ].join(" ")}
                                onClick={() => router.push(item.path)}
                            >
                                <Icon
                                    className={["mr-2 h-4 w-4", active ? "text-accent" : "text-text-tertiary"].join(" ")}/>
                                <span className="truncate">{item.label}</span>
                            </Button>
                        );
                    })}
                </nav>
            </SidebarBody>

            <SidebarFooter className="p-4 border-t border-surface-3 bg-surface-1/85 backdrop-blur-md">
                <div className="space-y-1 min-w-0">
                    <p className="text-[12px] font-semibold text-text-primary truncate">
                        {simulationName ?? "No name"}
                    </p>
                    <p className="text-[11px] text-text-secondary truncate">
                        {currentFolder ?? "—"}
                    </p>
                </div>
            </SidebarFooter>
        </>
    );

}
