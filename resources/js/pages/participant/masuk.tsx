import { Checkbox, Input, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { deviceId } from '@/lib/device';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

export default function Masuk() {
    const [agree, setAgree] = useState(false);
    const form = useForm({ whatsapp: '', pin: '', device_id: deviceId() });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/participant/masuk', { preserveScroll: true });
    }

    return (
        <ParticipantLayout hideBottomNav>
            <PageHeader back="/participant/scan" title="Masuk" />
            <div className="flex flex-1 flex-col px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                <h2 className="text-xl font-extrabold tracking-tight">Masuk dulu untuk klaim</h2>
                <p className="text-ink-soft mt-1 text-[12px] leading-relaxed">
                    Supaya hadiah dan kartu cap kamu aman. Lanjut dengan WhatsApp dan PIN 4 angka.
                </p>

                <form onSubmit={submit} className="mt-5 space-y-3">
                    <label className="block">
                        <span className="text-ink mb-1.5 block text-[11px] font-semibold">Nomor WhatsApp</span>
                        <Input
                            inputMode="tel"
                            value={form.data.whatsapp}
                            onChange={(e) => form.setData('whatsapp', e.target.value)}
                            placeholder="08xx xxxx xxxx"
                        />
                    </label>
                    <label className="block">
                        <span className="text-ink mb-1.5 block text-[11px] font-semibold">PIN</span>
                        <Input
                            inputMode="numeric"
                            maxLength={4}
                            value={form.data.pin}
                            onChange={(e) => form.setData('pin', e.target.value)}
                            placeholder="4 angka"
                        />
                    </label>
                    {form.errors.pin && <span className="text-danger block text-[11px]">{form.errors.pin}</span>}

                    <Checkbox checked={agree} onChange={setAgree}>
                        Saya setuju Syarat dan Ketentuan serta Kebijakan Privasi.
                    </Checkbox>

                    <PrimaryButton type="submit" disabled={!agree || form.processing}>
                        {form.processing ? 'Memeriksa...' : 'Masuk dan lanjut'}
                    </PrimaryButton>
                </form>

                <div className="mt-5 flex items-center justify-between text-[11px]">
                    <Link href="/participant/daftar" className="text-ink font-semibold underline underline-offset-2">
                        Belum punya akun? Daftar
                    </Link>
                    <Link href="/participant/lupa-pin" className="text-ink font-semibold underline underline-offset-2">
                        Lupa PIN?
                    </Link>
                </div>
            </div>
        </ParticipantLayout>
    );
}
