import { BackLink } from '@/features/participant/components/ui';
import { STAR } from '@/features/participant/rewards';
import { useNavDrag } from '@/hooks/use-nav-drag';
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator';
import { cn } from '@/lib/utils';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ChevronLeft, LogOut, ReceiptText, ScanLine } from 'lucide-react';
import { type ReactNode, useState } from 'react';

export type PartnerShared = { name: string; type: string } | null;

export function usePartner(): PartnerShared {
    return (usePage().props.partner as PartnerShared) ?? null;
}

/**
 * Kerangka layar mitra (PRD bagian 12): ponsel di warung, satu tugas per layar. Header lime dengan tombol kembali
 * dan label akun, panel krem, tombol utama menempel di bawah, navbar hitam bila sudah masuk.
 */
export function PartnerPage({
    title,
    back,
    nav,
    footer,
    hideNav,
    children,
}: {
    title: string;
    back?: string;
    /** Menu aktif di navbar: cek, rekap. */
    nav?: 'cek' | 'rekap';
    footer?: ReactNode;
    hideNav?: boolean;
    children: ReactNode;
}) {
    const partner = usePartner();
    const showNav = Boolean(partner) && !hideNav;

    return (
        <div className="min-h-dvh bg-[#e6e0cd]">
            <Head title={`${title} · Mitra`} />
            <div
                className={cn(
                    'bg-cream text-ink relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col shadow-2xl',
                    showNav && '[--nav-h:calc(4rem+max(0.75rem,env(safe-area-inset-bottom)))]',
                )}
            >
                <div className="lime-hero px-5 pt-4 pb-14">
                    <div className="flex min-h-10 items-center justify-between gap-3">
                        {back ? (
                            <BackLink fallback={back} className="bg-ink text-lime grid size-10 shrink-0 place-items-center rounded-full">
                                <ChevronLeft className="size-5" strokeWidth={2.5} />
                            </BackLink>
                        ) : (
                            <span />
                        )}
                        {partner && (
                            <span className="bg-ink text-cream rounded-full px-3.5 py-1.5 text-[12px] font-extrabold whitespace-nowrap">
                                {partner.type === 'kuota' ? 'Mitra kuota' : partner.name}
                            </span>
                        )}
                    </div>
                    <h1 className="mt-3 text-[34px] leading-[1.05] font-extrabold tracking-tight">{title}</h1>
                </div>

                <main className="bg-cream relative -mt-7 flex flex-1 flex-col rounded-t-[2rem] px-5 pt-6 pb-6">
                    <div className="flex-1">{children}</div>
                    {footer && (
                        <div className="bg-cream sticky bottom-[var(--nav-h,0px)] -mx-5 mt-6 space-y-2.5 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                            {footer}
                        </div>
                    )}
                </main>

                {showNav && (
                    <>
                        {/* Pengganti tinggi navbar yang menempel tetap di bawah layar. */}
                        <div aria-hidden className="h-(--nav-h) shrink-0" />
                        <PartnerNav active={nav} />
                    </>
                )}
            </div>
        </div>
    );
}

/**
 * Navbar bergaya navbar peserta: pil hitam, pil lime meluncur ke menu aktif. Menempel tetap di bawah layar (fixed)
 * dan tiap menu punya kolom sama lebar, jadi ikon lain tidak bergeser saat menu aktif melebar berisi label.
 */
function PartnerNav({ active }: { active?: string }) {
    const items = [
        { key: 'cek', label: 'Cek kode', href: '/mitra', icon: ScanLine },
        { key: 'rekap', label: 'Rekap', href: '/mitra/rekap', icon: ReceiptText },
    ];
    // Menu tujuan setelah gestur geser: pil tetap di sana sampai halaman berganti.
    const [leavingTo, setLeavingTo] = useState<string | null>(null);
    const { dragKey, handlers } = useNavDrag((key) => {
        const item = items.find((i) => i.key === key);
        if (!item || item.key === active) return;
        setLeavingTo(item.key);
        router.visit(item.href);
    });
    const target = dragKey ?? leavingTo ?? active ?? '';
    const { containerRef, indicatorStyle } = useSlidingIndicator('partner-nav', target);
    const itemClass = 'relative flex h-11 w-full min-w-0 items-center justify-center rounded-full transition-colors duration-200';

    return (
        <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[430px] px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <div
                ref={containerRef}
                {...handlers}
                className={cn(
                    'pointer-events-auto relative mx-auto grid h-14 max-w-[384px] touch-none items-center gap-1 rounded-full bg-[#0b0b0b] px-1.5 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)] select-none',
                    'grid-cols-3',
                )}
            >
                <span aria-hidden className="bg-lime pointer-events-none absolute top-0 left-0 rounded-full" style={indicatorStyle} />
                {items.map((item) => {
                    const isActive = target === item.key;
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            data-active={isActive}
                            data-nav-key={item.key}
                            className={cn(
                                itemClass,
                                isActive ? 'text-ink gap-0.5 px-1.5 text-[11px] font-extrabold' : 'text-cream hover:bg-white/10',
                            )}
                        >
                            <Icon className="size-5 shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                            {isActive && <span className="truncate">{item.label}</span>}
                        </Link>
                    );
                })}
                <button
                    type="button"
                    onClick={() => router.post('/mitra/keluar', {}, { onFinish: () => router.flushAll() })}
                    aria-label="Keluar"
                    className={cn(itemClass, 'text-cream hover:bg-white/10')}
                >
                    <LogOut className="size-5 shrink-0" strokeWidth={1.75} />
                </button>
            </div>
        </nav>
    );
}

/** Lencana bergerigi hitam dengan centang lime (layar Ditukar dan Selesai). */
export function DoneBadge() {
    return (
        <span className={cn('bg-ink text-lime mx-auto grid size-24 place-items-center', STAR)}>
            <svg
                viewBox="0 0 24 24"
                className="size-11"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
            >
                <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
        </span>
    );
}

/** Label kecil huruf kapital, mis. KODE, NAMA PENUKAR. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('text-[10px] font-extrabold tracking-[0.14em] uppercase', className)}>{children}</p>;
}

export const payoutBadge: Record<string, { label: string; className: string }> = {
    berjalan: { label: 'Berjalan', className: 'bg-lime text-ink' },
    menunggu_bayar: { label: 'Menunggu bayar', className: 'bg-[#e9e2bf] text-ink' },
    dibayar: { label: 'Dibayar', className: 'bg-lime-soft text-ink' },
};
