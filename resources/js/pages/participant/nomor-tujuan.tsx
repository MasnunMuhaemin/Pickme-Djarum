import { Input, PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import type { Reward } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Voucher = { id: number; type: string; status: string; failed_attempts?: number };

const digitsOnly = (value: string) => value.replace(/\D/g, '').slice(0, 20);

/**
 * Nomor meter atau ID pelanggan PLN untuk token listrik: diisi dua kali dan harus sama, lalu layar ringkasan
 * (jenis, nilai, nomor) sebelum dikirim (PRD bagian 14).
 */
export default function NomorTujuan({ voucher, reward, maxFailures = 3 }: { voucher: Voucher; reward: Reward; maxFailures?: number }) {
    const form = useForm({ destination: '', destination_confirmation: '' });
    const [reviewing, setReviewing] = useState(false);
    const mismatch = form.data.destination_confirmation.length > 0 && form.data.destination !== form.data.destination_confirmation;
    const ready = form.data.destination.length >= 8 && form.data.destination === form.data.destination_confirmation;

    function review(e: FormEvent) {
        e.preventDefault();
        if (ready) setReviewing(true);
    }

    function send() {
        form.post(`/participant/nomor-tujuan/${voucher.id}`, { preserveScroll: true, onError: () => setReviewing(false) });
    }

    return (
        <ParticipantLayout nav="hadiah">
            <PageHeader back="/participant/hadiah" title="Nomor tujuan" />
            <div className="flex-1 px-4 pb-8 md:mx-auto md:w-full md:max-w-[560px] md:px-8 md:pt-2 md:pb-10">
                {voucher.status === 'rejected' && (
                    <div className="mb-4 rounded-2xl bg-[#fbe3e0] p-3.5 text-[12px] leading-relaxed">
                        <p className="text-danger font-extrabold">Nomor sebelumnya belum bisa diproses</p>
                        <p className="text-ink mt-0.5">
                            Isi ulang nomor yang benar. Percobaan salah: {voucher.failed_attempts ?? 0} dari {maxFailures}. Setelah {maxFailures}{' '}
                            kali, admin akan menghubungimu lewat WhatsApp.
                        </p>
                    </div>
                )}

                {!reviewing ? (
                    <form onSubmit={review}>
                        <p className="text-ink-soft text-[12px] leading-relaxed">
                            Isi nomor meter atau ID pelanggan PLN dua kali. Token dikirim ke nomor yang kamu isi.
                        </p>

                        <div className="mt-4 space-y-3">
                            <label className="block">
                                <span className="text-ink mb-1.5 block text-xs font-semibold">Nomor meter atau ID pelanggan</span>
                                <Input
                                    inputMode="numeric"
                                    autoComplete="off"
                                    value={form.data.destination}
                                    onChange={(e) => form.setData('destination', digitsOnly(e.target.value))}
                                    placeholder="Contoh: 12345678901"
                                />
                                {form.errors.destination && <span className="text-danger mt-1 block text-[11px]">{form.errors.destination}</span>}
                            </label>
                            <label className="block">
                                <span className="text-ink mb-1.5 block text-xs font-semibold">Ulangi nomor</span>
                                <Input
                                    inputMode="numeric"
                                    autoComplete="off"
                                    onPaste={(e) => e.preventDefault()}
                                    value={form.data.destination_confirmation}
                                    onChange={(e) => form.setData('destination_confirmation', digitsOnly(e.target.value))}
                                    placeholder="Ketik ulang nomor yang sama"
                                />
                                {mismatch && <span className="text-danger mt-1 block text-[11px]">Kedua isian nomor belum sama.</span>}
                            </label>
                        </div>

                        <PrimaryButton type="submit" disabled={!ready} className="mt-5">
                            Lanjut ke ringkasan
                        </PrimaryButton>
                    </form>
                ) : (
                    <div>
                        <p className="text-ink-soft text-[12px] leading-relaxed">Periksa sekali lagi sebelum dikirim.</p>
                        <div className="divide-ink/8 mt-4 divide-y rounded-2xl bg-white px-4 text-[13px]">
                            <div className="flex justify-between gap-4 py-3">
                                <span className="text-ink-soft">Jenis</span>
                                <span className="font-bold">{reward.title}</span>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <span className="text-ink-soft">Nilai</span>
                                <span className="font-bold">{reward.value}</span>
                            </div>
                            <div className="flex justify-between gap-4 py-3">
                                <span className="text-ink-soft">Nomor</span>
                                <span className="font-mono font-bold tracking-wide">{form.data.destination}</span>
                            </div>
                        </div>
                        <p className="text-ink-soft mt-3 text-[11px] leading-relaxed">
                            Pastikan nomor benar. Token yang sudah dikirim tidak bisa ditarik kembali.
                        </p>
                        <PrimaryButton onClick={send} disabled={form.processing} className="mt-5">
                            {form.processing ? 'Mengirim...' : 'Kirim nomor'}
                        </PrimaryButton>
                        <button
                            type="button"
                            onClick={() => setReviewing(false)}
                            className="text-ink mt-3 w-full text-[12px] font-bold underline underline-offset-2"
                        >
                            Ubah nomor
                        </button>
                    </div>
                )}
            </div>
        </ParticipantLayout>
    );
}
