import { Btn, BtnLink, Card, Chip, Table, Td } from '@/features/admin/ui';
import AdminLayout, { type AdminShared, EmergencyDialog } from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

type OutletRow = { id: number; code: string; area: string | null; used: number; total: number; active: boolean };
type SlotCell = { position: string; status: string; prize: string; by: string | null; at: string | null };
type Selected = { id: number; code: string; name: string; area: string | null; active: boolean; slots: SlotCell[] };

/** A4 Papan dan slot: hanya baca. Jeda per titik dipicu dari sini. */
export default function Papan({
    outlets,
    selected,
    stock,
}: {
    outlets: OutletRow[];
    selected: Selected | null;
    stock: { label: string; total: number; used: number; left: number }[];
}) {
    const admin = usePage().props.admin as AdminShared;
    const [pauseOpen, setPauseOpen] = useState(false);
    const counts = selected
        ? {
              used: selected.slots.filter((s) => s.status === 'used').length,
              held: selected.slots.filter((s) => s.status === 'held').length,
              empty: selected.slots.filter((s) => s.status === 'empty').length,
          }
        : null;
    const totals = stock.reduce((acc, s) => ({ total: acc.total + s.total, used: acc.used + s.used, left: acc.left + s.left }), {
        total: 0,
        used: 0,
        left: 0,
    });

    return (
        <AdminLayout active="papan" title="Papan dan slot" subtitle={`${outlets.length} titik · 25 slot per papan · hanya baca`}>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <Card>
                    <Table head={['Titik', 'Area', 'Terpakai', 'Status']}>
                        {outlets.map((o) => (
                            <tr key={o.id} className={cn(selected?.id === o.id && 'bg-[#fffbd6]')}>
                                <Td>
                                    <Link
                                        href={`/admin/papan?titik=${o.code}`}
                                        preserveScroll
                                        className="font-extrabold underline-offset-2 hover:underline"
                                    >
                                        {o.code}
                                    </Link>
                                </Td>
                                <Td>{o.area ?? '-'}</Td>
                                <Td>
                                    {o.used} / {o.total}
                                </Td>
                                <Td>{o.active ? <Chip tone="green">Aktif</Chip> : <Chip tone="red">Dijeda</Chip>}</Td>
                            </tr>
                        ))}
                    </Table>
                </Card>

                <div className="space-y-4">
                    {selected && counts && (
                        <Card
                            title={`Papan ${selected.code} · ${selected.area ?? selected.name}`}
                            right={
                                selected.active ? (
                                    <span className="flex gap-2">
                                        <BtnLink href={`/admin/papan/${selected.code}/cetak`} variant="outline">
                                            Cetak papan dan QR
                                        </BtnLink>
                                        <Btn variant="red" onClick={() => setPauseOpen(true)}>
                                            Jeda titik ini
                                        </Btn>
                                    </span>
                                ) : (
                                    <Btn
                                        variant="black"
                                        onClick={() =>
                                            router.post(
                                                '/admin/darurat/lanjutkan',
                                                { scope: 'outlet', outlet_id: selected.id },
                                                { preserveScroll: true },
                                            )
                                        }
                                    >
                                        Lanjutkan titik
                                    </Btn>
                                )
                            }
                        >
                            <div className="grid grid-cols-5 gap-2">
                                {selected.slots.map((slot) => (
                                    <div
                                        key={slot.position}
                                        title={`${slot.prize}${slot.by ? ` · ${slot.by}` : ''}${slot.at ? ` · ${slot.at}` : ''}`}
                                        className={cn(
                                            'grid h-11 place-items-center rounded-lg text-[12px] font-extrabold',
                                            slot.status === 'used' && 'bg-black text-white',
                                            slot.status === 'held' && 'border-2 border-black bg-[#ffe500]',
                                            slot.status === 'empty' && 'border border-black/15 bg-white',
                                        )}
                                    >
                                        {slot.position}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-3 flex flex-wrap gap-4 text-[11px] text-black/55">
                                <span>■ Terpakai {counts.used}</span>
                                <span className="text-black">
                                    <span className="text-[#c9b400]">■</span> Ditahan {counts.held}
                                </span>
                                <span>□ Kosong {counts.empty}</span>
                                <span className="text-black/40">Arahkan kursor ke slot untuk melihat isi, pengambil, dan waktu.</span>
                            </p>
                        </Card>
                    )}

                    <Card title="Sisa stok hadiah">
                        <Table head={['Jenis hadiah', 'Total', 'Terpakai', 'Sisa']}>
                            {stock.map((s) => (
                                <tr key={s.label}>
                                    <Td>{s.label}</Td>
                                    <Td>{s.total}</Td>
                                    <Td>{s.used}</Td>
                                    <Td className="font-bold">{s.left}</Td>
                                </tr>
                            ))}
                            <tr className="font-extrabold">
                                <Td>Jumlah</Td>
                                <Td>{totals.total}</Td>
                                <Td>{totals.used}</Td>
                                <Td>{totals.left}</Td>
                            </tr>
                        </Table>
                    </Card>
                </div>
            </div>

            {selected && admin && (
                <EmergencyDialog
                    open={pauseOpen}
                    onClose={() => setPauseOpen(false)}
                    admin={admin}
                    initialScope="outlet"
                    initialOutlet={selected.id}
                />
            )}
        </AdminLayout>
    );
}
