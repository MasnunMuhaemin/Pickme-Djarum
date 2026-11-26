import { LimePage } from '@/features/participant/components/lime-page';
import { PrizeReveal } from '@/features/participant/components/prize-reveal';
import { OutlineButton, PrimaryButton } from '@/features/participant/components/ui';
import { VoucherArt } from '@/features/participant/components/voucher-art';
import { mysteryOpenedKey, type Reward, rewardIcons, rewardToneClass } from '@/features/participant/rewards';
import { cn } from '@/lib/utils';
import { Gift } from 'lucide-react';
import { useState } from 'react';

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3 text-[13px]">
            <span className="text-ink-soft">{label}</span>
            <span className="text-right font-extrabold">{value}</span>
        </div>
    );
}

/**
 * Klaim mystery gift cap ke-5: kartu gelap tertutup, lalu dibuka lewat kartu gosok. Setelah terbuka tampil isi
 * hadiahnya ("Mystery gift terbuka!"). Hadiahnya sendiri sudah dibuat sistem saat cap ke-5 tercapai.
 */
export default function MysteryGift({ reward }: { reward: Reward }) {
    const [opened, setOpened] = useState(() => typeof window !== 'undefined' && Boolean(window.localStorage.getItem(mysteryOpenedKey(reward.id))));
    const [revealing, setRevealing] = useState(false);
    const title = reward.title.replace(/^Mystery gift:\s*/, '');
    const Icon = rewardIcons[reward.kind] ?? Gift;

    const gurita = (
        <img
            src="/images/gurita.webp"
            alt=""
            aria-hidden
            className="pointer-events-none absolute right-3 bottom-[8px] z-10 w-[27%] max-w-[150px] select-none md:right-8 md:w-[22%]"
        />
    );

    return (
        <LimePage
            title={opened ? 'Mystery gift terbuka!' : 'Klaim mystery gift'}
            back="/participant/kartu"
            nav="kartu"
            decoration={gurita}
            footer={
                <div className="space-y-2">
                    {opened ? (
                        <>
                            <PrimaryButton href={reward.href ?? '/participant/hadiah'}>{reward.action ?? 'Lihat Hadiahku'}</PrimaryButton>
                            <OutlineButton href="/participant/kartu">Kembali ke kartu cap</OutlineButton>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setRevealing(true)}
                                className="bg-ink text-cream h-12 w-full rounded-full text-[14px] font-extrabold transition active:scale-[0.99]"
                            >
                                Klaim sekarang
                            </button>
                            <OutlineButton href="/participant/kartu">Nanti saja</OutlineButton>
                        </>
                    )}
                </div>
            }
        >
            {opened && reward.kind === 'voucher' && reward.code ? (
                <div className="overflow-hidden rounded-[24px]">
                    <VoucherArt code={reward.code} value={reward.value} />
                </div>
            ) : (
                <div className="bg-ink relative overflow-hidden rounded-[24px] px-5 py-6 md:px-7 md:py-8">
                    <img src="/images/design-voucher3.webp" alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-35" />
                    <div className="relative">
                        <p className="text-lime text-[12px] font-extrabold tracking-[0.14em] uppercase">Mystery gift</p>
                        <p className="text-cream mt-2 text-[26px] leading-tight font-extrabold tracking-tight md:text-[30px]">
                            {opened ? title : 'Cap ke-5 tercapai'}
                        </p>
                        {opened ? (
                            <span className="bg-lime text-ink mt-3 inline-grid size-11 place-items-center rounded-full">
                                <Icon className="size-5" />
                            </span>
                        ) : (
                            <p className="text-lime mt-1 text-[44px] leading-none font-extrabold">?</p>
                        )}
                    </div>
                </div>
            )}

            {opened && (
                <div className="mt-4">
                    <p className="text-[18px] font-extrabold tracking-tight">{title}</p>
                    <p className="text-ink-soft mt-0.5 text-[12px]">{reward.description}</p>
                </div>
            )}

            <div className="divide-ink/8 mt-4 divide-y rounded-[24px] bg-white px-5 py-1">
                <Row label="Asal" value="Cap ke-5" />
                {opened ? (
                    <div className="flex items-center justify-between gap-4 py-3 text-[13px]">
                        <span className="text-ink-soft">Status</span>
                        <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', rewardToneClass[reward.tone])}>
                            {reward.status_label}
                        </span>
                    </div>
                ) : (
                    <Row label="Status" value="Siap diklaim" />
                )}
                <Row label="Jumlah" value="1 mystery gift per peserta" />
            </div>

            {revealing && (
                <PrizeReveal
                    label="Mystery gift · Cap ke-5"
                    onDone={() => {
                        window.localStorage.setItem(mysteryOpenedKey(reward.id), '1');
                        setOpened(true);
                        setRevealing(false);
                    }}
                />
            )}
        </LimePage>
    );
}
