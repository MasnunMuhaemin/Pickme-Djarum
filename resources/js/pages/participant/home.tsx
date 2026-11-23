import { AuthSheet, type AuthMode } from '@/features/participant/components/auth-sheet';
import { Card, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Box, Coffee, Fuel, Gift, QrCode, Zap } from 'lucide-react';
import { useState } from 'react';

/** Data dari App\Support\RewardPresenter::prize(). */
type Prize = { type: string; title: string; subtitle: string; value: string; remaining: number };

const prizeStyle: Record<string, { icon: LucideIcon; tone: string }> = {
    voucher: { icon: Coffee, tone: 'bg-[#f6e7cf]' },
    token: { icon: Zap, tone: 'bg-[#e3e9fb]' },
    merch: { icon: Box, tone: 'bg-[#e5f1d5]' },
    bensin: { icon: Fuel, tone: 'bg-[#fbe2da]' },
};

type Area = { id: number; name: string };

export default function Home({ modal, areas = [], prizes = [] }: { modal?: string; areas?: Area[]; prizes?: Prize[] }) {
    const [authMode, setAuthMode] = useState<AuthMode>(modal === 'login' || modal === 'register' ? modal : null);

    function closeAuth() {
        setAuthMode(null);
        if (modal) window.history.replaceState({}, '', '/participant');
    }

    return (
        <ParticipantLayout nav="papan">
            <PageHeader
                right={
                    <Link
                        href="/participant/scan"
                        className="border-ink/15 flex items-center gap-1.5 rounded-full border px-3 py-2 text-[11px] font-bold"
                    >
                        <QrCode className="size-4" />
                        Scan QR
                    </Link>
                }
            />
            <div className="flex-1 px-4 pb-6 md:px-8 md:pt-4 md:pb-10">
                <h1 className="text-[34px] leading-[1.03] font-extrabold tracking-tight md:max-w-[640px] md:text-[48px]">
                    Beli bungkus,
                    <br />
                    foto, <span className="bg-lime rounded-sm px-1">ambil slot.</span>
                </h1>
                <p className="text-ink-soft mt-3 max-w-[300px] text-[13px] leading-relaxed md:max-w-[440px] md:text-sm">
                    Hadiah langsung dari warung. Tanpa undian, tanpa aplikasi tambahan.
                </p>

                <div className="grid grid-cols-1 xl:mt-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start xl:gap-6">
                    <div className="order-2 md:order-1">
                        <div className="bg-lime text-ink mt-4 rounded-3xl p-4 md:mt-0 md:p-6">
                            <div className="divide-ink/20 grid grid-cols-3 divide-x">
                                {['Beli bungkus', 'Foto bungkus', 'Ambil slot'].map((step, i) => (
                                    <div key={step} className="px-2 first:pl-0 last:pr-0">
                                        <span className="bg-ink text-cream grid size-6 place-items-center rounded-full text-[10px] font-bold">
                                            {i + 1}
                                        </span>
                                        <p className="mt-2 text-[11px] leading-tight font-bold md:text-xs">{step}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-ink/75 mt-4 text-[11px] leading-relaxed md:text-xs">
                                Berlaku 2 jam setelah foto. Slot di papan mingguan, satu klaim per hari.
                            </p>
                            <PrimaryButton href="/participant/scan" className="bg-ink text-cream mt-3">
                                <QrCode className="size-4" />
                                Scan QR papan
                            </PrimaryButton>
                        </div>
                    </div>

                    <Card className="order-1 mt-5 p-4 md:sticky md:top-24 md:order-2 md:mt-0 md:p-5">
                        <p className="text-[13px] font-extrabold">Hadiah yang bisa kamu dapat</p>
                        <div className="mt-3 space-y-1">
                            {prizes.map((prize) => {
                                const style = prizeStyle[prize.type] ?? { icon: Gift, tone: 'bg-cream-deep' };
                                const Icon = style.icon;
                                return (
                                    <div key={prize.type} className="flex items-center gap-3 rounded-xl py-2">
                                        <span className={`grid size-10 place-items-center rounded-xl ${style.tone}`}>
                                            <Icon className="text-ink size-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-bold">{prize.title}</p>
                                            <p className="text-ink-soft truncate text-[11px]">
                                                {prize.subtitle} · {prize.remaining > 0 ? `${prize.remaining} slot tersisa` : 'Habis minggu ini'}
                                            </p>
                                        </div>
                                        <span className="text-[12px] font-bold">{prize.value}</span>
                                    </div>
                                );
                            })}
                            {prizes.length === 0 && <p className="text-ink-soft py-2 text-[11px]">Belum ada papan aktif.</p>}
                        </div>
                    </Card>
                </div>
            </div>
            <AuthSheet mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} areas={areas} />
        </ParticipantLayout>
    );
}
