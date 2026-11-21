  # WEBAPP LOTRE WARUNG — DOKUMENTASI UNTUK AGENTIC AI

> **Dokumen gabungan:** PRD bisnis + addendum fraud prevention Revisi 1.2 + PRD teknis arsitektur.
> **Penting:** Backend menggunakan Laravel monolith + Inertia.js. Bukan REST API. Frontend menggunakan React + TypeScript TSX + Tailwind CSS.
> **Sumber bisnis:** hasil konversi teks dari `PRD_Webapp_Lotre_Warung_v1.2.pdf`. Bagian PRD bisnis dipertahankan berdasarkan teks PDF; tata letak PDF tidak dipertahankan.

---

## BAGIAN A — PRD BISNIS DAN FRAUD PREVENTION (KONVERSI PDF v1.2)

PRD WEBAPP LOTRE WARUNG
                                             ADDENDUM REVISI 1.2
                                      Pembaruan Validasi dan Fraud Prevention

        Stack aplikasi                  React.js + TypeScript · Inertia.js · Laravel · MySQL/InnoDB

        Lingkungan hosting              Shared Hosting (dengan pemeriksaan kemampuan PHP, database, storage, dan cron)

        Autentikasi peserta             PIN 4 angka; tanpa OTP WhatsApp berbayar

        Perubahan utama                 Device ID, Cookie/Local Storage, IP monitoring, deteksi pergantian akun, perceptual hash,
                                        dan velocity check

        Tanggal revisi                  16 November 2026

 Status dokumen: Addendum ini menjadi bagian dari PRD dan melengkapi Revisi 1.1. Jika terdapat perbedaan dengan
 ketentuan sebelumnya mengenai autentikasi dan anti-fraud, ketentuan Revisi 1.2 ini yang berlaku. Alur bisnis lain yang
 tidak diubah tetap mengikuti PRD sebelumnya.

 Prinsip utama: mengurangi penyalahgunaan akun dan klaim tanpa menganggap IP, Device ID, atau nomor WhatsApp
 sebagai bukti identitas seseorang secara mutlak.

---

 1. Tujuan dan Prinsip Fraud Prevention
 Pembaruan ini ditujukan untuk mengurangi risiko pembuatan akun massal dan klaim voucher yang tidak didukung
 pembelian sah. Sistem menggunakan beberapa sinyal secara berlapis, bukan mengandalkan satu identitas teknis saja.

 Prinsip yang wajib diikuti
 • PIN 4 angka tetap digunakan untuk login peserta. OTP WhatsApp tidak digunakan pada ruang lingkup ini karena
 menimbulkan biaya pengiriman pesan.
 • Nomor WhatsApp peserta harus unik di database, tetapi tanpa OTP sistem tidak boleh menyatakan bahwa kepemilikan
 nomor telah terverifikasi.
 • Tidak ada blacklist otomatis khusus untuk pemilik atau pegawai warung. Mereka tidak ditolak hanya karena hubungan
 pekerjaan atau kepemilikan dengan warung.
 • Device ID adalah identitas browser/instalasi web yang dibuat aplikasi, bukan IMEI atau identitas hardware HP.
 • IP, Device ID, cookie, dan pola aktivitas adalah sinyal risiko. Satu sinyal saja tidak cukup untuk menyimpulkan fraud.
 • Tindakan penahanan atau penolakan harus menyimpan alasan dan jejak audit.

 2. Mekanisme dan Ketentuan Implementasi
 2.1 PIN 4 angka tanpa OTP
 Peserta membuat PIN 4 angka dan menggunakannya untuk login. PIN wajib disimpan dalam bentuk hash menggunakan
 fasilitas hashing Laravel (misalnya Hash::make) dan diverifikasi menggunakan Hash::check. PIN tidak boleh disimpan atau
 ditampilkan kembali dalam bentuk teks biasa.

 Percobaan login yang gagal dibatasi menggunakan rate limiting. Setelah batas percobaan tercapai, sistem menerapkan
 jeda/penguncian sementara. Reset PIN dilakukan melalui prosedur admin yang terkontrol, menggunakan PIN sementara
 atau mekanisme reset yang aman, dan setiap reset dicatat dalam audit log. Admin tidak boleh dapat melihat PIN lama.

 2.2 Device ID UUID
 Saat browser pertama kali digunakan, frontend membuat UUID acak (misalnya melalui crypto.randomUUID jika tersedia)
 dan mengirimkannya ke Laravel. Backend menyimpan relasi Device ID dengan akun peserta dan waktu aktivitas. Device ID
 yang sama saat mencoba mendaftarkan akun peserta lain dapat ditolak atau ditandai untuk pemeriksaan sesuai kebijakan
 sistem.

 Batasan: UUID dapat hilang saat data browser dihapus, browser diganti, atau perangkat berganti. Pengguna dapat
 membuat identitas browser baru. Karena itu Device ID tidak boleh disebut sebagai pengenal satu HP fisik dan tidak
 menjamin satu orang hanya memiliki satu akun.

 2.3 Cookie dan Local Storage
 Local Storage dapat menyimpan Device ID agar tetap tersedia pada kunjungan berikutnya. Cookie dapat menyimpan
 penanda perangkat/sesi. Cookie autentikasi sebaiknya dikelola server dengan Secure, HttpOnly, dan SameSite sesuai
 kebutuhan. Nilai yang dikirim browser tidak boleh dipercaya begitu saja; backend harus memvalidasi relasinya terhadap
 data yang tersimpan.

---

 2. Mekanisme dan Ketentuan Implementasi (lanjutan)
 2.4 IP Rate Limiting dan pemantauan IP
 Laravel RateLimiter/middleware throttle digunakan untuk membatasi frekuensi permintaan pendaftaran dan login. IP publik
 yang terlihat server dapat dicatat sebagai sinyal aktivitas. Batas awal pendaftaran dapat diuji, misalnya 2–3 permintaan
 pendaftaran per IP dalam 24 jam, tetapi angka tersebut harus dapat dikonfigurasi setelah uji coba.

 IP tidak boleh dipakai sebagai identitas tunggal atau alasan otomatis memblokir seluruh peserta. Banyak perangkat dapat
 berbagi satu IP publik melalui WiFi atau CGNAT operator seluler, sedangkan satu perangkat dapat memperoleh IP berbeda
 saat berpindah jaringan. Konfigurasi trusted proxy harus benar agar Laravel membaca IP sumber yang tepat.

 2.5 Deteksi pergantian akun pada perangkat
 Backend mencatat hubungan Device ID dengan akun peserta. Jika satu Device ID mencoba mendaftarkan akun kedua
 atau berganti-ganti akun, sistem mencatat anomali dan menerapkan tindakan sesuai tingkat risiko: menolak pendaftaran
 akun kedua pada browser tersebut, meminta pemeriksaan admin, atau membatasi sementara aktivitas terkait.

 Jangan otomatis menolak semua aktivitas login hanya karena browser pernah digunakan akun lain. Sediakan prosedur
 penanganan perangkat bersama/pergantian perangkat yang sah melalui admin. Pergantian atau reset Device ID tidak boleh
 langsung dianggap bersih; sistem tetap mempertimbangkan riwayat IP, akun, dan klaim. Namun, sinyal-sinyal tersebut
 tetap bukan bukti identitas fisik.

 2.6 Perceptual Hash foto
 Foto bukti klaim diproses untuk menghasilkan perceptual hash (misalnya pHash atau dHash) agar sistem dapat mencari
 foto yang identik atau mirip secara visual. PHP GD dapat digunakan untuk pemrosesan dasar; Imagick dapat digunakan jika
 tersedia pada hosting. Ketersediaan ekstensi harus diperiksa sebelum implementasi.

 Alur: browser mengompresi foto dengan tetap menjaga keterbacaan → Laravel memvalidasi jenis/ukuran berkas → server
 menghitung perceptual hash → sistem membandingkan hash dengan klaim terdahulu → klaim yang melewati ambang
 kemiripan ditandai untuk pemeriksaan admin.

 Ambang jarak hash tidak ditetapkan sebagai angka universal. Nilai harus diuji menggunakan contoh foto nyata (foto sama,
 foto berbeda, sudut/pencahayaan berbeda) sebelum diputuskan. Ambang seperti selisih 4 bit hanya boleh dipakai jika
 sesuai dengan panjang hash dan hasil uji. Perceptual hash adalah indikator kemiripan, bukan bukti pasti bahwa transaksi
 atau objeknya sama.

 Pemrosesan gambar harus dibatasi ukuran dan dimensinya untuk menghindari kehabisan memori/CPU pada Shared
 Hosting. Hindari membandingkan setiap foto dengan seluruh foto tanpa penyaringan kandidat atau indeks yang sesuai.

 2.7 Velocity Check
 Sistem menghitung frekuensi klaim berdasarkan titik/outlet, Device ID, akun, dan rentang waktu. Contoh ambang awal:
 lebih dari 3 klaim pada satu titik dalam 1 jam dapat memicu flag pemeriksaan. Ambang ini merupakan konfigurasi awal yang
 harus diuji dan dapat disesuaikan, bukan bukti otomatis terjadinya fraud.

 Klaim yang terindikasi anomali diarahkan ke antrean pemeriksaan admin (A2) sesuai alur status klaim pada PRD. Flag
 harus menyimpan jenis aturan, nilai pemicu, waktu, dan referensi data yang mendukung pemeriksaan.

---

 3. Aturan Keputusan dan Penanganan Risiko
       Mekanisme                  Pemicu                                           Tindakan sistem

       Device ID                  Device ID yang sama mencoba membuat              Tolak pendaftaran kedua atau tandai untuk
                                  akun lain                                        pemeriksaan sesuai kebijakan; simpan log percobaan.

       IP monitoring              Permintaan pendaftaran dari satu IP              Throttle permintaan dan/atau beri flag risiko; jangan
                                  melewati ambang                                  otomatis memblokir semua pengguna IP tersebut.

       Pergantian akun            Satu browser berulang kali berganti akun         Catat anomali, batasi sementara aktivitas terkait, dan
                                  atau mencoba banyak nomor                        sediakan pemeriksaan admin.

       Perceptual hash            Foto memiliki kemiripan di atas ambang teruji    Tandai klaim untuk pemeriksaan admin; jangan
                                                                                   menolak hanya berdasarkan hash.

       Velocity check             Klaim pada titik/perangkat meningkat tidak       Tandai klaim terkait dan tampilkan alasan serta riwayat
                                  wajar                                            kepada admin.

       PIN login                  Percobaan PIN salah berulang                     Terapkan throttling/penguncian sementara dan catat
                                                                                   kejadian.

 Tingkat tindakan
 • Normal: tidak ditemukan sinyal yang melewati ambang.
 • Suspicious: satu atau beberapa sinyal terdeteksi; aktivitas dicatat dan dapat dipantau.
 • Review: klaim ditahan pada antrean admin sesuai alur PRD; admin melihat foto, alasan flag, serta riwayat relevan.
 • Blocked: hanya digunakan untuk pelanggaran yang memenuhi aturan penolakan yang jelas atau keputusan admin yang
 beralasan. Hindari pemblokiran permanen hanya berdasarkan IP atau Device ID.

 Aturan ini tidak mengubah batas klaim harian, mekanisme slot, aturan hadiah, atau proses penukaran voucher yang sudah
 ditetapkan dalam PRD. Mekanisme review mengikuti status dan SLA antrean admin yang berlaku.

 4. Kebutuhan Data dan Audit
 Data minimum yang disarankan
       Tabel/entitas                         Data penting

       participant_devices                   participant_id, device_id, first_seen_at, last_seen_at, status, created_at, updated_at

       participant_device_events             participant_id, device_id, event_type (register/login/account_switch), IP, timestamp,
                                             risk_flag/reason

       claim_photos                          claim_id, file_path, perceptual_hash, hash_version, created_at

       fraud_flags / audit_logs              entity_type, entity_id, rule_code, reason, evidence/reference, action, actor_id, created_at

 Alamat IP dan Device ID perlu dibatasi aksesnya, digunakan hanya untuk tujuan keamanan program, dan memiliki
 kebijakan retensi yang ditetapkan. Audit log untuk perubahan status dan keputusan admin harus dapat ditelusuri.

---

 5. Kompatibilitas Shared Hosting dan Laravel
 Seluruh mekanisme dirancang agar dapat berjalan dalam satu aplikasi Laravel monolith pada Shared Hosting, tanpa
 mewajibkan VPS, Redis, atau layanan OTP. Implementasi harus disesuaikan dengan fitur paket hosting yang benar-benar
 tersedia.

       Komponen                        Kebutuhan/ketentuan

       Laravel RateLimiter             Gunakan cache store yang tersedia dan konsisten. Database cache dapat menjadi pilihan jika
                                       Redis tidak tersedia.

       MySQL InnoDB                    Simpan relasi perangkat, klaim, flag, dan audit. Tambahkan indeks pada kolom pencarian
                                       seperti IP, device_id, outlet_id, created_at, dan claim_id sesuai pola query.

       PHP GD / Imagick                Periksa ekstensi yang aktif pada hosting. GD cukup untuk pemrosesan dasar; Imagick opsional
                                       jika tersedia.

       Cron Job                        Dapat digunakan untuk pekerjaan antrean terjadwal, pembersihan data sementara, dan tugas
                                       pemeliharaan.

       Laravel Queue                   Jika worker terus-menerus tidak tersedia, gunakan database queue yang diproses melalui
                                       cron/scheduler. Pekerjaan berat harus dibatasi dan diuji.

       Storage                         Batasi ukuran/dimensi upload, kompresi foto, validasi MIME, dan kebijakan retensi file.

       HTTPS dan proxy                 HTTPS wajib. Konfigurasi trusted proxy harus benar agar IP pengunjung tidak salah terbaca.

 Sebelum produksi, developer wajib menguji batas upload, penggunaan memori saat pemrosesan foto, waktu respons
 perhitungan hash, jumlah klaim bersamaan, serta ketersediaan cron/queue pada paket Shared Hosting. Jika hasil uji tidak
 memenuhi kebutuhan, optimasi atau pemindahan proses tertentu dapat diajukan sebagai perubahan teknis terpisah.

 6. Revisi Keputusan dan Hal yang Tetap Terbuka
 Keputusan yang ditetapkan dalam Revisi 1.2
 1. Autentikasi peserta menggunakan PIN 4 angka tanpa OTP WhatsApp berbayar.
 2. Device ID UUID, Cookie, dan Local Storage digunakan sebagai pengenal browser/perangkat web, bukan identitas
 hardware.
 3. IP digunakan untuk rate limiting dan pemantauan risiko, bukan pemblokiran otomatis seluruh pengguna dari IP yang
 sama.
 4. Pergantian akun pada Device ID yang sama dicatat dan dibatasi sesuai kebijakan; tersedia pemeriksaan untuk kasus
 perangkat bersama/pergantian perangkat yang sah.
 5. Perceptual hash foto dan Velocity Check menjadi indikator untuk menandai klaim dan membantu pemeriksaan admin.
 6. Tidak ada blacklist otomatis peserta berdasarkan status sebagai pemilik atau pegawai warung.

 Hal yang harus divalidasi sebelum implementasi final
 • Ketersediaan PHP GD atau Imagick, Cron Job, database cache/queue, dan kapasitas storage pada paket Shared
 Hosting.
 • Ambang IP, Device ID, kemiripan perceptual hash, dan velocity check melalui uji coba dengan data nyata.
 • Prosedur pemulihan akun ketika peserta kehilangan akses browser/perangkat atau memakai perangkat bersama.
 • Masa retensi foto, IP, Device ID, dan audit log serta pembatasan akses admin.
 Catatan: Revisi ini menetapkan arah dan aturan teknis pada tingkat PRD. Detail implementasi, skema migrasi database, nilai ambang
 produksi, dan pengujian performa harus dituangkan developer dalam rancangan teknis dan hasil uji sebelum peluncuran.

