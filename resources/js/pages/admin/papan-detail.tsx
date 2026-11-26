import { downloadQr, QrImage } from '@/features/admin/qr';
import AdminLayout, { PauseOutletDialog } from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { AlertTriangle, ArrowLeft, Download, Gift, Printer, Tag } from 'lucide-react';
import { useState } from 'react';

type SlotCell = {
    position: string;
    status: string;
    code: string;
    kind: 'voucher' | 'merch' | 'limited';
    prize: string;
    by: string | null;
    at: string | null;
    voucher_code: string | null;
    voucher_status: string | null;
    claimed: boolean;
};
type Selected = { id: number; code: string; name: string; area: string | null; active: boolean; qr: string; slots: SlotCell[] };
type Stock = { label: string; partner: string | null; total: number; used: number; left: number };

const STATUS_LABEL: Record<string, string> = { used: 'Terpakai', held: 'Ditahan', empty: 'Belum diambil' };

/** Warna kartu slot (desain): voucher terpakai lime, merchandise terpakai oranye, ditahan bergaris, belum diambil krem. */
function slotClass(slot: SlotCell, picked: boolean): string {
    return cn(
        'flex min-h-[86px] flex-col justify-between rounded-xl p-2.5 text-left text-[11px] transition',
        slot.status === 'used' && (slot.kind !== 'voucher' ? 'bg-[#f2b134]' : 'bg-lime'),
        slot.status === 'held' && 'border-2 border-dashed border-[#d0271d] bg-white',
        slot.status === 'empty' && 'bg-cream-deep text-ink/60',
        picked && 'ring-ink ring-2 ring-offset-2',
    );
}

