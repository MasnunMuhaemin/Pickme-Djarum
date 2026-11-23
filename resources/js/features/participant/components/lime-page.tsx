import { BackLink, LogoutButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import type { ReactNode } from 'react';

/** Tombol keluar bulat hitam, serasi dengan tombol kembali di header lime. Hanya tampil saat sudah masuk. */
export const limeLogoutClass = 'bg-ink text-lime hover:bg-ink/85 hover:text-lime md:hidden';

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
    right,
    nav,
    hideBottomNav,
    footer,
    panelClassName,
    children,
}: {
    title: ReactNode;
    /** Judul tab browser; bawaan sama dengan title bila berupa teks. */
    tabTitle?: string;
    subtitle?: ReactNode;
    back?: string;
    right?: ReactNode;
    nav?: string;
    hideBottomNav?: boolean;
    footer?: ReactNode;
    panelClassName?: string;
    children: ReactNode;
}) {
    const isLoggedIn = useIsLoggedIn();

    return (
        <ParticipantLayout title={tabTitle ?? (typeof title === 'string' ? title : undefined)} nav={nav} hideBottomNav={hideBottomNav}>
            <div className="bg-lime px-5 pt-4 pb-14 md:px-8 md:pt-6">
                {(back || right || isLoggedIn) && (
                    <div className="flex min-h-10 items-center justify-between gap-3">
                        {back ? (
                            <BackLink fallback={back} className="bg-ink text-lime grid size-10 shrink-0 place-items-center rounded-full">
                                <ChevronLeft className="size-5" strokeWidth={2.5} />
                            </BackLink>
                        ) : (
                            <span />
                        )}
                        <div className="flex items-center gap-2">
                            {right}
                            <LogoutButton className={limeLogoutClass} />
                        </div>
                    </div>
                )}
                <h1
                    className={cn(
                        'text-[34px] leading-[1.05] font-extrabold tracking-tight md:text-[44px]',
                        back || right || isLoggedIn ? 'mt-3' : 'mt-1',
                    )}
                >
                    {title}
                </h1>
                {subtitle && <p className="mt-2 text-[13px] leading-snug font-semibold md:text-sm">{subtitle}</p>}
            </div>

            <div className={cn('bg-cream relative -mt-7 flex flex-1 flex-col rounded-t-[2rem] px-5 pt-6 pb-6 md:px-8 md:pt-8', panelClassName)}>
                <div className="flex-1 md:mx-auto md:w-full md:max-w-[720px]">{children}</div>
                {footer && (
                    <div className="bg-cream sticky bottom-0 -mx-5 mt-6 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] md:static md:mx-auto md:w-full md:max-w-[720px] md:px-0">
                        {footer}
                    </div>
                )}
            </div>
        </ParticipantLayout>
    );
}

/** Label hitam di kanan atas bagian lime, mis. "Cap 4 / 10". */
export function HeaderPill({ children }: { children: ReactNode }) {
    return <span className="bg-ink text-cream rounded-full px-3.5 py-1.5 text-[12px] font-extrabold whitespace-nowrap">{children}</span>;
}
