import { limeLogoutClass } from '@/features/participant/components/lime-page';
import { LogoutButton, PrimaryButton } from '@/features/participant/components/ui';
import { type Reward, rewardIcons, rewardStub, rewardToneClass } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Gift } from 'lucide-react';

type GiftData = {
    id: number;
    area: string | null;
    address: string | null;
    note: string | null;
    claim_code: string | null;
    outlet: string | null;
    received_at: string | null;
};

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-ink-soft shrink-0">{label}</span>
            <span className="text-right font-bold">{value}</span>
        </div>
    );
}

/** Detail hadiah barang (merchandise, limited edition, bungkus gratis mystery gift): status dan alamat pengiriman. */
export default function HadiahBarang({ gift, reward }: { gift: GiftData; reward: Reward }) {
    const caps = useCaps();
    const Icon = rewardIcons[reward.kind] ?? Gift;
    const stub = rewardStub(reward.kind);
    const isFreePack = reward.kind === 'mystery';
    const needsAddress = reward.status === 'pending_address' && !isFreePack;

    return (
        <ParticipantLayout title="Detail hadiah" nav="hadiah">
            <div className="lime-hero px-5 pt-4 pb-14 md:px-8 md:pt-6">
                <div className="flex items-center justify-end gap-2">
                    <span className="bg-ink text-cream rounded-full px-3.5 py-1.5 text-[12px] font-extrabold">Cap {caps} / 10</span>
                    <LogoutButton className={limeLogoutClass} />
                </div>
                <h1 className="mt-2 text-[32px] leading-none font-extrabold tracking-tight md:text-[44px]">{reward.title}</h1>
                <p className="mt-2 text-[13px] font-semibold md:text-sm">{reward.description}</p>
            </div>

            <div className="bg-cream relative -mt-7 flex-1 rounded-t-[2rem] px-5 pt-5 pb-6 md:px-8 md:pt-8 md:pb-10">
                <div className="md:mx-auto md:max-w-[520px]">
                    {/* Tiket: bagian atas sobekan, dipisah garis putus-putus dengan lubang kiri-kanan */}
                    <div className={cn('flex h-32 items-center justify-between rounded-t-3xl px-5 md:h-36', stub.bg)}>
                        <Icon className={cn('size-10', stub.icon)} strokeWidth={1.75} />
                    </div>
                    <div className="relative rounded-b-3xl border-t-2 border-dashed border-[#e8e1c4] bg-white px-5 pt-5 pb-4">
                        <span className="bg-cream absolute -top-[9px] -left-2 size-4 rounded-full" aria-hidden />
                        <span className="bg-cream absolute -top-[9px] -right-2 size-4 rounded-full" aria-hidden />

                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[15px] font-extrabold tracking-tight">Status hadiah</p>
                            <span
                                className={cn(
                                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
                                    rewardToneClass[reward.tone],
                                )}
                            >
                                {reward.status_label}
                            </span>
                        </div>

                        <div className="divide-ink/8 mt-3 divide-y text-[12px] md:text-[13px]">
                            {!isFreePack && <Row label="Area" value={gift.area ?? 'Belum diisi'} />}
                            {!isFreePack && <Row label="Alamat" value={gift.address ?? 'Belum diisi'} />}
                            {gift.note && <Row label="Catatan" value={gift.note} />}
                            {gift.claim_code && <Row label="Kode klaim" value={gift.claim_code} />}
                            {gift.outlet && <Row label="Titik" value={gift.outlet} />}
                            {gift.received_at && <Row label="Didapat" value={gift.received_at} />}
                        </div>
                    </div>

                    <p className="text-ink-soft mt-4 text-[11px] leading-relaxed sm:text-[12px]">
                        {isFreePack
                            ? 'Admin akan menghubungi kamu lewat WhatsApp untuk penyerahan bungkus gratis.'
                            : 'Hadiah diantar ke alamat di atas. Admin akan menghubungi lewat WhatsApp bila perlu. Pastikan nomormu aktif.'}
                    </p>

                    {needsAddress && (
                        <PrimaryButton href={`/participant/alamat/${gift.id}`} className="mt-4 h-11 text-[13px] font-extrabold sm:h-12 sm:text-sm">
                            Isi alamat
                        </PrimaryButton>
                    )}
                    <PrimaryButton href="/participant/hadiah" className="mt-4 h-11 text-[13px] font-extrabold sm:h-12 sm:text-sm">
                        Kembali ke Hadiahku
                    </PrimaryButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
