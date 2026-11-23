import { LogoutButton } from '@/features/participant/components/ui';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { Camera, CreditCard, Gift, LayoutGrid } from 'lucide-react';
import { useEffect, useState } from 'react';

const items = [
    { key: 'papan', label: 'Papan', href: '/participant', icon: LayoutGrid },
    { key: 'hadiah', label: 'Hadiahku', href: '/participant/hadiah', icon: Gift },
    { key: 'scan', label: 'Scan', href: '/participant/scan', icon: Camera },
    { key: 'kartu', label: 'Kartu', href: '/participant/kartu', icon: CreditCard },
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

function useIsScanPage(): boolean {
    const { url } = usePage();
    return url.split('?')[0] === '/participant/scan';
}

function useIsLoggedIn(): boolean {
    const { props } = usePage();
    return Boolean((props.auth as { participant?: unknown })?.participant);
}

function useNavItems() {
    const isLoggedIn = useIsLoggedIn();
    return isLoggedIn ? items : items.filter((item) => item.key !== 'hadiah');
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
    const visibleItems = useNavItems();
    const caps = useCaps();

    return (
        <header
            className={cn(
                'sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between gap-6 border-b px-8 backdrop-blur md:flex',
                dark ? 'bg-night/90 text-cream border-white/10' : 'border-ink/10 bg-cream/90 text-ink',
            )}
        >
            <Link href="/participant" className="flex items-center gap-2">
                <span className="bg-lime text-ink grid size-8 place-items-center rounded-lg text-[11px] font-extrabold">P</span>
                <span className="text-xs font-extrabold tracking-tight">PICKME</span>
            </Link>

            <nav className="flex items-center gap-1">
                {visibleItems.map((item) => {
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

            <div className="flex items-center gap-2">
                {useIsLoggedIn() && <span className="bg-lime-soft text-ink rounded-full px-3 py-1.5 text-[10px] font-bold">Kartu {caps} / 10</span>}
                <LogoutButton dark={dark} />
            </div>
        </header>
    );
}

export function BottomNav() {
    const active = useActiveNav();
    const visibleItems = useNavItems();
    const compact = useIsScanPage();
    const compactItems = visibleItems.filter((item) => item.key !== 'scan');

    if (compact) {
        return (
            <nav className="bg-night after:bg-night sticky bottom-0 z-30 mt-auto grid grid-cols-3 border-t border-white/10 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] after:absolute after:top-full after:left-0 after:h-2 after:w-full md:hidden">
                {compactItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link key={item.key} href={item.href} className="text-cream/70 flex justify-center py-2">
                            <Icon className="size-5" />
                        </Link>
                    );
                })}
            </nav>
        );
    }

    // Pil hitam melayang: menu aktif melebar jadi pil lime berisi ikon dan label.
    return (
        <nav className="pointer-events-none sticky bottom-0 z-30 mt-auto px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
            <div className="pointer-events-auto flex h-16 items-center justify-between gap-1 rounded-full bg-[#0b0b0b] px-2 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.45)]">
                {visibleItems.map((item) => {
                    const isActive = active === item.key;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                                'flex h-12 items-center justify-center rounded-full transition-all duration-200',
                                isActive ? 'bg-lime text-ink gap-2 px-5 text-[14px] font-extrabold' : 'text-cream w-12 hover:bg-white/10',
                            )}
                        >
                            <Icon className="size-6 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                            {isActive && <span className="whitespace-nowrap">{item.label}</span>}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
