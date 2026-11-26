import { AuthSheet, type AuthMode } from '@/features/participant/components/auth-sheet';
import { BackLink, LogoutButton } from '@/features/participant/components/ui';
import { Head, router } from '@inertiajs/react';
import { Camera, QrCode } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Area = { id: number; name: string };

type Detector = new (options: { formats: string[] }) => {
    detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

export default function Scan({ modal, areas = [] }: { modal?: string; areas?: Area[] }) {
    const [authMode, setAuthMode] = useState<AuthMode>(modal === 'login' || modal === 'register' ? modal : null);
    const authOpen = authMode !== null;

    function closeAuth() {
        setAuthMode(null);
        if (modal) window.history.replaceState({}, '', '/participant/scan');
    }
    const video = useRef<HTMLVideoElement>(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState('');

    useEffect(() => {
        // Kamera dijeda selama popup masuk/daftar terbuka.
        if (authOpen) {
            setCameraOn(false);
            return;
        }
        let stream: MediaStream | null = null;
        let timer: number | undefined;
        let stopped = false;

        async function start() {
            const Detector = (window as unknown as { BarcodeDetector?: Detector }).BarcodeDetector;
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('Browser tidak mendukung kamera. Buka halaman ini di Chrome atau Safari.');
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
                if (stopped || !video.current) return;
                video.current.srcObject = stream;
                await video.current.play();
                setCameraOn(true);
                setCameraError('');
            } catch {
                setCameraError('Izin kamera ditolak. Ketuk tombol di bawah lalu izinkan kamera.');
                return;
            }

            // BarcodeDetector hanya ada di sebagian browser dan di sebagian HP Android ada tetapi tidak membaca.
            // jsQR selalu dipakai sebagai pembaca cadangan untuk setiap frame.
            let detector: InstanceType<Detector> | null = null;
            try {
                detector = Detector ? new Detector({ formats: ['qr_code'] }) : null;
            } catch {
                detector = null;
            }
            const jsQR = (await import('jsqr')).default;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d', { willReadFrequently: true });

            async function readFrame(source: HTMLVideoElement): Promise<string | null> {
                if (detector) {
                    try {
                        const codes = await detector.detect(source);
                        if (codes[0]?.rawValue) return codes[0].rawValue;
                    } catch {
                        detector = null;
                    }
                }
                if (!ctx || !source.videoWidth) return null;
                // Ambil bagian tengah frame (area bingkai bidik), maksimal 800 px: QR tetap cukup besar untuk
                // dibaca walau kamera HP beresolusi tinggi, dan tetap ringan.
                const side = Math.min(source.videoWidth, source.videoHeight);
                const sx = (source.videoWidth - side) / 2;
                const sy = (source.videoHeight - side) / 2;
                const size = Math.min(800, side);
                canvas.width = size;
                canvas.height = size;
                ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
                const image = ctx.getImageData(0, 0, size, size);
                return jsQR(image.data, size, size, { inversionAttempts: 'attemptBoth' })?.data ?? null;
            }

            if (stopped) return;
            timer = window.setInterval(async () => {
                if (!video.current || video.current.readyState < 2) return;
                try {
                    const value = await readFrame(video.current);
                    if (value) {
                        window.clearInterval(timer);
                        // preserveState: false agar halaman di-mount ulang dan popup masuk muncul setelah redirect.
                        router.post('/participant/scan', { code: value }, { preserveScroll: true, preserveState: false });
                    }
                } catch {
                    // frame belum siap
                }
            }, 400);
        }

        start();
        return () => {
            stopped = true;
            if (timer) window.clearInterval(timer);
            stream?.getTracks().forEach((track) => track.stop());
        };
    }, [authOpen]);

    return (
        <div className="text-cream animate-in fade-in min-h-dvh bg-black duration-300 motion-reduce:animate-none">
            <Head title="Scan QR" />
            {/* Kamera memenuhi layar; area di luar kotak bidik digelapkan tipis lewat bayangan kotak. */}
            <div className="relative mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden md:max-w-none">
                <video ref={video} playsInline muted className="absolute inset-0 size-full object-cover" />
                {!cameraOn && <div className="absolute inset-0 bg-gradient-to-b from-[#1b2b29] via-[#162422] to-[#0f1c1a]" />}

                <header className="relative z-10 flex h-14 shrink-0 items-center justify-between gap-2 px-4">
                    <BackLink
                        fallback="/participant"
                        className="text-cream grid size-10 place-items-center rounded-full bg-black/35 backdrop-blur-sm"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </BackLink>
                    {/* Hanya tampil saat sudah masuk. */}
                    <LogoutButton dark className="bg-black/35 backdrop-blur-sm" />
                </header>

                <div className="relative z-10 px-6 pt-2">
                    <h1 className="text-[38px] leading-none font-extrabold tracking-tight drop-shadow">Scan QR papan</h1>
                    <p className="text-cream/80 mt-2 text-[13px] drop-shadow">Arahkan kamera ke QR di papan warung.</p>
                </div>

                <div className="relative flex min-h-0 flex-1 items-center justify-center">
                    <div className="relative aspect-square w-[270px] max-w-[78vw] rounded-2xl shadow-[0_0_0_200vmax_rgba(0,0,0,0.6)]">
                        {!cameraOn && (
                            <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/30">
                                <div className="text-center">
                                    <QrCode className="text-cream/30 mx-auto size-16" />
                                    <p className="text-cream/50 mt-3 text-[11px]">Menyiapkan kamera...</p>
                                </div>
                            </div>
                        )}
                        <span className="border-lime absolute top-0 left-0 size-12 rounded-tl-2xl border-t-4 border-l-4" />
                        <span className="border-lime absolute top-0 right-0 size-12 rounded-tr-2xl border-t-4 border-r-4" />
                        <span className="border-lime absolute bottom-0 left-0 size-12 rounded-bl-2xl border-b-4 border-l-4" />
                        <span className="border-lime absolute right-0 bottom-0 size-12 rounded-br-2xl border-r-4 border-b-4" />
                    </div>
                </div>

                <div className="relative z-10 flex flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
                    <span className="bg-lime text-ink rounded-full px-4 py-1.5 text-[12px] font-extrabold">Titik warung terbaca otomatis</span>
                    <p className="text-cream/80 mt-4 text-center text-[13px] drop-shadow">Beli rokok dulu, lalu scan QR di papan.</p>

                    {cameraError && (
                        <button
                            onClick={() => window.location.reload()}
                            className="border-cream/40 mt-4 flex items-center gap-2 rounded-full border bg-black/35 px-4 py-2 text-[11px] font-bold"
                        >
                            <Camera className="size-4" />
                            Aktifkan kamera
                        </button>
                    )}
                </div>
            </div>

            <AuthSheet mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} areas={areas} />
        </div>
    );
}
