import { Badge, OutlineButton, PageHeader } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useCaps } from '@/lib/participant';
import { Check } from 'lucide-react';

export default function TerimaKasih() {
    const caps = useCaps();

    return (
        <ParticipantLayout title="Terima kasih">
            <PageHeader title="Terima kasih!" right={<Badge>Kartu {caps} / 10</Badge>} />
            <div className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                <div className="flex flex-col items-center py-4 text-center">
                    <span className="bg-lime grid size-20 place-items-center rounded-full">
                        <Check className="text-ink size-9" />
                    </span>
                    <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0b0b0b]">Terima kasih!</h2>
                    <p className="text-ink-soft mt-1 max-w-[260px] text-[11px] leading-relaxed">
                        Klaim kamu sudah kami terima. Admin akan memproses hadiahnya.
                    </p>
                </div>

                <div className="border-ink/10 bg-cream-soft rounded-2xl border p-4">
                    <div className="space-y-2.5 text-[11px]">
                        <div className="flex justify-between">
                            <span className="text-ink-soft">Hadiah</span>
                            <span className="font-bold">Stiker</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-soft">Pengiriman</span>
                            <span className="font-bold">Dikirim admin</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-soft">Alamat</span>
                            <span className="font-bold">Alamat terdaftar</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-soft">Papan</span>
                            <span className="font-bold">W07</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-ink-soft">Hadiah kamu</span>
                            <span className="font-bold">C3</span>
                        </div>
                    </div>
                </div>

                <div className="mt-6 space-y-2">
                    <OutlineButton href="/participant/kartu">Lihat kartu cap</OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
