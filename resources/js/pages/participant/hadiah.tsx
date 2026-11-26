import { FollowUpNotice } from '@/features/participant/components/follow-up-notice';
import { limeLogoutClass } from '@/features/participant/components/lime-page';
import { LogoutButton } from '@/features/participant/components/ui';
import { voucherImage } from '@/features/participant/components/voucher-art';
import { type Reward, rewardIcons, rewardStub, rewardToneClass } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Gift } from 'lucide-react';

function RewardTicket({ reward }: { reward: Reward }) {
    const Icon = rewardIcons[reward.kind] ?? Gift;
    const stub = rewardStub(reward.kind);
    const className = cn(
        'flex min-h-[84px] md:min-h-[96px]',
        reward.href && 'focus-visible:ring-ink rounded-2xl transition-transform outline-none focus-visible:ring-2 active:scale-[0.98]',
    );

    // Seluruh kartu bisa diketuk kalau ada tujuan (Lihat kode, Isi alamat, dst.), bukan hanya teks aksinya.
    if (reward.href) {
        return (
            <Link href={reward.href} aria-label={`${reward.title}: ${reward.action ?? 'buka'}`} className={className}>
                <TicketBody reward={reward} Icon={Icon} stub={stub} />
            </Link>
        );
    }
    return (
        <div className={className}>
            <TicketBody reward={reward} Icon={Icon} stub={stub} />
        </div>
    );
}

function TicketBody({ reward, Icon, stub }: { reward: Reward; Icon: LucideIcon; stub: ReturnType<typeof rewardStub> }) {
    return (
        <>
            {/* Sobekan tiket kiri */}
            {reward.kind === 'voucher' && reward.code ? (
                <div className="relative w-[84px] shrink-0 overflow-hidden rounded-l-2xl md:w-[96px]">
                    <img src={voucherImage(reward.code)} alt="" aria-hidden className="absolute inset-0 size-full object-cover" loading="lazy" />
                    {/* Lapisan gelap supaya gambar tampak lebih elegan dan teks di sebelahnya menonjol. */}
                    <span aria-hidden className="absolute inset-0 bg-black/40" />
                </div>
            ) : (
                <div className={cn('grid w-[84px] shrink-0 place-items-center rounded-l-2xl md:w-[96px]', stub.bg)}>
                    <Icon className={cn('size-7', stub.icon)} strokeWidth={2} />
                </div>
            )}

            {/* Badan tiket, dipisah garis putus-putus dengan lubang di atas dan bawah */}
            <div className="relative min-w-0 flex-1 rounded-r-2xl border-l-2 border-dashed border-[#e8e1c4] bg-white px-3.5 py-3 md:px-5 md:py-4">
                <span className="bg-cream absolute -top-2 -left-[9px] size-4 rounded-full" aria-hidden />
                <span className="bg-cream absolute -bottom-2 -left-[9px] size-4 rounded-full" aria-hidden />

                <div className="flex items-start justify-between gap-2">
                    <p className="min-w-0 pt-0.5 text-[15px] leading-tight font-extrabold tracking-tight md:text-[17px]">{reward.title}</p>
                    <span
                        className={cn(
                            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap md:text-xs',
                            rewardToneClass[reward.tone],
                        )}
                    >
                        {reward.status_label}
                    </span>
                </div>
                <p className="text-ink-soft mt-1 text-[12px] leading-snug md:text-[13px]">{reward.description}</p>
                {reward.href && reward.action && (
                    <span className="mt-1 inline-block text-[12px] font-extrabold underline underline-offset-2 md:text-[13px]">{reward.action}</span>
                )}
            </div>
        </>
    );
}

export default function Hadiahku({ rewards = [], approvedClaims = 0 }: { rewards?: Reward[]; approvedClaims?: number }) {
    const caps = useCaps();
    // Kartu klaim (ditangguhkan atau ditolak) bukan hadiah, jadi tidak ikut dihitung.
    const rewardCount = rewards.filter((reward) => !reward.kind.startsWith('claim_')).length;
    const followUps = rewards.filter((reward) => reward.follow_up && reward.href);

    return (
        <ParticipantLayout title="Hadiahku" nav="hadiah">
            <div className="lime-hero px-5 pt-4 pb-14 md:px-8 md:pt-6">
                <div className="flex items-center justify-end gap-2">
                    <span className="bg-ink text-cream rounded-full px-3.5 py-1.5 text-[12px] font-extrabold">Cap {caps} / 10</span>
                    <LogoutButton className={limeLogoutClass} />
                </div>
                <h1 className="mt-2 text-[36px] leading-none font-extrabold tracking-tight md:text-[44px]">Hadiahku</h1>
                <p className="mt-2 text-[13px] font-semibold md:text-sm">
                    {rewardCount} hadiah dari {approvedClaims} klaim disetujui.
                </p>
            </div>

            <div className="bg-cream relative -mt-7 flex-1 rounded-t-[2rem] px-5 pt-5 pb-6 md:px-8 md:pt-8 md:pb-10">
                {/* Hadiah yang masih butuh form lanjutan (nomor meter token, alamat) ditampilkan paling atas. */}
                {followUps.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {followUps.map((reward) => (
                            <FollowUpNotice key={`follow-${reward.kind}-${reward.id}`} reward={reward} />
                        ))}
                    </div>
                )}

                <div className="space-y-3 xl:grid xl:grid-cols-2 xl:gap-3 xl:space-y-0">
                    {rewards.map((reward) => (
                        <RewardTicket key={`${reward.kind}-${reward.id}`} reward={reward} />
                    ))}
                </div>

                {rewards.length === 0 && (
                    <p className="text-ink-soft rounded-2xl bg-white/60 p-4 text-center text-[12px]">Belum ada hadiah. Selesaikan klaim dulu.</p>
                )}
            </div>
        </ParticipantLayout>
    );
}