---

                       PRD WEBAPP LOTRE WARUNG
                               Dokumen Revisi 1.1 — Pembaruan Arsitektur dan Teknologi

             Frontend                     React.js + TypeScript

             Integrasi UI                 Inertia.js

             Backend                      Laravel

             Arsitektur                   Monolithic (Laravel Monolith)

             Database                     MySQL dengan storage engine InnoDB

             Hosting                      Shared Hosting

            KETENTUAN REVISI: Addendum ini merupakan bagian dari PRD dan mengesampingkan ketentuan
            versi awal yang bertentangan, khususnya Bagian 16 (Model Data), Bagian 19 (Hosting), serta
            Bagian 22 nomor 3 (Stack dan Hosting). Kebutuhan bisnis dan keputusan lain yang tidak
            disebutkan di sini tetap mengikuti PRD awal.

 Ruang lingkup revisi
 Revisi ini menetapkan pilihan teknologi dan penyesuaian teknis yang diperlukan. Revisi tidak mengubah alur peserta, mitra,
 admin, aturan hadiah, jumlah titik, jumlah slot, mekanisme klaim, maupun ketentuan bisnis lain dalam PRD awal.
 Tanggal revisi: 13 November 2026

---

 1. Arsitektur Aplikasi
 Aplikasi menggunakan arsitektur monolith. Frontend React.js + TypeScript diintegrasikan ke dalam aplikasi Laravel
 menggunakan Inertia.js. Laravel menangani routing web, autentikasi, otorisasi, validasi, aturan bisnis, akses database,
 penyimpanan berkas, dan proses aplikasi.

 1.1 Komponen teknologi
           Komponen              Keputusan                          Peran

           Frontend              React.js + TypeScript              Antarmuka peserta, mitra, dan admin.

           Integrasi UI          Inertia.js                         Menghubungkan halaman React dengan route/controller
                                                                    Laravel; bukan REST API terpisah.

           Backend               Laravel                            Business logic, autentikasi, otorisasi, validasi, dan proses
                                                                    aplikasi.

           Database              MySQL / InnoDB                     Penyimpanan data relasional dan transaksi.

           Hosting               Shared Hosting                     Menjalankan aplikasi Laravel dan menyajikan aset frontend
                                                                    hasil build.

 1.2 Pola request dan pemrosesan
           Browser pengguna — Peserta · Mitra · Admin

           ↓

           React.js + TypeScript — halaman dan komponen antarmuka

           ↓ Inertia.js

           Laravel — web routes, controllers, middleware, validation, services/actions

           ↓ Eloquent ORM

           MySQL (InnoDB) — data peserta, titik, papan, slot, klaim, voucher, hadiah, mitra, payout, dan log

 1.3 Batasan komunikasi
 Tidak dibuat REST API internal terpisah untuk menghubungkan React dengan Laravel. Halaman aplikasi menggunakan
 route web Laravel dan mekanisme Inertia.js. Integrasi eksternal yang disebutkan dalam PRD (misalnya tautan wa.me atau
 proses manual melalui agregator) tetap mengikuti ruang lingkup PRD awal. Keputusan ini tidak melarang API pihak ketiga
 jika kelak diperlukan dan disetujui sebagai perubahan ruang lingkup.

---

 2. Database dan Konsistensi Transaksi
 Model data ditetapkan menggunakan database relasional MySQL dengan storage engine InnoDB. Entitas dan relasi bisnis
 tetap mengikuti Bagian 16 PRD awal; addendum ini menetapkan teknologi dan aturan implementasi database, bukan
 mengubah daftar entitas bisnis.

 2.1 Ketentuan database
 • Relasional: data disimpan dalam tabel dengan primary key, foreign key, dan relasi yang sesuai.

 • Unique constraint: terapkan pada identitas yang memang harus unik, termasuk nomor WhatsApp peserta, kode slot, dan
 kode voucher.

 • Index: siapkan index untuk kolom pencarian/filter seperti status klaim, peserta, titik, slot, mitra, dan waktu transaksi.

 • Transaction: proses yang saling bergantung harus dijalankan dalam satu transaksi database.

 • Row-level locking: proses penetapan/penahanan slot dan perubahan status slot menggunakan penguncian baris agar
 klaim bersamaan tidak menghasilkan slot ganda.

 • Audit log: perubahan status dan aksi admin tetap dicatat sesuai aturan log pada PRD awal.

 2.2 Konsistensi proses klaim
 Penetapan slot, validasi kode slot, pembuatan klaim, dan perubahan status slot harus konsisten ketika dua peserta
 melakukan klaim hampir bersamaan. Gunakan transaksi dan row-level locking pada MySQL InnoDB, ditambah constraint
 unik sebagai perlindungan. Permintaan berulang (double tap atau retry setelah jaringan terputus) harus ditangani secara
 idempotent agar tidak menggandakan klaim atau reward.

 3. Hosting dan Deployment
 Hosting produksi ditetapkan menggunakan shared hosting yang disediakan oleh pihak pemilik program. Laravel menjadi
 aplikasi utama; hasil build React disajikan sebagai aset frontend. Tidak diperlukan proses Node.js yang berjalan
 terus-menerus di server produksi hanya untuk menyajikan frontend.

 3.1 Persyaratan yang harus diverifikasi pada penyedia hosting
 • Versi PHP dan ekstensi PHP harus kompatibel dengan versi Laravel yang dipilih.

 • MySQL mendukung InnoDB, transaksi, foreign key, dan row-level locking.

 • Tersedia cara menjalankan Composer untuk instalasi dependency (SSH atau metode deployment yang disetujui).

 • Document root dapat diarahkan secara aman ke direktori public Laravel; file konfigurasi dan source code tidak boleh
 terekspos ke publik.

 • HTTPS aktif untuk seluruh akses aplikasi.

 • Batas upload dan kapasitas penyimpanan cukup untuk foto bukti pembelian.

 • Cron Jobs tersedia apabila ada tugas terjadwal yang digunakan aplikasi.

 • Mekanisme backup dan pemulihan database serta berkas dapat dijalankan dan diuji.
 Catatan deployment: build React dapat dilakukan di lingkungan pengembangan atau pipeline build, kemudian hasilnya diunggah ke hosting.
 SSH, Composer, Cron Jobs, batas resource, dan konfigurasi document root belum dianggap tersedia sampai dikonfirmasi kepada penyedia
 hosting.

---

 4. Dampak terhadap Persyaratan Non-Fungsional
 Persyaratan bisnis dan non-fungsional lain dalam PRD awal tetap berlaku. Ketentuan berikut menambahkan detail
 implementasi agar sesuai dengan stack yang dipilih.

           Area                    Ketentuan tambahan

           Keamanan                Autentikasi dan otorisasi diproses di Laravel. Validasi penting tidak boleh hanya mengandalkan
                                   validasi di browser.

           Session                 Gunakan mekanisme session Laravel yang aman untuk aplikasi web; cookie diberi pengaturan
                                   Secure, HttpOnly, dan SameSite sesuai kebutuhan.

           Upload foto             Validasi tipe dan ukuran berkas di server, buat nama berkas yang aman, simpan di lokasi
                                   non-public bila memungkinkan, dan sajikan melalui akses terkontrol.

           Performa                Optimalkan ukuran foto, query database, index, pagination, dan caching seperlunya sesuai
                                   kemampuan shared hosting.

           Operasional             Siapkan pencatatan error, backup, uji restore, serta prosedur ketika resource atau layanan
                                   hosting mencapai batas.

 5. Pembaruan Bagian 22 — Keputusan Terbuka
 Keputusan nomor 3 — Stack dan hosting: SELESAI. Jawaban resmi: frontend React.js + TypeScript; integrasi UI
 menggunakan Inertia.js; backend Laravel dengan arsitektur monolith; database MySQL (InnoDB); hosting shared hosting.

 Keputusan terbuka lain dalam Bagian 22 tetap berstatus terbuka dan harus dijawab oleh pihak yang ditunjuk pada PRD awal.
 Revisi teknologi ini tidak dianggap sebagai persetujuan atas keputusan bisnis lain, seperti verifikasi akun, batas usia, retensi
 foto, agregator token, area pengiriman, peluang mystery gift, atau detail mitra.

 6. Bagian PRD yang diperbarui dan aturan prioritas
           Bagian PRD awal                                 Status setelah revisi 1.1

           Bagian 16 — Model data (hlm. 27–29)             Entitas bisnis tetap; database ditetapkan menjadi MySQL
                                                           relasional/InnoDB.

           Bagian 19 — Non-Fungsional (hlm. 34)            Hosting ditetapkan shared hosting, dengan persyaratan kompatibilitas
                                                           pada addendum ini.

           Bagian 22 nomor 3 — Stack dan hosting           Ditandai selesai dengan stack yang tercantum pada halaman pertama
           (hlm. 40)                                       addendum.

           Bagian lainnya                                  Tetap berlaku tanpa perubahan, kecuali jika secara eksplisit
                                                           bertentangan dengan addendum ini.

 Dokumen revisi 1.1 ini dibaca bersama PRD awal. Jika terdapat perbedaan khusus pada arsitektur, stack, database, atau hosting, ketentuan
 addendum ini yang berlaku.

---

PRD Webapp Lotre Warung

  PRD Webapp Lotre Warung
    Nov 13, 2026     ·    ​@Yeepy House

  1. Ringkasan dan tujuan
  Webapp mencatat setiap pembelian bungkus di 20 titik sebagai satu data peserta,
  menunjuk slot hadiah di papan, memeriksa bukti foto, lalu memenuhi hadiah lewat lima
  jalur. Peserta memakai HP lewat scan QR, tanpa memasang aplikasi.

  Tujuan

     1. Setiap pembelian menjadi satu klaim berfoto yang terikat pada satu nomor WhatsApp.
     2. Satu slot hanya bisa diambil satu kali, sehingga hadiah tidak pernah terbagi dua kali.
     3. Hadiah sampai ke peserta lewat jalur sesuai jenisnya, dan statusnya terlihat sampai
        selesai.
     4. Admin Si Pemburu memiliki data untuk memeriksa klaim, membayar mitra, dan
        membuat laporan.

  Indikator berhasil

        500 slot di 20 papan dapat diklaim tanpa slot ganda.
        Klaim bertanda diperiksa admin paling lama 1×24 jam.
        Setiap voucher punya status yang akurat, dan satu kode hanya bisa ditukar sekali.
        Rekap mingguan tiap mitra sama dengan voucher yang benar-benar ditukar.

  Target angka selain 1×24 jam belum ditetapkan. Beban sistem kecil: sekitar 500 klaim dan
  sekitar 400 peserta unik selama program (skenario dasar, batas atas 500).

  Ruang lingkup

    Masuk dalam pekerjaan                      Di luar pekerjaan (batas yang diusulkan)

    Halaman peserta di HP                      Pengiriman WhatsApp otomatis. Admin
                                               mengirim lewat tautan wa.me.

    Halaman mitra untuk menukar voucher        Pembayaran ke mitra. Sistem hanya merekap.

    Panel admin Si Pemburu                     Integrasi API agregator. Admin memproses
                                               manual.

                                                                                            Page 1 of 48

---

PRD Webapp Lotre Warung

    Masuk dalam pekerjaan                             Di luar pekerjaan (batas yang diusulkan)

    Database peserta, klaim, voucher,                 Dashboard untuk klien. Cukup ekspor CSV.
    hadiah

    Ekspor CSV untuk laporan dan rekap                Pendaftaran Laga Kosan. Datanya dipakai dari
    mitra                                             database yang sama.

    Tombol darurat untuk menjeda program              Saldo agregator dan penghapusan data setelah
                                                      program.

  Batas di kolom kanan adalah usulan. Masnun boleh menanggapi, terutama soal WhatsApp
  otomatis dan bentuk laporan.

  2. Aktor dan hak akses
  Ada empat pihak yang memakai sistem, dan dua pihak lain yang tidak punya akun. Satu
  nomor WhatsApp hanya untuk satu akun peserta.

    Aktor                 Siapa              Cara masuk         Boleh                  Tidak boleh

    Peserta               Mahasiswa dan      Scan QR titik,     Daftar, foto           Melihat data
                          anak kos yang      nomor              bungkus, ambil         peserta lain selain
                          membeli            WhatsApp dan       slot, lihat kartu      nama dan
                          bungkus di titik   PIN 4 angka        cap dan                peringkat;
                                             (OTP sebagai       peringkat, isi         mengubah status
                                             opsi, bagian 14    alamat atau            hadiah
                                             dan 22)            nomor tujuan,
                                                                lihat status
                                                                hadiah

    Mitra                 Warung, kafe,      Login PIN mitra    Cek dan tukar          Melihat voucher
                          laundry, dan                          kode voucher           mitra lain atau
                          usaha lain                            milik sendiri, lihat   data pribadi
                          penerima                              rekap mingguan         peserta
                          voucher

                                                                                                      Page 2 of 48

---

PRD Webapp Lotre Warung

    Aktor                 Siapa               Cara masuk        Boleh               Tidak boleh

    Mitra                 Warung penjual      Login PIN mitra   Semua hak mitra,    Melihat nama
    kuota                 pulsa dan kuota                       ditambah melihat    peserta. Hanya
                          (jenis mitra yang                     antrean             nomor tujuan dan
                          sama)                                 permintaan          nilai yang tampil
                                                                nomor HP dan
                                                                menandai selesai

    Admin Si              Tim Si Pemburu      Akun admin        Semua modul:        Tidak ada
    Pemburu                                   masing-masing     periksa klaim,      pembatasan
                                                                proses token        modul. Setiap aksi
                                                                listrik ke          tercatat atas
                                                                agregator,          nama akunnya
                                                                hubungi peserta
                                                                untuk bensin
                                                                tunai, kirim
                                                                hadiah fisik,
                                                                bayar mitra, atur
                                                                parameter,
                                                                tombol darurat

    Pemilik               Warung yang         Tanpa akun        Tidak ada. Titik    Tidak berlaku
    titik                 memasang                              terbaca otomatis
                          papan                                 dari QR

    Pihak                 Penerima            Tanpa akun        Menerima            Tidak berlaku
    Djarum                laporan program     (usulan)          ekspor CSV dari
                                                                admin

  Mitra pemilik voucher berbeda dengan pemilik titik. Mitra adalah usaha yang menerima
  voucher dari peserta, bukan warung tempat papan dipasang. Hanya admin Si Pemburu
  yang memproses agregator. Pulsa dan kuota diproses oleh mitra kuota, dengan skema
  pembayaran yang sama seperti mitra lain.

  3. Aturan program dan parameter
  Program berjalan di 20 papan berisi 25 slot (500 slot), tanpa refill, dengan isi mengikuti
  skema B. Semua angka di bawah disimpan sebagai pengaturan atau master data yang bisa
  diubah admin, tidak ditulis mati di kode.

                                                                                                    Page 3 of 48

---

