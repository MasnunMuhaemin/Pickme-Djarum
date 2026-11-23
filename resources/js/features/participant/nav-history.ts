import { router } from '@inertiajs/react';

/**
 * Riwayat halaman peserta untuk tombol kembali: kembali ke halaman sebelum peserta pindah menu.
 * Disimpan di sessionStorage supaya tetap ada setelah muat ulang di tab yang sama.
 *
 * Halaman langkah klaim dan masuk/daftar dilewati saat kembali, karena membukanya lagi tidak masuk akal
 * (popup masuk padahal sudah masuk, kamera scan yang langsung dialihkan, foto/slot yang sudah dikirim).
 */
const KEY = 'pickme-nav-history';
const LIMIT = 30;
const SKIP = [
    /^\/participant\/(masuk|daftar)(\?|$)/,
    /^\/participant\/scan(\?|$)/,
    /^\/participant\/foto(\?|$)/,
    /^\/participant\/slot(\?|$)/,
    /^\/participant\/klaim\/berhasil(\?|$)/,
    /^\/participant\/terima-kasih(\?|$)/,
    /^\/participant\/daftar\/belum-bisa(\?|$)/,
];

function load(): string[] {
    try {
        const value = JSON.parse(sessionStorage.getItem(KEY) ?? '[]');
        return Array.isArray(value) ? value.filter((v) => typeof v === 'string') : [];
    } catch {
        return [];
    }
}

function save(stack: string[]): void {
    try {
        sessionStorage.setItem(KEY, JSON.stringify(stack.slice(-LIMIT)));
    } catch {
        // sessionStorage tidak tersedia (mode privat tertentu): tombol kembali memakai tujuan bawaan.
    }
}

function current(): string {
    return window.location.pathname + window.location.search;
}

function remember(url: string): void {
    if (!url.startsWith('/participant')) return;
    const stack = load();
    if (stack[stack.length - 1] !== url) {
        stack.push(url);
        save(stack);
    }
}

let started = false;

/** Dipanggil sekali dari app.tsx: mencatat setiap halaman peserta yang dibuka. */
export function startNavHistory(): void {
    if (started || typeof window === 'undefined') return;
    started = true;
    remember(current());
    router.on('navigate', (event) => {
        const url = new URL(event.detail.page.url, window.location.origin);
        remember(url.pathname + url.search);
    });
}

/** Kembali ke halaman peserta sebelumnya; bila tidak ada, ke `fallback`. */
export function goBack(fallback: string): void {
    const stack = load();
    const here = current();
    while (stack.length && stack[stack.length - 1] === here) stack.pop();
    while (stack.length && SKIP.some((pattern) => pattern.test(stack[stack.length - 1]))) stack.pop();

    const target = stack.pop() ?? fallback;
    save(stack);
    router.visit(target);
}
