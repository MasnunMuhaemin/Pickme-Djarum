import type { Reward } from '@/features/participant/rewards';
import { ClipboardList } from 'lucide-react';

/**
 * Informasi bahwa hadiah masih butuh data lanjutan (nomor meter token listrik, alamat merchandise).
 * Hanya pemberitahuan: tidak ada tombol dan tidak bisa diketuk untuk mengisi form dari sini.
 */
export function FollowUpNotice({ reward, className }: { reward: Reward; className?: string }) {
    if (!reward.follow_up) return null;

    return (
        <div role="note" className={`flex items-start gap-3 rounded-2xl border-2 border-[#e9b949] bg-[#fdf3d6] p-3.5 ${className ?? ''}`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e9b949] text-[#3a2612]">
                <ClipboardList className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="text-ink block text-[14px] font-extrabold">{reward.follow_up.title}</span>
                <span className="text-ink-soft mt-0.5 block text-[12px] leading-snug">{reward.follow_up.message}</span>
            </span>
        </div>
    );
}
