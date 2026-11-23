import { PageHeader, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { router } from '@inertiajs/react';
import { useState } from 'react';

const sections = [
    {
        title: '1. Siapa yang mengelola datamu',
        body: 'Data dikelola oleh pengelola program dan warung yang kamu pilih. Admin warung bisa melihat klaim untuk memeriksa bukti pembelian. Data tidak dipakai untuk iklan di luar program ini.',
    },
    {
        title: '2. Data apa yang kami kumpulkan',
        body: 'Nama panggilan, nomor WhatsApp, tanggal lahir, area kos, PIN 4 angka, foto bungkus, kartu cap, riwayat klaim, serta data perangkat dan alamat yang dipakai untuk mencegah klaim palsu.',
    },
    {
        title: '3. Untuk apa data dipakai',
        body: 'Data dipakai untuk mendaftarkan peserta, memeriksa bukti pembelian, menentukan slot dan hadiah, mengirim hadiah ke nomor tujuan atau alamat, serta membuat rekap pembayaran mitra.',
    },
    {
        title: '4. Berapa lama data disimpan',
        body: 'Data klaim dan hadiah disimpan selama program berlangsung dan untuk keperluan pelaporan. Foto bukti dan data teknis mengikuti kebijakan retensi yang ditetapkan pengelola program.',
    },
    {
        title: '5. Siapa yang bisa melihat data',
        body: 'Admin Si Pemburu bisa melihat data untuk memeriksa klaim dan memenuhi hadiah. Mitra hanya melihat kode voucher dan rekap warungnya sendiri. Peserta lain hanya melihat nama dan peringkat di papan peringkat.',
    },
    {
        title: '6. Hak kamu',
        body: 'Kamu bisa meminta penghapusan data, meminta salinan data, atau mempertanyakan keputusan klaim dengan menghubungi admin lewat WhatsApp yang tercantum di halaman bantuan.',
    },
    {
        title: '7. Perubahan ketentuan',
        body: 'Jika teks ini diperbarui, peserta diminta menyetujui versi terbaru sebelum melanjutkan klaim. Versi teks dan waktu persetujuan disimpan sebagai bukti.',
    },
];

export default function Persetujuan() {
    const [reachedBottom, setReachedBottom] = useState(false);

    return (
        <ParticipantLayout hideBottomNav>
            <PageHeader back="/participant/daftar" title="Persetujuan data" />
            <div className="flex min-h-0 flex-1 flex-col px-4 pb-6 lg:mx-auto lg:w-full lg:max-w-[760px] lg:px-8 lg:pt-2 lg:pb-10">
                <div className="flex min-h-0 flex-1 flex-col">
                    <p className="text-ink-soft mb-3 text-[11px] leading-relaxed">Gulir teks ini sampai dasar untuk mengaktifkan tombol lanjut.</p>
                    <div
                        onScroll={(e) => {
                            const el = e.currentTarget;
                            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReachedBottom(true);
                        }}
                        className="border-ink/10 bg-cream-soft h-[46vh] min-h-0 shrink-0 overflow-y-auto rounded-2xl border p-4 lg:h-[420px]"
                    >
                        <h2 className="text-[15px] font-extrabold">Privasi dan data kamu</h2>
                        <p className="text-ink-soft mt-2 text-[11px] leading-relaxed">
                            Dengan mengikuti program ini, kamu menyetujui pengelolaan data berikut. Bacalah sampai selesai.
                        </p>
                        <div className="mt-4 space-y-4">
                            {sections.map((section) => (
                                <section key={section.title}>
                                    <h3 className="text-[12px] font-extrabold">{section.title}</h3>
                                    <p className="text-ink-soft mt-1 text-[11px] leading-relaxed">{section.body}</p>
                                </section>
                            ))}
                        </div>
                        <p className="text-ink-soft mt-5 border-t border-black/10 pt-3 text-[10px]">
                            Versi teks: 1.0 — 16 November 2026. Akhir dari persetujuan.
                        </p>
                    </div>
                </div>

                <div className="mt-4">
                    <PrimaryButton disabled={!reachedBottom} onClick={() => router.visit('/participant/foto')} className="lg:max-w-[260px]">
                        {reachedBottom ? 'Setuju dan lanjut' : 'Gulir sampai bawah'}
                    </PrimaryButton>
                </div>
            </div>
        </ParticipantLayout>
    );
}
