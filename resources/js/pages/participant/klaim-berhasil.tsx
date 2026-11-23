import { Badge, OutlineButton, PageHeader, PrimaryButton, ProgressDots } from '@/features/participant/components/ui';
import { claimVariants, type ClaimVariant } from '@/features/participant/data';
import ParticipantLayout from '@/layouts/participant-layout';
import type { LucideIcon } from 'lucide-react';
import { Check, Coffee, Fuel, Package, Zap } from 'lucide-react';

const icons: Record<string, LucideIcon> = { coffee: Coffee, zap: Zap, package: Package, fuel: Fuel };

export default function KlaimBerhasil({ variant = 'voucher' }: { variant?: ClaimVariant }) {
    const data = claimVariants[variant] ?? claimVariants.voucher;
    const Icon = icons[data.icon];

    return (
        <ParticipantLayout nav="hadiah" hideBottomNav>
            <PageHeader close="/participant/hadiah" title="Klaim berhasil" right={<Badge>Kartu 4 / 10</Badge>} />
            <div className="flex-1 px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[820px] lg:px-8 lg:pt-2 lg:pb-10">
                <div className="bg-lime flex items-center gap-2 rounded-2xl px-3 py-2.5 lg:px-4 lg:py-3">
                    <span className="bg-ink text-lime grid size-7 place-items-center rounded-full">
                        <Check className="size-4" />
                    </span>
                    <div>
                        <p className="text-[12px] font-extrabold">Klaim berhasil</p>
                        <p className="text-ink/70 text-[10px]">Kartu cap kamu bertambah.</p>
                    </div>
                    <span className="bg-cream/60 ml-auto rounded-full px-2 py-1 text-[10px] font-bold">4 / 10</span>
                </div>

                <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
                    <div className="border-ink/10 bg-cream-soft overflow-hidden rounded-2xl border">
                        <div className="bg-cream-deep relative grid h-32 place-items-center lg:h-40">
                            <Icon className="text-ink/70 size-10" />
                            <span className="bg-cream/80 absolute top-2 right-2 rounded-full px-2 py-1 text-[10px] font-bold">{data.value}</span>
                        </div>
                        <div className="p-4">
                            <p className="text-[14px] font-extrabold">{data.title}</p>
                            <div className="mt-3 space-y-2">
                                {data.rows.map((row) => (
                                    <div key={row.label} className="flex items-center justify-between gap-3 text-[11px]">
                                        <span className="text-ink-soft">{row.label}</span>
                                        <span className="text-right font-bold">{row.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mt-5 lg:mt-0">
                            <p className="text-[11px] font-bold">Kartu cap</p>
                            <div className="mt-2 overflow-x-auto">
                                <ProgressDots value={4} />
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <PrimaryButton href={data.href}>{data.cta}</PrimaryButton>
                            <OutlineButton href="/participant/hadiah">{data.second ?? 'Kembali ke papan'}</OutlineButton>
                        </div>
                    </div>
                </div>
            </div>
        </ParticipantLayout>
    );
}
