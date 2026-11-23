<?php

/*
 * Parameter program peserta (PRD bagian 3). Semua angka bisa diubah lewat .env tanpa mengubah kode.
 */
return [
    'min_age' => (int) env('PARTICIPANT_MIN_AGE', 21),

    // Penahanan slot yang ditunjuk (PRD bagian 18, usulan 30 menit).
    'slot_hold_minutes' => (int) env('SLOT_HOLD_MINUTES', 30),

    'consent_version' => '1.0-2026-11-16',
    'consent_body' => 'Data peserta dipakai untuk menjalankan program, memeriksa bukti pembelian, menentukan hadiah, dan mengirim hadiah ke nomor tujuan atau alamat. Data tidak dijual. Admin Si Pemburu dan warung terkait dapat melihat klaim untuk pemeriksaan. Peserta dapat meminta penghapusan data dengan menghubungi admin.',

    // Nilai hadiah (rupiah) yang ditampilkan di halaman Hadiahku.
    'prize_values' => [
        'voucher' => (int) env('PRIZE_VALUE_VOUCHER', 30000),
        'token' => (int) env('PRIZE_VALUE_TOKEN', 20000),
        'bensin' => (int) env('PRIZE_VALUE_BENSIN', 30000),
    ],
    'voucher_valid_days' => (int) env('VOUCHER_VALID_DAYS', 14),

    // Enam tanda yang memasukkan klaim ke antrean admin (PRD bagian 18).
    'flags' => [
        'first_photo' => (bool) env('FLAG_FIRST_PHOTO', true),
        'random_sample_percent' => (int) env('FLAG_RANDOM_SAMPLE_PERCENT', 10),
        // Hash saat ini dHash 64 bit; ambang harus diuji dengan foto nyata (PRD 2.6).
        'similar_photo_max_distance' => (int) env('FLAG_SIMILAR_PHOTO_DISTANCE', 4),
        'dark_photo_brightness' => (int) env('BRIGHTNESS_THRESHOLD', 45),
        'late_code_minutes' => (int) env('FLAG_LATE_CODE_MINUTES', 30),
        // Selisih jam server saat kamera dibuka dengan saat foto diterima (PRD FR-35).
        'photo_delay_minutes' => (int) env('FLAG_PHOTO_DELAY_MINUTES', 10),
    ],
    'brightness_threshold' => (int) env('BRIGHTNESS_THRESHOLD', 45),

    // Pembatasan login PIN dan pendaftaran per IP (PRD 2.1 dan 2.4).
    'login_max_attempts' => (int) env('LOGIN_MAX_ATTEMPTS', 5),
    'login_lock_minutes' => (int) env('LOGIN_LOCK_MINUTES', 15),
    'register_per_ip_per_day' => (int) env('REGISTER_PER_IP_PER_DAY', 3),

    // Mystery gift di cap ke-5: peluang voucher (persen), sisanya 1 bungkus gratis.
    'mystery_voucher_chance' => (int) env('MYSTERY_VOUCHER_CHANCE', 50),

    // Nomor tujuan ditolak sebanyak ini: status perlu bantuan admin.
    'destination_max_failures' => (int) env('DESTINATION_MAX_FAILURES', 3),

    // Hanya untuk uji coba: tampilkan kode slot di layar. Di produksi kode hanya ada di balik slot fisik.
    'reveal_slot_code' => (bool) env('PARTICIPANT_REVEAL_SLOT_CODE', env('APP_ENV') === 'local'),
];
