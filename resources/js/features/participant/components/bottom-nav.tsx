import { LogoutButton } from '@/features/participant/components/ui';
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { CreditCard, Gift, House, ScanLine, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const items = [
    { key: 'beranda', label: 'Beranda', href: '/participant', icon: House },
    { key: 'hadiah', label: 'Hadiahku', href: '/participant/hadiah', icon: Gift },
    { key: 'scan', label: 'Scan', href: '/participant/scan', icon: ScanLine },
    { key: 'kartu', label: 'Leaderboard', href: '/participant/kartu', icon: CreditCard },
    { key: 'profil', label: 'Profil', href: '/participant/profil', icon: UserRound },
];

function activeKey(url: string): string {
    const path = url.split('?')[0];
    if (
        path === '/participant' ||
        path === '/participant/' ||
        path.startsWith('/participant/slot') ||
        path.startsWith('/participant/foto') ||
        path.startsWith('/participant/daftar') ||
        path.startsWith('/participant/persetujuan')
    ) {
        return 'beranda';
    }
    if (path.startsWith('/participant/profil')) return 'profil';
    if (path.startsWith('/participant/scan') || path.startsWith('/participant/qr-tidak-dikenal') || path.startsWith('/participant/lupa-pin')) {
        return 'scan';
    }
    if (path.startsWith('/participant/kartu') || path.startsWith('/participant/mystery-gift') || path.startsWith('/participant/mahasiswa')) {
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
    return 'beranda';
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
    return isLoggedIn ? items : items.filter((item) => item.key !== 'hadiah' && item.key !== 'profil');
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
                            prefetch="mount"
                            cacheFor="30s"
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

/** Label pendek di navbar HP supaya pil yang melebar tetap muat di HP kecil. */
const NAV_LABELS: Record<string, string> = { hadiah: 'Hadiah' };

/** Lama pil meluncur sebelum membuka halaman tanpa navbar (kamera), supaya geraknya sempat terlihat. */
const SLIDE_BEFORE_LEAVE_MS = 260;

export function BottomNav() {
    const active = useActiveNav();
    // Menu tujuan yang sedang dituju; halaman kamera tidak punya navbar, jadi pil meluncur dulu baru pindah.
    const [leavingTo, setLeavingTo] = useState<string | null>(null);
    // Gestur geser seperti tab bar iOS: selama jari digeser, pil mengikuti menu di bawah jari.
    const [dragKey, setDragKey] = useState<string | null>(null);
    const drag = useRef<{ x0: number; moved: boolean } | null>(null);
    const suppressClick = useRef(false);
    const target = dragKey ?? leavingTo ?? active;
    const { containerRef, indicatorStyle } = useSlidingIndicator('bottom-nav', target);
    const visibleItems = useNavItems();
    const compact = useIsScanPage();
    const compactItems = visibleItems.filter((item) => item.key !== 'scan');

    if (compact) {
        return (
            <nav className="bg-night after:bg-night sticky bottom-0 z-30 mt-auto grid grid-cols-3 border-t border-white/10 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] after:absolute after:top-full after:left-0 after:h-2 after:w-full md:hidden">
                {compactItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link key={item.key} href={item.href} prefetch="mount" cacheFor="30s" className="text-cream/70 flex justify-center py-2">
                            <Icon className="size-5" />
                        </Link>
                    );
                })}
            </nav>
        );
    }

    const cameraCentered = visibleItems.length === 3 && visibleItems[1]?.key === 'scan';

    // Pil hitam melayang: menu aktif melebar berisi ikon dan label; pil lime meluncur ke menu aktif.
    return (
        <nav className="pointer-events-none sticky bottom-0 z-30 mt-auto px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
            <div
                ref={containerRef}
                onPointerDown={(e) => {
                    drag.current = { x0: e.clientX, moved: false };
                }}
                onPointerMove={(e) => {
                    const d = drag.current;
                    if (!d) return;
                    if (!d.moved && Math.abs(e.clientX - d.x0) < 8) return;
                    d.moved = true;
                    setDragKey(keyAt(e.clientX));
                }}
                onPointerUp={(e) => {
                    const d = drag.current;
                    drag.current = null;
                    if (!d?.moved) return; // ketukan biasa: ditangani Link
                    suppressClick.current = true;
                    const key = keyAt(e.clientX);
                    setDragKey(null);
                    goTo(key);
                }}
                onPointerCancel={() => {
                    drag.current = null;
                    setDragKey(null);
                }}
                onClickCapture={(e) => {
                    // Klik yang menyusul gestur geser tidak membuka menu kedua kalinya.
                    if (!suppressClick.current) return;
                    suppressClick.current = false;
                    e.preventDefault();
                    e.stopPropagation();
                }}
                className={cn(
                    'pointer-events-auto relative mx-auto h-14 touch-none items-center rounded-full bg-[#0b0b0b] px-1.5 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] select-none',
                    // 3 menu (kamera di tengah): tiga kolom tetap sama lebar, jadi menu lain diam saat pil berpindah.
                    // 5 menu: jarak antar menu dibagi rata.
                    cameraCentered ? 'grid max-w-[324px] grid-cols-3 gap-0.5' : 'flex max-w-[384px] justify-between',
                )}
            >
                <span aria-hidden className="bg-lime pointer-events-none absolute top-0 left-0 rounded-full" style={indicatorStyle} />
                {cameraCentered ? <>{visibleItems.map((item) => renderItem(item, true))}</> : visibleItems.map((item) => renderItem(item))}
            </div>
        </nav>
    );

    /** Menu yang titik tengahnya paling dekat dengan posisi jari. */
    function keyAt(clientX: number): string | null {
        let best: { key: string; distance: number } | null = null;
        containerRef.current?.querySelectorAll<HTMLElement>('[data-nav-key]').forEach((el) => {
            const r = el.getBoundingClientRect();
            const distance = Math.abs(clientX - (r.left + r.width / 2));
            if (!best || distance < best.distance) best = { key: el.dataset.navKey ?? '', distance };
        });
        return best ? (best as { key: string }).key : null;
    }

    /** Buka menu hasil gestur; pil tetap di menu tujuan sampai halaman berganti. */
    function goTo(key: string | null) {
        const item = visibleItems.find((i) => i.key === key);
        if (!item || item.key === active) return;
        setLeavingTo(item.key);
        // Halaman kamera tidak punya navbar: beri waktu pil tiba dulu.
        window.setTimeout(() => router.visit(item.href), item.key === 'scan' ? SLIDE_BEFORE_LEAVE_MS : 0);
    }

    function renderItem(item: (typeof visibleItems)[number], fill = false) {
        const isActive = target === item.key;
        const Icon = item.icon;
        return (
            <Link
                key={item.key}
                href={item.href}
                prefetch="mount"
                cacheFor="30s"
                onClick={(e) => {
                    if (item.key !== 'scan' || isActive || e.metaKey || e.ctrlKey || e.shiftKey) return;
                    e.preventDefault();
                    setLeavingTo(item.key);
                    window.setTimeout(() => router.visit(item.href), SLIDE_BEFORE_LEAVE_MS);
                }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                data-active={isActive}
                data-nav-key={item.key}
                className={cn(
                    // Tinggi 44px tetap nyaman untuk jempol (PRD bagian 14).
                    'relative flex h-11 items-center justify-center rounded-full transition-colors duration-200',
                    isActive ? 'text-ink gap-1 px-3 text-[12px] font-extrabold' : 'text-cream w-10 hover:bg-white/10',
                    // Menu selebar kolomnya agar posisinya tidak bergeser.
                    fill && 'w-full min-w-0',
                    fill && isActive && 'gap-0.5 px-1.5 text-[11px]',
                )}
            >
                <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                {isActive && <span className="truncate">{NAV_LABELS[item.key] ?? item.label}</span>}
            </Link>
        );
    }
}
