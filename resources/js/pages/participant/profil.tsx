import { LimePage } from '@/features/participant/components/lime-page';
import { logoutParticipant, NoticeSheet, OutlineButton } from '@/features/participant/components/ui';
import { STAR } from '@/features/participant/rewards';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronRight, LogOut } from 'lucide-react';
import { useState } from 'react';

type Me = {
    name: string;
    caps: number;
    rank: number | null;
    claims_today: number;
    daily_limit: number;
    whatsapp: string;
    is_student: boolean | null;
    area: string | null;
};

/** Kartu angka dengan aksen bintang bergerigi di pojok kanan atas, seperti kartu pintasan di beranda. */
function Stat({
    label,
    value,
    className,
    starClass,
    rings,
}: {
    label: string;
    value: string;
    className: string;
    starClass: string;
    rings?: boolean;
}) {
    return (
        <div className={cn('relative overflow-hidden rounded-2xl p-3.5', className)}>
            {rings && (
                <>
                    <span aria-hidden className="border-ink/15 absolute -top-10 -right-10 size-24 rounded-full border-2" />
                    <span aria-hidden className="border-ink/15 absolute -top-5 -right-5 size-14 rounded-full border-2" />
                </>
            )}
            <span aria-hidden className={cn('absolute -top-3 -right-3 size-10', STAR, starClass)} />
            <p className="relative truncate text-[10px] font-extrabold tracking-wide uppercase opacity-70">{label}</p>
            <p className="relative mt-1 text-[24px] leading-none font-extrabold">{value}</p>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5 text-[13px]">
            <span className="text-ink-soft">{label}</span>
            <span className="text-right font-extrabold">{value}</span>
        </div>
    );
}

/**
 * Aksen kartu putih profil (di belakang isi): bintang bergerigi besar dan kecil serta lingkaran bertingkat. `flip`
 * mencerminkan susunannya supaya kartu yang berurutan tidak tampak sama.
 */
function CardAccent({ flip }: { flip?: boolean }) {
    return (
        <span aria-hidden className="pointer-events-none absolute inset-0">
            <span className={cn('bg-lime-soft absolute -top-7 size-20', flip ? '-left-7' : '-right-7', STAR)} />
            <span className={cn('bg-lime/40 absolute top-12 size-6', flip ? 'left-14' : 'right-14', STAR)} />
            <span className={cn('border-lime/25 absolute -bottom-14 size-32 rounded-full border-2', flip ? '-right-14' : '-left-14')} />
            <span className={cn('border-lime/20 absolute -bottom-7 size-16 rounded-full border-2', flip ? '-right-7' : '-left-7')} />
        </span>
    );
}

const SHORTCUTS = [
    { href: '/participant/hadiah', label: 'Hadiahku' },
    { href: '/participant/kartu', label: 'Leaderboard' },
    { href: '/participant/scan', label: 'Scan QR papan' },
    { href: '/participant/lupa-pin', label: 'Lupa PIN' },
];

/** Profil saya: ringkasan cap, peringkat, klaim hari ini, data akun, dan pintasan. */
export default function Profil({ me }: { me: Me }) {
    const [confirmLogout, setConfirmLogout] = useState(false);
    const status = me.is_student ? 'Mahasiswa' : me.is_student === false ? 'Bukan mahasiswa' : 'Belum diisi';

    return (
        <LimePage title="Profil saya" nav="profil">
            <div className="relative flex items-center gap-3 overflow-hidden rounded-3xl bg-white p-4">
                <CardAccent />
                <span className="text-lime ring-lime relative grid size-14 shrink-0 place-items-center rounded-full bg-[#0b0b0b] text-[22px] font-extrabold ring-2">
                    {me.name.trim().charAt(0).toUpperCase()}
                </span>
                <p className="relative min-w-0 flex-1 truncate text-[20px] font-extrabold tracking-tight">{me.name}</p>
                <span className="bg-lime relative shrink-0 rounded-full px-3 py-1.5 text-[12px] font-extrabold">{status}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
                <Stat label="Cap" value={`${Math.min(me.caps, 10)}/10`} className="text-cream bg-[#0b0b0b]" starClass="bg-[#2b3a12]" />
                <Stat label="Peringkat" value={me.rank ? `#${me.rank}` : '-'} className="bg-lime text-[#0b0b0b]" starClass="bg-[#7aa91a]" rings />
                <Stat
                    label="Klaim hari ini"
                    value={me.daily_limit > 0 ? `${me.claims_today}/${me.daily_limit}` : `${me.claims_today}`}
                    className="border-ink border-2 bg-white"
                    starClass="bg-lime-soft"
                />
            </div>

            <h2 className="mt-6 text-[18px] font-extrabold tracking-tight text-[#0b0b0b]">Akun</h2>
            <div className="relative mt-2 overflow-hidden rounded-3xl bg-white px-5 py-1">
                <CardAccent flip />
                <div className="divide-ink/8 relative divide-y">
                    <Row label="Nomor WhatsApp" value={me.whatsapp} />
                    <Row label="Status" value={status} />
                    <Row label="Area kos" value={me.area ?? '-'} />
                    <Row label="PIN" value="••••" />
                </div>
            </div>

            <h2 className="mt-6 text-[18px] font-extrabold tracking-tight text-[#0b0b0b]">Pintasan</h2>
            <div className="relative mt-2 overflow-hidden rounded-3xl bg-white px-5 py-1">
                <CardAccent />
                <div className="divide-ink/8 relative divide-y">
                    {SHORTCUTS.map((item) => (
                        <Link key={item.href} href={item.href} className="flex items-center justify-between py-3.5 text-[14px] font-bold">
                            {item.label}
                            <ChevronRight className="text-ink-soft size-4" />
                        </Link>
                    ))}
                </div>
            </div>

            <OutlineButton onClick={() => setConfirmLogout(true)} className="mt-6">
                Keluar
            </OutlineButton>

            {/* Konfirmasi keluar; setelah keluar peserta diarahkan ke Beranda. */}
            <NoticeSheet
                open={confirmLogout}
                onClose={() => setConfirmLogout(false)}
                icon={<LogOut className="size-7" />}
                title="Keluar dari akun?"
                text="Kamu perlu masuk lagi dengan nomor WhatsApp dan PIN untuk klaim hadiah."
                primary={{ label: 'Ya, keluar', onClick: logoutParticipant }}
                secondary={{ label: 'Tidak' }}
            />
        </LimePage>
    );
}
