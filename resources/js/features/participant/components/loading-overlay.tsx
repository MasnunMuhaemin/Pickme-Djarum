import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

/** Hanya dua proses yang memakai layar memuat penuh; pindah menu biasa tidak ditutupi. */
const LABELS: Record<string, string> = {
    '/participant/scan': 'Membuka titik warung...',
    '/participant/foto': 'Mengirim foto bungkus...',
};

/**
 * Layar memuat penuh saat QR terbaca dan saat foto bungkus dikirim, supaya tidak terkirim dua kali selama
 * menunggu server. Muncul setelah jeda singkat agar proses yang cepat tidak berkedip.
 */
export function LoadingOverlay() {
    const [visible, setVisible] = useState(false);
    const [label, setLabel] = useState('Memuat...');

    useEffect(() => {
        let timer: number | undefined;

        const offStart = router.on('start', (event) => {
            const visit = event.detail.visit;
            const text = visit.method === 'post' ? LABELS[visit.url.pathname] : undefined;
            if (!text || visit.prefetch) return;

            setLabel(text);
            window.clearTimeout(timer);
            timer = window.setTimeout(() => setVisible(true), 150);
        });
        const offFinish = router.on('finish', () => {
            window.clearTimeout(timer);
            setVisible(false);
        });

        return () => {
            window.clearTimeout(timer);
            offStart();
            offFinish();
        };
    }, []);

    if (!visible) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-[100] grid place-items-center bg-[#0f1c1a]/55 backdrop-blur-[2px]"
            onClickCapture={(e) => e.stopPropagation()}
        >
            <div className="flex flex-col items-center gap-3 rounded-3xl bg-[#f7f3e3] px-7 py-5 shadow-2xl">
                <span className="relative grid size-12 place-items-center">
                    <span className="absolute inset-0 animate-spin rounded-full border-4 border-[#a9d65b]/30 border-t-[#a9d65b]" />
                    <span className="size-3 rounded-full bg-[#1b3a1a]" />
                </span>
                <p className="text-[13px] font-extrabold text-[#1b3a1a]">{label}</p>
            </div>
        </div>
    );
}
