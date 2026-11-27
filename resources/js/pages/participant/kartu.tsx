import { LimePage } from '@/features/participant/components/lime-page';
import { RejectedCap } from '@/features/participant/components/ui';
import { type CapMark, capSlots, type Reward, STAR, useMysteryReady } from '@/features/participant/rewards';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import { Check, Crown, Gift, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

type Prize = 'golden_slot' | 'limited_edition' | null;
type LeaderRow = { rank: number; name: string; caps: number; prize: Prize; is_me: boolean };
type Position = { rank: number; caps: number; prize: Prize } | null;
type Tab = 'total' | 'weekly';

const prizeBadge: Record<Exclude<Prize, null>, { label: string; className: string }> = {
    golden_slot: { label: 'Golden hadiah', className: 'bg-lime text-ink' },
    limited_edition: { label: 'Limited edition', className: 'bg-[#e9e2bf] text-ink' },
};

/** Kartu cap hitam seperti desain: angka besar, sobekan tiket, 10 lingkaran cap, dan status mystery gift. */
function CapCard({
    caps,
    capTrail,
    mysteryAt,
    outlets,
    mysteryReady,
    won,
}: {
    caps: number;
    capTrail: CapMark[];
    won: boolean;
    mysteryAt: number;
    outlets: number;
    mysteryReady: boolean;
}) {
    const mysteryEnabled = usePage().props.mysteryEnabled as boolean | null;
    const slots = capSlots(capTrail, mysteryAt, 10, { won, enabled: mysteryEnabled !== false });
    return (
        <section className="bg-night text-cream relative overflow-hidden rounded-[28px] px-5 pt-5 pb-5 md:px-7">
            <span aria-hidden className="absolute -top-12 -right-10 size-40 rounded-full bg-white/[0.04]" />
            <span aria-hidden className="absolute -bottom-16 -left-14 size-36 rounded-full bg-white/[0.03]" />

            <div className="relative flex items-center justify-between gap-3">
                <p className="text-lime text-[11px] font-extrabold tracking-[0.22em] uppercase">Kartu cap</p>
                <p className="text-cream/60 text-[12px]">Berlaku di {outlets} warung</p>
            </div>
            <div className="relative mt-6 flex items-end justify-between gap-3">
                <p className="leading-none font-extrabold tracking-tight">
                    <span className="text-[64px] tabular-nums">
                        <CountUp to={Math.min(caps, 10)} />
                    </span>
                    <span className="text-cream/50 text-[30px]">/10</span>
                </p>
                <p className="text-cream/60 pb-2 text-[13px]">cap terkumpul</p>
            </div>

            {/* Sobekan tiket: garis putus-putus dengan lubang di kiri dan kanan. */}
            <div className="relative -mx-5 my-4 md:-mx-7">
                <span aria-hidden className="bg-cream absolute top-1/2 -left-2 size-4 -translate-y-1/2 rounded-full" />
                <span aria-hidden className="bg-cream absolute top-1/2 -right-2 size-4 -translate-y-1/2 rounded-full" />
                <div className="mx-5 border-t-2 border-dashed border-white/20 md:mx-7" />
            </div>

            <div className="relative grid grid-cols-5 justify-items-center gap-y-3">
                {Array.from({ length: 10 }, (_, i) => {
                    const number = i + 1;
                    const mark = slots.marks[i];
                    const isMystery = number === slots.giftAt;
                    if (isMystery && mark === 'cap') {
                        const circle = (
                            <span
                                className={cn(
                                    // Kado cap ke-5 selalu berdenyut hijau, sebelum maupun sesudah dibuka.
                                    'text-ink grid size-12 place-items-center rounded-full bg-white shadow-[0_0_18px_4px_rgba(143,195,31,0.65)] ring-4 ring-[#8fcf3a] motion-safe:animate-[gift-glow_1.8s_ease-in-out_infinite] md:size-14',
                                )}
                            >
                                <Gift className="size-5" />
                            </span>
                        );
                        return mysteryReady ? (
                            <Link key={number} href="/participant/mystery-gift" aria-label="Klaim mystery gift">
                                {circle}
                            </Link>
                        ) : (
                            <span key={number}>{circle}</span>
                        );
                    }
                    if (mark === 'rejected') {
                        return <RejectedCap key={number} number={number} className="size-12 text-[15px] md:size-14" />;
                    }
                    if (mark === 'cap') {
                        return (
                            // Pembungkus berdenyut hijau (cap-glow), isinya muncul satu per satu (cap-pop).
                            <span
                                key={number}
                                className="motion-safe:animate-[cap-glow_1.8s_ease-in-out_infinite]"
                                style={{ animationDelay: `${i * 180}ms` }}
                            >
                                <span
                                    className={cn(
                                        'bg-lime grid size-12 place-items-center motion-safe:animate-[cap-pop_.5s_ease-out_both] md:size-14',
                                        STAR,
                                    )}
                                    style={{ animationDelay: `${150 + i * 110}ms` }}
                                    aria-label={`Cap ${number}`}
                                >
                                    <span className="border-ink/70 grid size-8 place-items-center rounded-full border-2">
                                        <Check className="text-ink size-4" strokeWidth={3} />
                                    </span>
                                </span>
                            </span>
                        );
                    }
                    return (
                        <span
                            key={number}
                            className="text-cream/45 grid size-12 place-items-center rounded-full border-2 border-dashed border-white/25 text-[15px] font-extrabold md:size-14"
                        >
                            {isMystery ? <Gift className="size-5" /> : number}
                        </span>
                    );
                })}
            </div>

            <div className="relative mt-5">
                {mysteryReady ? (
                    <Link href="/participant/mystery-gift" className="flex flex-wrap items-center gap-2.5 text-[13px] font-semibold">
                        <span className="bg-lime text-ink rounded-full px-3 py-1.5 text-[12px] font-extrabold">Siap diklaim</span>
                        ketuk hadiah untuk klaim mystery gift
                    </Link>
                ) : (
                    <p className="text-cream/80 text-[13px] font-semibold">
                        {slots.caps < mysteryAt
                            ? `${mysteryAt - slots.caps} cap lagi buka mystery gift.`
                            : slots.used < 10
                              ? `${10 - slots.used} cap lagi kartu penuh.`
                              : 'Kartu penuh. Pembelian berikutnya tetap dihitung untuk peringkat.'}
                    </p>
                )}
                <p className="text-cream/40 mt-3 text-[12px]">1 pembelian = 1 cap</p>
            </div>
        </section>
    );
}

/** Angka cap naik dari 0 saat halaman dibuka; langsung angka akhir bila pengguna memilih kurangi gerakan. */
export function CountUp({ to }: { to: number }) {
    const [value, setValue] = useState(to);
    useEffect(() => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || to === 0) return;
        let frame = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / 900);
            setValue(Math.round(to * (1 - (1 - t) ** 3)));
            if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [to]);
    return <>{value}</>;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'md' | 'lg' }) {
    return (
        <span
            className={cn(
                'bg-[#0b0b0b] text-lime grid shrink-0 place-items-center rounded-full font-extrabold',
                size === 'lg' ? 'size-16 text-[24px] md:size-[72px]' : 'size-14 text-[20px]',
            )}
        >
            {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
    );
}

/** Podium tiga besar: juara 1 di tengah (bar lime tertinggi), juara 2 kiri, juara 3 kanan. */
function Podium({ rows }: { rows: LeaderRow[] }) {
    const order = [rows[1], rows[0], rows[2]];
    const blocks = [
        'border-[#c0c0c0] bg-[#0b0b0b] text-[#c0c0c0]',
        'border-transparent bg-lime text-ink',
        'border-[#e59b2f] bg-[#0b0b0b] text-[#e59b2f]',
    ];
    const heights = [92, 132, 76];
    // Urutan naik: juara 3, juara 2, juara 1 (kolom: juara 2, juara 1, juara 3).
    const bar = [
        'motion-safe:animate-[podium-loop-2_12s_ease-in-out_infinite]',
        'motion-safe:animate-[podium-loop-3_12s_ease-in-out_infinite]',
        'motion-safe:animate-[podium-loop-1_12s_ease-in-out_infinite]',
    ];
    const show = [
        'motion-safe:animate-[podium-show-2_12s_ease-in-out_infinite]',
        'motion-safe:animate-[podium-show-3_12s_ease-in-out_infinite]',
        'motion-safe:animate-[podium-show-1_12s_ease-in-out_infinite]',
    ];
    return (
        <div className="relative mt-5">
            <span
                aria-hidden
                className="pointer-events-none absolute inset-x-4 top-0 h-[270px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(143,195,31,0.5),transparent_68%)] blur-xl motion-safe:animate-[podium-glow_12s_ease-in-out_infinite]"
            />
            <div className="relative grid min-h-[290px] grid-cols-3 items-end gap-2 md:gap-4">
                {order.map((row, i) =>
                    row ? (
                        <div
                            key={row.rank}
                            className="flex min-w-0 flex-col items-center text-center"
                            style={{ '--h': `${heights[i]}px` } as React.CSSProperties}
                        >
                            {/* Avatar dan nama muncul dan hilang bersama bar; tinggi podium dikunci supaya bar tumbuh dari dasar ke atas. */}
                            <div className={cn('flex w-full flex-col items-center', show[i])}>
                                {i === 1 && <Crown className="mb-1 size-7 text-[#f5c542]" strokeWidth={2.5} />}
                                <Avatar name={row.name} size={i === 1 ? 'lg' : 'md'} />
                                <p className="mt-1.5 w-full truncate text-[15px] font-extrabold">{row.name.trim().split(/\s+/)[0]}</p>
                                <p className="mt-1 w-fit rounded-full bg-white px-2.5 py-0.5 text-[12px] font-bold shadow-sm">
                                    {row.caps} cap{row.is_me && ' · kamu'}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    'relative mt-2 grid h-(--h) w-full place-items-center overflow-hidden rounded-t-2xl border-t-4 text-[44px] leading-none font-extrabold md:text-[52px]',
                                    bar[i],
                                    blocks[i],
                                )}
                            >
                                {i === 1 && (
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_28%,rgba(255,255,255,0.42)_44%,transparent_60%)]"
                                    />
                                )}
                                <span className={show[i]}>{row.rank}</span>
                            </div>
                        </div>
                    ) : (
                        <span key={i} />
                    ),
                )}
            </div>
            <span aria-hidden className="bg-[#0b0b0b] absolute inset-x-0 bottom-0 h-2 rounded-full" />
        </div>
    );
}

