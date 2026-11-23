import { OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { GraduationCap } from 'lucide-react';

export default function Mahasiswa() {
    return (
        <ParticipantLayout>
            <PageHeader back="/participant/papan" title="Kamu mahasiswa?" />
            <div className="flex flex-1 flex-col px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[560px] lg:px-8 lg:pt-2 lg:pb-10">
                <p className="text-ink-soft text-[12px] leading-relaxed">
                    Ada program khusus untuk mahasiswa. Pilih salah satu untuk lanjut ke papan.
                </p>

                <div className="mt-8 flex flex-1 flex-col items-center justify-center">
                    <span className="bg-cream-deep grid size-24 place-items-center rounded-full">
                        <GraduationCap className="text-ink size-10" />
                    </span>
                    <p className="text-ink-soft mt-5 max-w-[260px] text-center text-[11px] leading-relaxed">
                        Program mahasiswa punya hadiah dan jadwal sendiri. Kartu cap tetap sama.
                    </p>
                </div>

                <div className="space-y-2">
                    <PrimaryButton href="/participant/papan">Ya, saya mahasiswa</PrimaryButton>
                    <OutlineButton href="/participant/mahasiswa/khusus">Bukan mahasiswa</OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
