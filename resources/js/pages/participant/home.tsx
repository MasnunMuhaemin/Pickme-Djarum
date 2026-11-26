import { AuthSheet, type AuthMode } from '@/features/participant/components/auth-sheet';
import { LogoutButton, NoticeSheet } from '@/features/participant/components/ui';
import { STAR, useMysteryReady, type Reward } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { cn } from '@/lib/utils';
import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { Box, Check, ChevronRight, Coffee, Fuel, Gift, MapPin, ScanLine, Trophy, Zap } from 'lucide-react';
import { Fragment, useEffect, useState } from 'react';

/** Data dari App\Support\RewardPresenter::prize(). */
type Prize = { type: string; title: string; subtitle: string; value: string; remaining: number };
type Area = { id: number; name: string };
type Me = {
    name: string;
    caps: number;
    rank: number | null;
    claims_today: number;
    daily_limit: number;
    last_outlet: string | null;
    mystery: Reward | null;
};

const prizeStyle: Record<string, { icon: LucideIcon; tile: string }> = {
    voucher: { icon: Coffee, tile: 'from-[#dcc3a3] to-[#6b4a33]' },
    token: { icon: Zap, tile: 'from-[#bccfe0] to-[#4f6b86]' },
    merch: { icon: Box, tile: 'from-[#c6dccf] to-[#4d6b57]' },
    bensin: { icon: Fuel, tile: 'from-[#e7c9b4] to-[#8a4f35]' },
};

const steps = ['Beli bungkus', 'Foto bungkus', 'Ambil slot'];

export default function Home({ modal, areas = [], prizes = [], me }: { modal?: string; areas?: Area[]; prizes?: Prize[]; me?: Me }) {
    if (me) {
        return (
            <ParticipantLayout title="Beranda" nav="beranda">
                <Dashboard me={me} />
                <ClaimNotices limit={me.daily_limit} />
            </ParticipantLayout>
        );
    }
    return <Landing modal={modal} areas={areas} prizes={prizes} />;
}

function greeting(hour: number): string {
    if (hour < 11) return 'Pagi';
    if (hour < 15) return 'Siang';
    if (hour < 18) return 'Sore';
    return 'Malam';
}

/**
 * Pemberitahuan saat klaim tidak bisa dilanjutkan (server melempar ke beranda): batas harian, papan penuh, atau
 * program dijeda/klaim gagal.
 */
function ClaimNotices({ limit = 2 }: { limit?: number }) {
    const errors = (usePage().props.errors as Record<string, string> | undefined) ?? {};
    const [notice, setNotice] = useState<'limit' | 'full' | 'claim' | null>(null);
    useEffect(
        () => setNotice(errors.limit ? 'limit' : errors.full ? 'full' : errors.claim ? 'claim' : null),
        [errors.limit, errors.full, errors.claim],
    );
    const close = () => setNotice(null);

    return (
        <>
            <NoticeSheet
                open={notice === 'limit'}
                onClose={close}
                icon={`${limit}/${limit}`}
                title="Batas klaim tercapai"
                text={`Kamu sudah klaim ${limit} kali hari ini. Coba lagi besok.`}
                secondary={{ label: 'Mengerti' }}
                primary={{ label: 'Lihat Hadiahku', href: '/participant/hadiah' }}
            />
            <NoticeSheet
                open={notice === 'full'}
                onClose={close}
                icon="0"
                title="Papan ini sudah penuh"
                text="Semua slot di papan ini sudah diambil. Cari papan lain di warung terdekat."
                secondary={{ label: 'Mengerti' }}
                primary={{ label: 'Scan papan lain', href: '/participant/scan?ganti=1' }}
            />
            <NoticeSheet
                open={notice === 'claim'}
                onClose={close}
                tone="danger"
                icon="!"
                title="Belum bisa klaim"
                text={errors.claim ?? ''}
                primary={{ label: 'Mengerti' }}
            />
        </>
    );
}

