import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { CheckboxItem as DropdownMenuCheckboxItem } from '@radix-ui/react-dropdown-menu';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, X } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { useEffect, useState } from 'react';

/** Warna panel admin mengikuti halaman login: night, lime, cream, ink. */
export const adminYellow = 'bg-lime';

export function Card({ title, right, className, children }: { title?: ReactNode; right?: ReactNode; className?: string; children: ReactNode }) {
    return (
        <section className={cn('border-ink/5 min-w-0 rounded-xl border bg-white p-4', className)}>
            {(title || right) && (
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    {title && <h2 className="text-ink text-[13px] font-extrabold">{title}</h2>}
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
                        tab.key === active ? 'bg-ink text-white' : 'border-ink/10 text-ink hover:bg-ink/5 border bg-white',
                    )}
                >
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                        <span className="bg-lime text-ink grid min-w-5 place-items-center rounded-full px-1 text-[10px] font-extrabold">
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
    // Kuning tetap dipakai untuk status menunggu supaya beda dari hijau (selesai).
    yellow: 'bg-[#fff3a3] text-ink',
    green: 'bg-[#d9f2dc] text-[#1d6b2c]',
    red: 'bg-[#fde0dc] text-[#b42318]',
    gray: 'bg-ink/5 text-ink/60',
    black: 'bg-ink text-white',
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
    black: 'bg-ink text-white hover:bg-ink/85',
    yellow: 'bg-lime text-ink hover:bg-lime-dark',
    outline: 'border border-ink/20 bg-white text-ink hover:bg-ink/5',
    red: 'bg-[#d0271d] text-white hover:bg-[#b5211a]',
    ghost: 'text-ink/60 hover:bg-ink/5',
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
    'h-8 w-full rounded-lg border border-ink/15 bg-white px-2.5 text-[12px] text-ink outline-none placeholder:text-ink/35 focus:border-ink';

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(fieldClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return <textarea {...props} className={cn(fieldClass, 'h-20 py-2', props.className)} />;
}

// Satu desain untuk semua dropdown admin (pilihan-satu, pilihan-banyak, tanggal): tombol, panel, dan baris sama.
const triggerClass = cn(fieldClass, 'flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50');
const panelClass =
    'border-ink/10 text-ink z-[70] max-h-72 overflow-y-auto rounded-xl border bg-white p-1 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.35)]';
const itemClass =
    'text-ink flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] outline-none select-none data-[highlighted]:bg-lime-soft data-[highlighted]:text-ink data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40';

function Trigger({ label, empty, className, disabled }: { label: ReactNode; empty: boolean; className?: string; disabled?: boolean }) {
    return (
        <DropdownMenuTrigger asChild disabled={disabled}>
            <button type="button" className={cn(triggerClass, empty && 'text-ink/35', className)}>
                <span className="min-w-0 truncate">{label}</span>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
            </button>
        </DropdownMenuTrigger>
    );
}

/** Dropdown pilihan-satu. Placeholder ikut menjadi pilihan "kosong" bila isian boleh dikosongkan. */
export function SelectInput({
    options,
    placeholder,
    value,
    onChange,
    disabled,
    className,
}: {
    options: { value: string | number; label: string }[];
    placeholder?: string;
    value: string | number;
    onChange: (value: string) => void;
    disabled?: boolean;
    className?: string;
}) {
    const current = options.find((o) => String(o.value) === String(value));
    const choices = placeholder !== undefined ? [{ value: '', label: placeholder }, ...options] : options;
    return (
        <DropdownMenu modal={false}>
            <Trigger label={current?.label ?? placeholder ?? 'Pilih'} empty={!current} className={className} disabled={disabled} />
            <DropdownMenuContent align="start" className={cn(panelClass, 'w-[var(--radix-dropdown-menu-trigger-width)] min-w-48')}>
                {choices.map((o) => {
                    const selected = String(o.value) === String(value);
                    return (
                        <DropdownMenuItem key={String(o.value) || 'kosong'} onSelect={() => onChange(String(o.value))} className={itemClass}>
                            <span className={cn('min-w-0 flex-1', o.value === '' && 'text-ink/50')}>{o.label}</span>
                            {selected && <Check className="size-3.5 shrink-0" strokeWidth={3} />}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** Nomor HP disamarkan sampai admin menekan ikon mata. */
export function Phone({ value, className }: { value?: string | null; className?: string }) {
    const [shown, setShown] = useState(false);
    if (!value) return <span className={className}>-</span>;
    const masked = value.length > 8 ? `${value.slice(0, 4)}••••${value.slice(-4)}` : '••••';
    return (
        <span className={cn('inline-flex items-center gap-1 whitespace-nowrap', className)}>
            <span className="font-mono">{shown ? value : masked}</span>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setShown(!shown);
                }}
                aria-label={shown ? 'Sembunyikan nomor' : 'Tampilkan nomor'}
                className="text-ink/45 hover:text-ink grid size-5 place-items-center rounded-full"
            >
                {shown ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
            </button>
        </span>
    );
}

/**
 * Dropdown pilihan-banyak (mis. area kos warung, jenis voucher di papan). Daftar tetap terbuka saat memilih supaya
 * admin bisa memilih beberapa sekaligus; pilihan tampil sebagai ringkasan di tombolnya.
 */
export function MultiSelect({
    options,
    value,
    onChange,
    placeholder,
    className,
}: {
    options: { value: number; label: string }[];
    value: number[];
    onChange: (value: number[]) => void;
    placeholder: string;
    className?: string;
}) {
    const chosen = options.filter((o) => value.includes(o.value));
    const summary = chosen.length === 0 ? placeholder : chosen.length <= 2 ? chosen.map((o) => o.label).join(', ') : `${chosen.length} dipilih`;
    return (
        <DropdownMenu modal={false}>
            <Trigger label={summary} empty={!chosen.length} className={className} />
            <DropdownMenuContent align="start" className={cn(panelClass, 'w-[var(--radix-dropdown-menu-trigger-width)] min-w-48')}>
                {options.length === 0 && <p className="text-ink/45 px-2.5 py-2 text-[12px]">Belum ada pilihan.</p>}
                {options.length > 0 && (
                    <div className="border-ink/10 mb-1 flex items-center justify-between border-b px-2.5 pt-1 pb-2 text-[11px]">
                        <span className="text-ink/55 font-bold">
                            {chosen.length} dari {options.length} dipilih
                        </span>
                        {chosen.length > 0 && (
                            <button type="button" onClick={() => onChange([])} className="font-bold text-[#b42318] hover:underline">
                                Hapus semua
                            </button>
                        )}
                    </div>
                )}
                {options.map((o) => {
                    const selected = value.includes(o.value);
                    return (
                        <DropdownMenuCheckboxItem
                            key={o.value}
                            checked={selected}
                            // Daftar tetap terbuka supaya bisa mencentang beberapa sekaligus.
                            onSelect={(e) => e.preventDefault()}
                            onCheckedChange={(on) => onChange(on ? [...value, o.value] : value.filter((v) => v !== o.value))}
                            className={cn(itemClass, 'pl-2.5', selected && 'font-bold')}
                        >
                            {/* Kotak centang terlihat jelas: terisi bila dipilih, kosong bila belum. */}
                            <span
                                aria-hidden
                                className={cn(
                                    'grid size-4 shrink-0 place-items-center rounded border-2 transition',
                                    selected ? 'border-ink bg-ink text-white' : 'border-ink/30 bg-white',
                                )}
                            >
                                {selected && <Check className="size-3" strokeWidth={3.5} />}
                            </span>
                            <span className="min-w-0 flex-1">{o.label}</span>
                        </DropdownMenuCheckboxItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Pilih tanggal dengan desain dropdown admin (pengganti kalender bawaan browser). Nilai berformat YYYY-MM-DD.
 * Tanggal setelah hari ini tidak bisa dipilih karena server hanya menerima tanggal sampai hari ini.
 */
export function DateInput({ value, onChange, className }: { value: string; onChange: (value: string) => void; className?: string }) {
    const today = iso(new Date());
    const start = value ? new Date(`${value}T00:00:00`) : new Date();
    const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    // Minggu dimulai Senin.
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, k) => new Date(month.getFullYear(), month.getMonth(), k + 1))];
    const label = value ? `${start.getDate()} ${MONTHS[start.getMonth()]} ${start.getFullYear()}` : 'Pilih tanggal';
    const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

    return (
        <DropdownMenu modal={false}>
            <Trigger label={label} empty={!value} className={className} />
            <DropdownMenuContent align="start" className={cn(panelClass, 'max-h-none w-64 overflow-visible p-3')}>
                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => shift(-1)}
                        aria-label="Bulan sebelumnya"
                        className="hover:bg-ink/5 grid size-7 place-items-center rounded-full"
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <span className="text-[12px] font-extrabold">
                        {MONTHS[month.getMonth()]} {month.getFullYear()}
                    </span>
                    <button
                        type="button"
                        onClick={() => shift(1)}
                        disabled={iso(new Date(month.getFullYear(), month.getMonth() + 1, 1)) > today}
                        aria-label="Bulan berikutnya"
                        className="hover:bg-ink/5 grid size-7 place-items-center rounded-full disabled:opacity-30"
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
                <div className="text-ink/45 mt-2 grid grid-cols-7 text-center text-[10px] font-bold">
                    {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((d) => (
                        <span key={d}>{d}</span>
                    ))}
                </div>
                <div className="mt-1 grid grid-cols-7 gap-0.5">
                    {cells.map((d, k) => {
                        if (!d) return <span key={`kosong-${k}`} />;
                        const key = iso(d);
                        return (
                            <DropdownMenuItem
                                key={key}
                                disabled={key > today}
                                onSelect={() => onChange(key)}
                                className={cn(
                                    'data-[highlighted]:bg-lime-soft grid h-8 cursor-pointer place-items-center rounded-lg text-[12px] outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-30',
                                    key === value && 'bg-ink data-[highlighted]:bg-ink font-extrabold text-white',
                                    key === today && key !== value && 'ring-lime-dark ring-1',
                                )}
                            >
                                {d.getDate()}
                            </DropdownMenuItem>
                        );
                    })}
                </div>
                <DropdownMenuItem onSelect={() => onChange(today)} className={cn(itemClass, 'mt-2 justify-center font-bold')}>
                    Hari ini
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/** Tanda isian wajib di label (sesuai aturan wajib di server). */
export function Req() {
    return (
        <span className="text-[#b42318]" aria-hidden>
            {' '}
            *
        </span>
    );
}

/** Tanda isian yang boleh dikosongkan. */
export function Opt() {
    return <span className="text-ink/40 font-normal"> (opsional)</span>;
}

/** Keterangan format isian di bawah kolomnya, supaya admin tahu harus diisi seperti apa. */
export function Hint({ children }: { children: ReactNode }) {
    return <span className="text-ink/50 mt-1 block text-[11px] leading-snug font-normal">{children}</span>;
}

/** Keterangan di awal form: arti tanda bintang. */
export function RequiredNote() {
    return (
        <p className="text-ink/55 mt-1 text-[11px]">
            Isian bertanda <span className="font-bold text-[#b42318]">*</span> wajib diisi.
        </p>
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
                    <tr className="border-ink/10 text-ink/50 border-b text-[10px] font-bold">
                        {head.map((h, i) => (
                            <th key={i} className="px-2 py-2 font-bold whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-ink/5 divide-y">{children}</tbody>
            </table>
        </div>
    );
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
    return <td className={cn('px-2 py-2.5 align-middle whitespace-nowrap', className)}>{children}</td>;
}

export function Empty({ children }: { children: ReactNode }) {
    return <p className="bg-ink/[0.03] text-ink/50 rounded-lg p-4 text-center text-[12px]">{children}</p>;
}

/** Modal tengah dengan bingkai (merah untuk aksi berbahaya), tutup dengan Esc atau klik latar. */
export function Modal({
    open,
    onClose,
    danger,
    children,
    width = 'max-w-md',
    dismissible = true,
}: {
    open: boolean;
    onClose: () => void;
    danger?: boolean;
    children: ReactNode;
    width?: string;
    /** false: hanya tertutup lewat tombol di dalam popup (mis. PIN yang hanya tampil sekali). */
    dismissible?: boolean;
}) {
    useEffect(() => {
        if (!open || !dismissible) return;
        const onKey = (e: KeyboardEvent) => {
            // Esc saat dropdown di dalam popup terbuka hanya menutup dropdown itu, bukan popupnya.
            if (e.key !== 'Escape' || document.querySelector('[data-radix-popper-content-wrapper]')) return;
            onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose, dismissible]);

    if (!open) return null;
    return (
        <div className="bg-ink/40 fixed inset-0 z-50 grid place-items-center p-4 whitespace-normal" onMouseDown={dismissible ? onClose : undefined}>
            <div
                role="dialog"
                aria-modal
                onMouseDown={(e) => e.stopPropagation()}
                className={cn(
                    'relative max-h-[90dvh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl',
                    width,
                    danger && 'border-2 border-[#d0271d]',
                )}
            >
                {dismissible && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Tutup"
                        className="text-ink/50 hover:bg-ink/5 absolute top-3 right-3 grid size-7 place-items-center rounded-full"
                    >
                        <X className="size-4" />
                    </button>
                )}
                {children}
            </div>
        </div>
    );
}

type ConfirmOptions = { title: string; message?: ReactNode; confirmLabel?: string; danger?: boolean; onConfirm: () => void };

/**
 * Popup konfirmasi sebelum aksi yang mengubah atau menghapus data.
 * Pakai: const [confirm, confirmDialog] = useConfirm(); render confirmDialog, lalu panggil confirm({...}).
 */
export function useConfirm() {
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const close = () => setOptions(null);

    const dialog = (
        <Modal open={options !== null} onClose={close} danger={options?.danger}>
            {options && (
                <>
                    <h2 className="pr-8 text-[17px] font-extrabold">{options.title}</h2>
                    {options.message && <div className="text-ink/60 mt-1 text-[12px] leading-relaxed">{options.message}</div>}
                    <div className="mt-4 flex justify-end gap-2">
                        <Btn variant="outline" onClick={close}>
                            Batal
                        </Btn>
                        <Btn
                            variant={options.danger ? 'red' : 'black'}
                            onClick={() => {
                                options.onConfirm();
                                close();
                            }}
                        >
                            {options.confirmLabel ?? 'Ya, lanjutkan'}
                        </Btn>
                    </div>
                </>
            )}
        </Modal>
    );

    return [setOptions, dialog] as const;
}

export function rupiah(value: number): string {
    return 'Rp' + value.toLocaleString('id-ID');
}
