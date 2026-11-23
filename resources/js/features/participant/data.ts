export const prizes = [
    { title: 'Kopi Grosir', value: 'Rp10.000', icon: 'coffee', tone: 'bg-[#f6e7cf]' },
    { title: 'Jaya Steam', value: 'Rp20.000', icon: 'game', tone: 'bg-[#e3e9fb]' },
    { title: 'Laundry Seven', value: 'Rp40.000', icon: 'shirt', tone: 'bg-[#e5f1d5]' },
    { title: 'Bensin motor', value: 'Gratis', icon: 'fuel', tone: 'bg-[#fbe2da]' },
] as const;

const takenSlotCodes = ['A1', 'A3', 'A5', 'B2', 'B4', 'C1', 'C3', 'D2', 'D5', 'E4'];

export const boardSlots = Array.from({ length: 25 }, (_, i) => {
    const code = `${'ABCDE'[Math.floor(i / 5)]}${(i % 5) + 1}`;
    return { code, taken: takenSlotCodes.includes(code) };
});

export const uniqueSlotCode = 'K7M2QX';

export const pickerCodes = ['A1', 'B2', 'C3', 'D4', 'F6', 'H8', 'J9', 'K7', 'L1', 'M2', 'N3', 'P5', 'QX', 'R7', 'T9', 'V2'];

export const rewards = [
    {
        title: 'Voucher Kopi Grosir',
        text: 'Berlaku 14 hari setelah diklaim',
        status: 'Tersedia',
        tone: 'lime' as const,
        icon: 'coffee',
        action: 'Lihat kode',
        actionHref: '/participant/voucher',
    },
    {
        title: 'Token listrik',
        text: 'Isi nomor meter supaya dikirim',
        status: 'Menunggu nomor',
        tone: 'amber' as const,
        icon: 'zap',
        action: 'Isi nomor',
        actionHref: '/participant/nomor-tujuan',
    },
    {
        title: 'Merchandise',
        text: 'Dikirim setelah alamat diisi',
        status: 'Menunggu alamat',
        tone: 'amber' as const,
        icon: 'package',
        action: 'Isi alamat',
        actionHref: '/participant/alamat',
    },
    {
        title: 'Bensin motor',
        text: 'Admin akan menghubungi kamu',
        status: 'Menunggu kurir',
        tone: 'amber' as const,
        icon: 'fuel',
        action: null,
        actionHref: null,
    },
];

export const leaderboard = [
    { rank: 1, name: 'Dimas', caps: 10 },
    { rank: 2, name: 'Rayan', caps: 9 },
    { rank: 3, name: 'Intan', caps: 9 },
    { rank: 4, name: 'Fajar', caps: 9 },
    { rank: 5, name: 'Sesa', caps: 8 },
];

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
