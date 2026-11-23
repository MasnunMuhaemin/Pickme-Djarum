import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { LoadingOverlay } from './features/participant/components/loading-overlay';
import { startNavHistory } from './features/participant/nav-history';
import { initializeTheme } from './hooks/use-appearance';

declare global {
    const route: typeof routeFn;
}

const appName = import.meta.env.VITE_APP_NAME || 'PICKME';

createInertiaApp({
    title: (title) => (title ? `${title} · ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <>
                <App {...props} />
                <LoadingOverlay />
            </>,
        );
    },
    // Garis loading di atas layar dimatikan: pindah halaman sudah memakai layar memuat penuh (LoadingOverlay).
    progress: false,
});

// This will set light / dark mode on load...
initializeTheme();

// Riwayat halaman peserta untuk tombol kembali.
startNavHistory();
