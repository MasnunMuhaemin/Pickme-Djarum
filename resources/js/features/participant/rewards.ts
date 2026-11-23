import type { LucideIcon } from 'lucide-react';
import { Box, Camera, Droplet, Gift, Zap } from 'lucide-react';

export type RewardTone = 'done' | 'progress' | 'waiting';

/** Bentuk data dari App\Support\RewardPresenter. */
export type Reward = {
    id: number;
    kind: string;
    title: string;
    description: string;
    value?: string;
    days_left?: number;
    status: string;
    status_label: string;
    tone: RewardTone;
    action: string | null;
    href: string | null;
};

export const rewardIcons: Record<string, LucideIcon> = { voucher: Camera, token: Zap, bensin: Droplet, merch: Box, mystery: Gift };

export const rewardToneClass: Record<RewardTone, string> = {
    done: 'bg-[#dff3e4] text-[#1e7a3a]',
    progress: 'bg-lime-soft text-ink',
    waiting: 'bg-[#e9e2bf] text-ink-soft',
};

/** Voucher memakai gradasi cokelat (seperti foto bungkus), hadiah lain kotak hitam dengan ikon lime. */
export function rewardStub(kind: string) {
    return kind === 'voucher'
        ? { bg: 'bg-gradient-to-b from-[#dcc3a3] to-[#6b4a33]', icon: 'text-cream/70' }
        : { bg: 'bg-[#0b0b0b]', icon: 'text-lime' };
}
