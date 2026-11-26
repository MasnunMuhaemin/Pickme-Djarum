import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from 'react';

/** Bagian kartu yang harus tergosok sebelum kartu dianggap terbuka penuh. */
// Kartu terbuka setelah 85% penutup tergosok; sisa penutup lalu memudar.
const SCRATCH_DONE = 0.85;
const CONFETTI_COLORS = ['#8fc31f', '#1b3a1a', '#e23b2e', '#fdf8d5', '#72a012', '#f5c542', '#ef8b2c'];

type Phase = 'cover' | 'done';

function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Lapisan penutup kartu: gelap, titik-titik, tanda tanya lime, dan label slot (digambar di canvas supaya bisa digosok). */
function paintCover(canvas: HTMLCanvasElement, label: string) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const { width: w, height: h } = rect;

    const bg = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h * 0.45, w * 0.8);
    bg.addColorStop(0, '#24401d');
    bg.addColorStop(1, '#0b0b0b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = 'rgba(143,195,31,0.18)';
    for (let x = w * 0.08; x < w; x += w * 0.12) for (let y = h * 0.08; y < h; y += h * 0.09) ctx.fillRect(x, y, 2, 2);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#8fc31f';
    ctx.font = `800 ${Math.round(w * 0.04)}px Instrument Sans, sans-serif`;
    ctx.fillText(label.toUpperCase(), w / 2, h * 0.14);
    ctx.font = `800 ${Math.round(w * 0.42)}px Instrument Sans, sans-serif`;
    ctx.fillText('?', w / 2, h * 0.6);
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 ${Math.round(w * 0.062)}px Instrument Sans, sans-serif`;
    ctx.fillText('Hadiahmu masih rahasia', w / 2, h * 0.82);
}

/** Bagian penutup yang sudah terhapus (0 sampai 1), dihitung dari sampel piksel transparan. */
function clearedRatio(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
        total++;
        if (data[i] < 128) clear++;
    }
    return total ? clear / total : 0;
}

/**
 * Layar "Saatnya buka hadiah": kartu digosok (koin mengikuti jari, persen tergosok tampil). Setelah terbuka tampil
 * "Selamat!" dengan konfeti penuh layar, lalu tombol ke hasil klaim.
 */
export function PrizeReveal({ label, onDone }: { label: string; onDone: () => void }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const last = useRef<{ x: number; y: number } | null>(null);
    const moves = useRef(0);
    const [phase, setPhase] = useState<Phase>('cover');
    const [progress, setProgress] = useState(0);
    const [coverGone, setCoverGone] = useState(false);
    const [coin, setCoin] = useState<{ x: number; y: number } | null>(null);
    const reduced = prefersReducedMotion();

    useEffect(() => {
        if (canvasRef.current) paintCover(canvasRef.current, label);
    }, [label]);

    function finish() {
        setProgress(100);
        setCoin(null);
        setPhase('done');
        // Sisa penutup memudar dulu (lihat kelas canvas), baru dilepas.
        window.setTimeout(() => setCoverGone(true), reduced ? 0 : 700);
    }

    function scratch(e: PointerEvent<HTMLCanvasElement>) {
        const canvas = canvasRef.current;
        if (!canvas || phase !== 'cover') return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCoin({ x, y });
        if (!last.current) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = rect.width * 0.12;
        ctx.beginPath();
        ctx.moveTo(last.current.x, last.current.y);
        ctx.lineTo(x, y);
        ctx.stroke();
        last.current = { x, y };
        // Hitung ulang persen tiap beberapa gerakan saja supaya ringan di HP.
        if (++moves.current % 6 === 0) {
            const ratio = clearedRatio(canvas);
            // Persen yang tampil = bagian kartu yang benar-benar tergosok.
            setProgress(Math.min(99, Math.round(ratio * 100)));
            if (ratio >= SCRATCH_DONE) finish();
        }
    }

    const done = phase === 'done';
    const status = done ? 'Selesai · 100%' : progress > 0 ? `Digosok ${progress}%` : 'Gosok kartu untuk membukanya';

    return (
        <div className="bg-cream fixed inset-0 z-[90] overflow-y-auto" role="dialog" aria-modal aria-label="Buka hadiah">
            <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col md:max-w-[560px]">
                <header className="lime-hero px-5 pt-8 pb-10">
                    <p className="text-ink/70 text-[10px] font-extrabold tracking-[0.2em] uppercase">Kartu hadiah</p>
                    <h1 className="mt-1 text-[28px] leading-none font-extrabold tracking-tight md:text-[34px]">
                        {done ? 'Selamat!' : 'Saatnya buka hadiah'}
                    </h1>
                </header>

                <main className="relative -mt-5 flex flex-1 flex-col items-center overflow-hidden rounded-t-[28px] bg-[repeating-conic-gradient(from_0deg_at_50%_32%,#f2f7d6_0deg_9deg,#fbf8e6_9deg_18deg)] px-5 pt-8 pb-8">
                    {/* Ilustrasi kota memenuhi area dari bawah sampai atas, lalu memudar di tengah. */}
                    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                        <img
                            src="/images/banner.webp"
                            alt=""
                            className="absolute inset-0 size-full object-cover object-bottom opacity-35 select-none"
                            style={{
                                maskImage: 'linear-gradient(to top, black 0%, black 26%, transparent 72%)',
                                WebkitMaskImage: 'linear-gradient(to top, black 0%, black 26%, transparent 72%)',
                            }}
                        />
                    </div>

                    {/* Sinar hijau dari tengah, memudar ke luar seperti pancaran matahari. */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute top-[30%] left-1/2 aspect-square w-[820px] -translate-x-1/2 -translate-y-1/2 bg-[repeating-conic-gradient(from_0deg_at_50%_50%,rgba(143,195,31,0.6)_0deg_8deg,rgba(253,248,213,0)_8deg_18deg)]"
                        style={{
                            maskImage: 'radial-gradient(circle, black 0%, black 38%, transparent 72%)',
                            WebkitMaskImage: 'radial-gradient(circle, black 0%, black 38%, transparent 72%)',
                        }}
                    />

                    {/* Cahaya hijau di belakang kartu. */}
                    <span
                        aria-hidden
                        className="pointer-events-none absolute top-[34%] left-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(143,195,31,0.7)_0%,rgba(114,160,18,0.35)_40%,transparent_70%)] blur-sm"
                    />

                    {/* Konfeti: satu keping SVG dipakai ulang dengan warna dan ukuran berbeda. */}
                    {done && !reduced && (
                        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
                            {Array.from({ length: 180 }, (_, i) => {
                                // Sebaran semu-acak yang tetap (tanpa Math.random) supaya hasil render stabil.
                                const r = (n: number) => ((i * 9301 + n * 49297) % 233280) / 233280;
                                return (
                                    <span
                                        key={i}
                                        className="confetti-flake absolute -top-8 block animate-[confetti_var(--dur)_cubic-bezier(.2,.6,.4,1)_forwards]"
                                        style={
                                            {
                                                left: `${r(1) * 100}%`,
                                                width: `${6 + Math.round(r(6) * 10)}px`,
                                                height: `${9 + Math.round(r(7) * 12)}px`,
                                                backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                                                animationDelay: `${Math.round(r(2) * 900) - 250}ms`,
                                                '--dur': `${(2.6 + r(3) * 2.2).toFixed(2)}s`,
                                                '--dx': `${Math.round((r(4) - 0.5) * 300)}px`,
                                                '--rot': `${Math.round(540 + r(5) * 900)}deg`,
                                            } as CSSProperties
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}

                    {/* Kartu: muka hasil di bawah, lapisan penutup (canvas) di atas. */}
                    <div className="relative w-[min(76vw,300px)]">
                        <span
                            aria-hidden
                            className="absolute -inset-12 rounded-[56px] bg-[radial-gradient(circle,rgba(143,195,31,0.9),rgba(114,160,18,0.4)_55%,transparent_74%)] blur-2xl"
                        />
                        <span aria-hidden className="bg-ink absolute inset-0 translate-x-2 translate-y-2 -rotate-3 rounded-[22px] opacity-80" />
                        <div
                            className={cn(
                                'relative aspect-[3/4] w-full overflow-hidden rounded-[22px] shadow-[0_18px_40px_-16px_rgba(0,0,0,0.5)] ring-4 ring-[#c9e88f] transition-transform duration-500',
                                done && !reduced && 'scale-[1.04]',
                            )}
                        >
                            <div className="bg-lime absolute inset-0 flex flex-col items-center justify-between px-4 py-[12%] text-center">
                                <p className="text-ink text-[11px] font-extrabold tracking-[0.18em] uppercase">Selamat · {label}</p>
                                <span className="relative grid aspect-square w-[42%] shrink-0 place-items-center">
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 bg-[#0b0b0b] [clip-path:polygon(50%_0%,61%_11%,75%_5%,79%_20%,94%_22%,91%_37%,100%_50%,91%_63%,94%_78%,79%_80%,75%_95%,61%_89%,50%_100%,39%_89%,25%_95%,21%_80%,6%_78%,9%_63%,0%_50%,9%_37%,6%_22%,21%_20%,25%_5%,39%_11%)]"
                                    />
                                    <Check className="relative size-[45%] text-white" strokeWidth={3.5} />
                                </span>
                                <p className="text-ink text-[17px] font-extrabold">Hadiahmu terbuka!</p>
                            </div>
                            {!coverGone && (
                                <canvas
                                    ref={canvasRef}
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Kartu hadiah tertutup. Gosok kartu untuk membuka, atau tekan Enter."
                                    // Gosok tidak bisa dengan keyboard; Enter atau Spasi membuka kartu.
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), finish())}
                                    className={cn(
                                        'focus-visible:ring-lime-dark absolute inset-0 size-full cursor-none touch-none outline-none focus-visible:ring-4',
                                        'transition-[opacity,transform] duration-700 ease-out',
                                        done && 'pointer-events-none scale-105 opacity-0',
                                    )}
                                    onPointerDown={(e) => {
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        last.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
                                        scratch(e);
                                    }}
                                    onPointerMove={scratch}
                                    onPointerUp={() => (last.current = null)}
                                    onPointerLeave={() => {
                                        last.current = null;
                                        setCoin(null);
                                    }}
                                />
                            )}
                            {coin && (
                                <span
                                    aria-hidden
                                    className="border-ink pointer-events-none absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] bg-[radial-gradient(circle_at_35%_35%,#fbf8e6,#cfc8a0)] shadow-md"
                                    style={{ left: coin.x, top: coin.y }}
                                />
                            )}
                        </div>
                    </div>

                    <div className="relative mt-6 w-full max-w-[300px] text-center">
                        <p className="text-ink rounded-full bg-white px-4 py-2 text-[12px] font-bold shadow-sm" aria-live="polite">
                            {status}
                        </p>
                        <div className="mx-auto mt-3 h-1.5 w-3/4 overflow-hidden rounded-full bg-[#e8e1c4]">
                            <div
                                className="bg-lime-dark h-full rounded-full transition-[width] duration-300"
                                style={{ width: `${done ? 100 : progress}%` }}
                            />
                        </div>
                        {!done && (
                            <>
                                <p className="text-ink/55 mt-5 text-[11px]">Isi kartu bisa berupa</p>
                                <div className="mt-2 flex flex-wrap justify-center gap-2">
                                    {['Voucher', 'Merchandise', 'Limited edition'].map((chip) => (
                                        <span key={chip} className="text-ink rounded-full bg-white px-3 py-1.5 text-[11px] font-bold shadow-sm">
                                            {chip}
                                        </span>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative mt-auto w-full max-w-[360px] pt-8">
                        {done && (
                            <button
                                type="button"
                                onClick={onDone}
                                className="bg-lime text-ink h-12 w-full rounded-full text-[14px] font-extrabold shadow-md"
                            >
                                Lihat hadiahku
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
