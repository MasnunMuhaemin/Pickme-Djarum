import { LimePage } from '@/features/participant/components/lime-page';
import { PrizeReveal } from '@/features/participant/components/prize-reveal';
import { OutlineButton, PrimaryButton } from '@/features/participant/components/ui';
import { mysteryOpenedKey, type Reward } from '@/features/participant/rewards';
import { useState } from 'react';

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5 text-[14px]">
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
    // Bungkus gratis tidak punya nilai Rupiah: kartu tetap bersusun nama, teks besar lime, lalu keterangan (desain).
    const isFreePack = reward.kind === 'mystery';
    const cardTitle = title;
    const bigText = reward.value ?? (isFreePack ? '1 bungkus' : null);

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
            nav="hadiah"
            decoration={gurita}
            // Sebelum dibuka: tombol menempel di bawah. Setelah terbuka (desain): tombol tepat di bawah rincian.
            footer={
                opened ? undefined : (
                    <div className="space-y-2">
                        <button
                            type="button"
                            onClick={() => setRevealing(true)}
                            className="text-cream h-12 w-full rounded-full bg-[#0b0b0b] text-[14px] font-extrabold transition active:scale-[0.99]"
                        >
                            Klaim sekarang
                        </button>
                        <OutlineButton href="/participant/kartu">Nanti saja</OutlineButton>
                    </div>
                )
            }
        >
            <div className="relative overflow-hidden rounded-[24px] bg-[#0b0b0b] px-5 py-6 md:px-7 md:py-8">
                <img src="/images/design-voucher3.webp" alt="" aria-hidden className="absolute inset-0 size-full object-cover opacity-45" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
                <div className="relative">
                    <p className="text-lime text-[12px] font-extrabold tracking-[0.12em] uppercase">Mystery gift</p>
                    <p className="text-cream mt-2 text-[26px] leading-tight font-extrabold tracking-tight md:text-[30px]">
                        {opened ? cardTitle : 'Cap ke-5 tercapai'}
                    </p>
                    {opened ? (
                        <>
                            {bigText && (
                                <p className="text-lime mt-2 text-[40px] leading-none font-extrabold tracking-tight md:text-[48px]">{bigText}</p>
                            )}
                            <p className="text-cream/85 mt-3 text-[13px] leading-snug">{reward.description}</p>
                        </>
                    ) : (
                        <p className="text-lime mt-1 text-[44px] leading-none font-extrabold">?</p>
                    )}
                </div>
            </div>

            <div className="divide-cream-deep mt-4 divide-y rounded-[24px] bg-white px-5 py-1">
                <Row label="Asal" value="Cap ke-5" />
                <Row label="Status" value={opened ? reward.status_label : 'Siap diklaim'} />
                <Row label="Jumlah" value="1 mystery gift per peserta" />
                {/* Voucher mitra: kodenya ditunjukkan ke kasir. */}
                {opened && (reward.kind === 'voucher' || reward.kind === 'digital') && reward.code && (
                    <Row label="Kode voucher" value={reward.code} />
                )}
            </div>

            {opened && (
                <div className="mt-4 space-y-3">
                    <PrimaryButton href="/participant/hadiah" className="bg-lime h-14 text-[16px] font-extrabold text-[#0b0b0b]">
                        Lihat Hadiahku
                    </PrimaryButton>
                </div>
            )}

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
