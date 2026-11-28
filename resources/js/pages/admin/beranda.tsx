import { DateInput, SelectInput, rupiah } from '@/features/admin/ui';
import AdminLayout from '@/layouts/admin-layout';
import { cn } from '@/lib/utils';
import { Link, router } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Camera, ChevronRight, Clock, LayoutGrid, Store, Tag, TrendingUp } from 'lucide-react';
import { type ReactNode, useState } from 'react';

type Stats = {
    claims: number;
    oldestToday: string | null;
    toProcess: number;
    needsHelp: number;
    usedSlots: number;
    totalSlots: number;
    redeemed: number;
    redeemedValue: number;
};
type Recent = { code: string; outlet: string | null; kind: string; status: string; ago: string | null };

function Panel({
    title,
    subtitle,
    right,
    className,
    children,
}: {
    title: string;
    subtitle?: string;
    right?: ReactNode;
    className?: string;
    children: ReactNode;
}) {
    return (
        <section className={cn('rounded-2xl bg-white p-5', className)}>
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-[14px] font-extrabold">{title}</h2>
                    {subtitle && <p className="text-ink/50 text-[11px]">{subtitle}</p>}
                </div>
                {right}
            </div>
            <div className="mt-3">{children}</div>
        </section>
    );
}

/** Kartu angka berikon (desain). `dark`: kartu hitam dengan bar progres (slot terpakai). */
function StatCard({
    icon: Icon,
    value,
    label,
    hint,
    hintDanger,
    href,
    dark,
    progress,
}: {
    icon: LucideIcon;
    value: number | string;
    label: string;
    hint?: string;
    hintDanger?: boolean;
    href?: string;
    dark?: boolean;
    progress?: number;
}) {
    const body = (
        <>
            <div className="flex items-center gap-3">
                <span className={cn('grid size-11 shrink-0 place-items-center rounded-full', dark ? 'bg-lime text-ink' : 'bg-lime-soft text-ink')}>
                    <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                    <p className={cn('text-[26px] leading-none font-extrabold tracking-tight', dark && 'text-lime')}>{value}</p>
                    <p className={cn('mt-1 text-[12px] font-bold', dark ? 'text-cream' : 'text-ink')}>{label}</p>
                    {hint && (
                        <p className={cn('truncate text-[10px]', hintDanger ? 'text-[#b42318]' : dark ? 'text-cream/55' : 'text-ink/50')}>{hint}</p>
                    )}
                </div>
            </div>
            {progress !== undefined && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15">
                    <div className="bg-lime h-full rounded-full" style={{ width: `${Math.min(100, progress)}%` }} />
                </div>
            )}
        </>
    );
    const cls = cn('block rounded-2xl p-4 transition', dark ? 'bg-night text-cream' : 'hover:ring-ink/10 bg-white hover:ring-2');
    return href ? (
        <Link href={href} className={cls}>
            {body}
        </Link>
    ) : (
        <div className={cls}>{body}</div>
    );
}