PRD Webapp Lotre Warung

    Parameter             Nilai                         Disimpan di   Catatan

    Jumlah titik          20 warung                     Master data   Area Sukabirus,
                                                                      Sukapura, PGA, WDP

    Slot per papan        25, kode posisi A1 sampai     Tetap         21 slot kecil dan 4
                          E5                                          limited edition

    Total slot            500                           Turunan       Tidak ada refill. Papan
                                                                      habis ditutup

    Isi 500 slot (skema   277 voucher, 143              Pengaturan    277 + 143 = 420 slot
    B)                    merchandise, 80 limited       generator     kecil (20 × 21)
                          edition

    Kode unik slot        6 karakter, tanpa huruf       Dibuat        Tercetak di balik slot
                          mirip (I, L, O) dan angka     generator
                          0, 1

    Batas klaim harian    2 per nomor per hari          Pengaturan    Klaim yang ditolak tidak
                                                                      dihitung. Prototipe: 3

    Cek foto pertama      Aktif                         Pengaturan    Bisa dimatikan
    peserta baru

    Sampel acak           10% dari semua klaim          Pengaturan

    Foto mirip            Hash visual 256 bit,          Pengaturan
                          selisih 4 bit atau kurang

    Foto gelap            Kecerahan rata-rata di        Pengaturan
                          bawah 45 dari 255

    Jeda foto ke input    Lebih dari 30 menit           Pengaturan
    kode

    Target antrean        Paling lama 1×24 jam          Tetap         Target layanan, bukan
    admin                                                             batas sistem

    Kartu loyalti         10 cap, 1 klaim disetujui =   Tetap         Klaim antre atau ditolak
                          1 cap                                       tidak menambah cap

    Mystery gift          Didapat di cap ke-5           Tetap         Kartu penuh di 10 cap,
                                                                      pembelian tetap
                                                                      dihitung untuk
                                                                      peringkat

                                                                                               Page 4 of 48

---

PRD Webapp Lotre Warung

    Parameter             Nilai                         Disimpan di   Catatan

    Peluang mystery       Usulan 50%, sisanya 1         Pengaturan    Prototipe: 70%. Lihat
    gift berupa           bungkus gratis                              bagian 22
    voucher

    Peringkat             10 teratas: merchandise       Tetap         Urutan: cap terbanyak,
                          limited edition. 4 teratas:                 lalu yang lebih dulu
                          golden slot Laga Kosan                      mencapai jumlah itu

    Batas salah nomor     3 kali                        Pengaturan    Berlaku untuk voucher
    tujuan                                                            digital dan pulsa/kuota

    Batas waktu isi       Tanpa batas                   Pengaturan    Admin boleh mengisi
    nomor tujuan                                                      tanggal tutup
                                                                      pemrosesan

    Masa berlaku          Per jenis voucher,            Master data   Prototipe memakai 7, 14,
    voucher mitra         ditetapkan admin                            atau 30 hari

    Area pengiriman       Daftar area Telkom            Master data   Prototipe memakai tiga
    hadiah fisik          University                                  area. Daftar final
                                                                      menunggu admin

    Batas usia            Menunggu konfirmasi           Pengaturan    Prototipe memakai 21
    pendaftar                                                         tahun

    Format PIN            4 angka                       Tetap         Atau OTP, bagian 22
    peserta

  Jangan membuat papan baru di luar generator. Slot dan kodenya dibuat sekali di awal, dan
  tidak pernah dibuat ulang selama program.

  4. Peta alur end-to-end
  Satu pembelian menjadi satu klaim, dan isi slot menentukan salah satu dari lima jalur
  hadiah.

                                                                                            Page 5 of 48

---

PRD Webapp Lotre Warung

  alur end-to-end · 4 tahap, 5 jalur hadiah

  Peserta masuk, memotret bungkus, lalu memasukkan kode slot. Sistem menyetujui klaim
  otomatis atau menyerahkannya ke admin bila bertanda. Hanya voucher mitra dan pulsa
  atau kuota yang masuk rekap pembayaran mingguan. Rincian tiap tahap ada di bagian 5
  sampai 9.

  5. Alur peserta
  Peserta melewati sembilan langkah dari scan QR sampai hadiah, dengan tiga pintu
  penolakan dan satu antrean admin.

                                                                                    Page 6 of 48

---

PRD Webapp Lotre Warung

  alur peserta · 9 langkah, 4 jalur keluar

  Tiga penolakan pertama (usia, batas harian atau papan penuh, kode) hanya mencatat
  alasan dan titik di rejects, tanpa data pribadi. Klaim bertanda berhenti di antrean admin
  dan belum menambah cap. Aturan pemeriksaan ada di bagian 18, layar di bagian 11, dan
  status di bagian 17.

                                                                                        Page 7 of 48

---

PRD Webapp Lotre Warung

  6. Validasi dan antrean admin
  Klaim hanya punya tiga status, dan admin bisa mengurungkan keputusan selama hadiah
  belum diproses.

  status klaim · 3 status, 6 transisi

        Klaim tanpa tanda disetujui otomatis dan langsung menambah cap. Klaim bertanda
        masuk antrean, dengan enam kemungkinan tanda di bagian 18.
        Layar antrean menampilkan foto, alasan tanda, ringkasan riwayat peserta, serta
        tombol Setujui, Tolak, dan Urungkan.
        Alasan penolakan wajib dipilih dari daftar yang ditetapkan admin.
        Target layanan: klaim di antrean diputuskan paling lama 1×24 jam.
        Tabel transisi lengkap ada di bagian 17.

  7. Alur hadiah
  Jenis hadiah di balik slot menentukan jalurnya: 209 voucher mitra, 10 pulsa atau kuota, 31
  token listrik, 27 bensin tunai, dan 223 hadiah fisik (143 merchandise dan 80 limited
  edition). Jumlah ini sama dengan 500 slot skema B.

                                                                                         Page 8 of 48

---

PRD Webapp Lotre Warung

  lima jalur hadiah · rangkaian status per jalur

  Hanya jalur pulsa/kuota dan token listrik yang bisa berulang, karena nomor tujuan bisa
  ditolak. Jalur lain hanya maju. Jalur voucher mitra dan pulsa/kuota masuk rekap
  pembayaran mingguan bagian 8.

  Mystery gift dan loyalti

        Cap ke-5 memberi satu mystery gift per peserta: voucher (peluang diatur di
        pengaturan) atau 1 bungkus gratis. Voucher dari mystery gift mengikuti jalur sesuai
        jenisnya.
        Kartu penuh di cap ke-10. Pembelian sesudahnya tetap dihitung untuk peringkat.
        Peringkat memakai klaim berstatus disetujui saja. 10 teratas mendapat merchandise
        limited edition, 4 teratas mendapat golden slot Laga Kosan.
        Peringkat Laga Kosan ditutup sebelum Laga Kosan dimulai. Admin mengonfirmasi dulu
        apakah pemenang bisa memainkan game itu. Jika tidak, slot turun ke peringkat
        berikutnya. Ini dikerjakan admin, bukan otomatis.

                                                                                         Page 9 of 48

---

PRD Webapp Lotre Warung

  8. Alur mitra dan pembayaran mingguan
  Mitra terlibat di dua jalur: voucher mitra (peserta menukar kode di warung) dan
  pulsa/kuota (mitra kuota mengisi nomor peserta). Keduanya memakai skema pembayaran
  mingguan yang sama.

  alur mitra · penukaran harian, rekap dan pembayaran mingguan, antrean pulsa/kuota

  Aturan

        Satu kode hanya bisa ditukar satu kali. Penukaran bersifat final di sisi mitra: mitra tidak
        bisa membatalkan sendiri.
        Rekap mingguan menghitung voucher berstatus ditukar (dan top up berstatus
        selesai) pada periode Senin sampai Minggu. Zona waktu dan jam penguncian
        mengikuti pengaturan program.
        Koreksi dikerjakan admin sebelum pembayaran dan harus disertai alasan yang
        tercatat. Setelah berstatus dibayar, rekap tidak bisa diubah, hanya dikoreksi di minggu
        berikutnya.
        Mitra hanya melihat data warungnya sendiri. Pembayaran dilakukan di luar webapp
        oleh admin, webapp hanya mencatat tanggal dan bukti.
        Mitra kuota memakai akun mitra yang sama dengan mitra lain, ditambah satu menu
        antrean top up.

  9. Alur pengecualian
  Bagian ini mengumpulkan kejadian di luar jalur normal. Tombol darurat dipakai admin saat
  ada gangguan besar: kebocoran kode, penyalahgunaan, atau kesalahan data papan.

                                                                                            Page 10 of 48

---

PRD Webapp Lotre Warung

  tombol darurat · alur dan dampak

  Penukaran di mitra tetap berjalan saat jeda karena voucher yang sudah terkirim adalah
  janji ke peserta. Jika admin ingin menghentikannya juga, itu dikerjakan manual dengan
  menghubungi mitra. Ini usulan awal dan masuk daftar keputusan di bagian 22.

  Kejadian umum dan responsnya

    Kejadian                         Respons sistem                 Tindak lanjut

    Foto kemasan gelap atau          Klaim diberi tanda dan         Admin menyetujui atau
    mirip foto lain                  menunggu pemeriksaan           menolak di antrean foto

    Kode slot salah                  Ditolak dengan pesan jelas,    Peserta mengisi ulang atau
                                     slot tetap ditahan sampai      mengulang dari awal
                                     batas waktu

    Slot yang ditunjuk ditahan       Ditolak, peserta diminta       Tidak ada
    peserta lain                     mengambil slot yang ditunjuk

    Seluruh 25 slot titik sudah      Papan tampil penuh, klaim      Tidak ada, slot tidak diisi ulang
    terpakai                         baru tidak bisa dibuat

    Batas 2 klaim per hari           Ditolak dengan pesan dan       Tidak ada
    tercapai                         jam coba lagi

    Nomor tujuan pulsa,              Peserta mengisi ulang,         Setelah 3 kali, status perlu
    kuota, atau token ditolak        maksimal 3 kali salah          bantuan admin dan admin
                                                                    menghubungi lewat
                                                                    WhatsApp

                                                                                               Page 11 of 48

---

PRD Webapp Lotre Warung

    Kejadian                     Respons sistem                  Tindak lanjut

    Satu nomor WhatsApp          Pendaftaran kedua ditolak       Peserta menghubungi admin
    dipakai untuk dua akun                                       jika nomor lama sudah tidak
                                                                 dipakai

    Lupa PIN atau OTP tidak      Sesuai opsi verifikasi yang     Admin membantu lewat
    sampai                       dipilih (bagian 22)             WhatsApp

    Voucher melewati masa        Status kadaluarsa, tidak bisa   Tidak ada, tidak diperpanjang
    berlaku                      ditukar                         otomatis

    Alamat di luar area Telkom   Form menolak alamat dan         Peserta mengganti alamat
    University                   menjelaskan batas area

  10. Peta layar
  Kode layar (P, M, A) dipakai di wireframe bagian 11 sampai 13 dan boleh dipakai Masnun
  sebagai nama rute atau komponen. Alamat URL pastinya ditentukan Masnun, selama QR
  per titik tetap satu alamat tetap dan tidak berubah setelah dicetak.

                                                                                          Page 12 of 48

---

PRD Webapp Lotre Warung

  peta layar · kode P, M, A dipakai di wireframe bagian 11 sampai 13

        Peserta masuk dari QR titik (P1). Layar yang butuh akun (P4 ke bawah) mengarahkan
        ke P2 dan P3 bila belum masuk atau belum menyetujui.
        Saat program atau titik dijeda, P1 menampilkan halaman jeda dan layar klaim (P4
        sampai P7) tidak bisa dibuka. P8 dan P9 tetap bisa dibuka.
        Mitra dan admin memakai alamat terpisah dari alamat peserta, dengan akun dan hak
        akses sendiri (bagian 2).

  11. Wireframe peserta
  Wireframe ini low-fi: hanya menunjukkan isi layar, urutan, dan aturannya. Warna, ikon, dan
  gaya visual mengikuti brand guideline terpisah. Tampilan dirancang untuk ponsel dulu.
  Semua layar peserta memakai nama program Lotre Warung dan tidak menampilkan nama
  sponsor.

  P1 sampai P3: masuk

                                                                                          Page 13 of 48

---

PRD Webapp Lotre Warung

  wireframe P1 sampai P3 · beranda, daftar, persetujuan

        P1 Beranda titik. Titik dibaca dari alamat QR. Layar menampilkan nama titik, area, sisa
        slot, dan batas klaim. Mulai klaim menuju P4 bila peserta sudah masuk dan P2 bila
        belum. Saat program atau titik dijeda, tombol diganti pesan jeda (kotak putus-putus).
        P2 Daftar. Lima isian inti: nama panggilan, nomor WhatsApp, tanggal lahir, area kos,
        dan PIN. Bila Masnun memilih OTP, isian PIN diganti kode OTP (bagian 22). Peserta di
        bawah batas usia melihat layar penolakan dan datanya dibuang.
        P3 Persetujuan. Teks panjang tentang data dan privasi. Tombol Lanjut nonaktif sampai
        teks digulir sampai dasar. Versi teks, waktu, dan pilihan peserta disimpan, dan versi
        teks baru meminta persetujuan ulang. Isi teks ditulis terpisah oleh Si Pemburu,
        Masnun hanya menyediakan layarnya.

  P4 sampai P6: klaim

                                                                                          Page 14 of 48

---

PRD Webapp Lotre Warung

  wireframe P4 sampai P6 · papan, foto, slot dan kode

        P4 Papan titik. Menampilkan 25 slot sebagai terpakai atau kosong, tanpa hadiah di
        baliknya. Peserta tidak memilih slot. Tombol Klaim sekarang nonaktif bila batas 2 klaim
        per hari sudah tercapai atau titik penuh.
        P5 Foto kemasan. Foto hanya bisa diambil langsung dari kamera di tempat, tanpa
        pilihan galeri. Waktu dan nama titik dicetak sebagai watermark di foto. Hash,
        kecerahan, dan tanda dihitung di server (bagian 18). Foto gelap atau mirip foto lain
        tidak ditolak di sini, hanya diberi tanda untuk admin.
        P6 Slot dan kode unik. Sistem menunjuk satu slot kosong secara acak dan
        menahannya untuk peserta (usulan penahanan, bagian 17). Peserta mengambil slot
        fisik, lalu mengisi kode 6 karakter di baliknya. Huruf besar otomatis, spasi dan strip
        diabaikan.

  P7 sampai P9: hasil dan hadiah

                                                                                           Page 15 of 48

---

PRD Webapp Lotre Warung

  wireframe P7 sampai P9 · hasil klaim, Hadiahku, kartu dan peringkat

        P7 Hasil klaim. Layar menyesuaikan jenis hadiah. Teks Jenis dan nilai diisi dari data.
        Klaim yang diberi tanda tampil sebagai Sedang diperiksa admin, tanpa menyebut
        alasan tanda. Tombol Lihat Hadiahku membawa peserta ke P8.
        P8 Hadiahku. Satu kartu per hadiah dengan status sesuai bagian 17. Tombol aksi
        muncul hanya bila peserta perlu bertindak: isi nomor tujuan (token listrik, pulsa atau
        kuota, maksimal 3 kali salah), isi alamat (merchandise dan LE), atau lihat kode
        (voucher mitra). Bensin tunai tidak punya tombol, peserta menunggu admin.
        P9 Kartu dan peringkat. Kartu 10 cap, cap ke-5 membuka mystery gift. Peringkat
        dihitung dari klaim berstatus disetujui.
        Menu bawah. Papan, Hadiahku, dan Kartu (digambar di P8 dan P9) berlaku untuk layar
        utama P4, P8, dan P9. Layar langkah klaim (P5 sampai P7) tidak memakainya supaya
        peserta tidak terputus di tengah klaim.

  12. Wireframe mitra
  Mitra memakai ponsel di warung, jadi layarnya sedikit dan tiap layar hanya punya satu
  tugas. Mitra tidak melihat data peserta selain yang dibutuhkan untuk menukar atau
  mengisi.

                                                                                           Page 16 of 48

