import { goBack } from '@/features/participant/nav-history';
import { cn } from '@/lib/utils';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, LogOut, X } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes, TouchEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

type Tone = 'lime' | 'amber' | 'muted' | 'danger' | 'violet';

const toneClass: Record<Tone, string> = {
    lime: 'bg-lime-soft text-ink',
    amber: 'bg-[#fdf0cf] text-[#8a5a00]',
    muted: 'bg-cream-deep text-ink-soft',
    danger: 'bg-[#fbe3e0] text-danger',
    violet: 'bg-[#ece0ff] text-violet',
};

export function Badge({ children, tone = 'lime', className }: { children: ReactNode; tone?: Tone; className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold', toneClass[tone], className)}>
            {children}
        </span>
    );
}

/**
 * Keluar dari akun peserta. Halaman yang dimuat lebih dulu (prefetch) masih berisi status masuk, jadi cache dibuang
 * sebelum dan sesudah keluar supaya tidak ada halaman yang masih terbaca masuk.
 */
export function logoutParticipant() {
    router.flushAll();
    router.post('/participant/keluar', {}, { onFinish: () => router.flushAll() });
}

export function LogoutButton({ dark, className }: { dark?: boolean; className?: string }) {
    const { props } = usePage();
    const isLoggedIn = Boolean((props.auth as { participant?: unknown } | undefined)?.participant);
    if (!isLoggedIn) return null;

    return (
        <button
            type="button"
            aria-label="Keluar"
            title="Keluar"
            onClick={logoutParticipant}
            className={cn(
                'grid size-10 shrink-0 place-items-center rounded-full transition',
                dark ? 'text-cream/70 hover:text-cream hover:bg-white/10' : 'text-ink-soft hover:bg-cream-deep hover:text-ink',
                className,
            )}
        >
            <LogOut className="size-4" />
        </button>
    );
}

/**
 * Tombol kembali: ke halaman peserta sebelumnya (lihat nav-history), atau ke `fallback` bila tidak ada riwayat.
 * Tetap berupa tautan ke `fallback` supaya bisa dibuka di tab baru.
 */
export function BackLink({ fallback, className, children }: { fallback: string; className?: string; children: ReactNode }) {
    return (
        <Link
            href={fallback}
            aria-label="Kembali"
            className={className}
            onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                goBack(fallback);
            }}
        >
            {children}
        </Link>
    );
}

export function PageHeader({
    title,
    back,
    close,
    right,
    dark,
    icon,
    className,
}: {
    title?: string;
    back?: string;
    close?: string;
    right?: ReactNode;
    dark?: boolean;
    /** Ikon di depan judul, mis. tanda centang di "Klaim berhasil". */
    icon?: ReactNode;
    className?: string;
}) {
    // Layar gelap (kamera) tetap memakai bilah tipis; layar lain memakai header lime bergambar kota seperti desain.
    if (dark) {
        return (
            <header className={cn('text-cream flex h-14 shrink-0 items-center justify-between gap-2 px-3 md:px-8', className)}>
                <div className="flex items-center">
                    {back && (
                        <BackLink fallback={back} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
                            <ArrowLeft className="size-5" />
                        </BackLink>
                    )}
                </div>
                <h1 className="min-w-0 truncate text-center text-sm font-bold">{title}</h1>
                <div className="flex items-center justify-end gap-1">
                    {right}
                    <LogoutButton dark />
                </div>
            </header>
        );
    }

    const roundButton = 'bg-ink text-lime grid size-10 shrink-0 place-items-center rounded-full';
    return (
        <header className={cn('lime-hero text-ink shrink-0', className)}>
            <div className="px-5 pt-4 pb-10 md:px-8 md:pt-6">
                <div className="flex min-h-10 items-center justify-between gap-3">
                    {back ? (
                        <BackLink fallback={back} className={roundButton}>
                            <ArrowLeft className="size-5" strokeWidth={2.5} />
                        </BackLink>
                    ) : close ? (
                        <Link href={close} aria-label="Tutup" className={roundButton}>
                            <X className="size-5" strokeWidth={2.5} />
                        </Link>
                    ) : (
                        <span />
                    )}
                    <div className="flex items-center gap-2">
                        {right}
                        {/* Layar dengan tombol tutup (Klaim berhasil) tidak menampilkan tombol keluar kedua. */}
                        {!close && <LogoutButton className="bg-ink text-lime hover:bg-ink/85 hover:text-lime md:hidden" />}
                    </div>
                </div>
                {title && (
                    <h1 className="mt-3 flex items-center gap-2.5 text-[30px] leading-[1.05] font-extrabold tracking-tight md:text-[40px]">
                        {icon}
                        <span className="min-w-0">{title}</span>
                    </h1>
                )}
            </div>
            {/* Lengkung krem: konten halaman di bawahnya tampak seperti panel yang menutupi header. */}
            <div aria-hidden className="bg-cream -mt-px h-7 rounded-t-[2rem]" />
        </header>
    );
}

