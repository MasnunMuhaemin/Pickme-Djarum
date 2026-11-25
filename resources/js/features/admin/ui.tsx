import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { X } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { useEffect } from 'react';

/** Warna panel admin dari desain: hitam, kuning, merah, abu muda. */
export const adminYellow = 'bg-[#ffe500]';

export function Card({ title, right, className, children }: { title?: ReactNode; right?: ReactNode; className?: string; children: ReactNode }) {
    return (
        <section className={cn('rounded-xl border border-black/5 bg-white p-4', className)}>
            {(title || right) && (
                <div className="mb-3 flex items-center justify-between gap-3">
                    {title && <h2 className="text-[13px] font-extrabold text-black">{title}</h2>}
                    {right}
                </div>
            )}
            {children}
        </section>
    );
}

export function PillTabs({ tabs, active }: { tabs: { key: string; label: string; href: string; count?: number }[]; active: string }) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
                <Link
                    key={tab.key}
                    href={tab.href}
                    preserveScroll
                    className={cn(
                        'flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12px] font-bold transition',
                        tab.key === active ? 'bg-black text-white' : 'border border-black/10 bg-white text-black hover:bg-black/5',
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className="grid min-w-5 place-items-center rounded-full bg-[#ffe500] px-1 text-[10px] font-extrabold text-black">
                            {tab.count}
                        </span>
                    )}
                </Link>
            ))}
        </div>
    );
}

type ChipTone = 'yellow' | 'green' | 'red' | 'gray' | 'black' | 'blue';
const chipTone: Record<ChipTone, string> = {
    yellow: 'bg-[#fff3a3] text-black',
    green: 'bg-[#d9f2dc] text-[#1d6b2c]',
    red: 'bg-[#fde0dc] text-[#b42318]',
    gray: 'bg-black/5 text-black/60',
    black: 'bg-black text-white',
    blue: 'bg-[#dbeafe] text-[#1e40af]',
};

export function Chip({ tone = 'gray', children, className }: { tone?: ChipTone; children: ReactNode; className?: string }) {
    return (
        <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold whitespace-nowrap', chipTone[tone], className)}>
            {children}
        </span>
    );
}

type BtnVariant = 'black' | 'yellow' | 'outline' | 'red' | 'ghost';
const btnVariant: Record<BtnVariant, string> = {
    black: 'bg-black text-white hover:bg-black/85',
    yellow: 'bg-[#ffe500] text-black hover:bg-[#f5da00]',
    outline: 'border border-black/20 bg-white text-black hover:bg-black/5',
    red: 'bg-[#d0271d] text-white hover:bg-[#b5211a]',
    ghost: 'text-black/60 hover:bg-black/5',
};

export function Btn({ variant = 'black', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
    return (
        <button
            type="button"
            {...props}
            className={cn(
                'inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3.5 text-[11px] font-bold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-40',
                btnVariant[variant],
                className,
            )}
        />
    );
}

export function BtnLink({
    href,
    variant = 'black',
    className,
    children,
    external,
}: {
    href: string;
    variant?: BtnVariant;
    className?: string;
    children: ReactNode;
    external?: boolean;
}) {
    const cls = cn(
        'inline-flex h-8 items-center justify-center gap-1.5 rounded-full px-3.5 text-[11px] font-bold whitespace-nowrap transition',
        btnVariant[variant],
        className,
    );
    return external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
            {children}
        </a>
    ) : (
        <Link href={href} className={cls}>
            {children}
        </Link>
    );
}

const fieldClass =
    'h-8 w-full rounded-lg border border-black/15 bg-white px-2.5 text-[12px] text-black outline-none placeholder:text-black/35 focus:border-black';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cn(fieldClass, 'h-20 py-2', props.className)} />;
}

export function SelectInput({
    options,
    placeholder,
    ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string | number; label: string }[]; placeholder?: string }) {
    return (
        <select {...props} className={cn(fieldClass, 'pr-7', props.className)}>
            {placeholder !== undefined && <option value="">{placeholder}</option>}
            {options.map((o) => (
                <option key={o.value} value={o.value}>
                    {o.label}
                </option>
            ))}
        </select>
    );
}

export function FieldError({ message }: { message?: string }) {
    return message ? <p className="mt-1 text-[11px] font-semibold text-[#b42318]">{message}</p> : null;
}

/** Tabel padat gaya desain: header abu kecil, baris bergaris tipis. */
export function Table({ head, children, className }: { head: ReactNode[]; children: ReactNode; className?: string }) {
    return (
        <div className={cn('overflow-x-auto', className)}>
            <table className="w-full text-left text-[12px]">
                <thead>
                    <tr className="border-b border-black/10 text-[10px] font-bold text-black/50">
                        {head.map((h, i) => (
                            <th key={i} className="px-2 py-2 font-bold whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-black/5">{children}</tbody>
            </table>
        </div>
    );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
    return <td className={cn('px-2 py-2.5 align-middle', className)}>{children}</td>;
}

export function Empty({ children }: { children: ReactNode }) {
    return <p className="rounded-lg bg-black/[0.03] p-4 text-center text-[12px] text-black/50">{children}</p>;
}

/** Modal tengah dengan bingkai (merah untuk aksi berbahaya), tutup dengan Esc atau klik latar. */
export function Modal({
    open,
    onClose,
    danger,
    children,
    width = 'max-w-md',
}: {
    open: boolean;
    onClose: () => void;
    danger?: boolean;
    children: ReactNode;
    width?: string;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onMouseDown={onClose}>
            <div
                role="dialog"
                aria-modal
                onMouseDown={(e) => e.stopPropagation()}
                className={cn('relative w-full rounded-2xl bg-white p-5 shadow-2xl', width, danger && 'border-2 border-[#d0271d]')}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup"
                    className="absolute top-3 right-3 grid size-7 place-items-center rounded-full text-black/50 hover:bg-black/5"
                >
                    <X className="size-4" />
                </button>
                {children}
            </div>
        </div>
    );
}

export function rupiah(value: number): string {
    return 'Rp' + value.toLocaleString('id-ID');
}
