import { BackLink } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

export function useIsLoggedIn(): boolean {
    const { props } = usePage();
    return Boolean((props.auth as { participant?: unknown } | undefined)?.participant);
}

/**
 * Pola layar dari desain: bagian atas lime berisi tombol kembali bulat hitam, label kanan, judul besar, dan
 * subjudul; lalu panel krem bersudut membulat. `footer` menempel di bawah layar (untuk tombol utama form).
 */
export function LimePage({
    title,
    tabTitle,
    subtitle,
    back,
    backExact,
    right,
    nav,
    hideBottomNav,
    footer,
    panelClassName,
    decoration,
    children,
}: {
    title: ReactNode;
    /** Judul tab browser; bawaan sama dengan title bila berupa teks. */
    tabTitle?: string;
    subtitle?: ReactNode;
    back?: string;
    /** Kembali ke alamat ini apa adanya, bukan ke halaman sebelumnya di riwayat browser. */
    backExact?: boolean;
    right?: ReactNode;
    nav?: string;
    hideBottomNav?: boolean;
    footer?: ReactNode;
    panelClassName?: string;
    /** Hiasan di header (mis. ilustrasi gurita di pojok kanan bawah). */
    decoration?: ReactNode;
    children: ReactNode;
}) {
    return (
        <ParticipantLayout title={tabTitle ?? (typeof title === 'string' ? title : undefined)} nav={nav} hideBottomNav={hideBottomNav}>
            <div className="lime-hero relative px-5 pt-4 pb-14 md:px-8 md:pt-6">
                {decoration}
                {(back || right) && (
                    <div className="flex min-h-10 items-center justify-between gap-3">
                        {back && backExact ? (
                            <Link
                                href={back}
                                aria-label="Kembali"
                                className="text-lime grid size-10 shrink-0 place-items-center rounded-full bg-[#0b0b0b]"
                            >
                                <ChevronLeft className="size-5" strokeWidth={2.5} />
                            </Link>
                        ) : back ? (
                            <BackLink fallback={back} className="text-lime grid size-10 shrink-0 place-items-center rounded-full bg-[#0b0b0b]">
                                <ChevronLeft className="size-5" strokeWidth={2.5} />
                            </BackLink>
                        ) : (
                            <span />
                        )}
                        <div className="flex items-center gap-2">{right}</div>
                    </div>
                )}
                <h1
                    className={cn(
                        'text-[34px] leading-[1.05] font-extrabold tracking-tight text-[#0b0b0b] md:text-[44px]',
                        back || right ? 'mt-3' : 'mt-1',
                        // Sisakan ruang untuk hiasan di kanan supaya judul turun baris, tidak tertutup.
                        decoration && 'relative max-w-[58%] md:max-w-[65%]',
                    )}
                >
                    {title}
                </h1>
                {subtitle && <p className="mt-2 text-[13px] leading-snug font-semibold md:text-sm">{subtitle}</p>}
            </div>

            <div className={cn('bg-cream relative -mt-7 flex flex-1 flex-col rounded-t-[2rem] px-5 pt-6 pb-6 md:px-8 md:pt-8', panelClassName)}>
                <div className="flex-1 md:mx-auto md:w-full md:max-w-[720px]">{children}</div>
                {footer && (
                    <div className="bg-cream sticky bottom-[var(--nav-h,0px)] -mx-5 mt-6 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-auto md:w-full md:max-w-[720px] md:px-0">
                        {footer}
                    </div>
                )}
            </div>
        </ParticipantLayout>
    );
}

/** Label hitam di kanan atas bagian lime, mis. "Cap 4 / 10". */
export function HeaderPill({ children }: { children: ReactNode }) {
    return <span className="text-cream rounded-full bg-[#0b0b0b] px-3.5 py-1.5 text-[12px] font-extrabold whitespace-nowrap">{children}</span>;
}
