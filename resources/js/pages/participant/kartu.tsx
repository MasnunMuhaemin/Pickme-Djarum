import { HeaderPill, LimePage } from '@/features/participant/components/lime-page';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Check, Gift, MessageSquare } from 'lucide-react';
import { useState } from 'react';

type Prize = 'golden_slot' | 'limited_edition' | null;
type LeaderRow = { rank: number; name: string; caps: number; prize: Prize; is_me: boolean };
type Position = { rank: number; caps: number; prize: Prize } | null;
type Tab = 'total' | 'weekly';

const prizeBadge: Record<Exclude<Prize, null>, { label: string; className: string }> = {
    golden_slot: { label: 'Golden slot', className: 'bg-lime text-ink' },
    limited_edition: { label: 'Limited edition', className: 'bg-[#e9e2bf] text-ink' },
};

function capsHint(caps: number, mysteryAt: number): string {
    if (caps < mysteryAt) return `${mysteryAt - caps} cap lagi buka mystery gift di cap ke-${mysteryAt}.`;
    if (caps < 10) return `Mystery gift sudah terbuka. ${10 - caps} cap lagi kartu penuh.`;
    return 'Kartu penuh. Pembelian berikutnya tetap dihitung untuk peringkat.';
}

/** Kartu 10 cap: cap terkumpul hitam bercentang, cap mystery gift lime dengan ikon hadiah. */
function CapCard({ caps, mysteryAt }: { caps: number; mysteryAt: number }) {
    return (
        <section>
            <div className="flex items-end justify-between">
                <p className="text-[56px] leading-none font-extrabold tracking-tight md:text-[64px]">{Math.min(caps, 10)} / 10</p>
                <p className="text-ink-soft pb-1 text-[13px]">cap terkumpul</p>
            </div>
            <div className="mt-4 grid grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }, (_, i) => {
                    const number = i + 1;
                    const filled = number <= caps;
                    const mystery = number === mysteryAt;
                    return (
                        <span
                            key={number}
                            className={cn(
                                'grid h-11 place-items-center rounded-full text-[13px] font-extrabold md:h-12',
                                filled
                                    ? 'bg-ink text-lime'
                                    : mystery
                                      ? 'bg-lime text-ink ring-ink ring-2 ring-inset'
                                      : 'text-ink-soft/60 bg-[#ece4c4]',
                            )}
                        >
                            {mystery ? <Gift className="size-5" /> : filled ? <Check className="size-5" strokeWidth={2.75} /> : number}
                        </span>
                    );
                })}
            </div>
            <p className="text-ink-soft mt-3 text-[13px] font-semibold">
                {capsHint(caps, mysteryAt)}
                {caps >= mysteryAt && (
                    <>
                        {' '}
                        <Link href="/participant/hadiah" className="text-ink underline underline-offset-2">
                            Lihat mystery gift
                        </Link>
                    </>
                )}
            </p>
        </section>
    );
}

function RankCircle({ rank, dark }: { rank: number; dark?: boolean }) {
    return (
        <span
            className={cn('grid size-9 shrink-0 place-items-center rounded-full text-[13px] font-extrabold', dark ? 'bg-ink text-lime' : 'bg-white')}
        >
            {rank}
        </span>
    );
}

export default function Kartu({
    caps = 0,
    name,
    mysteryAt = 5,
    leaderboard = { total: [], weekly: [] },
    me,
    whatsappGroup,
}: {
    caps?: number;
    name?: string | null;
    mysteryAt?: number;
    leaderboard?: Record<Tab, LeaderRow[]>;
    me?: Record<Tab, Position> | null;
    whatsappGroup?: string | null;
}) {
    const [tab, setTab] = useState<Tab>('total');
    const rows = leaderboard[tab] ?? [];
    const myPosition = me?.[tab] ?? null;
    const meInTop = rows.some((row) => row.is_me);

    return (
        <LimePage title="Kartu dan peringkat" nav="kartu" right={name ? <HeaderPill>Kartu cap {name}</HeaderPill> : undefined}>
            {name && <CapCard caps={caps} mysteryAt={mysteryAt} />}

            <section className={cn(name && 'mt-6')}>
                <h2 className="text-[18px] font-extrabold tracking-tight">Peringkat</h2>
                <div className="mt-3 flex gap-2">
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
                                'h-10 rounded-full px-5 text-[14px] font-extrabold transition-colors',
                                tab === key ? 'bg-ink text-lime' : 'text-ink-soft bg-white',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <div className="mt-3">
                    {rows.map((row) => (
                        <div
                            key={row.rank}
                            className={cn(
                                'flex items-center gap-3 py-2.5',
                                row.is_me ? 'bg-lime -mx-2 my-1 rounded-2xl px-2' : 'border-b border-[#e8e1c4]',
                            )}
                        >
                            <RankCircle rank={row.rank} dark={row.is_me} />
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
                        <div className="bg-lime mt-2 flex items-center gap-3 rounded-2xl px-3 py-2.5">
                            <RankCircle rank={myPosition?.rank ?? 0} dark />
                            <p className="min-w-0 flex-1 truncate text-[15px] font-extrabold">Kamu · {name}</p>
                            <span className="text-[14px] font-extrabold">{myPosition?.caps ?? 0} cap</span>
                        </div>
                    )}

                    {rows.length === 0 && (
                        <p className="text-ink-soft rounded-2xl bg-white/60 p-4 text-center text-[12px]">
                            {tab === 'weekly' ? 'Belum ada klaim disetujui minggu ini.' : 'Belum ada klaim disetujui.'}
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
