import { Btn, BtnLink, FieldError, Modal, Phone, SearchInput, SelectInput, TextInput, matches, rupiah } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Box, Check, Clock, Gift, Plus, Users } from 'lucide-react';
import { useState } from 'react';

type Row = {
    key: string;
    id: number;
    action: 'kode' | 'topup' | 'ambil' | null;
    at: string | null;
    name: string;
    whatsapp: string | null;
    wa: string | null;
    prize: string;
    fulfillment: string;
    label: string;
    done: boolean;
};
type Prize = {
    id: number;
    name: string;
    fulfillment: string;
    fulfillment_label: string;
    partner_id: number | null;
    partner: string | null;
    value: number;
    stock: number;
    given: number;
    active: boolean;
};
type Access = { id: number; whatsapp: string; kind: 'allow' | 'block'; name: string | null; by: string | null; at: string | null };
type Stats = { total: number; vouchers: number; packs: number; waiting: number; done: number; stockLeft: number; stockTotal: number };

const FULFILLMENTS = [
    { value: 'kode', label: 'Admin kirim kode (mis. Spotify, Netflix)' },
    { value: 'mitra', label: 'Tukar di mitra' },
    { value: 'topup', label: 'Top up oleh admin (pulsa/kuota)' },
    { value: 'ambil', label: 'Ambil di titik (produk gratis)' },
];

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={on}
            aria-label={label}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition', on ? 'bg-lime' : 'bg-ink/20')}
        >
            <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} />
        </button>
    );
}

function Stat({ icon: Icon, value, label, hint }: { icon: LucideIcon; value: number; label: string; hint: string }) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-4">
            <span className="bg-lime-soft grid size-11 shrink-0 place-items-center rounded-full">
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-[24px] leading-none font-extrabold">{value}</p>
                <p className="mt-1 text-[12px] font-bold">{label}</p>
                <p className="text-ink/50 text-[10px]">{hint}</p>
            </div>
        </div>
    );
}

function PrizeDialog({ prize, partners, onClose }: { prize: Prize | null; partners: { id: number; name: string }[]; onClose: () => void }) {
    const form = useForm({
        name: prize?.name ?? '',
        fulfillment: prize?.fulfillment ?? 'kode',
        partner_id: prize?.partner_id ? String(prize.partner_id) : '',
        value: prize?.value ? String(prize.value) : '',
        stock: prize ? String(prize.stock) : '',
    });
    const save = () => {
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (prize) form.put(`/admin/mystery-gift/hadiah/${prize.id}`, opts);
        else form.post('/admin/mystery-gift/hadiah', opts);
    };
    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[16px] font-extrabold">{prize ? `Ubah ${prize.name}` : 'Tambah hadiah'}</h3>
            <p className="text-ink/55 mt-1 text-[12px]">
                Isi mystery gift bebas. Peserta yang menang mendapat satu hadiah acak dari yang aktif dan stoknya masih ada.
            </p>
            <div className="mt-3 space-y-3">
                <label className="block text-[11px] font-bold">
                    Nama hadiah
                    <TextInput
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Mis. Voucher Spotify"
                        className="mt-1"
                    />
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Cara pemenuhan
                    <SelectInput
                        value={form.data.fulfillment}
                        onChange={(v) => form.setData('fulfillment', v)}
                        options={FULFILLMENTS}
                        className="mt-1"
                    />
                </label>
                {form.data.fulfillment === 'mitra' && (
                    <label className="block text-[11px] font-bold">
                        Mitra penukar
                        <SelectInput
                            value={form.data.partner_id}
                            onChange={(v) => form.setData('partner_id', v)}
                            placeholder="Pilih mitra"
                            options={partners.map((p) => ({ value: p.id, label: p.name }))}
                            className="mt-1"
                        />
                        <FieldError message={form.errors.partner_id} />
                    </label>
                )}
                <div className="grid grid-cols-2 gap-3">
                    <label className="block text-[11px] font-bold">
                        Nilai (Rp, opsional)
                        <TextInput
                            type="number"
                            min={0}
                            value={form.data.value}
                            onChange={(e) => form.setData('value', e.target.value)}
                            className="mt-1"
                        />
                    </label>
                    <label className="block text-[11px] font-bold">
                        Stok
                        <TextInput
                            type="number"
                            min={0}
                            value={form.data.stock}
                            onChange={(e) => form.setData('stock', e.target.value)}
                            className="mt-1"
                        />
                        <FieldError message={form.errors.stock} />
                    </label>
                </div>
            </div>
            <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                <Btn variant="outline" className="h-10 justify-center rounded-full border-2" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    variant="yellow"
                    className="h-10 justify-center rounded-full"
                    disabled={!form.data.name.trim() || form.data.stock === '' || form.processing}
                    onClick={save}
                >
                    Simpan
                </Btn>
            </div>
        </Modal>
    );
}

