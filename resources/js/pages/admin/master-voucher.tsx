import { type Option } from '@/features/admin/master';
import {
    Btn,
    Card,
    Empty,
    FieldError,
    Hint,
    Modal,
    Opt,
    Req,
    RequiredNote,
    SearchInput,
    SelectInput,
    Table,
    Td,
    TextInput,
    matches,
    rupiah,
    useConfirm,
} from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

type VType = {
    id: number;
    name: string;
    partner_id: number | null;
    partner: string | null;
    partner_label: string | null;
    outlets: string[];
    value: number;
    quantity: number;
    fulfillment: string;
    fulfillment_label: string;
};
type PartnerOption = { id: number; name: string };

/** Tambah/ubah jenis voucher. Jenis ini masuk ke papan warung yang memilihnya di menu Warung. */
function TypeDialog({
    type,
    partners,
    fulfillments,
    onClose,
}: {
    type: VType | null;
    partners: PartnerOption[];
    fulfillments: Option[];
    onClose: () => void;
}) {
    const form = useForm({
        name: type?.name ?? '',
        partner_id: type?.partner_id ? String(type.partner_id) : '',
        partner_label: type?.partner_label ?? '',
        value: type ? String(type.value) : '',
        quantity: type ? String(type.quantity) : '',
        fulfillment: type?.fulfillment ?? 'mitra',
    });
    const partner = partners.find((p) => String(p.id) === form.data.partner_id) ?? null;
    // Voucher mitra ditukar di mitra (atau kuota lewat mitra); token dan bensin hanya untuk tanpa akun mitra.
    const options = partner ? fulfillments.filter((f) => f.value === 'mitra' || f.value === 'kuota') : fulfillments;

    function choosePartner(v: string) {
        form.setData((d) => ({
            ...d,
            partner_id: v,
            fulfillment: v && !['mitra', 'kuota'].includes(d.fulfillment) ? 'mitra' : d.fulfillment,
        }));
    }

    function save() {
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (type) form.put(`/admin/master-data/jenis-voucher/${type.id}`, opts);
        else form.post('/admin/master-data/jenis-voucher', opts);
    }

    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[15px] font-extrabold">{type ? 'Ubah jenis voucher' : 'Tambah jenis voucher'}</h3>
            <RequiredNote />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-bold sm:col-span-2">
                    Mitra penukar
                    <Opt />
                    <SelectInput
                        value={form.data.partner_id}
                        onChange={choosePartner}
                        placeholder="Tanpa akun mitra (token, bensin, voucher warung, galon)"
                        options={partners.map((p) => ({ value: p.id, label: p.name }))}
                        className="mt-1"
                    />
                    <Hint>Mitra tempat voucher ditukar peserta. Kosongkan untuk token listrik, bensin tunai, voucher warung, dan galon.</Hint>
                </label>
                <label className="block text-[11px] font-bold sm:col-span-2">
                    Nama jenis voucher
                    <Req />
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <Hint>Nama yang tampil ke peserta, mis. Kopi atau Laundry.</Hint>
                    <FieldError message={form.errors.name} />
                </label>
                {!partner && (
                    <label className="block text-[11px] font-bold sm:col-span-2">
                        Label tempat penukaran
                        <Opt />
                        <TextInput
                            value={form.data.partner_label}
                            onChange={(e) => form.setData('partner_label', e.target.value)}
                            placeholder="Mis. Outlet (20 titik)"
                            className="mt-1"
                        />
                        <Hint>Untuk jenis tanpa mitra: tempat atau cara penukarannya, mis. Outlet (20 titik) atau Tunai oleh admin.</Hint>
                    </label>
                )}
                <label className="block text-[11px] font-bold">
                    Nilai penukaran (Rp)
                    <Req />
                    <TextInput
                        type="number"
                        min={0}
                        value={form.data.value}
                        onChange={(e) => form.setData('value', e.target.value)}
                        className="mt-1"
                    />
                    <Hint>Angka rupiah tanpa titik, mis. 35000.</Hint>
                    <FieldError message={form.errors.value} />
                </label>
                <label className="block text-[11px] font-bold">
                    Jumlah
                    <Req />
                    <TextInput
                        type="number"
                        min={0}
                        value={form.data.quantity}
                        onChange={(e) => form.setData('quantity', e.target.value)}
                        className="mt-1"
                    />
                    <Hint>Total voucher jenis ini di semua papan, mis. 26.</Hint>
                    <FieldError message={form.errors.quantity} />
                </label>
                <label className="block text-[11px] font-bold sm:col-span-2">
                    Jenis pemenuhan
                    <Req />
                    <SelectInput value={form.data.fulfillment} onChange={(v) => form.setData('fulfillment', v)} options={options} className="mt-1" />
                    <Hint>
                        Mitra: ditukar di mitra. Token listrik: admin mengirim kode token. Pulsa via mitra: diisi mitra kuota. Bensin tunai:
                        diserahkan admin.
                    </Hint>
                </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn disabled={!form.data.name.trim() || form.data.value === '' || form.data.quantity === '' || form.processing} onClick={save}>
                    Simpan
                </Btn>
            </div>
        </Modal>
    );
}

