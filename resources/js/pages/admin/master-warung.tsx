import { type AreaOption, OutletDialog, type OutletRow } from '@/features/admin/master';
import { downloadQr } from '@/features/admin/qr';
import { Btn, SearchInput, matches } from '@/features/admin/ui';
import AdminLayout, { PauseOutletDialog } from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { CirclePause, MapPin, Printer, QrCode, ScanLine } from 'lucide-react';
import { useState } from 'react';

type Row = OutletRow & { area: string | null; used: number; total: number; active: boolean; qr_used: boolean; qr_tested: string | null };
type Stats = { active: number; paused: number; emptySlots: number; qrUsed: number; total: number };

function StatCard({ label, value, hint, icon: Icon, tone }: { label: string; value: string | number; hint: string; icon: LucideIcon; tone: string }) {
    return (
        <div className="flex items-start justify-between gap-2 rounded-2xl bg-white p-4">
            <div>
                <p className="text-ink/55 text-[11px] font-semibold">{label}</p>
                <p className="mt-1 text-[26px] leading-none font-extrabold">{value}</p>
                <p className="text-ink/45 mt-1 text-[10px]">{hint}</p>
            </div>
            <span className={cn('grid size-10 place-items-center rounded-full', tone)}>
                <Icon className="size-5" />
            </span>
        </div>
    );
}

