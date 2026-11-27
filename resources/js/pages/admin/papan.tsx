import { Btn, BtnLink } from '@/features/admin/ui';
import AdminLayout, { PauseOutletDialog } from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { router } from '@inertiajs/react';
import { useState } from 'react';

type OutletRow = { code: string; name: string; area: string | null; used: number; total: number; active: boolean };
type Stock = { key: string; label: string; total: number; used: number; left: number; detail: string };
type Selected = {
    id: number;
    code: string;
    name: string;
    active: boolean;
    used: number;
    total: number;
    used_voucher: number;
    used_merch: number;
    used_limited: number;
    claims_today: number;
};

/** Warna bar per jenis (desain): voucher lime, merchandise hitam. */
const STOCK_BAR: Record<string, string> = { voucher: 'bg-lime', merch: 'bg-[#0b0b0b]' };

function StatusChip({ active }: { active: boolean }) {
    return (
        <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-extrabold', active ? 'bg-lime text-ink' : 'bg-[#fde0dc] text-[#b42318]')}>
            {active ? 'Aktif' : 'Dijeda'}
        </span>
    );
}

/**
 * A4 Papan dan slot (desain): tabel semua warung dengan slot terpakai, stok per jenis hadiah di semua papan, dan
 * ringkasan warung terpilih. Grid 25 slot per warung ada di "Lihat papan dan QR".
 */
export default function Papan({
    outlets,
    stock,
    totals,
    selected,
}: {
    outlets: OutletRow[];
    stock: Stock[];
    totals: { slots: number; used: number };
    selected: Selected | null;
}) {
    const [pauseOpen, setPauseOpen] = useState(false);
    const pick = (code: string) => router.get('/admin/papan', { titik: code }, { preserveScroll: true, preserveState: true, replace: true });

    return (
        <AdminLayout active="papan" title="Papan dan hadiah" subtitle={`${outlets.length} papan × 25 hadiah = ${totals.slots} hadiah`}>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
                <section className="rounded-2xl bg-white p-4">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-[12px]">
                            <thead>
                                <tr className="text-ink/50 text-left text-[11px]">
                                    <th className="py-2 pl-3 font-semibold">Titik</th>
                                    <th className="py-2 font-semibold">Nama warung</th>
                                    <th className="py-2 font-semibold">Area</th>
                                    <th className="py-2 font-semibold">Hadiah terpakai</th>
                                    <th className="py-2 pr-3 font-semibold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {outlets.map((o) => {
                                    const isSelected = o.code === selected?.code;
                                    const pct = o.total ? Math.round((o.used / o.total) * 100) : 0;
                                    return (
                                        <tr
                                            key={o.code}
                                            onClick={() => pick(o.code)}
                                            className={cn('cursor-pointer', isSelected ? 'bg-lime-soft' : 'hover:bg-cream/60')}
                                        >
                                            <td className="rounded-l-xl py-2 pl-3 font-extrabold">{o.code}</td>
                                            <td className="py-2 font-bold">{o.name}</td>
                                            <td className="text-ink/60 py-2">{o.area ?? '-'}</td>
                                            <td className="py-2">
                                                <span className="flex items-center gap-3">
                                                    <span className="bg-cream-deep h-2 w-28 overflow-hidden rounded-full">
                                                        <span className="bg-lime block h-full rounded-full" style={{ width: `${pct}%` }} />
                                                    </span>
                                                    <span className="font-bold tabular-nums">
                                                        {o.used}/{o.total}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="rounded-r-xl py-2 pr-3">
                                                <StatusChip active={o.active} />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="space-y-4">
                    <section className="rounded-2xl bg-white p-4">
                        <h2 className="text-[15px] font-extrabold">Stok per jenis</h2>
                        <p className="text-ink/50 text-[11px]">
                            {totals.used} terpakai · {totals.slots - totals.used} sisa dari {totals.slots}
                        </p>
                        <div className="mt-3 space-y-4">
                            {stock.map((s) => (
                                <div key={s.key}>
                                    <div className="flex justify-between text-[13px] font-extrabold">
                                        <span>{s.label}</span>
                                        <span className="tabular-nums">
                                            {s.used} / {s.total}
                                        </span>
                                    </div>
                                    <div className="bg-cream-deep mt-1.5 h-2 overflow-hidden rounded-full">
                                        <div
                                            className={cn('h-full rounded-full', STOCK_BAR[s.key] ?? 'bg-lime')}
                                            style={{ width: `${s.total ? (s.used / s.total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <p className="text-ink/60 mt-1.5 text-[11px]">Sisa {s.left}</p>
                                    <p className="text-ink/45 text-[10px]">{s.detail}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-ink/45 border-ink/5 mt-4 border-t pt-3 text-[11px]">
                            {stock.map((s) => s.total).join(' + ')} = {totals.slots}
                        </p>
                    </section>

                    {selected && (
                        <section className="rounded-2xl bg-white p-4">
                            <div className="flex items-start justify-between gap-2">
                                <h2 className="text-[15px] font-extrabold">
                                    {selected.code} · {selected.name}
                                </h2>
                                <StatusChip active={selected.active} />
                            </div>
                            <dl className="divide-ink/5 mt-2 divide-y text-[12px]">
                                <div className="flex justify-between py-2">
                                    <dt className="text-ink/55">Hadiah terpakai</dt>
                                    <dd className="font-extrabold">
                                        {selected.used} dari {selected.total}
                                    </dd>
                                </div>
                                <div className="flex justify-between py-2">
                                    <dt className="text-ink/55">Voucher / merch / LE</dt>
                                    <dd className="font-extrabold">
                                        {selected.used_voucher} / {selected.used_merch} / {selected.used_limited}
                                    </dd>
                                </div>
                                <div className="flex justify-between py-2">
                                    <dt className="text-ink/55">Klaim hari ini</dt>
                                    <dd className="font-extrabold">{selected.claims_today}</dd>
                                </div>
                            </dl>
                            <div className="mt-3 space-y-2">
                                <BtnLink href={`/admin/papan/${selected.code}`} variant="yellow" className="w-full justify-center rounded-full">
                                    Lihat papan dan QR
                                </BtnLink>
                                {selected.active && (
                                    <Btn
                                        variant="outline"
                                        onClick={() => setPauseOpen(true)}
                                        className="w-full justify-center rounded-full border-2 border-[#d0271d] text-[#b42318]"
                                    >
                                        Jeda titik ini
                                    </Btn>
                                )}
                            </div>
                            <p className="text-ink/45 mt-2 text-[10px] leading-relaxed">
                                Peserta di titik ini melihat halaman istirahat sampai dilanjutkan.
                            </p>
                        </section>
                    )}
                </div>
            </div>

            {selected && pauseOpen && (
                <PauseOutletDialog outlet={selected} used={selected.used} total={selected.total} onClose={() => setPauseOpen(false)} />
            )}
        </AdminLayout>
    );
}
