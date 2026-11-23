import { PageHeader } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { useForm } from '@inertiajs/react';
import { Camera, RotateCcw } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

/**
 * P5: foto hanya dari kamera langsung, tanpa pilihan galeri (PRD FR-35). Jam watermark adalah jam server saat
 * layar ini dibuka (openedAt); server menandai klaim bila foto diterima terlalu lama setelahnya.
 */
export default function FotoBungkus({ outlet = 'W07', openedAt }: { outlet?: string; openedAt?: string }) {
    const video = useRef<HTMLVideoElement>(null);
    const stream = useRef<MediaStream | null>(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const form = useForm<{ photo: File | null; outlet: string }>({ photo: null, outlet });

    useEffect(() => {
        let stopped = false;

        async function start() {
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('unsupported');
                return;
            }
            try {
                const media = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                });
                if (stopped) {
                    media.getTracks().forEach((track) => track.stop());
                    return;
                }
                stream.current = media;
                if (video.current) {
                    video.current.srcObject = media;
                    await video.current.play();
                }
                setCameraOn(true);
                setCameraError('');
            } catch {
                setCameraError('denied');
            }
        }

        start();
        return () => {
            stopped = true;
            stream.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    function capture() {
        const source = video.current;
        if (!source || !source.videoWidth) return;

        const canvas = document.createElement('canvas');
        canvas.width = source.videoWidth;
        canvas.height = source.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
            if (!blob) return;
            form.setData('photo', new File([blob], 'bungkus.png', { type: 'image/png' }));
            setPreview(URL.createObjectURL(blob));
        }, 'image/png');
    }

    function retake() {
        form.setData('photo', null);
        setPreview(null);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        if (!form.data.photo) return;
        form.post('/participant/foto', { forceFormData: true, preserveScroll: true });
    }

    const stamp = `${openedAt ?? '--:--:--'} · ${outlet} · kode klaim muncul setelah foto`;

    return (
        <ParticipantLayout hideBottomNav>
            <PageHeader back="/participant/papan" title="Foto bungkus" />
            <form onSubmit={submit} className="flex flex-1 flex-col">
                <div className="px-4 md:mx-auto md:w-full md:max-w-[600px] md:px-8">
                    <p className="text-ink-soft text-[12px] leading-relaxed">
                        Ambil foto langsung dari kamera. Watermark waktu, titik, dan kode klaim ditambahkan server.
                    </p>
                </div>

                <div className="relative mx-4 mt-3 flex min-h-[420px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-b from-[#33352f] via-[#23251f] to-[#121410] px-6 md:mx-auto md:mt-4 md:min-h-[520px] md:w-full md:max-w-[600px]">
                    <span className="border-cream/70 absolute top-6 left-6 size-8 rounded-tl-lg border-t-[3px] border-l-[3px]" />
                    <span className="border-cream/70 absolute top-6 right-6 size-8 rounded-tr-lg border-t-[3px] border-r-[3px]" />
                    <span className="border-cream/70 absolute bottom-6 left-6 size-8 rounded-bl-lg border-b-[3px] border-l-[3px]" />
                    <span className="border-cream/70 absolute right-6 bottom-6 size-8 rounded-br-lg border-r-[3px] border-b-[3px]" />

                    {preview ? (
                        <img src={preview} alt="Pratinjau foto bungkus" className="size-full max-h-[360px] rounded-xl object-cover" />
                    ) : (
                        <>
                            <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" />
                            {!cameraOn && (
                                <div className="absolute inset-0 grid place-items-center bg-black/40 text-center">
                                    <div>
                                        <Camera className="text-cream/40 mx-auto size-12" />
                                        <p className="text-cream/60 mt-3 text-[11px]">Menyiapkan kamera...</p>
                                    </div>
                                </div>
                            )}
                            <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/70 to-transparent" />
                            <p className="text-cream absolute top-6 left-1/2 max-w-[260px] -translate-x-1/2 rounded-full bg-black/70 px-3 py-2 text-center text-[10px] leading-relaxed shadow-lg">
                                Letakkan bungkus di dalam kotak. Pastikan kode dan kemasan terlihat jelas.
                            </p>
                        </>
                    )}

                    <span className="text-cream absolute bottom-12 left-6 rounded bg-black/75 px-2 py-1 font-mono text-[9px] tracking-wide shadow">
                        {stamp}
                    </span>
                    <div className="text-cream absolute bottom-6 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-[10px] shadow">
                        <Camera className="size-3.5" />
                        Kamera belakang
                    </div>
                </div>

                {cameraError && (
                    <div className="mx-4 mt-3 rounded-2xl bg-[#fbe3e0] p-3.5 text-[11px] leading-relaxed md:mx-auto md:w-full md:max-w-[600px]">
                        <p className="text-danger font-extrabold">
                            {cameraError === 'unsupported' ? 'Browser ini tidak bisa membuka kamera' : 'Kamera belum diizinkan'}
                        </p>
                        <ol className="text-ink mt-1.5 list-decimal space-y-1 pl-4">
                            <li>Buka halaman ini di Chrome atau Safari, bukan dari dalam Instagram atau WhatsApp.</li>
                            <li>Ketuk ikon gembok di kolom alamat, lalu izinkan Kamera.</li>
                            <li>Muat ulang halaman ini.</li>
                        </ol>
                        <p className="text-ink-soft mt-1.5">Masih gagal? Hubungi admin lewat WhatsApp. Foto dari galeri tidak bisa dipakai.</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="bg-ink text-cream mt-2.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                <div className="flex flex-col items-center gap-2 px-4 py-5">
                    <div className="flex items-center gap-6">
                        {preview && (
                            <button
                                type="button"
                                onClick={retake}
                                className="text-cream/80 flex flex-col items-center gap-1 text-[10px] font-semibold"
                            >
                                <span className="border-cream/40 grid size-12 place-items-center rounded-full border">
                                    <RotateCcw className="size-5" />
                                </span>
                                Ulangi
                            </button>
                        )}

                        {!preview && (
                            <button
                                type="button"
                                onClick={capture}
                                aria-label="Ambil foto"
                                className="border-ink/15 grid size-[68px] place-items-center rounded-full border-4 bg-white shadow-lg transition active:scale-95"
                            >
                                <span className="bg-ink size-12 rounded-full" />
                            </button>
                        )}
                    </div>

                    <p className="text-ink-soft text-center text-[10px] leading-relaxed">
                        Foto dari luar. Jangan sampai terlipat, blur, atau terpotong.
                    </p>
                    {form.errors.photo && <span className="text-danger text-[11px]">{form.errors.photo}</span>}
                    <button
                        type="submit"
                        disabled={!form.data.photo || form.processing}
                        className="text-ink bg-lime mt-1 rounded-full px-5 py-2 text-[12px] font-bold disabled:opacity-50"
                    >
                        {form.processing ? 'Menyimpan...' : 'Kirim foto'}
                    </button>
                    <p className="text-ink-soft text-center text-[10px] leading-relaxed">
                        Setelah foto dikirim, sistem memilih slot dan kode klaimmu.
                    </p>
                </div>
            </form>
        </ParticipantLayout>
    );
}