/** Grafik garis klaim per hari (SVG, tanpa library grafik). */
function LineChart({ days }: { days: { label: string; count: number }[] }) {
    const w = 560;
    const h = 200;
    const pad = { l: 28, r: 12, t: 16, b: 24 };
    const max = Math.max(4, ...days.map((d) => d.count));
    const top = Math.ceil(max / 4) * 4;
    const x = (i: number) => pad.l + (i * (w - pad.l - pad.r)) / Math.max(1, days.length - 1);
    const y = (v: number) => pad.t + (1 - v / top) * (h - pad.t - pad.b);
    const points = days.map((d, i) => `${x(i)},${y(d.count)}`).join(' ');
    // Badge jumlah klaim hanya tampil saat titik kurva disorot (hover/sentuh).
    const [hover, setHover] = useState<number | null>(null);
    const picked = hover !== null ? days[hover] : null;
    const col = (w - pad.l - pad.r) / Math.max(1, days.length - 1);
    const labelStep = Math.max(1, Math.ceil(days.length / 8));
    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label="Grafik klaim disetujui" onMouseLeave={() => setHover(null)}>
            {[0, 1, 2, 3, 4].map((i) => {
                const v = (top / 4) * i;
                return (
                    <g key={i}>
                        <line x1={pad.l} x2={w - pad.r} y1={y(v)} y2={y(v)} stroke="#ece6cc" strokeDasharray="3 4" />
                        <text x={pad.l - 8} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#9a9a8a">
                            {v}
                        </text>
                    </g>
                );
            })}
            <polygon points={`${x(0)},${y(0)} ${points} ${x(days.length - 1)},${y(0)}`} fill="#8fc31f" opacity="0.16" />
            <polyline points={points} fill="none" stroke="#8fc31f" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {days.map((d, i) => (
                <g key={d.label}>
                    <circle cx={x(i)} cy={y(d.count)} r={hover === i ? 5 : 3} fill={hover === i ? '#0b0b0b' : '#8fc31f'} />
                    {/* Banyak titik (30 hari, mingguan): label berselang supaya tidak bertumpuk. */}
                    {((i % labelStep === 0 && days.length - 1 - i >= labelStep / 2) || i === days.length - 1) && (
                        <text x={x(i)} y={h - 6} textAnchor="middle" fontSize="9" fill="#9a9a8a">
                            {d.label}
                        </text>
                    )}
                </g>
            ))}
            {/* Area sorot tak terlihat per hari: selebar satu kolom supaya mudah disentuh. */}
            {days.map((d, i) => (
                <rect
                    key={`hit-${d.label}`}
                    x={x(i) - col / 2}
                    y={pad.t}
                    width={col}
                    height={h - pad.t - pad.b}
                    fill="transparent"
                    onMouseEnter={() => setHover(i)}
                    onTouchStart={() => setHover(i)}
                />
            ))}
            {picked && hover !== null && (
                <g pointerEvents="none">
                    {/* Badge di kiri titik, kecuali titik paling kiri supaya tidak terpotong. */}
                    <rect
                        x={Math.min(Math.max(x(hover) - 32, pad.l), w - pad.r - 64)}
                        y={Math.max(y(picked.count) - 38, 0)}
                        width="64"
                        height="28"
                        rx="8"
                        fill="#0b0b0b"
                    />
                    <text
                        x={Math.min(Math.max(x(hover) - 32, pad.l), w - pad.r - 64) + 32}
                        y={Math.max(y(picked.count) - 38, 0) + 18}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="800"
                        fill="#fdf8d5"
                    >
                        {picked.count} klaim
                    </text>
                </g>
            )}
        </svg>
    );
}

/** Donat berlapis (SVG): tiap bagian sesuai jumlahnya. */
function Donut({ parts, center, sub, size = 150 }: { parts: { value: number; color: string }[]; center: string; sub?: string; size?: number }) {
    const total = parts.reduce((a, p) => a + p.value, 0) || 1;
    const r = 42;
    const c = 2 * Math.PI * r;
    let offset = 0;
    return (
        <div className="relative mx-auto" style={{ width: size, height: size }}>
            <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle cx="50" cy="50" r={r} fill="none" stroke="#f1ecd4" strokeWidth="11" />
                {parts.map((p, i) => {
                    const len = (p.value / total) * c;
                    const el = (
                        <circle
                            key={i}
                            cx="50"
                            cy="50"
                            r={r}
                            fill="none"
                            stroke={p.color}
                            strokeWidth="11"
                            strokeDasharray={`${len} ${c - len}`}
                            strokeDashoffset={-offset}
                        />
                    );
                    offset += len;
                    return el;
                })}
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                    <p className="text-[24px] leading-none font-extrabold">{center}</p>
                    {sub && <p className="text-ink/50 mt-1 text-[10px]">{sub}</p>}
                </div>
            </div>
        </div>
    );
}

function Legend({ items }: { items: { label: string; value: number; color: string }[] }) {
    return (
        <ul className="mt-3 space-y-1.5 text-[11px]">
            {items.map((it) => (
                <li key={it.label} className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ background: it.color }} />
                        {it.label}
                    </span>
                    <span className="font-extrabold">{it.value}</span>
                </li>
            ))}
        </ul>
    );
}

/** Batang progres. `color` mewarnai isi; `className` untuk wadah (mis. jarak). */
function Bar({ value, max, color = 'bg-lime', className }: { value: number; max: number; color?: string; className?: string }) {
    return (
        <div className={cn('bg-cream-deep h-2 overflow-hidden rounded-full', className)}>
            <div className={cn('h-full rounded-full', color)} style={{ width: `${max ? Math.min(100, (value / max) * 100) : 0}%` }} />
        </div>
    );
}

