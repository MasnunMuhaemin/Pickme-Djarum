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
import { router, useForm, usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
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
};
type Area = { id: number; name: string };

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
        <AdminLayout active="pengguna" title="Pengguna" subtitle="Akun admin panel dan data peserta program">
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
                        Semua admin punya akses penuh ke panel. Akun mitra dan akun warung diatur di Master data, Mitra & akun.
                    </p>
                </Card>
            ) : (
                <Card title={`${pagination.total} peserta`} className="mt-4">
                    <form onSubmit={find} className="mb-3 flex max-w-md gap-2">
                        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama atau nomor WhatsApp" />
                        <Btn type="submit" variant="outline">
                            <Search className="size-3.5" />
                            Cari
                        </Btn>
                    </form>
                    {participants.length ? (
                        <Table head={['Peserta', 'Area kos', 'Klaim', 'Terdaftar', 'Status', 'Aksi']}>
                            {participants.map((p) => (
                                <tr key={p.id}>
                                    <Td>
                                        <p className="font-extrabold">{p.name}</p>
                                        <Phone value={p.whatsapp} className="text-ink/45 text-[10px]" />
                                    </Td>
                                    <Td>{p.area ?? '-'}</Td>
                                    <Td>
                                        {p.claims} klaim · {p.caps} cap
                                    </Td>
                                    <Td className="text-ink/55">{p.registered ?? '-'}</Td>
                                    <Td>
                                        <span className="flex flex-col items-start gap-1">
                                            {p.blocked ? (
                                                <Chip tone="red" className="whitespace-normal">
                                                    Diblokir · {p.blocked}
                                                </Chip>
                                            ) : (
                                                <Chip tone="green">Aktif</Chip>
                                            )}
                                            {p.pin_requested && <Chip tone="yellow">Minta reset PIN</Chip>}
                                        </span>
                                    </Td>
                                    <Td>
                                        <span className="flex gap-1.5">
                                            {p.wa && (
                                                <BtnLink href={p.wa} external variant="yellow">
                                                    WhatsApp
                                                </BtnLink>
                                            )}
                                            <Btn variant="outline" onClick={() => setEditingPeserta(p)}>
                                                Ubah
                                            </Btn>
                                            <Btn
                                                variant={p.pin_requested ? 'yellow' : 'outline'}
                                                onClick={() =>
                                                    confirm({
                                                        title: `Reset PIN ${p.name}?`,
                                                        message:
                                                            'PIN lama langsung tidak berlaku. PIN baru ditampilkan sekali; berikan ke peserta lewat WhatsApp pribadi.',
                                                        confirmLabel: 'Reset PIN',
                                                        danger: true,
                                                        onConfirm: () =>
                                                            router.post(`/admin/pengguna/peserta/${p.id}/pin`, {}, { preserveScroll: true }),
                                                    })
                                                }
                                            >
                                                Reset PIN
                                            </Btn>
                                            {p.blocked ? (
                                                <Btn
                                                    variant="ghost"
                                                    onClick={() =>
                                                        confirm({
                                                            title: `Buka blokir ${p.name}?`,
                                                            message: p.blocked_reason ? `Alasan blokir: ${p.blocked_reason}` : undefined,
                                                            confirmLabel: 'Buka blokir',
                                                            onConfirm: () =>
                                                                router.post(`/admin/pengguna/peserta/${p.id}/blokir`, {}, { preserveScroll: true }),
                                                        })
                                                    }
                                                >
                                                    Buka blokir
                                                </Btn>
                                            ) : (
                                                <Btn variant="ghost" className="text-[#b42318]" onClick={() => setBlocking(p)}>
                                                    Blokir
                                                </Btn>
                                            )}
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </Table>
                    ) : (
                        <Empty>{search ? `Tidak ada peserta dengan "${search}".` : 'Belum ada peserta.'}</Empty>
                    )}
                    {pagination.last > 1 && (
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
                    <p className="text-ink/45 mt-3 text-[11px]">
                        Peserta mendaftar sendiri lewat webapp (persetujuan data dan cek usia), jadi tidak bisa ditambahkan dari admin.
                    </p>
                </Card>
            )}

            {editingAdmin && <AdminDialog admin={editingAdmin === 'new' ? null : editingAdmin} onClose={() => setEditingAdmin(null)} />}
            {editingPeserta && <PesertaDialog peserta={editingPeserta} areas={areas} onClose={() => setEditingPeserta(null)} />}
            {blocking && <BlockDialog peserta={blocking} onClose={() => setBlocking(null)} />}
            {confirmDialog}
        </AdminLayout>
    );
}
