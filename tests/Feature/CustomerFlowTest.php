<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Claim;
use App\Models\Gift;
use App\Models\MysteryAccess;
use App\Models\MysteryPrize;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\User;
use App\Models\Voucher;
use App\Services\RewardCreationService;
use Database\Seeders\CustomerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class CustomerFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CustomerSeeder::class);
        Storage::fake('local');

        // Tanda acak dan foto pertama dimatikan supaya hasil test pasti; tiap tanda diuji tersendiri.
        config([
            'participant.flags.first_photo' => false,
            'participant.flags.random_sample_percent' => 0,
        ]);
    }

    private function register(string $birthDate = '2000-01-01', string $whatsapp = '081234567890'): array
    {
        return [
            'name' => 'Sakinah',
            'whatsapp' => $whatsapp,
            'birth_date' => $birthDate,
            'area_id' => Area::first()->id,
            'pin' => '4826',
            'pin_confirmation' => '4826',
            'device_id' => 'test-device-'.$whatsapp,
        ];
    }

    /** Peserta yang sudah daftar, setuju, dan menjawab mahasiswa. */
    private function readyParticipant(string $whatsapp = '081234567890'): Participant
    {
        $this->post('/participant/daftar', $this->register(whatsapp: $whatsapp));
        $this->post('/participant/persetujuan', ['accepted' => true]);
        $this->post('/participant/mahasiswa', ['is_student' => true]);

        return Participant::where('whatsapp', $whatsapp)->firstOrFail();
    }

    private function photo(int $gray = 120, int $seed = 0): UploadedFile
    {
        $png = imagecreatetruecolor(200, 200);
        imagefill($png, 0, 0, imagecolorallocate($png, $gray, $gray, $gray));
        if ($seed) {
            // Pola berbeda supaya hash visual tidak mirip foto lain.
            mt_srand($seed);
            for ($i = 0; $i < 40; $i++) {
                $c = imagecolorallocate($png, mt_rand(0, 255), mt_rand(0, 255), mt_rand(0, 255));
                imagefilledrectangle($png, mt_rand(0, 180), mt_rand(0, 180), mt_rand(20, 200), mt_rand(20, 200), $c);
            }
        }
        ob_start();
        imagepng($png);
        $bytes = ob_get_clean();
        imagedestroy($png);

        return UploadedFile::fake()->createWithContent('bungkus.png', $bytes)->mimeType('image/png');
    }

    private function uploadPhoto(int $gray = 120, int $seed = 0): Claim
    {
        $this->get('/participant/foto');
        $this->post('/participant/foto', ['photo' => $this->photo($gray, $seed), 'outlet' => 'W07'])->assertRedirect('/participant/slot');

        // Papan slot: kode di balik slot yang ditunjuk dimasukkan, baru hadiah terbentuk.
        $claim = Claim::latest('id')->firstOrFail();
        $this->get('/participant/slot')->assertInertia(fn ($page) => $page->where('claim.slot.code', $claim->slot->code));
        $this->post('/participant/slot', ['code' => $claim->slot->code])->assertRedirect('/participant/klaim/berhasil');

        return $claim->fresh();
    }

    public function test_underage_registration_is_rejected_without_saving_participant(): void
    {
        $response = $this->post('/participant/daftar', $this->register(now()->subYears(10)->toDateString()));

        $response->assertSessionHasErrors('underage');
        $this->assertDatabaseMissing('participants', ['whatsapp' => '081234567890']);
        $this->assertDatabaseHas('rejects', ['reason' => 'underage']);
    }

    public function test_full_claim_flow_creates_reward_and_adds_cap(): void
    {
        $this->prizesAre('voucher');
        $this->post('/participant/daftar', $this->register())->assertRedirect('/participant/persetujuan');
        $participant = Participant::firstOrFail();
        $this->assertSame('Sakinah', $participant->name);

        // Tanpa QR yang dipindai, setelah setuju peserta scan papan dulu sebelum foto bungkus.
        $this->post('/participant/persetujuan', ['accepted' => true])->assertRedirect('/participant/scan');
        // Belum menjawab pertanyaan mahasiswa: klaim ditahan, lalu lanjut ke foto setelah menjawab "ya".
        $this->get('/participant/foto?outlet=W07')->assertRedirect('/participant/mahasiswa');
        $this->post('/participant/mahasiswa', ['is_student' => true])->assertRedirect('/participant/foto?outlet=W07');

        $this->assertDatabaseCount('claims', 0);
        $claim = $this->uploadPhoto();

        // Foto diterima: kode slot langsung dipakai tanpa input kode dan tanpa persetujuan admin.
        $this->assertNull($claim->flag);
        $this->assertMatchesRegularExpression('/^KLM\d{4}$/', $claim->claim_code);
        $this->assertDatabaseHas('claim_photos', ['claim_id' => $claim->id]);
        $this->assertSame($claim->slot->code, $claim->code);
        $this->assertSame('approved', $claim->fresh()->status);
        $this->assertSame('used', $claim->fresh()->slot->status);
        $this->assertSame(1, $participant->fresh()->caps);

        $this->get('/participant/klaim/berhasil')->assertOk()->assertInertia(fn ($page) => $page
            ->component('participant/klaim-berhasil')
            ->where('mystery', null)
            ->has('reward.status_label')
            ->where('claim.claim_code', $claim->claim_code)
        );
        $this->get('/participant/hadiah')->assertOk()->assertInertia(fn ($page) => $page
            ->component('participant/hadiah')
            ->where('approvedClaims', 1)
            ->has('rewards', 1)
        );
        if ($voucher = Voucher::where('claim_id', $claim->id)->first()) {
            $this->get("/participant/voucher/{$voucher->code}")->assertOk()->assertInertia(fn ($page) => $page
                ->component('participant/voucher')
                ->has('reward.status_label')
            );
        }
    }

    /** Hadiah semua slot papan W07 diganti, mis. token: klaim bertanda hanya ditahan untuk token listrik. */
    private function prizesAre(string $type): void
    {
        Slot::query()->update(['prize_type' => $type]);
    }

    public function test_flagged_voucher_claim_is_approved_directly(): void
    {
        $this->readyParticipant();
        $this->prizesAre('voucher');
        $claim = $this->uploadPhoto(gray: 10);
        $this->assertContains('dark_photo', $claim->flags());

        $this->assertSame('approved', $claim->fresh()->status);
        $this->assertContains('dark_photo', $claim->fresh()->flags());
    }

    public function test_token_reward_tells_participant_to_fill_meter_number(): void
    {
        $this->readyParticipant();
        $this->prizesAre('token');
        $claim = $this->uploadPhoto(seed: 31);

        $this->get('/participant/klaim/berhasil')->assertInertia(fn ($page) => $page
            ->where('reward.follow_up.title', 'Lengkapi data token listrik')
            ->where('reward.action', 'Isi nomor'));
        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.follow_up.title', 'Lengkapi data token listrik'));
    }

    public function test_voucher_reward_needs_no_follow_up(): void
    {
        $this->readyParticipant();
        $this->prizesAre('voucher');
        $claim = $this->uploadPhoto(seed: 32);

        $this->get('/participant/klaim/berhasil')->assertInertia(fn ($page) => $page->where('reward.follow_up', null));
    }

    public function test_flagged_claim_is_approved_directly_and_keeps_its_flag(): void
    {
        $participant = $this->readyParticipant();
        $this->prizesAre('token');
        $claim = $this->uploadPhoto(gray: 10);
        $this->assertSame(['dark_photo'], $claim->flags());

        $claim->refresh();
        $this->assertSame('approved', $claim->status);
        $this->assertSame(['dark_photo'], $claim->flags());
        $this->assertSame('used', $claim->slot->status);
        $this->assertTrue(Voucher::where('claim_id', $claim->id)->exists());
    }

    public function test_rejected_claims_never_add_caps_or_ranking(): void
    {
        $participant = $this->readyParticipant();
        $this->prizesAre('voucher');

        // Kode slot salah: klaim ditolak di layar Ambil slot, tetap draf tanpa cap.
        $this->get('/participant/foto');
        $this->post('/participant/foto', ['photo' => $this->photo(seed: 71), 'outlet' => 'W07'])->assertRedirect('/participant/slot');
        $this->post('/participant/slot', ['code' => 'ZZZZZZ'])->assertSessionHasErrors('code');
        $claim = Claim::latest('id')->firstOrFail();
        $this->assertNotSame('approved', $claim->status);
        $this->assertNull($claim->cap_at);

        // Klaim berstatus ditolak tidak bisa diberi cap, juga bila diminta langsung.
        $claim->update(['status' => 'rejected']);
        app(RewardCreationService::class)->grantCap($claim);
        $this->assertNull($claim->fresh()->cap_at);

        $this->assertSame(0, $participant->fresh()->caps);
        $this->get('/participant/kartu')->assertInertia(fn ($page) => $page->has('leaderboard.total', 0));
    }

    public function test_token_cap_counts_immediately_after_claim(): void
    {
        $participant = $this->readyParticipant();
        $this->prizesAre('token');
        $claim = $this->uploadPhoto(seed: 41);

        // Token listrik butuh proses admin, tetapi cap dihitung saat klaim berhasil.
        $this->assertSame(1, $participant->fresh()->caps);
        $this->assertNotNull($claim->fresh()->cap_at);
        $this->get('/participant/kartu')->assertInertia(fn ($page) => $page->where('leaderboard.total.0.caps', 1));

        // Admin menyelesaikan token tidak menambah cap kedua.
        $voucher = Voucher::where('claim_id', $claim->id)->firstOrFail();
        $voucher->update(['status' => 'pending_process']);
        $this->actingAs(User::factory()->create(['is_admin' => true]))
            ->post("/admin/pemenuhan/token/{$voucher->id}/berhasil", ['reference' => 'REF123']);

        $this->assertSame(1, $participant->fresh()->caps);
    }

    public function test_merch_cap_counts_immediately_after_claim(): void
    {
        $participant = $this->readyParticipant();
        $this->prizesAre('merch');
        $claim = $this->uploadPhoto(seed: 42);

        // Merchandise meminta alamat, tetapi cap tetap dihitung saat klaim berhasil.
        $this->assertSame(1, $participant->fresh()->caps);
        $this->assertNotNull($claim->fresh()->cap_at);
    }

    public function test_similar_photo_is_noted_and_claims_are_never_held(): void
    {
        config(['participant.flags.first_photo' => true, 'participant.flags.random_sample_percent' => 100]);
        $this->readyParticipant();

        // Tanpa persetujuan admin: tanda pemeriksaan (foto pertama, sampel acak) tidak dibuat dan klaim langsung berhasil.
        $first = $this->uploadPhoto(seed: 7);
        $this->assertSame('approved', $first->status);
        $this->assertSame([], array_values(array_intersect(['first_photo', 'random_sample'], $first->flags())));

        $second = $this->uploadPhoto(seed: 7);
        $this->assertContains('similar_photo', $second->flags());
        $this->assertSame('approved', $second->status);
        // Tidak ada slot yang ditahan.
        $this->assertSame(0, Slot::where('status', 'held')->count());
    }

    public function test_old_board_page_redirects_home_and_home_shows_participant_summary(): void
    {
        $this->readyParticipant();
        $this->prizesAre('voucher');
        $this->uploadPhoto(seed: 3);

        $this->get('/participant/papan')->assertRedirect('/participant');
        $this->get('/participant')->assertInertia(fn ($page) => $page
            ->component('participant/home')
            ->where('me.caps', 1)
            ->where('me.claims_today', 1)
            ->where('me.rank', 1)
            ->where('me.last_outlet', 'W07')
        );
        $this->get('/participant/profil')->assertInertia(fn ($page) => $page
            ->component('participant/profil')
            ->where('me.whatsapp', '08** **** 7890')
            ->where('me.is_student', true)
        );
    }

    public function test_third_claim_on_the_same_day_is_refused(): void
    {
        $this->readyParticipant();
        $this->uploadPhoto(seed: 1);
        $this->uploadPhoto(seed: 2);

        $this->get('/participant/foto')->assertRedirect('/participant')->assertSessionHasErrors('limit');
        $this->post('/participant/foto', ['photo' => $this->photo(seed: 3), 'outlet' => 'W07'])->assertSessionHasErrors('limit');
        $this->assertDatabaseCount('claims', 2);
    }

    public function test_consent_is_required_before_claiming(): void
    {
        $this->post('/participant/daftar', $this->register());
        Participant::first()->update(['is_student' => true]);

        $this->get('/participant/foto?outlet=W07')->assertRedirect('/participant/persetujuan');
    }

    public function test_paused_program_or_outlet_blocks_photo_submit_and_creates_nothing(): void
    {
        $participant = $this->readyParticipant();
        $this->prizesAre('voucher');
        $this->get('/participant/foto');

        // Seluruh program dijeda: kirim foto ditolak, tidak ada klaim, voucher, atau cap baru.
        Setting::put('program_paused', '1');
        $this->post('/participant/foto', ['photo' => $this->photo(seed: 61), 'outlet' => 'W07'])
            ->assertRedirect('/participant')->assertSessionHasErrors('claim');
        $this->assertSame(0, Claim::count());
        $this->assertSame(0, Voucher::count());
        $this->assertSame(0, $participant->fresh()->caps);

        // Hanya titik W07 yang dijeda: hasilnya sama.
        Setting::put('program_paused', '0');
        Outlet::where('code', 'W07')->update(['status' => 'paused']);
        $this->post('/participant/foto', ['photo' => $this->photo(seed: 62), 'outlet' => 'W07'])->assertSessionHasErrors('claim');
        $this->assertSame(0, Claim::count());

        // Dilanjutkan: klaim berjalan normal lagi.
        Outlet::where('code', 'W07')->update(['status' => 'active']);
        $this->uploadPhoto(seed: 63);
        $this->assertSame(1, $participant->fresh()->caps);
    }

    public function test_paused_program_blocks_claim_screens(): void
    {
        $this->readyParticipant();
        Setting::put('program_paused', '1');

        $this->get('/participant/foto')->assertRedirect('/participant')->assertSessionHasErrors('claim');
    }

    public function test_logged_in_participant_must_scan_again_before_photo(): void
    {
        $this->readyParticipant();

        // Halaman Scan selalu tampil, juga setelah QR terbaca sebelumnya.
        $this->get('/participant/scan')->assertOk();
        $this->get('/w07');
        $this->get('/participant/scan')->assertOk();

        // Baru setelah QR benar-benar terbaca di sesi ini peserta masuk ke foto.
        $this->post('/participant/scan', ['code' => 'W07'])->assertRedirect('/participant/foto?outlet=W07');

        // Setelah keluar: kembali ke beranda tamu dan warung yang terbaca dilupakan.
        $this->post('/participant/keluar')->assertRedirect('/participant');
        $this->get('/participant')->assertInertia(fn ($page) => $page->missing('me')->where('auth.participant', null));
        $this->get('/participant/scan')->assertOk();
    }

    public function test_returning_participant_still_scans_qr_before_photo(): void
    {
        $this->readyParticipant();
        $this->uploadPhoto(seed: 41);

        // Keluar lalu masuk lagi: scan tetap ditampilkan, warung klaim terakhir tidak dipakai otomatis.
        $this->post('/participant/keluar');
        $this->post('/participant/masuk', ['whatsapp' => '081234567890', 'pin' => '4826'])->assertRedirect('/participant/scan');
        $this->get('/participant/scan')->assertOk();
    }

    public function test_student_question_and_blocked_notice_are_popups_on_scan(): void
    {
        $this->readyParticipant();

        // Pertanyaan mahasiswa dirender sebagai popup di halaman scan, bukan halaman sendiri.
        $this->get('/participant/mahasiswa')->assertInertia(fn ($page) => $page
            ->component('participant/scan')
            ->where('student', true));
        $this->get('/participant/mahasiswa/khusus')->assertInertia(fn ($page) => $page
            ->component('participant/scan')
            ->where('studentBlocked', true));
    }

    public function test_login_without_scan_never_lands_on_the_board(): void
    {
        // Tamu membuka foto: popup masuk, bukan papan.
        $this->get('/participant/foto')->assertRedirect('/participant/masuk');

        // Masuk dari beranda tanpa scan QR dan belum pernah klaim: ke Scan, bukan papan.
        $this->readyParticipant();
        $this->post('/participant/keluar');
        $this->post('/participant/masuk', ['whatsapp' => '081234567890', 'pin' => '4826'])->assertRedirect('/participant/scan');
        $this->get('/participant/scan')->assertOk();
    }

    public function test_qr_address_opens_login_then_photo(): void
    {
        // Belum masuk: popup masuk, titik diingat di session.
        $this->get('/w07')->assertRedirect('/participant/masuk')->assertSessionHas('claim_outlet', 'W07');

        // Sudah masuk: langsung ke foto bungkus.
        $this->readyParticipant();
        $this->get('/w07')->assertRedirect('/participant/foto?outlet=W07');

        // Kembali ke halaman masuk/daftar setelah masuk: ke Scan tanpa popup supaya kamera tetap jalan.
        $this->get('/participant/masuk')->assertRedirect('/participant/scan');
        $this->get('/participant/daftar')->assertRedirect('/participant/scan');

        // QR tidak dikenal: kembali ke Scan dengan popup error, bukan halaman sendiri.
        $this->get('/x99')->assertRedirect('/participant/scan')->assertSessionHasErrors('qr');
        $this->assertDatabaseHas('rejects', ['reason' => 'unknown_qr']);
    }

    public function test_scan_resolves_known_outlet_and_rejects_unknown_code(): void
    {
        $this->post('/participant/scan', ['code' => 'w07'])
            ->assertRedirect('/participant/masuk');

        // QR tidak dikenal: kembali ke halaman scan dengan error untuk popup.
        $this->from('/participant/scan')->post('/participant/scan', ['code' => 'XX99'])
            ->assertRedirect('/participant/scan')->assertSessionHasErrors('qr');

        // QR asli berisi alamat titik (PRD FR-06).
        $this->post('/participant/scan', ['code' => 'https://pickme.example/w07'])
            ->assertRedirect('/participant/masuk');
        $this->from('/participant/scan')->post('/participant/scan', ['code' => 'https://toko-lain.example/promo'])
            ->assertRedirect('/participant/scan')->assertSessionHasErrors('qr');
    }

    public function test_guest_who_scanned_qr_goes_to_photo_after_register_and_consent(): void
    {
        $this->post('/participant/scan', ['code' => 'W07'])->assertRedirect('/participant/masuk');
        $this->post('/participant/daftar', $this->register())->assertRedirect('/participant/persetujuan');

        // QR sudah dipindai sebelum daftar: setelah setuju langsung ke foto, tidak scan ulang.
        $this->post('/participant/persetujuan', ['accepted' => true])->assertRedirect('/participant/foto?outlet=W07');
    }

    public function test_non_student_cannot_start_a_claim(): void
    {
        $this->post('/participant/daftar', $this->register());
        $this->post('/participant/persetujuan', ['accepted' => true]);
        $this->post('/participant/mahasiswa', ['is_student' => false]);

        $this->get('/participant/foto')->assertRedirect('/participant/mahasiswa/khusus');
        $this->assertDatabaseMissing('claims', ['participant_id' => Participant::first()->id]);
    }

    public function test_weak_pin_is_rejected(): void
    {
        $this->post('/participant/daftar', [...$this->register(), 'pin' => '1234', 'pin_confirmation' => '1234'])
            ->assertSessionHasErrors(['pin' => 'PIN harus 4 angka dan tidak boleh mudah ditebak.']);
        $this->assertDatabaseCount('participants', 0);
    }

    public function test_login_is_rate_limited_after_repeated_wrong_pins(): void
    {
        $this->post('/participant/daftar', $this->register());
        $this->post('/participant/keluar');

        foreach (range(1, config('participant.login_max_attempts')) as $i) {
            $this->post('/participant/masuk', ['whatsapp' => '081234567890', 'pin' => '9999'])
                ->assertSessionHasErrors(['pin' => 'Nomor atau PIN belum cocok. Lupa PIN? Hubungi admin.']);
        }

        // PIN benar pun ditahan sampai jeda habis.
        $response = $this->post('/participant/masuk', ['whatsapp' => '081234567890', 'pin' => '4826']);
        $this->assertStringContainsString('Terlalu banyak percobaan', session('errors')->first('pin'));
        $this->assertNull(session('participant_id'));
        $response->assertRedirect();
    }

    public function test_registration_is_limited_per_ip(): void
    {
        config(['participant.register_per_ip_per_day' => 2]);
        $this->post('/participant/daftar', $this->register(whatsapp: '081200000001'));
        $this->post('/participant/daftar', $this->register(whatsapp: '081200000002'));

        $this->post('/participant/daftar', $this->register(whatsapp: '081200000003'))->assertSessionHasErrors('whatsapp');
        $this->assertDatabaseCount('participants', 2);
    }

    public function test_token_destination_must_be_entered_twice(): void
    {
        $participant = $this->readyParticipant();
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM0001', 'status' => 'approved']);
        $voucher = Voucher::create(['claim_id' => $claim->id, 'code' => 'KGRTOKEN1', 'type' => 'token', 'status' => 'pending_data']);

        $this->post("/participant/nomor-tujuan/{$voucher->id}", ['destination' => '12345678901', 'destination_confirmation' => '12345678900'])
            ->assertSessionHasErrors(['destination' => 'Kedua isian nomor belum sama.']);
        $this->post("/participant/nomor-tujuan/{$voucher->id}", ['destination' => '1234-5678-901', 'destination_confirmation' => '12345678901'])
            ->assertRedirect('/participant/terima-kasih');
        $this->assertSame('pending_process', $voucher->fresh()->status);
        $this->assertSame('12345678901', $voucher->fresh()->destination);

        // Setelah diproses, form tidak bisa dibuka lagi; setelah 3 kali ditolak: perlu bantuan admin.
        $this->get("/participant/nomor-tujuan/{$voucher->id}")->assertRedirect('/participant/hadiah');
        $voucher->update(['status' => 'rejected', 'failed_attempts' => 3]);
        $this->get("/participant/nomor-tujuan/{$voucher->id}")->assertRedirect('/participant/hadiah');
    }

    public function test_bensin_has_no_form_and_no_action(): void
    {
        $participant = $this->readyParticipant();
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM0002', 'status' => 'approved']);
        Voucher::create(['claim_id' => $claim->id, 'code' => 'KGRBENSIN', 'type' => 'bensin', 'status' => 'pending']);

        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.kind', 'bensin')
            ->where('rewards.0.status_label', 'Menunggu admin')
            ->where('rewards.0.action', null)
            ->where('rewards.0.href', null)
        );
    }

    public function test_address_must_be_in_delivery_area(): void
    {
        $participant = $this->readyParticipant();
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM0003', 'status' => 'approved']);
        $gift = Gift::create(['claim_id' => $claim->id, 'type' => 'merchandise', 'status' => 'pending_address']);
        Area::create(['name' => 'Dayeuhkolot', 'is_delivery_area' => false]);

        $payload = ['recipient' => 'Sakinah', 'whatsapp' => '081234567890', 'address' => 'Jl. Sukabirus No. 12, dekat masjid'];
        $this->post("/participant/alamat/{$gift->id}", [...$payload, 'area' => 'Dayeuhkolot'])
            ->assertSessionHasErrors(['area' => 'Hadiah hanya diantar di area yang tersedia.']);
        $this->post("/participant/alamat/{$gift->id}", [...$payload, 'area' => 'Sukapura', 'note' => 'titip satpam'])
            ->assertRedirect('/participant/terima-kasih');
        $this->assertSame('ready_to_ship', $gift->fresh()->status);

        // Setelah alamat dikirim, kartu hadiah membuka halaman detail yang menampilkan alamatnya.
        $this->get("/participant/hadiah-barang/{$gift->id}")->assertInertia(fn ($page) => $page
            ->component('participant/hadiah-barang')
            ->where('gift.area', 'Sukapura')
            ->where('gift.address', 'Jl. Sukabirus No. 12, dekat masjid')
            ->where('gift.note', 'titip satpam')
            ->where('reward.href', route('participant.hadiah-barang', $gift->id)));

        // Hadiah berikutnya: form terisi dari data peserta dan alamat yang pernah diisi.
        $next = Gift::create(['claim_id' => $claim->id, 'type' => 'merchandise', 'status' => 'pending_address']);
        $this->get("/participant/alamat/{$next->id}")->assertInertia(fn ($page) => $page
            ->where('defaults.recipient', 'Sakinah')
            ->where('defaults.area', 'Sukapura')
            ->where('defaults.address', 'Jl. Sukabirus No. 12, dekat masjid')
            ->where('defaults.note', 'titip satpam'));
    }

    public function test_mystery_gift_at_fifth_cap_gives_a_cms_prize(): void
    {
        config(['participant.mystery_voucher_chance' => 100, 'participant.daily_claim_limit' => 10]);
        $prize = MysteryPrize::create(['name' => 'Voucher Spotify', 'fulfillment' => 'kode', 'value' => 60000, 'stock' => 3]);
        $participant = $this->readyParticipant();
        $this->prizesAre('voucher');

        foreach (range(1, 5) as $i) {
            $this->uploadPhoto(seed: 10 + $i);
        }

        $this->assertSame(5, $participant->fresh()->caps);
        $voucher = Voucher::where('source', 'mystery')->firstOrFail();
        $this->assertSame('digital', $voucher->type);
        $this->assertSame('pending_process', $voucher->status);
        $this->assertSame(1, $prize->fresh()->given);
        // Mystery gift tampil paling atas di Hadiahku dengan nama dari CMS.
        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.mystery', true)
            ->where('rewards.0.title', 'Mystery gift: Voucher Spotify')
            ->where('rewards.0.status_label', 'Diproses admin')
            ->has('rewards', 6)
        );
        $this->get('/participant/mystery-gift')->assertInertia(fn ($page) => $page->where('reward.mystery', true));
        $this->get('/participant/kartu')->assertInertia(fn ($page) => $page->where('mystery.mystery', true));

        // Admin mengisi kode: peserta melihat kodenya.
        $this->actingAs(User::factory()->create(['is_admin' => true]))
            ->post("/admin/mystery-gift/voucher/{$voucher->id}/kode", ['code' => 'SPTF-1234'])->assertSessionHas('mystery_wa');
        $this->get('/participant/mystery-gift')->assertInertia(fn ($page) => $page
            ->where('reward.code', 'SPTF-1234')->where('reward.status_label', 'Kode terkirim'));
    }

    public function test_free_pack_mystery_gift_waits_for_admin(): void
    {
        config(['participant.mystery_voucher_chance' => 100, 'participant.daily_claim_limit' => 10]);
        MysteryPrize::create(['name' => 'Produk gratis', 'fulfillment' => 'ambil', 'stock' => 5]);
        $participant = $this->readyParticipant();
        $this->prizesAre('voucher');

        foreach (range(1, 5) as $i) {
            $this->uploadPhoto(seed: 30 + $i);
        }

        $this->assertSame(5, $participant->fresh()->caps);
        // Pemberitahuan di layar hasil klaim cap ke-5.
        $this->get('/participant/klaim/berhasil')->assertInertia(fn ($page) => $page
            ->where('mystery.title', 'Mystery gift: Produk gratis')->where('hasMystery', true)
        );
        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.title', 'Mystery gift: Produk gratis')
            ->where('rewards.0.status_label', 'Menunggu admin')
        );
    }

    public function test_mystery_gift_respects_chance_stock_and_block_list(): void
    {
        config(['participant.daily_claim_limit' => 20]);
        $this->prizesAre('voucher');

        // Peluang 0%: tidak dapat, walau stok ada.
        config(['participant.mystery_voucher_chance' => 0]);
        MysteryPrize::create(['name' => 'Voucher Netflix', 'fulfillment' => 'kode', 'stock' => 5]);
        $first = $this->readyParticipant('081211110001');
        foreach (range(1, 5) as $i) {
            $this->uploadPhoto(seed: 50 + $i);
        }
        $this->assertSame(5, $first->fresh()->caps);
        $this->assertSame(0, Voucher::where('source', 'mystery')->count());
        $this->get('/participant/kartu')->assertInertia(fn ($page) => $page->where('mystery', null));

        // Diblokir: tidak dapat walau peluang 100%.
        config(['participant.mystery_voucher_chance' => 100]);
        MysteryAccess::create(['whatsapp' => '081211110002', 'kind' => 'block']);
        $this->post('/participant/keluar');
        $this->readyParticipant('081211110002');
        foreach (range(1, 5) as $i) {
            $this->uploadPhoto(seed: 60 + $i);
        }
        $this->assertSame(0, Voucher::where('source', 'mystery')->count());

        // Stok habis: tidak dapat.
        MysteryPrize::query()->update(['given' => 5]);
        $this->post('/participant/keluar');
        $this->readyParticipant('081211110003');
        foreach (range(1, 5) as $i) {
            $this->uploadPhoto(seed: 70 + $i);
        }
        $this->assertSame(0, Voucher::where('source', 'mystery')->count());
    }

    public function test_limited_edition_slot_is_taken_at_board_and_counts_as_cap(): void
    {
        $participant = $this->readyParticipant();
        $this->prizesAre('limited');
        Slot::query()->update(['voucher_type_id' => null, 'voucher_code' => null]);

        $this->uploadPhoto(seed: 90);

        $this->assertSame(1, $participant->fresh()->caps);
        $gift = Gift::where('type', 'limited_edition')->firstOrFail();
        $this->assertSame('done', $gift->status);
        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.title', 'Limited edition')
            ->where('rewards.0.description', 'Diambil langsung di papan')
            ->where('rewards.0.status_label', 'Selesai'));
    }

    public function test_voucher_never_expires(): void
    {
        $participant = $this->readyParticipant();
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM0004', 'status' => 'approved']);
        // Voucher tidak punya masa berlaku: kolomnya sudah dihapus dan tidak pernah berstatus kadaluarsa.
        $this->assertFalse(Schema::hasColumn('vouchers', 'expires_at'));
        Voucher::create(['claim_id' => $claim->id, 'code' => 'KGROLD001', 'type' => 'voucher', 'status' => 'sent', 'created_at' => now()->subYear()]);

        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page->where('rewards.0.status_label', 'Terkirim'));
    }

    public function test_leaderboard_ranks_by_approved_claims_then_who_reached_first(): void
    {
        $outlet = Outlet::first();
        $area = Area::first()->id;
        $make = function (string $name, string $wa, array $times) use ($outlet, $area) {
            $p = Participant::create(['name' => $name, 'whatsapp' => $wa, 'birth_date' => '2000-01-01', 'area_id' => $area, 'pin_hash' => 'x', 'caps' => count($times)]);
            foreach ($times as $i => $time) {
                Claim::create(['participant_id' => $p->id, 'outlet_id' => $outlet->id, 'claim_code' => "KLM{$wa}{$i}", 'status' => 'approved', 'submitted_at' => $time, 'cap_at' => $time]);
            }
            // Klaim antre dan ditolak tidak dihitung.
            Claim::create(['participant_id' => $p->id, 'outlet_id' => $outlet->id, 'claim_code' => "KLM{$wa}X", 'status' => 'rejected', 'submitted_at' => now()]);

            return $p;
        };
        $make('Rani', '081100000001', [now()->subDays(20), now()->subHours(2)]);
        $make('Dimas', '081100000002', [now()->subDays(20), now()->subHours(5)]);
        $make('Bayu', '081100000003', [now()->subHour()]);

        $this->get('/participant/kartu')->assertInertia(fn ($page) => $page
            ->component('participant/kartu')
            ->where('leaderboard.total.0.name', 'Dimas')
            ->where('leaderboard.total.0.caps', 2)
            ->where('leaderboard.total.0.prize', 'golden_slot')
            ->where('leaderboard.total.1.name', 'Rani')
            ->where('leaderboard.total.2.name', 'Bayu')
            ->has('leaderboard.weekly', 3)
            ->where('leaderboard.weekly.0.caps', 1)
            ->where('me', null)
        );

        $participant = $this->readyParticipant();
        $this->get('/participant/kartu')->assertInertia(fn ($page) => $page
            ->where('name', $participant->name)
            ->where('me.total', null)
        );
    }

    public function test_home_lists_prizes_from_active_board(): void
    {
        $this->get('/participant')->assertOk()->assertInertia(fn ($page) => $page
            ->component('participant/home')
            ->has('prizes', 4)
            ->where('prizes.0.type', 'voucher')
            ->where('prizes.0.value', 'Rp30.000')
            ->where('prizes.0.remaining', 9)
        );
    }

    public function test_support_pages_write_to_database(): void
    {
        $this->post('/participant/scan', ['code' => 'XX99']);
        $this->assertDatabaseHas('rejects', ['reason' => 'unknown_qr']);

        $this->post('/participant/lupa-pin', ['whatsapp' => '081234567890']);
        $this->assertDatabaseHas('activity_logs', ['action' => 'pin_reset_requested']);

        $this->post('/participant/mahasiswa', ['is_student' => true])->assertRedirect('/participant/scan');
        $this->post('/participant/mahasiswa', ['is_student' => false])->assertRedirect('/participant/mahasiswa/khusus');
        $this->assertDatabaseHas('activity_logs', ['action' => 'student_confirmation']);
    }

    public function test_login_with_wrong_pin_is_rejected(): void
    {
        $this->post('/participant/daftar', $this->register());

        $this->post('/participant/masuk', ['whatsapp' => '081234567890', 'pin' => '9999'])
            ->assertSessionHasErrors('pin');
    }
}
