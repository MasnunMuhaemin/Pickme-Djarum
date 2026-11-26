import {
    Btn,
    BtnLink,
    Card,
    Chip,
    Empty,
    FieldError,
    Hint,
    Modal,
    Opt,
    Phone,
    PillTabs,
    Req,
    RequiredNote,
    SelectInput,
    Table,
    Td,
    TextArea,
    TextInput,
    useConfirm,
} from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { KeyRound, Search } from 'lucide-react';
import { type FormEvent, useState } from 'react';

type Admin = { id: number; name: string; email: string; active: boolean; created: string | null };
type Peserta = {
    id: number;
    name: string;
    whatsapp: string;
    area_id: number;
    area: string | null;
    wa: string | null;
    caps: number;
    claims: number;
    registered: string | null;
    blocked: string | null;
    blocked_reason: string | null;
    pin_requested: boolean;
    history: { code: string; outlet: string | null; slot: string | null; at: string | null; status: string; reward: string }[];
};
type Area = { id: number; name: string };

type ConfirmFn = ReturnType<typeof useConfirm>[0];

/** Peserta (desain): cari nama atau nomor, daftar di kiri, detail dengan riwayat klaim dan PIN sementara di kanan. */
function PesertaPanel({
    participants,
    total,
    search,
    q,
    setQ,
    find,
    onEdit,
    onBlock,
    confirm,
}: {
    participants: Peserta[];
    total: number;
    search: string;
    q: string;
    setQ: (v: string) => void;
    find: (e: FormEvent) => void;
    onEdit: (p: Peserta) => void;
    onBlock: (p: Peserta) => void;
    confirm: ConfirmFn;
}) {
    const [pickedId, setPickedId] = useState<number | null>(null);
    const p = participants.find((x) => x.id === pickedId) ?? participants[0] ?? null;

    return (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
            <section className="rounded-2xl bg-white p-4">
                <form onSubmit={find} className="mb-3 flex max-w-md gap-2">
                    <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau nomor WhatsApp" />
                    <Btn type="submit" variant="outline">
                        <Search className="size-3.5" />
                        Cari
                    </Btn>
                </form>
                <p className="text-ink/50 mb-1 text-[11px] font-bold">{total} peserta</p>
                <ul className="divide-ink/5 divide-y">
                    {participants.map((x) => (
                        <li key={x.id}>
                            <button
                                type="button"
                                onClick={() => setPickedId(x.id)}
                                className={cn(
                                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
                                    p?.id === x.id ? 'bg-lime-soft' : 'hover:bg-cream/60',
                                )}
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[13px] font-extrabold">{x.name}</span>
                                    <span className="text-ink/45 block font-mono text-[10px]">
                                        {x.whatsapp.slice(0, 4)}••••{x.whatsapp.slice(-4)}
                                    </span>
                                </span>
                                <span className="text-ink/60 hidden text-[11px] sm:block">
                                    {x.claims} klaim · {x.caps} cap
                                </span>
                                <span className="flex shrink-0 flex-col items-end gap-1">
                                    {x.blocked ? <Chip tone="red">Diblokir</Chip> : <Chip tone="green">Aktif</Chip>}
                                    {x.pin_requested && <Chip tone="yellow">Minta PIN</Chip>}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
                {participants.length === 0 && <Empty>{search ? `Tidak ada peserta dengan "${search}".` : 'Belum ada peserta.'}</Empty>}
                <p className="text-ink/45 mt-3 text-[11px]">
                    Peserta mendaftar sendiri lewat webapp (persetujuan data dan cek usia), jadi tidak bisa ditambahkan dari admin.
                </p>
            </section>

            <aside className="h-fit rounded-2xl bg-white p-5 xl:sticky xl:top-4">
                {p ? (
                    <>
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <h2 className="text-[18px] leading-tight font-extrabold">{p.name}</h2>
                                <Phone value={p.whatsapp} />
                            </div>
                            {p.blocked ? <Chip tone="red">Diblokir</Chip> : <Chip tone="green">Aktif</Chip>}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                            {(
                                [
                                    [p.claims, 'klaim'],
                                    [p.caps, 'cap'],
                                    [p.area ?? '-', 'area kos'],
                                ] as const
                            ).map(([v, l]) => (
                                <div key={l} className="bg-cream rounded-xl px-2 py-2.5">
                                    <p className="truncate text-[15px] font-extrabold">{v}</p>
                                    <p className="text-ink/50 text-[10px]">{l}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-ink/50 mt-2 text-[11px]">Terdaftar {p.registered ?? '-'}</p>
                        {p.blocked && (
                            <p className="mt-2 rounded-xl bg-[#fde0dc] px-3 py-2 text-[11px] text-[#b42318]">
                                Diblokir {p.blocked}
                                {p.blocked_reason ? ` · ${p.blocked_reason}` : ''}
                            </p>
                        )}

                        <h3 className="mt-4 text-[13px] font-extrabold">Riwayat klaim</h3>
                        <ul className="divide-ink/5 mt-1 divide-y text-[12px]">
                            {p.history.map((h) => (
                                <li key={h.code} className="flex items-center justify-between gap-2 py-2">
                                    <span className="min-w-0">
                                        <span className="block truncate font-bold">{h.reward}</span>
                                        <span className="text-ink/50 font-mono text-[10px]">
                                            {h.code} · {h.outlet ?? '-'}
                                            {h.slot ? ` · ${h.slot}` : ''}
                                        </span>
                                    </span>
                                    <span className="flex shrink-0 flex-col items-end gap-0.5">
                                        <Chip tone={h.status === 'approved' ? 'green' : h.status === 'rejected' ? 'red' : 'yellow'}>
                                            {h.status === 'approved' ? 'Berhasil' : h.status === 'rejected' ? 'Ditolak' : 'Diproses'}
                                        </Chip>
                                        <span className="text-ink/40 text-[10px]">{h.at}</span>
                                    </span>
                                </li>
                            ))}
                            {p.history.length === 0 && <li className="text-ink/45 py-3">Belum ada klaim.</li>}
                        </ul>

                        <div className="mt-4 space-y-2">
                            {p.pin_requested && (
                                <p className="rounded-xl bg-[#fff1d6] px-3 py-2 text-[11px] text-[#7a5410]">Peserta meminta bantuan Lupa PIN.</p>
                            )}
                            <Btn
                                variant="yellow"
                                className="h-10 w-full justify-center rounded-full"
                                onClick={() =>
                                    confirm({
                                        title: `Buat PIN sementara untuk ${p.name}?`,
                                        message:
                                            'PIN lama langsung tidak berlaku. PIN sementara ditampilkan sekali; kirim ke peserta lewat WhatsApp dan minta ganti PIN di Profil.',
                                        confirmLabel: 'Buat PIN sementara',
                                        onConfirm: () => router.post(`/admin/pengguna/peserta/${p.id}/pin`, {}, { preserveScroll: true }),
                                    })
                                }
                            >
                                <KeyRound className="size-4" /> Buat PIN sementara
                            </Btn>
                            <div className="grid grid-cols-3 gap-2">
                                {p.wa ? (
                                    <BtnLink href={p.wa} external variant="outline" className="h-9 justify-center rounded-full border-2">
                                        WhatsApp
                                    </BtnLink>
                                ) : (
                                    <span />
                                )}
                                <Btn variant="outline" className="h-9 justify-center rounded-full border-2" onClick={() => onEdit(p)}>
                                    Ubah
                                </Btn>
                                {p.blocked ? (
                                    <Btn
                                        variant="outline"
                                        className="h-9 justify-center rounded-full border-2"
                                        onClick={() =>
                                            confirm({
                                                title: `Buka blokir ${p.name}?`,
                                                message: p.blocked_reason ? `Alasan blokir: ${p.blocked_reason}` : undefined,
                                                confirmLabel: 'Buka blokir',
                                                onConfirm: () => router.post(`/admin/pengguna/peserta/${p.id}/blokir`, {}, { preserveScroll: true }),
                                            })
                                        }
                                    >
                                        Buka blokir
                                    </Btn>
                                ) : (
                                    <Btn
                                        variant="outline"
                                        className="h-9 justify-center rounded-full border-2 border-[#d0271d] text-[#b42318]"
                                        onClick={() => onBlock(p)}
                                    >
                                        Blokir
                                    </Btn>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <p className="text-ink/45 py-12 text-center text-[12px]">Pilih peserta di kiri.</p>
                )}
            </aside>
        </div>
    );
}

/** Tambah atau ubah akun admin. Kata sandi wajib saat menambah, opsional saat mengubah. */
function AdminDialog({ admin, onClose }: { admin: Admin | null; onClose: () => void }) {
    const form = useForm({ name: admin?.name ?? '', email: admin?.email ?? '', password: '' });
    const valid = form.data.name.trim() && form.data.email.includes('@') && (admin ? true : form.data.password.length >= 8);

    function save() {
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (admin) form.put(`/admin/pengguna/admin/${admin.id}`, opts);
        else form.post('/admin/pengguna/admin', opts);
    }

    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[15px] font-extrabold">{admin ? `Ubah admin ${admin.name}` : 'Tambah admin'}</h3>
            <RequiredNote />
            <div className="mt-3 space-y-3">
                <label className="block text-[11px] font-bold">
                    Nama
                    <Req />
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <Hint>Nama yang tercatat di log setiap aksi admin ini.</Hint>
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Email
                    <Req />
                    <TextInput type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} className="mt-1" />
                    <Hint>Dipakai untuk masuk ke panel admin, mis. nama@pickme.id.</Hint>
                    <FieldError message={form.errors.email} />
                </label>
                <label className="block text-[11px] font-bold">
                    {admin ? 'Kata sandi baru' : 'Kata sandi'}
                    {admin ? <Opt /> : <Req />}
                    <TextInput
                        type="password"
                        value={form.data.password}
                        onChange={(e) => form.setData('password', e.target.value)}
                        className="mt-1"
                    />
                    <Hint>
                        {admin ? 'Kosongkan bila tidak diganti. ' : ''}Minimal 8 karakter. Berikan langsung ke pemilik akun, jangan lewat grup.
                    </Hint>
                    <FieldError message={form.errors.password} />
                </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn disabled={!valid || form.processing} onClick={save}>
                    {form.processing ? 'Menyimpan...' : 'Simpan'}
                </Btn>
            </div>
        </Modal>
    );
}

function PesertaDialog({ peserta, areas, onClose }: { peserta: Peserta; areas: Area[]; onClose: () => void }) {
    const form = useForm({ name: peserta.name, area_id: String(peserta.area_id) });
    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[15px] font-extrabold">Ubah data peserta</h3>
            <p className="text-ink/55 mt-1 text-[12px]">
                Nomor WhatsApp dan tanggal lahir tidak bisa diubah admin karena dipakai untuk masuk dan cek usia.
            </p>
            <RequiredNote />
            <div className="mt-3 space-y-3">
                <label className="block text-[11px] font-bold">
                    Nama panggilan
                    <Req />
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <Hint>Nama yang tampil di peringkat dan halaman peserta.</Hint>
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Area kos
                    <Req />
                    <SelectInput
                        value={form.data.area_id}
                        onChange={(v) => form.setData('area_id', v)}
                        options={areas.map((a) => ({ value: a.id, label: a.name }))}
                        className="mt-1"
                    />
                    <FieldError message={form.errors.area_id} />
                </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    disabled={!form.data.name.trim() || form.processing}
                    onClick={() => form.put(`/admin/pengguna/peserta/${peserta.id}`, { preserveScroll: true, onSuccess: onClose })}
                >
                    Simpan
                </Btn>
            </div>
        </Modal>
    );
}

function BlockDialog({ peserta, onClose }: { peserta: Peserta; onClose: () => void }) {
    const form = useForm({ reason: '' });
    return (
        <Modal open onClose={onClose} danger>
            <h3 className="pr-8 text-[15px] font-extrabold">Blokir {peserta.name}?</h3>
            <p className="text-ink/60 mt-1 text-[12px]">
                Peserta tidak bisa masuk dan langsung dikeluarkan bila sedang masuk. Hadiah yang sudah didapat tetap tercatat.
            </p>
            <RequiredNote />
            <label className="mt-3 block text-[11px] font-bold">
                Alasan blokir
                <Req />
                <TextArea value={form.data.reason} onChange={(e) => form.setData('reason', e.target.value)} className="mt-1" />
                <Hint>Minimal 5 huruf, mis. foto bungkus yang sama dipakai berulang. Tercatat di log.</Hint>
                <FieldError message={form.errors.reason} />
            </label>
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn
                    variant="red"
                    disabled={form.data.reason.trim().length < 5 || form.processing}
                    onClick={() => form.post(`/admin/pengguna/peserta/${peserta.id}/blokir`, { preserveScroll: true, onSuccess: onClose })}
                >
                    Blokir
                </Btn>
            </div>
        </Modal>
    );
}

/** Kelola pengguna: akun admin dan peserta. Peserta mendaftar sendiri, jadi admin hanya mengelola datanya. */
export default function Pengguna({
    tab,
    search,
    me,
    admins,
    participants,
    pagination,
    areas,
}: {
    tab: 'admin' | 'peserta';
    search: string;
    me: number;
    admins: Admin[];
    participants: Peserta[];
    pagination: { current: number; last: number; total: number };
    areas: Area[];
}) {
    const page = usePage();
    const errors = page.props.errors as Record<string, string>;
    const [editingAdmin, setEditingAdmin] = useState<Admin | null | 'new'>(null);
    const [editingPeserta, setEditingPeserta] = useState<Peserta | null>(null);
    const [blocking, setBlocking] = useState<Peserta | null>(null);
    const [q, setQ] = useState(search);
    const [confirm, confirmDialog] = useConfirm();

    function find(e: FormEvent) {
        e.preventDefault();
        router.get('/admin/pengguna', { tab: 'peserta', q: q || undefined }, { preserveScroll: true });
    }

    const goto = (p: number) => router.get('/admin/pengguna', { tab: 'peserta', q: search || undefined, page: p }, { preserveScroll: true });

    return (
        <AdminLayout active="pengguna" title="Peserta" subtitle="Akun admin panel dan data peserta program">
            <PillTabs
                active={tab}
                tabs={[
                    { key: 'admin', label: `Admin (${admins.filter((a) => a.active).length})`, href: '/admin/pengguna' },
                    { key: 'peserta', label: `Peserta (${pagination.total})`, href: '/admin/pengguna?tab=peserta' },
                ]}
            />
            {errors.admin && <p className="mt-4 rounded-lg bg-[#fde0dc] px-3 py-2 text-[12px] font-semibold text-[#b42318]">{errors.admin}</p>}

            {tab === 'admin' ? (
                <Card title="Akun admin" right={<Btn onClick={() => setEditingAdmin('new')}>Tambah admin</Btn>} className="mt-4">
                    <Table head={['Nama', 'Email', 'Peran', 'Dibuat', 'Aksi']}>
                        {admins.map((a) => (
                            <tr key={a.id}>
                                <Td className="font-bold">
                                    {a.name}
                                    {a.id === me && <span className="text-ink/45 ml-1 text-[10px] font-normal">(kamu)</span>}
                                </Td>
                                <Td>{a.email}</Td>
                                <Td>{a.active ? <Chip tone="green">Admin aktif</Chip> : <Chip>Nonaktif</Chip>}</Td>
                                <Td className="text-ink/55">{a.created ?? '-'}</Td>
                                <Td>
                                    <span className="flex gap-1.5">
                                        <Btn variant="outline" onClick={() => setEditingAdmin(a)}>
                                            Ubah
                                        </Btn>
                                        {a.id !== me && (
                                            <Btn
                                                variant="ghost"
                                                onClick={() =>
                                                    confirm({
                                                        title: `${a.active ? 'Nonaktifkan' : 'Aktifkan'} admin ${a.name}?`,
                                                        message: a.active
                                                            ? 'Akun ini tidak bisa membuka panel admin sampai diaktifkan lagi. Lognya tetap tersimpan.'
                                                            : 'Akun ini bisa membuka panel admin lagi.',
                                                        confirmLabel: a.active ? 'Nonaktifkan' : 'Aktifkan',
                                                        danger: a.active,
                                                        onConfirm: () =>
                                                            router.post(`/admin/pengguna/admin/${a.id}/status`, {}, { preserveScroll: true }),
                                                    })
                                                }
                                            >
                                                {a.active ? 'Nonaktifkan' : 'Aktifkan'}
                                            </Btn>
                                        )}
                                    </span>
                                </Td>
                            </tr>
                        ))}
                    </Table>
                    <p className="text-ink/45 mt-3 text-[11px]">
                        Semua admin punya akses penuh ke panel. Akun mitra dan akun warung diatur di Mitra dan pembayaran, tab Akun mitra.
                    </p>
                </Card>
            ) : (
                <PesertaPanel
                    participants={participants}
                    total={pagination.total}
                    search={search}
                    q={q}
                    setQ={setQ}
                    find={find}
                    onEdit={setEditingPeserta}
                    onBlock={setBlocking}
                    confirm={confirm}
                />
            )}
            {tab === 'peserta' && pagination.last > 1 && (
                <div className="mt-3 flex items-center justify-end gap-2 text-[12px]">
                    {pagination.current > 1 && (
                        <Btn variant="outline" onClick={() => goto(pagination.current - 1)}>
                            Sebelumnya
                        </Btn>
                    )}
                    <span className="text-ink/50">
                        Halaman {pagination.current} dari {pagination.last}
                    </span>
                    {pagination.current < pagination.last && (
                        <Btn variant="outline" onClick={() => goto(pagination.current + 1)}>
                            Berikutnya
                        </Btn>
                    )}
                </div>
            )}

            {editingAdmin && <AdminDialog admin={editingAdmin === 'new' ? null : editingAdmin} onClose={() => setEditingAdmin(null)} />}
            {editingPeserta && <PesertaDialog peserta={editingPeserta} areas={areas} onClose={() => setEditingPeserta(null)} />}
            {blocking && <BlockDialog peserta={blocking} onClose={() => setBlocking(null)} />}
            {confirmDialog}
        </AdminLayout>
    );
}
