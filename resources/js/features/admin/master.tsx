import { Btn, FieldError, Hint, Modal, MultiSelect, Opt, Req, RequiredNote, SelectInput, TextInput } from '@/features/admin/ui';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';

/** Data dan form bersama halaman Master data: Warung, Area, Mitra, Jenis voucher. */
export type Option = { value: string; label: string };
export type AreaOption = { id: number; name: string };

function Actions({ onClose, onSave, disabled, label = 'Simpan' }: { onClose: () => void; onSave: () => void; disabled?: boolean; label?: string }) {
    return (
        <div className="mt-4 flex justify-end gap-2">
            <Btn variant="outline" onClick={onClose}>
                Batal
            </Btn>
            <Btn disabled={disabled} onClick={onSave}>
                {label}
            </Btn>
        </div>
    );
}

export type OutletRow = {
    id: number;
    code: string;
    name: string;
    whatsapp: string | null;
    wa: string | null;
    qr: string;
    area_ids: number[];
    areas: string[];
    voucher_type_ids: number[];
    voucher_types: string[];
};

/**
 * Tambah atau ubah warung. Area kos dan jenis voucher sudah dibuat di menunya sendiri; di sini admin tinggal memilih
 * area kos yang dicakup warung dan jenis voucher yang masuk ke papannya.
 */