/** Detail papan satu warung (desain "W07 · Warung Bu Imas"): 25 slot, sisa di papan, slot terpilih, dan QR warung. */
export default function PapanDetail({ selected, stock }: { selected: Selected | null; stock: Stock[] }) {
    const [pauseOpen, setPauseOpen] = useState(false);
    const [picked, setPicked] = useState<string | null>(null);
    if (!selected) {
        return (
            <AdminLayout active="md-warung" title="Papan">
                <p className="text-ink/50">Warung tidak ditemukan.</p>
            </AdminLayout>
        );
    }
    const slot = selected.slots.find((s) => s.position === picked) ?? selected.slots.find((s) => s.status === 'used') ?? selected.slots[0];
    const used = selected.slots.filter((s) => s.status === 'used').length;
    const usedMerch = selected.slots.filter((s) => s.status === 'used' && s.kind !== 'voucher').length;

    return (
        <AdminLayout
            active="md-warung"
            title={`${selected.code} · ${selected.name}`}
            subtitle={`${selected.area ?? '-'} · papan 5×5, 25 slot. Kode di balik slot hanya terlihat oleh admin.`}
        >
            <div className="-mt-2 mb-4 flex flex-wrap items-center justify-between gap-2">
                <Link href="/admin/master-data/warung" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold">
                    <ArrowLeft className="size-3.5" /> Semua warung
                </Link>
                <div className="flex items-center gap-2">
                    <span
                        className={cn(
                            'rounded-full px-3 py-1 text-[11px] font-extrabold',
                            selected.active ? 'bg-lime' : 'bg-[#fde0dc] text-[#b42318]',
                        )}
                    >
                        {selected.active ? 'Aktif' : 'Dijeda'}
                    </span>
                    {selected.active ? (
                        <button
                            type="button"
                            onClick={() => setPauseOpen(true)}
                            className="flex h-9 items-center rounded-full border-2 border-[#d0271d] bg-white px-4 text-[12px] font-extrabold text-[#b42318]"
                        >
                            Jeda warung
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() =>
                                router.post('/admin/darurat/lanjutkan', { scope: 'outlet', outlet_id: selected.id }, { preserveScroll: true })
                            }
                            className="bg-lime flex h-9 items-center rounded-full px-4 text-[12px] font-extrabold"
                        >
                            Buka lagi warung
                        </button>
                    )}
                    <Link
                        href={`/admin/papan/${selected.code}/pasang`}
                        className="border-ink flex h-9 items-center rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                    >
                        Panduan pasang
                    </Link>
                    <Link
                        href={`/admin/papan/${selected.code}/cetak`}
                        className="border-ink flex h-9 items-center gap-1.5 rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                    >
                        <Printer className="size-4" /> Cetak papan
                    </Link>
                </div>
            </div>

            {!selected.active && (
                <p className="mb-4 flex items-center gap-2 rounded-xl bg-[#fde0dc] px-4 py-2.5 text-[12px] font-bold text-[#b42318]">
                    <AlertTriangle className="size-4" /> Warung dijeda. Peserta yang scan QR warung ini melihat halaman istirahat.
                </p>
            )}

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
                <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-[15px] font-extrabold">Papan {selected.code}</h2>
                    <p className="text-ink/50 text-[11px]">
                        {used} terpakai · {25 - used} belum diambil
                    </p>
                    <div className="text-ink/60 mt-3 flex flex-wrap gap-4 text-[11px]">
                        <span className="flex items-center gap-1.5">
                            <span className="bg-lime size-3 rounded" /> Voucher terpakai
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="size-3 rounded bg-[#f2b134]" /> Barang terpakai
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="bg-cream-deep size-3 rounded" /> Belum diambil
                        </span>
                    </div>
                    <div className="mt-3 overflow-x-auto">
                        <div className="grid min-w-[420px] grid-cols-5 gap-2.5">
                        {selected.slots.map((s) => {
                            const Icon = s.kind !== 'voucher' ? Gift : Tag;
                            return (
                                <button
                                    key={s.position}
                                    type="button"
                                    onClick={() => setPicked(s.position)}
                                    className={slotClass(s, slot?.position === s.position)}
                                >
                                    <span className="flex items-start justify-between">
                                        <span className="text-[13px] font-extrabold">{s.position}</span>
                                        <Icon className="size-3.5 opacity-60" />
                                    </span>
                                    <span className="line-clamp-2 font-bold">{s.prize}</span>
                                    <span className="text-[10px] font-semibold opacity-70">{STATUS_LABEL[s.status] ?? s.status}</span>
                                </button>
                            );
                            })}
                        </div>
                    </div>
                    <div className="bg-cream-deep mt-4 flex h-2 overflow-hidden rounded-full">
                        <span className="bg-[#0b0b0b]" style={{ width: `${((used - usedMerch) / 25) * 100}%` }} />
                        <span className="bg-[#f2b134]" style={{ width: `${(usedMerch / 25) * 100}%` }} />
                    </div>
                    <p className="text-ink/50 mt-1.5 text-[11px]">
                        Terpakai {used} · Belum {25 - used} dari 25 slot
                    </p>
                </section>

                <div className="space-y-4">
                    <section className="rounded-2xl bg-white p-5">
                        <h2 className="text-[14px] font-extrabold">Sisa di papan</h2>
                        <p className="text-ink/50 text-[11px]">Per jenis hadiah, sisa dari total di warung ini</p>
                        <div className="mt-3 space-y-2.5">
                            {stock.map((s) => (
                                <div key={s.label}>
                                    <div className="flex justify-between text-[11px]">
                                        <span className="truncate font-bold">{s.label}</span>
                                        <span className="font-extrabold tabular-nums">
                                            {s.left}/{s.total}
                                        </span>
                                    </div>
                                    <div className="bg-cream-deep mt-1 h-1.5 overflow-hidden rounded-full">
                                        <div
                                            className="bg-lime h-full rounded-full"
                                            style={{ width: `${s.total ? (s.left / s.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {slot && (
                        <section className="rounded-2xl bg-white p-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-[14px] font-extrabold">Slot {slot.position}</h2>
                                <span className="bg-cream-deep rounded-full px-2.5 py-0.5 text-[10px] font-extrabold">
                                    {STATUS_LABEL[slot.status] ?? slot.status}
                                </span>
                            </div>
                            <dl className="divide-ink/5 mt-2 divide-y text-[12px]">
                                {(
                                    [
                                        ['Kode slot', slot.code],
                                        ['Hadiah', slot.prize],
                                        ['Kode voucher', slot.voucher_code ?? '-'],
                                        ['Pengambil', slot.by ?? '-'],
                                        ['Waktu', slot.at ?? '-'],
                                        ['Status hadiah', slot.voucher_status ?? '-'],
                                    ] as const
                                ).map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-3 py-2">
                                        <dt className="text-ink/55">{label}</dt>
                                        <dd className="text-right font-extrabold break-all">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    )}

                    <section className="rounded-2xl bg-white p-5">
                        <h2 className="text-[14px] font-extrabold">QR warung</h2>
                        <div className="mt-3 flex items-center gap-3">
                            <QrImage value={selected.qr} className="size-24 shrink-0" />
                            <div className="min-w-0 text-[11px]">
                                <p className="text-ink/50">Alamat</p>
                                <p className="truncate font-extrabold">{selected.qr.replace(/^https?:\/\//, '')}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => downloadQr(selected.qr, selected.code)}
                            className="border-ink mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-full border-2 text-[12px] font-extrabold"
                        >
                            <Download className="size-4" /> Unduh PNG
                        </button>
                    </section>
                </div>
            </div>

            {pauseOpen && <PauseOutletDialog outlet={selected} used={used} total={selected.slots.length} onClose={() => setPauseOpen(false)} />}
        </AdminLayout>
    );
}