export default function Kartu({
    caps = 0,
    capTrail = [],
    name,
    mysteryAt = 5,
    mystery = null,
    outlets = 0,
    leaderboard = { total: [], weekly: [] },
    me,
    whatsappGroup,
}: {
    caps?: number;
    capTrail?: CapMark[];
    name?: string | null;
    mysteryAt?: number;
    mystery?: Reward | null;
    outlets?: number;
    leaderboard?: Record<Tab, LeaderRow[]>;
    me?: Record<Tab, Position> | null;
    whatsappGroup?: string | null;
}) {
    const [tab, setTab] = useState<Tab>('total');
    // "Siap diklaim" sampai mystery gift dibuka lewat kartu gosok (penanda tersimpan di perangkat).
    const mysteryReady = useMysteryReady(mystery);
    const rows = leaderboard[tab] ?? [];
    const myPosition = me?.[tab] ?? null;
    const meInTop = rows.some((row) => row.is_me);

    return (
        <LimePage title="Leaderboard" tabTitle="Kartu dan peringkat" nav="kartu">
            {name && (
                <CapCard caps={caps} capTrail={capTrail} mysteryAt={mysteryAt} outlets={outlets} mysteryReady={mysteryReady} won={Boolean(mystery)} />
            )}

            <section className={cn(name && 'mt-6')}>
                <div className="flex items-center justify-between gap-3">
                    <h2 className="text-[24px] font-extrabold tracking-tight">Peringkat</h2>
                    <div className="flex gap-2">
                        {(
                            [
                                ['total', 'Total'],
                                ['weekly', 'Mingguan'],
                            ] as const
                        ).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setTab(key)}
                                aria-pressed={tab === key}
                                className={cn(
                                    'h-9 rounded-full px-4 text-[13px] font-extrabold transition-colors',
                                    tab === key ? 'bg-ink text-cream' : 'text-ink bg-white',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {rows.length > 0 && <Podium key={tab} rows={rows.slice(0, 3)} />}

                {rows.length > 3 && (
                    <div className="mt-4 rounded-3xl bg-white px-4 py-1">
                        {rows.slice(3).map((row, i) => (
                            <div
                                key={`${tab}-${row.rank}`}
                                style={{ animationDelay: `${600 + i * 90}ms` }}
                                className={cn(
                                    'flex items-center gap-3 py-3 motion-safe:animate-[rise-in_.45s_ease-out_both]',
                                    row.is_me ? 'bg-lime -mx-2 my-1 rounded-2xl px-2' : 'border-cream-deep border-b last:border-b-0',
                                )}
                            >
                                <span className="text-ink-soft w-6 shrink-0 text-[14px] font-bold tabular-nums">
                                    {String(row.rank).padStart(2, '0')}
                                </span>
                                <span className="bg-ink text-lime grid size-9 shrink-0 place-items-center rounded-full text-[15px] font-extrabold">
                                    {row.name.trim().charAt(0).toUpperCase() || '?'}
                                </span>
                                <p className="min-w-0 flex-1 truncate text-[16px] font-extrabold">{row.is_me ? `Kamu · ${row.name}` : row.name}</p>
                                {row.prize && (
                                    <span
                                        className={cn(
                                            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold',
                                            prizeBadge[row.prize].className,
                                        )}
                                    >
                                        {prizeBadge[row.prize].label}
                                    </span>
                                )}
                                <span className="shrink-0 text-right text-[16px] font-extrabold">{row.caps} cap</span>
                            </div>
                        ))}
                    </div>
                )}

                <div>
                    {/* Posisi peserta sendiri bila di luar 10 teratas. */}
                    {name && !meInTop && (
                        <div
                            key={`me-${tab}`}
                            className="bg-lime mt-4 flex items-center gap-3 rounded-2xl px-4 py-3.5 motion-safe:animate-[rise-in_.45s_ease-out_both] motion-safe:[animation-delay:700ms]"
                        >
                            <span className="bg-ink text-cream grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold">
                                {myPosition?.rank ?? '-'}
                            </span>
                            <p className="min-w-0 flex-1 truncate text-[17px] font-extrabold">Kamu · {name}</p>
                            <span className="text-[16px] font-extrabold">{myPosition?.caps ?? 0} cap</span>
                        </div>
                    )}

                    {rows.length === 0 && (
                        <p className="text-ink-soft rounded-2xl bg-white/60 p-4 text-center text-[12px]">
                            {tab === 'weekly' ? 'Belum ada klaim minggu ini.' : 'Belum ada klaim.'}
                        </p>
                    )}
                </div>

                <p className="text-ink-soft mt-3 text-[12px] leading-relaxed">
                    10 teratas dapat merchandise limited edition, 4 teratas dapat golden hadiah Laga Kosan. Urutan: cap terbanyak, lalu yang lebih dulu
                    mencapai jumlah itu.
                </p>
            </section>

            {whatsappGroup && (
                <a
                    href={whatsappGroup}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex items-center gap-3 rounded-3xl bg-white p-3.5 transition active:scale-[0.99]"
                >
                    <span className="bg-ink text-lime grid size-11 shrink-0 place-items-center rounded-full">
                        <MessageSquare className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-extrabold">Mau dapat update?</span>
                        <span className="text-ink-soft block text-[12px] leading-snug">Masuk grup WhatsApp untuk info hadiah dan acara</span>
                    </span>
                    <span className="bg-ink text-lime shrink-0 rounded-full px-4 py-2.5 text-[13px] font-extrabold">Masuk grup</span>
                </a>
            )}
        </LimePage>
    );
}
