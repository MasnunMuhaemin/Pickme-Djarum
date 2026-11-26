import {
    Btn,
    Card,
    Chip,
    Empty,
    FieldError,
    Modal,
    Phone,
    SearchInput,
    SelectInput,
    TextArea,
    useConfirm,
    useServerSearch,
} from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { Link, router, useForm } from '@inertiajs/react';
import { Ban, ImageOff, Trash2 } from 'lucide-react';
import { useState } from 'react';

type PhotoItem = {
    id: number;
    claim_code: string;
    status: string;
    outlet: string;
    time: string;
    date: string;
    photo_url: string | null;
    participant: string;
    whatsapp: string | null;
    history: string;
    flags: string[];
    slot: string | null;
    reward: string | null;
    voucher_code: string | null;
    /** Alasan klaim tidak bisa ditolak (hadiah sudah diproses), atau null bila bisa. */
    reject_blocker: string | null;
    reject_reason: string | null;
    rejected_at: string | null;
};

const STATUS: Record<string, { label: string; tone: 'green' | 'yellow' | 'red' | 'gray' }> = {
    approved: { label: 'Berhasil', tone: 'green' },
    pending: { label: 'Klaim lama: menunggu', tone: 'yellow' },
    rejected: { label: 'Ditolak', tone: 'red' },
};

