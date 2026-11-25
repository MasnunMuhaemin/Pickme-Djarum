import { downloadQr } from '@/features/admin/qr';
import { Btn, Card, Chip, FieldError, Modal, SelectInput, Table, Td, TextInput, rupiah } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { router, useForm } from '@inertiajs/react';
import { Download, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';

type VType = {
    id: number;
    name: string;
    partner_id: number | null;
    partner: string | null;
    partner_label: string | null;
    value: number;
    quantity: number;
    fulfillment: string;
    fulfillment_label: string;
};
type Option = { value: string; label: string };

function TypeDialog({
    type,
    partners,
    fulfillments,
    onClose,
}: {
    type: VType | null;
    partners: { id: number; name: string }[];
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

    function save() {
        const options = { preserveScroll: true, onSuccess: onClose };
        if (type) form.put(`/admin/master-data/jenis-voucher/${type.id}`, options);
        else form.post('/admin/master-data/jenis-voucher', options);
    }

    return (
        <Modal open onClose={onClose}>
            <h3 className="text-[15px] font-extrabold">{type ? 'Ubah jenis voucher' : 'Tambah jenis voucher'}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="col-span-2 block text-[11px] font-bold">
                    Jenis
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Mitra (akun)
                    <SelectInput
                        value={form.data.partner_id}
                        onChange={(e) => form.setData('partner_id', e.target.value)}
                        placeholder="Tanpa akun mitra"
                        options={partners.map((p) => ({ value: p.id, label: p.name }))}
                        className="mt-1"
                    />
                </label>
                <label className="block text-[11px] font-bold">
                    Label mitra
                    <TextInput
                        value={form.data.partner_label}
                        onChange={(e) => form.setData('partner_label', e.target.value)}
                        placeholder="Mis. Outlet (20 titik)"
                        className="mt-1"
                    />
                </label>
                <label className="block text-[11px] font-bold">
                    Nilai penukaran (Rp)
                    <TextInput
                        type="number"
                        min={0}
                        value={form.data.value}
                        onChange={(e) => form.setData('value', e.target.value)}
                        className="mt-1"
                    />
                    <FieldError message={form.errors.value} />
                </label>
                <label className="block text-[11px] font-bold">
                    Jumlah
                    <TextInput
                        type="number"
                        min={0}
                        value={form.data.quantity}
                        onChange={(e) => form.setData('quantity', e.target.value)}
                        className="mt-1"
                    />
                    <FieldError message={form.errors.quantity} />
                </label>
                <label className="col-span-2 block text-[11px] font-bold">
                    Jenis pemenuhan
                    <SelectInput
                        value={form.data.fulfillment}
                        onChange={(e) => form.setData('fulfillment', e.target.value)}
                        options={fulfillments}
                        className="mt-1"
                    />
                </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn disabled={form.processing} onClick={save}>
                    Simpan
                </Btn>
            </div>
        </Modal>
    );
}

function AddOutlet({ areas, onClose }: { areas: { id: number; name: string }[]; onClose: () => void }) {
    const form = useForm({ code: '', name: '', area_id: '' });
    return (
        <Modal open onClose={onClose}>
            <h3 className="text-[15px] font-extrabold">Tambah titik</h3>
            <p className="mt-1 text-[12px] text-black/55">Titik baru otomatis mendapat alamat QR dan 25 slot A1 sampai E5.</p>
            <div className="mt-3 space-y-3">
                <label className="block text-[11px] font-bold">
                    Kode titik
                    <TextInput
                        value={form.data.code}
                        onChange={(e) => form.setData('code', e.target.value.toUpperCase().slice(0, 3))}
                        placeholder="W21"
                        className="mt-1"
                    />
                    <FieldError message={form.errors.code} />
                </label>
                <label className="block text-[11px] font-bold">
                    Nama warung
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Area
                    <SelectInput
                        value={form.data.area_id}
                        onChange={(e) => form.setData('area_id', e.target.value)}
                        placeholder="Pilih area"
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
                <Btn disabled={form.processing} onClick={() => form.post('/admin/master-data/titik', { preserveScroll: true, onSuccess: onClose })}>
                    Simpan
                </Btn>
            </div>
        </Modal>
    );
}

/** A6 Master data: jenis voucher skema B, titik, dan area. Perubahan tercatat di log. */
export default function MasterData({
    types,
    summary,
    partners,
    fulfillments,
    outlets,
    areas,
}: {
    types: VType[];
    summary: string;
    partners: { id: number; name: string }[];
    fulfillments: Option[];
    outlets: { code: string; name: string; area: string | null; qr: string }[];
    areas: { id: number; name: string; delivery: boolean; outlets: number }[];
}) {
    const [editing, setEditing] = useState<VType | null | 'new'>(null);
    const [addingOutlet, setAddingOutlet] = useState(false);
    const areaForm = useForm({ name: '', delivery: false });
    const total = types.reduce((sum, t) => sum + t.quantity, 0);

    return (
        <AdminLayout active="master-data" title="Master data" subtitle="Jenis voucher skema B, nilai penukaran dan jumlah">
            <Card title="Jenis voucher" right={<Btn onClick={() => setEditing('new')}>Tambah jenis</Btn>}>
                <Table head={['Jenis', 'Mitra', 'Nilai penukaran', 'Jumlah', 'Jenis pemenuhan', '']}>
                    {types.map((t) => (
                        <tr key={t.id}>
                            <Td>{t.name}</Td>
                            <Td>{t.partner ?? '-'}</Td>
                            <Td>{rupiah(t.value)}</Td>
                            <Td>{t.quantity}</Td>
                            <Td>{t.fulfillment_label}</Td>
                            <Td className="text-right">
                                <span className="inline-flex gap-1">
                                    <button
                                        type="button"
                                        aria-label="Ubah"
                                        onClick={() => setEditing(t)}
                                        className="grid size-6 place-items-center rounded-full hover:bg-black/5"
                                    >
                                        <Pencil className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Hapus"
                                        onClick={() =>
                                            confirm(`Hapus jenis voucher ${t.name}?`) &&
                                            router.delete(`/admin/master-data/jenis-voucher/${t.id}`, { preserveScroll: true })
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
                        <Td>{total}</Td>
                        <Td className="font-semibold text-black/55">{summary}</Td>
                        <Td />
                    </tr>
                </Table>
            </Card>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <Card title={`Titik (${outlets.length})`} right={<Btn onClick={() => setAddingOutlet(true)}>Tambah titik</Btn>}>
                    <Table head={['Kode', 'Warung', 'Area', 'Alamat QR', '']}>
                        {outlets.map((o) => (
                            <tr key={o.code}>
                                <Td className="font-extrabold">{o.code}</Td>
                                <Td>{o.name}</Td>
                                <Td>{o.area ?? '-'}</Td>
                                <Td className="font-mono text-[11px] text-black/60">{o.qr}</Td>
                                <Td className="text-right">
                                    <Btn variant="outline" onClick={() => downloadQr(o.qr, o.code)}>
                                        <Download className="size-3.5" />
                                        Unduh QR
                                    </Btn>
                                </Td>
                            </tr>
                        ))}
                    </Table>
                </Card>
                <Card title="Area kos dan area pengiriman">
                    <Table head={['Area', 'Titik', 'Pengiriman', '']}>
                        {areas.map((a) => (
                            <tr key={a.id}>
                                <Td className="font-bold">{a.name}</Td>
                                <Td>{a.outlets}</Td>
                                <Td>{a.delivery ? <Chip tone="green">Area antar</Chip> : <Chip>Bukan area antar</Chip>}</Td>
                                <Td className="text-right">
                                    <Btn
                                        variant="outline"
                                        onClick={() => router.post(`/admin/master-data/area/${a.id}/antar`, {}, { preserveScroll: true })}
                                    >
                                        {a.delivery ? 'Hapus dari antar' : 'Jadikan area antar'}
                                    </Btn>
                                </Td>
                            </tr>
                        ))}
                    </Table>
                    <div className="mt-3 flex items-center gap-2">
                        <TextInput
                            value={areaForm.data.name}
                            onChange={(e) => areaForm.setData('name', e.target.value)}
                            placeholder="Nama area baru"
                            className="max-w-[220px]"
                        />
                        <label className="flex items-center gap-1.5 text-[11px]">
                            <input
                                type="checkbox"
                                checked={areaForm.data.delivery}
                                onChange={(e) => areaForm.setData('delivery', e.target.checked)}
                                className="accent-black"
                            />
                            Area antar
                        </label>
                        <Btn
                            disabled={!areaForm.data.name.trim() || areaForm.processing}
                            onClick={() => areaForm.post('/admin/master-data/area', { preserveScroll: true, onSuccess: () => areaForm.reset() })}
                        >
                            Tambah area
                        </Btn>
                    </div>
                    <FieldError message={areaForm.errors.name} />
                </Card>
            </div>

            {editing && (
                <TypeDialog
                    type={editing === 'new' ? null : editing}
                    partners={partners}
                    fulfillments={fulfillments}
                    onClose={() => setEditing(null)}
                />
            )}
            {addingOutlet && <AddOutlet areas={areas} onClose={() => setAddingOutlet(false)} />}
        </AdminLayout>
    );
}
