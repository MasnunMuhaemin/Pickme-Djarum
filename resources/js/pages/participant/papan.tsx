import { AuthSheet, type AuthMode } from '@/features/participant/components/auth-sheet';
import { Badge, OutlineButton, PageHeader, PrimaryButton, Sheet } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { deviceId } from '@/lib/device';
import { useCaps } from '@/lib/participant';
import { cn } from '@/lib/utils';
import { Link, useForm, usePage } from '@inertiajs/react';
import { Check, Lock, Pause } from 'lucide-react';
import { FormEvent, useState } from 'react';

type Area = { id: number; name: string };

type PapanProps = {
    outlet?: { id: number; code: string; name: string; status: string; area?: string | null };
    slots?: { position: string; status: string }[];
    availableCount?: number;
    totalSlots?: number;
    activeClaim?: { id: number; status: string; slot_id: number } | null;
    canClaim?: boolean;
    paused?: boolean;
    board?: { week_label: string; status: string } | null;
    modal?: string;
    areas?: Area[];
};

export default function Papan({
    outlet,
    slots = [],
    availableCount = 0,
    totalSlots = 0,
    activeClaim,
    canClaim = false,
    paused = false,
    board,
    modal,
    areas = [],
}: PapanProps) {
    const { props } = usePage();
    const isLoggedIn = Boolean((props.auth as { participant?: unknown })?.participant);
    const serverError = (props.errors as Record<string, string> | undefined)?.claim;
    const full = !paused && availableCount === 0;
    const caps = useCaps();
    const startForm = useForm({ device_id: deviceId(), claim: '', outlet: outlet?.code ?? 'W07' });

    function startClaim(e?: FormEvent) {
        e?.preventDefault();
        if (!canClaim) {
            setInfoOpen(true);
            return;
        }
        if (!isLoggedIn) {
            setAuthMode('login');
            return;
        }
        startForm.post('/participant/klaim/mulai', { preserveScroll: true });
    }

    const [infoOpen, setInfoOpen] = useState(false);
    const [authMode, setAuthMode] = useState<AuthMode>(modal === 'login' || modal === 'register' ? modal : null);

    function closeAuth() {
        setAuthMode(null);
        if (modal) window.history.replaceState({}, '', '/participant/papan');
    }

    return (
        <ParticipantLayout title={`Papan ${outlet?.code ?? ''}`.trim()} nav="papan">
            <PageHeader back="/participant" title={`Papan ${outlet?.code ?? 'W07'}`} right={<Badge>Kartu {caps} / 10</Badge>} />

            <div className="bg-night text-cream flex items-center justify-between px-4 py-2.5">
                <div>
                    <p className="text-[11px] font-bold">{board ? `Papan minggu ${board.week_label}` : 'Papan belum tersedia'}</p>
                    <p className="text-cream/70 flex items-center gap-1.5 text-[10px]">
                        <span className={cn('size-1.5 rounded-full', canClaim ? 'bg-lime' : 'bg-danger')} />
                        {paused ? 'Sedang dijeda' : full ? 'Papan penuh' : 'Sedang berjalan'}
                    </p>
                </div>
                <button onClick={() => setInfoOpen(true)} className="border-cream/25 rounded-full border px-2.5 py-1 text-[10px] font-semibold">
                    Status program
                </button>
            </div>

            <div className="flex-1 px-4 pt-4 pb-6 md:mx-auto md:w-full md:max-w-[720px] md:px-8 md:pt-6 md:pb-10">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Papan {outlet?.code ?? 'W07'}</h2>
                        {outlet && (
                            <p className="mt-0.5 text-[12px] font-semibold md:text-sm">
                                {outlet.name}
                                {outlet.area ? ` · ${outlet.area}` : ''}
                            </p>
                        )}
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

                {activeClaim && (
                    <div className="mt-4 rounded-2xl bg-[#fbe3e0] p-3.5 md:mt-6 md:p-4">
                        <p className="text-danger text-[12px] font-extrabold md:text-[13px]">Kamu belum isi kode slot</p>
                        <p className="text-danger/80 mt-0.5 text-[11px] leading-relaxed">
                            Slot ditahan untukmu sementara. Lanjutkan klaim sebelum masa tahannya habis.
                        </p>
                    </div>
                )}
                {slots.length === 0 && <p className="text-ink-soft mt-4 text-center text-[11px]">Slot papan belum tersedia.</p>}

                {/* Saat dijeda tombol diganti pesan jeda; saat penuh tombol nonaktif (PRD P1 dan P4). */}
                {paused ? (
                    <div className="border-ink/25 text-ink-soft mt-4 rounded-2xl border-2 border-dashed p-4 text-center text-[12px] leading-relaxed">
                        <p className="text-ink font-extrabold">Program sedang dijeda</p>
                        Klaim belum bisa dibuat. Hadiah dan kartumu tetap aman.
                    </div>
                ) : (
                    <PrimaryButton onClick={() => startClaim()} disabled={startForm.processing || full} className="mt-4">
                        {full ? 'Papan penuh' : startForm.processing ? 'Mengambil slot...' : 'Klaim sekarang'}
                    </PrimaryButton>
                )}
                {full && <p className="text-ink-soft mt-1 text-center text-[11px]">Semua slot sudah diambil. Coba klaim di titik lain.</p>}
                {(startForm.errors.claim || serverError) && (
                    <span className="text-danger mt-1 block text-[11px]">{startForm.errors.claim ?? serverError}</span>
                )}
                {activeClaim && (
                    <Link href="/participant/slot" className="text-ink mt-2 block text-center text-[11px] font-bold underline underline-offset-2">
                        Lanjutkan klaim yang ditahan
                    </Link>
                )}

                <div className="text-ink-soft mt-4 flex items-center gap-2 text-[10px]">
                    <Lock className="size-3.5" />
                    Sistem yang memilih slot. Slot tidak bisa dibatalkan.
                </div>
            </div>

            <Sheet open={infoOpen} onClose={() => setInfoOpen(false)}>
                <div className="py-2 text-center">
                    <span className="bg-lime mx-auto grid size-16 place-items-center rounded-full">
                        <Pause className="text-ink size-7" />
                    </span>
                    <h2 className="mt-4 text-xl font-extrabold tracking-tight">
                        {paused ? 'Program sedang dijeda' : full ? 'Papan penuh' : 'Program sedang berjalan'}
                    </h2>
                    <p className="text-ink-soft mt-1 text-[12px] leading-relaxed">
                        {paused
                            ? 'Kamu belum bisa klaim. Hadiah dan kartu tetap aman dan bisa dilihat.'
                            : full
                              ? 'Semua slot di titik ini sudah diambil dan tidak diisi ulang. Coba klaim di titik lain.'
                              : `${availableCount} slot masih tersedia di titik ini.`}
                    </p>
                </div>
                <div className="mt-4 space-y-2">
                    <PrimaryButton href={isLoggedIn ? '/participant/hadiah' : '/participant/papan'}>
                        {isLoggedIn ? 'Lihat hadiah' : 'Kembali'}
                    </PrimaryButton>
                    <OutlineButton href="/participant/kartu">Kartu dan peringkat</OutlineButton>
                    <button onClick={() => setInfoOpen(false)} className="text-ink-soft w-full py-2 text-[11px] font-bold">
                        Kembali
                    </button>
                </div>
            </Sheet>

            <AuthSheet mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} areas={areas} />
        </ParticipantLayout>
    );
}
