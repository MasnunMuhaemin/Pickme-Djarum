import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { Gift, LayoutGrid, QrCode, Trophy } from 'lucide-react';
import { useEffect, useState } from 'react';

const items = [
    { key: 'papan', label: 'Papan', href: '/participant/papan', icon: LayoutGrid },
    { key: 'hadiah', label: 'Hadiah', href: '/participant/hadiah', icon: Gift },
    { key: 'scan', label: 'Scan', href: '/participant/scan', icon: QrCode },
    { key: 'kartu', label: 'Kartu', href: '/participant/kartu', icon: Trophy },
];

function activeKey(url: string): string {
    const path = url.split('?')[0];
    if (
        path === '/participant' ||
        path === '/participant/' ||
        path.startsWith('/participant/papan') ||
        path.startsWith('/participant/slot') ||
        path.startsWith('/participant/foto') ||
        path.startsWith('/participant/daftar') ||
        path.startsWith('/participant/persetujuan')
    ) {
        return 'papan';
    }
    if (path.startsWith('/participant/scan') || path.startsWith('/participant/qr-tidak-dikenal') || path.startsWith('/participant/lupa-pin')) {
        return 'scan';
    }
    if (path.startsWith('/participant/kartu') || path.startsWith('/participant/mahasiswa')) {
        return 'kartu';
    }
    if (
        path.startsWith('/participant/hadiah') ||
        path.startsWith('/participant/voucher') ||
        path.startsWith('/participant/nomor-tujuan') ||
        path.startsWith('/participant/alamat') ||
        path.startsWith('/participant/klaim') ||
        path.startsWith('/participant/terima-kasih')
    ) {
        return 'hadiah';
    }
    return 'papan';
}

function useActiveNav(): string {
    const [path, setPath] = useState(() => window.location.pathname);

    useEffect(() => {
        const stop = router.on('navigate', () => setPath(window.location.pathname));
        return () => stop();
    }, []);

    return activeKey(path);
}

export function DesktopNav({ dark }: { dark?: boolean }) {
    const active = useActiveNav();

    return (
        <header
            className={cn(
                'sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between gap-6 border-b px-8 backdrop-blur lg:flex',
                dark ? 'bg-night/90 text-cream border-white/10' : 'border-ink/10 bg-cream/90 text-ink',
            )}
        >
            <Link href="/participant" className="flex items-center gap-2">
                <span className="bg-lime text-ink grid size-8 place-items-center rounded-lg text-[11px] font-extrabold">P</span>
                <span className="text-xs font-extrabold tracking-tight">PICKME</span>
            </Link>

            <nav className="flex items-center gap-1">
                {items.map((item) => {
                    const isActive = active === item.key;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                'flex h-10 items-center gap-2 rounded-full px-4 text-[11px] font-bold transition',
                                isActive
                                    ? dark
                                        ? 'bg-lime text-ink'
                                        : 'bg-ink text-cream'
                                    : dark
                                      ? 'text-cream/60 hover:bg-white/5'
                                      : 'text-ink-soft hover:bg-cream-deep',
                            )}
                        >
                            <Icon className="size-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <span className="bg-lime-soft text-ink rounded-full px-3 py-1.5 text-[10px] font-bold">Kartu 4 / 10</span>
        </header>
    );
}

export function BottomNav() {
    const active = useActiveNav();

    return (
        <nav className="bg-night text-cream/70 after:bg-night sticky bottom-0 z-30 mt-auto grid grid-cols-4 border-t border-white/10 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] after:absolute after:top-full after:left-0 after:h-2 after:w-full lg:hidden">
            {items.map((item) => {
                const isActive = active === item.key;
                const Icon = item.icon;
                return (
                    <Link
                        key={item.key}
                        href={item.href}
                        className={cn(
                            'flex flex-col items-center gap-1 py-1 text-[10px] font-semibold transition-colors',
                            isActive ? 'text-lime' : 'text-cream/60',
                        )}
                    >
                        <span
                            className={cn(
                                'grid size-11 place-items-center rounded-full transition-colors',
                                isActive ? 'bg-lime text-ink' : 'bg-transparent',
                            )}
                        >
                            <Icon className="size-5" />
                        </span>
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
