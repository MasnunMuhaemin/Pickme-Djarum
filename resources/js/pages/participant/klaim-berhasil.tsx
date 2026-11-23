import { Badge, OutlineButton, PageHeader, PrimaryButton, ProgressDots, Sheet } from '@/features/participant/components/ui';
import { type Reward, rewardIcons, rewardStub, rewardToneClass } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Check, Gift, Sparkles } from 'lucide-react';
import { useState } from 'react';

type ClaimInfo = { claim_code: string; outlet: string; submitted_at?: string | null };

/** P7: hasil klaim. Jenis dan nilai diisi dari data hadiah yang terbentuk (PRD bagian 11). */
export default function KlaimBerhasil({
    reward,
    mystery,
    claim,
    caps = 0,
}: {
    reward: Reward | null;
    /** Mystery gift yang terbuka karena klaim ini (cap ke-5). */
    mystery?: Reward | null;
    claim: ClaimInfo;
    caps?: number;
}) {
    const [mysteryOpen, setMysteryOpen] = useState(Boolean(mystery));
    const Icon = reward ? (rewardIcons[reward.kind] ?? Gift) : Gift;
    const stub = rewardStub(reward?.kind ?? 'merch');

    return (
        <ParticipantLayout title="Klaim berhasil" nav="hadiah" hideBottomNav>
            <PageHeader close="/participant/hadiah" title="Klaim berhasil" right={<Badge>Kartu {caps} / 10</Badge>} />
            <div className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[820px] md:px-8 md:pt-2 md:pb-10">
                <div className="bg-lime flex items-center gap-2 rounded-2xl px-3 py-2.5 md:px-4 md:py-3">
                    <span className="bg-ink text-lime grid size-7 place-items-center rounded-full">
                        <Check className="size-4" />
                    </span>
                    <div>
                        <p className="text-[12px] font-extrabold">Klaim berhasil</p>
                        <p className="text-ink/70 text-[10px]">Kartu cap kamu bertambah.</p>
                    </div>
                    <span className="bg-cream/60 ml-auto rounded-full px-2 py-1 text-[10px] font-bold">{caps} / 10</span>
                </div>

                {/* Pemberitahuan mystery gift tetap terlihat setelah popup ditutup. */}
                {mystery && (
                    <Link
                        href={mystery.href ?? '/participant/hadiah'}
                        className="bg-ink text-cream mt-3 flex items-center gap-3 rounded-2xl p-3.5 transition active:scale-[0.99]"
                    >
                        <span className="bg-lime text-ink grid size-11 shrink-0 place-items-center rounded-full">
                            <Gift className="size-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="text-lime block text-[11px] font-extrabold tracking-widest uppercase">Cap ke-5 terbuka</span>
                            <span className="block truncate text-[14px] font-extrabold">{mystery.title}</span>
                            <span className="text-cream/70 block text-[12px]">{mystery.status_label}</span>
                        </span>
                        <span className="text-lime shrink-0 text-[12px] font-extrabold underline underline-offset-2">Lihat</span>
                    </Link>
                )}

                <div className="mt-4 md:grid md:grid-cols-[minmax(0,1fr)_300px] md:items-start md:gap-6">
                    <div className="border-ink/10 overflow-hidden rounded-2xl border bg-white">
                        <div className={cn('relative grid h-32 place-items-center md:h-40', stub.bg)}>
                            <Icon className={cn('size-10', stub.icon)} />
                            {reward?.value && (
                                <span className="text-ink absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold">
                                    {reward.value}
                                </span>
                            )}
                        </div>
                        <div className="p-4">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-[14px] font-extrabold">{reward?.title ?? 'Hadiah'}</p>
                                {reward && (
                                    <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold', rewardToneClass[reward.tone])}>
                                        {reward.status_label}
                                    </span>
                                )}
                            </div>
                            {reward && <p className="text-ink-soft mt-1 text-[12px]">{reward.description}</p>}
                            <div className="divide-ink/8 mt-3 divide-y text-[11px]">
                                <div className="flex justify-between py-2">
                                    <span className="text-ink-soft">Kode klaim</span>
                                    <span className="font-mono font-bold">{claim.claim_code}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-ink-soft">Titik</span>
                                    <span className="font-bold">{claim.outlet}</span>
                                </div>
                                {claim.submitted_at && (
                                    <div className="flex justify-between py-2">
                                        <span className="text-ink-soft">Waktu</span>
                                        <span className="font-bold">{claim.submitted_at}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mt-5 md:mt-0">
                            <p className="text-[11px] font-bold">Kartu cap</p>
                            <div className="mt-2 overflow-x-auto">
                                <ProgressDots value={Math.min(caps, 10)} />
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            {reward?.href && reward.action ? (
                                <PrimaryButton href={reward.href}>{reward.action}</PrimaryButton>
                            ) : (
                                <PrimaryButton href="/participant/hadiah">Lihat Hadiahku</PrimaryButton>
                            )}
                            <OutlineButton href="/participant/hadiah">{reward?.href ? 'Lihat Hadiahku' : 'Kembali ke Hadiahku'}</OutlineButton>
                        </div>
                    </div>
                </div>
            </div>
            {mystery && (
                <Sheet open={mysteryOpen} onClose={() => setMysteryOpen(false)}>
                    <div className="py-2 text-center">
                        <span className="bg-lime text-ink relative mx-auto grid size-20 place-items-center rounded-full">
                            <Gift className="size-9" />
                            <Sparkles className="text-ink absolute -top-1 -right-1 size-6" />
                        </span>
                        <p className="text-ink-soft mt-4 text-[11px] font-extrabold tracking-widest uppercase">Selamat, cap ke-5!</p>
                        <h2 className="mt-1 text-[22px] leading-tight font-extrabold tracking-tight">Kamu dapat mystery gift</h2>
                        <p className="mt-3 text-[15px] font-extrabold">{mystery.title.replace(/^Mystery gift:\s*/, '')}</p>
                        <p className="text-ink-soft mt-1 text-[12px] leading-relaxed">{mystery.description}</p>
                    </div>
                    <div className="mt-5 space-y-2">
                        <PrimaryButton href={mystery.href ?? '/participant/hadiah'}>{mystery.action ?? 'Lihat di Hadiahku'}</PrimaryButton>
                        <button type="button" onClick={() => setMysteryOpen(false)} className="text-ink-soft w-full py-2 text-[12px] font-bold">
                            Nanti saja
                        </button>
                    </div>
                </Sheet>
            )}
        </ParticipantLayout>
    );
}