---

PRD Webapp Lotre Warung

  wireframe M1 sampai M4 · masuk, cek kode, antrean top up, rekap

        M1 Masuk mitra. Satu isian PIN mitra. PIN unik per mitra, dibuat dan diganti oleh
        admin. Percobaan salah berulang dibatasi (bagian 19).
        M2 Cek kode. Mitra mengisi kode voucher, sistem menjawab valid, sudah ditukar,
        kadaluarsa, atau bukan milik mitra ini. Hanya voucher berstatus terkirim yang bisa
        ditukar, dan penukaran hanya sekali.
        M3 Antrean top up. Hanya untuk mitra kuota. Permintaan diurutkan dari yang terlama.
        Selesai mengubah status menjadi selesai dan memasukkannya ke rekap. Nomor salah
        mengembalikan permintaan ke peserta untuk diisi ulang, dengan batas 3 kali salah
        sebelum perlu bantuan admin.
        M4 Rekap mingguan. Jumlah dan nilai voucher ditukar per minggu Senin sampai
        Minggu, dengan status berjalan, menunggu bayar, atau dibayar. Mitra hanya melihat
        dan tidak bisa mengubah angka.

  Layar menurut jenis mitra

    Jenis mitra           Contoh                                    Layar

    Mitra                 Makan dan minum, kopi, laundry,           M1, M2, M4
    voucher               barbershop, warnet, rental PS, steam
                          motor

                                                                                            Page 17 of 48

---

PRD Webapp Lotre Warung

    Jenis mitra           Contoh                                Layar

    Outlet                20 warung titik (voucher warung dan   M1, M2, M4, dengan rekap per outlet
                          galon)                                (keputusan 18)

    Mitra kuota           Warung penjual pulsa dan kuota        M1 sampai M4

  Token listrik dan bensin tunai tidak lewat mitra. Keduanya diproses admin di A3.

  13. Wireframe admin
  Admin memakai laptop, jadi layarnya lebih padat dari peserta dan mitra. Admin tidak
  dibatasi per modul, tetapi setiap aksi tercatat atas nama akunnya (bagian 2). Tombol
  Darurat selalu ada di pojok kanan atas semua halaman. Empat modul paling rumit
  digambar di bawah, empat lainnya dijelaskan di tabel.

  A2 dan A3: pekerjaan harian

  wireframe A2 dan A3 · antrean foto, antrean pemenuhan

        A2 Antrean foto. Daftar klaim yang butuh pemeriksaan di kiri, rincian di kanan: foto,
        tanda, dan tombol keputusan. Ada enam tanda: foto pertama peserta, sampel acak 10
        persen, foto mirip klaim lain, foto gelap, slot berbeda dari penunjukan, dan jeda lebih

                                                                                               Page 18 of 48

---

PRD Webapp Lotre Warung

        dari 30 menit. Tolak wajib memilih alasan. Keputusan bisa diurungkan selama hadiah
        belum diproses.
        A3 Antrean pemenuhan. Tiga tab: Token listrik, Bensin tunai, Merch dan LE. Token
        listrik: Berhasil wajib mengisi nomor referensi dari agregator, Gagal wajib beralasan
        dan menambah hitungan. Bensin tunai: Hubungi membuka WhatsApp, lalu Serahkan
        mencatat tanggal dan penerima. Merch dan LE: Kirim lalu Selesai, dengan tanggal.
        Permintaan yang sudah 3 kali salah (termasuk pulsa atau kuota) tampil di daftar Perlu
        bantuan admin di atas tab, belum digambar.

  A5 dan A7: uang dan kendali

  wireframe A7 dan A5 · pengaturan dan tombol darurat, mitra dan pembayaran

        A7 Pengaturan. Tombol darurat ada di atas parameter dan dipisah dengan bingkai
        merah. Jeda memerlukan alasan, konfirmasi dua langkah, dan tercatat di log.
        Parameter bagian 3 diubah di sini, tiap perubahan tercatat. Batas usia sengaja diberi
        tanda kurung karena belum final (bagian 22).
        A5 Mitra dan pembayaran. Tab Rekap mingguan menampilkan jumlah dan nilai
        voucher ditukar per mitra, termasuk mitra kuota. Admin memeriksa, membayar di luar
        webapp, lalu menandai dibayar dengan tanggal dan bukti. Koreksi jumlah wajib
        beralasan dan hanya bisa sebelum dibayar. Tab Mitra mengelola akun, PIN, dan status
        mitra.

  Modul lain

                                                                                         Page 19 of 48

---

PRD Webapp Lotre Warung

    Modul                 Isi                                       Catatan

    A1 Beranda            Ringkasan hari ini: klaim masuk,          Tautan langsung ke antrean yang
                          antrean foto, antrean pemenuhan,          menumpuk
                          slot terpakai per titik, dan penanda
                          bila ada jeda aktif

    A4 Papan dan          Daftar 20 titik dan 25 slot tiap titik:   Hanya baca. Jeda per titik bisa
    slot                  status kosong, ditahan, atau              dipicu dari sini
                          terpakai, beserta pengambil dan
                          waktu

    A6 Master             Titik, area kos, area pengiriman,         Perubahan tercatat. Titik baru
    data                  mitra, jenis dan jumlah hadiah            otomatis mendapat alamat QR dan
                                                                    25 slot

    A8 Log                Siapa, kapan, apa, dan alasan untuk       Tidak bisa diubah. Bisa diekspor
    aktivitas             setiap aksi admin dan mitra               CSV (bagian 20)

  14. Spesifikasi form
  Form dibuat bertahap: saat daftar hanya lima isian inti, dan data tambahan baru
  ditanyakan ketika hadiahnya membutuhkannya. Tujuannya lengkap bagi sistem tetapi
  ringan bagi peserta.

  Prinsip yang berlaku di semua form

        Satu tujuan per layar dan satu tombol utama.
        Data yang sudah ada tidak ditanya lagi. Nama dan nomor WhatsApp dipakai sebagai
        isian awal.
        Keyboard mengikuti isian: angka untuk nomor dan PIN, huruf besar otomatis untuk
        kode.
        Format dirapikan otomatis: awalan 62 menjadi 0, spasi dan strip pada kode diabaikan.
        Pesan error muncul tepat di bawah kolom, berbahasa sehari-hari, dan menyebut cara
        memperbaikinya.
        Isian tidak hilang jika peserta kembali ke layar sebelumnya.
        Area sentuh tombol dan kolom cukup besar untuk jempol (usulan: tinggi minimal 44
        px).

  Peserta: daftar dan masuk

                                                                                                      Page 20 of 48

---

PRD Webapp Lotre Warung

    Isian                 Wajib   Aturan                             Pesan error

    Nama panggilan        Ya      2 sampai 40 karakter               Isi nama panggilanmu, 2
                                                                     sampai 40 huruf.

    Nomor                 Ya      Diawali 08, total 10 sampai 13     Nomor WhatsApp harus
    WhatsApp                      angka. Awalan 62 menjadi 0.        diawali 08 dan 10 sampai 13
                                  Unik: satu nomor satu akun         angka. / Nomor ini sudah
                                                                     terdaftar, silakan masuk.

    Tanggal lahir         Ya      Tanggal yang valid. Usia           Tanggal lahir belum valid.
                                  dihitung dari sini. Di bawah
                                  batas usia: layar penolakan,
                                  isian dibuang

    Area kos              Ya      Dipilih dari daftar area           Pilih area kosmu.
                                  (master data)

    PIN 4 angka           Ya      4 angka. Usulan: tolak PIN         PIN harus 4 angka dan tidak
    (opsi PIN)                    yang semua angkanya sama           boleh mudah ditebak.
                                  atau berurutan

    Kode OTP (opsi        Ya      6 angka dikirim ke WhatsApp,       Kode salah atau sudah habis.
    OTP)                          berlaku beberapa menit             Kirim ulang kode.
                                  (angka ditetapkan Masnun),
                                  bisa dikirim ulang

    Persetujuan           Ya      Layar terpisah, lihat bagian 11.   Baca sampai bawah dulu untuk
                                  Tombol Lanjut aktif setelah        melanjutkan.
                                  teks digulir sampai dasar

    Masuk (peserta        Ya      Nomor WhatsApp dan PIN             Nomor atau PIN belum cocok.
    lama)                         atau OTP. Lupa PIN: admin          Lupa PIN? Hubungi admin.
                                  membuat PIN sementara

  Peserta: klaim dan hadiah

                                                                                                  Page 21 of 48

---

PRD Webapp Lotre Warung

    Form                  Kapan muncul             Isian                  Aturan dan pesan
                                                                          error

    Foto bungkus          Setelah masuk, tiap      Satu foto langsung     Dari kamera langsung,
                          klaim                    dari kamera, tanpa     dengan watermark
                                                   pilihan galeri         waktu, id titik, dan
                                                                          kode klaim. Ukuran
                                                                          maksimum ditetapkan
                                                                          Masnun. Izin kamera
                                                                          ditolak: tampil
                                                                          panduan
                                                                          mengaktifkan izin.
                                                                          Foto belum terbaca,
                                                                          coba ambil ulang.

    Kode slot             Setelah slot ditunjuk    Kode 6 karakter di     Otomatis huruf besar,
                                                   balik slot             spasi dan strip
                                                                          diabaikan. Pesan error
                                                                          mengikuti aturan
                                                                          bagian 18.

    Nomor tujuan          Hanya jika hadiah        Nomor meter atau ID    Hanya angka, panjang
    token listrik         berjenis token listrik   pelanggan PLN, diisi   dipastikan Masnun
                                                   dua kali               bersama agregator.
                                                                          Kedua isian harus
                                                                          sama. Layar ringkasan
                                                                          sebelum dikirim: jenis,
                                                                          nilai, nomor.

    Nomor HP              Hanya jika hadiah        Nomor HP, diisi dua    Format 08xx, 10
    tujuan pulsa          berjenis pulsa atau      kali. Tombol Pakai     sampai 13 angka.
    atau kuota            kuota                    nomor WhatsApp         Kedua isian harus
                                                   saya                   sama.

    Alamat                Hanya jika hadiah        Nama penerima (awal    Area harus ada di
    pengiriman            merchandise atau         dari nama), area       daftar area
                          limited edition          (daftar), alamat       pengiriman. Alamat 10
                                                   lengkap dan patokan,   sampai 200 karakter.
                                                   catatan untuk          Di luar area: Hadiah
                                                   pengantar (opsional)   hanya diantar di area
                                                                          yang tersedia.

                                                                                              Page 22 of 48

---

PRD Webapp Lotre Warung

    Form                  Kapan muncul               Isian                   Aturan dan pesan
                                                                             error

    Bensin tunai          Tidak ada form             Peserta hanya melihat   Admin mencatat
                                                     info bahwa admin        serah terima di panel,
                                                     akan menghubungi        bukan peserta
                                                     lewat WhatsApp

  Mitra dan admin

    Form                  Pengguna       Isian                          Aturan

    Login mitra           Mitra          PIN mitra                      Percobaan salah dibatasi,
                                                                        lihat bagian 19

    Cek dan tukar         Mitra          Kode voucher                   Hasil: valid, sudah ditukar,
    kode                                                                kadaluarsa, atau bukan
                                                                        milik mitra ini. Tukar hanya
                                                                        sekali

    Selesai top up        Mitra          Tombol pada permintaan         Mengubah status
                          kuota          nomor HP                       permintaan menjadi selesai

    Setujui atau          Admin          Alasan penolakan (wajib,       Keputusan bisa diurungkan
    tolak klaim                          dari daftar) dan catatan       selama hadiah belum
                                                                        diproses

    Token listrik         Admin          Nomor referensi dari           Status menjadi terkirim,
    berhasil                             agregator (wajib), catatan     peserta melihatnya

    Token listrik         Admin          Alasan (wajib): nomor tidak    Menambah hitungan gagal.
    gagal                                valid atau ditolak agregator   Setelah 3 kali: perlu
                                                                        bantuan admin

    Serah terima          Admin          Tanggal, nama penerima,        Status menjadi diserahkan.
    bensin tunai                         catatan                        Usulan: foto bukti opsional

    Pengiriman            Admin          Tanggal kirim, catatan         Status menjadi diantar, lalu
    hadiah fisik                                                        selesai

    Pengaturan            Admin          Parameter di bagian 3          Perubahan tercatat di log

                                                                                                Page 23 of 48

---

PRD Webapp Lotre Warung

  15. Requirement fungsional
  Ada 35 requirement. Prioritas Wajib berarti harus berfungsi sebelum papan dipasang di 20
  titik. Boleh menyusul berarti bisa selesai setelah uji coba terbatas. Kolom kriteria
  menyatakan kapan requirement dianggap selesai dan bisa diuji.

    Kode         Requirement                      Prioritas   Dianggap selesai bila

    FR-01        Peserta daftar dengan nama,      Wajib       Akun terbentuk. Nomor
                 WhatsApp, tanggal lahir, area                WhatsApp yang sama tidak bisa
                 kos, dan PIN atau OTP                        mendaftar dua kali

    FR-          Peserta lama masuk dengan        Wajib       Masuk berhasil dari HP mana
    02           nomor WhatsApp dan PIN atau                  pun. Percobaan salah dibatasi
                 OTP

    FR-          Pendaftar di bawah batas usia    Wajib       Tidak ada data pribadi
    03           ditolak                                      tersimpan. Hanya alasan dan
                                                              titik tercatat di rejects

    FR-          Layar persetujuan dengan teks    Wajib       Versi teks, waktu, dan pilihan
    04           panjang. Tombol Lanjut aktif                 peserta tersimpan. Versi teks
                 setelah teks digulir sampai                  baru meminta persetujuan ulang
                 dasar

    FR-          Lupa PIN: admin membuat PIN      Wajib       Peserta bisa masuk dengan PIN
    05           sementara (hanya jika opsi PIN               sementara lalu mengganti PIN
                 dipilih)

    FR-          Titik dibaca dari alamat QR,     Wajib       Peserta tidak mengisi lokasi. QR
    06           misalnya /w07                                yang tidak dikenal menampilkan
                                                              pesan

    FR-          Peserta mengunggah foto          Wajib       Nilai dihitung ulang di server,
    07           bungkus. Server menghitung                   bukan dipercaya dari HP
                 hash visual dan kecerahan

    FR-          Batas klaim harian dicek         Wajib       Klaim ke-3 pada hari yang sama
    08           sebelum slot ditunjuk                        ditolak. Klaim yang ditolak tidak
                                                              dihitung

                                                                                            Page 24 of 48

---