const STATUS_CHIP: Record<string, { label: string; className: string }> = {
    approved: { label: 'Disetujui', className: 'bg-lime text-[#0b0b0b]' },
    rejected: { label: 'Ditolak', className: 'bg-[#fde0dc] text-[#b42318]' },
};

/** A1 Beranda: ringkasan program sesuai desain admin. */
const PERIODS = [
    { key: 'hari', label: 'Hari ini', chart: 'Per jam hari ini', text: 'hari ini' },
    { key: '7', label: '7 hari', chart: 'Per hari, 7 hari terakhir', text: '7 hari terakhir' },
    { key: '30', label: '30 hari', chart: 'Per hari, 30 hari terakhir', text: '30 hari terakhir' },
    { key: 'semua', label: 'Semua', chart: 'Per minggu, seluruh program', text: 'seluruh program' },
] as const;

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const pad2 = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const shortDate = (value: string) => {
    const [y, m, d] = value.split('-').map(Number);
    return `${d} ${MONTH_NAMES[m - 1].slice(0, 3)} ${y}`;
};

/** 12 bulan terakhir untuk pilihan bulan: nilai "YYYY-MM-01|YYYY-MM-akhir". */
function monthOptions() {
    const now = new Date();
    return Array.from({ length: 12 }, (_, k) => {
        const first = new Date(now.getFullYear(), now.getMonth() - k, 1);
        const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
        return { value: `${isoDate(first)}|${isoDate(last)}`, label: `${MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}` };
    });
}