function CodeDialog({ row, onClose }: { row: Row; onClose: () => void }) {
    const form = useForm({ code: '' });
    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[16px] font-extrabold">Kirim kode · {row.prize}</h3>
            <p className="text-ink/55 mt-1 text-[12px]">
                Untuk {row.name}. Setelah disimpan, kirim kodenya lewat WhatsApp; peserta juga melihatnya di detail mystery gift.
            </p>
            <label className="mt-3 block text-[11px] font-bold">
                Kode voucher dari penyedia
                <TextInput
                    value={form.data.code}
                    onChange={(e) => form.setData('code', e.target.value)}
                    placeholder="Mis. SPTF-XXXX-XXXX"
                    className="mt-1"
                />
                <FieldError message={form.errors.code} />
            </label>
            <div className="mt-4 grid grid-cols-[1fr_2fr] gap-2">
                <Btn variant="outline" className="h-10 justify-center rounded-full border-2" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    variant="yellow"
                    className="h-10 justify-center rounded-full"
                    disabled={!form.data.code.trim() || form.processing}
                    onClick={() => form.post(`/admin/mystery-gift/voucher/${row.id}/kode`, { preserveScroll: true, onSuccess: onClose })}
                >
                    Simpan kode
                </Btn>
            </div>
        </Modal>
    );
}

