import { Card, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import { prizes } from '@/features/participant/data';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Coffee, Fuel, Gamepad2, QrCode, Shirt } from 'lucide-react';
import { useState } from 'react';

const icons: Record<(typeof prizes)[number]['icon'], LucideIcon> = {
    coffee: Coffee,
    game: Gamepad2,
    shirt: Shirt,
    fuel: Fuel,
};

export default function Home() {
    const [demoOpen, setDemoOpen] = useState(true);

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
            <div className="flex-1 px-4 pb-6 lg:px-8 lg:pt-4 lg:pb-10">
                <h1 className="text-[34px] leading-[1.03] font-extrabold tracking-tight lg:max-w-[640px] lg:text-[48px]">
                    Beli bungkus,
                    <br />
                    foto, <span className="bg-lime rounded-sm px-1">ambil slot.</span>
                </h1>
                <p className="text-ink-soft mt-3 max-w-[300px] text-[13px] leading-relaxed lg:max-w-[440px] lg:text-sm">
                    Hadiah langsung dari warung. Tanpa undian, tanpa aplikasi tambahan.
                </p>

                <div className="grid grid-cols-1 xl:mt-8 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start xl:gap-6">
                    <div className="order-2 lg:order-1">
                        <div className="bg-lime text-ink mt-4 rounded-3xl p-4 lg:mt-0 lg:p-6">
                            <div className="divide-ink/20 grid grid-cols-3 divide-x">
                                {['Beli bungkus', 'Foto bungkus', 'Ambil slot'].map((step, i) => (
                                    <div key={step} className="px-2 first:pl-0 last:pr-0">
                                        <span className="bg-ink text-cream grid size-6 place-items-center rounded-full text-[10px] font-bold">
                                            {i + 1}
                                        </span>
                                        <p className="mt-2 text-[11px] leading-tight font-bold lg:text-xs">{step}</p>
                                    </div>
                                ))}
                            </div>
                            <p className="text-ink/75 mt-4 text-[11px] leading-relaxed lg:text-xs">
                                Berlaku 2 jam setelah foto. Slot di papan mingguan, satu klaim per hari.
                            </p>
                            <PrimaryButton href="/participant/scan" className="bg-ink text-cream mt-3">
                                <QrCode className="size-4" />
                                Scan QR papan
                            </PrimaryButton>
                        </div>

                        {demoOpen && (
                            <div className="border-ink/25 bg-cream-soft/60 mt-4 flex items-center gap-2 rounded-2xl border border-dashed px-3 py-2.5">
                                <div className="flex-1">
                                    <p className="text-ink-soft text-[9px] font-bold tracking-widest uppercase">Demo prototype</p>
                                    <p className="text-ink-soft text-[11px]">Hanya contoh alur. Semua data palsu.</p>
                                </div>
                                <button
                                    onClick={() => setDemoOpen(false)}
                                    className="border-ink/20 rounded-full border px-3 py-1 text-[10px] font-bold"
                                >
                                    Tutup
                                </button>
                            </div>
                        )}
                    </div>

                    <Card className="order-1 mt-5 p-4 lg:sticky lg:top-24 lg:order-2 lg:mt-0 lg:p-5">
                        <p className="text-[13px] font-extrabold">Hadiah yang bisa kamu dapat</p>
                        <div className="mt-3 space-y-1">
                            {prizes.map((prize) => {
                                const Icon = icons[prize.icon];
                                return (
                                    <div key={prize.title} className="flex items-center gap-3 rounded-xl py-2">
                                        <span className={`grid size-10 place-items-center rounded-xl ${prize.tone}`}>
                                            <Icon className="text-ink size-5" />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-bold">{prize.title}</p>
                                            <p className="text-ink-soft text-[11px]">{prize.icon === 'fuel' ? 'Bensin gratis' : 'Voucher belanja'}</p>
                                        </div>
                                        <span className="text-[12px] font-bold">{prize.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </ParticipantLayout>
    );
}
