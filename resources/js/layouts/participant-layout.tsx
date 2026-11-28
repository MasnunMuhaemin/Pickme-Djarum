import { BottomNav, DesktopNav, rememberMenu } from '@/features/participant/components/bottom-nav';
import { DesktopAside } from '@/features/participant/components/desktop-aside';
import { cn } from '@/lib/utils';
import { Head, usePage } from '@inertiajs/react';
import { type ReactNode, useEffect } from 'react';

export default function ParticipantLayout({
    children,
    title,
    dark,
    className,
    hideBottomNav,
}: {
    children: ReactNode;
    /** Judul tab browser, mis. "Hadiahku" menjadi "Hadiahku · PICKME". */
    title?: string;
    nav?: string;
    dark?: boolean;
    className?: string;
    hideBottomNav?: boolean;
}) {
    const { url } = usePage();
    useEffect(() => rememberMenu(url), [url]);

    return (
        <div className="md:bg-cream min-h-dvh bg-[#e6e0cd]">
            <Head title={title} />
            <div className="bg-cream text-ink relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col shadow-2xl sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] md:my-0 md:min-h-dvh md:max-w-[1440px] md:rounded-none md:shadow-none lg:flex-row">
                <DesktopAside />
                <div
                    className={cn(
                        'relative flex min-h-dvh min-w-0 flex-1 flex-col lg:min-h-0',
                        // Tinggi bottom nav HP (pt-2 + h-14 + jarak bawah aman); tombol yang menempel di bawah duduk di atasnya.
                        !hideBottomNav && '[--nav-h:calc(4rem+max(0.75rem,env(safe-area-inset-bottom)))] md:[--nav-h:0px]',
                        dark ? 'bg-night text-cream' : 'bg-cream text-ink',
                        className,
                    )}
                >
                    <DesktopNav />
                    {/* Isi halaman muncul memudar; halaman lama langsung diganti sehingga tidak bertumpuk. */}
                    <main className="animate-in fade-in flex flex-1 flex-col duration-300 motion-reduce:animate-none md:mx-auto md:w-full md:max-w-[960px]">
                        {children}
                    </main>
                    {!hideBottomNav && <BottomNav />}
                </div>
            </div>
        </div>
    );
}
