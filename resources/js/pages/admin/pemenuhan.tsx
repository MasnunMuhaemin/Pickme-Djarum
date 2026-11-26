import { Btn, BtnLink, DateInput, FieldError, Hint, Modal, Phone, PillTabs, Req, SearchInput, TextInput, matches } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router, useForm } from '@inertiajs/react';
import { Copy, Inbox } from 'lucide-react';
import { useState } from 'react';

type Tab = 'topup' | 'token' | 'bensin' | 'barang' | 'bantuan';
type Row = {
    key: string;
    id: number;
    kind: Tab;
    type: string;
    name: string;
    whatsapp: string | null;
    prize: string;
    value: string | null;
    status: string;
    label: string;
    done: boolean;
    at: string | null;
    claim: string | null;
    outlet: string | null;
    destination?: string | null;
    failed?: number;
    max?: number;
    fail_reason?: string | null;
    handed?: string | null;
    area?: string | null;
    address?: string | null;
    shipped_at?: string | null;
    completed_at?: string | null;
    wa: string | null;
};

const TABS: { key: Tab; label: string; hint: string }[] = [
    { key: 'topup', label: 'Top up', hint: 'Pulsa/kuota diisi admin ke nomor peserta' },
    { key: 'token', label: 'Token listrik', hint: 'Token listrik diproses manual ke agregator' },
    { key: 'bensin', label: 'Bensin tunai', hint: 'Admin menghubungi peserta lalu mencatat serah terima' },
    { key: 'barang', label: 'Merch dan LE', hint: 'Admin mengirim sendiri ke alamat pengiriman' },
    { key: 'bantuan', label: 'Perlu bantuan', hint: 'Nomor tujuan sudah salah berkali-kali; hubungi peserta' },
];

function Field({ label, children, mono }: { label: string; children: React.ReactNode; mono?: boolean }) {
    return (
        <div className="flex justify-between gap-4 py-2 text-[12px]">
            <dt className="text-ink/55 shrink-0">{label}</dt>
            <dd className={cn('text-right font-bold break-words', mono && 'font-mono')}>{children}</dd>
        </div>
    );
}

function Copyable({ value }: { value: string }) {
    return (
        <span className="inline-flex items-center gap-2">
            <span className="font-mono">{value}</span>
            <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(value)}
                aria-label="Salin nomor"
                className="bg-cream-deep grid size-6 place-items-center rounded-full"
            >
                <Copy className="size-3" />
            </button>
        </span>
    );
}

const post = (url: string, data = {}) => router.post(url, data, { preserveScroll: true });

