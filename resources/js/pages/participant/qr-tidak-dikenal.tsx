import { OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { QrCode } from 'lucide-react';

export default function QrTidakDikenal() {
    return (
        <ParticipantLayout title="QR tidak dikenal" hideBottomNav>
            <PageHeader title="QR tidak dikenal" />
            <div className="flex flex-1 flex-col px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <span className="bg-cream-deep relative grid size-24 place-items-center rounded-full">
                        <QrCode className="text-ink/70 size-10" />
                        <span className="bg-danger absolute right-4 bottom-4 grid size-7 place-items-center rounded-full text-sm font-extrabold text-white">
                            !
                        </span>
                    </span>
                    <h2 className="mt-5 text-lg font-extrabold tracking-tight">QR ini belum terdaftar</h2>
                    <p className="text-ink-soft mt-2 max-w-[270px] text-[11px] leading-relaxed">
                        Kode tidak terdaftar di sistem kami. QR ini tidak bisa dipakai. Coba papan lain atau minta bantuan admin warung.
                    </p>
                </div>

                <div className="space-y-2">
                    <PrimaryButton href="/participant">Ke beranda</PrimaryButton>
                    <OutlineButton href="/participant/scan">Scan ulang</OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