/** Beranda peserta yang sudah masuk (desain "Siang, Sasa!"): kartu cap, pintasan, dan info program. */
function Dashboard({ me }: { me: Me }) {
    const mysteryReady = useMysteryReady(me.mystery);
    const [hour, setHour] = useState(12);
    useEffect(() => setHour(new Date().getHours()), []);
    // Baris cap yang sedang diisi: 1-5, lalu 6-10 setelah mystery gift dibuka.
    const rowStart = me.caps < 5 || (me.caps === 5 && mysteryReady) ? 0 : 5;

    return (
        <div className="flex flex-1 flex-col">
            <div className="lime-hero relative overflow-hidden px-5 pt-5 pb-24 md:px-8">
                <span aria-hidden className="absolute -top-16 -right-16 size-56 rounded-full border-[18px] border-white/15" />
                <img src="/images/logo.webp" alt="Papan Pick(me)" className="relative h-14 w-auto md:h-16" />
                <div className="relative mt-2 flex items-center justify-between gap-3">
                    <h1 className="text-[32px] leading-tight font-extrabold tracking-tight md:text-[40px]">
                        {greeting(hour)}, {me.name.split(' ')[0]}!
                    </h1>
                    <Link
                        href="/participant/profil"
                        aria-label="Profil saya"
                        className="bg-ink text-lime ring-lime grid size-12 shrink-0 place-items-center rounded-full text-[18px] font-extrabold ring-2"
                    >
                        {me.name.trim().charAt(0).toUpperCase()}
                    </Link>
                </div>
                <div className="relative mt-3 flex flex-wrap gap-2 text-[12px] font-bold">
                    {me.last_outlet && (
                        <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5">
                            <MapPin className="size-3.5" /> Papan terakhir · {me.last_outlet}
                        </span>
                    )}
                    <span className="bg-ink/10 flex items-center gap-1.5 rounded-full px-3 py-1.5">
                        <Check className="size-3.5" strokeWidth={3} /> Klaim hari ini {me.claims_today}
                        {me.daily_limit > 0 && `/${me.daily_limit}`}
                    </span>
                </div>
            </div>

            <div className="relative -mt-16 flex-1 px-5 pb-8 md:mx-auto md:w-full md:max-w-[720px] md:px-8">
                {/* Kartu cap ringkas */}
                <Link href="/participant/kartu" className="bg-night text-cream block rounded-[28px] p-5 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]">
                    <div className="flex items-center justify-between">
                        <p className="text-lime text-[11px] font-extrabold tracking-[0.22em] uppercase">Kartu cap</p>
                        <span className="text-cream/60 flex items-center text-[12px]">
                            Lihat kartu <ChevronRight className="size-4" />
                        </span>
                    </div>
                    <div className="mt-4 flex items-end justify-between gap-3">
                        <p className="leading-none font-extrabold tracking-tight">
                            <span className="text-[52px]">{Math.min(me.caps, 10)}</span>
                            <span className="text-cream/50 text-[24px]">/10</span>
                        </p>
                        {mysteryReady && (
                            <span className="bg-lime text-ink mb-1 rounded-full px-3 py-1.5 text-[12px] font-extrabold">Siap diklaim</span>
                        )}
                    </div>
                    <div className="mt-4 grid grid-cols-5 justify-items-center">
                        {Array.from({ length: 5 }, (_, i) => {
                            const number = rowStart + i + 1;
                            if (number === 5 && me.caps >= 5) {
                                return (
                                    <span
                                        key={number}
                                        className={cn(
                                            'text-ink grid size-11 place-items-center rounded-full bg-white ring-4 ring-[#8fcf3a]',
                                            mysteryReady && 'motion-safe:animate-[gift-glow_1.8s_ease-in-out_infinite]',
                                        )}
                                    >
                                        <Gift className="size-5" />
                                    </span>
                                );
                            }
                            if (number <= me.caps) {
                                return (
                                    <span key={number} className={cn('bg-lime grid size-11 place-items-center', STAR)}>
                                        <span className="border-ink/70 grid size-7 place-items-center rounded-full border-2">
                                            <Check className="text-ink size-3.5" strokeWidth={3} />
                                        </span>
                                    </span>
                                );
                            }
                            return (
                                <span
                                    key={number}
                                    className="text-cream/45 grid size-11 place-items-center rounded-full border-2 border-dashed border-white/25 text-[14px] font-extrabold"
                                >
                                    {number === 5 ? <Gift className="size-5" /> : number}
                                </span>
                            );
                        })}
                    </div>
                    <p className="text-cream/50 mt-4 text-[12px]">
                        {mysteryReady
                            ? 'Mystery gift siap diklaim'
                            : me.caps < 5
                              ? `${5 - me.caps} cap lagi buka mystery gift`
                              : me.caps < 10
                                ? `${10 - me.caps} cap lagi kartu penuh`
                                : 'Kartu penuh'}
                    </p>
                </Link>

                {/* Pintasan */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <ShortcutTile
                        href="/participant/scan"
                        title="Scan QR"
                        text="Klaim produk"
                        icon={ScanLine}
                        className="bg-lime text-ink"
                        iconClass="bg-ink text-lime"
                    />
                    <ShortcutTile
                        href="/participant/hadiah"
                        title="Hadiahku"
                        text="Voucher & merch"
                        icon={Gift}
                        className="bg-night text-cream"
                        iconClass="bg-lime text-ink"
                    />
                    <ShortcutTile
                        href="/participant/kartu"
                        title="Peringkat"
                        text={me.rank ? `Kamu di #${me.rank}` : 'Belum masuk'}
                        icon={Trophy}
                        className="text-ink bg-white"
                        iconClass="bg-[#ece4c4] text-ink"
                    />
                </div>

                {/* Info program, digeser ke samping */}
                <div className="mt-6 flex items-center justify-between">
                    <h2 className="text-[18px] font-extrabold tracking-tight">Yang lagi seru</h2>
                    <span className="text-ink-soft text-[12px]">Geser</span>
                </div>
                <div className="-mx-5 mt-3 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] md:-mx-8 md:scroll-px-8 md:px-8">
                    <PromoCard
                        href="/participant/scan"
                        tag="Papan warung"
                        title="Jajan dekat. Ambil slotnya."
                        text="Beli bungkus di warung terdekat, foto, lalu ambil slot."
                        image="/images/banner.webp"
                    />
                    <PromoCard
                        href="/participant/kartu"
                        tag="Kartu cap"
                        title="5 cap = mystery gift"
                        text="Kumpulkan cap dan naik ke 10 besar peringkat."
                        image="/images/design-voucher3.webp"
                    />
                </div>
            </div>
        </div>
    );
}

function ShortcutTile({
    href,
    title,
    text,
    icon: Icon,
    className,
    iconClass,
}: {
    href: string;
    title: string;
    text: string;
    icon: LucideIcon;
    className: string;
    iconClass: string;
}) {
    return (
        <Link href={href} className={cn('flex min-h-[120px] flex-col justify-between rounded-3xl p-3.5 transition active:scale-[0.98]', className)}>
            <span className={cn('grid size-10 place-items-center rounded-full', iconClass)}>
                <Icon className="size-5" />
            </span>
            <span>
                <span className="block text-[14px] leading-tight font-extrabold">{title}</span>
                <span className="block text-[11px] opacity-70">{text}</span>
            </span>
        </Link>
    );
}

function PromoCard({ href, tag, title, text, image }: { href: string; tag: string; title: string; text: string; image: string }) {
    return (
        <Link href={href} className="bg-night text-cream relative w-[78%] shrink-0 snap-start overflow-hidden rounded-3xl p-4 md:w-[60%]">
            <img src={image} alt="" aria-hidden loading="lazy" className="absolute inset-0 size-full object-cover opacity-30" />
            <span className="relative block">
                <span className="bg-lime text-ink inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide uppercase">
                    {tag}
                </span>
                <span className="mt-3 block text-[22px] leading-tight font-extrabold">{title}</span>
                <span className="text-cream/75 mt-1 block text-[12px]">{text}</span>
            </span>
        </Link>
    );
}

/** Halaman pengenalan program untuk tamu. */
function Landing({ modal, areas = [], prizes = [] }: { modal?: string; areas?: Area[]; prizes?: Prize[] }) {
    const [authMode, setAuthMode] = useState<AuthMode>(modal === 'login' || modal === 'register' ? modal : null);

    function closeAuth() {
        setAuthMode(null);
        if (modal) window.history.replaceState({}, '', '/participant');
    }

    return (
        <ParticipantLayout title="Beli bungkus, ambil slot" nav="beranda">
            {/* Hero: ilustrasi warung sebagai latar penuh, digelapkan ke bawah supaya teks terbaca. */}
            <div className="bg-night relative overflow-hidden px-5 pt-10 pb-16 md:px-8 md:pt-12">
                <img
                    src="/images/banner.webp"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 top-0 h-full w-full object-cover object-top select-none"
                />
                {/* Tombol keluar di pojok kanan atas, hanya saat sudah masuk. */}
                <LogoutButton className="bg-ink/80 text-lime hover:bg-ink hover:text-lime absolute top-4 right-4 z-10 md:hidden" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(13,27,21,0)_0%,rgba(13,27,21,0.1)_35%,rgba(13,27,21,0.72)_58%,#0d1b15_80%)]" />
                <img src="/images/logo.webp" alt="Papan Pick(me)" className="relative h-14 w-auto md:h-16" />
                <span className="bg-lime text-ink relative mt-3 inline-block rounded-full px-3.5 py-1.5 text-[13px] font-extrabold">
                    Scan QR di papan warung
                </span>
                <h1 className="text-cream relative mt-3 text-[40px] leading-[1.02] font-extrabold tracking-tight md:text-[52px]">
                    Beli bungkus,
                    <br />
                    foto, ambil slot.
                </h1>
                <p className="text-cream/75 relative mt-3 max-w-[340px] text-[14px] leading-snug md:max-w-[460px]">
                    Slot ditunjuk sistem secara acak. Isinya tidak terlihat sampai kamu klaim.
                </p>
            </div>

            <div className="bg-cream relative -mt-7 flex flex-1 flex-col rounded-t-[2rem] px-5 pt-6 pb-6 md:px-8 md:pt-8 md:pb-10">
                <div className="flex-1 md:mx-auto md:w-full md:max-w-[720px]">
                    <h2 className="text-[18px] font-extrabold tracking-tight">Hadiah yang bisa kamu dapat</h2>
                    <div className="mt-2">
                        {prizes.map((prize) => {
                            const style = prizeStyle[prize.type] ?? { icon: Gift, tile: 'from-[#e9e2bf] to-[#8b8466]' };
                            const Icon = style.icon;
                            return (
                                <div key={prize.type} className="flex items-center gap-4 border-b border-[#e8e1c4] py-3">
                                    <span className={cn('grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-b', style.tile)}>
                                        <Icon className="text-cream/80 size-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[15px] font-extrabold">{prize.title}</p>
                                        <p className="text-ink-soft truncate text-[13px]">
                                            {prize.subtitle} · {prize.remaining > 0 ? `${prize.remaining} slot tersisa` : 'Habis minggu ini'}
                                        </p>
                                    </div>
                                    <span className="shrink-0 text-[15px] font-extrabold">{prize.value}</span>
                                </div>
                            );
                        })}
                        {prizes.length === 0 && <p className="text-ink-soft py-3 text-[13px]">Belum ada papan aktif.</p>}
                    </div>

                    {/* Tiga langkah, dihubungkan garis. */}
                    <div className="mt-6 flex items-center">
                        {steps.map((step, i) => (
                            <Fragment key={step}>
                                {i > 0 && <span className="mx-3 h-0.5 flex-1 bg-[#e8e1c4]" />}
                                <span className="bg-ink text-lime grid size-10 shrink-0 place-items-center rounded-full text-[15px] font-extrabold">
                                    {i + 1}
                                </span>
                            </Fragment>
                        ))}
                    </div>
                    <div className="mt-2 flex justify-between text-[13px] font-extrabold">
                        {steps.map((step, i) => (
                            <span key={step} className={cn(i === 1 && 'text-center', i === 2 && 'text-right')}>
                                {step}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <AuthSheet mode={authMode} onClose={closeAuth} onModeChange={setAuthMode} areas={areas} />
            <ClaimNotices />
        </ParticipantLayout>
    );
}
