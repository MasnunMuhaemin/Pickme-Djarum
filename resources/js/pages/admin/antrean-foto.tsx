import { Btn, Chip, Phone, SearchInput, SelectInput, useConfirm, useServerSearch } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import { ImageOff, Inbox, Trash2 } from 'lucide-react';
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
    reject_reason: string | null;
    rejected_at: string | null;
};

/** A2 Antrean foto (desain): daftar klaim di kiri, foto dan rincian di kanan. Klaim otomatis berhasil; admin bisa menolak. */
export default function AntreanFoto({
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
    const [pickedId, setPickedId] = useState<number | null>(null);
    const open = photos.find((p) => p.id === pickedId) ?? photos[0] ?? null;
    const [confirm, confirmDialog] = useConfirm();

    const query = (page: number, code: string | null = outlet, text: string = search) => {
        const q = new URLSearchParams();
        if (code) q.set('warung', code);
        if (text) q.set('q', text);
        if (page > 1) q.set('page', String(page));
        return `/admin/antrean-foto${q.size ? `?${q}` : ''}`;
    };
    const [q, setQ] = useServerSearch(search, (value) =>
        router.get(query(1, outlet, value), {}, { preserveState: true, preserveScroll: true, replace: true }),
    );

    function askDelete(p: PhotoItem) {
        confirm({
            title: `Hapus foto klaim ${p.claim_code}?`,
            message: 'File foto dihapus permanen dan tidak bisa dikembalikan. Klaim dan hadiah peserta tetap ada. Penghapusan tercatat di log.',
            confirmLabel: 'Hapus foto',
            danger: true,
            onConfirm: () => router.delete(`/admin/antrean-foto/${p.id}/foto`, { preserveScroll: true }),
        });
    }

    return (
        <AdminLayout
            active="antrean-foto"
            title="Antrean foto"
            subtitle="Klaim otomatis berhasil tanpa persetujuan admin. Foto bungkus tiap klaim, terbaru di atas."
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span />
                <SelectInput
                    value={outlet ?? ''}
                    onChange={(code) => router.get(query(1, code || null), {}, { preserveScroll: true })}
                    placeholder="Semua warung"
                    options={outlets.map((code) => ({ value: code, label: code }))}
                    className="w-48"
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_460px]">
                <section className="rounded-2xl bg-white p-4">
                    <SearchInput value={q} onChange={setQ} placeholder="Cari nama, nomor, kode klaim, atau kode voucher" className="mb-3" />
                    <ul className="divide-ink/5 divide-y">
                        {photos.map((p) => (
                            <li key={p.id}>
                                <button
                                    type="button"
                                    onClick={() => setPickedId(p.id)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition',
                                        open?.id === p.id ? 'bg-lime-soft' : 'hover:bg-cream/60',
                                    )}
                                >
                                    <span className="bg-night-soft grid size-12 shrink-0 place-items-center overflow-hidden rounded-lg">
                                        {p.photo_url ? (
                                            <img src={p.photo_url} alt="" loading="lazy" className="size-full object-cover" />
                                        ) : (
                                            <ImageOff className="text-cream/50 size-4" />
                                        )}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[13px] font-extrabold">{p.participant}</span>
                                        <span className="text-ink/55 block truncate text-[11px]">
                                            {p.outlet} · {p.claim_code} · {p.reward ?? 'Hadiah'}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 flex-col items-end gap-1">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                                                p.status === 'rejected' ? 'bg-[#fde0dc] text-[#b42318]' : 'bg-lime',
                                            )}
                                        >
                                            {p.status === 'rejected' ? 'Ditolak' : 'Berhasil'}
                                        </span>
                                        <span className="text-ink/40 text-[10px]">
                                            {p.date} · {p.time.slice(0, 5)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {photos.length === 0 && (
                        <p className="text-ink/45 flex flex-col items-center gap-2 py-12 text-[12px]">
                            <Inbox className="size-6" />
                            {search ? `Tidak ada foto yang cocok dengan "${search}".` : `Belum ada foto klaim${outlet ? ` di ${outlet}` : ''}.`}
                        </p>
                    )}
                    {pagination.last > 1 && (
                        <div className="mt-3 flex items-center justify-end gap-2 text-[12px]">
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
                </section>

                <aside className="h-fit rounded-2xl bg-white p-4 xl:sticky xl:top-4">
                    {open ? (
                        <>
                            <div className="bg-night-soft flex items-center justify-center overflow-hidden rounded-xl">
                                {open.photo_url ? (
                                    <img src={open.photo_url} alt={`Foto klaim ${open.claim_code}`} className="max-h-[52dvh] w-full object-contain" />
                                ) : (
                                    <span className="text-cream/50 grid h-48 place-items-center text-[12px]">Foto tidak tersedia</span>
                                )}
                            </div>
                            <div className="mt-3 flex items-center justify-between gap-2">
                                <h2 className="font-mono text-[16px] font-extrabold">{open.claim_code}</h2>
                                <span
                                    className={cn(
                                        'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                                        open.status === 'rejected' ? 'bg-[#fde0dc] text-[#b42318]' : 'bg-lime',
                                    )}
                                >
                                    {open.status === 'rejected' ? `Ditolak${open.rejected_at ? ` · ${open.rejected_at}` : ''}` : 'Berhasil otomatis'}
                                </span>
                            </div>
                            <dl className="divide-ink/5 mt-2 divide-y text-[12px]">
                                {(
                                    [
                                        ['Peserta', open.participant],
                                        ['WhatsApp', <Phone key="wa" value={open.whatsapp} />],
                                        ['Warung · slot', `${open.outlet} · ${open.slot ?? '-'}`],
                                        ['Waktu', `${open.date} · ${open.time}`],
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
                                        ...(open.status === 'rejected' ? ([['Alasan ditolak', open.reject_reason ?? '-']] as const) : []),
                                    ] as const
                                ).map(([label, value]) => (
                                    <div key={label} className="flex justify-between gap-3 py-2">
                                        <dt className="text-ink/50 shrink-0">{label}</dt>
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
                            <div className="mt-4">
                                <Btn variant="outline" className="h-10 w-full justify-center rounded-full border-2" onClick={() => askDelete(open)}>
                                    <Trash2 className="size-3.5" /> Hapus foto
                                </Btn>
                            </div>
                        </>
                    ) : (
                        <p className="text-ink/45 py-12 text-center text-[12px]">Pilih klaim di kiri untuk melihat fotonya.</p>
                    )}
                </aside>
            </div>

            {confirmDialog}
        </AdminLayout>
    );
}
