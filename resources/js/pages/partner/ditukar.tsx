import { PrimaryButton } from '@/features/participant/components/ui';
import { DoneBadge, PartnerPage } from '@/features/partner/partner-page';
import type { VoucherCard } from '@/pages/partner/kode';

/** Voucher sudah ditukar (final). Lanjut foto produk yang diberikan sebagai bukti. */
export default function Ditukar({ voucher }: { voucher: VoucherCard }) {
    return (
        <PartnerPage
            title="Ditukar"
            hideNav
            footer={
                <PrimaryButton href={`/mitra/kode/${voucher.code}/foto`} className="h-12 text-[15px] font-extrabold">
                    Foto bukti
                </PrimaryButton>
            }
        >
            <div className="pt-6 text-center">
                <DoneBadge />
                <h2 className="mt-6 text-[22px] font-extrabold tracking-tight">Voucher sudah ditukar</h2>
                <p className="text-ink-soft mx-auto mt-2 max-w-[300px] text-[13px] leading-relaxed">
                    Layani {voucher.holder}: {voucher.title.replace(/^Voucher /, '')} {voucher.value}. Lalu foto produk yang diberikan sebagai bukti.
                    Kode {voucher.code} tidak bisa ditukar lagi.
                </p>
            </div>
        </PartnerPage>
    );
}
