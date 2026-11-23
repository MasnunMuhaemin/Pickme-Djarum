import { LimePage } from '@/features/participant/components/lime-page';
import { Input, PrimaryButton } from '@/features/participant/components/ui';
import type { Reward } from '@/features/participant/rewards';
import { useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type Voucher = { id: number; type: string; status: string; failed_attempts?: number };

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 20);

function SummaryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between gap-4 py-1">
            <span className="text-ink-soft">{label}</span>
            <span className={mono ? 'font-mono font-extrabold tracking-wide' : 'font-extrabold'}>{value}</span>
        </div>
    );
}

/**
 * Nomor meter atau ID pelanggan PLN untuk token listrik: diisi dua kali dan harus sama, dengan ringkasan jenis,
 * nilai, dan nomor sebelum dikirim (PRD bagian 14).
 */
export default function NomorTujuan({ voucher, reward, maxFailures = 3 }: { voucher: Voucher; reward: Reward; maxFailures?: number }) {
    const form = useForm({ destination: '', destination_confirmation: '' });
    const mismatch = form.data.destination_confirmation.length > 0 && form.data.destination !== form.data.destination_confirmation;
    const ready = form.data.destination.length >= 8 && form.data.destination === form.data.destination_confirmation;

    function submit(e?: FormEvent) {
        e?.preventDefault();
        if (ready) form.post(`/participant/nomor-tujuan/${voucher.id}`, { preserveScroll: true });
    }

    return (
        <LimePage
            title="Nomor tujuan"
            subtitle="Isi nomor meter atau ID pelanggan PLN dua kali supaya tidak salah."
            back="/participant/hadiah"
            nav="hadiah"
            hideBottomNav
            footer={
                <PrimaryButton onClick={() => submit()} disabled={!ready || form.processing} className="h-13 text-[15px] font-extrabold">
                    {form.processing ? 'Mengirim...' : 'Kirim'}
                </PrimaryButton>
            }
        >
            <form onSubmit={submit}>
                {voucher.status === 'rejected' && (
                    <div className="mb-4 rounded-2xl bg-[#fbe3e0] p-3.5 text-[12px] leading-relaxed">
                        <p className="text-danger font-extrabold">Nomor sebelumnya belum bisa diproses</p>
                        <p className="text-ink mt-0.5">
                            Isi ulang nomor yang benar. Percobaan salah: {voucher.failed_attempts ?? 0} dari {maxFailures}.
                        </p>
                    </div>
                )}

                <label className="block">
                    <span className="mb-2 block text-[13px] font-extrabold">Nomor meter atau ID pelanggan</span>
                    <Input
                        inputMode="numeric"
                        autoComplete="off"
                        value={form.data.destination}
                        onChange={(e) => form.setData('destination', digitsOnly(e.target.value))}
                        placeholder="Hanya angka"
                    />
                    {form.errors.destination && <span className="text-danger mt-1 block text-[11px]">{form.errors.destination}</span>}
                </label>
                <label className="mt-4 block">
                    <span className="mb-2 block text-[13px] font-extrabold">Ulangi nomor</span>
                    <Input
                        inputMode="numeric"
                        autoComplete="off"
                        onPaste={(e) => e.preventDefault()}
                        value={form.data.destination_confirmation}
                        onChange={(e) => form.setData('destination_confirmation', digitsOnly(e.target.value))}
                        placeholder="Harus sama dengan di atas"
                    />
                </label>
                <p className={mismatch ? 'text-danger mt-2 text-[12px] font-semibold' : 'text-ink-soft mt-2 text-[12px]'}>
                    {mismatch ? 'Kedua isian nomor belum sama.' : 'Kedua isian harus sama.'}
                </p>

                <div className="mt-5 rounded-2xl bg-white px-4 py-3.5 text-[14px]">
                    <p className="text-ink-soft mb-1.5 text-[10px] font-bold tracking-[0.15em] uppercase">Ringkasan sebelum dikirim</p>
                    <SummaryRow label="Jenis" value={reward.title} />
                    {reward.value && <SummaryRow label="Nilai" value={reward.value} />}
                    {ready && <SummaryRow label="Nomor" value={form.data.destination} mono />}
                </div>

                <p className="text-ink-soft mt-4 text-[12px] leading-relaxed">
                    Maksimal {maxFailures} kali salah nomor. Setelah itu admin menghubungi kamu lewat WhatsApp.
                </p>
            </form>
        </LimePage>
    );
}
