import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Check, Gift, Printer, Tag } from 'lucide-react';

type Slot = { position: string; prize: string; kind: 'voucher' | 'merch' | 'limited'; installed: boolean };

/**
 * Panduan pasang papan (desain "W12 · Kantin Bu Sri"): tim menempel plastik urut A1 sampai E5. Slot berikutnya
 * ditandai "Giliran sekarang"; setelah ditempel, tim menandai terpasang.
 */
export default function PasangPapan({
    outlet,
    slots,
    next,
    items,
}: {
    outlet: { code: string; name: string; area: string | null };
    slots: Slot[];
    next: string | null;
    items: { label: string; count: number }[];
}) {
    const installed = slots.filter((s) => s.installed).length;
    const current = slots.find((s) => s.position === next) ?? null;
    const mark = (position: string, value: boolean) =>
        router.post(`/admin/papan/${outlet.code}/pasang`, { position, installed: value }, { preserveScroll: true });

    return (
        <AdminLayout
            active="md-warung"
            title={`${outlet.code} · ${outlet.name}`}
            subtitle={`${outlet.area ?? '-'} · panduan pasang 25 slot. Urutan A1 sampai E5, kiri ke kanan, baris demi baris.`}
        >
            <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link
                    href={`/admin/papan/${outlet.code}`}
                    className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold"
                >
                    <ArrowLeft className="size-3.5" /> Semua papan
                </Link>
                <div className="flex items-center gap-2">
                    <span className={cn('rounded-full px-3 py-1 text-[11px] font-extrabold', next ? 'bg-[#fff1d6] text-[#b07a12]' : 'bg-lime')}>
                        {next ? 'Sedang dipasang' : 'Terpasang semua'}
                    </span>
                    <Link
                        href={`/admin/papan/${outlet.code}/cetak`}
                        className="border-ink flex h-9 items-center gap-1.5 rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                    >
                        <Printer className="size-4" /> Cetak paket {outlet.code}
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-[15px] font-extrabold">Papan {outlet.code}</h2>
                    <p className="text-ink/50 text-[11px]">
                        {installed} terpasang · {next ? '1 giliran sekarang · ' : ''}
                        {25 - installed - (next ? 1 : 0)} belum
                    </p>
                    <div className="mt-4 overflow-x-auto">
                        <div className="grid min-w-[420px] grid-cols-5 gap-2.5">
                        {slots.map((s) => {
                            const isNext = s.position === next;
                            const Icon = s.kind !== 'voucher' ? Gift : Tag;
                            return (
                                <button
                                    key={s.position}
                                    type="button"
                                    onClick={() => s.installed && mark(s.position, false)}
                                    title={s.installed ? 'Ketuk untuk membatalkan tanda terpasang' : undefined}
                                    className={cn(
                                        'flex min-h-[86px] flex-col justify-between rounded-xl p-2.5 text-left text-[11px]',
                                        s.installed && 'bg-lime-soft border-lime border',
                                        isNext && 'border-ink border-2 bg-white',
                                        !s.installed && !isNext && 'border-ink/20 text-ink/55 border border-dashed',
                                    )}
                                >
                                    <span className="flex justify-between">
                                        <span className="text-[13px] font-extrabold">{s.position}</span>
                                        <Icon className="size-3.5 opacity-60" />
                                    </span>
                                    <span className="line-clamp-2 font-bold">{s.prize}</span>
                                    <span
                                        className={cn(
                                            'text-[10px] font-extrabold',
                                            isNext && 'bg-ink text-cream rounded-full px-2 py-0.5 text-center',
                                        )}
                                    >
                                        {s.installed ? '✓ Terpasang' : isNext ? 'Giliran sekarang' : 'Belum'}
                                    </span>
                                </button>
                            );
                            })}
                        </div>
                    </div>
                    <div className="bg-cream-deep mt-4 h-2 overflow-hidden rounded-full">
                        <div className="bg-lime h-full rounded-full" style={{ width: `${(installed / 25) * 100}%` }} />
                    </div>
                    <p className="text-ink/60 mt-1.5 text-[11px] font-bold">Terpasang {installed} dari 25</p>
                </section>

                <div className="space-y-4">
                    <section className="rounded-2xl bg-white p-5">
                        <h2 className="text-[14px] font-extrabold">Giliran sekarang</h2>
                        {current ? (
                            <>
                                <div className="mt-3 flex items-center gap-3">
                                    <span className="bg-ink text-lime grid size-16 place-items-center rounded-2xl text-[26px] font-extrabold">
                                        {current.position}
                                    </span>
                                    <span>
                                        <span className="block text-[13px] font-extrabold">{current.prize}</span>
                                        <span className="bg-lime mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold">
                                            {{ merch: 'Merchandise', limited: 'Limited edition', voucher: 'Voucher' }[current.kind]}
                                        </span>
                                    </span>
                                </div>
                                <ol className="text-ink/70 mt-3 space-y-1.5 text-[11px]">
                                    {[
                                        `Ambil barang dan kartu kode ${current.position}`,
                                        'Masukkan keduanya ke plastik',
                                        `Tempel di posisi ${current.position} papan`,
                                    ].map((t, i) => (
                                        <li key={t} className="flex gap-2">
                                            <span className="bg-lime-soft grid size-4 shrink-0 place-items-center rounded-full text-[9px] font-extrabold">
                                                {i + 1}
                                            </span>
                                            {t}
                                        </li>
                                    ))}
                                </ol>
                                <button
                                    type="button"
                                    onClick={() => mark(current.position, true)}
                                    className="bg-lime mt-4 flex h-10 w-full items-center justify-center gap-1.5 rounded-full text-[12px] font-extrabold"
                                >
                                    <Check className="size-4" strokeWidth={3} /> Tandai {current.position} terpasang
                                </button>
                            </>
                        ) : (
                            <p className="text-ink/60 mt-2 text-[12px]">Semua 25 slot sudah terpasang.</p>
                        )}
                    </section>

                    <section className="rounded-2xl bg-white p-5">
                        <h2 className="text-[14px] font-extrabold">Daftar barang {outlet.code}</h2>
                        <p className="text-ink/50 text-[11px]">Siapkan sebelum mulai · 25 barang</p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                            {items.map((it) => (
                                <div key={it.label} className="flex justify-between gap-2">
                                    <dt className="truncate font-bold">{it.label}</dt>
                                    <dd className="font-extrabold">{it.count}</dd>
                                </div>
                            ))}
                        </dl>
                    </section>
                </div>
            </div>
        </AdminLayout>
    );
}