type ButtonProps = {
    children: ReactNode;
    href?: string;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
};

const primaryClass =
    'flex h-12 w-full items-center justify-center gap-2 rounded-full bg-lime px-5 text-sm font-bold text-ink shadow-sm transition active:scale-[0.99] disabled:opacity-50';
const outlineClass =
    'flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ink/25 bg-transparent px-5 text-sm font-bold text-ink transition active:scale-[0.99]';

export function PrimaryButton({ children, href, onClick, type = 'button', disabled, className }: ButtonProps) {
    if (href) {
        return (
            <Link href={href} className={cn(primaryClass, className)}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={cn(primaryClass, className)}>
            {children}
        </button>
    );
}

export function OutlineButton({ children, href, onClick, type = 'button', disabled, className }: ButtonProps) {
    if (href) {
        return (
            <Link href={href} className={cn(outlineClass, className)}>
                {children}
            </Link>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={cn(outlineClass, className)}>
            {children}
        </button>
    );
}

export function TextLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
    return (
        <Link href={href} className={cn('text-ink text-xs font-semibold underline underline-offset-2', className)}>
            {children}
        </Link>
    );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('border-ink/8 bg-cream-soft rounded-2xl border p-4', className)}>{children}</div>;
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
    return (
        <label className="block">
            <span className="text-ink mb-1.5 block text-xs font-semibold">{label}</span>
            {children}
            {hint && <span className="text-ink-soft mt-1 block text-[11px]">{hint}</span>}
        </label>
    );
}

const inputClass =
    'h-12 w-full rounded-xl border border-ink/15 bg-white px-3.5 text-sm text-ink outline-none placeholder:text-ink-soft/60 focus:border-ink focus:ring-2 focus:ring-lime';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(inputClass, props.className)} />;
}

export const WHATSAPP_MAX = 13;

/** Hanya angka, maksimal 13 digit. Awalan 62 (mis. hasil tempel +62...) diubah jadi 0. */
export function toWhatsapp(value: string): string {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('62')) digits = `0${digits.slice(2)}`;
    return digits.slice(0, WHATSAPP_MAX);
}

export function PinInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input
                {...props}
                type={visible ? 'text' : 'password'}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoComplete="off"
                className={cn(inputClass, 'pr-12', className)}
            />
            <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? 'Sembunyikan PIN' : 'Lihat PIN'}
                className="text-ink-soft hover:text-ink absolute inset-y-0 right-0 grid w-12 place-items-center"
            >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
        </div>
    );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cn(inputClass, 'h-24 resize-none py-3', props.className)} />;
}

export type SelectOption = { value: string; label: string };

export function Select({
    value,
    onChange,
    options,
    placeholder = 'Pilih',
}: {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
}) {
    const selected = options.find((option) => option.value === value);
    return (
        <Listbox value={value} onChange={onChange}>
            <div className="relative">
                <ListboxButton className={cn(inputClass, 'flex items-center justify-between text-left')}>
                    <span className={selected ? 'text-ink' : 'text-ink-soft/70'}>{selected?.label ?? placeholder}</span>
                    <ChevronDown className="text-ink-soft size-4 shrink-0" />
                </ListboxButton>
                <ListboxOptions
                    anchor="bottom start"
                    className="border-ink/10 bg-cream z-50 mt-1 max-h-60 w-[var(--button-width)] overflow-y-auto rounded-xl border p-1 shadow-xl [--anchor-gap:4px] focus:outline-none"
                >
                    {options.map((option) => (
                        <ListboxOption
                            key={option.value}
                            value={option.value}
                            className="text-ink data-[focus]:bg-cream-deep flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-[13px] font-semibold"
                        >
                            <span>{option.label}</span>
                            {option.value === value && <Check className="text-ink size-4" />}
                        </ListboxOption>
                    ))}
                </ListboxOptions>
            </div>
        </Listbox>
    );
}

