import { Btn, BtnLink, Hint, Modal, Req, SelectInput, TextArea } from '@/features/admin/ui';
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator';
import { cn } from '@/lib/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    AlertTriangle,
    Check,
    FileText,
    Gift,
    Home,
    Image,
    LayoutGrid,
    LogOut,
    MapPin,
    Menu,
    Send,
    Settings,
    Store,
    Ticket,
    Trophy,
    UserCog,
    Users,
    Wallet,
    X,
} from 'lucide-react';
import { Fragment, type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

type Badges = { fulfillment: number; dispatch: number };
type AdminShared = {
    badges: Badges;
    paused: boolean;
    pauseReason: string | null;
    outlets: { id: number; code: string; name: string; status: string }[];
};

const menu: { key: string; label: string; href: string; icon: LucideIcon; badge?: keyof Badges; group?: string }[] = [
    { key: 'beranda', label: 'Beranda', href: '/admin', icon: Home },
    { key: 'antrean-foto', label: 'Foto klaim', href: '/admin/antrean-foto', icon: Image },
    { key: 'pemenuhan', label: 'Pemenuhan', href: '/admin/pemenuhan', icon: Gift, badge: 'fulfillment' },
    { key: 'kirim-voucher', label: 'Kirim voucher', href: '/admin/kirim-voucher', icon: Send, badge: 'dispatch' },
    { key: 'peringkat', label: 'Peringkat', href: '/admin/peringkat', icon: Trophy },
    { key: 'papan', label: 'Papan dan slot', href: '/admin/papan', icon: LayoutGrid },
    { key: 'pembayaran', label: 'Pembayaran mitra', href: '/admin/pembayaran', icon: Wallet },
    // Master data berurutan: area dan jenis voucher dibuat dulu, lalu warung tinggal memilih keduanya.
    { key: 'md-area', label: '1. Area', href: '/admin/master-data/area', icon: MapPin, group: 'Master data' },
    { key: 'md-mitra', label: '2. Mitra & akun', href: '/admin/master-data/mitra', icon: Users, group: 'Master data' },
    { key: 'md-voucher', label: '3. Jenis voucher', href: '/admin/master-data/jenis-voucher', icon: Ticket, group: 'Master data' },
    { key: 'md-warung', label: '4. Warung', href: '/admin/master-data/warung', icon: Store, group: 'Master data' },
    { key: 'pengguna', label: 'Pengguna', href: '/admin/pengguna', icon: UserCog },
    { key: 'pengaturan', label: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
    { key: 'log', label: 'Log aktivitas', href: '/admin/log', icon: FileText },
];

function initials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');
}

/**
 * Kerangka panel admin dari desain: sidebar hitam dengan menu dan badge antrean, header judul + subjudul,
 * Tombol Darurat merah di pojok kanan atas semua halaman (PRD bagian 13).
 */
export default function AdminLayout({
    active,
    title,
    subtitle,
    children,
}: {
    active: string;
    title: string;
    subtitle?: string;
    children: ReactNode;
}) {
    const { props } = usePage();
    const admin = props.admin as AdminShared | null;
    const user = (props.auth as { user?: { name: string } }).user;
    const flash = (props.flash as { status?: string } | undefined)?.status;
    const flashPin = (props.flash as { pin?: { name: string; pin: string; wa?: string | null } | null } | undefined)?.pin ?? null;
    const [emergencyOpen, setEmergencyOpen] = useState(false);
    const { containerRef, indicatorStyle } = useSlidingIndicator('admin-sidebar', active);
    const [toast, setToast] = useState<string | null>(null);
    // Di bawah lg sidebar menjadi laci yang dibuka lewat tombol menu.
    const [navOpen, setNavOpen] = useState(false);
    const { loading, show: showLoading } = useNavigationLoading();

    // Popup berhasil setelah setiap simpan/ubah/hapus. Bergantung pada objek props supaya pesan yang sama
    // pada aksi berikutnya tetap muncul lagi.
    // PIN baru tampil di popup yang hanya tertutup lewat "Sudah saya catat", supaya tidak hilang karena salah klik.
    const [pin, setPin] = useState<{ name: string; pin: string; wa?: string | null } | null>(null);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        if (flashPin) {
            setPin(flashPin);
            setCopied(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props]);

    useEffect(() => {
        // Popup PIN sudah menjelaskan hasilnya; popup Berhasil tidak ditumpuk di atasnya.
        if (flash && !flashPin) setToast(flash);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props]);

    return (
        <div className="bg-cream text-ink flex min-h-dvh">
            <Head title={`${title} · Admin`} />
            {loading && (
                // Kartu memuat di tengah layar; latar tipis mencegah klik ganda selama menunggu server.
                <div role="status" aria-live="polite" className="bg-night/25 fixed inset-0 z-[60] grid place-items-center backdrop-blur-[1px]">
                    <div className="bg-cream flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl">
                        <span className="border-lime/30 border-t-lime-dark size-6 animate-spin rounded-full border-[3px]" />
                        <span className="text-ink text-[13px] font-extrabold">Memuat...</span>
                    </div>
                </div>
            )}
            {navOpen && <div aria-hidden className="bg-ink/40 fixed inset-0 z-40 lg:hidden" onClick={() => setNavOpen(false)} />}
            <aside
                className={cn(
                    'bg-night fixed inset-y-0 left-0 z-50 flex h-dvh w-[240px] shrink-0 flex-col px-3 py-5 text-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:w-[220px] lg:translate-x-0',
                    navOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex items-start justify-between px-2">
                    <div>
                        <p className="text-[18px] leading-none font-black tracking-tight">PICK(ME)</p>
                        <p className="mt-1 text-[11px] text-white/50">Panel admin</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNavOpen(false)}
                        aria-label="Tutup menu"
                        className="grid size-8 place-items-center rounded-full text-white/70 hover:bg-white/10 lg:hidden"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                <nav
                    ref={containerRef}
                    className="relative mt-6 flex-1 space-y-0.5 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {/* Pil lime meluncur ke menu aktif. */}
                    <span aria-hidden className="bg-lime pointer-events-none absolute top-0 left-0 rounded-full" style={indicatorStyle} />
                    {menu.map((item, i) => {
                        const Icon = item.icon;
                        // Judul grup tampil sebelum menu pertama grup itu, dan grup ditutup sebelum menu berikutnya.
                        const groupStart = item.group && menu[i - 1]?.group !== item.group;
                        const groupEnd = !item.group && menu[i - 1]?.group;
                        const count = item.badge ? (admin?.badges[item.badge] ?? 0) : 0;
                        const isActive = item.key === active;
                        return (
                            <Fragment key={item.key}>
                                {groupStart && (
                                    <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-widest text-white/40 uppercase">{item.group}</p>
                                )}
                                {groupEnd && <div aria-hidden className="mx-3 my-2 border-t border-white/10" />}
                                <Link
                                    href={item.href}
                                    // Hover, bukan mount: memuat 10 menu sekaligus membuat klik lain mengantre di server.
                                    prefetch="hover"
                                    cacheFor="30s"
                                    onClick={(e) => {
                                        setNavOpen(false);
                                        // Klik biasa saja; Ctrl/Cmd+klik membuka tab baru tanpa pindah halaman di sini.
                                        if (!isActive && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) showLoading();
                                    }}
                                    data-active={isActive}
                                    className={cn(
                                        'relative flex h-9 items-center gap-2.5 rounded-full px-3 text-[12px] font-semibold transition-colors',
                                        isActive ? 'text-ink' : 'text-white/75 hover:bg-white/10 hover:text-white',
                                    )}
                                >
                                    <Icon className="size-4 shrink-0" />
                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                    {count > 0 && (
                                        <span
                                            className={cn(
                                                'grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-extrabold',
                                                isActive ? 'bg-ink text-lime' : 'bg-lime text-ink',
                                            )}
                                        >
                                            {count}
                                        </span>
                                    )}
                                </Link>
                            </Fragment>
                        );
                    })}
                </nav>
                <div className="border-t border-white/10 px-2 pt-4">
                    <p className="text-[11px] leading-snug text-white/60">
                        Masuk sebagai {user?.name ?? 'Admin'}
                        <br />
                        Semua aksi tercatat atas nama akun.
                    </p>
                    <button
                        type="button"
                        onClick={() => router.post('/logout')}
                        className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-white/60 hover:text-white"
                    >
                        <LogOut className="size-3.5" />
                        Keluar
                    </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-4 sm:px-6 lg:px-8 lg:pt-6">
                    <button
                        type="button"
                        onClick={() => setNavOpen(true)}
                        aria-label="Buka menu"
                        className="border-ink/10 grid size-9 shrink-0 place-items-center rounded-full border bg-white lg:hidden"
                    >
                        <Menu className="size-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-[22px] leading-tight font-extrabold tracking-tight">{title}</h1>
                        {subtitle && <p className="text-ink/50 mt-0.5 text-[12px]">{subtitle}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        {admin?.paused && (
                            <span className="rounded-full bg-[#fde0dc] px-3 py-1 text-[11px] font-bold text-[#b42318]">Program dijeda</span>
                        )}
                        <button
                            type="button"
                            onClick={() => setEmergencyOpen(true)}
                            aria-label="Tombol Darurat"
                            className="flex h-9 items-center gap-2 rounded-full bg-[#d0271d] px-3 text-[12px] font-bold text-white shadow-sm hover:bg-[#b5211a] sm:px-4"
                        >
                            <AlertTriangle className="size-4" />
                            <span className="hidden sm:inline">Tombol Darurat</span>
                        </button>
                        <span className="bg-lime grid size-9 place-items-center rounded-full text-[12px] font-extrabold" title={user?.name}>
                            {initials(user?.name ?? 'Admin')}
                        </span>
                    </div>
                </header>

                {/* Isi halaman muncul memudar; halaman lama langsung diganti sehingga tidak bertumpuk. */}
                <main className="animate-in fade-in flex-1 px-4 pb-10 duration-300 motion-reduce:animate-none sm:px-6 lg:px-8">{children}</main>
            </div>

            {admin && <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} admin={admin} />}

            <Modal open={pin !== null} onClose={() => setPin(null)} width="max-w-sm" dismissible={false}>
                {pin && (
                    <div className="flex flex-col items-center pt-2 text-center">
                        <h2 className="text-[17px] font-extrabold">PIN baru {pin.name}</h2>
                        <p className="bg-lime mt-3 w-full rounded-xl py-3 font-mono text-[32px] font-extrabold tracking-[0.4em]">{pin.pin}</p>
                        <p className="text-ink/60 mt-3 text-[12px] leading-relaxed">
                            PIN ini <b>hanya ditampilkan sekali</b> dan tidak bisa dilihat lagi. Kirim lewat WhatsApp (pesan berisi PIN sudah terisi)
                            atau salin, lalu tutup.
                        </p>
                        <div className="mt-4 flex w-full gap-2">
                            <Btn
                                variant="outline"
                                className="flex-1"
                                onClick={async () => {
                                    try {
                                        await navigator.clipboard.writeText(pin.pin);
                                        setCopied(true);
                                    } catch {
                                        // Clipboard bisa ditolak browser; PIN tetap terlihat untuk dicatat manual.
                                    }
                                }}
                            >
                                {copied ? 'Tersalin' : 'Salin PIN'}
                            </Btn>
                            {pin.wa && (
                                <BtnLink href={pin.wa} external variant="yellow" className="flex-1">
                                    Kirim lewat WhatsApp
                                </BtnLink>
                            )}
                        </div>
                        <Btn className="mt-2 w-full" onClick={() => setPin(null)}>
                            Sudah saya catat
                        </Btn>
                    </div>
                )}
            </Modal>

            <Modal open={toast !== null} onClose={() => setToast(null)} width="max-w-sm">
                <div className="flex flex-col items-center pt-2 text-center">
                    <span className="bg-lime grid size-12 place-items-center rounded-full">
                        <Check className="text-ink size-6" strokeWidth={3} />
                    </span>
                    <h2 className="mt-3 text-[17px] font-extrabold">Berhasil</h2>
                    <p className="text-ink/60 mt-1 text-[12px] leading-relaxed break-words">{toast}</p>
                    <Btn className="mt-4 w-full" onClick={() => setToast(null)} autoFocus>
                        OK
                    </Btn>
                </div>
            </Modal>
        </div>
    );
}

/** Penanda memuat admin: tampil bila pindah halaman lebih dari 150 ms (garis Inertia global dimatikan untuk peserta). */
function useNavigationLoading() {
    const [loading, setLoading] = useState(false);
    const timer = useRef<number | undefined>(undefined);

    const show = useCallback(() => {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setLoading(true), 150);
    }, []);

    useEffect(() => {
        const hide = () => {
            window.clearTimeout(timer.current);
            setLoading(false);
        };
        const offStart = router.on('start', (event) => {
            if (!event.detail.visit.prefetch) show();
        });
        // Klik menu yang menunggu prefetch tidak memicu 'start'/'finish', jadi 'navigate' juga menutupnya.
        const offFinish = router.on('finish', hide);
        const offNavigate = router.on('navigate', hide);
        return () => {
            hide();
            offStart();
            offFinish();
            offNavigate();
        };
    }, [show]);

    return { loading, show };
}

/**
 * Tombol Darurat: jeda seluruh program atau satu titik. Langkah 1 pilih cakupan dan tulis alasan, langkah 2
 * centang "Saya mengerti dampaknya". Bila sudah dijeda, tampil pilihan melanjutkan.
 */
export function EmergencyDialog({
    open,
    onClose,
    admin,
    initialScope = 'program',
    initialOutlet,
}: {
    open: boolean;
    onClose: () => void;
    admin: AdminShared;
    initialScope?: 'program' | 'outlet';
    initialOutlet?: number;
}) {
    const form = useForm<{ scope: 'program' | 'outlet'; outlet_id: string; reason: string; confirm: boolean }>({
        scope: initialScope,
        outlet_id: initialOutlet ? String(initialOutlet) : '',
        reason: '',
        confirm: false,
    });

    useEffect(() => {
        if (open) {
            form.setData({ scope: initialScope, outlet_id: initialOutlet ? String(initialOutlet) : '', reason: '', confirm: false });
            form.clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const pausedOutlets = admin.outlets.filter((o) => o.status !== 'active');

    function submit() {
        form.post('/admin/darurat/jeda', { preserveScroll: true, onSuccess: onClose });
    }

    function resume(scope: 'program' | 'outlet', outletId?: number) {
        router.post('/admin/darurat/lanjutkan', { scope, outlet_id: outletId ?? null }, { preserveScroll: true, onSuccess: onClose });
    }

    const isProgram = form.data.scope === 'program';

    return (
        <Modal open={open} onClose={onClose} danger>
            <h2 className="pr-8 text-[17px] font-extrabold">{isProgram ? 'Jeda seluruh program?' : 'Jeda satu titik?'}</h2>
            <p className="text-ink/60 mt-1 text-[12px] leading-relaxed">
                {isProgram
                    ? 'Peserta akan melihat halaman dijeda. Klaim yang sedang berjalan tidak hilang. Penukaran voucher di mitra tetap berjalan.'
                    : 'Peserta tidak bisa klaim di titik ini sampai dilanjutkan. Titik lain tetap berjalan.'}
            </p>

            <div className="mt-3 flex gap-2">
                <Btn variant={isProgram ? 'black' : 'outline'} onClick={() => form.setData('scope', 'program')}>
                    Seluruh program
                </Btn>
                <Btn variant={!isProgram ? 'black' : 'outline'} onClick={() => form.setData('scope', 'outlet')}>
                    Satu titik
                </Btn>
            </div>

            {!isProgram && (
                <div className="mt-3">
                    <SelectInput
                        value={form.data.outlet_id}
                        onChange={(v) => form.setData('outlet_id', v)}
                        placeholder="Pilih titik"
                        options={admin.outlets.filter((o) => o.status === 'active').map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` }))}
                    />
                    {form.errors.outlet_id && <p className="mt-1 text-[11px] font-semibold text-[#b42318]">{form.errors.outlet_id}</p>}
                </div>
            )}

            <label className="mt-3 block">
                <span className="text-[11px] font-bold">
                    Alasan
                    <Req />
                </span>
                <TextArea
                    value={form.data.reason}
                    onChange={(e) => form.setData('reason', e.target.value)}
                    placeholder="Tulis alasan jeda"
                    className="mt-1"
                />
                <Hint>Minimal 5 huruf, mis. Kode slot W07 bocor di media sosial. Tercatat di log.</Hint>
                {form.errors.reason && <p className="mt-1 text-[11px] font-semibold text-[#b42318]">{form.errors.reason}</p>}
            </label>

            <label className="mt-3 flex items-center gap-2 text-[12px]">
                <input
                    type="checkbox"
                    checked={form.data.confirm}
                    onChange={(e) => form.setData('confirm', e.target.checked)}
                    className="accent-ink size-4"
                />
                Saya mengerti dampaknya (langkah 2 dari 2)
            </label>
            {form.errors.confirm && <p className="mt-1 text-[11px] font-semibold text-[#b42318]">{form.errors.confirm}</p>}

            <div className="mt-4 flex justify-end gap-2">
                <Btn variant="outline" onClick={onClose}>
                    Batal
                </Btn>
                <Btn variant="red" disabled={!form.data.confirm || form.data.reason.trim().length < 5 || form.processing} onClick={submit}>
                    {isProgram ? 'Jeda program' : 'Jeda titik'}
                </Btn>
            </div>

            {(admin.paused || pausedOutlets.length > 0) && (
                <div className="border-ink/10 mt-5 border-t pt-4">
                    <p className="text-ink/50 text-[11px] font-bold">Sedang dijeda</p>
                    <div className="mt-2 space-y-2">
                        {admin.paused && (
                            <div className="flex items-center justify-between gap-2 rounded-lg bg-[#fde0dc]/60 px-3 py-2 text-[12px]">
                                <span>
                                    <b>Seluruh program</b>
                                    {admin.pauseReason ? ` · ${admin.pauseReason}` : ''}
                                </span>
                                <Btn variant="black" onClick={() => resume('program')}>
                                    Lanjutkan
                                </Btn>
                            </div>
                        )}
                        {pausedOutlets.map((o) => (
                            <div key={o.id} className="bg-ink/[0.04] flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-[12px]">
                                <span>
                                    Titik <b>{o.code}</b> · {o.name}
                                </span>
                                <Btn variant="black" onClick={() => resume('outlet', o.id)}>
                                    Lanjutkan
                                </Btn>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Modal>
    );
}

export type { AdminShared };