PRD Webapp Lotre Warung

    Kode         Requirement                        Prioritas   Dianggap selesai bila

    FR-          Sistem menunjuk satu slot          Wajib       Dua peserta yang mengklaim
    09           kosong secara acak dari papan                  bersamaan tidak mendapat slot
                 titik itu, dan menahannya untuk                yang sama. Lihat bagian 18
                 peserta tersebut (penahanan:
                 usulan)

    FR-10        Peserta memasukkan kode unik       Wajib       Kode salah, sudah dipakai, atau
                 slot. Sistem menjalankan                       milik papan lain ditolak dengan
                 pemeriksaan bagian 18                          pesan yang tepat

    FR-11        Klaim bertanda masuk antrean       Wajib       Enam jenis tanda bekerja. Cap
                 admin. Klaim tanpa tanda                       tidak bertambah untuk klaim
                 disetujui otomatis. Cap                        antre atau ditolak
                 bertambah saat disetujui

    FR-12        Setiap penolakan dicatat           Wajib       Satu baris per penolakan: alasan
                                                                dan titik, tanpa identitas

    FR-13        Klaim disetujui membentuk          Wajib       Hadiah terhubung ke klaim dan
                 hadiah sesuai isi slot                         peserta. Tidak ada hadiah ganda
                                                                untuk satu klaim

    FR-14        Voucher mitra: kode unik, masa     Wajib       Kode hanya bisa ditukar sekali.
                 berlaku, admin kirim lewat                     Voucher lewat masa berlaku
                 wa.me, mitra menukar                           otomatis kadaluarsa

    FR-15        Pulsa dan kuota lewat mitra        Wajib       Permintaan muncul di akun mitra
                 kuota: peserta isi nomor HP,                   kuota hanya dengan nomor dan
                 mitra top up lalu menandai                     nilai. Masuk rekap mingguan
                 selesai                                        seperti voucher mitra lain

    FR-16        Token listrik: peserta isi nomor   Wajib       Maksimal 3 kali gagal, setelah itu
                 tujuan, admin memproses                        status Perlu bantuan admin.
                 manual ke agregator, lalu                      Berhasil menyimpan nomor
                 menandai berhasil atau gagal                   referensi

    FR-17        Bensin tunai: admin                Wajib       Status menunggu, dihubungi,
                 menghubungi peserta lewat                      diserahkan. Tanggal dan
                 WhatsApp, mengatur                             penerima tercatat
                 pertemuan, mencatat serah
                 terima

                                                                                             Page 25 of 48

---

PRD Webapp Lotre Warung

    Kode         Requirement                         Prioritas   Dianggap selesai bila

    FR-18        Merchandise dan limited             Wajib       Alamat di luar daftar area
                 edition: peserta mengisi alamat                 ditolak. Status menunggu
                 di area pengiriman, admin                       alamat, siap kirim, diantar,
                 mengirim sendiri                                selesai

    FR-19        Mystery gift pada cap ke-5:         Wajib       Hanya sekali per peserta.
                 voucher atau 1 bungkus gratis                   Peluang bisa diubah tanpa ubah
                 sesuai peluang di pengaturan                    kode

    FR-          Halaman Hadiahku                    Wajib       Status berubah segera setelah
    20           menampilkan semua hadiah                        admin atau mitra memprosesnya
                 peserta dan status tiap hadiah

    FR-21        Peringkat mingguan dan total        Boleh       Urutan: cap terbanyak, lalu yang
                 dari klaim berstatus disetujui      menyusul    lebih dulu mencapai jumlah itu

    FR-          Mitra login, cek kode, dan          Wajib       Hasil cek: valid, sudah ditukar,
    22           menandai ditukar                                kadaluarsa, atau bukan milik
                                                                 mitra ini

    FR-          Rekap mingguan per mitra            Wajib       Angka rekap sama dengan
    23           (Senin sampai Minggu): jumlah                   voucher berstatus ditukar.
                 dan nilai voucher ditukar. Admin                Ekspor CSV tersedia
                 menandai dibayar

    FR-          Antrean foto admin: lihat foto      Wajib       Urungkan hanya selama hadiah
    24           dan alasan tanda, setujui, tolak,               belum diproses
                 urungkan

    FR-          Antrean Pemenuhan admin             Wajib       Tiap tab menampilkan item
    25           dengan tiga tab: token listrik,                 menunggu, data yang
                 bensin tunai, merchandise dan                   dibutuhkan, dan aksi sesuai jenis
                 limited edition

    FR-          Admin mencari peserta, melihat      Wajib       Nomor WhatsApp tampil
    26           riwayat klaim, dan membuat PIN                  tersamar kecuali pada layar yang
                 sementara                                       butuh menghubungi

    FR-          Peta papan 5×5 per titik dan        Wajib       Status slot kosong, ditahan,
    27           sisa stok hadiah per jenis                      terpakai tampil benar

    FR-          Pengaturan parameter bagian 3       Wajib       Perubahan berlaku tanpa deploy
    28                                                           ulang dan tercatat di log

                                                                                                Page 26 of 48

---

PRD Webapp Lotre Warung

    Kode         Requirement                        Prioritas   Dianggap selesai bila

    FR-          Tombol darurat: jeda seluruh       Wajib       Peserta melihat halaman sedang
    29           program atau satu titik                        dijeda. Klaim yang sedang
                                                                berjalan tidak hilang. Bisa
                                                                dilanjutkan

    FR-          Master data: titik, area, mitra,   Wajib       Jenis voucher menyimpan nilai,
    30           jenis voucher, akun admin                      masa berlaku, jenis pemenuhan,
                                                                dan isian tujuan

    FR-31        Log semua aksi sistem dan          Wajib       Setiap perubahan status
                 admin                                          tercatat dengan waktu dan
                                                                pelaku

    FR-          Ekspor CSV: peserta, klaim,        Wajib       Hanya admin yang bisa
    32           voucher, hadiah, rekap mitra,                  mengekspor. Kolom ditetapkan
                 peringkat                                      di bagian 20

    FR-          Ringkasan harian admin: klaim      Boleh       Angka sama dengan data klaim
    33           per hari, jumlah antrean, sisa     menyusul    dan papan
                 slot

    FR-          Generator papan: membuat 20        Wajib       Total 277 voucher, 143
    34           papan, slot, dan kode unik                     merchandise, 80 limited edition.
                 sesuai skema B                                 Tidak ada kode ganda. Ada
                                                                daftar cetak kode

    FR-          Foto hanya dari kamera             Wajib       Tidak ada pilihan galeri. Foto
    35           langsung, dengan watermark                     yang diterima memuat
                 waktu server, id titik, dan kode               watermark. Selisih waktu
                 klaim                                          watermark dan waktu terima di
                                                                server yang melewati batas
                                                                diberi tanda

  16. Model data
  Sistem memerlukan 14 entitas, ditambah akun admin yang disimpan terpisah, dan yang
  menentukan adalah hubungan klaim, slot, voucher, dan hadiah. Nama mengikuti prototipe
  supaya mudah dibandingkan. Masnun boleh memakai tabel relasional atau dokumen,
  selama isi dan aturan kuncinya terpenuhi.

                                                                                            Page 27 of 48

---

PRD Webapp Lotre Warung

    Entitas               Isi utama                       Kunci            Catatan

    settings              Parameter bagian 3              Satu dokumen     Perubahan masuk log

    titik                 Nama warung, area, status       Id titik, mis.   20 baris. Dibaca dari QR
                          (aktif atau dijeda)             W07

    areas                 Nama area, apakah               Nama area        Dipakai di form daftar dan
                          termasuk area pengiriman                         alamat

    mitra                 Nama, jenis usaha, awalan       Id mitra         Tipe kuota melihat antrean
                          kode, PIN (hash), tipe                           nomor HP
                          (biasa atau kuota), status

    jenis_voucher         Nama, nilai, masa berlaku       Id jenis         Jenis pemenuhan: mitra,
                          (hari), mitra, jenis                             mitra_nomor, agregator,
                          pemenuhan, isian tujuan                          tunai. Isian tujuan: tidak
                                                                           ada, hp, meter

    boards                Per titik: 25 slot. Tiap slot   Id titik         Dibuat generator sekali.
                          punya posisi, kode unik,                         Tidak ada refill
                          jenis hadiah, status
                          (kosong, ditahan, terpakai),
                          pengambil, waktu

    people                Nama, WhatsApp, tanggal         Nomor            Satu nomor satu akun
                          lahir, area kos, kredensial     WhatsApp
                          (hash), waktu daftar

    consents              Nomor WhatsApp, versi           Nomor dan        Bukti persetujuan
                          teks, waktu, persetujuan        versi
                          wajib, persetujuan opsional

    claims                Peserta, titik, slot, kode,     Id klaim         Hash dan kecerahan
                          foto (hash, kecerahan,                           dihitung di server
                          thumbnail atau berkas),
                          tanda, status (antre,
                          disetujui, ditolak), waktu

    vouchers              Kode, klaim, jenis, status,     Kode voucher     Status mengikuti jenis
                          nomor tujuan, jumlah gagal,                      pemenuhan, bagian 17
                          kadaluarsa, waktu kirim
                          dan proses, nomor
                          referensi

                                                                                                    Page 28 of 48

---

PRD Webapp Lotre Warung

    Entitas               Isi utama                     Kunci            Catatan

    gifts                 Klaim, jenis (merchandise,    Id hadiah        Dikirim admin sendiri
                          limited edition, bungkus
                          gratis), area dan alamat,
                          status, waktu selesai

    payouts               Mitra, awal minggu, jumlah    Mitra dan awal   Dibuat dari voucher
                          voucher, nilai, tanggal       minggu           berstatus ditukar atau
                          bayar, admin                                   selesai (kuota)

    rejects               Alasan, titik, waktu          Id berbasis      Tanpa data pribadi
                                                        waktu

    log                   Waktu, pelaku (sistem atau    Id berbasis      Hanya ditambah, tidak
                          akun admin), aksi, objek      waktu            diubah

  Akun admin disimpan terpisah (nama, kredensial hash). Hubungan intinya: satu peserta
  punya banyak klaim. Satu klaim menunjuk tepat satu slot. Satu klaim disetujui membentuk
  tepat satu voucher atau satu hadiah. Mystery gift membentuk voucher atau hadiah
  tambahan yang ditandai asalnya (mystery), tanpa klaim baru.

  Aturan kunci data

        Kode slot dan kode voucher unik di seluruh sistem.
        Satu slot hanya bisa berstatus terpakai satu kali, dan tidak pernah kembali ke kosong.
        Nomor WhatsApp peserta unik. Nomor tujuan token atau pulsa tidak dibatasi.
        Peserta yang di bawah batas usia tidak disimpan. Hanya baris rejects yang dibuat.

  17. Status dan transisi
  Tiap objek hanya boleh berpindah status lewat transisi di tabel ini, dan setiap perpindahan
  tercatat di log. Diagram di bagian 6 dan 7 menggambarkan alurnya, sedangkan tabel ini
  yang menjadi acuan pengujian.

  Slot

    Dari             Kejadian                                            Ke         Pelaku

    kosong           Slot ditunjuk ke peserta (penahanan: usulan)        ditahan    Sistem

    ditahan          Kode slot yang benar dimasukkan, klaim dibuat       terpakai   Sistem

                                                                                                 Page 29 of 48

---

PRD Webapp Lotre Warung

    Dari             Kejadian                                            Ke         Pelaku

    ditahan          Batas waktu penahanan habis atau klaim              kosong     Sistem
                     dibatalkan sebelum kode

    terpakai         Tidak ada transisi keluar                           terpakai

  Klaim

    Dari              Kejadian                                     Ke          Pelaku

    (baru)            Kode valid dan ada tanda                     antre       Sistem

    (baru)            Kode valid dan tanpa tanda                   disetujui   Sistem, otomatis

    antre             Admin menyetujui                             disetujui   Admin

    antre             Admin menolak dengan alasan                  ditolak     Admin

    disetujui         Admin mengurungkan, hadiah belum diproses    antre       Admin

    ditolak           Admin mengurungkan                           antre       Admin

  Saat klaim menjadi disetujui, cap bertambah dan hadiah terbentuk. Saat diurungkan, cap
  dan hadiah yang belum diproses dibatalkan.

  Voucher, per jenis pemenuhan

    Jenis                         Status berurutan              Cabang

    1. Mitra                      menunggu, terkirim, ditukar   terkirim menjadi kadaluarsa bila
                                                                lewat tanggal. Mitra baru bisa
                                                                memeriksa kode setelah terkirim

    2. Pulsa atau kuota           menunggu data, menunggu       Mitra menandai nomor tidak valid:
    lewat mitra                   proses, selesai               nomor ditolak, peserta mengisi
                                                                ulang. Setelah 3 kali: perlu bantuan
                                                                admin

    3. Token listrik lewat        menunggu data, menunggu       Admin menandai gagal: nomor
    agregator                     proses, terkirim              ditolak, peserta mengisi ulang.
                                                                Setelah 3 kali: perlu bantuan admin

                                                                                                Page 30 of 48

---

PRD Webapp Lotre Warung

    Jenis                   Status berurutan                   Cabang

    4. Bensin tunai         menunggu, dihubungi,               Admin menghubungi lewat
                            diserahkan                         WhatsApp lalu mencatat serah
                                                               terima

  Perlu bantuan admin diselesaikan manual oleh admin: menghubungi peserta lalu menandai
  terkirim atau selesai.

  Hadiah fisik

    Hadiah                            Status berurutan

    Merchandise dan limited edition   menunggu alamat, siap kirim, diantar, selesai

    Bungkus gratis (mystery gift)     menunggu, dihubungi, selesai. Cara serah
                                      diputuskan di bagian 22

  18. Validasi dan anti-curang
  Hampir semua klaim lolos otomatis, dan hanya klaim bertanda yang diperiksa admin.
  Pemeriksaan terjadi di dua saat: sebelum slot ditunjuk, dan ketika kode slot dimasukkan.
  Semuanya dijalankan di server.

  Sebelum slot ditunjuk (setelah foto diunggah)

    Pemeriksaan           Aturan                                 Jika gagal

    Program berjalan      Program dan titik ini tidak sedang     Halaman sedang dijeda
                          dijeda tombol darurat

    Batas harian          Paling banyak 2 klaim per nomor        Ditolak, coba lagi besok
                          per hari. Klaim ditolak tidak
                          dihitung

    Papan masih punya     Ada slot berstatus kosong              Ditolak, peserta diarahkan ke
    slot                                                         titik lain. Tidak ada refill

    Foto terbaca          Berkas berupa gambar. Server           Peserta diminta mengambil
                          menghitung hash visual dan             ulang
                          kecerahan

                                                                                             Page 31 of 48

---

PRD Webapp Lotre Warung

    Pemeriksaan            Aturan                               Jika gagal

    Foto langsung dan      Foto diambil lewat kamera            Peserta diminta mengambil
    bercap                 browser, bukan input berkas, lalu    ulang. Selisih besar: klaim
                           watermark digambar: jam server       bertanda
                           yang diambil saat kamera dibuka,
                           id titik, dan kode klaim. Jam HP
                           tidak dipercaya. Server mencatat
                           waktu terima dan memberi tanda
                           bila selisihnya dengan watermark
                           melewati batas di pengaturan

  Saat kode slot dimasukkan

    Pemeriksaan            Aturan                              Jika gagal

    Kode dikenal           Kode ada di salah satu papan        Ditolak, kode tidak dikenal

    Papan yang benar       Kode berasal dari papan titik       Ditolak, diarahkan ke papan titik
                           tempat peserta scan                 itu

    Belum dipakai          Slot belum pernah terpakai          Ditolak, kode sudah pernah
                                                               dipakai

    Tidak dipegang         Slot tidak berstatus ditahan        Ditolak, peserta diminta
    orang lain             untuk peserta lain                  mengambil slot yang ditunjuk

  Setiap penolakan dicatat di rejects dengan alasan dan titik, tanpa data pribadi.
  Pendaftaran punya dua pemeriksaan sendiri: format dan keunikan nomor WhatsApp (satu
  nomor satu akun), serta batas usia dari tanggal lahir.

  Enam tanda yang memasukkan klaim ke antrean admin

    Tanda                             Aturan

    Foto pertama peserta baru         Bisa dimatikan di pengaturan

    Sampel acak                       10% dari semua klaim

    Foto mirip foto lain              Hash visual 256 bit, selisih 4 bit atau kurang

    Foto gelap                        Kecerahan rata-rata di bawah 45 dari 255

                                                                                              Page 32 of 48

