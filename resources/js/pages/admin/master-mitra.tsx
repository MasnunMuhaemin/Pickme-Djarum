import { AddPartner, PARTNER_KINDS, type PartnerKind } from '@/features/admin/master';
import { Btn, Card, Chip, Empty, Phone, Table, Td, useConfirm } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type PartnerRow = {
    id: number;
    name: string;
    kind: PartnerKind;
    outlet: string | null;
    whatsapp: string;
    active: boolean;
    has_pin: boolean;
    types: number;
};

const KINDS = Object.keys(PARTNER_KINDS) as PartnerKind[];

function initialKind(): PartnerKind {
    const q = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('jenis');
    return KINDS.includes(q as PartnerKind) ? (q as PartnerKind) : 'umum';
}

/**
 * Master data > Mitra & akun (PRD bagian 8): tiga jenis akun PIN mitra dipisah per tab supaya tidak tertukar.
 * Akun warung terikat ke satu warung titik; mitra voucher dan kuota tidak punya area (PRD bagian 16).
 */
export default function MasterMitra({ partners, freeOutlets }: { partners: PartnerRow[]; freeOutlets: { id: number; name: string }[] }) {
    const [kind, setKind] = useState<PartnerKind>(initialKind);
    const [adding, setAdding] = useState(false);
    const [confirm, confirmDialog] = useConfirm();
    const rows = partners.filter((p) => p.kind === kind);
    const isOutlet = kind === 'outlet';

    function switchKind(next: PartnerKind) {
        setKind(next);
        // Tab tersimpan di URL supaya setelah simpan admin tetap di tab yang sama.
        window.history.replaceState(window.history.state, '', `${window.location.pathname}?jenis=${next}`);
    }

    function actions(p: PartnerRow) {
        return (
            <span className="inline-flex gap-1.5">
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

    return (
        <AdminLayout active="md-mitra" title="Mitra & akun" subtitle="Langkah 2: akun PIN mitra voucher, mitra kuota, dan warung">
            <div className="flex flex-wrap gap-2">
                {KINDS.map((k) => {
                    const count = partners.filter((p) => p.kind === k).length;
                    return (
                        <button
                            key={k}
                            type="button"
                            onClick={() => switchKind(k)}
                            className={cn(
                                'flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition',
                                k === kind ? 'bg-ink text-white' : 'border-ink/10 hover:bg-ink/5 border bg-white',
                            )}
                        >
                            {PARTNER_KINDS[k].tab}
                            <span className={cn('rounded-full px-1.5 text-[10px]', k === kind ? 'bg-lime text-ink' : 'bg-ink/5')}>{count}</span>
                        </button>
                    );
                })}
            </div>

            <Card title={PARTNER_KINDS[kind].tab} right={<Btn onClick={() => setAdding(true)}>{PARTNER_KINDS[kind].add}</Btn>} className="mt-4">
                <p className="text-ink/55 -mt-1 mb-3 text-[12px]">{PARTNER_KINDS[kind].hint}</p>
                {rows.length ? (
                    isOutlet ? (
                        <Table head={['Warung', 'Pemilik/penjaga', 'WhatsApp', 'Status', 'Aksi']}>
                            {rows.map((p) => (
                                <tr key={p.id}>
                                    <Td className="font-extrabold">
                                        {p.outlet ?? <span className="text-[#b42318]">Belum terhubung ke warung</span>}
                                    </Td>
                                    <Td>{p.name}</Td>
                                    <Td>
                                        <Phone value={p.whatsapp} />
                                    </Td>
                                    <Td>{p.active ? <Chip tone="green">Aktif</Chip> : <Chip>Nonaktif</Chip>}</Td>
                                    <Td>{actions(p)}</Td>
                                </tr>
                            ))}
                        </Table>
                    ) : (
                        <Table head={['Mitra', 'WhatsApp', 'Jenis voucher', 'Status', 'Aksi']}>
                            {rows.map((p) => (
                                <tr key={p.id}>
                                    <Td className="font-bold">{p.name}</Td>
                                    <Td>
                                        <Phone value={p.whatsapp} />
                                    </Td>
                                    <Td>{p.types}</Td>
                                    <Td>{p.active ? <Chip tone="green">Aktif</Chip> : <Chip>Nonaktif</Chip>}</Td>
                                    <Td>{actions(p)}</Td>
                                </tr>
                            ))}
                        </Table>
                    )
                ) : (
                    <Empty>Belum ada {PARTNER_KINDS[kind].tab.toLowerCase()}.</Empty>
                )}
                <p className="text-ink/45 mt-3 text-[11px]">
                    Akun hanya dibuat admin. Admin tidak bisa melihat PIN lama, hanya mereset. Rekap dan pembayaran ada di menu Pembayaran mitra.
                </p>
            </Card>

            {adding && <AddPartner kind={kind} outlets={freeOutlets} onClose={() => setAdding(false)} />}
            {confirmDialog}
        </AdminLayout>
    );
}
