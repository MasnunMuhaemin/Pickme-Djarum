import { Field, Input, PageHeader, PrimaryButton, Textarea } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';

export default function NomorTujuan() {
    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Nomor tujuan" />
            <div className="flex-1 px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[760px] lg:px-8 lg:pt-2 lg:pb-10">
                <p className="text-ink-soft text-[12px] leading-relaxed lg:max-w-[560px]">
                    Isi nomor meteran atau ID pelanggan. Token dikirim ke nomor yang kamu isi.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Field label="Nomor meter atau ID pelanggan">
                        <Input inputMode="numeric" placeholder="Contoh: 12345678901" />
                    </Field>
                    <Field label="Nama">
                        <Input placeholder="Nama sesuai meteran" />
                    </Field>
                    <Field label="Nomor WhatsApp">
                        <Input inputMode="tel" defaultValue="08xx xxxx xxxx" />
                    </Field>
                    <div className="lg:col-span-2">
                        <Field label="Catatan (opsional)">
                            <Textarea placeholder="Contoh: token untuk rumah orang tua." />
                        </Field>
                    </div>
                </div>

                <p className="text-ink-soft mt-3 text-[10px] leading-relaxed">
                    Pastikan nomor benar. Token yang sudah dikirim tidak bisa ditarik kembali.
                </p>

                <PrimaryButton href="/participant/terima-kasih" className="mt-5 lg:max-w-[260px]">
                    Kirim
                </PrimaryButton>
            </div>
        </ParticipantLayout>
    );
}
