import { LimePage } from '@/features/participant/components/lime-page';
import { logoutParticipant, OutlineButton } from '@/features/participant/components/ui';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';

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

function Stat({ label, value, className }: { label: string; value: string; className: string }) {
    return (
        <div className={cn('rounded-2xl p-3.5', className)}>
            <p className="truncate text-[10px] font-extrabold tracking-wide uppercase opacity-70">{label}</p>
            <p className="mt-1 text-[24px] leading-none font-extrabold">{value}</p>
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

const SHORTCUTS = [
    { href: '/participant/hadiah', label: 'Hadiahku' },
    { href: '/participant/kartu', label: 'Leaderboard' },
    { href: '/participant/scan', label: 'Scan QR papan' },
    { href: '/participant/lupa-pin', label: 'Lupa PIN' },
];

/** Profil saya: ringkasan cap, peringkat, klaim hari ini, data akun, dan pintasan. */
export default function Profil({ me }: { me: Me }) {
    const status = me.is_student ? 'Mahasiswa' : me.is_student === false ? 'Bukan mahasiswa' : 'Belum diisi';

    return (
        <LimePage title="Profil saya" nav="profil">
            <div className="flex items-center gap-3 rounded-3xl bg-white p-4">
                <span className="bg-ink text-lime ring-lime grid size-14 shrink-0 place-items-center rounded-full text-[22px] font-extrabold ring-2">
                    {me.name.trim().charAt(0).toUpperCase()}
                </span>
                <p className="min-w-0 flex-1 truncate text-[20px] font-extrabold tracking-tight">{me.name}</p>
                <span className="bg-lime shrink-0 rounded-full px-3 py-1.5 text-[12px] font-extrabold">{status}</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5">
                <Stat label="Cap" value={`${Math.min(me.caps, 10)}/10`} className="bg-night text-cream" />
                <Stat label="Peringkat" value={me.rank ? `#${me.rank}` : '-'} className="bg-lime text-ink" />
                <Stat
                    label="Klaim hari ini"
                    value={me.daily_limit > 0 ? `${me.claims_today}/${me.daily_limit}` : `${me.claims_today}`}
                    className="border-ink border-2 bg-white"
                />
            </div>

            <h2 className="mt-6 text-[18px] font-extrabold tracking-tight">Akun</h2>
            <div className="divide-ink/8 mt-2 divide-y rounded-3xl bg-white px-5 py-1">
                <Row label="Nomor WhatsApp" value={me.whatsapp} />
                <Row label="Status" value={status} />
                <Row label="Area kos" value={me.area ?? '-'} />
                <Row label="PIN" value="••••" />
            </div>

            <h2 className="mt-6 text-[18px] font-extrabold tracking-tight">Pintasan</h2>
            <div className="divide-ink/8 mt-2 divide-y rounded-3xl bg-white px-5 py-1">
                {SHORTCUTS.map((item) => (
                    <Link key={item.href} href={item.href} className="flex items-center justify-between py-3.5 text-[14px] font-bold">
                        {item.label}
                        <ChevronRight className="text-ink-soft size-4" />
                    </Link>
                ))}
            </div>

            <OutlineButton onClick={logoutParticipant} className="mt-6">
                Keluar
            </OutlineButton>
        </LimePage>
    );
}
