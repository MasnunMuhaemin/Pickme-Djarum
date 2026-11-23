import { Badge, PageHeader } from '@/features/participant/components/ui';
import { rewards } from '@/features/participant/data';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { ChevronRight, Coffee, Fuel, Package, SlidersHorizontal, Zap } from 'lucide-react';
import { useState } from 'react';

const icons: Record<string, LucideIcon> = { coffee: Coffee, zap: Zap, package: Package, fuel: Fuel };
const filters = ['Semua', ...Array.from(new Set(rewards.map((r) => r.status)))];

export default function Hadiahku() {
    const [filterIndex, setFilterIndex] = useState(0);
    const filter = filters[filterIndex];
    const shown = filter === 'Semua' ? rewards : rewards.filter((r) => r.status === filter);

    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader title="Hadiahku" right={<Badge>Kartu 4 / 10</Badge>} />
            <div className="flex-1 px-4 pb-6 lg:px-8 lg:pt-2 lg:pb-10">
                <div className="flex items-center justify-between">
                    <p className="text-[13px] font-extrabold">4 hadiah di kartu saya</p>
                    <button
                        onClick={() => setFilterIndex((i) => (i + 1) % filters.length)}
                        className="border-ink/15 flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                    >
                        <SlidersHorizontal className="size-3" />
                        {filter}
                    </button>
                </div>

                <div className="mt-3 space-y-2 xl:grid xl:grid-cols-2 xl:gap-2 xl:space-y-0">
                    {shown.map((reward) => {
                        const Icon = icons[reward.icon];
                        return (
                            <div key={reward.title} className="border-ink/10 bg-cream-soft rounded-2xl border p-3">
                                <div className="flex items-center gap-3">
                                    <span className="bg-cream-deep grid size-10 shrink-0 place-items-center rounded-xl">
                                        <Icon className="text-ink size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[12px] font-extrabold">{reward.title}</p>
                                        <p className="text-ink-soft truncate text-[10px]">{reward.text}</p>
                                    </div>
                                    <Badge tone={reward.tone}>{reward.status}</Badge>
                                </div>
                                {reward.actionHref ? (
                                    <Link
                                        href={reward.actionHref}
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
                </div>

                <div className="bg-cream-deep/70 text-ink-soft mt-4 rounded-2xl p-3 text-[10px] leading-relaxed">
                    Hadiah aktif setelah klaim disetujui. Cek status di halaman ini.
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
