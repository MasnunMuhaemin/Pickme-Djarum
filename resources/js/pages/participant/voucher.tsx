import { BackLink, PrimaryButton } from '@/features/participant/components/ui';
import { RewardImage, VoucherArt } from '@/features/participant/components/voucher-art';
import { type Reward } from '@/features/participant/rewards';
import ParticipantLayout from '@/layouts/participant-layout';
import { ChevronLeft, ExternalLink, MapPin } from 'lucide-react';
import { useState } from 'react';

type VoucherData = {
    id: number;
    code: string;
    type: string;
    status: string;
    destination?: string | null;
    partner?: string | null;
    maps_url?: string | null;
};

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 py-3">
            <span className="text-ink-soft">{label}</span>
            <span className="text-right font-extrabold">{value}</span>
        </div>
    );
}

/**
 * Detail hadiah (desain "Voucher"): header lime dengan status, gambar voucher, kartu kode hitam berlubang tiket,
 * lalu rincian. Hadiah tanpa kode (token, pulsa/kuota, bensin) menampilkan ikon dan statusnya.
 */
export default function VoucherPage({ voucher, reward }: { voucher: VoucherData; reward: Reward }) {
    const [copied, setCopied] = useState(false);
    // Pulsa/kuota tidak ditukar dengan kode: diisi mitra kuota ke nomor HP peserta.
    const isVoucher = voucher.type === 'voucher' && reward.kind !== 'kuota';

    async function copy() {
        try {
            await navigator.clipboard.writeText(voucher.code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    }

    return (
        <ParticipantLayout title="Detail hadiah" nav="hadiah">
            <div className="lime-hero relative px-5 pt-4 pb-14 md:px-8 md:pt-6">
                <img
                    src="/images/gurita.webp"
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute right-3 bottom-[8px] z-10 w-[27%] max-w-[150px] select-none md:right-8 md:w-[22%]"
                />
                <div className="relative flex items-center justify-between gap-2">
                    <BackLink fallback="/participant/hadiah" className="bg-ink text-lime grid size-10 shrink-0 place-items-center rounded-full">
                        <ChevronLeft className="size-5" strokeWidth={2.5} />
                    </BackLink>
                    <span className="bg-ink text-cream rounded-full px-3.5 py-1.5 text-[12px] font-extrabold">{reward.status_label}</span>
                </div>
                <h1 className="relative mt-3 max-w-[65%] text-[34px] leading-none font-extrabold tracking-tight md:text-[44px]">
                    {isVoucher ? 'Voucher' : reward.title}
                </h1>
            </div>

            <div className="bg-cream relative -mt-7 flex-1 rounded-t-[2rem] px-5 pt-5 pb-6 md:px-8 md:pt-8 md:pb-10">
                <div className="md:mx-auto md:max-w-[520px]">
                    <div className="overflow-hidden rounded-3xl bg-white pb-2">
                        {isVoucher ? (
                            <VoucherArt code={voucher.code} value={reward.value} />
                        ) : (
                            <RewardImage reward={reward} showValue className="h-32 md:h-36" />
                        )}

                        <div className="px-5 pt-4">
                            <p className="text-[20px] leading-tight font-extrabold tracking-tight">{reward.title}</p>
                            <p className="text-ink-soft mt-0.5 text-[13px]">
                                {isVoucher && voucher.partner ? `${voucher.partner} · 1 voucher` : reward.description}
                            </p>
                        </div>

                        {isVoucher && (
                            <>
                                <div className="border-cream-deep mx-5 mt-3 border-t-2 border-dashed" />
                                {/* Kartu kode hitam dengan lubang tiket di kiri dan kanan. */}
                                <div className="relative mt-3">
                                    <span aria-hidden className="bg-cream absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full" />
                                    <span aria-hidden className="bg-cream absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full" />
                                    <button
                                        type="button"
                                        onClick={copy}
                                        aria-label={`Kode voucher ${voucher.code}. Ketuk untuk menyalin.`}
                                        className="mx-4 block w-[calc(100%-2rem)] rounded-2xl bg-[#0b0b0b] px-4 py-4 text-center"
                                    >
                                        <span className="text-cream/75 block text-[12px]">Kode voucher</span>
                                        <span className="text-lime mt-1 block text-[30px] leading-tight font-extrabold tracking-[0.03em] break-all">
                                            {voucher.code}
                                        </span>
                                        <span className="text-cream/80 mt-1 block text-[12px]">
                                            {copied ? 'Kode tersalin' : 'Tunjukkan kode ini ke kasir'}
                                        </span>
                                    </button>
                                </div>
                            </>
                        )}

                        <div className="divide-cream-deep mx-5 mt-2 divide-y text-[13px]">
                            {isVoucher && voucher.partner && <Row label="Mitra" value={voucher.partner} />}
                            {reward.value && <Row label={isVoucher ? 'Nilai penukaran' : 'Nilai'} value={reward.value} />}
                            {voucher.destination && <Row label="Nomor tujuan" value={voucher.destination} />}
                            {!isVoucher && <Row label="Dikirim lewat" value={reward.kind === 'kuota' ? 'Mitra kuota' : 'WhatsApp'} />}
                            <Row label="Status" value={reward.status_label} />
                        </div>
                        {isVoucher && voucher.maps_url && (
                            <a
                                href={voucher.maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="border-ink bg-lime-soft text-ink mx-5 mt-2 mb-3 flex h-12 items-center justify-center gap-2 rounded-full border-2 text-[14px] font-extrabold"
                            >
                                <MapPin className="size-5" /> Lihat lokasi toko di Google Maps <ExternalLink className="size-4" />
                            </a>
                        )}
                    </div>

                    <p className="text-ink-soft mt-3 text-[12px] leading-relaxed">
                        {isVoucher
                            ? 'Satu kode hanya bisa ditukar satu kali. Penukaran tidak bisa dibatalkan.'
                            : reward.kind === 'kuota'
                              ? 'Mitra mengisi pulsa atau kuota ke nomor HP yang kamu isi.'
                              : 'Admin akan menghubungi kamu lewat WhatsApp. Pastikan nomormu aktif.'}
                    </p>

                    <PrimaryButton href="/participant/hadiah" className="mt-4 h-13 text-[15px] font-extrabold">
                        Kembali ke Hadiahku
                    </PrimaryButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
