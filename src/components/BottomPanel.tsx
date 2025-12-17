'use client';

import React, {useEffect, useState} from 'react';
import {Button} from '@/components/ui/button';

type BottomPanelProps = {
    barLeft?: React.ReactNode; // tabs/buttons at left (like "Problems | Output | Terminal")
    barRight?: React.ReactNode; // optional right side actions
    children: React.ReactNode; // panel content
    defaultOpen?: boolean;

    // Layout
    leftOffsetPx?: number; // default 256 (=16rem)
    maxHeight?: number; // px (panel will scroll if content exceeds)
    onHeightChange?: (h: number) => void; // so AppLayout can reserve space exactly
};

export function BottomPanel({
                                children,
                                defaultOpen = true,
                                leftOffsetPx = 256,
                                maxHeight = 640,
                                onHeightChange,
                            }: BottomPanelProps) {
    const [open, setOpen] = useState(defaultOpen);

    const collapsedBarHeight = 44;
    const effectiveHeight = open ? Math.min(maxHeight, maxHeight) : collapsedBarHeight;

    useEffect(() => {
        onHeightChange?.(effectiveHeight);
    }, [effectiveHeight, onHeightChange]);

    return (
        <div
            className="fixed right-0 bottom-0 z-50"
            style={{left: leftOffsetPx}}
        >
            {/* Panel (only when open) */}
            {open && (
                <div
                    className="border-t bg-background overflow-auto"
                    style={{maxHeight}}
                >
                    {children}
                </div>
            )}



            {/* Bottom bar (always visible) */}
            <div className="border-t bg-background">
                <div className="p-4 flex items-center justify-end">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setOpen(v => !v)}
                    >
                        {open ? 'Hide' : 'Show'}
                    </Button>
                </div>
            </div>


        </div>
    );
}
