import { Eyebrow, PartnerPage, payoutBadge } from '@/features/partner/partner-page';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';

export type Week = {
    key: string;
    label: string;
    range: string;
    count: number;
    value: string;
    photos: number;
    redeemed: number;
    status: 'berjalan' | 'menunggu_bayar' | 'dibayar';
    paid_at: string | null;
    proof: string | null;
    month: string;
    month_label: string;
};

export function PayoutBadge({ status }: { status: Week['status'] }) {
    const badge = payoutBadge[status];
    return <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold', badge.className)}>{badge.label}</span>;
}

/** M4 Rekap mingguan: Senin sampai Minggu. Mitra hanya melihat, tidak bisa mengubah angka. */
export default function Rekap({ current, previous }: { current: Week; previous: Week[] }) {
    // Filter bulan: muncul bila minggu sebelumnya sudah lebih dari satu bulan.
    const months = [...new Map(previous.map((w) => [w.month, w.month_label])).entries()];
    const [month, setMonth] = useState('semua');
    const shown = month === 'semua' ? previous : previous.filter((w) => w.month === month);

    return (
        <PartnerPage title="Rekap mingguan" nav="rekap">
            <Link href={`/mitra/rekap/${current.key}`} className="bg-ink text-cream block rounded-3xl p-5">
                <div className="flex items-center justify-between gap-2">
                    <Eyebrow className="text-lime">Senin sampai Minggu</Eyebrow>
                    <PayoutBadge status={current.status} />
                </div>
                <p className="mt-3 text-[30px] leading-none font-extrabold tracking-tight">{current.count} voucher</p>
                <p className="text-lime mt-1 text-[28px] leading-none font-extrabold tracking-tight">{current.value}</p>
                <div className="mt-3 flex items-center justify-between text-[12px]">
                    <span className="text-cream/60">Minggu ini · {current.range}</span>
                    <span className="text-lime flex items-center font-bold">
                        Lihat rincian <ChevronRight className="size-4" />
                    </span>
                </div>
            </Link>

            <div className="mt-6 flex items-baseline justify-between">
                <h2 className="text-[15px] font-extrabold">Minggu sebelumnya</h2>
                <span className="text-ink-soft text-[11px]">Ketuk untuk rincian</span>
            </div>
            {months.length > 1 && (
                <div className="-mx-5 mt-2 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none]" role="group" aria-label="Filter bulan">
                    {[['semua', 'Semua'] as const, ...months].map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setMonth(key)}
                            aria-pressed={month === key}
                            className={cn(
                                'h-9 shrink-0 rounded-full px-4 text-[12px] font-extrabold transition-colors',
                                month === key ? 'bg-ink text-cream' : 'text-ink bg-white',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
            <div className="mt-2 divide-y divide-[#efe7c8] rounded-3xl bg-white px-4">
                {shown.map((week) => (
                    <Link key={week.key} href={`/mitra/rekap/${week.key}`} className="flex items-center justify-between gap-3 py-3.5">
                        <div className="min-w-0">
                            <p className="text-[15px] font-extrabold">{week.label}</p>
                            <p className="text-ink-soft text-[12px]">
                                {week.count} voucher · {week.value}
                            </p>
                        </div>
                        <PayoutBadge status={week.status} />
                    </Link>
                ))}
            </div>
            <p className="text-ink-soft mt-3 text-[11px] leading-relaxed">
                Pembayaran dilakukan admin di luar aplikasi. Angka rekap tidak bisa diubah dari sini.
            </p>
        </PartnerPage>
    );
}
