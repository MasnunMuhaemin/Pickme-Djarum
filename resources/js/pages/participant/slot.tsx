import { NoticeSheet } from '@/features/participant/components/ui';
import { Head, Link, useForm } from '@inertiajs/react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { FormEvent, useEffect, useRef, useState } from 'react';

type Slot = { code: string | null; position: string };
type Claim = { id: number; status: string; claim_code?: string; slot?: Slot | null } | null;
type BoardSlot = { position: string; status: string };

export default function Slot({ claim, board = [] }: { claim?: Claim; board?: BoardSlot[] }) {
    const position = claim?.slot?.position ?? '';
    const slotCode = claim?.slot?.code ?? '';
    const [revealed, setRevealed] = useState(false);
    const [copied, setCopied] = useState(false);
    const [chars, setChars] = useState(['', '', '', '', '', '']);
    const refs = useRef<(HTMLInputElement | null)[]>([]);
    const form = useForm({ code: '' });

    function changeAt(index: number, value: string) {
        const clean = value
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(-1);
        const next = [...chars];
        next[index] = clean;
        setChars(next);
        form.setData('code', next.join('').replace(/ /g, ''));
        if (clean && index < 5) refs.current[index + 1]?.focus();
    }

    function keyDownAt(index: number, key: string) {
        if (key === 'Backspace' && !chars[index] && index > 0) refs.current[index - 1]?.focus();
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        form.setData('code', chars.join('').replace(/ /g, ''));
        form.post('/participant/slot', { preserveScroll: true });
    }

    /** "Salin" langsung mengisi 6 kotak kode (dan menyalin ke clipboard bila browser mengizinkan). */
    async function copyCode() {
        const clean = slotCode
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .slice(0, 6);
        setChars(Array.from({ length: 6 }, (_, i) => clean[i] ?? ''));
        form.setData('code', clean);
        form.clearErrors('code');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
        refs.current[Math.min(clean.length, 5)]?.blur();

        try {
            await navigator.clipboard.writeText(slotCode);
        } catch {
            // Clipboard bisa ditolak browser; kotak kode tetap sudah terisi.
        }
    }

    const error = form.errors.code;
    const boxes = [0, 1, 2, 3, 4, 5];
    // Kode ditolak: popup. "Coba lagi" mengosongkan kotak kode.
    const [errorOpen, setErrorOpen] = useState(false);
    useEffect(() => setErrorOpen(Boolean(error)), [error]);
    const unknownCode = error?.startsWith('Kode tidak dikenal');

    function tryAgain() {
        setErrorOpen(false);
        setChars(['', '', '', '', '', '']);
        form.setData('code', '');
        form.clearErrors('code');
        refs.current[0]?.focus();
    }

    return (
        <div className="bg-cream text-ink min-h-dvh">
            <Head title="Ambil slot" />
            <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col md:max-w-[720px]">
                <header className="lime-hero px-6 pt-8 pb-14">
                    <h1 className="text-[34px] leading-none font-extrabold tracking-tight">Ambil slot</h1>
                </header>

                <main className="bg-cream relative -mt-7 flex flex-1 flex-col rounded-t-[28px] px-5 pt-5 pb-8">
                    <div className="flex items-center justify-between gap-3">
                        <span className="bg-lime-soft text-ink inline-flex w-fit items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold">
                            <Check className="size-3.5" />
                            Foto terkirim
                        </span>
                        {claim?.claim_code && (
                            <span className="text-right">
                                <span className="text-ink-soft block text-[9px] font-bold tracking-widest uppercase">Kode klaim</span>
                                <span className="font-mono text-[18px] font-extrabold tracking-[0.15em]">{claim.claim_code}</span>
                            </span>
                        )}
                    </div>

                    <div className="mt-5">
                        <div className="grid grid-cols-[16px_repeat(5,1fr)] items-center gap-1.5">
                            <span />
                            {[1, 2, 3, 4, 5].map((n) => (
                                <span key={n} className="text-ink-soft text-center text-[10px] font-bold">
                                    {n}
                                </span>
                            ))}
                            {['A', 'B', 'C', 'D', 'E'].map((row) => (
                                <div key={row} className="contents">
                                    <span className="text-ink-soft text-[10px] font-bold">{row}</span>
                                    {[1, 2, 3, 4, 5].map((col) => {
                                        const slotPosition = `${row}${col}`;
                                        const taken = board.find((s) => s.position === slotPosition)?.status === 'used';
                                        const selected = slotPosition === position;
                                        return (
                                            <div
                                                key={slotPosition}
                                                className={`grid h-11 place-items-center rounded-xl text-[11px] font-extrabold ${
                                                    selected
                                                        ? 'slot-pop bg-lime text-ink z-10 rounded-2xl shadow-[0_12px_28px_-10px_rgba(27,58,26,0.55)]'
                                                        : taken
                                                          ? 'bg-[#0b0b0b] text-lime'
                                                          : 'bg-cream-deep text-ink-soft'
                                                }`}
                                            >
                                                {selected ? (
                                                    <span className="text-center leading-none">
                                                        <span className="block text-[13px]">{slotPosition}</span>
                                                        <span className="mt-0.5 block text-[7px] tracking-[0.12em]">SLOT KAMU</span>
                                                    </span>
                                                ) : (
                                                    slotPosition
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                        <p className="text-ink mt-4 text-[12px] leading-relaxed">
                            Ambil slot {position} di papan warung (atau slot lain yang masih kosong), lalu masukkan kode 6 karakter yang tercetak di
                            baliknya.
                        </p>
                    </div>

                    {slotCode && (
                        <div className="border-ink/25 mt-5 rounded-2xl border border-dashed p-3">
                            <div className="flex items-center justify-between">
                                <p className="text-ink-soft text-[9px] font-bold tracking-widest uppercase">Kode slot</p>
                                <button
                                    type="button"
                                    onClick={() => setRevealed(!revealed)}
                                    className="text-ink flex items-center gap-1 text-[10px] font-bold"
                                >
                                    {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                                    {revealed ? 'Sembunyikan' : 'Lihat kode'}
                                </button>
                            </div>
                            {revealed ? (
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <span className="font-mono text-2xl font-extrabold tracking-[0.25em]">{slotCode}</span>
                                    <button
                                        type="button"
                                        onClick={copyCode}
                                        className="bg-ink text-cream flex items-center gap-1 rounded-full px-3 py-1.5 text-[10px] font-bold"
                                    >
                                        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
                                        {copied ? 'Tersalin' : 'Salin'}
                                    </button>
                                </div>
                            ) : (
                                <p className="text-ink-soft mt-2 text-[11px]">Ketuk "Lihat kode" untuk reveal kode slotmu.</p>
                            )}
                            <p className="text-ink-soft mt-2 text-[10px] leading-relaxed">
                                Kode ini tercetak di balik slot fisik {position}. Salin ke kolom di bawah untuk memeriksa.
                            </p>
                        </div>
                    )}

                    <form onSubmit={submit} className="mt-5">
                        <p className="text-[13px] font-extrabold">Masukkan kode</p>
                        <div className="mt-2 flex justify-between gap-1.5">
                            {boxes.map((i) => (
                                <input
                                    key={i}
                                    ref={(el) => {
                                        refs.current[i] = el;
                                    }}
                                    value={chars[i] ?? ''}
                                    onChange={(e) => changeAt(i, e.target.value)}
                                    onKeyDown={(e) => keyDownAt(i, e.key)}
                                    onFocus={(e) => e.target.select()}
                                    maxLength={1}
                                    aria-label={`Karakter kode ${i + 1}`}
                                    className={`border-ink focus:ring-lime h-14 min-w-0 flex-1 rounded-xl border-2 bg-white text-center font-mono text-xl font-extrabold outline-none focus:ring-2 ${error ? 'border-danger' : ''}`}
                                />
                            ))}
                        </div>
                        <p className="text-ink-soft mt-2 text-[10px] leading-relaxed">
                            Kode 6 karakter di balik slot. Huruf besar otomatis, spasi dan strip diabaikan.
                        </p>

                        <button
                            type="submit"
                            disabled={form.processing || chars.join('').replace(/ /g, '').length !== 6}
                            className="bg-lime text-ink mt-5 flex h-12 w-full items-center justify-center rounded-full text-[13px] font-extrabold disabled:opacity-50"
                        >
                            {form.processing ? 'Memeriksa...' : 'Kirim kode'}
                        </button>
                    </form>

                    {!claim && (
                        <Link href="/participant/scan" className="text-ink mt-4 block text-center text-[11px] font-semibold underline">
                            Scan QR dan foto bungkus dulu
                        </Link>
                    )}
                </main>
            </div>
            <NoticeSheet
                open={errorOpen}
                onClose={tryAgain}
                tone="warn"
                icon="!"
                stacked
                title={unknownCode ? 'Kode tidak dikenal' : 'Kode belum cocok'}
                text={unknownCode ? 'Cek lagi huruf dan angkanya, lalu masukkan ulang kodenya.' : (error ?? '')}
                primary={{ label: 'Coba lagi', onClick: tryAgain }}
            />
        </div>
    );
}
