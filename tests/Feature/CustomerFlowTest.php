<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Board;
use App\Models\Claim;
use App\Models\Gift;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\Voucher;
use Database\Seeders\CustomerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
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

        return Claim::latest('id')->firstOrFail();
    }

    public function test_underage_registration_is_rejected_without_saving_participant(): void
    {
        $response = $this->post('/participant/daftar', $this->register(now()->subYears(10)->toDateString()));

        $response->assertRedirect('/participant/daftar/belum-bisa');
        $this->assertDatabaseMissing('participants', ['whatsapp' => '081234567890']);
        $this->assertDatabaseHas('rejects', ['reason' => 'underage']);
    }

    public function test_full_claim_flow_creates_reward_and_adds_cap(): void
    {
        $this->post('/participant/daftar', $this->register())->assertRedirect('/participant/persetujuan');
        $participant = Participant::firstOrFail();
        $this->assertSame('Sakinah', $participant->name);

        $this->post('/participant/persetujuan', ['accepted' => true])->assertRedirect('/participant/foto');
        // Belum menjawab pertanyaan mahasiswa: klaim ditahan, lalu lanjut ke foto setelah menjawab "ya".
        $this->post('/participant/klaim/mulai', ['outlet' => 'W07'])->assertRedirect('/participant/mahasiswa');
        $this->get('/participant/foto')->assertRedirect('/participant/mahasiswa');
        $this->post('/participant/mahasiswa', ['is_student' => true])->assertRedirect('/participant/foto?outlet=W07');
        $this->post('/participant/klaim/mulai', ['outlet' => 'W07'])->assertRedirect('/participant/foto?outlet=W07');

        $this->assertDatabaseCount('claims', 0);
        $claim = $this->uploadPhoto();

        $this->assertSame('draft', $claim->status);
        $this->assertNull($claim->flag);
        $this->assertMatchesRegularExpression('/^KLM-\d{4}$/', $claim->claim_code);
        $this->assertSame('held', $claim->slot->status);
        $this->assertDatabaseHas('claim_photos', ['claim_id' => $claim->id]);

        $this->post('/participant/slot', ['code' => 'ZZZZZZ'])->assertSessionHasErrors('code');
        $this->assertSame('held', $claim->fresh()->slot->status);

        $this->post('/participant/slot', ['code' => $claim->slot->code])->assertRedirect('/participant/klaim/berhasil');
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

        $this->post('/participant/slot', ['code' => $claim->slot->code])->assertRedirect('/participant/klaim/berhasil');
        $this->assertSame('approved', $claim->fresh()->status);
        $this->assertContains('dark_photo', $claim->fresh()->flags());
    }

    public function test_token_reward_tells_participant_to_fill_meter_number(): void
    {
        $this->readyParticipant();
        $this->prizesAre('token');
        $claim = $this->uploadPhoto(seed: 31);
        $this->post('/participant/slot', ['code' => $claim->slot->code])->assertRedirect('/participant/klaim/berhasil');

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
        $this->post('/participant/slot', ['code' => $claim->slot->code]);

        $this->get('/participant/klaim/berhasil')->assertInertia(fn ($page) => $page->where('reward.follow_up', null));
    }

    public function test_flagged_claim_waits_for_admin_without_cap_or_reward(): void
    {
        $participant = $this->readyParticipant();
        $this->prizesAre('token');
        $claim = $this->uploadPhoto(gray: 10);
        $this->assertSame(['dark_photo'], $claim->flags());

        $this->post('/participant/slot', ['code' => $claim->slot->code])->assertRedirectContains('/participant/klaim/diperiksa/');

        $claim->refresh();
        $this->assertSame('pending', $claim->status);
        $this->assertSame('used', $claim->slot->status);
        $this->assertSame(0, $participant->fresh()->caps);
        $this->assertFalse(Voucher::where('claim_id', $claim->id)->exists() || $claim->gifts()->exists());
    }

    public function test_pending_and_rejected_claims_show_in_hadiahku_with_their_pages(): void
    {
        $this->readyParticipant();
        $this->prizesAre('token');
        $pending = $this->uploadPhoto(gray: 10);
        $this->post('/participant/slot', ['code' => $pending->slot->code]);
        $rejected = $this->uploadPhoto(seed: 21);
        $rejected->update(['status' => 'rejected', 'submitted_at' => now()]);

        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.kind', 'claim_pending')
            ->where('rewards.0.status_label', 'Sedang diperiksa')
            ->where('rewards.0.href', route('participant.klaim.diperiksa', $pending->id))
            ->where('rewards.1.kind', 'claim_rejected')
            ->where('rewards.1.href', route('participant.klaim.ditolak', $rejected->id))
        );

        $this->get("/participant/klaim/diperiksa/{$pending->id}")->assertInertia(fn ($page) => $page
            ->component('participant/klaim-diperiksa')
            ->where('claim.claim_code', $pending->claim_code)
        );
        $this->get("/participant/klaim/ditolak/{$rejected->id}")->assertInertia(fn ($page) => $page
            ->component('participant/klaim-ditolak')
            ->where('claim.claim_code', $rejected->claim_code)
        );

        // Klaim yang sudah diputuskan tidak lagi tampil sebagai ditangguhkan.
        $pending->update(['status' => 'approved']);
        $this->get("/participant/klaim/diperiksa/{$pending->id}")->assertRedirect('/participant/hadiah');
    }

    public function test_first_photo_and_similar_photo_are_flagged(): void
    {
        config(['participant.flags.first_photo' => true]);
        $this->readyParticipant();

        $first = $this->uploadPhoto(seed: 7);
        $this->assertContains('first_photo', $first->flags());
        $this->post('/participant/slot', ['code' => $first->slot->code]);

        $second = $this->uploadPhoto(seed: 7);
        $this->assertNotContains('first_photo', $second->flags());
        $this->assertContains('similar_photo', $second->flags());
    }

    public function test_slot_code_checks_follow_prd_rules(): void
    {
        $this->readyParticipant();
        $this->prizesAre('token');
        $claim = $this->uploadPhoto(seed: 1);
        $board = $claim->outlet->board;

        // Kode dari papan titik lain.
        $other = Outlet::create(['code' => 'W08', 'name' => 'Warung Lain', 'area_id' => Area::first()->id, 'status' => 'active']);
        $otherBoard = Board::create(['outlet_id' => $other->id, 'code' => 'W08-BOARD', 'week_label' => 'W08', 'status' => 'active']);
        Slot::create(['board_id' => $otherBoard->id, 'position' => 'A1', 'code' => 'QWERTY', 'prize_type' => 'voucher', 'status' => 'empty']);
        $this->post('/participant/slot', ['code' => 'QWERTY'])->assertSessionHasErrors(['code' => 'Kode ini dari papan titik lain. Ambil slot di papan W07.']);

        // Kode yang sudah dipakai.
        $used = $board->slots()->where('status', 'used')->first();
        $this->post('/participant/slot', ['code' => $used->code])->assertSessionHasErrors(['code' => 'Kode ini sudah pernah dipakai. Ambil slot yang ditunjuk untukmu.']);

        // Slot yang sedang ditahan peserta lain.
        $otherParticipant = Participant::create(['name' => 'Lain', 'whatsapp' => '081111111111', 'birth_date' => '2000-01-01', 'area_id' => Area::first()->id, 'pin_hash' => 'x']);
        $heldByOther = $board->slots()->where('status', 'empty')->first();
        $heldByOther->update(['status' => 'held', 'holder_id' => $otherParticipant->id, 'held_until' => now()->addMinutes(10)]);
        $this->post('/participant/slot', ['code' => $heldByOther->code])->assertSessionHasErrors('code');

        // Slot kosong lain di papan yang sama: diterima dengan tanda, slot yang ditunjuk dilepas.
        $assigned = $claim->slot;
        $different = $board->slots()->where('status', 'empty')->first();
        $this->post('/participant/slot', ['code' => $different->code])->assertRedirectContains('/participant/klaim/diperiksa/');
        $claim->refresh();
        $this->assertContains('different_slot', $claim->flags());
        $this->assertSame($different->id, $claim->slot_id);
        $this->assertSame('empty', $assigned->fresh()->status);
        $this->assertDatabaseHas('rejects', ['reason' => 'wrong_board']);
        $this->assertDatabaseHas('rejects', ['reason' => 'slot_used']);
    }

    public function test_late_code_is_accepted_with_flag(): void
    {
        $this->readyParticipant();
        $this->prizesAre('token');
        $claim = $this->uploadPhoto(seed: 2);
        $this->travel(31)->minutes();

        $this->post('/participant/slot', ['code' => $claim->slot->code])->assertRedirectContains('/participant/klaim/diperiksa/');
        $this->assertContains('late_code', $claim->fresh()->flags());
    }

    public function test_only_assigned_slot_code_is_sent_to_the_browser(): void
    {
        $this->readyParticipant();
        $this->uploadPhoto(seed: 3);

        $claim = Claim::latest('id')->first();
        // Hanya kode slot yang ditunjuk yang dikirim; papan tidak pernah mengirim kode slot lain.
        $this->get('/participant/slot')->assertInertia(fn ($page) => $page
            ->where('claim.slot.code', $claim->slot->code)
            ->where('claim.claim_code', $claim->claim_code));
        $this->get('/participant/papan')->assertInertia(fn ($page) => $page->missing('slots.0.code'));
    }

    public function test_consent_is_required_before_claiming(): void
    {
        $this->post('/participant/daftar', $this->register());
        Participant::first()->update(['is_student' => true]);

        $this->post('/participant/klaim/mulai', ['outlet' => 'W07'])->assertRedirect('/participant/persetujuan');
    }

    public function test_paused_program_blocks_claim_screens(): void
    {
        $this->readyParticipant();
        Setting::put('program_paused', '1');

        $this->get('/participant/foto')->assertRedirect('/participant/papan?outlet=W07');
        $this->get('/participant/papan')->assertInertia(fn ($page) => $page->where('paused', true)->where('canClaim', false));
    }

    public function test_logged_in_participant_with_scanned_outlet_goes_straight_to_photo(): void
    {
        $this->readyParticipant();

        // Baru buka papan (warung default), belum pernah scan QR: halaman Scan tetap tampil.
        $this->get('/participant/papan');
        $this->get('/participant/scan')->assertOk();

        // Setelah QR terbaca: menu Scan langsung ke foto, kecuali minta ganti warung.
        $this->get('/w07');
        $this->get('/participant/scan')->assertRedirect('/participant/foto?outlet=W07');
        $this->get('/participant/scan?ganti=1')->assertOk();

        // Setelah keluar, warung yang terbaca dilupakan.
        $this->post('/participant/keluar');
        $this->get('/participant/scan')->assertOk();
    }

    public function test_returning_participant_goes_to_photo_at_last_claimed_outlet(): void
    {
        $this->readyParticipant();
        $claim = $this->uploadPhoto(seed: 41);
        $this->post('/participant/slot', ['code' => $claim->slot->code]);

        // Keluar lalu masuk lagi dari Beranda tanpa scan QR: warung klaim terakhir dipakai.
        $this->post('/participant/keluar');
        $this->post('/participant/masuk', ['whatsapp' => '081234567890', 'pin' => '4826']);
        $this->get('/participant/scan')->assertRedirect('/participant/foto?outlet=W07');
        $this->get('/participant/scan?ganti=1')->assertOk();
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

        $this->get('/x99')->assertRedirect('/participant/qr-tidak-dikenal');
        $this->assertDatabaseHas('rejects', ['reason' => 'unknown_qr']);
    }

    public function test_scan_resolves_known_outlet_and_rejects_unknown_code(): void
    {
        $this->post('/participant/scan', ['code' => 'w07'])
            ->assertRedirect('/participant/masuk');

        $this->post('/participant/scan', ['code' => 'XX99'])
            ->assertRedirect('/participant/qr-tidak-dikenal');

        // QR asli berisi alamat titik (PRD FR-06).
        $this->post('/participant/scan', ['code' => 'https://pickme.example/w07'])
            ->assertRedirect('/participant/masuk');
        $this->post('/participant/scan', ['code' => 'https://toko-lain.example/promo'])
            ->assertRedirect('/participant/qr-tidak-dikenal');
    }

    public function test_non_student_cannot_start_a_claim(): void
    {
        $this->post('/participant/daftar', $this->register());
        $this->post('/participant/persetujuan', ['accepted' => true]);
        $this->post('/participant/mahasiswa', ['is_student' => false]);

        $this->post('/participant/klaim/mulai')->assertRedirect('/participant/mahasiswa/khusus');
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
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM-0001', 'status' => 'approved']);
        $voucher = Voucher::create(['claim_id' => $claim->id, 'code' => 'KGR-TOKEN1', 'type' => 'token', 'status' => 'pending_data']);

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
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM-0002', 'status' => 'approved']);
        Voucher::create(['claim_id' => $claim->id, 'code' => 'KGR-BENSIN', 'type' => 'bensin', 'status' => 'pending']);

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
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM-0003', 'status' => 'approved']);
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

    public function test_mystery_gift_at_fifth_cap_can_be_a_voucher(): void
    {
        config(['participant.mystery_voucher_chance' => 100]);
        $participant = $this->readyParticipant();

        foreach (range(1, 5) as $i) {
            $claim = $this->uploadPhoto(seed: 10 + $i);
            $this->post('/participant/slot', ['code' => $claim->slot->code]);
        }

        $this->assertSame(5, $participant->fresh()->caps);
        $this->assertSame(1, Voucher::where('source', 'mystery')->count());
        $this->assertSame(0, Gift::where('type', 'mystery_pack')->count());
        // Mystery gift tampil paling atas di Hadiahku.
        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.mystery', true)
            ->has('rewards', 6)
        );
    }

    public function test_free_pack_mystery_gift_waits_for_admin(): void
    {
        config(['participant.mystery_voucher_chance' => 0]);
        $participant = $this->readyParticipant();

        foreach (range(1, 5) as $i) {
            $claim = $this->uploadPhoto(seed: 30 + $i);
            $this->post('/participant/slot', ['code' => $claim->slot->code]);
        }

        $this->assertSame(5, $participant->fresh()->caps);
        // Pemberitahuan di layar hasil klaim cap ke-5.
        $this->get('/participant/klaim/berhasil')->assertInertia(fn ($page) => $page
            ->where('mystery.title', 'Mystery gift: 1 bungkus gratis')
        );
        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page
            ->where('rewards.0.title', 'Mystery gift: 1 bungkus gratis')
            ->where('rewards.0.status_label', 'Menunggu admin')
        );
    }

    public function test_sent_voucher_expires_after_validity(): void
    {
        $participant = $this->readyParticipant();
        $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id, 'claim_code' => 'KLM-0004', 'status' => 'approved']);
        $voucher = Voucher::create(['claim_id' => $claim->id, 'code' => 'KGR-OLD001', 'type' => 'voucher', 'status' => 'sent', 'expires_at' => now()->subDay()]);

        $this->get('/participant/hadiah')->assertInertia(fn ($page) => $page->where('rewards.0.status_label', 'Kadaluarsa'));
        $this->artisan('vouchers:expire')->assertSuccessful();
        $this->assertSame('expired', $voucher->fresh()->status);
    }

    public function test_leaderboard_ranks_by_approved_claims_then_who_reached_first(): void
    {
        $outlet = Outlet::first();
        $area = Area::first()->id;
        $make = function (string $name, string $wa, array $times) use ($outlet, $area) {
            $p = Participant::create(['name' => $name, 'whatsapp' => $wa, 'birth_date' => '2000-01-01', 'area_id' => $area, 'pin_hash' => 'x', 'caps' => count($times)]);
            foreach ($times as $i => $time) {
                Claim::create(['participant_id' => $p->id, 'outlet_id' => $outlet->id, 'claim_code' => "KLM-{$wa}{$i}", 'status' => 'approved', 'submitted_at' => $time]);
            }
            // Klaim antre dan ditolak tidak dihitung.
            Claim::create(['participant_id' => $p->id, 'outlet_id' => $outlet->id, 'claim_code' => "KLM-{$wa}X", 'status' => 'rejected', 'submitted_at' => now()]);

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
