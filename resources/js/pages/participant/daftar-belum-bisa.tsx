import { PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { ShieldX } from 'lucide-react';

export default function BelumBisaIkut() {
    return (
        <ParticipantLayout>
            <div className="bg-night text-cream flex flex-1 flex-col">
                <div className="px-5 pt-6 pb-10 md:mx-auto md:w-full md:max-w-[720px] md:px-8 md:pt-10">
                    <span className="bg-cream/10 grid size-11 place-items-center rounded-full">
                        <ShieldX className="size-5" />
                    </span>
                    <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Belum bisa ikut</h1>
                    <p className="text-cream/60 mt-1 text-[11px]">Cek lagi data yang kamu isi.</p>
                </div>
                <div className="bg-cream text-ink flex flex-1 flex-col rounded-t-3xl px-5 pt-6 pb-8">
                    <p className="text-[13px] leading-relaxed">
                        Kamu belum memenuhi syarat untuk ikut program ini. Data yang kamu isi tidak disimpan.
                    </p>
                    <p className="text-ink-soft mt-3 text-[12px] leading-relaxed">
                        Pastikan nomor WhatsApp aktif, usia sesuai ketentuan, dan area kode warung benar. Kamu bisa mencoba lagi nanti.
                    </p>
                    <div className="mt-auto pt-8">
                        <PrimaryButton href="/participant">Tutup</PrimaryButton>
                    </div>
                </div>
            </div>
        </ParticipantLayout>
    );
}
