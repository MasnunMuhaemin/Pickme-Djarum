<?php

return [
    'min_age' => (int) env('PARTICIPANT_MIN_AGE', 21),
    'slot_hold_minutes' => (int) env('SLOT_HOLD_MINUTES', 10),
    'consent_version' => '1.0-2026-11-16',
    'consent_body' => 'Data peserta dipakai untuk menjalankan program, memeriksa bukti pembelian, menentukan hadiah, dan mengirim hadiah ke nomor tujuan atau alamat. Data tidak dijual. Admin Si Pemburu dan warung terkait dapat melihat klaim untuk pemeriksaan. Peserta dapat meminta penghapusan data dengan menghubungi admin.',
    'voucher_valid_days' => (int) env('VOUCHER_VALID_DAYS', 14),
    'brightness_threshold' => (int) env('BRIGHTNESS_THRESHOLD', 45),
];