/** Master data > Jenis voucher: isi hadiah papan, disaring per area. */
export default function MasterVoucher({
    types,
    summary,
    partners,
    fulfillments,
    outletCodes,
}: {
    types: VType[];
    summary: string;
    partners: PartnerOption[];
    fulfillments: Option[];
    outletCodes: string[];
}) {
    const [outlet, setOutlet] = useState('');
    const [q, setQ] = useState('');
    const [editing, setEditing] = useState<VType | null | 'new'>(null);
    const [confirm, confirmDialog] = useConfirm();
    // Saringan warung: jenis yang masuk ke papan warung itu.
    const shown = (outlet === '' ? types : types.filter((t) => t.outlets.includes(outlet))).filter((t) =>
        matches(q, t.name, t.partner, t.fulfillment_label),
    );
    const total = shown.reduce((sum, t) => sum + t.quantity, 0);

    return (
        <AdminLayout active="md-voucher" title="Master data" subtitle="Jenis hadiah, mitra penukar, nilai, dan jumlah.">
            <div className="flex flex-wrap items-center gap-2">
                <SearchInput value={q} onChange={setQ} placeholder="Cari jenis, mitra, atau pemenuhan" />
                <SelectInput
                    value={outlet}
                    onChange={setOutlet}
                    placeholder="Semua warung"
                    options={outletCodes.map((code) => ({ value: code, label: `Dipakai di ${code}` }))}
                    className="w-52"
                />
            </div>

            <Card title={`${shown.length} jenis voucher`} right={<Btn onClick={() => setEditing('new')}>Tambah jenis voucher</Btn>} className="mt-4">
                {shown.length ? (
                    <Table head={['Jenis', 'Mitra penukar', 'Dipakai di warung', 'Nilai penukaran', 'Jumlah', 'Jenis pemenuhan', '']}>
                        {shown.map((t) => (
                            <tr key={t.id}>
                                <Td className="font-bold">{t.name}</Td>
                                <Td>{t.partner ?? '-'}</Td>
                                <Td className="text-ink/60">{t.outlets.length ? t.outlets.join(', ') : 'Belum dipilih warung mana pun'}</Td>
                                <Td>{rupiah(t.value)}</Td>
                                <Td>{t.quantity}</Td>
                                <Td>{t.fulfillment_label}</Td>
                                <Td className="text-right">
                                    <span className="inline-flex gap-1">
                                        <button
                                            type="button"
                                            aria-label="Ubah"
                                            onClick={() => setEditing(t)}
                                            className="hover:bg-ink/5 grid size-6 place-items-center rounded-full"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Hapus"
                                            onClick={() =>
                                                confirm({
                                                    title: `Hapus jenis voucher ${t.name}?`,
                                                    message: 'Jenis voucher yang dihapus tidak bisa dikembalikan.',
                                                    confirmLabel: 'Hapus',
                                                    danger: true,
                                                    onConfirm: () =>
                                                        router.delete(`/admin/master-data/jenis-voucher/${t.id}`, { preserveScroll: true }),
                                                })
                                            }
                                            className="grid size-6 place-items-center rounded-full text-[#b42318] hover:bg-[#fde0dc]"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </span>
                                </Td>
                            </tr>
                        ))}
                        <tr className="font-extrabold">
                            <Td>Jumlah</Td>
                            <Td />
                            <Td />
                            <Td />
                            <Td>{total}</Td>
                            <Td />
                            <Td />
                        </tr>
                    </Table>
                ) : (
                    <Empty>Belum ada jenis voucher untuk warung ini.</Empty>
                )}
                {outlet === '' && summary && <p className="text-ink/60 mt-3 text-[12px] font-semibold">Per pemenuhan: {summary}</p>}
                <p className="text-ink/45 mt-3 text-[11px]">
                    Jenis voucher masuk ke papan warung yang memilihnya di menu Warung. Warung yang belum memilih memakai semua jenis.
                </p>
            </Card>

            {editing && (
                <TypeDialog
                    type={editing === 'new' ? null : editing}
                    partners={partners}
                    fulfillments={fulfillments}
                    onClose={() => setEditing(null)}
                />
            )}
            {confirmDialog}
        </AdminLayout>
    );
}
