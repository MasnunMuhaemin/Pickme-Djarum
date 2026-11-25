import { Btn, BtnLink, Card, Chip, Empty, SelectInput, Table, Td } from '@/features/admin/ui';
import AdminLayout, { type AdminShared, EmergencyDialog } from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type OutletRow = { id: number; code: string; name: string; area: string | null; used: number; total: number; active: boolean };
type SlotCell = {
    position: string;
    status: string;
    prize: string;
    by: string | null;
    at: string | null;
    voucher_code: string | null;
    voucher_status: string | null;
    claimed: boolean;
};
type Selected = { id: number; code: string; name: string; area: string | null; active: boolean; slots: SlotCell[] };

/** A4 Papan dan slot: hanya baca. Jeda per titik dipicu dari sini. */
export default function Papan({
    outlets,
    selected,
    stock,
}: {
    outlets: OutletRow[];
    selected: Selected | null;
    stock: { label: string; partner: string | null; total: number; used: number; left: number }[];
}) {
    const admin = usePage().props.admin as AdminShared;
    const [pauseOpen, setPauseOpen] = useState(false);
    const index = outlets.findIndex((o) => o.id === selected?.id);
    const go = (o?: OutletRow) => o && router.visit(`/admin/papan?titik=${o.code}`, { preserveScroll: true });
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
            {/* Pemilih warung: tetap ringkas walau warungnya puluhan. */}
            <Card className="mb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold">Warung</span>
                    <Btn variant="outline" disabled={index <= 0} onClick={() => go(outlets[index - 1])} aria-label="Warung sebelumnya">
                        <ChevronLeft className="size-3.5" />
                    </Btn>
                    <SelectInput
                        value={selected?.code ?? ''}
                        onChange={(code) => go(outlets.find((o) => o.code === code))}
                        options={outlets.map((o) => ({
                            value: o.code,
                            label: `${o.code} · ${o.name} · ${o.area ?? '-'} · ${o.used}/${o.total} terpakai${o.active ? '' : ' · DIJEDA'}`,
                        }))}
                        className="w-full max-w-md"
                    />
                    <Btn
                        variant="outline"
                        disabled={index < 0 || index >= outlets.length - 1}
                        onClick={() => go(outlets[index + 1])}
                        aria-label="Warung berikutnya"
                    >
                        <ChevronRight className="size-3.5" />
                    </Btn>
                    {selected && (
                        <span className="text-ink/55 ml-auto text-[11px]">
                            {index + 1} dari {outlets.length} warung ·{' '}
                            {outlets[index]?.active ? <Chip tone="green">Aktif</Chip> : <Chip tone="red">Dijeda</Chip>}
                        </span>
                    )}
                </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
                <div>
                    <Card title={selected ? `Isi hadiah papan ${selected.code} · ${selected.name}` : 'Isi hadiah papan'}>
                        <Table head={['Hadiah', 'Total', 'Terpakai', 'Sisa']}>
                            {stock.map((s) => (
                                <tr key={s.label}>
                                    <Td>
                                        <p className="font-bold">{s.label}</p>
                                        {s.partner && <p className="text-ink/45 text-[10px]">Tukar di {s.partner}</p>}
                                    </Td>
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
                                        title={`${slot.prize}${slot.voucher_code ? ` · ${slot.voucher_code}` : ''}${slot.by ? ` · ${slot.by}` : ''}${slot.at ? ` · ${slot.at}` : ''}`}
                                        className={cn(
                                            'grid h-11 place-items-center rounded-lg text-[12px] font-extrabold',
                                            slot.status === 'used' && 'bg-ink text-white',
                                            slot.status === 'held' && 'border-ink bg-lime border-2',
                                            slot.status === 'empty' && 'border-ink/15 border bg-white',
                                        )}
                                    >
                                        {slot.position}
                                    </div>
                                ))}
                            </div>
                            <p className="text-ink/55 mt-3 flex flex-wrap gap-4 text-[11px]">
                                <span>■ Terpakai {counts.used}</span>
                                <span className="text-ink">
                                    <span className="text-lime-dark">■</span> Ditahan {counts.held}
                                </span>
                                <span>□ Kosong {counts.empty}</span>
                                <span className="text-ink/40">Arahkan kursor ke slot untuk melihat isi, pengambil, dan waktu.</span>
                            </p>
                        </Card>
                    )}

                    {selected && (
                        <Card
                            title={`Kode voucher papan ${selected.code}`}
                            right={
                                <span className="text-ink/55 text-[11px] font-bold">
                                    {selected.slots.filter((slot) => slot.claimed).length} sudah diklaim ·{' '}
                                    {selected.slots.filter((slot) => slot.voucher_code && !slot.claimed).length} belum
                                </span>
                            }
                        >
                            {selected.slots.some((slot) => slot.voucher_code) ? (
                                <Table head={['Slot', 'Peserta', 'Hadiah', 'Kode voucher', 'Status']}>
                                    {selected.slots
                                        .filter((slot) => slot.voucher_code)
                                        // Belum diklaim di atas supaya admin langsung melihat kode yang masih tersedia.
                                        .sort((a, b) => Number(a.claimed) - Number(b.claimed) || a.position.localeCompare(b.position))
                                        .map((slot) => (
                                            <tr key={slot.position}>
                                                <Td className="font-extrabold">{slot.position}</Td>
                                                <Td>{slot.claimed ? (slot.by ?? '-') : <span className="text-ink/40">-</span>}</Td>
                                                <Td>{slot.prize}</Td>
                                                <Td className="font-mono font-bold tracking-wider">{slot.voucher_code}</Td>
                                                <Td>
                                                    {slot.claimed ? <Chip>{slot.voucher_status}</Chip> : <Chip tone="yellow">Belum diklaim</Chip>}
                                                </Td>
                                            </tr>
                                        ))}
                                </Table>
                            ) : (
                                <Empty>Belum ada voucher yang keluar dari papan ini.</Empty>
                            )}
                            <p className="text-ink/45 mt-3 text-[11px]">
                                Setiap slot hadiah sudah punya kode sejak papan dibuat; saat peserta mengambil slot, kode itu menjadi kode vouchernya.
                                Merchandise tidak punya kode.
                            </p>
                        </Card>
                    )}
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