/** A2 Foto klaim: galeri foto bungkus tiap klaim, terbaru dulu. Tidak ada persetujuan admin lagi. */
export default function FotoKlaim({
    photos,
    pagination,
    outlets,
    outlet,
    search,
}: {
    photos: PhotoItem[];
    pagination: { current: number; last: number; total: number };
    outlets: string[];
    outlet: string | null;
    search: string;
}) {
    const [open, setOpen] = useState<PhotoItem | null>(null);
    // Tolak klaim: alasan wajib, hadiah dibatalkan dan cap dicabut.
    const [rejecting, setRejecting] = useState<PhotoItem | null>(null);
    const rejectForm = useForm({ reason: '' });

    function submitReject() {
        if (!rejecting) return;
        rejectForm.post(`/admin/antrean-foto/${rejecting.id}/tolak`, {
            preserveScroll: true,
            onSuccess: () => {
                setRejecting(null);
                setOpen(null);
                rejectForm.reset();
            },
        });
    }
    const [confirm, confirmDialog] = useConfirm();
    const [q, setQ] = useServerSearch(search, (value) =>
        router.get(query(1, outlet, value), {}, { preserveState: true, preserveScroll: true, replace: true }),
    );

    function askDelete(p: PhotoItem) {
        confirm({
            title: `Hapus foto klaim ${p.claim_code}?`,
            message: 'File foto dihapus permanen dan tidak bisa dikembalikan. Klaim dan hadiah peserta tetap ada. Penghapusan tercatat di log.',
            confirmLabel: 'Hapus foto',
            danger: true,
            onConfirm: () => router.delete(`/admin/antrean-foto/${p.id}/foto`, { preserveScroll: true, onSuccess: () => setOpen(null) }),
        });
    }
    const query = (page: number, code: string | null = outlet, text: string = search) => {
        const q = new URLSearchParams();
        if (code) q.set('warung', code);
        if (text) q.set('q', text);
        if (page > 1) q.set('page', String(page));
        return `/admin/antrean-foto${q.size ? `?${q}` : ''}`;
    };

    return (
        <AdminLayout active="antrean-foto" title="Foto klaim" subtitle={`${pagination.total} foto bungkus dari peserta · terbaru di atas`}>
            <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={q} onChange={setQ} placeholder="Cari nama, nomor, kode klaim, atau kode voucher" />
                <span className="text-ink/55 text-[11px] font-bold">Warung</span>
                <SelectInput
                    value={outlet ?? ''}
                    onChange={(code) => router.get(query(1, code || null), {}, { preserveScroll: true })}
                    placeholder="Semua warung"
                    options={outlets.map((code) => ({ value: code, label: code }))}
                    className="w-56"
                />
            </div>

            <Card className="mt-4">
                {photos.length ? (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                        {photos.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setOpen(p)}
                                className="border-ink/10 hover:border-ink group overflow-hidden rounded-xl border text-left transition"
                            >
                                <div className="bg-night-soft relative aspect-square">
                                    {p.photo_url ? (
                                        <img src={p.photo_url} alt={`Foto klaim ${p.claim_code}`} loading="lazy" className="size-full object-cover" />
                                    ) : (
                                        <span className="text-cream/50 grid size-full place-items-center">
                                            <ImageOff className="size-6" />
                                        </span>
                                    )}
                                    <span className="bg-lime absolute bottom-2 left-2 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold">
                                        {p.outlet} · {p.claim_code}
                                    </span>
                                </div>
                                <div className="p-2.5">
                                    <p className="truncate text-[12px] font-extrabold">{p.participant}</p>
                                    <p className="text-ink/50 text-[10px]">
                                        {p.date} · {p.time}
                                    </p>
                                    {p.status !== 'approved' && (
                                        <Chip tone={STATUS[p.status]?.tone ?? 'gray'} className="mt-1">
                                            {STATUS[p.status]?.label ?? p.status}
                                        </Chip>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <Empty>
                        {search ? `Tidak ada foto yang cocok dengan "${search}".` : `Belum ada foto klaim${outlet ? ` di ${outlet}` : ''}.`}
                    </Empty>
                )}

                {pagination.last > 1 && (
                    <div className="mt-4 flex items-center justify-end gap-2 text-[12px]">
                        {pagination.current > 1 && (
                            <Link href={query(pagination.current - 1)} className="border-ink/15 rounded-full border px-3 py-1 font-bold">
                                Sebelumnya
                            </Link>
                        )}
                        <span className="text-ink/50">
                            Halaman {pagination.current} dari {pagination.last}
                        </span>
                        {pagination.current < pagination.last && (
                            <Link href={query(pagination.current + 1)} className="border-ink/15 rounded-full border px-3 py-1 font-bold">
                                Berikutnya
                            </Link>
                        )}
                    </div>
                )}
            </Card>

            <Modal open={open !== null} onClose={() => setOpen(null)} width="max-w-2xl">
                {open && (
                    <div className="grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                        <div className="bg-night-soft flex items-center justify-center overflow-hidden rounded-xl">
                            {open.photo_url ? (
                                <img src={open.photo_url} alt={`Foto klaim ${open.claim_code}`} className="max-h-[70dvh] w-full object-contain" />
                            ) : (
                                <span className="text-cream/50 grid h-60 place-items-center">Foto tidak tersedia</span>
                            )}
                        </div>
                        <div className="pr-6">
                            <h2 className="text-[16px] font-extrabold">{open.claim_code}</h2>
                            <dl className="divide-ink/5 mt-2 divide-y text-[12px]">
                                {(
                                    [
                                        ['Peserta', open.participant],
                                        ['WhatsApp', <Phone key="wa" value={open.whatsapp} />],
                                        ['Warung', open.outlet],
                                        ['Waktu', `${open.date} · ${open.time}`],
                                        ['Slot', open.slot ?? '-'],
                                        ['Hadiah', open.reward ?? '-'],
                                        [
                                            'Kode voucher',
                                            open.voucher_code ? (
                                                <span key="kode" className="font-mono tracking-wider">
                                                    {open.voucher_code}
                                                </span>
                                            ) : (
                                                '-'
                                            ),
                                        ],
                                        ['Riwayat', open.history],
                                        ...(open.status === 'rejected'
                                            ? ([
                                                  [
                                                      'Status',
                                                      <Chip key="st" tone="red">
                                                          Ditolak{open.rejected_at ? ` · ${open.rejected_at}` : ''}
                                                      </Chip>,
                                                  ],
                                                  ['Alasan', open.reject_reason ?? '-'],
                                              ] as const)
                                            : []),
                                    ] as const
                                ).map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-3 py-2">
                                        <dt className="text-ink/50">{label}</dt>
                                        <dd className="text-right font-bold">{value}</dd>
                                    </div>
                                ))}
                            </dl>
                            {open.flags.length > 0 && (
                                <div className="mt-2">
                                    <p className="text-ink/50 text-[11px]">Catatan sistem</p>
                                    <div className="mt-1 flex flex-wrap gap-1">
                                        {open.flags.map((f) => (
                                            <Chip key={f}>{f}</Chip>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {open.status === 'approved' && !open.reject_blocker && (
                                    <Btn variant="outline" onClick={() => setRejecting(open)}>
                                        <Ban className="size-3.5" />
                                        Tolak klaim
                                    </Btn>
                                )}
                                <Btn variant="red" onClick={() => askDelete(open)}>
                                    <Trash2 className="size-3.5" />
                                    Hapus foto
                                </Btn>
                            </div>
                            {open.status === 'approved' && open.reject_blocker && (
                                <p className="text-ink/50 mt-2 text-[11px] leading-relaxed">{open.reject_blocker}</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
            <Modal open={rejecting !== null} onClose={() => setRejecting(null)} danger>
                {rejecting && (
                    <div>
                        <h2 className="text-[15px] font-extrabold">Tolak klaim {rejecting.claim_code}?</h2>
                        <p className="text-ink/60 mt-1 text-[12px] leading-relaxed">
                            Hadiah klaim ini dibatalkan dan capnya dicabut. Di kartu cap peserta, nomor ini tampil sebagai &quot;ditolak&quot; dan
                            klaim berikutnya lanjut ke nomor sesudahnya. Penolakan tercatat di log.
                        </p>
                        <label htmlFor="reject-reason" className="mt-3 block text-[12px] font-bold">
                            Alasan penolakan
                        </label>
                        <TextArea
                            id="reject-reason"
                            value={rejectForm.data.reason}
                            onChange={(e) => rejectForm.setData('reason', e.target.value)}
                            placeholder="Mis. foto bukan bungkus produk program"
                            className="mt-1"
                        />
                        <FieldError message={rejectForm.errors.reason} />
                        <div className="mt-4 flex justify-end gap-2">
                            <Btn variant="outline" onClick={() => setRejecting(null)}>
                                Batal
                            </Btn>
                            <Btn variant="red" disabled={rejectForm.data.reason.trim().length < 5 || rejectForm.processing} onClick={submitReject}>
                                Tolak klaim
                            </Btn>
                        </div>
                    </div>
                )}
            </Modal>
            {confirmDialog}
        </AdminLayout>
    );
}