export function OutletDialog({
    outlet,
    areas,
    voucherTypes,
    onClose,
}: {
    outlet: OutletRow | null;
    areas: AreaOption[];
    voucherTypes: AreaOption[];
    onClose: () => void;
}) {
    const form = useForm({
        code: outlet?.code ?? '',
        name: outlet?.name ?? '',
        whatsapp: outlet?.whatsapp ?? '',
        area_ids: outlet?.area_ids ?? ([] as number[]),
        voucher_type_ids: outlet?.voucher_type_ids ?? ([] as number[]),
    });
    const [confirming, setConfirming] = useState(false);
    const typesChanged = !!outlet && [...outlet.voucher_type_ids].sort().join(',') !== [...form.data.voucher_type_ids].sort().join(',');

    function save() {
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (outlet) form.put(`/admin/master-data/titik/${outlet.id}`, opts);
        else form.post('/admin/master-data/titik', opts);
    }

    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[15px] font-extrabold">{outlet ? `Ubah warung ${outlet.code}` : 'Tambah warung'}</h3>
            {!outlet && <p className="text-ink/55 mt-1 text-[12px]">Warung baru otomatis mendapat alamat QR dan 25 slot A1 sampai E5.</p>}
            <RequiredNote />
            <div className="mt-3 space-y-3">
                {!outlet && (
                    <label className="block text-[11px] font-bold">
                        Kode warung
                        <Req />
                        <TextInput
                            value={form.data.code}
                            onChange={(e) => form.setData('code', e.target.value.toUpperCase().slice(0, 3))}
                            placeholder="W21"
                            className="mt-1"
                        />
                        <Hint>Satu huruf dan dua angka, mis. W21. Tidak bisa diubah setelah disimpan karena tercetak di QR.</Hint>
                        <FieldError message={form.errors.code} />
                    </label>
                )}
                <label className="block text-[11px] font-bold">
                    Nama warung
                    <Req />
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <Hint>Nama yang tampil di halaman peserta, mis. Warung Djarum.</Hint>
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Nomor WhatsApp warung
                    <Req />
                    <TextInput
                        value={form.data.whatsapp}
                        onChange={(e) => form.setData('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 13))}
                        placeholder="08xx"
                        className="mt-1"
                    />
                    <Hint>Nomor pemilik atau penjaga warung untuk dihubungi admin. Diawali 08, 10 sampai 13 angka.</Hint>
                    <FieldError message={form.errors.whatsapp} />
                </label>
                <div className="text-[11px] font-bold">
                    Area kos yang dicakup
                    <Req />
                    <MultiSelect
                        value={form.data.area_ids}
                        onChange={(v) => form.setData('area_ids', v)}
                        placeholder={areas.length ? 'Pilih area kos' : 'Belum ada area. Tambah di menu Area.'}
                        options={areas.map((a) => ({ value: a.id, label: a.name }))}
                        className="mt-1"
                    />
                    <Hint>Pilih semua area kos yang pembelinya datang ke warung ini. Bisa lebih dari satu.</Hint>
                    <FieldError message={form.errors.area_ids} />
                </div>
                <div className="text-[11px] font-bold">
                    Jenis voucher di papan warung ini
                    <Opt />
                    <MultiSelect
                        value={form.data.voucher_type_ids}
                        onChange={(v) => form.setData('voucher_type_ids', v)}
                        placeholder="Semua jenis voucher"
                        options={voucherTypes.map((t) => ({ value: t.id, label: t.name }))}
                        className="mt-1"
                    />
                    <span className="text-ink/55 mt-1 block font-normal">
                        Kosongkan untuk memakai semua jenis. Jenis hadiah yang tidak dipilih (mis. tidak memilih token) tetap memakai semua jenisnya.
                    </span>
                    <FieldError message={form.errors.voucher_type_ids} />
                </div>
            </div>

            {confirming && (
                <p className="mt-3 rounded-lg bg-[#fff3a3]/60 px-3 py-2 text-[12px]">
                    Pilihan voucher berubah. Slot papan {outlet?.code} yang masih kosong akan diisi ulang sesuai pilihan baru; slot yang sudah diambil
                    peserta tidak berubah. Simpan?
                </p>
            )}
            <Actions
                onClose={onClose}
                disabled={
                    !form.data.name.trim() ||
                    form.data.whatsapp.length < 10 ||
                    !form.data.area_ids.length ||
                    (!outlet && form.data.code.length !== 3) ||
                    form.processing
                }
                label={form.processing ? 'Menyimpan...' : confirming ? 'Ya, simpan' : 'Simpan'}
                onSave={() => (typesChanged && !confirming ? setConfirming(true) : save())}
            />
        </Modal>
    );
}

export function AddArea({ onClose }: { onClose: () => void }) {
    const form = useForm({ name: '', delivery: false });
    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[15px] font-extrabold">Tambah area</h3>
            <RequiredNote />
            <div className="mt-3 space-y-3">
                <label className="block text-[11px] font-bold">
                    Nama area
                    <Req />
                    <TextInput
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Mis. Sukabirus"
                        className="mt-1"
                    />
                    <Hint>Nama jalan atau wilayah kos, mis. Jl. Sukabirus. Tidak boleh sama dengan area lain.</Hint>
                    <FieldError message={form.errors.name} />
                </label>
                <label className="flex items-center gap-2 text-[12px]">
                    <input
                        type="checkbox"
                        checked={form.data.delivery}
                        onChange={(e) => form.setData('delivery', e.target.checked)}
                        className="accent-ink size-4"
                    />
                    Area antar hadiah barang
                </label>
                <Hint>Centang bila hadiah barang (merchandise) boleh diantar ke alamat di area ini.</Hint>
            </div>
            <Actions
                onClose={onClose}
                disabled={!form.data.name.trim() || form.processing}
                onSave={() => form.post('/admin/master-data/area', { preserveScroll: true, onSuccess: onClose })}
            />
        </Modal>
    );
}

/** Jenis akun mitra di database: mitra voucher (umum), mitra kuota, dan akun warung (outlet). */
export type PartnerKind = 'umum' | 'kuota' | 'outlet';
export const PARTNER_TYPE_LABEL: Record<PartnerKind, string> = { umum: 'Mitra voucher', kuota: 'Mitra kuota', outlet: 'Akun warung' };

export type PartnerFormRow = { id: number; name: string; kind: PartnerKind; whatsapp: string | null };

/**
 * Tambah atau ubah akun mitra (PRD bagian 8). Tab Mitra: pilih jenis mitra voucher atau mitra kuota. Tab Akun warung:
 * pilih warungnya (satu warung satu akun). PIN dibuat otomatis saat menambah dan ditampilkan sekali.
 */
