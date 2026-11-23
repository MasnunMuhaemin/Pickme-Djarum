import { BottomNav, DesktopNav } from '@/features/participant/components/bottom-nav';
import { DesktopAside } from '@/features/participant/components/desktop-aside';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export default function ParticipantLayout({
    children,
    dark,
    className,
    hideBottomNav,
}: {
    children: ReactNode;
    nav?: string;
    dark?: boolean;
    className?: string;
    hideBottomNav?: boolean;
}) {
    return (
        <div className="md:bg-cream min-h-dvh bg-[#e6e0cd]">
            <div className="bg-cream text-ink relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col shadow-2xl sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] md:my-0 md:min-h-dvh md:max-w-[1440px] md:rounded-none md:shadow-none lg:flex-row">
                <DesktopAside />
                <div
                    className={cn(
                        'relative flex min-h-dvh min-w-0 flex-1 flex-col lg:min-h-0',
                        dark ? 'bg-night text-cream' : 'bg-cream text-ink',
                        className,
                    )}
                >
                    <DesktopNav dark={dark} />
                    <main className="flex flex-1 flex-col md:mx-auto md:w-full md:max-w-[960px]">{children}</main>
                    {!hideBottomNav && <BottomNav />}
                </div>
            </div>
        </div>
    );
}
