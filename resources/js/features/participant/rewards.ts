import type { LucideIcon } from 'lucide-react';
import { Box, Camera, Droplet, Gift, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export type RewardTone = 'done' | 'progress' | 'waiting' | 'rejected';

/** Bentuk data dari App\Support\RewardPresenter. */
export type Reward = {
    id: number;
    kind: string;
    /** Kode voucher; ada untuk voucher, token, dan bensin. */
    code?: string;
    title: string;
    description: string;
    value?: string;
    /** Hadiah dari mystery gift cap ke-5. */
    mystery?: boolean;
    status: string;
    status_label: string;
    tone: RewardTone;
    action: string | null;
    href: string | null;
    /** Ada form lanjutan yang wajib diisi peserta (nomor meter token, alamat merchandise). */
    follow_up?: { title: string; message: string } | null;
};

export const rewardIcons: Record<string, LucideIcon> = {
    voucher: Camera,
    token: Zap,
    bensin: Droplet,
    merch: Box,
    mystery: Gift,
};

export const rewardToneClass: Record<RewardTone, string> = {
    done: 'bg-[#dff3e4] text-[#1e7a3a]',
    progress: 'bg-lime-soft text-ink',
    waiting: 'bg-[#e9e2bf] text-ink-soft',
    rejected: 'bg-[#fbe3e0] text-danger',
};

/** Voucher memakai gradasi cokelat (seperti foto bungkus), hadiah lain kotak hitam dengan ikon lime. */
export function rewardStub(kind: string) {
    if (kind === 'voucher') return { bg: 'bg-gradient-to-b from-[#dcc3a3] to-[#6b4a33]', icon: 'text-cream/70' };
    return { bg: 'bg-[#0b0b0b]', icon: 'text-lime' };
}

/** Penanda di perangkat bahwa mystery gift sudah dibuka (kartu cap tidak lagi menampilkan "Siap diklaim"). */
export const mysteryOpenedKey = (id: number) => `pickme:mystery-opened:${id}`;

/** Mystery gift sudah terbentuk tapi belum dibuka lewat kartu gosok di perangkat ini. */
export function useMysteryReady(mystery: { id: number } | null | undefined): boolean {
    const [ready, setReady] = useState(false);
    useEffect(() => setReady(Boolean(mystery) && !window.localStorage.getItem(mysteryOpenedKey(mystery!.id))), [mystery]);
    return ready;
}

/** Bentuk bintang bergerigi untuk cap yang sudah didapat. */
export const STAR =
    '[clip-path:polygon(50%_0%,61%_9%,75%_5%,80%_19%,94%_22%,91%_36%,100%_50%,91%_64%,94%_78%,80%_81%,75%_95%,61%_91%,50%_100%,39%_91%,25%_95%,20%_81%,6%_78%,9%_64%,0%_50%,9%_36%,6%_22%,20%_19%,25%_5%,39%_9%)]';
