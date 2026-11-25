import { type CSSProperties, useLayoutEffect, useRef, useState } from 'react';

type Rect = { x: number; y: number; w: number; h: number };

// Posisi indikator terakhir per navbar. Navbar dibuat ulang tiap pindah halaman, jadi posisi lama disimpan di
// luar komponen supaya indikator bisa mulai dari menu lama lalu meluncur ke menu baru.
const lastRect = new Map<string, Rect>();

/**
 * Indikator menu aktif yang meluncur seperti tab bar iOS. Tandai item aktif dengan data-active="true" di dalam
 * `containerRef` (yang harus position: relative), lalu render elemen indikator dengan `style`.
 */
export function useSlidingIndicator(navKey: string, activeKey: string) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [rect, setRect] = useState<Rect | null>(() => lastRect.get(navKey) ?? null);
    const [animate, setAnimate] = useState(false);

    useLayoutEffect(() => {
        const el = containerRef.current?.querySelector<HTMLElement>('[data-active="true"]');
        if (!el) {
            setRect(null);
            return;
        }
        const next = { x: el.offsetLeft, y: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
        const prev = lastRect.get(navKey);
        lastRect.set(navKey, next);

        if (!prev || (prev.x === next.x && prev.y === next.y && prev.w === next.w && prev.h === next.h)) {
            setAnimate(false);
            setRect(next);
            return;
        }
        // Gambar dulu di posisi lama, lalu pada frame berikutnya pindah ke posisi baru dengan transisi.
        setAnimate(false);
        setRect(prev);
        let inner = 0;
        const outer = requestAnimationFrame(() => {
            inner = requestAnimationFrame(() => {
                setAnimate(true);
                setRect(next);
            });
        });
        return () => {
            cancelAnimationFrame(outer);
            cancelAnimationFrame(inner);
        };
    }, [navKey, activeKey]);

    const style: CSSProperties = rect
        ? {
              transform: `translate(${rect.x}px, ${rect.y}px)`,
              width: rect.w,
              height: rect.h,
              transition: animate ? 'transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), width 320ms cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
          }
        : { display: 'none' };

    return { containerRef, indicatorStyle: style };
}
