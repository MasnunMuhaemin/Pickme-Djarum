import { Btn, DateInput, FieldError, Modal, TextInput, rupiah } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { ChevronRight, MessageCircle, Upload } from 'lucide-react';
import { useState } from 'react';

type Row = { id: number; name: string; kind: string; count: number; value: number; status: 'menunggu_bayar' | 'dibayar' };
type Detail = Row & {
    photos: number;
    photo_urls: string[];
    paid_at: string | null;
    proof: string | null;
    proof_url: string | null;
    correction: string | null;
    wa: string | null;
};

function StatusChip({ status }: { status: Row['status'] }) {
    return status === 'dibayar' ? (
        <span className="bg-lime rounded-full px-2.5 py-0.5 text-[10px] font-extrabold">Dibayar</span>
    ) : (
        <span className="rounded-full bg-[#fde0dc] px-2.5 py-0.5 text-[10px] font-extrabold text-[#b42318]">Menunggu bayar</span>
    );
}

function CorrectDialog({ row, onClose }: { row: Detail; onClose: () => void }) {
    const form = useForm({ count: String(row.count), reason: '' });
    return (
        <Modal open onClose={onClose}>
            <h3 className="text-[15px] font-extrabold">Koreksi nominal · {row.name}</h3>
            <p className="text-ink/55 mt-1 text-[12px]">Hanya sebelum dibayar. Koreksi wajib beralasan dan tercatat di log.</p>
            <label className="mt-3 block text-[11px] font-bold">
                Jumlah voucher ditukar
                <TextInput type="number" min={0} value={form.data.count} onChange={(e) => form.setData('count', e.target.value)} className="mt-1" />
            </label>
            <FieldError message={form.errors.count} />
            <label className="mt-3 block text-[11px] font-bold">
                Alasan koreksi
                <TextInput value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} className="mt-1" />
            </label>
            <FieldError message={form.errors.reason} />
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    disabled={form.data.count === '' || form.data.reason.trim().length < 5 || form.processing}
                    onClick={() => form.post(`/admin/mitra/${row.id}/koreksi`, { preserveScroll: true, onSuccess: onClose })}
                >
                    Simpan koreksi
                </Btn>
            </div>
        </Modal>
    );
}

