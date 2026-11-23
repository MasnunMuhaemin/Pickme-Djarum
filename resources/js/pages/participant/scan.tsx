import { LogoutButton } from '@/features/participant/components/ui';
import { Link, router, useForm, usePage } from '@inertiajs/react';
import { Camera, Gift, LayoutGrid, QrCode, Trophy } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type Outlet = { code: string; name: string };

type Detector = new (options: { formats: string[] }) => {
    detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
};

function isScanPath(url: string): boolean {
    return url.split('?')[0] === '/participant/scan';
}

export default function Scan({ outlets = [] }: { outlets?: Outlet[] }) {
    const { url } = usePage();
    const video = useRef<HTMLVideoElement>(null);
    const [cameraOn, setCameraOn] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const form = useForm({ code: outlets[0]?.code ?? 'W07' });

    function submit(e?: FormEvent) {
        e?.preventDefault();
        if (!form.data.code) return;
        form.post('/participant/scan', { preserveScroll: true });
    }

    useEffect(() => {
        let stream: MediaStream | null = null;
        let timer: number | undefined;
        let stopped = false;

        async function start() {
            const Detector = (window as unknown as { BarcodeDetector?: Detector }).BarcodeDetector;
            if (!navigator.mediaDevices?.getUserMedia) {
                setCameraError('Browser tidak mendukung kamera. Gunakan input kode titik di bawah.');
                return;
            }
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
                if (stopped || !video.current) return;
                video.current.srcObject = stream;
                await video.current.play();
                setCameraOn(true);
                setCameraError('');

                if (!Detector) return;
                const detector = new Detector({ formats: ['qr_code'] });
                timer = window.setInterval(async () => {
                    if (!video.current || video.current.readyState < 2) return;
                    try {
                        const codes = await detector.detect(video.current);
                        if (codes[0]?.rawValue) {
                            window.clearInterval(timer);
                            form.setData('code', codes[0].rawValue);
                            router.post('/participant/scan', { code: codes[0].rawValue }, { preserveScroll: true });
                        }
                    } catch {
                        // frame belum siap
                    }
                }, 500);
            } catch {
                setCameraError('Izin kamera ditolak. Ketuk tombol di bawah untuk mengaktifkan, atau isi kode titik manual.');
            }
        }

        start();
        return () => {
            stopped = true;
            if (timer) window.clearInterval(timer);
            stream?.getTracks().forEach((track) => track.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const compactNav = isScanPath(url);
    const navItems = [
        { key: 'papan', href: '/participant/papan', icon: LayoutGrid },
        { key: 'hadiah', href: '/participant/hadiah', icon: Gift },
        { key: 'kartu', href: '/participant/kartu', icon: Trophy },
    ];

    return (
        <div className="text-cream min-h-dvh bg-[#1b2b29]">
            <div className="relative mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-gradient-to-b from-[#1b2b29] via-[#162422] to-[#0f1c1a] shadow-2xl md:max-w-none md:shadow-none">
                <header className="flex h-14 shrink-0 items-center gap-2 px-4">
                    <LogoutButton dark className="text-cream/70 bg-white/10 hover:bg-white/20" />
                    <Link href="/participant" aria-label="Kembali" className="text-cream/70 grid size-10 place-items-center rounded-full bg-white/10">
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
                    </Link>
                </header>

                <div className="px-6 pt-2">
                    <h1 className="text-[38px] leading-none font-extrabold tracking-tight">Scan QR papan</h1>
                    <p className="text-cream/60 mt-2 text-[13px]">Arahkan kamera ke QR di papan warung.</p>
                </div>

                <div className="relative mx-auto mt-8 aspect-square w-[290px] max-w-[86vw]">
                    <video ref={video} playsInline muted className="size-full rounded-2xl bg-black/40 object-cover" />
                    {!cameraOn && (
                        <div className="absolute inset-0 grid place-items-center rounded-2xl bg-black/30">
                            <div className="text-center">
                                <QrCode className="text-cream/30 mx-auto size-16" />
                                <p className="text-cream/40 mt-3 text-[11px]">Menyiapkan kamera...</p>
                            </div>
                        </div>
                    )}
                    <span className="border-lime absolute top-0 left-0 size-12 rounded-tl-2xl border-t-4 border-l-4" />
                    <span className="border-lime absolute top-0 right-0 size-12 rounded-tr-2xl border-t-4 border-r-4" />
                    <span className="border-lime absolute bottom-0 left-0 size-12 rounded-bl-2xl border-b-4 border-l-4" />
                    <span className="border-lime absolute right-0 bottom-0 size-12 rounded-br-2xl border-r-4 border-b-4" />
                </div>

                <div className="mt-8 flex flex-col items-center px-6">
                    <span className="bg-lime text-ink rounded-full px-4 py-1.5 text-[12px] font-extrabold">Titik warung terbaca otomatis</span>
                    <p className="text-cream/60 mt-6 text-center text-[13px]">Beli rokok dulu, lalu scan QR di papan.</p>

                    {cameraError && (
                        <button
                            onClick={() => window.location.reload()}
                            className="border-cream/30 mt-4 flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold"
                        >
                            <Camera className="size-4" />
                            Aktifkan kamera
                        </button>
                    )}

                    <form onSubmit={submit} className="border-cream/15 bg-cream/5 mt-6 w-full rounded-2xl border p-3">
                        <p className="text-cream/60 text-[10px] font-bold tracking-widest uppercase">Kode titik manual</p>
                        <div className="mt-2 flex gap-2">
                            <input
                                value={form.data.code}
                                onChange={(e) => form.setData('code', e.target.value.toUpperCase())}
                                placeholder="W07"
                                className="border-cream/20 bg-cream/10 text-cream h-11 min-w-0 flex-1 rounded-lg border px-3 font-mono font-extrabold uppercase outline-none"
                            />
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="bg-lime text-ink rounded-lg px-4 text-[11px] font-bold disabled:opacity-50"
                            >
                                Buka
                            </button>
                        </div>
                        {outlets.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {outlets.map((outlet) => (
                                    <button
                                        key={outlet.code}
                                        type="button"
                                        onClick={() => form.setData('code', outlet.code)}
                                        className="border-cream/20 rounded-full border px-2.5 py-1 text-[10px] font-semibold"
                                    >
                                        {outlet.code}
                                    </button>
                                ))}
                            </div>
                        )}
                    </form>

                    <Link href="/participant/qr-tidak-dikenal" className="text-lime mt-3 text-[11px] font-semibold underline underline-offset-2">
                        QR tidak terdaftar? Lihat contoh
                    </Link>
                </div>

                {compactNav && (
                    <nav className="bg-night mt-auto flex items-center justify-around border-t border-white/10 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
                        {navItems.map((item) => (
                            <Link key={item.key} href={item.href} className="text-cream/70 flex size-11 items-center justify-center">
                                <item.icon className="size-6" />
                            </Link>
                        ))}
                    </nav>
                )}
            </div>
        </div>
    );
}
