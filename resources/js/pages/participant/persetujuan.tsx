import { Checkbox, PrimaryButton } from '@/features/participant/components/ui';
import ParticipantLayout from '@/layouts/participant-layout';
import { Link, useForm } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';

type Consent = { version: string; body: string; accepted: boolean };

/** Bagian yang masih harus dikonfirmasi penyelenggara, ditandai merah seperti di desain. */
function Confirm({ children }: { children: ReactNode }) {
    return <span className="text-danger">[Konfirmasi: {children}]</span>;
}

function Bullets({ items }: { items: ReactNode[] }) {
    return (
        <ul className="mt-2 space-y-2">
            {items.map((item, i) => (
                <li key={i} className="flex gap-2.5">
                    <span aria-hidden>•</span>
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section className="mt-6">
            <h2 className="text-[16px] font-extrabold tracking-tight">{title}</h2>
            <div className="mt-2 space-y-2">{children}</div>
        </section>
    );
}

function Sub({ children }: { children: ReactNode }) {
    return <h3 className="mt-3 text-[13px] font-extrabold">{children}</h3>;
}

export default function Persetujuan({ consent, guest = false }: { consent: Consent; guest?: boolean }) {
    const [reachedBottom, setReachedBottom] = useState(consent.accepted);
    const form = useForm({ accepted: consent.accepted, optional: false });
    const back = guest ? '/participant/daftar' : '/participant';

    function submit(e: FormEvent) {
        e.preventDefault();
        form.post('/participant/persetujuan', { preserveScroll: true });
    }

    return (
        <ParticipantLayout title="Persetujuan data" hideBottomNav className="bg-lime">
            {/* Tinggi dikunci ke layar di HP supaya kotak teks mengisi sisa ruang dan tombol menempel di bawah. */}
            <div className="flex h-dvh flex-col sm:h-[calc(100dvh-3rem)] md:h-auto md:flex-1">
                <div className="shrink-0 px-5 pt-4 pb-6 md:px-8">
                    <Link href={back} aria-label="Kembali" className="bg-ink text-lime grid size-10 place-items-center rounded-full">
                        <ChevronLeft className="size-5" strokeWidth={2.5} />
                    </Link>
                    <h1 className="mt-4 text-[34px] leading-none font-extrabold tracking-tight md:text-[44px]">Persetujuan data</h1>
                </div>

                <form
                    onSubmit={submit}
                    className="bg-cream flex min-h-0 flex-1 flex-col rounded-t-[2rem] px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8"
                >
                    <div
                        onScroll={(e) => {
                            const el = e.currentTarget;
                            if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReachedBottom(true);
                        }}
                        className="min-h-[200px] flex-1 overflow-y-auto overscroll-contain rounded-3xl bg-white p-4 text-[13px] leading-relaxed md:mx-auto md:h-[460px] md:w-full md:max-w-[720px] md:flex-none md:p-6"
                    >
                        <h2 className="text-[16px] font-extrabold tracking-tight">Singkatnya</h2>
                        <Bullets
                            items={[
                                'Kami hanya minta data yang perlu untuk menjalankan program: akun, foto bungkus, dan alamat kalau hadiahmu berupa barang.',
                                'Foto bungkus wajib diambil langsung dari kamera. Fotonya dipakai untuk memeriksa klaim, bukan untuk dipajang.',
                                'Datamu tidak kami jual.',
                                'Kamu bisa minta lihat, perbaiki, atau hapus datamu. Caranya ada di bagian 6.',
                                'Ada pilihan opsional di bagian 9. Boleh dikosongkan, kamu tetap bisa ikut program.',
                            ]}
                        />

                        <Section title="1. Siapa yang mengelola datamu">
                            <p>
                                PICK(ME) dijalankan oleh Si Pemburu, <Confirm>nama badan atau organisasi penyelenggara yang tertulis resmi</Confirm>,
                                bersama sponsor program. Si Pemburu yang menentukan data apa yang dikumpulkan dan untuk apa.
                            </p>
                            <p>
                                Kontak untuk urusan data: <Confirm>nomor WhatsApp admin atau email</Confirm>.
                            </p>
                        </Section>

                        <Section title="2. Data apa yang kami kumpulkan">
                            <Sub>Saat kamu daftar</Sub>
                            <Bullets
                                items={[
                                    'Nama panggilan',
                                    'Nomor WhatsApp',
                                    'Tanggal lahir, untuk memastikan usiamu minimal 21 tahun',
                                    'Area kos',
                                    'PIN 4 angka, disimpan dalam bentuk terenkripsi',
                                ]}
                            />
                            <Sub>Saat kamu klaim</Sub>
                            <Bullets
                                items={[
                                    'Foto bungkus dari kamera',
                                    'Titik warung yang kamu scan dan waktu klaim',
                                    'Slot, kode, dan hadiah yang kamu dapat',
                                ]}
                            />
                            <Sub>Kalau hadiahmu barang atau pulsa</Sub>
                            <Bullets items={['Nama penerima dan alamat pengiriman', 'Nomor tujuan pengisian']} />
                            <Sub>Data teknis</Sub>
                            <Bullets items={['Jenis perangkat dan alamat IP, dipakai sebagai sinyal keamanan, bukan bukti identitas']} />
                        </Section>

                        <Section title="3. Untuk apa datamu dipakai">
                            <Bullets
                                items={[
                                    'Mendaftarkan akunmu dan memastikan batas usia program.',
                                    'Memeriksa klaim dan menentukan hadiah.',
                                    'Mengirim hadiah ke kamu.',
                                    'Mencegah kecurangan, misalnya klaim ganda.',
                                    'Menyusun laporan program dalam bentuk ringkasan tanpa nama.',
                                ]}
                            />
                        </Section>

                        <Section title="4. Siapa yang bisa melihat datamu">
                            <Bullets
                                items={[
                                    'Admin Si Pemburu, untuk memeriksa klaim dan membantu kendala.',
                                    'Warung terkait, hanya data klaim di warung tersebut.',
                                    'Kurir atau penyedia layanan, hanya data yang perlu untuk mengirim hadiah.',
                                    <>
                                        Sponsor program, hanya laporan ringkasan tanpa identitas.{' '}
                                        <Confirm>pihak sponsor yang menerima laporan</Confirm>
                                    </>,
                                ]}
                            />
                        </Section>

                        <Section title="5. Berapa lama datamu disimpan">
                            <p>
                                Data disimpan selama program berjalan dan paling lama <Confirm>masa simpan data setelah program selesai</Confirm>.
                                Setelah itu data dihapus atau dibuat anonim.
                            </p>
                        </Section>

                        <Section title="6. Hakmu atas datamu">
                            <p>Kamu bisa minta melihat, memperbaiki, atau menghapus datamu, dan menarik persetujuan opsional kapan saja.</p>
                            <p>
                                Caranya: hubungi kontak di bagian 1 dari nomor WhatsApp yang terdaftar. Permintaanmu kami proses paling lama{' '}
                                <Confirm>jumlah hari kerja</Confirm>.
                            </p>
                        </Section>

                        <Section title="7. Keamanan data">
                            <p>PIN disimpan terenkripsi. Akses admin dibatasi dan setiap aktivitasnya dicatat.</p>
                        </Section>

                        <Section title="8. Perubahan teks ini">
                            <p>Kalau teks ini berubah, kami akan minta persetujuanmu lagi. Versi teks: {consent.version}.</p>
                        </Section>

                        <Section title="9. Pilihan opsional">
                            <p>Boleh dikosongkan. Kamu tetap bisa ikut program.</p>
                            {!guest && (
                                <div className="pt-1">
                                    <Checkbox checked={form.data.optional} onChange={(v) => form.setData('optional', v)}>
                                        Boleh kirim info program dan promo berikutnya lewat WhatsApp.
                                    </Checkbox>
                                </div>
                            )}
                        </Section>

                        {!guest && (
                            <div className="border-ink/10 mt-6 border-t pt-4">
                                <p className="mb-2 text-[11px] font-bold tracking-widest uppercase">Persetujuan wajib</p>
                                <Checkbox checked={form.data.accepted} onChange={(v) => form.setData('accepted', v)}>
                                    Saya sudah membaca dan setuju dengan Syarat dan Ketentuan serta Kebijakan Privasi ini.
                                </Checkbox>
                            </div>
                        )}
                    </div>

                    <div className="shrink-0 md:mx-auto md:w-full md:max-w-[720px]">
                        {guest ? (
                            <>
                                <p className="text-ink-soft mt-3 text-[11px] leading-relaxed sm:text-[12px]">Persetujuan dicentang di form daftar.</p>
                                <PrimaryButton
                                    href={back}
                                    className="mt-3 h-11 text-[13px] font-extrabold sm:h-12 sm:text-sm md:ml-auto md:w-auto md:min-w-[240px] md:px-8"
                                >
                                    Kembali ke pendaftaran
                                </PrimaryButton>
                            </>
                        ) : (
                            <>
                                <p className="text-ink-soft mt-3 text-[11px] leading-relaxed sm:text-[12px]">
                                    Gulir teks sampai bawah, lalu centang persetujuan wajib. Tombol aktif setelah itu.
                                </p>
                                <PrimaryButton
                                    type="submit"
                                    disabled={!reachedBottom || !form.data.accepted || form.processing}
                                    className="mt-3 h-11 text-[13px] font-extrabold sm:h-12 sm:text-sm md:ml-auto md:w-auto md:min-w-[240px] md:px-8"
                                >
                                    {form.processing ? 'Menyimpan...' : 'Setuju dan lanjut'}
                                </PrimaryButton>
                                {form.errors.accepted && <span className="text-danger mt-1 block text-[11px]">{form.errors.accepted}</span>}
                            </>
                        )}
                    </div>
                </form>
            </div>
        </ParticipantLayout>
    );
}