/** Panel kanan: rincian mitra minggu lalu, foto bukti penukaran, dan tandai dibayar dengan bukti transfer. */
function DetailPanel({ detail, weekLabel }: { detail: Detail; weekLabel: string }) {
    const form = useForm<{ paid_at: string; proof_file: File | null }>({ paid_at: '', proof_file: null });
    const [correcting, setCorrecting] = useState(false);
    const paid = detail.status === 'dibayar';

    return (
        <section className="rounded-2xl bg-white p-5">
            <h2 className="text-[15px] font-extrabold">
                {detail.name} ({detail.kind}) · minggu lalu
            </h2>
            <p className="text-ink/50 text-[11px]">{weekLabel}</p>
            <dl className="divide-ink/5 mt-2 divide-y text-[12px]">
                <div className="flex justify-between py-2">
                    <dt className="text-ink/55">Voucher ditukar</dt>
                    <dd className="font-extrabold">{detail.count}</dd>
                </div>
                <div className="flex justify-between py-2">
                    <dt className="text-ink/55">Nominal</dt>
                    <dd className="font-extrabold">{rupiah(detail.value)}</dd>
                </div>
                <div className="flex justify-between py-2">
                    <dt className="text-ink/55">Foto bukti</dt>
                    <dd className="font-extrabold">
                        {detail.photos} dari {detail.count}
                    </dd>
                </div>
            </dl>

            {detail.wa ? (
                <a
                    href={detail.wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-lime mt-3 flex h-10 items-center justify-center gap-2 rounded-full text-[12px] font-extrabold"
                >
                    <MessageCircle className="size-4" /> WhatsApp mitra
                </a>
            ) : (
                <p className="text-ink/45 mt-3 text-[11px]">Nomor WhatsApp mitra belum diisi (isi di tab Akun mitra).</p>
            )}

            <p className="mt-3 text-[11px] font-bold">Foto bukti penukaran</p>
            <p className="text-ink/45 text-[10px]">Foto yang diambil mitra saat menukar voucher peserta.</p>
            <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
                {Array.from({ length: 6 }, (_, i) =>
                    detail.photo_urls[i] ? (
                        <a key={i} href={detail.photo_urls[i]} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-lg">
                            <img src={detail.photo_urls[i]} alt={`Foto bukti ${i + 1}`} className="aspect-square w-full object-cover" />
                        </a>
                    ) : (
                        <span key={i} className="bg-cream-deep text-ink/40 grid aspect-square place-items-center rounded-lg text-[10px] font-bold">
                            {i + 1}
                        </span>
                    ),
                )}
            </div>
            {detail.photos > 6 && <p className="text-ink/50 mt-1 text-[11px] font-bold">+{detail.photos - 6} foto lainnya</p>}

            {paid ? (
                <div className="bg-lime-soft mt-4 rounded-xl p-3 text-[12px]">
                    <p className="font-extrabold">Sudah dibayar {detail.paid_at}</p>
                    {detail.proof_url && (
                        <a href={detail.proof_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-bold underline">
                            Lihat bukti transfer
                        </a>
                    )}
                </div>
            ) : (
                <>
                    <label className="mt-4 block text-[11px] font-bold">
                        Tanggal bayar
                        <DateInput value={form.data.paid_at} onChange={(v) => form.setData('paid_at', v)} className="mt-1" />
                    </label>
                    <FieldError message={form.errors.paid_at} />
                    <p className="mt-3 text-[11px] font-bold">Bukti transfer</p>
                    <label className="border-ink/15 bg-cream/60 mt-1 flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-[12px]">
                        <Upload className="text-ink/50 size-4" />
                        <span className={cn('truncate', !form.data.proof_file && 'text-ink/45')}>
                            {form.data.proof_file?.name ?? 'Unggah foto atau PDF...'}
                        </span>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            className="sr-only"
                            onChange={(e) => form.setData('proof_file', e.target.files?.[0] ?? null)}
                        />
                    </label>
                    <FieldError message={form.errors.proof_file} />
                    <div className="mt-4 space-y-2">
                        <Btn
                            variant="yellow"
                            className="h-11 w-full justify-center rounded-full"
                            disabled={!form.data.paid_at || !form.data.proof_file || form.processing}
                            onClick={() =>
                                form.post(`/admin/mitra/${detail.id}/dibayar`, {
                                    forceFormData: true,
                                    preserveScroll: true,
                                    onSuccess: () => form.reset(),
                                })
                            }
                        >
                            Tandai dibayar
                        </Btn>
                        <Btn variant="outline" className="h-11 w-full justify-center rounded-full border-2" onClick={() => setCorrecting(true)}>
                            Koreksi nominal
                        </Btn>
                    </div>
                    <p className="text-ink/45 mt-2 text-[10px]">Koreksi wajib beralasan dan tercatat di log.</p>
                </>
            )}
            {detail.correction && <p className="text-ink/55 mt-2 text-[11px]">Koreksi: {detail.correction}</p>}
            {correcting && <CorrectDialog row={detail} onClose={() => setCorrecting(false)} />}
        </section>
    );
}

/** A5 Mitra dan pembayaran · Rekap mingguan (desain): tabel minggu lalu dan panel mitra terpilih. */
export default function Pembayaran({
    lastWeekLabel,
    rows,
    detail,
    summary,
}: {
    lastWeekLabel: string;
    rows: Row[];
    detail: Detail | null;
    summary: { partners: number; vouchers: number; value: number };
}) {
    return (
        <AdminLayout
            active="pembayaran"
            title="Mitra dan pembayaran"
            subtitle="Rekap penukaran voucher per mitra. Admin menandai dibayar setelah transfer."
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-extrabold">
                    Minggu lalu · {summary.partners} mitra · {summary.vouchers} voucher · {rupiah(summary.value)}
                </p>
                <a href="/admin/pembayaran/ekspor" className="border-ink rounded-full border-2 bg-white px-4 py-1.5 text-[12px] font-extrabold">
                    Ekspor CSV
                </a>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-2xl bg-white p-3">
                    <div className="text-ink/50 hidden gap-3 px-3 py-2 text-[11px] font-semibold lg:grid lg:grid-cols-[minmax(0,1.6fr)_70px_120px_130px_20px]">
                        <span>Mitra</span>
                        <span>Voucher</span>
                        <span>Nominal</span>
                        <span>Status</span>
                        <span />
                    </div>
                    {rows.length === 0 && <p className="text-ink/50 py-10 text-center text-[12px]">Belum ada penukaran minggu lalu.</p>}
                    {rows.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            onClick={() =>
                                router.get('/admin/pembayaran', { mitra: r.id }, { preserveScroll: true, preserveState: true, replace: true })
                            }
                            className={cn(
                                'grid w-full grid-cols-2 gap-x-3 gap-y-1 rounded-xl px-3 py-3 text-left text-[13px] sm:grid-cols-[minmax(0,1.6fr)_70px_120px_130px_20px] sm:items-center sm:gap-3',
                                detail?.id === r.id ? 'bg-lime' : 'hover:bg-cream/60',
                            )}
                        >
                            <span className="min-w-0">
                                <span className="block truncate font-extrabold">{r.name}</span>
                                <span className="text-ink/50 block text-[10px]">{r.kind}</span>
                            </span>
                            <span className="font-extrabold">{r.count}</span>
                            <span className="font-extrabold">{rupiah(r.value)}</span>
                            <StatusChip status={r.status} />
                            <ChevronRight className="hidden size-4 sm:block" />
                        </button>
                    ))}
                </section>
                {detail && <DetailPanel key={detail.id} detail={detail} weekLabel={lastWeekLabel} />}
            </div>
        </AdminLayout>
    );
}
