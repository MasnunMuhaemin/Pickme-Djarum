import { cn } from '@/lib/utils';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, LogOut, X } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
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

export function LogoutButton({ dark, className }: { dark?: boolean; className?: string }) {
    const { props } = usePage();
    const isLoggedIn = Boolean((props.auth as { participant?: unknown } | undefined)?.participant);
    if (!isLoggedIn) return null;

    return (
        <button
            type="button"
            aria-label="Keluar"
            title="Keluar"
            onClick={() => router.post('/participant/keluar')}
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

export function PageHeader({
    title,
    back,
    close,
    right,
    dark,
    className,
}: {
    title?: string;
    back?: string;
    close?: string;
    right?: ReactNode;
    dark?: boolean;
    className?: string;
}) {
    return (
        <header className={cn('flex h-14 shrink-0 items-center gap-2 px-3 md:px-8', dark ? 'text-cream' : 'text-ink', className)}>
            {back && (
                <Link href={back} aria-label="Kembali" className="grid size-10 place-items-center rounded-full hover:bg-black/5">
                    <ArrowLeft className="size-5" />
                </Link>
            )}
            {close && (
                <Link href={close} aria-label="Tutup" className="grid size-10 place-items-center rounded-full hover:bg-black/5">
                    <X className="size-5" />
                </Link>
            )}
            <h1 className="min-w-0 flex-1 truncate text-center text-sm font-bold">{title}</h1>
            <div className="flex items-center gap-1">
                {right}
                <LogoutButton dark={dark} />
            </div>
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
    const box = useRef<HTMLDivElement>(null);
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

    const year = view.getFullYear();
    const month = view.getMonth();
    const first = (new Date(year, month, 1).getDay() + 6) % 7;
    const total = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const label = parsed ? `${pad(parsed.getDate())} ${monthNames[parsed.getMonth()].slice(0, 3)} ${parsed.getFullYear()}` : placeholder;

    function pick(day: number) {
        onChange(`${year}-${pad(month + 1)}-${pad(day)}`);
        setOpen(false);
    }

    return (
        <div className="relative" ref={box}>
            <button type="button" onClick={() => setOpen(!open)} className={cn(inputClass, 'flex items-center justify-between text-left')}>
                <span className={parsed ? 'text-ink' : 'text-ink-soft/70'}>{label}</span>
                <CalendarDays className="text-ink-soft size-4 shrink-0" />
            </button>
            {open && (
                <div className="border-ink/10 bg-cream absolute top-full left-0 z-50 mt-1 w-full min-w-[260px] rounded-2xl border p-3 shadow-xl">
                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            aria-label="Bulan sebelumnya"
                            onClick={() => setView(new Date(year, month - 1, 1))}
                            className="text-ink-soft hover:bg-cream-deep grid size-8 place-items-center rounded-full"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <p className="text-[12px] font-extrabold">
                            {monthNames[month]} {year}
                        </p>
                        <button
                            type="button"
                            aria-label="Bulan berikutnya"
                            onClick={() => setView(new Date(year, month + 1, 1))}
                            className="text-ink-soft hover:bg-cream-deep grid size-8 place-items-center rounded-full"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
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

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:items-center md:justify-center md:p-6">
            <button aria-label="Tutup" onClick={onClose} className="absolute inset-0 bg-black/55" />
            <div className="animate-in slide-in-from-bottom bg-cream relative mx-auto max-h-[88dvh] w-full max-w-[430px] overflow-y-auto rounded-t-3xl p-5 pb-8 shadow-2xl md:max-w-md md:rounded-3xl md:pb-6">
                <div className="bg-ink/20 mx-auto mb-4 h-1 w-10 rounded-full" />
                {title && <h2 className="text-ink mb-1 text-lg font-extrabold tracking-tight">{title}</h2>}
                {children}
            </div>
        </div>
    );
}

export function ProgressDots({ value, total = 10 }: { value: number; total?: number }) {
    return (
        <div className="flex items-center gap-1.5">
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={cn(
                        'grid size-7 place-items-center rounded-full text-[10px] font-bold',
                        i < value ? 'bg-ink text-cream' : 'border-ink/20 text-ink-soft border',
                    )}
                >
                    {i < value ? <Check className="size-3" /> : i + 1}
                </span>
            ))}
        </div>
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
