import { BackLink, LogoutButton } from '@/features/participant/components/ui';
import { Head, Link, useForm } from '@inertiajs/react';
import { Camera, ChevronLeft, RotateCcw } from 'lucide-react';
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

        // Kamera HP bisa 4K: PNG ukuran penuh mudah lebih dari 5 MB dan ditolak batas unggah server
        // (nginx client_max_body_size, PHP upload_max_filesize). Diperkecil ke sisi terpanjang 1600 px
        // dan dikirim sebagai JPEG supaya ukurannya sekitar 200-500 KB.
        const MAX_SIDE = 1600;
        const scale = Math.min(1, MAX_SIDE / Math.max(source.videoWidth, source.videoHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(source.videoWidth * scale);
        canvas.height = Math.round(source.videoHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
            (blob) => {
                if (!blob) return;
                form.setData('photo', new File([blob], 'bungkus.jpg', { type: 'image/jpeg' }));
                setPreview(URL.createObjectURL(blob));
            },
            'image/jpeg',
            0.85,
        );
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

    const stamp = `${openedAt ?? '--:--:--'} · ${outlet} · KLM-····`;

    return (
        <div className="text-cream animate-in fade-in min-h-dvh bg-[#0f0c08] duration-300 motion-reduce:animate-none">
            <Head title="Foto bungkus" />
            <form
                onSubmit={submit}
                className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-y-auto bg-gradient-to-b from-[#4a3a28] via-[#2a2117] to-[#0f0c08] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] [scrollbar-gutter:stable_both-edges] md:max-w-[560px]"
            >
                <header className="flex items-center justify-between">
                    <BackLink
                        fallback="/participant"
                        className="text-cream/70 hover:text-cream grid size-10 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/15"
                    >
                        <ChevronLeft className="size-4" strokeWidth={2.5} />
                    </BackLink>
                    <LogoutButton dark className="bg-white/10" />
                </header>

                <h1 className="mt-2 text-[32px] leading-none font-extrabold tracking-tight">Foto bungkus</h1>
                <p className="mt-1.5 text-[14px] font-semibold text-[#e9d8a6]">Arahkan kamera ke bungkus</p>

                {/* Warung dari QR terakhir; pindah warung lewat scan ulang. */}
                <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="bg-lime text-ink rounded-full px-3 py-1 text-[12px] font-extrabold">Titik {outlet}</span>
                    <Link href="/participant/scan?ganti=1" className="text-cream text-[12px] font-extrabold underline underline-offset-2">
                        Scan warung lain
                    </Link>
                </div>

                {/* Bingkai bidik: sudut lime, kamera langsung di dalamnya. */}
                <div className="mt-3 flex min-h-[200px] flex-1 items-center justify-center">
                    <div className="relative aspect-[4/5] h-full max-h-[420px] max-w-full">
                        <div className="absolute inset-2 overflow-hidden rounded-2xl">
                            {preview ? (
                                <img src={preview} alt="Pratinjau foto bungkus" className="size-full object-cover" />
                            ) : (
                                <>
                                    <video ref={video} playsInline muted className="size-full object-cover" />
                                    {!cameraOn && (
                                        <div className="absolute inset-0 grid place-items-center">
                                            {/* Ilustrasi bungkus selama kamera disiapkan. */}
                                            <div className="flex h-[62%] w-[52%] flex-col items-center justify-center gap-4 rounded-3xl bg-gradient-to-b from-[#d4b062] via-[#a77c3c] to-[#6e4718] shadow-2xl">
                                                <span className="w-[74%] rounded-xl bg-[#ece4c4]/90 py-2 text-center text-[22px] font-extrabold text-[#6e4718]">
                                                    KLM
                                                </span>
                                                <Camera className="size-8 text-[#ece4c4]/90" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <span className="border-lime absolute top-0 left-0 size-12 rounded-tl-2xl border-t-[5px] border-l-[5px]" />
                        <span className="border-lime absolute top-0 right-0 size-12 rounded-tr-2xl border-t-[5px] border-r-[5px]" />
                        <span className="border-lime absolute bottom-0 left-0 size-12 rounded-bl-2xl border-b-[5px] border-l-[5px]" />
                        <span className="border-lime absolute right-0 bottom-0 size-12 rounded-br-2xl border-r-[5px] border-b-[5px]" />

                        <span className="text-cream absolute bottom-7 left-4 rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-bold tracking-wide">
                            {stamp}
                        </span>
                    </div>
                </div>

                <p className="mt-3 text-center text-[13px] font-extrabold">Foto hanya dari kamera. Tidak ada pilihan galeri.</p>
                <p className="text-cream/60 mt-0.5 text-center text-[11px]">Kamera tidak terbuka? Buka halaman ini di Chrome atau Safari.</p>

                {cameraError && (
                    <div className="mt-3 rounded-2xl bg-white/10 p-3.5 text-[12px] leading-relaxed">
                        <p className="font-extrabold text-[#f3a59a]">
                            {cameraError === 'unsupported' ? 'Browser ini tidak bisa membuka kamera' : 'Kamera belum diizinkan'}
                        </p>
                        <ol className="text-cream/85 mt-1.5 list-decimal space-y-1 pl-4">
                            <li>Buka halaman ini di Chrome atau Safari, bukan dari dalam Instagram atau WhatsApp.</li>
                            <li>Ketuk ikon gembok di kolom alamat, lalu izinkan Kamera.</li>
                            <li>Muat ulang halaman ini.</li>
                        </ol>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="bg-cream text-ink mt-2.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {form.errors.photo && <p className="mt-3 text-center text-[12px] font-bold text-[#f3a59a]">{form.errors.photo}</p>}

                {/* Tombol bawah: rana sebelum foto; ulangi dan kirim setelah foto. */}
                <div className={preview ? 'flex shrink-0 items-center gap-4 pt-4' : 'flex shrink-0 justify-center pt-4'}>
                    {preview ? (
                        <>
                            <button
                                type="button"
                                onClick={retake}
                                disabled={form.processing}
                                className="border-cream/40 flex h-14 items-center gap-2 rounded-full border px-5 text-[14px] font-extrabold disabled:opacity-50"
                            >
                                <RotateCcw className="size-4" />
                                Ulangi
                            </button>
                            <button
                                type="submit"
                                disabled={!form.data.photo || form.processing}
                                className="bg-lime text-ink h-14 flex-1 rounded-full text-[15px] font-extrabold disabled:opacity-50"
                            >
                                {form.processing ? 'Mengirim...' : 'Kirim foto'}
                            </button>
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={capture}
                            disabled={!cameraOn}
                            aria-label="Ambil foto"
                            className="border-cream relative size-[72px] shrink-0 rounded-full border-[5px] transition active:scale-95 disabled:opacity-50"
                        >
                            {/* Posisi absolut: tepat di tengah di semua browser, termasuk Safari iOS. */}
                            <span className="bg-cream absolute inset-[4px] rounded-full" />
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