---

PRD Webapp Lotre Warung

    Tanda                                  Aturan

    Slot berbeda dari yang ditunjuk        Kode valid, slot kosong di papan yang sama, tetapi
                                           bukan slot yang ditunjuk

    Jeda foto ke input kode                Lebih dari 30 menit

  Slot tidak boleh terbagi dua kali

  Penunjukan slot, penahanannya, dan penandaan terpakai harus berjalan dalam satu
  transaksi yang mengunci slot. Uji penerimaannya: dua peserta di titik yang sama
  mengklaim pada detik yang sama, dan sistem hanya menunjuk atau menerima satu
  peserta untuk satu slot. Penahanan berlangsung selama durasi di pengaturan (usulan 30
  menit). Jika kode dimasukkan setelah penahanan habis dan slot masih kosong, kode
  diterima dengan tanda jeda.

  Pengaman lain

        Hash dan kecerahan foto dihitung ulang di server. Di prototipe keduanya dihitung di
        HP peserta sehingga bisa dimanipulasi.
        Kode voucher hanya bisa ditukar sekali. Perubahan ke ditukar dilakukan atomik: hanya
        berhasil bila statusnya masih terkirim.
        Tombol yang ditekan dua kali atau pengiriman ulang tidak boleh membuat klaim,
        voucher, atau cap ganda.
        Percobaan login dibatasi. PIN 4 angka hanya punya 10.000 kombinasi, jadi pembatasan
        ini wajib bila opsi PIN dipilih.
        Admin mengurungkan keputusan hanya selama hadiah belum diproses.

  19. Non-fungsional
  Beban sistem kecil, jadi yang diutamakan adalah ketepatan data, keamanan akun, dan
  kemudahan di HP. Baris bertanda usulan boleh diubah Masnun dengan alasan.

    Area                  Persyaratan

    Perangkat             Mobile first. Peserta membuka lewat scan QR di HP
                          Android atau iPhone, tanpa install. Layar sempit
                          (usulan: 360 px) harus nyaman

                                                                                                Page 33 of 48

---

PRD Webapp Lotre Warung

    Area                  Persyaratan

    Beban                 Sekitar 500 klaim dan 400 peserta unik selama
                          program. Puncak terjadi saat banyak orang scan di
                          satu titik pada jam ramai. Masnun memperkirakan
                          angka puncaknya

    Kecepatan             Halaman peserta terbuka cepat di jaringan seluler
                          biasa. Foto diperkecil di HP sebelum diunggah
                          untuk menghemat kuota (usulan)

    Foto                  Disimpan sebagai thumbnail atau foto asli:
                          keputusan di bagian 22. Hash dan kecerahan
                          dihitung dari berkas yang diterima server

    Keamanan akun         HTTPS wajib. PIN disimpan sebagai hash dengan
                          algoritma kata sandi yang lambat dan bergaram,
                          misalnya bcrypt atau argon2. Hash di prototipe
                          hanya untuk demo dan tidak layak produksi.
                          Percobaan login dibatasi

    Hak akses             Mitra hanya melihat data miliknya. Mitra kuota
                          hanya melihat nomor tujuan dan nilai. Panel admin
                          hanya untuk akun admin

    Privasi data          Nomor WhatsApp tampil tersamar di daftar admin
                          (contoh 0812-••••-3456). Ekspor data hanya admin.
                          Tabel rejects tanpa data pribadi

    Tampilan peserta      Seluruh antarmuka berbahasa Indonesia. Halaman
                          peserta tidak memuat nama brand Djarum

    Konfigurasi           Parameter bagian 3 berubah tanpa deploy ulang

    Backup                Backup berkala dan uji pemulihan sebelum papan
                          dipasang. Frekuensi ditetapkan Masnun

    Log                   Semua aksi sistem dan admin tercatat dan tidak
                          bisa diubah. Error server juga dicatat

    Hosting               Hosting dan domain disediakan Si Pemburu,
                          kemungkinan berjenis shared hosting dan belum
                          dipastikan. Masnun memastikan stack cocok. Bila
                          tidak cocok, sebutkan kebutuhannya di bagian 22

                                                                              Page 34 of 48

---

PRD Webapp Lotre Warung

    Area                  Persyaratan

    Ketersediaan          Sistem harus tersedia selama jam operasional titik.
                          Bila sistem sedang bermasalah, klaim yang sudah
                          masuk tidak boleh hilang

  20. Integrasi dan laporan
  Sistem tidak terhubung otomatis ke layanan luar. WhatsApp dikirim admin lewat tautan
  wa.me, agregator diproses admin di dasbor agregator, dan laporan keluar sebagai file CSV.

  WhatsApp lewat wa.me

  Admin menekan tombol, WhatsApp terbuka dengan pesan siap pakai ke nomor peserta,
  lalu admin menekan Kirim dan menandai status. Pesan tanpa nama brand dan boleh diedit
  admin sebelum dikirim. Usulan isi:

                                                                                      Page 35 of 48

---

PRD Webapp Lotre Warung

    Kejadian                        Pesan

    Voucher mitra terkirim          Halo {nama}, ini voucher {jenis} Rp{nilai} milikmu.
                                    Kode: {kode}. Tunjukkan ke {mitra} sebelum
                                    {tanggal kadaluarsa}.

    Pulsa atau kuota selesai        Halo {nama}, voucher {jenis} sudah diisi ke nomor
                                    {nomor}.

    Token listrik berhasil          Halo {nama}, token listrik Rp{nilai} untuk nomor
                                    {nomor} sudah diproses. Referensi: {nomor
                                    referensi}.

    Nomor ditolak                   Halo {nama}, nomor {nomor} belum bisa diproses.
                                    Buka Hadiahku untuk mengisi ulang nomornya.

    Perlu bantuan admin             Halo {nama}, nomor tujuanmu belum bisa diproses
                                    setelah 3 kali. Boleh kirim nomor yang benar ke
                                    sini?

    Bensin tunai                    Halo {nama}, hadiah bensin Rp{nilai} berupa uang
                                    tunai. Kapan dan di mana kita bisa bertemu di
                                    sekitar kampus?

    Hadiah fisik diantar            Halo {nama}, hadiah {nama hadiah} sedang diantar
                                    ke alamat yang kamu isi.

  Agregator token listrik

        Belum ada agregator yang dipilih. Sistem tidak memakai API agregator pada tahap ini.
        Admin membuka dasbor agregator, memproses token, lalu mengisi nomor referensi di
        panel. Panel menyediakan tombol salin untuk jenis, nilai, dan nomor tujuan.
        Saldo agregator dikelola di luar sistem. Tidak ada peringatan saldo.
        Peserta hanya mengisi nomor tujuan. Pulsa dan kuota tidak lewat agregator, tetapi
        lewat mitra kuota.

  Ekspor CSV (hanya admin)

    File                  Isi                                          Kegunaan

    peserta               Nama, nomor WhatsApp, area kos, jumlah       Data peserta untuk laporan
                          cap, tanggal daftar

                                                                                                Page 36 of 48

---

PRD Webapp Lotre Warung

    File                  Isi                                            Kegunaan

    klaim                 Waktu, titik, area, status, tanda              Penjualan per titik dan
                                                                         pemeriksaan

    voucher               Kode, jenis, jenis pemenuhan, nilai, status,   Rekonsiliasi voucher
                          waktu kirim, proses, tukar, mitra

    hadiah                Jenis, status, area, waktu selesai             Pelacakan hadiah fisik

    rekap_mitra           Mitra, minggu, jumlah voucher, nilai,          Pembayaran mingguan
                          tanggal dibayar

    peringkat             Peringkat mingguan dan total, jumlah cap       Penentuan 10 teratas dan
                                                                         golden slot

  Bentuk laporan akhir untuk Djarum belum diputuskan. Usulannya cukup ekspor CSV di
  atas, tanpa dashboard khusus. Kolom final menunggu keputusan di bagian 22, termasuk
  data pribadi apa yang boleh keluar sesuai teks persetujuan.

  21. Rencana uji dan rilis
  Sistem diuji dengan 20 skenario di bawah ini, lalu dicoba terbatas sebelum dipasang di 20
  titik. Estimasi lama pengerjaan diisi Masnun per bagian dokumen ini.

  Skenario uji

    No         Skenario                                Hasil yang diharapkan               Requirement

    1          Dua peserta mengklaim                   Tidak ada slot yang sama untuk      FR-09
               bersamaan di satu titik                 keduanya

    2          Peserta mengklaim ke-3 kali             Ditolak, tidak dihitung             FR-08
               dalam sehari

    3          Kode slot yang sama dimasukkan          Yang kedua ditolak: sudah           FR-10
               dua kali                                dipakai

    4          Foto yang sama dipakai dua              Klaim kedua bertanda mirip dan      FR-11
               klaim                                   masuk antrean

    5          Foto gelap                              Masuk antrean dengan tanda          FR-11
                                                       foto gelap

                                                                                                    Page 37 of 48

---

PRD Webapp Lotre Warung

    No         Skenario                              Hasil yang diharapkan                 Requirement

    6          Pendaftar di bawah batas usia         Ditolak, hanya baris rejects          FR-03
                                                     tercatat

    7          Peserta mengambil slot lain dari      Diterima dengan tanda. Ditolak        FR-10
               yang ditunjuk                         bila slot itu dipegang peserta lain

    8          Voucher mitra ditukar dua kali        Penukaran kedua gagal                 FR-14

    9          Voucher mitra lewat masa              Berstatus kadaluarsa, tidak bisa      FR-14
               berlaku                               ditukar

    10         Pulsa atau kuota: nomor ditandai      Status perlu bantuan admin            FR-15
               tidak valid 3 kali

    11         Token listrik ditandai gagal 3 kali   Status perlu bantuan admin            FR-16

    12         Bensin tunai dari hadiah sampai       Tiap status dan tanggal tercatat      FR-17
               serah terima

    13         Alamat di luar area pengiriman        Ditolak dengan pesan area             FR-18

    14         Peserta mencapai cap ke-5             Mystery gift terbentuk sekali         FR-19
                                                     saja

    15         Admin mengurungkan klaim              Cap dan hadiah belum diproses         FR-24
               yang sudah disetujui                  dibatalkan

    16         Tombol darurat ditekan untuk          Peserta melihat halaman dijeda.       FR-29
               satu titik                            Klaim berjalan tidak hilang

    17         Layar persetujuan                     Lanjut nonaktif sampai gulir          FR-04
                                                     dasar. Versi dan waktu tersimpan

    18         Rekap mingguan mitra                  Jumlah dan nilai sama dengan          FR-23
                                                     voucher ditukar

    19         Login salah berulang                  Percobaan dibatasi                    FR-02

    20         Generator papan dijalankan            277 voucher, 143 merchandise, 80      FR-34
                                                     limited edition, tanpa kode ganda

  Tahap rilis

     1. Uji internal dengan seluruh skenario di atas memakai data uji.

                                                                                                   Page 38 of 48

---

PRD Webapp Lotre Warung

     2. Uji coba terbatas di satu atau dua titik (usulan) dengan papan uji dan peserta dari tim.
        Data uji dibersihkan sesudahnya.
     3. Pemasangan di 20 titik: generator papan dijalankan dengan data produksi, kode
        dicetak, dan QR tiap titik diuji scan.

  Daftar periksa sebelum papan dipasang

        Data demo dihapus. Database produksi hanya berisi master data.
        20 QR titik diuji scan dan membuka titik yang benar.
        Akun admin dan akun mitra dibuat, PIN mitra sudah dibagikan.
        Teks persetujuan versi final terpasang.
        Parameter di bagian 3 diperiksa satu per satu.
        Tombol darurat diuji.
        Backup diuji dengan pemulihan.
        Penjaga sistem selama program ditetapkan.

  22. Keputusan terbuka
  Ada 23 keputusan yang belum final. Enam di antaranya dijawab Masnun, sisanya dijawab Si
  Pemburu. Kolom Jawaban diisi saat rapat, dan jawaban itu menjadi keputusan resmi yang
  memperbarui bagian terkait.

                                                                                          Page 39 of 48

---

PRD Webapp Lotre Warung

    No         Keputusan                 Opsi atau usulan               Penjawab       Jawaban

    1          Verifikasi akun peserta   Opsi A, OTP WhatsApp:          Masnun, lalu
                                         kode 6 angka lewat             Si Pemburu
                                         WhatsApp, membuktikan
                                         nomor milik peserta, tanpa
                                         PIN dan tanpa lupa PIN,
                                         tetapi perlu penyedia
                                         pengiriman dan ada biaya
                                         per pesan. Opsi B, PIN 4
                                         angka: tanpa biaya,
                                         sederhana, tetapi nomor
                                         tidak terbukti milik peserta
                                         dan perlu pembatasan
                                         percobaan serta reset oleh
                                         admin. Masnun memberi
                                         estimasi biaya dan pekerjaan
                                         kedua opsi

    2          Batas usia pendaftar      21 tahun di prototipe, belum   Si Pemburu
                                         dikonfirmasi

    3          Stack dan hosting         Masnun memastikan stack        Masnun
                                         cocok dengan hosting yang
                                         disediakan, atau menyebut
                                         kebutuhan lain

    4          Penyimpanan foto          Prototipe menyimpan            Masnun dan
                                         thumbnail 240×180. Usulan:     Si Pemburu
                                         versi terkompresi yang
                                         masih terbaca untuk admin,
                                         bukan hanya thumbnail

    5          Agregator token listrik   Belum dipilih. Format nomor    Si Pemburu
                                         tujuan mengikuti agregator

                                                                                          Page 40 of 48

---

PRD Webapp Lotre Warung

    No         Keputusan                 Opsi atau usulan               Penjawab     Jawaban

    6          Cara token listrik        Usulan: peserta mengisi        Si Pemburu
               diproses                  nomor meter atau ID
                                         pelanggan PLN dan admin
                                         memproses ke agregator.
                                         Alternatif: lewat warung
                                         mitra penjual token tanpa
                                         agregator

    7          Arti 3 kali salah nomor   Usulan: salah berarti admin    Si Pemburu
               tujuan                    atau mitra kuota menandai
                                         nomor tidak valid. Setelah 3
                                         kali: perlu bantuan admin
                                         yang menghubungi peserta

    8          Daftar area pengiriman    Usulan: daftar area yang       Si Pemburu
                                         ditetapkan admin, bukan
                                         radius. Prototipe memakai
                                         Sukabirus, Sukapura, PGA

    9          Mystery gift              Peluang voucher: 50%           Si Pemburu
                                         (usulan) atau 70%
                                         (prototipe). Jenis voucher:
                                         acak dari semua jenis
                                         (usulan) atau hanya voucher
                                         mitra

    10         Bungkus gratis dari       Diambil di titik (prototipe)   Si Pemburu
               mystery gift              atau diantar seperti hadiah
                                         fisik lain

    11         Penahanan slot yang       Usulan: ditahan selama         Masnun
               ditunjuk                  durasi di pengaturan.
                                         Alternatif: tidak ditahan,
                                         siapa yang memasukkan
                                         kode lebih dulu menang

    12         Bentuk laporan untuk      Usulan: ekspor CSV bagian      Si Pemburu
               Djarum                    20, tanpa dashboard.
                                         Tentukan juga data pribadi
                                         apa yang boleh keluar

                                                                                        Page 41 of 48

