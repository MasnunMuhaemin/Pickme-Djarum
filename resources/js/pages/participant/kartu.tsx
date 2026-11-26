import { LimePage } from '@/features/participant/components/lime-page';
import { type Reward, STAR, useMysteryReady } from '@/features/participant/rewards';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Check, Crown, Gift, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';

type Prize = 'golden_slot' | 'limited_edition' | null;
type LeaderRow = { rank: number; name: string; caps: number; prize: Prize; is_me: boolean };
type Position = { rank: number; caps: number; prize: Prize } | null;
type Tab = 'total' | 'weekly';

const prizeBadge: Record<Exclude<Prize, null>, { label: string; className: string }> = {
    golden_slot: { label: 'Golden slot', className: 'bg-lime text-ink' },
    limited_edition: { label: 'Limited edition', className: 'bg-[#e9e2bf] text-ink' },
};

/** Kartu cap hitam seperti desain: angka besar, sobekan tiket, 10 lingkaran cap, dan status mystery gift. */
function CapCard({ caps, mysteryAt, outlets, mysteryReady }: { caps: number; mysteryAt: number; outlets: number; mysteryReady: boolean }) {
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
                    const isMystery = number === mysteryAt;
                    const filled = number <= caps;
                    if (isMystery && caps >= mysteryAt) {
                        const circle = (
                            <span
                                className={cn(
                                    'text-ink grid size-12 place-items-center rounded-full bg-white ring-4 ring-[#8fcf3a] md:size-14',
                                    mysteryReady &&
                                        'shadow-[0_0_18px_4px_rgba(169,214,91,0.65)] motion-safe:animate-[gift-glow_1.8s_ease-in-out_infinite]',
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
                    if (filled) {
                        return (
                            <span
                                key={number}
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
                        {caps < mysteryAt
                            ? `${mysteryAt - caps} cap lagi buka mystery gift di cap ke-${mysteryAt}.`
                            : caps < 10
                              ? `${10 - caps} cap lagi kartu penuh.`
                              : 'Kartu penuh. Pembelian berikutnya tetap dihitung untuk peringkat.'}
                    </p>
                )}
                <p className="text-cream/40 mt-3 text-[12px]">1 pembelian = 1 cap</p>
            </div>
        </section>
    );
}

/** Angka cap naik dari 0 saat halaman dibuka; langsung angka akhir bila pengguna memilih kurangi gerakan. */
function CountUp({ to }: { to: number }) {
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
                'bg-ink text-lime grid shrink-0 place-items-center rounded-full font-extrabold',
                size === 'lg' ? 'size-16 text-[24px] md:size-[72px]' : 'size-14 text-[20px]',
            )}
        >
            {name.trim().charAt(0).toUpperCase() || '?'}
        </span>
    );
}

/** Podium tiga besar: juara 1 di tengah (blok lime tertinggi), juara 2 kiri, juara 3 kanan. */
function Podium({ rows }: { rows: LeaderRow[] }) {
    const order = [rows[1], rows[0], rows[2]];
    const blocks = ['h-16 bg-ink text-cream', 'h-24 bg-lime text-ink', 'h-12 bg-ink text-cream'];
    return (
        <div className="mt-6 grid grid-cols-3 items-end gap-3">
            {order.map((row, i) =>
                row ? (
                    <div
                        key={row.rank}
                        className="flex min-w-0 flex-col items-center text-center motion-safe:animate-[rise-in_.5s_ease-out_both]"
                        style={{ animationDelay: `${[250, 0, 450][i]}ms` }}
                    >
                        {i === 1 && <Crown className="text-ink mb-1 size-6" strokeWidth={2.25} />}
                        <Avatar name={row.name} size={i === 1 ? 'lg' : 'md'} />
                        <p className="mt-2 w-full truncate text-[15px] font-extrabold">{row.name}</p>
                        <p className="text-ink-soft text-[13px] font-bold">
                            {row.caps} cap{row.is_me && ' · kamu'}
                        </p>
                        <div
                            className={cn(
                                'mt-2 grid w-full origin-bottom place-items-center rounded-t-2xl text-[22px] font-extrabold motion-safe:animate-[podium-rise_.6s_cubic-bezier(.2,.8,.3,1.2)_both]',
                                blocks[i],
                            )}
                            style={{ animationDelay: `${[250, 0, 450][i] + 150}ms` }}
                        >
                            {row.rank}
                        </div>
                    </div>
                ) : (
                    <span key={i} />
                ),
            )}
        </div>
    );
}

export default function Kartu({
    caps = 0,
    name,
    mysteryAt = 5,
    mystery = null,
    outlets = 0,
    leaderboard = { total: [], weekly: [] },
    me,
    whatsappGroup,
}: {
    caps?: number;
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
            {name && <CapCard caps={caps} mysteryAt={mysteryAt} outlets={outlets} mysteryReady={mysteryReady} />}

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

                <div className="mt-4">
                    {rows.slice(3).map((row, i) => (
                        <div
                            key={`${tab}-${row.rank}`}
                            style={{ animationDelay: `${600 + i * 90}ms` }}
                            className={cn(
                                'flex items-center gap-3 py-2.5 motion-safe:animate-[rise-in_.45s_ease-out_both]',
                                row.is_me ? 'bg-lime -mx-2 my-1 rounded-2xl px-2' : 'border-b border-[#e8e1c4]',
                            )}
                        >
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-[13px] font-extrabold">
                                {row.rank}
                            </span>
                            <p className="min-w-0 flex-1 truncate text-[15px] font-extrabold">{row.is_me ? `Kamu · ${row.name}` : row.name}</p>
                            {row.prize && (
                                <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-extrabold', prizeBadge[row.prize].className)}>
                                    {prizeBadge[row.prize].label}
                                </span>
                            )}
                            <span className="w-14 shrink-0 text-right text-[14px] font-extrabold">{row.caps} cap</span>
                        </div>
                    ))}

                    {/* Posisi peserta sendiri bila di luar 10 teratas. */}
                    {name && !meInTop && (
                        <div
                            key={`me-${tab}`}
                            className="bg-lime mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5 motion-safe:animate-[rise-in_.45s_ease-out_both] motion-safe:[animation-delay:700ms]"
                        >
                            <span className="bg-ink text-lime grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold">
                                {myPosition?.rank ?? '-'}
                            </span>
                            <p className="min-w-0 flex-1 truncate text-[15px] font-extrabold">Kamu · {name}</p>
                            <span className="text-[14px] font-extrabold">{myPosition?.caps ?? 0} cap</span>
                        </div>
                    )}

                    {rows.length === 0 && (
                        <p className="text-ink-soft rounded-2xl bg-white/60 p-4 text-center text-[12px]">
                            {tab === 'weekly' ? 'Belum ada klaim minggu ini.' : 'Belum ada klaim.'}
                        </p>
                    )}
                </div>

                <p className="text-ink-soft mt-3 text-[12px] leading-relaxed">
                    10 teratas dapat merchandise limited edition, 4 teratas dapat golden slot Laga Kosan. Urutan: cap terbanyak, lalu yang lebih dulu
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
