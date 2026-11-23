import { AuthSheet, type AuthMode } from '@/features/participant/components/auth-sheet';
import ParticipantLayout from '@/layouts/participant-layout';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Box, Coffee, Fuel, Gift, Zap } from 'lucide-react';
import { Fragment, useState } from 'react';

/** Data dari App\Support\RewardPresenter::prize(). */
type Prize = { type: string; title: string; subtitle: string; value: string; remaining: number };
type Area = { id: number; name: string };

const prizeStyle: Record<string, { icon: LucideIcon; tile: string }> = {
    voucher: { icon: Coffee, tile: 'from-[#dcc3a3] to-[#6b4a33]' },
    token: { icon: Zap, tile: 'from-[#bccfe0] to-[#4f6b86]' },
    merch: { icon: Box, tile: 'from-[#c6dccf] to-[#4d6b57]' },
    bensin: { icon: Fuel, tile: 'from-[#e7c9b4] to-[#8a4f35]' },
};

const steps = ['Beli bungkus', 'Foto bungkus', 'Ambil slot'];

export default function Home({ modal, areas = [], prizes = [] }: { modal?: string; areas?: Area[]; prizes?: Prize[] }) {
    const [authMode, setAuthMode] = useState<AuthMode>(modal === 'login' || modal === 'register' ? modal : null);

    function closeAuth() {
        setAuthMode(null);
        if (modal) window.history.replaceState({}, '', '/participant');
    }

    return (
        <ParticipantLayout title="Beli bungkus, ambil slot" nav="papan">
            {/* Hero: ilustrasi warung sebagai latar penuh, digelapkan ke bawah supaya teks terbaca. */}
            <div className="relative overflow-hidden bg-[#2b1d0c] px-5 pt-[236px] pb-16 md:px-8 md:pt-[280px]">
                <img
                    src="/images/hero-warung.svg"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-full w-full object-cover object-top select-none"
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(43,29,12,0)_0%,rgba(43,29,12,0.15)_38%,rgba(43,29,12,0.8)_56%,#2b1d0c_74%)]" />
                <span className="bg-lime text-ink relative inline-block rounded-full px-3.5 py-1.5 text-[13px] font-extrabold">
                    Scan QR di papan warung
                </span>
                <h1 className="text-cream relative mt-3 text-[40px] leading-[1.02] font-extrabold tracking-tight md:text-[52px]">
                    Beli bungkus,
                    <br />
                    foto, ambil slot.
                </h1>
                <p className="text-cream/75 relative mt-3 max-w-[340px] text-[14px] leading-snug md:max-w-[460px]">
                    Slot ditunjuk sistem secara acak. Isinya tidak terlihat sampai kamu klaim.
                </p>
            </div>

            <div className="bg-cream relative -mt-7 flex flex-1 flex-col rounded-t-[2rem] px-5 pt-6 pb-6 md:px-8 md:pt-8 md:pb-10">
                <div className="flex-1 md:mx-auto md:w-full md:max-w-[720px]">
                    <h2 className="text-[18px] font-extrabold tracking-tight">Hadiah yang bisa kamu dapat</h2>
                    <div className="mt-2">
                        {prizes.map((prize) => {
                            const style = prizeStyle[prize.type] ?? { icon: Gift, tile: 'from-[#e9e2bf] to-[#8b8466]' };
                            const Icon = style.icon;
                            return (
                                <div key={prize.type} className="flex items-center gap-4 border-b border-[#e8e1c4] py-3">
                                    <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-b', style.tile)}>
                                        <Icon className="text-cream/80 size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[15px] font-extrabold">{prize.title}</p>
                                        <p className="text-ink-soft truncate text-[13px]">
                                            {prize.subtitle} · {prize.remaining > 0 ? `${prize.remaining} slot tersisa` : 'Habis minggu ini'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[15px] font-extrabold">{prize.value}</span>
                                </div>
                            );
                        })}
                        {prizes.length === 0 && <p className="text-ink-soft py-3 text-[13px]">Belum ada papan aktif.</p>}
                    </div>

                    {/* Tiga langkah, dihubungkan garis. */}
                    <div className="mt-6 flex items-center">
                        {steps.map((step, i) => (
                            <Fragment key={step}>
                                {i > 0 && <span className="mx-3 h-0.5 flex-1 bg-[#e8e1c4]" />}
                                <span className="bg-ink text-lime grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-extrabold">
                                    {i + 1}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[13px] font-extrabold">
                        {steps.map((step, i) => (
                            <span key={step} className={cn(i === 1 && 'text-center', i === 2 && 'text-right')}>
                                {step}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <AuthSheet mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} areas={areas} />
        </ParticipantLayout>
    );
}
