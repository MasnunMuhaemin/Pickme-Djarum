import { OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { GraduationCap } from 'lucide-react';

export default function KhususMahasiswa() {
    return (
        <ParticipantLayout title="Khusus mahasiswa">
            <PageHeader back="/participant/mahasiswa" title="Khusus mahasiswa" />
            <div className="flex flex-1 flex-col px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                <div className="flex flex-1 flex-col items-center justify-center text-center">
                    <span className="bg-cream-deep grid size-24 place-items-center rounded-full">
                        <GraduationCap className="text-ink/70 size-10" />
                    </span>
                    <h2 className="mt-5 text-lg font-extrabold tracking-tight">Program ini hanya untuk mahasiswa</h2>
                    <p className="text-ink-soft mt-2 max-w-[270px] text-[11px] leading-relaxed">
                        Kamu belum bisa ikut. Kartu, hadiah, dan riwayat kamu tetap aman dan bisa dibuka kapan saja.
                    </p>
                </div>

                <div className="space-y-2">
                    <PrimaryButton href="/participant/mahasiswa">Saya salah pilih, kembali</PrimaryButton>
                    <OutlineButton href="/participant">Tutup</OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