export function PartnerDialog({
    partner,
    outletAccount,
    outlets,
    onClose,
}: {
    partner: PartnerFormRow | null;
    outletAccount: boolean;
    outlets: { id: number; name: string }[];
    onClose: () => void;
}) {
    const isOutlet = partner ? partner.kind === 'outlet' : outletAccount;
    const form = useForm({
        name: partner?.name ?? '',
        type: partner?.kind ?? (outletAccount ? 'outlet' : 'umum'),
        outlet_id: '',
        whatsapp: partner?.whatsapp ?? '',
    });
    const title = partner ? `Ubah ${partner.name}` : isOutlet ? 'Tambah akun warung' : 'Tambah mitra';

    function save() {
        const opts = { preserveScroll: true, onSuccess: onClose };
        if (partner) form.put(`/admin/mitra/${partner.id}`, opts);
        else form.post('/admin/mitra', opts);
    }

    return (
        <Modal open onClose={onClose}>
            <h3 className="pr-8 text-[15px] font-extrabold">{title}</h3>
            <p className="text-ink/55 mt-1 text-[12px]">
                {isOutlet
                    ? 'Akun PIN untuk warung titik menukar voucher warung dan galon. Satu akun per warung.'
                    : 'Usaha penerima voucher. Jenis vouchernya diatur di menu Jenis voucher, lalu dipilih per warung di menu Warung.'}
            </p>
            <RequiredNote />
            <div className="mt-3 space-y-3">
                {isOutlet && !partner && (
                    <label className="block text-[11px] font-bold">
                        Warung
                        <Req />
                        <SelectInput
                            value={form.data.outlet_id}
                            onChange={(v) => form.setData('outlet_id', v)}
                            placeholder={outlets.length ? 'Pilih warung' : 'Semua warung sudah punya akun'}
                            options={outlets.map((o) => ({ value: o.id, label: o.name }))}
                            className="mt-1"
                        />
                        <Hint>Hanya warung yang belum punya akun. Satu warung satu akun.</Hint>
                        <FieldError message={form.errors.outlet_id} />
                    </label>
                )}
                {!isOutlet && (
                    <label className="block text-[11px] font-bold">
                        Jenis mitra
                        <Req />
                        <SelectInput
                            value={form.data.type}
                            onChange={(v) => form.setData('type', v as PartnerKind)}
                            options={[
                                { value: 'umum', label: 'Mitra voucher' },
                                { value: 'kuota', label: 'Mitra kuota' },
                            ]}
                            className="mt-1"
                        />
                        <Hint>Mitra voucher: menukar voucher (kopi, laundry, dsb.). Mitra kuota: penjual pulsa/kuota, ada antrean top up.</Hint>
                    </label>
                )}
                <label className="block text-[11px] font-bold">
                    {isOutlet ? 'Nama pemilik/penjaga warung' : 'Nama mitra'}
                    <Req />
                    <TextInput value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} className="mt-1" />
                    <Hint>{isOutlet ? 'Nama orang yang memegang PIN akun warung ini.' : 'Nama usaha mitra, mis. Kopi Groei.'}</Hint>
                    <FieldError message={form.errors.name} />
                </label>
                <label className="block text-[11px] font-bold">
                    Nomor WhatsApp
                    <Req />
                    <TextInput
                        value={form.data.whatsapp}
                        onChange={(e) => form.setData('whatsapp', e.target.value.replace(/\D/g, '').slice(0, 13))}
                        placeholder="08xx"
                        className="mt-1"
                    />
                    <Hint>Diawali 08, 10 sampai 13 angka, tanpa spasi. Mis. 081234567890.</Hint>
                    <FieldError message={form.errors.whatsapp} />
                </label>
                {!partner && <p className="text-ink/55 text-[11px]">PIN 4 angka dibuat otomatis dan ditampilkan sekali setelah disimpan.</p>}
            </div>
            <Actions
                onClose={onClose}
                disabled={
                    (isOutlet && !partner && !form.data.outlet_id) || !form.data.name.trim() || form.data.whatsapp.length < 10 || form.processing
                }
                onSave={save}
            />
        </Modal>
    );
}