/** Aksi detail sesuai tab. Form wajib (referensi, alasan, tanggal serah) dibuka di popup. */
function Actions({ row }: { row: Row }) {
    const [dialog, setDialog] = useState<'tokenFail' | 'topupWrong' | 'handover' | null>(null);
    const [reference, setReference] = useState('');
    const fail = useForm({ reason: '' });
    const hand = useForm({ date: new Date().toISOString().slice(0, 10), recipient: row.name });
    const help = useForm({ destination: row.destination ?? '' });
    const close = () => setDialog(null);
    const ready = row.status === 'pending_process';

    return (
        <div className="space-y-2">
            {row.kind === 'topup' && ready && (
                <div className="grid grid-cols-2 gap-2">
                    <Btn variant="outline" className="h-10 justify-center rounded-full border-2" onClick={() => setDialog('topupWrong')}>
                        Nomor tidak bisa diisi
                    </Btn>
                    <Btn
                        variant="yellow"
                        className="h-10 justify-center rounded-full"
                        onClick={() => post(`/admin/pemenuhan/topup/${row.id}/selesai`)}
                    >
                        Sudah di-top up
                    </Btn>
                </div>
            )}

            {row.kind === 'token' && ready && (
                <>
                    <label className="block text-[11px] font-bold">
                        Nomor referensi agregator
                        <Req />
                        <TextInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Mis. REF-123456" className="mt-1" />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        <Btn variant="outline" className="h-10 justify-center rounded-full border-2" onClick={() => setDialog('tokenFail')}>
                            Gagal
                        </Btn>
                        <Btn
                            variant="yellow"
                            className="h-10 justify-center rounded-full"
                            disabled={!reference.trim()}
                            onClick={() => post(`/admin/pemenuhan/token/${row.id}/berhasil`, { reference })}
                        >
                            Berhasil
                        </Btn>
                    </div>
                </>
            )}
            {row.kind === 'token' && !ready && (
                <p className="text-ink/55 text-[12px]">Menunggu peserta mengisi nomor meter. Tombol aktif setelah nomor diisi.</p>
            )}

            {row.kind === 'bensin' && row.status !== 'handed_over' && (
                <div className="grid grid-cols-2 gap-2">
                    {row.status === 'pending' && row.wa ? (
                        <a
                            href={row.wa}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => post(`/admin/pemenuhan/bensin/${row.id}/hubungi`)}
                            className="bg-lime flex h-10 items-center justify-center rounded-full text-[12px] font-extrabold"
                        >
                            Hubungi lewat WhatsApp
                        </a>
                    ) : (
                        <span />
                    )}
                    <Btn
                        variant={row.status === 'contacted' ? 'yellow' : 'outline'}
                        className="h-10 justify-center rounded-full border-2"
                        onClick={() => setDialog('handover')}
                    >
                        Serahkan
                    </Btn>
                </div>
            )}

            {row.kind === 'barang' && row.status === 'ready_to_ship' && (
                <Btn
                    variant="yellow"
                    className="h-10 w-full justify-center rounded-full"
                    onClick={() => post(`/admin/pemenuhan/barang/${row.id}/kirim`)}
                >
                    Tandai dikirim
                </Btn>
            )}
            {row.kind === 'barang' && row.status === 'shipping' && (
                <Btn
                    variant="yellow"
                    className="h-10 w-full justify-center rounded-full"
                    onClick={() => post(`/admin/pemenuhan/barang/${row.id}/selesai`)}
                >
                    Tandai selesai diterima
                </Btn>
            )}
            {row.kind === 'barang' && row.status === 'pending_address' && (
                <p className="text-ink/55 text-[12px]">Menunggu peserta mengisi alamat pengiriman.</p>
            )}

            {row.kind === 'bantuan' && (
                <>
                    <label className="block text-[11px] font-bold">
                        Nomor yang benar (dari peserta)
                        <Req />
                        <TextInput
                            value={help.data.destination}
                            onChange={(e) => help.setData('destination', e.target.value.replace(/\D/g, '').slice(0, 20))}
                            className="mt-1 font-mono"
                        />
                    </label>
                    <FieldError message={help.errors.destination} />
                    <Btn
                        variant="yellow"
                        className="h-10 w-full justify-center rounded-full"
                        disabled={help.data.destination.length < 8 || help.processing}
                        onClick={() => help.post(`/admin/pemenuhan/bantuan/${row.id}`, { preserveScroll: true })}
                    >
                        Simpan nomor dan kembalikan ke antrean
                    </Btn>
                </>
            )}

            {row.wa && !(row.kind === 'bensin' && row.status === 'pending') && (
                <BtnLink href={row.wa} external variant="outline" className="h-10 w-full justify-center rounded-full border-2">
                    WhatsApp peserta
                </BtnLink>
            )}

            <Modal open={dialog === 'tokenFail' || dialog === 'topupWrong'} onClose={close}>
                <h3 className="pr-8 text-[15px] font-extrabold">{dialog === 'tokenFail' ? 'Tandai token gagal' : 'Nomor tidak bisa diisi'}</h3>
                <p className="text-ink/55 mt-1 text-[12px]">
                    Hitungan gagal bertambah ({(row.failed ?? 0) + 1}/{row.max}). Peserta diminta mengisi ulang nomor; setelah batas, masuk Perlu
                    bantuan.
                </p>
                <label className="mt-3 block text-[11px] font-bold">
                    Alasan
                    {dialog === 'tokenFail' && <Req />}
                    <TextInput value={fail.data.reason} onChange={(e) => fail.setData('reason', e.target.value)} className="mt-1" />
                    <Hint>
                        {dialog === 'tokenFail' ? 'Mis. nomor meter tidak terdaftar di PLN.' : 'Mis. nomor tidak aktif atau operator tidak didukung.'}
                    </Hint>
                </label>
                <FieldError message={fail.errors.reason} />
                <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                    <Btn variant="outline" className="h-10 justify-center rounded-full border-2" onClick={close}>
                        Batal
                    </Btn>
                    <Btn
                        variant="red"
                        className="h-10 justify-center rounded-full"
                        disabled={(dialog === 'tokenFail' && !fail.data.reason.trim()) || fail.processing}
                        onClick={() =>
                            fail.post(
                                dialog === 'tokenFail' ? `/admin/pemenuhan/token/${row.id}/gagal` : `/admin/pemenuhan/topup/${row.id}/nomor-salah`,
                                {
                                    preserveScroll: true,
                                    onSuccess: close,
                                },
                            )
                        }
                    >
                        Kembalikan ke peserta
                    </Btn>
                </div>
            </Modal>

            <Modal open={dialog === 'handover'} onClose={close}>
                <h3 className="pr-8 text-[15px] font-extrabold">Serahkan bensin tunai · {row.value}</h3>
                <label className="mt-3 block text-[11px] font-bold">
                    Tanggal serah
                    <Req />
                    <DateInput value={hand.data.date} onChange={(v) => hand.setData('date', v)} className="mt-1" />
                </label>
                <FieldError message={hand.errors.date} />
                <label className="mt-3 block text-[11px] font-bold">
                    Nama penerima
                    <Req />
                    <TextInput value={hand.data.recipient} onChange={(e) => hand.setData('recipient', e.target.value)} className="mt-1" />
                </label>
                <FieldError message={hand.errors.recipient} />
                <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                    <Btn variant="outline" className="h-10 justify-center rounded-full border-2" onClick={close}>
                        Batal
                    </Btn>
                    <Btn
                        variant="yellow"
                        className="h-10 justify-center rounded-full"
                        disabled={!hand.data.date || !hand.data.recipient.trim() || hand.processing}
                        onClick={() => hand.post(`/admin/pemenuhan/bensin/${row.id}/serahkan`, { preserveScroll: true, onSuccess: close })}
                    >
                        Simpan serah terima
                    </Btn>
                </div>
            </Modal>
        </div>
    );
}

