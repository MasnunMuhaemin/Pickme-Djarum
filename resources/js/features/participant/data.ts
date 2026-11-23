export type ClaimVariant = 'voucher' | 'token' | 'merch' | 'bensin';

export const claimVariants: Record<
    ClaimVariant,
    {
        title: string;
        value?: string;
        icon: 'coffee' | 'zap' | 'package' | 'fuel';
        rows: { label: string; value: string }[];
        cta: string;
        href: string;
        second?: string;
    }
> = {
    voucher: {
        title: 'Voucher Kopi Grosir',
        value: 'Rp10.000',
        icon: 'coffee',
        rows: [
            { label: 'Berlaku', value: '14 hari setelah diklaim' },
            { label: 'Kode voucher', value: 'KGR-7M2Q9X' },
        ],
        cta: 'Lihat hadiahku',
        href: '/participant/hadiah',
        second: 'Kembali ke papan',
    },
    token: {
        title: 'Token listrik',
        value: 'Rp20.000',
        icon: 'zap',
        rows: [
            { label: 'Nomor tujuan', value: '0891-xxxx-xxxx' },
            { label: 'Dikirim ke', value: 'WhatsApp' },
            { label: 'Estimasi', value: 'Tunggu 1-24 jam' },
        ],
        cta: 'Lihat hadiahku',
        href: '/participant/hadiah',
        second: 'Kembali ke papan',
    },
    merch: {
        title: 'Merchandise',
        value: 'Dikirim dalam 5 hari kerja',
        icon: 'package',
        rows: [
            { label: 'Pengiriman', value: 'Dikirim admin' },
            { label: 'Syarat', value: 'Hanya area yang tersedia' },
        ],
        cta: 'Isi alamat',
        href: '/participant/alamat',
        second: 'Nanti saja',
    },
    bensin: {
        title: 'Bensin motor',
        value: 'Rp30.000',
        icon: 'fuel',
        rows: [
            { label: 'Penjemputan', value: 'Sekarang' },
            { label: 'WhatsApp', value: 'Admin hubungi' },
        ],
        cta: 'Lihat hadiahku',
        href: '/participant/hadiah',
        second: 'Nanti saja',
    },
};
