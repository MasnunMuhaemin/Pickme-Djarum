import type { LucideIcon } from 'lucide-react';
import { Box, Camera, Clock, Droplet, Gift, X, Zap } from 'lucide-react';

export type RewardTone = 'done' | 'progress' | 'waiting' | 'rejected';

/** Bentuk data dari App\Support\RewardPresenter. */
export type Reward = {
    id: number;
    kind: string;
    title: string;
    description: string;
    value?: string;
    days_left?: number;
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
    claim_pending: Clock,
    claim_rejected: X,
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
    if (kind === 'claim_pending') return { bg: 'bg-[#e9e2bf]', icon: 'text-ink' };
    if (kind === 'claim_rejected') return { bg: 'bg-[#fbe3e0]', icon: 'text-danger' };
    return { bg: 'bg-[#0b0b0b]', icon: 'text-lime' };
}