const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const pad = (n: number) => String(n).padStart(2, '0');

export function DateField({
    value,
    onChange,
    placeholder = 'Pilih tanggal',
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const [mode, setMode] = useState<'day' | 'year'>('day');
    const box = useRef<HTMLDivElement>(null);
    const yearList = useRef<HTMLDivElement>(null);
    const parsed = value ? new Date(`${value}T00:00:00`) : null;
    const [view, setView] = useState(() => {
        const d = parsed ?? new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);

    useEffect(() => {
        if (!open || mode !== 'year') return;
        yearList.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'center' });
    }, [open, mode]);

    const year = view.getFullYear();
    const month = view.getMonth();
    const first = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const label = parsed ? `${pad(parsed.getDate())} ${monthNames[parsed.getMonth()].slice(0, 3)} ${parsed.getFullYear()}` : placeholder;

    const years = Array.from({ length: 101 }, (_, i) => today.getFullYear() - i);

    function toggle() {
        // Belum ada tanggal: langsung buka pilihan tahun supaya tidak perlu mundur per bulan.
        if (!open) setMode(parsed ? 'day' : 'year');
        setOpen(!open);
    }

    function pickYear(y: number) {
        setView(new Date(y, Math.min(month, y === today.getFullYear() ? today.getMonth() : 11), 1));
        setMode('day');
    }

    function pick(day: number) {
        onChange(`${year}-${pad(month + 1)}-${pad(day)}`);
        setOpen(false);
    }

    return (
        <div className="relative" ref={box}>
            <button type="button" onClick={toggle} className={cn(inputClass, 'flex items-center justify-between text-left')}>
                <span className={parsed ? 'text-ink' : 'text-ink-soft/70'}>{label}</span>
                <CalendarDays className="text-ink-soft size-4 shrink-0" />
            </button>
            {open && (
                <div className="border-ink/10 bg-cream text-ink absolute top-full left-0 z-50 mt-1 w-full min-w-[260px] rounded-2xl border p-3 shadow-xl">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            aria-label="Bulan sebelumnya"
                            onClick={() => setView(new Date(year, month - 1, 1))}
                            className="text-ink-soft hover:bg-cream-deep grid size-8 place-items-center rounded-full"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode(mode === 'year' ? 'day' : 'year')}
                            className="hover:bg-cream-deep text-ink flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-extrabold"
                        >
                            {monthNames[month]} {year}
                            <ChevronDown className={cn('size-3.5 transition-transform', mode === 'year' && 'rotate-180')} />
                        </button>
                        <button
                            type="button"
                            aria-label="Bulan berikutnya"
                            onClick={() => setView(new Date(year, month + 1, 1))}
                            className="text-ink-soft hover:bg-cream-deep grid size-8 place-items-center rounded-full"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                    {mode === 'year' ? (
                        <div ref={yearList} className="mt-2 grid max-h-56 grid-cols-4 gap-1.5 overflow-y-auto">
                            {years.map((y) => (
                                <button
                                    key={y}
                                    type="button"
                                    data-active={y === year}
                                    onClick={() => pickYear(y)}
                                    className={cn(
                                        'h-9 rounded-lg text-[12px] font-semibold',
                                        y === year ? 'bg-ink text-cream' : 'text-ink hover:bg-cream-deep',
                                    )}
                                >
                                    {y}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                            {dayNames.map((d) => (
                                <span key={d} className="text-ink-soft py-1 text-[9px] font-bold">
                                    {d}
                                </span>
                            ))}
                            {Array.from({ length: first }, (_, i) => (
                                <span key={`e${i}`} />
                            ))}
                            {Array.from({ length: total }, (_, i) => {
                                const day = i + 1;
                                const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
                                const isSelected = parsed?.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day;
                                const future = new Date(year, month, day) > today;
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        disabled={future}
                                        onClick={() => pick(day)}
                                        className={cn(
                                            'grid size-8 place-items-center rounded-full text-[11px] font-semibold',
                                            isSelected ? 'bg-ink text-cream' : 'text-ink hover:bg-cream-deep',
                                            isToday && !isSelected && 'ring-ink/30 ring-1',
                                            future && 'text-ink/25',
                                        )}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (value: boolean) => void; children: ReactNode }) {
    return (
        <label className="text-ink-soft flex items-start gap-2.5 text-[11px] leading-relaxed">
            <button
                type="button"
                role="checkbox"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={cn(
                    'mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border',
                    checked ? 'border-ink bg-ink text-cream' : 'border-ink/30 bg-white',
                )}
            >
                {checked && <Check className="size-3.5" />}
            </button>
            <span>{children}</span>
        </label>
    );
}

type SheetProps = { open: boolean; onClose: () => void; title?: string; className?: string; children: ReactNode };

/**
 * Sheet pemberitahuan: lingkaran ikon (merah untuk masalah, hitam untuk angka/status), judul, keterangan, dan
 * satu atau dua tombol. Dipakai untuk batas klaim, papan penuh, dan kamera belum diizinkan.
 */
export function NoticeSheet({
    open,
    onClose,
    icon,
    tone = 'dark',
    title,
    text,
    primary,
    secondary,
    stacked,
}: {
    open: boolean;
    onClose: () => void;
    icon: ReactNode;
    /** danger: lingkaran merah penuh; warn: lingkaran merah muda dengan ikon merah (desain mitra); dark: hitam. */
    tone?: 'danger' | 'warn' | 'dark';
    title: string;
    text: string;
    primary: { label: string; href?: string; onClick?: () => void };
    secondary?: { label: string; href?: string; onClick?: () => void };
    /** Tombol bersusun: utama di atas, garis di bawah (desain mitra). Bawaan: berdampingan. */
    stacked?: boolean;
}) {
    const secondaryButton = secondary && (
        <OutlineButton
            href={secondary.href}
            onClick={secondary.onClick ?? (secondary.href ? undefined : onClose)}
            className={stacked ? 'border-ink h-14 border-2 text-[16px] font-extrabold' : undefined}
        >
            {secondary.label}
        </OutlineButton>
    );
    const primaryButton = (
        <PrimaryButton
            href={primary.href}
            onClick={primary.onClick ?? (primary.href ? undefined : onClose)}
            className={stacked ? 'h-14 text-[16px] font-extrabold' : undefined}
        >
            {primary.label}
        </PrimaryButton>
    );

    return (
        <Sheet open={open} onClose={onClose}>
            <div className="py-1">
                <span
                    className={cn(
                        'grid size-14 place-items-center rounded-full text-[20px] font-extrabold',
                        tone === 'danger' ? 'bg-danger text-white' : tone === 'warn' ? 'text-danger bg-[#fbe3e0] text-[26px]' : 'bg-ink text-lime',
                    )}
                >
                    {icon}
                </span>
                <h2 className="mt-4 text-[24px] leading-tight font-extrabold tracking-tight">{title}</h2>
                <p className="text-ink-soft mt-1.5 text-[13px] leading-relaxed">{text}</p>
            </div>
            {stacked ? (
                <div className="mt-5 flex flex-col gap-3">
                    {primaryButton}
                    {secondaryButton}
                </div>
            ) : (
                <div className="mt-5 flex gap-2.5">
                    {secondaryButton}
                    {primaryButton}
                </div>
            )}
        </Sheet>
    );
}

export function Sheet(props: SheetProps) {
    if (!props.open) return null;
    return <SheetPanel {...props} />;
}

const CLOSE_DISTANCE = 120; // px
const CLOSE_VELOCITY = 0.6; // px per ms

/** Apakah sentuhan dimulai di elemen yang sedang di-scroll (mis. daftar tahun), sehingga gesture tidak boleh menutup sheet. */
function insideScrolled(target: EventTarget | null, panel: HTMLElement): boolean {
    let el = target as HTMLElement | null;
    while (el && el !== panel) {
        if (el.scrollTop > 0) return true;
        el = el.parentElement;
    }
    return panel.scrollTop > 0;
}

function SheetPanel({ onClose, title, className, children }: SheetProps) {
    const panel = useRef<HTMLDivElement>(null);
    const drag = useRef<{ y: number; t: number; active: boolean } | null>(null);
    const [offset, setOffset] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [closing, setClosing] = useState(false);

    function close() {
        setClosing(true);
        setOffset(panel.current?.offsetHeight ?? window.innerHeight);
        window.setTimeout(onClose, 200);
    }

    function onTouchStart(e: TouchEvent) {
        if (!panel.current || closing) return;
        drag.current = { y: e.touches[0].clientY, t: Date.now(), active: !insideScrolled(e.target, panel.current) };
    }

    function onTouchMove(e: TouchEvent) {
        const d = drag.current;
        if (!d?.active) return;
        const dy = e.touches[0].clientY - d.y;
        if (dy <= 0 && !dragging) {
            // Geser ke atas: biarkan konten di-scroll seperti biasa.
            d.active = false;
            return;
        }
        setDragging(true);
        setOffset(Math.max(0, dy));
    }

    function onTouchEnd() {
        const d = drag.current;
        drag.current = null;
        if (!dragging || !d) return;
        setDragging(false);
        const velocity = offset / Math.max(1, Date.now() - d.t);
        if (offset > CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) close();
        else setOffset(0);
    }

    const height = panel.current?.offsetHeight || 1;
    const backdrop = 0.55 * (1 - Math.min(1, offset / height));

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-6">
            <button
                aria-label="Tutup"
                onClick={close}
                className="absolute inset-0 transition-colors duration-200"
                style={{ backgroundColor: `rgba(0,0,0,${backdrop})` }}
            />
            <div
                ref={panel}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                onTouchCancel={onTouchEnd}
                style={{ transform: offset ? `translateY(${offset}px)` : undefined }}
                className={cn(
                    'animate-in slide-in-from-bottom bg-cream text-ink relative mx-auto max-h-[88dvh] w-full max-w-[430px] overscroll-contain rounded-t-3xl px-5 pt-5 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl md:max-w-md md:rounded-3xl md:pb-6',
                    className,
                    dragging ? 'overflow-hidden' : 'overflow-y-auto transition-transform duration-200 ease-out',
                )}
            >
                {/* Area pegangan untuk geser tutup: dibuat lega supaya mudah disentuh di HP. */}
                <div className="-mx-5 -mt-5 mb-4 flex justify-center pt-4 pb-3 md:mb-2 md:pt-3 md:pb-2" aria-hidden>
                    <span className="bg-ink/25 h-1.5 w-12 rounded-full" />
                </div>
                {title && <h2 className="text-ink mb-1 text-lg font-extrabold tracking-tight">{title}</h2>}
                {children}
            </div>
        </div>
    );
}

/** Nomor kartu cap yang klaimnya ditolak admin: tetap terpakai (krem bercincin lime), tapi tidak dihitung sebagai cap. */
export function RejectedCap({ number, className }: { number: number; className?: string }) {
    return (
        <span
            aria-label={`Cap ${number}: klaim ditolak`}
            title="Klaim ditolak"
            className={cn('bg-cream text-ink ring-lime grid place-items-center rounded-full font-extrabold ring-[3px]', className)}
        >
            {number}
        </span>
    );
}

export function StepList({ steps }: { steps: { title: string; text: string }[] }) {
    return (
        <ol className="space-y-4">
            {steps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                    <span className="bg-lime text-ink grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold">{i + 1}</span>
                    <div>
                        <p className="text-ink text-sm font-bold">{step.title}</p>
                        <p className="text-ink-soft mt-0.5 text-xs leading-relaxed">{step.text}</p>
                    </div>
                </li>
            ))}
        </ol>
    );
}
