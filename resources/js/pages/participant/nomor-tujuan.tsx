import { Input, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Voucher = { id: number; type: string; status: string; destination?: string | null; failed_attempts?: number };

export default function NomorTujuan({ voucher }: { voucher?: Voucher }) {
    const form = useForm({ destination: '', name: '', whatsapp: '' });

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post(`/participant/nomor-tujuan${voucher ? `/${voucher.id}` : ''}`, { preserveScroll: true });
    }

    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Nomor tujuan" />
            <form onSubmit={submit} className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[760px] md:px-8 md:pt-2 md:pb-10">
                <p className="text-ink-soft text-[12px] leading-relaxed md:max-w-[560px]">
                    Isi nomor meteran atau ID pelanggan. Token dikirim ke nomor yang kamu isi.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="block">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Nomor meter atau ID pelanggan</span>
                        <Input
                            inputMode="numeric"
                            value={form.data.destination}
                            onChange={(e) => form.setData('destination', e.target.value)}
                            placeholder="Contoh: 12345678901"
                        />
                        {form.errors.destination && <span className="text-danger mt-1 block text-[11px]">{form.errors.destination}</span>}
                    </label>
                    <label className="block">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Nama</span>
                        <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Nama sesuai meteran" />
                        {form.errors.name && <span className="text-danger mt-1 block text-[11px]">{form.errors.name}</span>}
                    </label>
                    <label className="block md:col-span-2">
                        <span className="text-ink mb-1.5 block text-xs font-semibold">Nomor WhatsApp</span>
                        <Input
                            inputMode="tel"
                            value={form.data.whatsapp}
                            onChange={(e) => form.setData('whatsapp', e.target.value)}
                            placeholder="08xx xxxx xxxx"
                        />
                        {form.errors.whatsapp && <span className="text-danger mt-1 block text-[11px]">{form.errors.whatsapp}</span>}
                    </label>
                </div>

                {voucher?.failed_attempts ? <p className="text-danger mt-3 text-[10px]">Percobaan salah: {voucher.failed_attempts} dari 3.</p> : null}
                <p className="text-ink-soft mt-3 text-[10px] leading-relaxed">
                    Pastikan nomor benar. Token yang sudah dikirim tidak bisa ditarik kembali.
                </p>

                <PrimaryButton type="submit" disabled={form.processing} className="mt-5 md:max-w-[260px]">
                    {form.processing ? 'Menyimpan...' : 'Kirim'}
                </PrimaryButton>
            </form>
        </ParticipantLayout>
    );
}
