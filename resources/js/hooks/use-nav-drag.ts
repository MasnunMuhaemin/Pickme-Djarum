import { type MouseEvent, type PointerEvent, useRef, useState } from 'react';

/** Menu ([data-nav-key]) yang titik tengahnya paling dekat dengan posisi jari. */
function keyAt(container: HTMLElement, clientX: number): string | null {
    let best: { key: string; distance: number } | null = null;
    container.querySelectorAll<HTMLElement>('[data-nav-key]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const distance = Math.abs(clientX - (r.left + r.width / 2));
        if (!best || distance < best.distance) best = { key: el.dataset.navKey ?? '', distance };
    });
    return best ? (best as { key: string }).key : null;
}

/**
 * Gestur geser seperti tab bar iOS: selama jari digeser di navbar, pil mengikuti menu di bawah jari (dragKey);
 * saat dilepas, onRelease dipanggil dengan menu terakhir. Ketukan biasa tetap ditangani Link.
 * Pasang `handlers` di elemen pembungkus menu; tiap menu diberi data-nav-key.
 */
export function useNavDrag(onRelease: (key: string | null) => void) {
    const [dragKey, setDragKey] = useState<string | null>(null);
    const drag = useRef<{ x0: number; moved: boolean } | null>(null);
    const suppressClick = useRef(false);

    const handlers = {
        onPointerDown: (e: PointerEvent<HTMLElement>) => {
            drag.current = { x0: e.clientX, moved: false };
        },
        onPointerMove: (e: PointerEvent<HTMLElement>) => {
            const d = drag.current;
            if (!d) return;
            if (!d.moved && Math.abs(e.clientX - d.x0) < 8) return;
            d.moved = true;
            setDragKey(keyAt(e.currentTarget, e.clientX));
        },
        onPointerUp: (e: PointerEvent<HTMLElement>) => {
            const d = drag.current;
            drag.current = null;
            if (!d?.moved) return;
            suppressClick.current = true;
            const key = keyAt(e.currentTarget, e.clientX);
            setDragKey(null);
            onRelease(key);
        },
        onPointerCancel: () => {
            drag.current = null;
            setDragKey(null);
        },
        onClickCapture: (e: MouseEvent<HTMLElement>) => {
            // Klik yang menyusul gestur geser tidak membuka menu kedua kalinya.
            if (!suppressClick.current) return;
            suppressClick.current = false;
            e.preventDefault();
            e.stopPropagation();
        },
    };

    return { dragKey, handlers };
}
