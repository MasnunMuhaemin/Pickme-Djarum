import { type Reward, rewardIcons } from '@/features/participant/rewards';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';
import { Gift } from 'lucide-react';

/**
 * Gambar voucher bergaya komik. Kode voucher tampil di kotak putih kecil, kotak besar berisi kalimat nyeleneh.
 * Gambar dan kalimat dipilih dari kode voucher, jadi voucher yang sama selalu tampil sama.
 * Posisi kotak dalam persen dari ukuran gambar aslinya supaya pas di layar mana pun.
 */
type Box = { left: number; top: number; width: number; height: number };
type Variant = { src: string; ratio: string; text: Box; code: Box; tilt?: number; drawBoxes?: boolean };

const VARIANTS: Variant[] = [
    // 753×488: kotak kertas di kiri, kotak putih di kanan bawah.
    {
        src: '/images/design-voucher1.webp',
        ratio: '753 / 488',
        text: { left: 7, top: 27, width: 35, height: 56 },
        code: { left: 50.1, top: 75, width: 40.6, height: 11.5 },
    },
    // 1004×650: papan reklame, teks di kanan panah.
    {
        src: '/images/design-voucher2.webp',
        ratio: '1004 / 650',
        text: { left: 23, top: 26, width: 36, height: 38 },
        code: { left: 52.4, top: 74.9, width: 40.7, height: 11.7 },
        tilt: -2,
    },
    // 753×488: adegan gurita tanpa kotak; kotak digambar di posisi yang sama dengan design-voucher1.
    {
        src: '/images/design-voucher3.webp',
        ratio: '753 / 488',
        text: { left: 7, top: 27, width: 35, height: 56 },
        code: { left: 50.1, top: 75, width: 40.6, height: 11.5 },
        drawBoxes: true,
    },
];

function hash(text: string): number {
    let h = 0;
    for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return h;
}

/** Gambar voucher untuk kode ini (sama dengan yang dipakai VoucherArt), mis. untuk thumbnail di Hadiahku. */
export function voucherImage(code: string): string {
    return VARIANTS[hash(code) % VARIANTS.length].src;
}

/**
 * Gambar hadiah untuk Hadiahku dan detail: ilustrasi voucher (dipilih tetap dari kode atau id hadiah), lapisan gelap,
 * ikon jenis hadiah di tengah untuk hadiah selain voucher mitra, dan nilai di pojok kanan atas bila diminta.
 */
export function RewardImage({
    reward,
    showValue,
    showIcon = true,
    className,
    iconClassName = 'size-10',
}: {
    reward: Pick<Reward, 'kind' | 'id' | 'code' | 'value' | 'follow_up'>;
    showValue?: boolean;
    /** Ikon jenis hadiah di tengah (hadiah selain voucher mitra); daftar Hadiahku tanpa ikon. */
    showIcon?: boolean;
    className?: string;
    iconClassName?: string;
}) {
    const Icon = rewardIcons[reward.kind] ?? Gift;
    return (
        <div className={cn('relative overflow-hidden', className)}>
            <img
                src={voucherImage(reward.code ?? `${reward.kind}-${reward.id}`)}
                alt=""
                aria-hidden
                className="absolute inset-0 size-full object-cover"
                loading="lazy"
            />
            <span aria-hidden className="absolute inset-0 bg-black/45" />
            {/* Hadiah yang menunggu konfirmasi peserta (alamat merch, nomor token) tanpa ikon jenis hadiah. */}
            {showIcon && !reward.follow_up && reward.kind !== 'voucher' && (
                <span className="absolute inset-0 grid place-items-center">
                    <Icon className={cn('text-lime drop-shadow', iconClassName)} strokeWidth={2} />
                </span>
            )}
            {showValue && reward.value && (
                <span className="text-ink absolute top-2.5 right-2.5 rounded-full bg-white/90 px-3 py-1 text-[12px] font-extrabold">
                    {reward.value}
                </span>
            )}
        </div>
    );
}

const pos = (b: Box) => ({ left: `${b.left}%`, top: `${b.top}%`, width: `${b.width}%`, height: `${b.height}%` });

export function VoucherArt({ code, value, className }: { code: string; value?: string; className?: string }) {
    const h = hash(code);
    const v = VARIANTS[h % VARIANTS.length];
    // Kalimat diatur admin di Pengaturan (Setting::voucherLines).
    const lines = (usePage().props.voucherLines as string[] | null) ?? [];
    const line = lines.length ? lines[(h >>> 3) % lines.length] : '';

    return (
        // @container: ukuran huruf mengikuti lebar gambar (cqw), bukan lebar layar.
        <div className={cn('@container relative w-full overflow-hidden', className)} style={{ aspectRatio: v.ratio }}>
            <img src={v.src} alt="" aria-hidden className="absolute inset-0 size-full object-cover select-none" draggable={false} />

            {v.drawBoxes && (
                <>
                    <span
                        aria-hidden
                        className="border-ink absolute rounded-[3px] border-2 bg-[#f1eccc] shadow-[2px_3px_0_rgba(0,0,0,0.35)]"
                        style={pos({ left: 5, top: 23.6, width: 39.4, height: 63.5 })}
                    />
                    <span aria-hidden className="absolute bg-white" style={pos(v.code)} />
                </>
            )}

            <p
                className="font-marker text-ink absolute flex items-center justify-center text-center text-[5.4cqw] leading-[1.15]"
                style={{ ...pos(v.text), transform: v.tilt ? `rotate(${v.tilt}deg)` : undefined }}
            >
                {line}
            </p>

            <p
                className="absolute flex items-center justify-center font-mono text-[3.9cqw] font-extrabold tracking-[0.12em] text-[#0b0b0b]"
                style={pos(v.code)}
            >
                {code}
            </p>

            {value && (
                <span className="bg-lime absolute top-[4%] right-[3%] rounded-full px-[2.4cqw] py-[0.8cqw] text-[3.2cqw] font-extrabold text-[#0b0b0b]">
                    {value}
                </span>
            )}
        </div>
    );
}
