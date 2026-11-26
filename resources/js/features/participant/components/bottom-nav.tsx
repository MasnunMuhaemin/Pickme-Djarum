import { LogoutButton } from '@/features/participant/components/ui';
import { useNavDrag } from '@/hooks/use-nav-drag';
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { CreditCard, Gift, House, LogIn, ScanLine, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';

const items = [
    { key: 'beranda', label: 'Beranda', href: '/participant', icon: House },
    { key: 'hadiah', label: 'Hadiahku', href: '/participant/hadiah', icon: Gift },
    { key: 'scan', label: 'Scan', href: '/participant/scan', icon: ScanLine },
    { key: 'kartu', label: 'Leaderboard', href: '/participant/kartu', icon: CreditCard },
    { key: 'profil', label: 'Profil', href: '/participant/profil', icon: UserRound },
];

const loginItem = { key: 'masuk', label: 'Masuk', href: '/participant/masuk', icon: LogIn };

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
    if (path.startsWith('/participant/scan') || path.startsWith('/participant/lupa-pin')) {
        return 'scan';
    }
    if (path.startsWith('/participant/kartu')) {
        return 'kartu';
    }
    if (
        path.startsWith('/participant/hadiah') ||
        // Mystery gift adalah hadiah (detailnya dibuka dari Hadiahku), bukan bagian Leaderboard.
        path.startsWith('/participant/mystery-gift') ||
        path.startsWith('/participant/voucher') ||
        path.startsWith('/participant/nomor-tujuan') ||
        path.startsWith('/participant/alamat') ||
        path.startsWith('/participant/klaim') ||
        path.startsWith('/participant/terima-kasih')
    ) {
        return 'hadiah';
    }
    if (path.startsWith('/participant/masuk')) return 'masuk';

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
    if (isLoggedIn) return items;
    // Tamu tidak melihat Hadiahku dan Profil; menu Masuk menggantikannya.
    return [...items.filter((item) => item.key !== 'hadiah' && item.key !== 'profil'), loginItem];
}

function useActiveNav(): string {
    const [path, setPath] = useState(() => window.location.pathname);

    useEffect(() => {
        const stop = router.on('navigate', () => setPath(window.location.pathname));
        return () => stop();
    }, []);

    return activeKey(path);
}

export function DesktopNav() {
    const active = useActiveNav();
    const visibleItems = useNavItems();
    const caps = useCaps();
    const loggedIn = useIsLoggedIn();

    return (
        <header
            className={cn(
                // Latar hitam seperti navbar HP (dulu krem).
                'text-cream sticky top-0 z-30 hidden h-16 shrink-0 items-center justify-between gap-6 border-b border-white/10 bg-[#0b0b0b] px-8 md:flex',
            )}
        >
            <Link href="/participant" className="flex items-center" aria-label="Papan Pick(me)">
                <img src="/images/logo.webp" alt="Papan Pick(me)" className="h-10 w-auto" />
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
                                'flex h-10 items-center gap-2 rounded-full px-4 text-[11px] transition-colors duration-200',
                                // Warna menu aktif sama dengan navbar HP: lime dengan teks hitam.
                                isActive ? 'bg-lime font-extrabold text-[#0b0b0b]' : 'text-cream/70 hover:text-cream font-bold hover:bg-white/10',
                            )}
                        >
                            <Icon className="size-4" strokeWidth={isActive ? 2.25 : 1.75} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="flex items-center gap-2">
                {loggedIn ? (
                    <>
                        <span className="bg-lime-soft text-ink rounded-full px-3 py-1.5 text-[10px] font-bold">Kartu {caps} / 10</span>
                        <LogoutButton dark />
                    </>
                ) : (
                    <Link href="/participant/masuk" className="bg-lime text-ink h-10 rounded-full px-5 text-[12px] font-extrabold">
                        Masuk
                    </Link>
                )}
            </div>
        </header>
    );
}

/** Label pendek di navbar HP supaya pil yang melebar tetap muat di HP kecil. */
// Label pendek supaya muat di kolom tetap (HP 360 px).
const NAV_LABELS: Record<string, string> = { hadiah: 'Hadiah', kartu: 'Peringkat' };

/** Lama pil meluncur sebelum membuka halaman tanpa navbar (kamera), supaya geraknya sempat terlihat. */
const SLIDE_BEFORE_LEAVE_MS = 260;

export function BottomNav() {
    const active = useActiveNav();
    // Menu tujuan yang sedang dituju; halaman kamera tidak punya navbar, jadi pil meluncur dulu baru pindah.
    const [leavingTo, setLeavingTo] = useState<string | null>(null);
    // Gestur geser seperti tab bar iOS: selama jari digeser, pil mengikuti menu di bawah jari.
    const { dragKey, handlers } = useNavDrag((key) => goTo(key));
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
        <>
            {/* Safari iOS: navbar sticky bisa menutup isi bawah halaman. Navbar ditempel tetap (fixed) di bawah layar,
            dan ruang kosong setinggi navbar menjaga isi terakhir tetap terlihat di atasnya. */}
            <div aria-hidden className="h-(--nav-h) shrink-0 md:hidden" />
            <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-[430px] px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
                <div
                    ref={containerRef}
                    {...handlers}
                    className={cn(
                        'pointer-events-auto relative mx-auto h-14 touch-none items-center rounded-full bg-[#0b0b0b] px-1.5 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] select-none',
                        // 5 menu (peserta masuk): jarak dibagi rata. 4 menu (tamu): empat kolom sama lebar.
                        cameraCentered
                            ? 'grid max-w-[324px] grid-cols-3 gap-0.5'
                            : visibleItems.length === 4
                              ? 'grid max-w-[352px] grid-cols-4'
                              : 'grid max-w-[384px] grid-cols-5',
                    )}
                >
                    <span aria-hidden className="bg-lime pointer-events-none absolute top-0 left-0 rounded-full" style={indicatorStyle} />
                    {visibleItems.map((item) => renderItem(item, true))}
                </div>
            </nav>
        </>
    );

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
                    isActive ? 'gap-1 px-3 text-[12px] font-extrabold text-[#0b0b0b]' : 'text-cream w-10 hover:bg-white/10',
                    // Menu selebar kolomnya agar posisinya tidak bergeser.
                    fill && 'w-full min-w-0',
                    fill && isActive && 'gap-0.5 px-0.5 text-[10px] tracking-tight',
                )}
            >
                <Icon className={cn('shrink-0', fill && isActive ? 'size-4' : 'size-5')} strokeWidth={isActive ? 2.25 : 1.75} />
                {isActive && <span className="truncate">{NAV_LABELS[item.key] ?? item.label}</span>}
            </Link>
        );
    }
}
