import { AuthSheet, type AuthMode } from '@/features/participant/components/auth-sheet';
import { Badge, OutlineButton, PageHeader, PrimaryButton, Sheet } from '@/features/participant/components/ui';
import { boardSlots, pickerCodes } from '@/features/participant/data';
import ParticipantLayout from '@/layouts/participant-layout';
import { deviceId } from '@/lib/device';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Check, Lock, Pause } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';

const disabledCodes = ['A1', 'F6', 'J9', 'N3', 'T9', 'V2'];

type Area = { id: number; name: string };

type PapanProps = {
    outlet?: { id: number; code: string; name: string; status: string };
    slots?: { position: string; code: string; status: string }[];
    availableCount?: number;
    totalSlots?: number;
    activeClaim?: { id: number; status: string; slot_id: number } | null;
    modal?: string;
    areas?: Area[];
};

export default function Papan({ outlet, slots: serverSlots, availableCount = 15, totalSlots = 25, activeClaim, modal, areas = [] }: PapanProps) {
    const { url, props } = usePage();
    const params = new URLSearchParams(url.split('?')[1] ?? '');
    const isLoggedIn = Boolean((props.auth as { participant?: unknown })?.participant);
    const caps = useCaps();
    const slots = serverSlots?.length ? serverSlots : boardSlots.map((s) => ({ position: s.code, code: '', status: s.taken ? 'used' : 'empty' }));
    const startForm = useForm({ device_id: deviceId(), claim: '', outlet: outlet?.code ?? 'W07' });

    function startClaim(e?: FormEvent) {
        e?.preventDefault();
        if (!isLoggedIn) {
            setAuthMode('login');
            return;
        }
        startForm.post('/participant/klaim/mulai', { preserveScroll: true });
    }

    const [paused, setPaused] = useState(params.has('dijeda'));
    const [picker, setPicker] = useState(params.has('pilih'));
    const [authMode, setAuthMode] = useState<AuthMode>(modal === 'login' || modal === 'register' ? modal : null);
    const [selected, setSelected] = useState('C3');

    function closeAuth() {
        setAuthMode(null);
        if (modal) window.history.replaceState({}, '', '/participant/papan');
    }

    useEffect(() => {
        const next = new URLSearchParams(url.split('?')[1] ?? '');
        setPaused(next.has('dijeda'));
        setPicker(next.has('pilih'));
    }, [url]);

    return (
        <ParticipantLayout nav="papan">
            <PageHeader back="/participant" title={`Papan ${outlet?.code ?? 'W07'}`} right={<Badge>Kartu {caps} / 10</Badge>} />

            <div className="bg-night text-cream flex items-center justify-between px-4 py-2.5">
                <div>
                    <p className="text-[11px] font-bold">10.00 - 12.00 WIB</p>
                    <p className="text-cream/70 flex items-center gap-1.5 text-[10px]">
                        <span className="bg-lime size-1.5 rounded-full" />
                        Sedang berjalan
                    </p>
                </div>
                <button onClick={() => setPaused(true)} className="border-cream/25 rounded-full border px-2.5 py-1 text-[10px] font-semibold">
                    Status program
                </button>
            </div>

            <Link
                href="/participant/mahasiswa"
                className="text-ink-soft block px-4 pt-2 text-[10px] font-semibold underline underline-offset-2 md:px-8"
            >
                Link tiket tracing W07 - Sakinah
            </Link>

            <div className="flex-1 px-4 pt-4 pb-6 md:mx-auto md:w-full md:max-w-[720px] md:px-8 md:pt-6 md:pb-10">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Papan {outlet?.code ?? 'W07'}</h2>
                        <p className="text-ink-soft mt-0.5 text-[11px] md:text-xs">
                            {availableCount} tersedia dari {totalSlots} slot mingguan.
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-ink-soft text-[10px]">Kartu kamu</p>
                        <p className="text-sm font-extrabold">{caps} / 10</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-5 gap-1.5 md:gap-2">
                    {slots.map((slot) => (
                        <button
                            key={slot.position}
                            onClick={startClaim}
                            className={cn(
                                'flex h-12 flex-col items-center justify-center rounded-xl border text-[11px] font-bold md:h-16 md:text-[13px]',
                                slot.status !== 'empty' ? 'border-ink bg-ink text-cream' : 'border-ink/15 bg-cream-soft text-ink',
                                activeClaim && slot.status === 'held' && 'ring-offset-cream ring-2 ring-[#3b82f6] ring-offset-2',
                            )}
                        >
                            {slot.position}
                            {slot.status !== 'empty' && <Check className="text-lime size-3" />}
                        </button>
                    ))}
                </div>

                <div className="mt-4 rounded-2xl bg-[#fbe3e0] p-3.5 md:mt-6 md:p-4">
                    <p className="text-danger text-[12px] font-extrabold md:text-[13px]">Kamu belum isi slot</p>
                    <p className="text-danger/80 mt-0.5 text-[11px] leading-relaxed">
                        Kamu akan diblokir 10 menit dari papan kalau keluar tanpa klaim.
                    </p>
                </div>

                <PrimaryButton onClick={() => startClaim()} disabled={startForm.processing} className="mt-4">
                    {startForm.processing ? 'Mengambil slot...' : 'Klaim sekarang'}
                </PrimaryButton>
                {startForm.errors.claim && <span className="text-danger mt-1 block text-[11px]">{startForm.errors.claim}</span>}
                {activeClaim && (
                    <Link href="/participant/foto" className="text-ink mt-2 block text-center text-[11px] font-bold underline underline-offset-2">
                        Lanjutkan klaim yang ditahan
                    </Link>
                )}

                <div className="text-ink-soft mt-4 flex items-center gap-2 text-[10px]">
                    <Lock className="size-3.5" />
                    Sistem yang memilih slot. Slot tidak bisa dibatalkan.
                </div>
            </div>

            <Sheet open={paused} onClose={() => setPaused(false)}>
                <div className="py-2 text-center">
                    <span className="bg-lime mx-auto grid size-16 place-items-center rounded-full">
                        <Pause className="text-ink size-7" />
                    </span>
                    <h2 className="mt-4 text-xl font-extrabold tracking-tight">Program sedang dijeda</h2>
                    <p className="text-ink-soft mt-1 text-[12px] leading-relaxed">
                        Kamu belum bisa daftar. Hadiah dan kartu tetap aman dan bisa dilihat.
                    </p>
                </div>
                <div className="mt-4 space-y-2">
                    <PrimaryButton href={isLoggedIn ? '/participant/hadiah' : '/participant/papan'}>
                        {isLoggedIn ? 'Lihat hadiah' : 'Kembali'}
                    </PrimaryButton>
                    <OutlineButton href="/participant/kartu">Kartu dan peringkat</OutlineButton>
                    <button onClick={() => setPaused(false)} className="text-ink-soft w-full py-2 text-[11px] font-bold">
                        Kembali
                    </button>
                </div>
            </Sheet>

            <Sheet open={picker} onClose={() => setPicker(false)} title="Pilih kode">
                <p className="text-ink-soft text-[12px] leading-relaxed">Ketuk satu kode. Hadiah disembunyikan sampai kamu klaim.</p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                    {pickerCodes.map((code) => {
                        const disabled = disabledCodes.includes(code);
                        return (
                            <button
                                key={code}
                                disabled={disabled}
                                onClick={() => setSelected(code)}
                                className={cn(
                                    'h-11 rounded-lg border text-[13px] font-bold',
                                    disabled && 'border-ink/10 bg-cream-deep text-ink/30 line-through',
                                    !disabled && selected === code && 'border-ink bg-ink text-cream',
                                    !disabled && selected !== code && 'border-ink/20 bg-cream-soft text-ink',
                                )}
                            >
                                {code}
                            </button>
                        );
                    })}
                </div>
                <PrimaryButton
                    onClick={() => {
                        setPicker(false);
                        setAuthMode('login');
                    }}
                    className="mt-4"
                >
                    Kirim kode
                </PrimaryButton>
                <p className="text-ink-soft mt-3 text-[10px] leading-relaxed">
                    Kode yang sudah dipakai tidak bisa dipilih lagi. Hadiah muncul setelah kode dikirim.
                </p>
            </Sheet>

            <AuthSheet mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} areas={areas} />
        </ParticipantLayout>
    );
}