/** Warung (desain admin): ringkasan, tabel semua warung dengan slot terpakai, QR, dan aksi per warung. */
export default function MasterWarung({
    stats,
    outlets,
    areas,
    voucherTypes,
}: {
    stats: Stats;
    outlets: Row[];
    areas: AreaOption[];
    voucherTypes: AreaOption[];
}) {
    const [editing, setEditing] = useState<Row | null | 'new'>(null);
    const [pausing, setPausing] = useState<Row | null>(null);
    const [q, setQ] = useState('');
    const rows = outlets.filter((o) => matches(q, o.code, o.name, o.area, ...o.areas));

    return (
        <AdminLayout active="md-warung" title="Warung" subtitle={`${stats.total} warung, ${stats.total * 25} hadiah`}>
            <div className="-mt-2 mb-4 flex flex-wrap justify-end gap-2">
                <Link
                    href="/admin/cetak-voucher"
                    className="border-ink flex h-9 items-center gap-1.5 rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                >
                    <Printer className="size-4" /> Cetak voucher
                </Link>
                <Btn variant="yellow" className="h-9 rounded-full" onClick={() => setEditing('new')}>
                    Tambah warung
                </Btn>
                <Link
                    href="/admin/master-data/warung/qr"
                    className="border-ink flex h-9 items-center rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                >
                    Cetak semua QR
                </Link>
                <a
                    href="/admin/master-data/warung/ekspor"
                    className="border-ink flex h-9 items-center rounded-full border-2 bg-white px-4 text-[12px] font-extrabold"
                >
                    Export CSV
                </a>
            </div>

            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard label="Warung aktif" value={stats.active} hint={`dari ${stats.total} titik`} icon={MapPin} tone="bg-lime text-ink" />
                <StatCard
                    label="Warung dijeda"
                    value={stats.paused}
                    hint="peserta diarahkan ke warung lain"
                    icon={CirclePause}
                    tone="bg-[#fde0dc] text-[#b42318]"
                />
                <StatCard
                    label="Hadiah tersisa"
                    value={stats.emptySlots}
                    hint={`dari ${stats.total * 25} hadiah`}
                    icon={ScanLine}
                    tone="bg-[#e9e2bf] text-ink"
                />
                <StatCard
                    label="QR sudah dipakai"
                    value={`${stats.qrUsed} / ${stats.total}`}
                    hint="sudah ada klaim pertama"
                    icon={QrCode}
                    tone="bg-[#fff1d6] text-[#b07a12]"
                />
            </div>

            <section className="mt-4 rounded-2xl bg-white p-4">
                <SearchInput value={q} onChange={setQ} placeholder="Cari kode, nama, atau area" className="mb-3 max-w-sm" />
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-[12px]">
                        <thead>
                            <tr className="text-ink/50 text-left text-[11px]">
                                <th className="py-2 pl-3 font-semibold">Titik</th>
                                <th className="py-2 font-semibold">Nama warung</th>
                                <th className="py-2 font-semibold">Area</th>
                                <th className="py-2 font-semibold">Hadiah terpakai</th>
                                <th className="py-2 font-semibold">QR</th>
                                <th className="py-2 font-semibold">Status</th>
                                <th className="py-2 pr-3 font-semibold">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-ink/5 divide-y">
                            {rows.map((o) => (
                                <tr
                                    key={o.id}
                                    onClick={() => router.visit(`/admin/papan/${o.code}`)}
                                    className="hover:bg-cream/50 cursor-pointer"
                                    title="Buka detail papan"
                                >
                                    <td className="py-2.5 pl-3 font-extrabold">{o.code}</td>
                                    <td className="py-2.5 font-bold">{o.name}</td>
                                    <td className="text-ink/60 py-2.5">{o.area ?? o.areas[0] ?? '-'}</td>
                                    <td className="py-2.5">
                                        <span className="flex items-center gap-3">
                                            <span className="bg-cream-deep h-2 w-28 overflow-hidden rounded-full">
                                                <span
                                                    className="bg-lime block h-full rounded-full"
                                                    style={{ width: `${o.total ? (o.used / o.total) * 100 : 0}%` }}
                                                />
                                            </span>
                                            <span className="font-bold tabular-nums">
                                                {o.used}/{o.total}
                                            </span>
                                        </span>
                                    </td>
                                    <td className="py-2.5">
                                        {o.qr_tested ? (
                                            <span className="bg-lime-soft rounded-full px-2.5 py-0.5 text-[10px] font-extrabold">Lolos uji scan</span>
                                        ) : (
                                            <span className="rounded-full bg-[#fff1d6] px-2.5 py-0.5 text-[10px] font-extrabold text-[#7a5410]">
                                                Belum diuji
                                            </span>
                                        )}
                                        <span className="text-ink/50 block text-[10px]">{o.qr_used ? 'sudah dipakai peserta' : 'belum dipakai'}</span>
                                    </td>
                                    <td className="py-2.5">
                                        <span
                                            className={cn(
                                                'rounded-full px-2.5 py-0.5 text-[10px] font-extrabold',
                                                o.active ? 'bg-lime' : 'bg-[#fde0dc] text-[#b42318]',
                                            )}
                                        >
                                            {o.active ? 'Aktif' : 'Dijeda'}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-3">
                                        {/* Tombol aksi tidak ikut membuka detail baris. */}
                                        <span className="flex items-center gap-3 font-extrabold" onClick={(e) => e.stopPropagation()}>
                                            <button type="button" onClick={() => downloadQr(o.qr, o.code)} className="hover:underline">
                                                Unduh QR
                                            </button>
                                            <button type="button" onClick={() => setEditing(o)} className="hover:underline">
                                                Ubah
                                            </button>
                                            {o.active && (
                                                <button type="button" onClick={() => setPausing(o)} className="text-[#b42318] hover:underline">
                                                    Jeda
                                                </button>
                                            )}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-ink/50 py-8 text-center">
                                        {q ? `Tidak ada warung yang cocok dengan "${q}".` : 'Belum ada warung.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <p className="text-ink/45 mt-3 text-[11px]">
                    Warung yang dijeda tetap tercatat; peserta yang scan QR-nya melihat halaman istirahat. Area kos dan jenis voucher diatur lewat
                    Ubah.
                </p>
            </section>

            {editing && (
                <OutletDialog
                    outlet={editing === 'new' ? null : editing}
                    areas={areas}
                    voucherTypes={voucherTypes}
                    onClose={() => setEditing(null)}
                />
            )}
            {pausing && <PauseOutletDialog outlet={pausing} used={pausing.used} total={pausing.total} onClose={() => setPausing(null)} />}
        </AdminLayout>
    );
}
