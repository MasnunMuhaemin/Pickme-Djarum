import { PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Consent = { version: string; body: string; accepted: boolean };

export default function Persetujuan({ consent }: { consent: Consent }) {
    const [reachedBottom, setReachedBottom] = useState(consent.accepted);
    const form = useForm({ accepted: consent.accepted, optional: false });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/participant/persetujuan', { preserveScroll: true });
    }

    return (
        <ParticipantLayout hideBottomNav>
            <PageHeader back="/participant/daftar" title="Persetujuan data" />
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col px-4 pb-6 md:mx-auto md:w-full md:max-w-[760px] md:px-8 md:pt-2 md:pb-10">
                <div className="flex min-h-0 flex-1 flex-col">
                    <p className="text-ink-soft mb-3 text-[11px] leading-relaxed">Gulir teks ini sampai dasar untuk mengaktifkan tombol lanjut.</p>
                    <div
                        onScroll={(e) => {
                            const el = e.currentTarget;
                            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReachedBottom(true);
                        }}
                        className="border-ink/10 bg-cream-soft h-[46vh] min-h-0 shrink-0 overflow-y-auto rounded-2xl border p-4 md:h-[420px]"
                    >
                        <h2 className="text-[15px] font-extrabold">Privasi dan data kamu</h2>
                        <p className="text-ink-soft mt-2 text-[11px] leading-relaxed">{consent.body}</p>
                        <div className="text-ink-soft mt-4 space-y-3 text-[11px] leading-relaxed">
                            <p>Versi teks: {consent.version}. Versi baru meminta persetujuan ulang.</p>
                            <p>Data dipakai untuk pendaftaran, pemeriksaan klaim, penentuan hadiah, dan pelaporan program.</p>
                            <p>Admin Si Pemburu dan warung terkait dapat melihat data klaim untuk pemeriksaan.</p>
                            <p>Kamu bisa meminta penghapusan data dengan menghubungi admin lewat WhatsApp.</p>
                            <p>Data teknis seperti perangkat dan alamat IP dipakai sebagai sinyal keamanan, bukan bukti identitas.</p>
                        </div>
                        <p className="text-ink-soft mt-5 border-t border-black/10 pt-3 text-[10px]">Akhir dari persetujuan.</p>
                    </div>
                </div>

                <div className="mt-4">
                    <PrimaryButton type="submit" disabled={!reachedBottom || form.processing} className="md:max-w-[260px]">
                        {form.processing ? 'Menyimpan...' : 'Setuju dan lanjut'}
                    </PrimaryButton>
                    {form.errors.accepted && <span className="text-danger mt-1 block text-[11px]">{form.errors.accepted}</span>}
                </div>
            </form>
        </ParticipantLayout>
    );
}