---

PRD Webapp Lotre Warung

    No         Keputusan              Opsi atau usulan                Penjawab     Jawaban

    13         Teks persetujuan       Isi final, cara menyebut        Si Pemburu
                                      penerima data tanpa nama
                                      brand, dan jangka waktu
                                      penyimpanan data yang
                                      dinyatakan di teks.
                                      Sebaiknya ditinjau pihak
                                      yang berwenang

    14         Akun admin             Jumlah akun dan apakah ada      Si Pemburu
                                      peran terbatas. Usulan:
                                      semua akun akses penuh
                                      dan setiap aksi tercatat atas
                                      nama akun

    15         Bensin tunai           Batas area pertemuan dan        Si Pemburu
                                      bukti serah terima (foto atau
                                      catatan saja)

    16         Estimasi dan serah     Lama pengerjaan tiap            Masnun
               terima                 bagian, uji coba terbatas,
                                      serah terima kode sumber
                                      dan backup, siapa yang
                                      menjaga sistem selama
                                      program

    17         Nilai voucher warung   Daftar terbaru menulis 53       Si Pemburu
                                      voucher warung bernilai
                                      20.000. Daftar sebelumnya
                                      memecahnya menjadi
                                      fotocopy dan print 9 voucher
                                      dan cemilan warung 44
                                      voucher, masing-masing
                                      10.000. Mana yang berlaku?
                                      PRD mengikuti daftar
                                      terbaru

                                                                                      Page 42 of 48

---

PRD Webapp Lotre Warung

    No         Keputusan              Opsi atau usulan                Penjawab     Jawaban

    18         Outlet sebagai mitra   Voucher warung (53) dan         Si Pemburu
                                      galon (19) ditukar di 20
                                      outlet. Apakah tiap outlet
                                      punya akun mitra, apakah
                                      voucher berlaku di semua
                                      outlet atau hanya titik
                                      tempat klaim, dan apakah
                                      outlet dibayar lewat rekap
                                      mingguan yang sama.
                                      Usulan: akun mitra per
                                      outlet, berlaku di semua
                                      outlet, dibayar mingguan

    19         Penyedia pulsa atau    Daftar terbaru menulis          Si Pemburu
               kuota                  Agregator untuk kuota
                                      50.000, sedangkan
                                      keputusan sebelumnya
                                      adalah warung penjual kuota
                                      dengan skema mitra. PRD
                                      mengikuti keputusan
                                      sebelumnya. Jika ternyata
                                      agregator, jalur kuota ikut
                                      jalur token listrik (diproses
                                      admin)

    20         Nama 20 warung         Susunan sudah pasti 20          Si Pemburu
                                      warung tanpa venue:
                                      Sukabirus 7, Sukapura 7,
                                      PGA 3, WDP 3 (Queen Coffe
                                      and Food, B MART di
                                      Komplek PBB sebagai
                                      pengganti WDP 1, dan satu
                                      yang belum bernama). Yang
                                      belum final: nama warung
                                      WDP terakhir, apakah B
                                      MART tetap dihitung di area
                                      WDP, dan nama Toko Ciamis
                                      muncul di Sukabirus dan
                                      Sukapura (apakah dua
                                      warung berbeda?)

                                                                                      Page 43 of 48

---

PRD Webapp Lotre Warung

    No         Keputusan           Opsi atau usulan                 Penjawab     Jawaban

    21         Jeda darurat dan    Saat program dijeda, apakah      Si Pemburu
               penukaran mitra     mitra tetap boleh menukar
                                   voucher yang sudah
                                   terkirim. Usulan: tetap boleh,
                                   kecuali admin menghubungi
                                   mitra untuk
                                   menghentikannya (bagian 9)

    22         Area kos dan area   Daftar jalan di Lampiran         Si Pemburu
               pengiriman          berbentuk jalan, sedangkan
                                   area titik berbentuk wilayah,
                                   dan keduanya saling
                                   tumpang tindih (Sukabirus,
                                   Sukapura). Perlu satu daftar
                                   final untuk pilihan area di
                                   form daftar dan untuk batas
                                   antar merchandise. Jalan
                                   Raya Dayeuhkolot
                                   kemungkinan terlalu jauh
                                   dari kampus untuk diantar.
                                   Usulan: pakai daftar jalan,
                                   area titik hanya untuk
                                   laporan

                                                                                    Page 44 of 48

---

PRD Webapp Lotre Warung

    No         Keputusan                   Opsi atau usulan                Penjawab     Jawaban

    23         Foto langsung dan           Web tidak bisa menjamin 100     Masnun
               cadangan bila kamera        persen bahwa foto bukan
               gagal                       dari galeri atau dari layar,
                                           sehingga pemeriksaan hash
                                           dan sampel admin tetap
                                           berjalan. Browser di dalam
                                           aplikasi (Instagram,
                                           WhatsApp) sering
                                           memblokir kamera, jadi layar
                                           harus mengarahkan
                                           membuka di Chrome atau
                                           Safari. Usulan bila kamera
                                           tetap gagal: panduan izin
                                           kamera lalu hubungi admin,
                                           tanpa jalur galeri. Masnun
                                           mengonfirmasi cara
                                           pengambilan foto dan batas
                                           selisih waktu watermark

  23. Lampiran
  A. Daftar voucher skema B

  Skema B memuat 15 jenis voucher dengan total 277, mengikuti daftar terbaru dari Si
  Pemburu (13 November 2026). Per jenis pemenuhan: 209 voucher mitra, 10 pulsa atau
  kuota lewat mitra, 31 token listrik, 27 bensin tunai. Jenis dengan jumlah 0 (kuota 75.000,
  Spotify 60.000, Netflix 65.000) tidak masuk papan. Voucher warung dan galon ditukar di
  20 outlet, jadi setiap outlet juga berperan sebagai mitra (keputusan 18 di bagian 22). Nama
  mitra di tabel diisi ke master data.

    Voucher                Mitra                       Nilai      Jumlah    Jenis pemenuhan
                                                       (Rp)

    Voucher                Outlet (20 titik)           20.000     53        1. Mitra
    warung

    Steam motor            Jaya Steam                  20.000     19        1. Mitra

                                                                                              Page 45 of 48

---

PRD Webapp Lotre Warung

    Voucher               Mitra                    Nilai    Jumlah   Jenis pemenuhan
                                                   (Rp)

    Makan dan             ADD & Warpeng            25.000   34       1. Mitra
    minum

    Galon                 Outlet (20 titik)        25.000   19       1. Mitra

    Kopi                  Groei                    30.000   26       1. Mitra

    Warnet                Khronos Warnet           35.000   18       1. Mitra

    Makan dan             Warmul Sukpur & Sukbir   35.000   15       1. Mitra
    minum

    Laundry               Seven Sukbir & Sukpur    40.000   17       1. Mitra

    Rental PS             Playora Rental PS        47.000   5        1. Mitra

    Barbershop            AD Barbershop            55.000   3        1. Mitra

    Kuota internet        Mitra kuota (belum       50.000   10       2. Pulsa atau kuota
                          ditetapkan)                                lewat mitra

    Token listrik         Agregator (belum         20.000   23       3. Token listrik lewat
                          dipilih)                                   agregator

    Token listrik         Agregator (belum         50.000   8        3. Token listrik lewat
                          dipilih)                                   agregator

    Bensin motor          Tunai oleh admin         30.000   19       4. Bensin tunai

    Bensin motor          Tunai oleh admin         40.000   8        4. Bensin tunai

    Total                                                   277

  Daftar awal area kos dan area pengiriman

  Dari Si Pemburu, belum diverifikasi. Dipakai sebagai isi awal master data areas, di samping
  area titik (Sukabirus, Sukapura, PGA, WDP). Admin bisa menambah atau menghapus area
  tanpa ubah kode.

        Jalan Sukabirus
        Jalan Sukapura
        Jalan Telekomunikasi
        Jalan Raya Bojongsoang

                                                                                           Page 46 of 48

---

PRD Webapp Lotre Warung

        Jalan Ciganitri
        Jalan Terusan Buah Batu
        Jalan Mangga Dua
        Jalan Haji Umayah (termasuk H. Umayah I dan II)
        Jalan Babakan Ciamis
        Jalan Haji Umar
        Jalan Raya Dayeuhkolot

  B. Glosarium

    Istilah               Arti

    Titik                 Satu lokasi pemasangan papan, yaitu satu warung.
                          Ada 20

    Papan                 Papan hadiah di satu titik, berisi 25 slot

    Slot                  Satu posisi di papan (A1 sampai E5) dengan kode
                          unik dan hadiah di baliknya

    Klaim                 Satu pembelian bungkus yang difoto dan dicatat
                          peserta

    Cap                   Satu poin di kartu loyalti. Satu klaim disetujui sama
                          dengan satu cap

    Mystery gift          Hadiah kejutan di cap ke-5: voucher atau 1 bungkus
                          gratis

    Golden slot           Hadiah Laga Kosan untuk 4 peringkat teratas

    Mitra                 Usaha penerima voucher dari peserta

    Mitra kuota           Mitra penjual pulsa dan kuota yang menerima
                          permintaan nomor HP

    Agregator             Layanan penyedia token listrik yang diproses
                          admin secara manual

    Pemenuhan             Cara hadiah sampai ke peserta. Voucher punya
                          empat jenis pemenuhan

    Tanda                 Alasan sebuah klaim masuk antrean admin

                                                                                  Page 47 of 48

---

PRD Webapp Lotre Warung

    Istilah               Arti

    Penahanan             Slot yang sudah ditunjuk dan tidak ditawarkan ke
                          peserta lain untuk sementara

  C. Rujukan

        Prototipe interaktif untuk melihat alur layar peserta, mitra, dan admin. Prototipe
        belum diperbarui: masih ada refill, batas harian 3, dan isi papan lama. Ikuti dokumen ini
        bila berbeda. Tautan ini perlu dibagikan dulu ke Masnun.
        Deck briefing webapp untuk gambaran awal sistem. Juga perlu dibagikan dulu.

                                                                                           Page 48 of 48

---

---

## BAGIAN B — PRD TEKNIS ARSITEKTUR DAN STRUKTUR KODE

# PRD TEKNIS — ARSITEKTUR DAN STRUKTUR PENGEMBANGAN WEBAPP LOTRE WARUNG

**Versi:** 1.0  
**Status:** Draft teknis  
**Stack:** Laravel + React + TypeScript (TSX) + Inertia.js + Tailwind CSS + MySQL/InnoDB  
**Target deployment:** Shared Hosting yang memenuhi persyaratan runtime Laravel

## 1. Tujuan Dokumen

Dokumen ini menjadi panduan implementasi teknis untuk Agentic AI dan developer. Dokumen PRD bisnis dan addendum fraud prevention di bagian sebelumnya tetap menjadi sumber kebenaran untuk alur bisnis, aturan hadiah, klaim, voucher, dan kebijakan fraud. Dokumen ini mengatur cara mengimplementasikannya dalam struktur kode.

## 2. Keputusan Arsitektur Wajib

### 2.1 Laravel monolith + Inertia.js — bukan API backend

Aplikasi harus dibangun sebagai **Laravel monolith dengan Inertia.js**. Laravel menangani routing web, session, autentikasi, otorisasi, validasi, business logic, database, dan rendering halaman Inertia. React TSX menjadi lapisan UI.

- Gunakan route web Laravel di `routes/web.php` dan file route web yang dipisah berdasarkan area fitur.
- Controller mengembalikan halaman menggunakan `Inertia::render(...)` dan redirect menggunakan mekanisme Laravel/Inertia.
- Interaksi form dan navigasi React menggunakan `@inertiajs/react` (`router`, `Link`, `useForm`, `usePage`).
- Autentikasi utama menggunakan session/cookie Laravel, bukan token API.
- Jangan membangun REST API, JSON API, Laravel Sanctum API, API token, atau endpoint `/api/*` untuk kebutuhan internal aplikasi ini.
- Jangan membuat `routes/api.php`, `ApiController`, `api/` service layer, atau frontend Axios API client sebagai pola komunikasi utama.
- Response JSON hanya boleh digunakan jika ada kebutuhan teknis khusus yang memang bukan alur halaman utama; kebutuhan tersebut harus disetujui terlebih dahulu dan tidak boleh mengubah arsitektur utama menjadi API.

### 2.2 Satu aplikasi dan satu deployment

Laravel menyajikan halaman dan asset hasil build React. Tidak diperlukan server Node/React terpisah di production. Node/npm digunakan saat development dan build asset. Production menjalankan PHP/Laravel dan MySQL.

### 2.3 Modular monolith

Pisahkan kode berdasarkan domain/fitur, tetapi tetap dalam satu aplikasi Laravel. Jangan membuat microservices. Jangan menambahkan repository pattern untuk semua model secara otomatis; gunakan hanya jika ada kebutuhan query abstraction yang nyata.

## 3. Teknologi

| Area | Teknologi |
|---|---|
| Backend | Laravel |
| Frontend | React + TypeScript (`.tsx`) |
| Bridge server/client | Inertia.js |
| Styling | Tailwind CSS |
| Database | MySQL, engine InnoDB |
| Build tools | Vite + npm |
| Authentication | Laravel session/cookie |
| Validation | Laravel Form Request + validasi UI seperlunya |
| Testing | PHPUnit atau Pest; Vitest/React Testing Library bila diperlukan |

Gunakan versi dependency yang kompatibel satu sama lain dan kunci versinya di lockfile. Jangan mengasumsikan konfigurasi Tailwind v3 selalu berlaku; sesuaikan konfigurasi dengan versi Tailwind yang dipilih.

## 4. Struktur Folder Backend Laravel

```text
app/
├── Actions/
│   ├── Auth/
│   ├── Participant/
│   ├── Partner/
│   ├── Claim/
│   ├── Voucher/
│   └── Fraud/
├── Enums/
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   ├── Participant/
│   │   ├── Partner/
│   │   └── Admin/
│   ├── Middleware/
│   ├── Requests/
│   │   ├── Auth/
│   │   ├── Participant/
│   │   ├── Partner/
│   │   └── Admin/
│   └── Resources/
├── Jobs/
├── Models/
├── Policies/
├── Services/
│   ├── Auth/
│   ├── Claim/
│   ├── Fraud/
│   ├── Image/
│   ├── Device/
│   └── Voucher/
└── Support/

database/
├── factories/
├── migrations/
└── seeders/

routes/
├── web.php
├── auth.php
├── participant.php
├── partner.php
└── admin.php
```

### 4.1 Tanggung jawab backend

- **Controller:** menerima request web, memanggil Form Request dan Action, lalu mengembalikan Inertia page atau redirect. Controller tidak menampung business logic panjang.
- **Form Request:** validasi input dan otorisasi request tingkat request.
- **Action:** satu operasi bisnis yang jelas, misalnya `CreateParticipantAccount`, `SubmitClaim`, `AssignPrizeSlot`, `RedeemVoucher`.
- **Service:** logika reusable lintas Action, misalnya kalkulasi risiko fraud, pemrosesan foto, pembuatan perceptual hash, atau evaluasi velocity.
- **Model:** relasi dan representasi data Eloquent. Hindari menaruh alur bisnis kompleks di model.
- **Policy/Middleware:** otorisasi berbasis role dan kepemilikan data.
- **Job:** pekerjaan yang layak diproses di background, jika dukungan hosting memungkinkan. Sediakan fallback sinkron/cron bila queue worker persisten tidak tersedia.
- **Enum:** status dan tipe yang memiliki daftar nilai tetap.

