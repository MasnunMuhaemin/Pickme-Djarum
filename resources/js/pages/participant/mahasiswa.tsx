import { OutlineButton, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useForm } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';

export default function Mahasiswa() {
    const yes = useForm({ is_student: true });
    const no = useForm({ is_student: false });

    return (
        <ParticipantLayout title="Kamu mahasiswa?">
            <PageHeader back="/participant/papan" title="Kamu mahasiswa?" />
            <div className="flex flex-1 flex-col px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
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
                    <PrimaryButton onClick={() => yes.post('/participant/mahasiswa')} disabled={yes.processing}>
                        Ya, saya mahasiswa
                    </PrimaryButton>
                    <OutlineButton onClick={() => no.post('/participant/mahasiswa')} disabled={no.processing}>
                        Bukan mahasiswa
                    </OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
