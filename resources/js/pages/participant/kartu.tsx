import { Badge, PageHeader } from '@/features/participant/components/ui';
import { leaderboard } from '@/features/participant/data';
import ParticipantLayout from '@/layouts/participant-layout';
import { cn } from '@/lib/utils';
import { Check, MessageCircle } from 'lucide-react';
import { useState } from 'react';

export default function Kartu() {
    const [tab, setTab] = useState<'mingguan' | 'bulanan'>('mingguan');
    const [following, setFollowing] = useState(false);

    return (
        <ParticipantLayout nav="kartu">
            <PageHeader title="Kartu dan peringkat" close="/participant" right={<Badge>4 / 10</Badge>} />
            <div className="flex-1 px-4 pb-6 lg:px-8 lg:pt-2 lg:pb-10">
                <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-6">
                    <div className="bg-lime text-ink rounded-3xl p-4 lg:p-6">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-ink/60 text-[10px] font-bold tracking-widest uppercase">Kartu cap</p>
                                <p className="text-3xl font-extrabold tracking-tight">4 / 10</p>
                            </div>
                            <p className="text-ink/70 pb-1 text-[10px] font-semibold">Reset tiap Senin</p>
                        </div>

                        <div className="mt-4 grid grid-cols-5 gap-2">
                            {Array.from({ length: 10 }, (_, i) => (
                                <span
                                    key={i}
                                    className={cn(
                                        'grid aspect-square place-items-center rounded-full text-[10px] font-bold',
                                        i < 4 ? 'bg-ink text-lime' : 'border-ink/25 bg-cream/40 text-ink/50 border',
                                    )}
                                >
                                    {i < 4 ? <Check className="size-3.5" /> : i + 1}
                                </span>
                            ))}
                        </div>

                        <div className="mt-4">
                            <div className="bg-ink/15 h-1.5 overflow-hidden rounded-full">
                                <div className="bg-ink h-full w-[40%] rounded-full" />
                            </div>
                            <p className="mt-1.5 text-[10px] font-semibold">1 cap lagi buka mystery gift di cap ke-5.</p>
                        </div>
                    </div>

                    <div className="mt-4 lg:mt-0">
                        <div className="bg-cream-deep flex rounded-full p-1">
                            {(['mingguan', 'bulanan'] as const).map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setTab(item)}
                                    className={cn(
                                        'flex-1 rounded-full py-2 text-[11px] font-bold capitalize',
                                        tab === item ? 'bg-ink text-cream' : 'text-ink-soft',
                                    )}
                                >
                                    {item}
                                </button>
                            ))}
                        </div>

                        <div className="mt-3 space-y-1.5">
                            {leaderboard.map((row) => (
                                <div key={row.rank} className="bg-cream-soft flex items-center gap-3 rounded-xl px-3 py-2.5">
                                    <span
                                        className={cn(
                                            'grid size-7 place-items-center rounded-full text-[11px] font-extrabold',
                                            row.rank === 1 ? 'bg-lime text-ink' : 'bg-cream-deep text-ink-soft',
                                        )}
                                    >
                                        {row.rank}
                                    </span>
                                    <p className="flex-1 text-[12px] font-bold">{row.name}</p>
                                    {row.rank === 5 && <span className="bg-lime rounded-full px-2 py-0.5 text-[9px] font-bold">Kamu</span>}
                                    <span className="text-ink-soft text-[11px] font-semibold">{row.caps} cap</span>
                                </div>
                            ))}
                        </div>

                        <p className="text-ink-soft mt-3 text-[10px] leading-relaxed">
                            10 hadiah mingguan. Peringkat dihitung dari jumlah cap yang sah.
                        </p>

                        <div className="border-ink/10 bg-cream-soft mt-4 flex items-center gap-3 rounded-2xl border p-3">
                            <span className="bg-lime-soft grid size-9 place-items-center rounded-full">
                                <MessageCircle className="size-4" />
                            </span>
                            <div className="flex-1">
                                <p className="text-[11px] font-extrabold">Mau dapat update?</p>
                                <p className="text-ink-soft text-[10px]">Ikuti WhatsApp Channel.</p>
                            </div>
                            <button
                                onClick={() => setFollowing(true)}
                                className={cn('rounded-full px-3 py-1.5 text-[10px] font-bold', following ? 'bg-lime text-ink' : 'bg-ink text-cream')}
                            >
                                {following ? 'Mengikuti' : 'Ikuti'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </ParticipantLayout>
    );
}