### 4.2 Route web

`routes/web.php` menjadi entry point dan memuat file route per area. Semua route utama memakai middleware web/session dan middleware autentikasi/role yang sesuai.

- `auth.php`: login, logout, registrasi, dan reset PIN sesuai kebijakan.
- `participant.php`: dashboard, klaim, slot, hadiah, riwayat, dan profil peserta.
- `partner.php`: dashboard mitra, daftar voucher, riwayat penukaran, dan proses top-up bila relevan.
- `admin.php`: dashboard, peserta, mitra, outlet, klaim, fraud review, hadiah, voucher, laporan, pengaturan, dan audit log.

Nama route harus konsisten dan digunakan dari frontend melalui helper route yang dipilih. Jangan menulis URL literal berulang di banyak komponen.

## 5. Struktur Folder Frontend React TSX

```text
resources/js/
├── app.tsx
├── components/
│   ├── ui/
│   ├── forms/
│   ├── data-display/
│   ├── feedback/
│   └── navigation/
├── layouts/
│   ├── GuestLayout.tsx
│   ├── ParticipantLayout.tsx
│   ├── PartnerLayout.tsx
│   └── AdminLayout.tsx
├── pages/
│   ├── Auth/
│   ├── Participant/
│   ├── Partner/
│   └── Admin/
├── features/
│   ├── auth/
│   ├── participant/
│   ├── partner/
│   ├── claims/
│   ├── vouchers/
│   └── fraud/
├── hooks/
├── lib/
├── services/
├── types/
├── utils/
└── constants/
```

### 5.1 Batas `pages` dan `features`

- `pages/` hanya berisi entry point halaman Inertia, menyusun layout dan komponen fitur. Halaman sebaiknya tipis.
- `features/` berisi implementasi spesifik domain: komponen, hooks, helper, tipe, dan state yang hanya digunakan fitur tersebut.
- `components/` berisi komponen UI generik yang dapat digunakan lintas fitur.
- Jangan menggandakan business logic yang sama di `pages/` dan `features/`.

Contoh struktur fitur:

```text
features/claims/
├── components/
├── hooks/
├── utils/
└── types/
```

Contoh entry page:

```text
pages/Participant/Claims/Index.tsx
pages/Participant/Claims/Show.tsx
pages/Admin/Claims/Index.tsx
pages/Admin/Fraud/Review.tsx
pages/Partner/Vouchers/Index.tsx
pages/Partner/Vouchers/History.tsx
pages/Partner/Profile/Index.tsx
```

## 6. Komponen Global dan Komponen Fitur

### 6.1 Komponen global

Tempatkan komponen reusable di `components/` berdasarkan peran:

- `ui/`: Button, Input, Textarea, Select, Checkbox, RadioGroup, Badge, Card, Modal, Dialog, Dropdown, Tabs, Tooltip, Avatar, Spinner.
- `forms/`: FormField, FormLabel, FormError, SearchInput, DateRangePicker jika benar-benar dipakai lintas fitur.
- `data-display/`: DataTable, Pagination, EmptyState, StatCard, StatusBadge.
- `feedback/`: Alert, Toast, ConfirmDialog, LoadingOverlay.
- `navigation/`: Sidebar, Topbar, Breadcrumbs, NavItem.

Komponen global harus generik dan tidak mengetahui aturan bisnis Lotre Warung. Contohnya `Button` tidak boleh berisi logika persetujuan klaim.

### 6.2 Komponen khusus fitur

Simpan komponen yang memiliki aturan domain di dalam folder fitur, misalnya:

- `features/claims/components/ClaimPhotoCapture.tsx`
- `features/claims/components/ClaimStatusCard.tsx`
- `features/fraud/components/FraudRiskBadge.tsx`
- `features/fraud/components/FraudEvidencePanel.tsx`
- `features/vouchers/components/VoucherCodeCard.tsx`

Jangan memindahkan komponen khusus domain ke `components/ui` hanya agar terlihat reusable.

## 7. Fungsi Global, Hooks, Types, dan Constants

### 7.1 `utils/`

Berisi fungsi murni yang tidak bergantung pada React atau Laravel:

- `formatCurrency.ts`
- `formatDate.ts`
- `formatNumber.ts`
- `truncateText.ts`
- `fileValidation.ts`
- `debounce.ts`

Pembuatan Device ID dapat ditempatkan di util khusus browser, tetapi harus menangani browser yang tidak mendukung `crypto.randomUUID` dan kegagalan penyimpanan lokal. Device ID tetap hanya sinyal browser, bukan identitas hardware.

### 7.2 `lib/`

Berisi integrasi atau konfigurasi helper tingkat aplikasi:

- `cn.ts` untuk penggabungan class Tailwind.
- `route.ts` untuk helper named route bila memakai Ziggy atau solusi yang dipilih.
- `permissions.ts` untuk helper tampilan permission (bukan pengganti otorisasi backend).
- `browser.ts` untuk pemeriksaan kemampuan browser.

### 7.3 `hooks/`

Contoh hooks global:

- `useAuth.ts`
- `usePermission.ts`
- `useDebounce.ts`
- `useToast.ts`
- `usePagination.ts`
- `useDeviceId.ts`

Hook khusus satu fitur harus berada di `features/<feature>/hooks/`, bukan di hooks global.

### 7.4 `types/` dan `constants/`

`types/` berisi tipe lintas fitur seperti `auth.ts`, `participant.ts`, `partner.ts`, `claim.ts`, `voucher.ts`, dan `fraud.ts`. Tipe yang hanya dipakai satu fitur tetap berada di fitur tersebut.

`constants/` berisi konstanta lintas aplikasi seperti role, route name, konfigurasi UI, dan label umum. Status bisnis penting harus konsisten dengan Enum backend; jangan membuat daftar status frontend yang berbeda dari backend.

## 8. Pola Komunikasi React ke Laravel

Gunakan Inertia sebagai jembatan request-response halaman.

- Navigasi: `Link` dari `@inertiajs/react`.
- Submit: `useForm` atau `router.post/put/patch/delete`.
- Data halaman: props dari `Inertia::render`.
- Validasi: Laravel Form Request mengembalikan error yang dapat dibaca Inertia dan ditampilkan pada form.
- Session flash: gunakan untuk notifikasi sukses/gagal.
- Jangan memakai Axios/fetch ke endpoint API sebagai pola standar.

Contoh sederhana controller:

```php
use Inertia\\Inertia;
use Inertia\\Response;

public function index(): Response
{
    return Inertia::render('Participant/Dashboard/Index', [
        'summary' => $this->dashboardAction->execute(auth()->user()),
    ]);
}
```

Contoh submit di React:

```tsx
import { useForm } from '@inertiajs/react';

type ClaimForm = { photo: File | null };

export default function CreateClaim() {
  const form = useForm<ClaimForm>({ photo: null });

  function submit() {
    form.post(route('participant.claims.store'));
  }

  // Render form dan tampilkan form.errors.photo bila tersedia.
  return null;
}
```

Contoh hanya ilustrasi pola. Implementasi final harus menggunakan named route yang benar dan komponen UI proyek.

## 9. Autentikasi, Role, dan Otorisasi

- Gunakan session authentication Laravel.
- Pisahkan area Participant, Partner, dan Admin melalui middleware/Policy.
- Role dan izin selalu diperiksa di backend; menyembunyikan menu di frontend bukan kontrol keamanan.
- Mitra hanya boleh mengakses outlet dan voucher yang memang menjadi kewenangannya.
- Pembuatan akun mitra hanya melalui Admin.
- Akses peserta, mitra, dan admin tidak boleh saling bocor melalui manipulasi URL atau request.
- PIN 4 digit disimpan dalam hash, diberi rate limit, dan tidak pernah dikirim kembali ke frontend.

## 10. Implementasi Fraud Prevention

Semua keputusan fraud yang berdampak pada klaim harus dievaluasi dan dicatat di backend. Frontend hanya mengumpulkan sinyal browser dan menampilkan status/permintaan tindak lanjut.

- Device ID UUID: dibuat di browser, disimpan sebagai penanda browser, lalu divalidasi dan dicatat backend.
- Cookie/Local Storage: bukan bukti identitas dan nilainya tidak boleh dipercaya tanpa validasi backend.
- IP monitoring/rate limiting: gunakan middleware/RateLimiter Laravel. IP adalah sinyal, bukan dasar tunggal untuk memblokir semua pengguna.
- Account switching: backend mengevaluasi relasi Device ID dan akun serta menyediakan jalur penanganan perangkat bersama/pergantian perangkat yang sah.
- Perceptual Hash: pemrosesan foto dan perbandingan hash dilakukan backend; hasil kemiripan menjadi flag untuk pemeriksaan, bukan bukti fraud mutlak.
- Velocity Check: hitung frekuensi aktivitas berdasarkan jendela waktu dan entitas terkait; ambang batas configurable dan harus dikalibrasi.
- Fraud review: sediakan antrean Admin yang menampilkan alasan flag, bukti, histori, dan tindakan reviewer.
- Tidak boleh ada blacklist otomatis hanya karena peserta adalah pemilik atau pegawai warung.
- IP atau Device ID tunggal tidak boleh menyebabkan pemblokiran permanen otomatis.

## 11. Transaksi dan Konsistensi Data

Operasi yang menyentuh slot, klaim, dan voucher harus aman terhadap request bersamaan dan pengiriman ulang.

- Gunakan transaksi database MySQL/InnoDB.
- Gunakan row-level locking (`lockForUpdate`) saat memilih/mengunci slot yang tersedia.
- Pastikan constraint unik database untuk identitas/kode yang memang wajib unik.
- Assignment slot, pencatatan klaim, dan perubahan status terkait harus berada dalam satu transaksi yang konsisten.
- Redemption voucher harus atomik sehingga satu kode tidak dapat ditukarkan dua kali.
- Gunakan idempotency atau pemeriksaan status untuk mencegah double-submit menghasilkan klaim/hadiah ganda.
- Simpan audit log untuk keputusan admin, perubahan status, dan koreksi yang berdampak pada transaksi.

## 12. UI/UX dan Tailwind CSS

- Mobile-first untuk alur peserta, mulai dari lebar layar 360px.
- Area Partner dan Admin responsif untuk mobile dan desktop.
- Gunakan design token/konfigurasi warna, spacing, radius, typography, dan state secara konsisten.
- Jangan menulis class yang sama berulang tanpa alasan; gunakan komponen global untuk pola UI yang benar-benar berulang.
- Pastikan loading, empty, error, success, disabled, dan validation states tersedia.
- Aksesibilitas dasar: label input, fokus keyboard, kontras, dan pesan error yang jelas.

## 13. Testing Wajib

### Backend

- Unit test Action/Service penting.
- Feature test untuk login, role access, klaim, review fraud, penukaran voucher, dan ekspor.
- Test otorisasi agar mitra tidak dapat melihat outlet mitra lain.
- Test concurrency/transaction untuk alokasi slot dan redemption voucher.
- Test rate limit login dan pendaftaran.
- Test bahwa IP/Device ID tidak menjadi pemblokiran mutlak tanpa aturan risiko yang ditetapkan.

### Frontend

- Test komponen global yang kritis.
- Test form dan tampilan error Inertia.
- Test alur responsif untuk peserta.

### Acceptance criteria

- Tidak ada REST API yang dibangun untuk alur aplikasi utama.
- Halaman utama dirender melalui Inertia.
- Otorisasi tetap ditegakkan backend.
- Slot dan voucher tidak dapat diproses ganda pada kondisi bersamaan.
- Flag fraud dapat ditinjau Admin dengan alasan dan audit trail.
- Struktur folder konsisten dan tidak ada duplikasi business logic.

## 14. Shared Hosting dan Deployment

- Pastikan versi PHP memenuhi versi Laravel dan extension yang dibutuhkan.
- Pastikan MySQL menggunakan InnoDB.
- Pastikan HTTPS aktif.
- Pastikan direktori storage dan cache memiliki permission yang benar.
- Build React/Vite saat deployment; production menyajikan asset build dari Laravel.
- Pastikan cron tersedia untuk scheduler Laravel.
- Jika Redis atau queue worker persisten tidak tersedia, pilih database queue atau proses terjadwal yang sesuai; jangan mengandalkan worker yang tidak bisa dijalankan di hosting.
- Batasi ukuran upload foto, validasi MIME/type di server, dan optimalkan gambar.
- Uji backup dan restore database serta file bukti foto.
- Jangan menaruh `.env`, credential, atau file privat di direktori publik.

## 15. Urutan Implementasi

1. Inisialisasi Laravel, React TSX, Inertia, Tailwind, Vite, dan MySQL.
2. Siapkan autentikasi session, role, middleware, dan layout.
3. Buat migration, model, relasi, enum, factory, dan seeder.
4. Bangun modul peserta dan klaim sesuai PRD bisnis.
5. Bangun modul slot/hadiah dengan transaksi dan locking.
6. Bangun modul mitra, outlet, dan redemption voucher.
7. Bangun modul Admin, laporan, audit log, dan fraud review.
8. Implementasikan sinyal fraud di backend dan UI review.
9. Jalankan pengujian fungsional, otorisasi, concurrency, dan hosting.
10. Deploy dan verifikasi backup, cron, storage, serta asset build.

## 16. Instruksi untuk Agentic AI

Saat mengerjakan repository ini, Agentic AI wajib:

1. Membaca seluruh dokumen ini sebelum membuat perubahan.
2. Menganggap bagian PRD bisnis dan fraud prevention sebagai sumber aturan produk; jangan mengubah aturan tanpa persetujuan.
3. Mematuhi arsitektur Laravel monolith + Inertia.js. **Jangan membuat backend API atau mengubah komunikasi utama menjadi REST API.**
4. Memeriksa struktur repository yang sudah ada sebelum membuat folder/file baru.
5. Mengikuti pemisahan `pages`, `features`, `components`, `hooks`, `utils`, `lib`, `types`, dan `constants`.
6. Menempatkan business logic di Action/Service backend, bukan di Controller atau komponen React.
7. Menegakkan otorisasi di backend dan menganggap validasi frontend hanya untuk UX.
8. Menggunakan transaksi dan locking untuk operasi slot/klaim/voucher yang rawan race condition.
9. Tidak menambahkan aturan blacklist pemilik/pegawai warung.
10. Tidak menganggap IP, Device ID, cookie, atau perceptual hash sebagai bukti identitas/fraud yang mutlak.
11. Menambahkan atau memperbarui test untuk setiap perubahan business logic penting.
12. Menjelaskan file yang dibuat/diubah dan perintah test/build yang dijalankan.

## 17. Hal yang Belum Boleh Diasumsikan

Jika detail teknis atau keputusan bisnis belum ditentukan, jangan mengarang nilai final. Tandai sebagai `OPEN DECISION` dan ajukan pertanyaan atau gunakan konfigurasi sementara yang jelas. Khususnya: ambang fraud, masa retensi foto, batas upload, konfigurasi queue, dan kemampuan spesifik shared hosting harus diverifikasi.
