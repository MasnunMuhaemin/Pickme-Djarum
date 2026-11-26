import { PrimaryButton } from '@/features/participant/components/ui';
import { PartnerPage } from '@/features/partner/partner-page';

type Detail = {
    code: string;
    title: string;
    value: string;
    holder: string;
    voucher_name: string;
    redeemed_at: string;
    week: string | null;
    status_label: string;
    photo_url: string | null;
    kuota: boolean;
};

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex gap-4 py-2 text-[14px]">
            <span className="text-ink-soft w-28 shrink-0">{label}</span>
            <span className="min-w-0 font-extrabold break-words">{value}</span>
        </div>
    );
}

/** Rincian satu penukaran beserta foto buktinya. Foto yang belum ada bisa diambil dari sini. */
export default function RincianTukar({ voucher }: { voucher: Detail }) {
    return (
        <PartnerPage
            title="Rincian tukar"
            back={voucher.week ? `/mitra/rekap/${voucher.week}` : '/mitra/rekap'}
            nav="rekap"
            footer={
                !voucher.kuota && !voucher.photo_url ? (
                    <PrimaryButton href={`/mitra/kode/${voucher.code}/foto`} className="h-12 text-[15px] font-extrabold">
                        Foto bukti
                    </PrimaryButton>
                ) : undefined
            }
        >
            <div className="rounded-3xl bg-white px-5 py-3">
                <Row label="Nama penukar" value={voucher.holder} />
                <Row label="Kode" value={voucher.code} />
                <Row label="Voucher" value={voucher.voucher_name} />
                <Row label="Nominal" value={voucher.value} />
                <Row label="Waktu tukar" value={voucher.redeemed_at} />
                <Row label="Status" value={voucher.status_label} />
            </div>

            {!voucher.kuota && (
                <>
                    <h2 className="mt-5 text-[13px] font-extrabold">Foto bukti</h2>
                    {voucher.photo_url ? (
                        <>
                            <div className="bg-night-soft mt-2 flex items-center justify-center overflow-hidden rounded-2xl">
                                <img src={voucher.photo_url} alt={`Foto bukti ${voucher.code}`} className="max-h-[60dvh] w-full object-contain" />
                            </div>
                            <p className="text-ink-soft mt-2 text-[12px]">Waktu, nama warung dan kode tercetak di foto.</p>
                        </>
                    ) : (
                        <p className="text-danger mt-2 rounded-2xl bg-[#fbe3e0] p-4 text-[12px] font-semibold">
                            Belum ada foto bukti untuk penukaran ini.
                        </p>
                    )}
                </>
            )}
        </PartnerPage>
    );
}
