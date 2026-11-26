import { limeLogoutClass } from '@/features/participant/components/lime-page';
import { LogoutButton, PrimaryButton } from '@/features/participant/components/ui';
import { VoucherArt } from '@/features/participant/components/voucher-art';
import { type Reward, rewardIcons, rewardStub, rewardToneClass } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Check, Copy, Gift } from 'lucide-react';
import { useState } from 'react';

type VoucherData = { id: number; code: string; type: string; status: string; destination?: string | null };

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-ink-soft">{label}</span>
            <span className="text-right font-bold">{value}</span>
        </div>
    );
}

export default function VoucherPage({ voucher, reward }: { voucher: VoucherData; reward: Reward }) {
    const caps = useCaps();
    const [copied, setCopied] = useState(false);
    const Icon = rewardIcons[reward.kind] ?? Gift;
    const stub = rewardStub(reward.kind);
    const isVoucher = voucher.type === 'voucher';

    async function copy() {
        try {
            await navigator.clipboard.writeText(voucher.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <ParticipantLayout title="Detail hadiah" nav="hadiah">
            <div className="lime-hero relative px-5 pt-4 pb-14 md:px-8 md:pt-6">
                <img
                    src="/images/gurita.webp"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute right-3 bottom-[8px] z-10 w-[27%] max-w-[150px] select-none md:right-8 md:w-[22%]"
                />
                <div className="relative flex items-center justify-end gap-2">
                    <span className="bg-ink text-cream rounded-full px-3.5 py-1.5 text-[12px] font-extrabold">Cap {caps} / 10</span>
                    <LogoutButton className={limeLogoutClass} />
                </div>
                <h1 className="relative mt-2 max-w-[58%] text-[32px] leading-none font-extrabold tracking-tight md:max-w-[65%] md:text-[44px]">
                    {reward.title}
                </h1>
                <p className="relative mt-2 max-w-[58%] text-[13px] font-semibold md:text-sm">{reward.description}</p>
            </div>

            <div className="bg-cream relative -mt-7 flex-1 rounded-t-[2rem] px-5 pt-5 pb-6 md:px-8 md:pt-8 md:pb-10">
                <div className="md:mx-auto md:max-w-[520px]">
                    {/* Tiket: bagian atas sobekan, dipisah garis putus-putus dengan lubang kiri-kanan */}
                    {isVoucher ? (
                        <VoucherArt code={voucher.code} value={reward.value} className="rounded-t-3xl" />
                    ) : (
                        <div className={cn('flex h-32 items-center justify-between rounded-t-3xl px-5 md:h-36', stub.bg)}>
                            <Icon className={cn('size-10', stub.icon)} strokeWidth={1.75} />
                            {reward.value && (
                                <span className="text-ink rounded-full bg-white/90 px-3 py-1 text-[13px] font-extrabold">{reward.value}</span>
                            )}
                        </div>
                    )}
                    <div className="relative rounded-b-3xl border-t-2 border-dashed border-[#e8e1c4] bg-white px-5 pt-5 pb-4">
                        <span className="bg-cream absolute -top-[9px] -left-2 size-4 rounded-full" aria-hidden />
                        <span className="bg-cream absolute -top-[9px] -right-2 size-4 rounded-full" aria-hidden />

                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[15px] font-extrabold tracking-tight">{isVoucher ? 'Tunjukkan ke kasir warung' : 'Status hadiah'}</p>
                            <span
                                className={cn(
                                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap',
                                    rewardToneClass[reward.tone],
                                )}
                            >
                                {reward.status_label}
                            </span>
                        </div>

                        {isVoucher && (
                            <div className="bg-ink mt-4 rounded-2xl px-4 py-4 text-center">
                                <p className="text-cream/60 text-[10px] font-bold tracking-widest uppercase">Kode voucher</p>
                                <p className="text-lime mt-1 font-mono text-[26px] font-extrabold tracking-[0.12em] break-all md:text-[30px]">
                                    {voucher.code}
                                </p>
                                <p className="text-cream/60 mt-1 text-[11px]">Tunjukkan kode ini ke kasir</p>
                                <button
                                    type="button"
                                    onClick={copy}
                                    aria-label="Salin kode"
                                    className="bg-lime text-ink mx-auto mt-3 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold"
                                >
                                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                                    {copied ? 'Tersalin' : 'Salin kode'}
                                </button>
                            </div>
                        )}

                        <div className="divide-ink/8 mt-3 divide-y text-[12px] md:text-[13px]">
                            {reward.value && <Row label="Nilai" value={reward.value} />}
                            {voucher.destination && <Row label="Nomor tujuan" value={voucher.destination} />}
                            {!isVoucher && <Row label="Dikirim lewat" value="WhatsApp" />}
                        </div>
                    </div>

                    <p className="text-ink-soft mt-4 text-[11px] leading-relaxed sm:text-[12px]">
                        {isVoucher
                            ? 'Kode hanya bisa dipakai sekali. Kalau sudah ditukar, voucher tidak bisa dikembalikan.'
                            : 'Admin akan menghubungi kamu lewat WhatsApp. Pastikan nomormu aktif.'}
                    </p>

                    <PrimaryButton href="/participant/hadiah" className="mt-4 h-11 text-[13px] font-extrabold sm:h-12 sm:text-sm">
                        Kembali ke Hadiahku
                    </PrimaryButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
