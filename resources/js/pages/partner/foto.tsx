import { NoticeSheet } from '@/features/participant/components/ui';
import { useCameraCapture } from '@/hooks/use-camera-capture';
import type { VoucherCard } from '@/pages/partner/kode';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Camera, ChevronLeft } from 'lucide-react';
import { FormEvent, useState } from 'react';

/**
 * Foto bukti penukaran: hanya dari kamera, tanpa galeri. Setelah foto diambil, layar berganti ke "Cek foto bukti"
 * dengan tombol Kirim foto dan Ambil ulang. Server mencetak waktu, nama mitra, kode, dan nilai di foto.
 */
export default function FotoBukti({ voucher, openedAt, adminWhatsapp }: { voucher: VoucherCard; openedAt: string; adminWhatsapp?: string | null }) {
    const adminLink = adminWhatsapp
        ? `https://wa.me/${adminWhatsapp}?text=${encodeURIComponent(`Halo admin Pickme, kamera tidak bisa dibuka untuk foto bukti voucher ${voucher.code}.`)}`
        : null;
    const partnerName = (usePage().props.partner as { name: string } | null)?.name ?? '';
    const { video, cameraOn, cameraError, setCameraError, capture } = useCameraCapture('bukti.jpg');
    const [preview, setPreview] = useState<string | null>(null);
    const [sendFailed, setSendFailed] = useState(false);
    const form = useForm<{ photo: File | null }>({ photo: null });

    async function shoot() {
        const file = await capture();
        if (!file) return;
        form.setData('photo', file);
        setPreview(URL.createObjectURL(file));
    }

    function retake() {
        setSendFailed(false);
        form.setData('photo', null);
        setPreview(null);
    }

    function submit(e?: FormEvent) {
        e?.preventDefault();
        if (!form.data.photo) return;
        setSendFailed(false);
        // Gagal kirim (koneksi putus atau server menolak): lembar "Foto belum terkirim".
        let sent = false;
        form.post(`/mitra/kode/${voucher.code}/foto`, {
            forceFormData: true,
            onSuccess: () => (sent = true),
            onFinish: () => !sent && setSendFailed(true),
        });
    }

    const stamp = `${openedAt} WIB`;

    return (
        <div className="text-cream min-h-dvh bg-[#0f0c08]">
            <Head title="Foto bukti · Mitra" />
            <form
                onSubmit={submit}
                className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-y-auto bg-gradient-to-b from-[#4a3a28] via-[#2a2117] to-[#0f0c08] px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
            >
                {/* Kembali ke halaman terakhir (Cek kode atau Rincian tukar); dibuka langsung: ke Rincian tukar. */}
                <button
                    type="button"
                    onClick={() => (window.history.length > 1 ? window.history.back() : router.visit(`/mitra/tukar/${voucher.code}`))}
                    aria-label="Kembali"
                    className="bg-ink text-lime grid size-10 shrink-0 place-items-center rounded-full"
                >
                    <ChevronLeft className="size-5" strokeWidth={2.5} />
                </button>
                <h1 className="mt-3 text-[30px] leading-none font-extrabold tracking-tight">{preview ? 'Cek foto bukti' : 'Foto bukti'}</h1>

                {/* Bingkai bidik: sudut lime; ilustrasi produk selama kamera disiapkan, cap foto di kiri bawah. */}
                <div className="mt-8 flex min-h-[240px] flex-1 items-center justify-center">
                    <div className="relative aspect-[4/5] h-full max-h-[400px] max-w-full">
                        <div className="absolute inset-2 overflow-hidden rounded-2xl">
                            {preview ? (
                                <img src={preview} alt="Pratinjau foto bukti" className="size-full object-cover" />
                            ) : (
                                <>
                                    <video ref={video} playsInline muted className="size-full object-cover" />
                                    {!cameraOn && (
                                        <div className="absolute inset-0 grid place-items-center">
                                            <div className="flex h-[66%] w-[50%] flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-b from-[#d4b062] via-[#a77c3c] to-[#6e4718]">
                                                <span className="w-[74%] rounded-xl bg-[#ece4c4]/90 py-2 text-center text-[20px] font-extrabold text-[#6e4718]">
                                                    KLM
                                                </span>
                                                <Camera className="size-7 text-[#ece4c4]/90" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <span className="border-lime absolute top-0 left-0 size-10 rounded-tl-xl border-t-4 border-l-4" />
                        <span className="border-lime absolute top-0 right-0 size-10 rounded-tr-xl border-t-4 border-r-4" />
                        <span className="border-lime absolute bottom-0 left-0 size-10 rounded-bl-xl border-b-4 border-l-4" />
                        <span className="border-lime absolute right-0 bottom-0 size-10 rounded-br-xl border-r-4 border-b-4" />
                        <span className="text-cream absolute bottom-1 left-3 max-w-[calc(100%-1.5rem)] rounded-md bg-black/85 px-2.5 py-1 text-[11px] leading-snug font-bold">
                            {stamp}
                            <br />
                            {partnerName} · {voucher.code} · {voucher.value}
                        </span>
                    </div>
                </div>

                {preview ? (
                    <p className="text-cream mt-4 text-center text-[12px] font-semibold">Waktu, nama warung dan kode sudah tercetak di foto.</p>
                ) : (
                    <>
                        <p className="text-cream mt-4 text-center text-[12px] font-semibold">Foto hanya dari kamera. Tidak ada pilihan galeri.</p>
                        <p className="text-cream/85 mt-1.5 text-center text-[12px] leading-snug">
                            Foto produk yang diberikan ke peserta. Nama warung, kode, tanggal dan jam tercetak di foto.
                        </p>
                    </>
                )}
                {form.errors.photo && <p className="mt-2 text-center text-[12px] font-bold text-[#f3a59a]">{form.errors.photo}</p>}

                <div className="shrink-0 pt-6">
                    {preview ? (
                        <div className="space-y-2.5">
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="bg-lime text-ink h-14 w-full rounded-full text-[16px] font-extrabold disabled:opacity-50"
                            >
                                {form.processing ? 'Mengirim...' : 'Kirim foto'}
                            </button>
                            <button
                                type="button"
                                onClick={retake}
                                disabled={form.processing}
                                className="border-cream h-14 w-full rounded-full border-2 text-[16px] font-extrabold disabled:opacity-50"
                            >
                                Ambil ulang
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={shoot}
                                disabled={!cameraOn}
                                aria-label="Ambil foto"
                                className="border-cream relative size-[76px] shrink-0 rounded-full border-[5px] transition active:scale-95 disabled:opacity-50"
                            >
                                <span className="bg-cream absolute inset-[4px] rounded-full" />
                            </button>
                        </div>
                    )}
                </div>
            </form>

            <NoticeSheet
                open={Boolean(cameraError)}
                onClose={() => setCameraError('')}
                tone="warn"
                icon="!"
                title={cameraError === 'unsupported' ? 'Kamera tidak bisa dibuka' : 'Kamera belum diizinkan'}
                text={
                    cameraError === 'unsupported'
                        ? 'Browser ini tidak bisa membuka kamera. Buka halaman ini di Chrome atau Safari.'
                        : 'Aktifkan izin kamera di pengaturan browser, lalu coba lagi.'
                }
                stacked
                secondary={
                    adminLink
                        ? { label: 'Hubungi admin', onClick: () => window.open(adminLink, '_blank', 'noopener') }
                        : { label: 'Lewati dulu', href: '/mitra' }
                }
                primary={{ label: 'Coba lagi', onClick: () => window.location.reload() }}
            />
            <NoticeSheet
                open={sendFailed && !form.errors.photo}
                onClose={() => setSendFailed(false)}
                tone="warn"
                icon="!"
                title="Foto belum terkirim"
                text="Periksa koneksi internet, lalu kirim ulang."
                stacked
                secondary={{ label: 'Ambil ulang', onClick: retake }}
                primary={{ label: 'Kirim ulang', onClick: () => submit() }}
            />
        </div>
    );
}
