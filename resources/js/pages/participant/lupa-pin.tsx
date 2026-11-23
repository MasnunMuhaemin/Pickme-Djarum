import { Input, OutlineButton, PageHeader, PrimaryButton, StepList } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

export default function LupaPin({ sent }: { sent?: boolean }) {
    const form = useForm({ whatsapp: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/participant/lupa-pin', { preserveScroll: true });
    }

    return (
        <ParticipantLayout>
            <PageHeader back="/login" title="Lupa PIN?" />
            <div className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[620px] md:px-8 md:pt-2 md:pb-10">
                <h2 className="text-xl font-extrabold tracking-tight">Admin bantu buatkan PIN sementara.</h2>
                <p className="text-ink-soft mt-2 text-[12px] leading-relaxed">
                    Hubungi admin lewat nomor WhatsApp yang terdaftar. Setelah itu masuk pakai PIN baru, lalu ganti PIN sendiri.
                </p>

                <div className="border-ink/10 bg-cream-soft mt-6 rounded-2xl border p-4">
                    <StepList
                        steps={[
                            { title: 'Hubungi admin', text: 'Sebutkan nomor WhatsApp yang terdaftar di akun kamu.' },
                            { title: 'Terima PIN sementara', text: 'Admin mengirim PIN sementara lewat WhatsApp.' },
                            { title: 'Masuk, lalu ganti PIN', text: 'Ganti PIN setelah berhasil masuk supaya akun tetap aman.' },
                        ]}
                    />
                </div>

                <p className="text-ink-soft mt-3 text-[10px] leading-relaxed">Demi keamanan, nomor WhatsApp akan dicek dulu sebelum PIN diberikan.</p>

                <form onSubmit={submit} className="border-ink/10 bg-cream-soft mt-4 rounded-2xl border p-4">
                    <p className="text-[12px] font-extrabold">Minta bantuan admin</p>
                    <p className="text-ink-soft mt-1 text-[10px] leading-relaxed">Permintaan dicatat. Admin menghubungi lewat WhatsApp.</p>
                    <Input
                        inputMode="tel"
                        value={form.data.whatsapp}
                        onChange={(e) => form.setData('whatsapp', e.target.value)}
                        placeholder="Nomor WhatsApp terdaftar"
                        className="mt-2"
                    />
                    {form.errors.whatsapp && <span className="text-danger mt-1 block text-[11px]">{form.errors.whatsapp}</span>}
                    {sent && <span className="text-ink mt-1 block text-[11px] font-bold">Permintaan terkirim.</span>}
                    <button
                        type="submit"
                        disabled={form.processing}
                        className="text-ink bg-lime mt-2 rounded-full px-4 py-2 text-[11px] font-bold disabled:opacity-50"
                    >
                        Kirim permintaan
                    </button>
                </form>

                <div className="mt-6 space-y-2">
                    <PrimaryButton href="/participant/masuk">Kembali ke masuk</PrimaryButton>
                    <OutlineButton onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>Hubungi admin</OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