/** Mystery gift (desain admin): pusat kontrol hadiah cap ke-5. */
export default function MysteryGift({
    enabled,
    chance,
    audience,
    rows,
    prizes,
    partners,
    access,
    stats,
}: {
    enabled: boolean;
    chance: number;
    audience: 'all' | 'list';
    rows: Row[];
    prizes: Prize[];
    partners: { id: number; name: string }[];
    access: Access[];
    stats: Stats;
}) {
    const mysteryWa = (usePage().props.flash as { mysteryWa?: string | null } | undefined)?.mysteryWa;
    const [tab, setTab] = useState<'semua' | 'menunggu' | 'selesai'>('semua');
    const [q, setQ] = useState('');
    const [editingChance, setEditingChance] = useState(false);
    const [prizeDialog, setPrizeDialog] = useState<Prize | null | 'new'>(null);
    const [sending, setSending] = useState<Row | null>(null);
    const chanceForm = useForm({ chance: String(chance) });
    const accessForm = useForm({ whatsapp: '', kind: 'allow' });
    const post = (url: string, data = {}) => router.post(url, data, { preserveScroll: true });
    const shown = rows
        .filter((r) => (tab === 'menunggu' ? !r.done : tab === 'selesai' ? r.done : true))
        .filter((r) => matches(q, r.name, r.whatsapp, r.prize));

    return (
        <AdminLayout active="mystery-gift" title="Mystery gift" subtitle="Pusat kontrol mystery gift">
            <div className="-mt-2 mb-4 flex items-center justify-end gap-2 text-[12px] font-extrabold">
                Mystery gift {enabled ? 'aktif' : 'nonaktif'}
                <Switch on={enabled} onClick={() => post('/admin/mystery-gift/aktif')} label="Mystery gift aktif" />
            </div>

            {mysteryWa && (
                <p className="bg-lime-soft mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl px-4 py-3 text-[12px] font-bold">
                    Kode tersimpan. Kirim ke peserta sekarang.
                    <BtnLink href={mysteryWa} external variant="yellow">
                        Buka WhatsApp
                    </BtnLink>
                </p>
            )}

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <Stat icon={Users} value={stats.total} label="Penerima" hint={`${stats.vouchers} voucher · ${stats.packs} produk gratis`} />
                <Stat icon={Clock} value={stats.waiting} label="Menunggu diproses" hint="kode, top up, atau ambil" />
                <Stat icon={Check} value={stats.done} label="Selesai diproses" hint="tidak perlu aksi admin" />
                <Stat icon={Box} value={stats.stockLeft} label="Stok tersisa" hint={`dari ${stats.stockTotal} hadiah`} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
                <section className="rounded-2xl bg-white p-5">
                    <h2 className="text-[14px] font-extrabold">Aturan pemicu</h2>
                    <div className="border-ink/5 mt-3 border-b pb-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[12px] font-extrabold">Cap ke-5</p>
                            <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-extrabold', enabled ? 'bg-lime' : 'bg-ink/10')}>
                                {enabled ? 'Aktif' : 'Nonaktif'}
                            </span>
                        </div>
                        <p className="text-ink/55 text-[11px]">Diundi saat kartu cap peserta mencapai cap hijau ke-5. Satu kali per peserta.</p>
                    </div>
                    <div className="mt-3">
                        <div className="flex items-center justify-between">
                            <p className="text-[12px] font-extrabold">Peluang yang didapat</p>
                            {!editingChance && (
                                <button
                                    type="button"
                                    onClick={() => setEditingChance(true)}
                                    className="border-ink rounded-full border-2 px-3 py-0.5 text-[11px] font-extrabold"
                                >
                                    Ubah
                                </button>
                            )}
                        </div>
                        <div className="mt-2 flex h-3 overflow-hidden rounded-full">
                            <span className="bg-lime" style={{ width: `${chance}%` }} />
                            <span className="flex-1 bg-[#0b0b0b]" />
                        </div>
                        <p className="text-ink/60 mt-1.5 flex gap-4 text-[11px]">
                            <span>● Dapat {chance}%</span>
                            <span>● Tidak dapat {100 - chance}%</span>
                        </p>
                        {editingChance && (
                            <div className="mt-3 flex items-center gap-2">
                                <TextInput
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={chanceForm.data.chance}
                                    onChange={(e) => chanceForm.setData('chance', e.target.value)}
                                    aria-label="Peluang dalam persen"
                                    className="w-20"
                                />
                                <span className="text-[12px]">%</span>
                                <Btn
                                    variant="yellow"
                                    className="ml-auto rounded-full"
                                    disabled={chanceForm.processing}
                                    onClick={() =>
                                        chanceForm.post('/admin/mystery-gift/peluang', {
                                            preserveScroll: true,
                                            onSuccess: () => setEditingChance(false),
                                        })
                                    }
                                >
                                    Simpan
                                </Btn>
                            </div>
                        )}
                        <FieldError message={chanceForm.errors.chance} />
                    </div>
                </section>

                <section className="rounded-2xl bg-white p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="text-[14px] font-extrabold">Isi mystery gift</h2>
                        <Btn variant="yellow" className="rounded-full" onClick={() => setPrizeDialog('new')}>
                            <Plus className="size-3.5" /> Tambah hadiah
                        </Btn>
                    </div>
                    <div className="mt-3 overflow-x-auto">
                        <table className="w-full min-w-[420px] text-[12px]">
                        <thead>
                            <tr className="text-ink/50 text-left text-[11px]">
                                <th className="py-2 font-semibold">Hadiah</th>
                                <th className="py-2 font-semibold">Pemenuhan</th>
                                <th className="py-2 font-semibold">Stok</th>
                                <th className="py-2 text-right font-semibold">Aktif</th>
                            </tr>
                        </thead>
                        <tbody className="divide-ink/5 divide-y">
                            {prizes.map((p) => (
                                <tr key={p.id}>
                                    <td className="py-2.5">
                                        <button type="button" onClick={() => setPrizeDialog(p)} className="text-left font-extrabold hover:underline">
                                            {p.name}
                                        </button>
                                        {p.value > 0 && <span className="text-ink/50 block text-[10px]">{rupiah(p.value)}</span>}
                                    </td>
                                    <td className="text-ink/60 py-2.5">
                                        {p.fulfillment === 'mitra' && p.partner ? `Tukar di ${p.partner}` : p.fulfillment_label}
                                    </td>
                                    <td className="py-2.5 font-extrabold tabular-nums">
                                        {p.stock - p.given} / {p.stock}
                                    </td>
                                    <td className="py-2.5 text-right">
                                        <Switch
                                            on={p.active}
                                            onClick={() => post(`/admin/mystery-gift/hadiah/${p.id}/aktif`)}
                                            label={`Aktifkan ${p.name}`}
                                        />
                                    </td>
                                </tr>
                            ))}
                            {prizes.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-ink/50 py-6 text-center">
                                        Belum ada isi mystery gift. Tanpa isi, peserta yang menang undian tidak mendapat apa-apa.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                        </table>
                    </div>
                    <p className="text-ink/45 mt-2 text-[10px]">
                        Hadiah diundi acak dari yang aktif dan stoknya masih ada. Stok habis otomatis tidak ikut diundi. Stok: sisa / total.
                    </p>
                </section>
            </div>

            <section className="mt-4 rounded-2xl bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-[14px] font-extrabold">Penerima mystery gift</h2>
                    <div className="flex gap-1.5">
                        {(
                            [
                                ['semua', `Semua ${stats.total}`],
                                ['menunggu', `Menunggu ${stats.waiting}`],
                                ['selesai', `Selesai ${stats.done}`],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                className={cn(
                                    'rounded-full px-3 py-1 text-[11px] font-extrabold',
                                    tab === key ? 'bg-ink text-white' : 'bg-cream-deep',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <SearchInput value={q} onChange={setQ} placeholder="Cari nama atau nomor" />
                </div>
                <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-[12px]">
                        <thead>
                            <tr className="text-ink/50 text-left text-[11px]">
                                <th className="py-2 font-semibold">Waktu</th>
                                <th className="py-2 font-semibold">Peserta</th>
                                <th className="py-2 font-semibold">Hadiah</th>
                                <th className="py-2 font-semibold">Status</th>
                                <th className="py-2 text-right font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-ink/5 divide-y">
                            {shown.map((r) => (
                                <tr key={r.key}>
                                    <td className="text-ink/60 py-2.5">{r.at}</td>
                                    <td className="py-2.5">
                                        <span className="block font-extrabold">{r.name}</span>
                                        {r.whatsapp && <Phone value={r.whatsapp} />}
                                    </td>
                                    <td className="py-2.5">
                                        <span className="flex items-center gap-1.5 font-bold">
                                            <Gift className="text-ink/40 size-3.5" /> {r.prize.replace(/^Mystery gift:\s*/, '')}
                                        </span>
                                        <span className="text-ink/50 text-[10px]">{r.fulfillment}</span>
                                    </td>
                                    <td className="py-2.5">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                                                r.done ? 'bg-lime' : 'bg-[#fff1d6] text-[#b07a12]',
                                            )}
                                        >
                                            {r.label}
                                        </span>
                                    </td>
                                    <td className="py-2.5 text-right">
                                        <span className="inline-flex items-center gap-2">
                                            {r.wa && (
                                                <BtnLink href={r.wa} external variant="yellow">
                                                    WhatsApp
                                                </BtnLink>
                                            )}
                                            {r.action === 'kode' && (
                                                <Btn variant="outline" onClick={() => setSending(r)}>
                                                    Kirim kode
                                                </Btn>
                                            )}
                                            {r.action === 'topup' && (
                                                <Btn variant="outline" onClick={() => post(`/admin/mystery-gift/voucher/${r.id}/topup`)}>
                                                    Tandai selesai
                                                </Btn>
                                            )}
                                            {r.action === 'ambil' && (
                                                <Btn variant="outline" onClick={() => post(`/admin/mystery-gift/produk/${r.id}/selesai`)}>
                                                    Tandai diambil
                                                </Btn>
                                            )}
                                            {!r.action && !r.done && r.label === 'Isi nomor tujuan' && (
                                                <span className="text-ink/50 text-[11px]">Menunggu nomor peserta</span>
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {shown.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-ink/50 py-8 text-center">
                                        Belum ada penerima.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-4 rounded-2xl bg-white p-5">
                <h2 className="text-[14px] font-extrabold">Akun yang bisa mendapat mystery gift</h2>
                <div className="mt-3 grid grid-cols-1 gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
                    <div>
                        <p className="text-ink/55 text-[11px] font-bold">Siapa yang bisa dapat</p>
                        {(
                            [
                                ['all', 'Semua peserta', 'Semua akun yang memenuhi syarat pemicu bisa dapat.'],
                                ['list', 'Hanya akun di daftar izin', 'Akun lain tidak dapat, walau memenuhi syarat.'],
                            ] as const
                        ).map(([key, title, text]) => (
                            <label key={key} className="mt-3 flex cursor-pointer gap-3">
                                <input
                                    type="radio"
                                    name="audience"
                                    checked={audience === key}
                                    onChange={() => post('/admin/mystery-gift/akun', { audience: key })}
                                    className="accent-lime-dark mt-0.5 size-4"
                                />
                                <span>
                                    <span className="block text-[12px] font-extrabold">{title}</span>
                                    <span className="text-ink/55 block text-[11px]">{text}</span>
                                </span>
                            </label>
                        ))}
                        <p className="mt-4 rounded-xl bg-[#fff1d6] px-3 py-2.5 text-[11px] text-[#7a5410]">
                            Daftar blokir selalu berlaku. Akun yang diblokir tidak pernah mendapat mystery gift, apa pun pilihannya.
                        </p>
                        <p className="text-ink/50 mt-2 text-[11px]">Satu akun hanya bisa mendapat satu mystery gift.</p>
                    </div>
                    <div>
                        <p className="text-ink/55 text-[11px] font-bold">Daftar akun khusus</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            <TextInput
                                value={accessForm.data.whatsapp}
                                onChange={(e) => accessForm.setData('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 13))}
                                placeholder="Nomor WhatsApp"
                                className="max-w-[240px]"
                            />
                            <Btn
                                variant="yellow"
                                className="rounded-full"
                                disabled={accessForm.data.whatsapp.length < 10 || accessForm.processing}
                                onClick={() => {
                                    accessForm.transform((d) => ({ ...d, kind: 'allow' }));
                                    accessForm.post('/admin/mystery-gift/daftar', { preserveScroll: true, onSuccess: () => accessForm.reset() });
                                }}
                            >
                                Izinkan
                            </Btn>
                            <Btn
                                variant="outline"
                                className="rounded-full border-2 border-[#d0271d] text-[#b42318]"
                                disabled={accessForm.data.whatsapp.length < 10 || accessForm.processing}
                                onClick={() => {
                                    accessForm.transform((d) => ({ ...d, kind: 'block' }));
                                    accessForm.post('/admin/mystery-gift/daftar', { preserveScroll: true, onSuccess: () => accessForm.reset() });
                                }}
                            >
                                Blokir
                            </Btn>
                        </div>
                        <FieldError message={accessForm.errors.whatsapp} />
                        <div className="mt-3 overflow-x-auto">
                            <table className="w-full min-w-[520px] text-[12px]">
                            <thead>
                                <tr className="text-ink/50 text-left text-[11px]">
                                    <th className="py-2 font-semibold">Nomor</th>
                                    <th className="py-2 font-semibold">Nama</th>
                                    <th className="py-2 font-semibold">Status</th>
                                    <th className="py-2 font-semibold">Ditambah</th>
                                    <th className="py-2 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-ink/5 divide-y">
                                {access.map((a) => (
                                    <tr key={a.id}>
                                        <td className="py-2">
                                            <Phone value={a.whatsapp} />
                                        </td>
                                        <td className="py-2">{a.name ?? 'Belum terdaftar'}</td>
                                        <td className="py-2">
                                            <span
                                                className={cn(
                                                    'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                                                    a.kind === 'allow' ? 'bg-lime' : 'bg-[#fde0dc] text-[#b42318]',
                                                )}
                                            >
                                                {a.kind === 'allow' ? 'Diizinkan' : 'Diblokir'}
                                            </span>
                                        </td>
                                        <td className="text-ink/55 py-2">
                                            {a.by ?? '-'} · {a.at}
                                        </td>
                                        <td className="py-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => router.delete(`/admin/mystery-gift/daftar/${a.id}`, { preserveScroll: true })}
                                                className="text-[11px] font-extrabold text-[#b42318] hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {access.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-ink/50 py-4 text-center">
                                            Belum ada nomor di daftar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            </table>
                        </div>
                        <p className="text-ink/45 mt-2 text-[10px]">
                            Daftar izin hanya dipakai bila dipilih &quot;Hanya akun di daftar izin&quot;. Mystery gift berupa voucher token atau
                            bensin lama diproses di{' '}
                            <Link href="/admin/pemenuhan" className="underline">
                                Pemenuhan
                            </Link>
                            .
                        </p>
                    </div>
                </div>
            </section>

            {prizeDialog && (
                <PrizeDialog prize={prizeDialog === 'new' ? null : prizeDialog} partners={partners} onClose={() => setPrizeDialog(null)} />
            )}
            {sending && <CodeDialog row={sending} onClose={() => setSending(null)} />}
        </AdminLayout>
    );
}
