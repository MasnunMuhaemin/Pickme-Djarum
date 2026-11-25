import { Btn, Modal, SelectInput, TextArea } from '@/features/admin/ui';
import { useSlidingIndicator } from '@/hooks/use-sliding-indicator';
import { cn } from '@/lib/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Database, FileText, Gift, Home, Image, LayoutGrid, LogOut, Send, Settings, Trophy, Users } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';

type Badges = { photos: number; fulfillment: number; dispatch: number };
type AdminShared = {
    badges: Badges;
    paused: boolean;
    pauseReason: string | null;
    outlets: { id: number; code: string; name: string; status: string }[];
};

const menu: { key: string; label: string; href: string; icon: LucideIcon; badge?: keyof Badges }[] = [
    { key: 'beranda', label: 'Beranda', href: '/admin', icon: Home },
    { key: 'antrean-foto', label: 'Antrean foto', href: '/admin/antrean-foto', icon: Image, badge: 'photos' },
    { key: 'pemenuhan', label: 'Pemenuhan', href: '/admin/pemenuhan', icon: Gift, badge: 'fulfillment' },
    { key: 'kirim-voucher', label: 'Kirim voucher', href: '/admin/kirim-voucher', icon: Send, badge: 'dispatch' },
    { key: 'peringkat', label: 'Peringkat', href: '/admin/peringkat', icon: Trophy },
    { key: 'papan', label: 'Papan dan slot', href: '/admin/papan', icon: LayoutGrid },
    { key: 'mitra', label: 'Mitra dan pembayaran', href: '/admin/mitra', icon: Users },
    { key: 'master-data', label: 'Master data', href: '/admin/master-data', icon: Database },
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
    const [emergencyOpen, setEmergencyOpen] = useState(false);
    const { containerRef, indicatorStyle } = useSlidingIndicator('admin-sidebar', active);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        if (!flash) return;
        setToast(flash);
        const t = window.setTimeout(() => setToast(null), 3500);
        return () => window.clearTimeout(t);
    }, [flash]);

    return (
        <div className="flex min-h-dvh bg-[#f2f2f0] text-black">
            <Head title={`${title} · Admin`} />
            <aside className="sticky top-0 flex h-dvh w-[220px] shrink-0 flex-col bg-[#141414] px-3 py-5 text-white">
                <div className="px-2">
                    <p className="text-[18px] leading-none font-black tracking-tight">PICK(ME)</p>
                    <p className="mt-1 text-[11px] text-white/50">Panel admin</p>
                </div>
                <nav ref={containerRef} className="relative mt-6 flex-1 space-y-0.5 overflow-y-auto">
                    {/* Pil kuning meluncur ke menu aktif. */}
                    <span aria-hidden className="pointer-events-none absolute top-0 left-0 rounded-full bg-[#ffe500]" style={indicatorStyle} />
                    {menu.map((item) => {
                        const Icon = item.icon;
                        const count = item.badge ? (admin?.badges[item.badge] ?? 0) : 0;
                        const isActive = item.key === active;
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                prefetch="mount"
                                cacheFor="30s"
                                data-active={isActive}
                                className={cn(
                                    'relative flex h-9 items-center gap-2.5 rounded-full px-3 text-[12px] font-semibold transition-colors',
                                    isActive ? 'text-black' : 'text-white/75 hover:bg-white/10 hover:text-white',
                                )}
                            >
                                <Icon className="size-4 shrink-0" />
                                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                {count > 0 && (
                                    <span
                                        className={cn(
                                            'grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-extrabold',
                                            isActive ? 'bg-black text-[#ffe500]' : 'bg-[#ffe500] text-black',
                                        )}
                                    >
                                        {count}
                                    </span>
                                )}
                            </Link>
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
                <header className="flex items-start justify-between gap-4 px-8 pt-6 pb-4">
                    <div className="min-w-0">
                        <h1 className="text-[22px] leading-tight font-extrabold tracking-tight">{title}</h1>
                        {subtitle && <p className="mt-0.5 text-[12px] text-black/50">{subtitle}</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                        {admin?.paused && (
                            <span className="rounded-full bg-[#fde0dc] px-3 py-1 text-[11px] font-bold text-[#b42318]">Program dijeda</span>
                        )}
                        <button
                            type="button"
                            onClick={() => setEmergencyOpen(true)}
                            className="flex h-9 items-center gap-2 rounded-full bg-[#d0271d] px-4 text-[12px] font-bold text-white shadow-sm hover:bg-[#b5211a]"
                        >
                            <AlertTriangle className="size-4" />
                            Tombol Darurat
                        </button>
                        <span className="grid size-9 place-items-center rounded-full bg-[#ffe500] text-[12px] font-extrabold" title={user?.name}>
                            {initials(user?.name ?? 'Admin')}
                        </span>
                    </div>
                </header>

                {/* Isi halaman muncul memudar; halaman lama langsung diganti sehingga tidak bertumpuk. */}
                <main className="animate-in fade-in flex-1 px-8 pb-10 duration-300 motion-reduce:animate-none">{children}</main>
            </div>

            {admin && <EmergencyDialog open={emergencyOpen} onClose={() => setEmergencyOpen(false)} admin={admin} />}

            {toast && (
                <div className="fixed right-6 bottom-6 z-50 max-w-sm rounded-xl bg-black px-4 py-3 text-[12px] font-semibold text-white shadow-2xl">
                    {toast}
                </div>
            )}
        </div>
    );
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
            <p className="mt-1 text-[12px] leading-relaxed text-black/60">
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
                        onChange={(e) => form.setData('outlet_id', e.target.value)}
                        placeholder="Pilih titik"
                        options={admin.outlets.filter((o) => o.status === 'active').map((o) => ({ value: o.id, label: `${o.code} · ${o.name}` }))}
                    />
                    {form.errors.outlet_id && <p className="mt-1 text-[11px] font-semibold text-[#b42318]">{form.errors.outlet_id}</p>}
                </div>
            )}

            <label className="mt-3 block">
                <span className="text-[11px] font-bold">Alasan (wajib)</span>
                <TextArea
                    value={form.data.reason}
                    onChange={(e) => form.setData('reason', e.target.value)}
                    placeholder="Tulis alasan jeda"
                    className="mt-1"
                />
                {form.errors.reason && <p className="mt-1 text-[11px] font-semibold text-[#b42318]">{form.errors.reason}</p>}
            </label>

            <label className="mt-3 flex items-center gap-2 text-[12px]">
                <input
                    type="checkbox"
                    checked={form.data.confirm}
                    onChange={(e) => form.setData('confirm', e.target.checked)}
                    className="size-4 accent-black"
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
                <div className="mt-5 border-t border-black/10 pt-4">
                    <p className="text-[11px] font-bold text-black/50">Sedang dijeda</p>
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
                            <div key={o.id} className="flex items-center justify-between gap-2 rounded-lg bg-black/[0.04] px-3 py-2 text-[12px]">
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