/** A3 Pemenuhan (desain): tab per jenis, daftar di kiri, detail dan aksi di kanan. */
export default function Pemenuhan({ tab: initial, counts, rows }: { tab: Tab; counts: Record<Tab, number>; rows: Record<Tab, Row[]> }) {
    const tab = initial;
    const [q, setQ] = useState('');
    const [picked, setPicked] = useState<string | null>(null);
    const list = rows[tab].filter((r) => matches(q, r.name, r.whatsapp, r.prize, r.destination ?? null, r.claim, r.area ?? null));
    const row = list.find((r) => r.key === picked) ?? list[0];
    const meta = TABS.find((t) => t.key === tab)!;

    return (
        <AdminLayout active="pemenuhan" title="Pemenuhan" subtitle={meta.hint}>
            <PillTabs
                active={tab}
                tabs={TABS.map((t) => ({ key: t.key, label: t.label, href: `/admin/pemenuhan?tab=${t.key}`, count: counts[t.key] }))}
            />

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
                <section className="rounded-2xl bg-white p-4">
                    <SearchInput value={q} onChange={setQ} placeholder="Cari nama, nomor, atau kode klaim" className="mb-3" />
                    <ul className="divide-ink/5 divide-y">
                        {list.map((r) => (
                            <li key={r.key}>
                                <button
                                    type="button"
                                    onClick={() => setPicked(r.key)}
                                    className={cn(
                                        'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition',
                                        row?.key === r.key ? 'bg-lime-soft' : 'hover:bg-cream/60',
                                    )}
                                >
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-[13px] font-extrabold">{r.name}</span>
                                        <span className="text-ink/55 block truncate text-[11px]">
                                            {r.prize}
                                            {r.value ? ` · ${r.value}` : ''}
                                            {r.destination ? ` · ${r.destination}` : r.area ? ` · ${r.area}` : ''}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 flex-col items-end gap-1">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                                                r.done
                                                    ? 'bg-ink/10'
                                                    : r.kind === 'bantuan'
                                                      ? 'bg-[#fde0dc] text-[#b42318]'
                                                      : 'bg-[#fff1d6] text-[#7a5410]',
                                            )}
                                        >
                                            {r.label}
                                        </span>
                                        <span className="text-ink/40 text-[10px]">{r.at}</span>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {list.length === 0 && (
                        <p className="text-ink/45 flex flex-col items-center gap-2 py-12 text-[12px]">
                            <Inbox className="size-6" />
                            Tidak ada antrean {meta.label.toLowerCase()}.
                        </p>
                    )}
                </section>

                <aside className="h-fit rounded-2xl bg-white p-5 xl:sticky xl:top-4">
                    {row ? (
                        <>
                            <p className="text-ink/50 text-[11px] font-bold">{row.prize}</p>
                            <h2 className="text-[18px] leading-tight font-extrabold">{row.name}</h2>
                            {row.whatsapp && <Phone value={row.whatsapp} />}
                            <dl className="divide-ink/5 mt-3 divide-y">
                                {row.value && <Field label="Nilai">{row.value}</Field>}
                                <Field label="Status">{row.label}</Field>
                                {(row.kind === 'topup' || row.kind === 'token' || row.kind === 'bantuan') && (
                                    <Field label={row.type === 'token' ? 'Nomor meter' : 'Nomor tujuan'}>
                                        {row.destination ? <Copyable value={row.destination} /> : '-'}
                                    </Field>
                                )}
                                {row.max !== undefined && row.kind !== 'bensin' && (
                                    <Field label="Gagal">
                                        {row.failed}/{row.max}
                                    </Field>
                                )}
                                {row.fail_reason && <Field label="Alasan terakhir">{row.fail_reason}</Field>}
                                {row.handed && <Field label="Diserahkan">{row.handed}</Field>}
                                {row.kind === 'barang' && (
                                    <>
                                        <Field label="Area">{row.area ?? '-'}</Field>
                                        <Field label="Alamat">{row.address ?? '-'}</Field>
                                        {row.shipped_at && <Field label="Dikirim">{row.shipped_at}</Field>}
                                        {row.completed_at && <Field label="Selesai">{row.completed_at}</Field>}
                                    </>
                                )}
                                {row.claim && (
                                    <Field label="Klaim" mono>
                                        {row.claim}
                                    </Field>
                                )}
                                {row.outlet && <Field label="Warung">{row.outlet}</Field>}
                            </dl>
                            <div className="mt-4">
                                <Actions key={row.key} row={row} />
                            </div>
                        </>
                    ) : (
                        <p className="text-ink/45 py-12 text-center text-[12px]">Pilih antrean di kiri untuk melihat detail.</p>
                    )}
                </aside>
            </div>
        </AdminLayout>
    );
}
