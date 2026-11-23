import { Checkbox, DateField, Field, Input, PageHeader, PrimaryButton, Select, TextLink } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { deviceId } from '@/lib/device';
import { Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Area = { id: number; name: string };

export default function Daftar({ areas }: { areas: Area[] }) {
    const form = useForm({
        name: '',
        whatsapp: '',
        birth_date: '',
        area_id: '',
        pin: '',
        device_id: deviceId(),
        agree: false,
    });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/participant/daftar', { preserveScroll: true });
    }

    return (
        <ParticipantLayout>
            <PageHeader back="/participant" title="Daftar" />
            <div className="bg-cream-deep h-1">
                <div className="bg-lime h-full w-1/4" />
            </div>

            <form onSubmit={submit} className="flex-1 px-4 pt-4 pb-8 md:mx-auto md:w-full md:max-w-[760px] md:px-8 md:pt-6 md:pb-10">
                <p className="text-ink-soft text-[12px] leading-relaxed md:max-w-[560px]">
                    Nama lengkap, WhatsApp, dan data lain yang dibutuhkan untuk ikut program.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <Field label="Nama panggilan">
                        <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Nama panggilan" />
                        {form.errors.name && <span className="text-danger mt-1 block text-[11px]">{form.errors.name}</span>}
                    </Field>
                    <Field label="Nomor WhatsApp">
                        <Input
                            inputMode="tel"
                            value={form.data.whatsapp}
                            onChange={(e) => form.setData('whatsapp', e.target.value)}
                            placeholder="08xx xxxx xxxx"
                        />
                        {form.errors.whatsapp && <span className="text-danger mt-1 block text-[11px]">{form.errors.whatsapp}</span>}
                    </Field>
                    <Field label="Tanggal lahir" hint="Minimal 21 tahun.">
                        <DateField value={form.data.birth_date} onChange={(v) => form.setData('birth_date', v)} placeholder="Pilih tanggal lahir" />
                        {form.errors.birth_date && <span className="text-danger mt-1 block text-[11px]">{form.errors.birth_date}</span>}
                    </Field>
                    <Field label="Area kos">
                        <Select
                            value={form.data.area_id}
                            onChange={(v) => form.setData('area_id', v)}
                            options={areas.map((a) => ({ value: String(a.id), label: a.name }))}
                            placeholder="Pilih area kosmu"
                        />
                        {form.errors.area_id && <span className="text-danger mt-1 block text-[11px]">{form.errors.area_id}</span>}
                    </Field>
                    <Field label="PIN" hint="4 angka, jangan yang mudah ditebak.">
                        <Input
                            inputMode="numeric"
                            maxLength={4}
                            value={form.data.pin}
                            onChange={(e) => form.setData('pin', e.target.value)}
                            placeholder="4 angka"
                        />
                        {form.errors.pin && <span className="text-danger mt-1 block text-[11px]">{form.errors.pin}</span>}
                    </Field>
                </div>

                <div className="mt-4">
                    <Checkbox checked={form.data.agree} onChange={(v) => form.setData('agree', v)}>
                        Saya setuju <span className="text-ink font-semibold underline underline-offset-2">Syarat dan Ketentuan</span> serta{' '}
                        <span className="text-ink font-semibold underline underline-offset-2">Kebijakan Privasi</span>.
                    </Checkbox>
                </div>

                <PrimaryButton type="submit" disabled={!form.data.agree || form.processing} className="mt-4 md:max-w-[260px]">
                    {form.processing ? 'Menyimpan...' : 'Lanjut'}
                </PrimaryButton>

                <p className="text-ink-soft mt-4 text-center text-[11px]">
                    Sudah punya akun?{' '}
                    <Link href="/participant/papan" className="text-ink font-semibold underline underline-offset-2">
                        Masuk
                    </Link>
                </p>
                <TextLink href="/participant/daftar/belum-bisa" className="text-ink-soft mt-2 block text-center text-[10px] font-medium">
                    Lihat contoh akun yang belum memenuhi syarat
                </TextLink>
            </form>
        </ParticipantLayout>
    );
}