export default function Beranda({
    period,
    range,
    stats,
    days,
    claimStatus,
    prizes,
    perArea,
    topOutlets,
    queues,
    recent,
    perPartner,
    partnerWeek,
}: {
    period: (typeof PERIODS)[number]['key'] | 'rentang';
    range: { from: string; to: string } | null;
    stats: Stats;
    days: { label: string; count: number }[];
    claimStatus: { approved: number; waiting: number; rejected: number };
    prizes: { label: string; count: number }[];
    perArea: { name: string; used: number; total: number }[];
    topOutlets: { code: string; name: string; used: number; total: number }[];
    queues: { label: string; count: number; href: string; danger?: boolean }[];
    recent: Recent[];
    perPartner: { name: string; count: number }[];
    partnerWeek: { partners: number; vouchers: number; value: number };
}) {
    const claimTotal = claimStatus.approved + claimStatus.waiting + claimStatus.rejected;
    const approvedPct = claimTotal ? Math.round((claimStatus.approved / claimTotal) * 100) : 0;
    const prizeTotal = prizes.reduce((a, p) => a + p.count, 0);
    const queueMax = Math.max(1, ...queues.map((q) => q.count));
    const partnerMax = Math.max(1, ...perPartner.map((p) => p.count));
    const oldest = stats.oldestToday ? new Date(stats.oldestToday).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null;

    const rangeText = range ? `${shortDate(range.from)} – ${shortDate(range.to)}` : '';
    const current =
        period === 'rentang' && range
            ? { key: 'rentang', label: rangeText, chart: `Klaim disetujui, ${rangeText}`, text: rangeText }
            : (PERIODS.find((p) => p.key === period) ?? PERIODS[1]);
    const [from, setFrom] = useState(range?.from ?? '');
    const [to, setTo] = useState(range?.to ?? '');
    const months = monthOptions();
    const monthValue = range ? (months.find((m) => m.value === `${range.from}|${range.to}`)?.value ?? '') : '';
    const applyRange = (a: string, b: string) => a && b && router.get('/admin', { dari: a, sampai: b }, { preserveScroll: true });

    return (
        <AdminLayout active="beranda" title="Beranda" subtitle="Ringkasan program Lotre Warung">
            {/* Filter periode: berlaku untuk semua panel kecuali antrean pemenuhan (selalu antrean saat ini). */}
            <div className="-mt-2 mb-4 flex flex-wrap items-center gap-2">
                <span className="text-ink/55 text-[12px] font-bold">Periode</span>
                {PERIODS.map((p) => (
                    <Link
                        key={p.key}
                        href={p.key === '7' ? '/admin' : `/admin?periode=${p.key}`}
                        preserveScroll
                        className={cn(
                            'rounded-full px-3.5 py-1.5 text-[12px] font-extrabold transition',
                            p.key === period ? 'bg-[#0b0b0b] text-white' : 'hover:bg-cream-deep bg-white',
                        )}
                    >
                        {p.label}
                    </Link>
                ))}
                {/* Rentang bebas lewat kalender, atau satu bulan penuh. */}
                <span className="text-ink/30 mx-1 hidden sm:inline">|</span>
                <DateInput
                    value={from}
                    onChange={(v) => {
                        setFrom(v);
                        applyRange(v, to);
                    }}
                    className={cn('w-40', period === 'rentang' && 'ring-2 ring-[#0b0b0b]')}
                />
                <span className="text-ink/55 text-[12px] font-bold">s/d</span>
                <DateInput
                    value={to}
                    onChange={(v) => {
                        setTo(v);
                        applyRange(from, v);
                    }}
                    className={cn('w-40', period === 'rentang' && 'ring-2 ring-[#0b0b0b]')}
                />
                <SelectInput
                    value={monthValue}
                    onChange={(v) => {
                        const [a, b] = v.split('|');
                        setFrom(a);
                        setTo(b);
                        applyRange(a, b);
                    }}
                    placeholder="Pilih bulan"
                    options={months}
                    className="w-44"
                />
            </div>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                <StatCard
                    icon={Camera}
                    value={stats.claims}
                    label={period === 'hari' ? 'Klaim hari ini' : `Klaim ${current.text}`}
                    hint={period === 'hari' ? (oldest ? `Klaim pertama ${oldest}` : 'Belum ada klaim hari ini') : 'Klaim disetujui'}
                    href="/admin/antrean-foto"
                />
                <StatCard
                    icon={Clock}
                    value={stats.toProcess}
                    label="Perlu diproses"
                    hint={stats.needsHelp ? `${stats.needsHelp} perlu bantuan` : 'Pemenuhan dan kirim voucher'}
                    hintDanger={stats.needsHelp > 0}
                    href="/admin/pemenuhan"
                />
                <StatCard
                    icon={LayoutGrid}
                    value={stats.usedSlots}
                    label="Hadiah terpakai"
                    hint={`dari ${stats.totalSlots} hadiah · ${current.text}`}
                    href="/admin/papan"
                    dark
                    progress={stats.totalSlots ? (stats.usedSlots / stats.totalSlots) * 100 : 0}
                />
                <StatCard
                    icon={Tag}
                    value={stats.redeemed}
                    label="Voucher ditukar"
                    hint={`${current.label} · ${rupiah(stats.redeemedValue)}`}
                    href="/admin/pembayaran"
                />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <Panel title="Klaim" subtitle={current.chart} right={<TrendingUp className="text-ink/40 size-4" />}>
                    <LineChart days={days} />
                </Panel>
                <Panel title="Status klaim" subtitle={`${current.label} · ${claimTotal} klaim`}>
                    <Donut
                        parts={[
                            { value: claimStatus.approved, color: '#8fc31f' },
                            { value: claimStatus.waiting, color: '#0b0b0b' },
                            { value: claimStatus.rejected, color: '#d0271d' },
                        ]}
                        center={`${approvedPct}%`}
                        sub="disetujui"
                    />
                    <Legend
                        items={[
                            { label: 'Disetujui', value: claimStatus.approved, color: '#8fc31f' },
                            { label: 'Menunggu kode hadiah', value: claimStatus.waiting, color: '#0b0b0b' },
                            { label: 'Ditolak', value: claimStatus.rejected, color: '#d0271d' },
                        ]}
                    />
                </Panel>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Panel title="Hadiah terpakai" subtitle={`Per jenis · ${current.label} · ${prizeTotal} hadiah`}>
                    <div className="flex items-center gap-4">
                        <Donut
                            size={110}
                            parts={[
                                { value: prizes[0]?.count ?? 0, color: '#8fc31f' },
                                { value: prizes[1]?.count ?? 0, color: '#0b0b0b' },
                            ]}
                            center={String(prizeTotal)}
                        />
                        <Legend items={prizes.map((p, i) => ({ label: p.label, value: p.count, color: ['#8fc31f', '#0b0b0b'][i] ?? '#e0a526' }))} />
                    </div>
                </Panel>
                <Panel title="Hadiah per area" subtitle={`Terpakai ${current.text} dari kapasitas`}>
                    <div className="space-y-3">
                        {perArea.map((a) => (
                            <div key={a.name}>
                                <div className="flex justify-between text-[11px]">
                                    <span className="font-bold">{a.name}</span>
                                    <span className="font-extrabold tabular-nums">
                                        {a.used}/{a.total}
                                    </span>
                                </div>
                                <Bar value={a.used} max={a.total} className="mt-1.5" />
                            </div>
                        ))}
                    </div>
                </Panel>
                <Panel title="Warung teratas" subtitle={`Hadiah terpakai terbanyak · ${current.label}`}>
                    <ul className="space-y-3">
                        {topOutlets.map((o, i) => (
                            <li key={o.code} className="flex items-center gap-3">
                                <span
                                    className={cn(
                                        'grid size-8 shrink-0 place-items-center rounded-full',
                                        i === 0 ? 'bg-lime text-ink' : 'bg-cream-deep text-ink/70',
                                    )}
                                >
                                    <Store className="size-4" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block text-[12px] font-extrabold">{o.code}</span>
                                    <span className="text-ink/50 block truncate text-[10px]">{o.name}</span>
                                </span>
                                <span className="text-[12px] font-extrabold tabular-nums">
                                    {o.used}/{o.total}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Panel>
                <Panel title="Antrean pemenuhan" subtitle={`${queues.reduce((a, q) => a + q.count, 0)} permintaan`}>
                    <div className="space-y-3">
                        {queues.map((q) => (
                            <Link key={q.label} href={q.href} className="block">
                                <div className="flex justify-between text-[11px]">
                                    <span className={cn('font-bold', q.danger && 'text-[#b42318]')}>{q.label}</span>
                                    <span className="font-extrabold tabular-nums">{q.count}</span>
                                </div>
                                <Bar value={q.count} max={queueMax} color={q.danger ? 'bg-[#d0271d]' : 'bg-lime'} className="mt-1.5" />
                            </Link>
                        ))}
                    </div>
                </Panel>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
                <Panel
                    title="Klaim terbaru"
                    right={
                        <Link
                            href="/admin/antrean-foto"
                            className="border-ink/20 flex items-center gap-1 rounded-full border-2 px-3 py-1 text-[11px] font-bold"
                        >
                            Lihat semua <ChevronRight className="size-3.5" />
                        </Link>
                    }
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px] text-[12px]">
                            <thead>
                                <tr className="text-ink/50 text-left text-[11px]">
                                    <th className="py-2 font-semibold">Klaim</th>
                                    <th className="py-2 font-semibold">Titik</th>
                                    <th className="py-2 font-semibold">Jenis</th>
                                    <th className="py-2 font-semibold">Status</th>
                                    <th className="py-2 text-right font-semibold">Waktu</th>
                                </tr>
                            </thead>
                            <tbody className="divide-ink/5 divide-y">
                                {recent.map((r) => {
                                    const chip = STATUS_CHIP[r.status] ?? { label: r.status, className: 'bg-cream-deep' };
                                    return (
                                        <tr key={r.code}>
                                            <td className="py-2.5 font-extrabold">{r.code}</td>
                                            <td className="py-2.5">{r.outlet ?? '-'}</td>
                                            <td className="text-ink/60 py-2.5">{r.kind}</td>
                                            <td className="py-2.5">
                                                <span className={cn('rounded-full px-2.5 py-0.5 text-[10px] font-extrabold', chip.className)}>
                                                    {chip.label}
                                                </span>
                                            </td>
                                            <td className="text-ink/50 py-2.5 text-right">{r.ago ?? '-'}</td>
                                        </tr>
                                    );
                                })}
                                {recent.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-ink/50 py-6 text-center">
                                            Belum ada klaim.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>
                <Panel
                    title="Penukaran per mitra"
                    subtitle={`${current.label} · ${partnerWeek.partners} mitra · ${partnerWeek.vouchers} voucher · ${rupiah(partnerWeek.value)}`}
                >
                    {perPartner.length === 0 ? (
                        <p className="text-ink/50 py-6 text-center text-[12px]">Belum ada penukaran minggu lalu.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {perPartner.map((p, i) => (
                                <div key={p.name} className="grid grid-cols-[100px_1fr_24px] items-center gap-3 text-[11px]">
                                    <span className="truncate font-bold">{p.name}</span>
                                    <Bar value={p.count} max={partnerMax} color={i === 0 ? 'bg-lime' : 'bg-[#0b0b0b]'} />
                                    <span className="text-right font-extrabold tabular-nums">{p.count}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>
        </AdminLayout>
    );
}
