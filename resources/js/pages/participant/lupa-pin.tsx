import { OutlineButton, PageHeader, PrimaryButton, StepList } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';

export default function LupaPin() {
    return (
        <ParticipantLayout>
            <PageHeader back="/login" title="Lupa PIN?" />
            <div className="flex-1 px-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[620px] lg:px-8 lg:pt-2 lg:pb-10">
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

                <div className="mt-6 space-y-2">
                    <PrimaryButton href="/participant/papan?masuk=1">Kembali ke masuk</PrimaryButton>
                    <OutlineButton onClick={() => window.open('https://wa.me/6281234567890', '_blank')}>Hubungi admin</OutlineButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
