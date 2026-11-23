import { Badge, PageHeader } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useCaps } from '@/lib/participant';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Coffee, Fuel, Gift as GiftIcon, Package, SlidersHorizontal, Zap } from 'lucide-react';
import { useState } from 'react';

type Reward = {
    id: number;
    kind: string;
    title: string;
    status: string;
    code: string | null;
    action: string | null;
    href: string | null;
};

const icons: Record<string, LucideIcon> = { voucher: Coffee, token: Zap, merch: Package, bensin: Fuel, gift: GiftIcon };
const tone = (status: string) => (status === 'sent' || status === 'ready_to_ship' ? 'lime' : 'amber');

export default function Hadiahku({ rewards = [] }: { rewards?: Reward[] }) {
    const caps = useCaps();
    const [showAll, setShowAll] = useState(true);
    const shown = showAll ? rewards : rewards.filter((r) => r.action);

    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader title="Hadiahku" right={<Badge>Kartu {caps} / 10</Badge>} />
            <div className="flex-1 px-4 pb-6 md:px-8 md:pt-2 md:pb-10">
                <div className="flex items-center justify-between">
                    <p className="text-[13px] font-extrabold">{rewards.length} hadiah di kartu saya</p>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="border-ink/15 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                    >
                        <SlidersHorizontal className="size-3" />
                        {showAll ? 'Semua' : 'Perlu aksi'}
                    </button>
                </div>

                <div className="mt-3 space-y-2 xl:grid xl:grid-cols-2 xl:gap-2 xl:space-y-0">
                    {shown.map((reward) => {
                        const Icon = icons[reward.kind] ?? Package;
                        return (
                            <div key={`${reward.kind}-${reward.id}`} className="border-ink/10 bg-cream-soft rounded-2xl border p-3">
                                <div className="flex items-center gap-3">
                                    <span className="bg-cream-deep grid size-10 shrink-0 place-items-center rounded-xl">
                                        <Icon className="text-ink size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12px] font-extrabold">{reward.title}</p>
                                        <p className="text-ink-soft truncate text-[10px]">{reward.status.replaceAll('_', ' ')}</p>
                                    </div>
                                    <Badge tone={tone(reward.status)}>{reward.status.replaceAll('_', ' ')}</Badge>
                                </div>
                                {reward.href ? (
                                    <Link
                                        href={reward.href}
                                        className="border-ink/15 mt-3 flex h-9 items-center justify-center gap-1 rounded-full border text-[11px] font-bold"
                                    >
                                        {reward.action}
                                        <ChevronRight className="size-3.5" />
                                    </Link>
                                ) : (
                                    <p className="text-ink-soft mt-3 text-center text-[10px]">Tidak ada aksi. Admin akan menghubungi kamu.</p>
                                )}
                            </div>
                        );
                    })}
                    {shown.length === 0 && (
                        <p className="text-ink-soft col-span-full rounded-2xl bg-white/50 p-4 text-center text-[11px]">
                            Belum ada hadiah. Selesaikan klaim dulu.
                        </p>
                    )}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-semibold">
                    <Link href="/participant/klaim/diperiksa" className="border-ink/20 rounded-full border px-2.5 py-1">
                        Sedang diperiksa
                    </Link>
                    <Link href="/participant/klaim/ditolak" className="border-ink/20 rounded-full border px-2.5 py-1">
                        Klaim ditolak
                    </Link>
                </div>
            </div>
        </ParticipantLayout>
    );
}
