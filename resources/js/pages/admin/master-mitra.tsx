import { PARTNER_TYPE_LABEL, PartnerDialog, type PartnerKind } from '@/features/admin/master';
import { Btn, BtnLink, Card, Chip, Empty, Phone, SearchInput, Table, Td, matches, useConfirm } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import { useState } from 'react';

type PartnerRow = {
    id: number;
    name: string;
    kind: PartnerKind;
    outlet: string | null;
    whatsapp: string | null;
    wa: string | null;
    active: boolean;
    has_pin: boolean;
    types: number;
};

type Tab = 'mitra' | 'warung';

function initialTab(): Tab {
    const q = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('jenis');
    return q === 'warung' || q === 'outlet' ? 'warung' : 'mitra';
}

/**
 * Master data > Mitra & akun (PRD bagian 8). Tab Mitra berisi mitra voucher dan mitra kuota (dibedakan kolom Jenis);
 * tab Akun warung berisi akun PIN tiap warung titik.
 */
export default function MasterMitra({ partners, freeOutlets }: { partners: PartnerRow[]; freeOutlets: { id: number; name: string }[] }) {
    const [tab, setTab] = useState<Tab>(initialTab);
    const [editing, setEditing] = useState<PartnerRow | null | 'new'>(null);
    const [q, setQ] = useState('');
    const [confirm, confirmDialog] = useConfirm();
    const isOutlet = tab === 'warung';
    const inTab = partners.filter((p) => (isOutlet ? p.kind === 'outlet' : p.kind !== 'outlet'));
    const rows = inTab.filter((p) => matches(q, p.name, p.whatsapp, p.outlet, PARTNER_TYPE_LABEL[p.kind]));

    function switchTab(next: Tab) {
        setTab(next);
        setQ('');
        // Tab tersimpan di URL supaya setelah simpan admin tetap di tab yang sama.
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?jenis=${next}`);
    }

    function actions(p: PartnerRow) {
        return (
            <span className="inline-flex gap-1.5">
                {p.wa && (
                    <BtnLink href={p.wa} external variant="yellow">
                        WhatsApp
                    </BtnLink>
                )}
                <Btn variant="outline" onClick={() => setEditing(p)}>
                    <Pencil className="size-3.5" />
                    Ubah
                </Btn>
                <Btn
                    variant="outline"
                    onClick={() =>
                        confirm({
                            title: `${p.has_pin ? 'Reset' : 'Buat'} PIN ${p.name}?`,
                            message: p.has_pin
                                ? 'PIN lama langsung tidak berlaku. Berikan PIN baru ke pemilik akun.'
                                : 'PIN baru akan ditampilkan sekali.',
                            confirmLabel: p.has_pin ? 'Reset PIN' : 'Buat PIN',
                            danger: p.has_pin,
                            onConfirm: () => router.post(`/admin/mitra/${p.id}/pin`, {}, { preserveScroll: true }),
                        })
                    }
                >
                    {p.has_pin ? 'Reset PIN' : 'Buat PIN'}
                </Btn>
                <Btn
                    variant="ghost"
                    onClick={() =>
                        confirm({
                            title: `${p.active ? 'Nonaktifkan' : 'Aktifkan'} ${p.name}?`,
                            message: p.active ? 'Akun ini tidak bisa masuk dan menukar voucher sampai diaktifkan lagi.' : undefined,
                            confirmLabel: p.active ? 'Nonaktifkan' : 'Aktifkan',
                            danger: p.active,
                            onConfirm: () => router.post(`/admin/mitra/${p.id}/status`, {}, { preserveScroll: true }),
                        })
                    }
                >
                    {p.active ? 'Nonaktifkan' : 'Aktifkan'}
                </Btn>
            </span>
        );
    }

    const whatsapp = (p: PartnerRow) => (p.whatsapp ? <Phone value={p.whatsapp} /> : <span className="font-bold text-[#b42318]">Belum diisi</span>);

    return (
        <AdminLayout active="md-mitra" title="Mitra & akun" subtitle="Langkah 2: akun PIN mitra dan akun warung">
            <div className="flex flex-wrap gap-2">
                {(
                    [
                        ['mitra', 'Mitra', partners.filter((p) => p.kind !== 'outlet').length],
                        ['warung', 'Akun warung', partners.filter((p) => p.kind === 'outlet').length],
                    ] as const
                ).map(([key, label, count]) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => switchTab(key)}
                        className={cn(
                            'flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition',
                            key === tab ? 'bg-ink text-white' : 'border-ink/10 hover:bg-ink/5 border bg-white',
                        )}
                    >
                        {label}
                        <span className={cn('rounded-full px-1.5 text-[10px]', key === tab ? 'bg-lime text-ink' : 'bg-ink/5')}>{count}</span>
                    </button>
                ))}
            </div>

            <Card
                title={isOutlet ? 'Akun warung' : 'Mitra'}
                right={<Btn onClick={() => setEditing('new')}>{isOutlet ? 'Tambah akun warung' : 'Tambah mitra'}</Btn>}
                className="mt-4"
            >
                <SearchInput
                    value={q}
                    onChange={setQ}
                    placeholder={isOutlet ? 'Cari warung, nama, atau nomor' : 'Cari nama mitra, jenis, atau nomor'}
                    className="mb-3"
                />
                {rows.length ? (
                    isOutlet ? (
                        <Table head={['Warung', 'Pemilik/penjaga', 'WhatsApp', 'Status', 'Aksi']}>
                            {rows.map((p) => (
                                <tr key={p.id}>
                                    <Td className="font-extrabold">
                                        {p.outlet ?? <span className="text-[#b42318]">Belum terhubung ke warung</span>}
                                    </Td>
                                    <Td>{p.name}</Td>
                                    <Td>{whatsapp(p)}</Td>
                                    <Td>{p.active ? <Chip tone="green">Aktif</Chip> : <Chip>Nonaktif</Chip>}</Td>
                                    <Td>{actions(p)}</Td>
                                </tr>
                            ))}
                        </Table>
                    ) : (
                        <Table head={['Mitra', 'Jenis', 'WhatsApp', 'Jenis voucher', 'Status', 'Aksi']}>
                            {rows.map((p) => (
                                <tr key={p.id}>
                                    <Td className="font-bold">{p.name}</Td>
                                    <Td>{p.kind === 'kuota' ? <Chip tone="blue">Mitra kuota</Chip> : <Chip>Mitra voucher</Chip>}</Td>
                                    <Td>{whatsapp(p)}</Td>
                                    <Td>{p.types}</Td>
                                    <Td>{p.active ? <Chip tone="green">Aktif</Chip> : <Chip>Nonaktif</Chip>}</Td>
                                    <Td>{actions(p)}</Td>
                                </tr>
                            ))}
                        </Table>
                    )
                ) : (
                    <Empty>{q ? `Tidak ada yang cocok dengan "${q}".` : isOutlet ? 'Belum ada akun warung.' : 'Belum ada mitra.'}</Empty>
                )}
                <p className="text-ink/45 mt-3 text-[11px]">
                    Akun hanya dibuat admin. Admin tidak bisa melihat PIN lama, hanya mereset. Rekap dan pembayaran ada di menu Pembayaran mitra.
                </p>
            </Card>

            {editing && (
                <PartnerDialog
                    partner={editing === 'new' ? null : editing}
                    outletAccount={isOutlet}
                    outlets={freeOutlets}
                    onClose={() => setEditing(null)}
                />
            )}
            {confirmDialog}
        </AdminLayout>
    );
}
