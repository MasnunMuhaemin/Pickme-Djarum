import { Checkbox, DateField, Field, Input, PageHeader, PrimaryButton, Select, TextLink } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

const jobs = [
    { value: 'karyawan', label: 'Karyawan' },
    { value: 'wiraswasta', label: 'Wiraswasta' },
    { value: 'mahasiswa', label: 'Pelajar atau mahasiswa' },
    { value: 'irt', label: 'Ibu rumah tangga' },
];
const areas = [
    { value: 'w07', label: 'W07 - Warung Djarum' },
    { value: 'w08', label: 'W08 - Warung Melati' },
];

export default function Daftar() {
    const [agree, setAgree] = useState(false);
    const [birth, setBirth] = useState('');
    const [job, setJob] = useState('');
    const [area, setArea] = useState('w07');

    function continueRegistration() {
        const born = new Date(birth);
        const today = new Date();
        let age = today.getFullYear() - born.getFullYear();
        const monthDiff = today.getMonth() - born.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) age--;
        router.visit(age < 21 ? '/participant/daftar/belum-bisa' : '/participant/persetujuan');
    }

    return (
        <ParticipantLayout>
            <PageHeader back="/participant" title="Daftar" />
            <div className="bg-cream-deep h-1">
                <div className="bg-lime h-full w-1/4" />
            </div>

            <div className="flex-1 px-4 pt-4 pb-8 lg:mx-auto lg:w-full lg:max-w-[760px] lg:px-8 lg:pt-6 lg:pb-10">
                <p className="text-ink-soft text-[12px] leading-relaxed lg:max-w-[560px]">
                    Nama lengkap, WhatsApp, dan data lain yang dibutuhkan untuk ikut program.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <Field label="Nama lengkap">
                        <Input placeholder="Nama sesuai KTP" />
                    </Field>
                    <Field label="Nomor WhatsApp">
                        <Input inputMode="tel" placeholder="08xx xxxx xxxx" />
                    </Field>
                    <Field label="Tanggal lahir" hint="Minimal 21 tahun.">
                        <DateField value={birth} onChange={setBirth} placeholder="Pilih tanggal lahir" />
                    </Field>
                    <Field label="Pekerjaan">
                        <Select value={job} onChange={setJob} options={jobs} placeholder="Pilih pekerjaan" />
                    </Field>
                    <Field label="Area kode">
                        <Select value={area} onChange={setArea} options={areas} placeholder="Pilih area kode" />
                    </Field>
                    <Field label="PIN" hint="4 angka, jangan yang mudah ditebak.">
                        <Input inputMode="numeric" maxLength={4} placeholder="4 angka" />
                    </Field>
                </div>

                <div className="mt-4">
                    <Checkbox checked={agree} onChange={setAgree}>
                        Saya setuju <span className="text-ink font-semibold underline underline-offset-2">Syarat dan Ketentuan</span> serta{' '}
                        <span className="text-ink font-semibold underline underline-offset-2">Kebijakan Privasi</span>.
                    </Checkbox>
                </div>

                <PrimaryButton onClick={continueRegistration} disabled={!agree || !birth} className="mt-4 lg:max-w-[260px]">
                    Lanjut
                </PrimaryButton>

                <p className="text-ink-soft mt-4 text-center text-[11px]">
                    Sudah punya akun?{' '}
                    <Link href="/participant/papan?masuk=1" className="text-ink font-semibold underline underline-offset-2">
                        Masuk
                    </Link>
                </p>
                <TextLink href="/participant/daftar/belum-bisa" className="text-ink-soft mt-2 block text-center text-[10px] font-medium">
                    Lihat contoh akun yang belum memenuhi syarat
                </TextLink>
            </div>
        </ParticipantLayout>
    );
}
