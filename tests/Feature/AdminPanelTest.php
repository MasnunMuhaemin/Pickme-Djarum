<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Area;
use App\Models\Board;
use App\Models\Claim;
use App\Models\ClaimPhoto;
use App\Models\Gift;
use App\Models\MysteryPrize;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Partner;
use App\Models\PartnerPayout;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherType;
use App\Services\RewardCreationService;
use App\Services\SlotPrizeService;
use App\Support\ActivityLogger;
use App\Support\ProgramParameters;
use App\Support\RewardPresenter;
use Database\Seeders\AdminSeeder;
use Database\Seeders\CustomerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([CustomerSeeder::class, AdminSeeder::class]);
        $this->admin = User::where('is_admin', true)->firstOrFail();
    }

    private function participant(string $wa = '081200000001'): Participant
    {
        return Participant::create(['name' => 'Tari', 'whatsapp' => $wa, 'birth_date' => '2000-01-01', 'area_id' => Area::first()->id, 'pin_hash' => 'x', 'is_student' => true]);
    }

    /** Klaim berhasil di slot kosong dengan jenis hadiah tertentu; hadiahnya langsung dibuat seperti alur peserta. */
    private function rewardedClaim(string $prize = 'voucher', ?Participant $participant = null, ?int $voucherTypeId = null): Claim
    {
        $slot = Slot::where('status', 'empty')->firstOrFail();
        $slot->update(['prize_type' => $prize, 'status' => 'used', 'used_at' => now()] + ($voucherTypeId ? ['voucher_type_id' => $voucherTypeId] : []));

        $claim = Claim::create([
            'participant_id' => ($participant ?? $this->participant())->id,
            'outlet_id' => Outlet::first()->id,
            'slot_id' => $slot->id,
            'code' => $slot->code,
            'claim_code' => 'KLM'.random_int(1000, 9999),
            'status' => 'approved',
            'submitted_at' => now(),
        ]);

        return app(RewardCreationService::class)->create($claim->fresh(['slot', 'participant']));
    }

    public function test_only_admins_can_open_the_panel(): void
    {
        $this->get('/admin')->assertRedirect('/login');

        $user = User::factory()->create(['is_admin' => false]);
        $this->actingAs($user)->get('/admin')->assertForbidden();

        $this->actingAs($this->admin)->get('/admin')->assertOk();
        $this->actingAs($this->admin)->get('/dashboard')->assertRedirect('/admin');
    }

    public function test_every_admin_page_renders(): void
    {
        // Ada data supaya semua query halaman ikut berjalan (peringkat, pemenuhan, kirim voucher, log).
        foreach (['voucher', 'token', 'bensin', 'merch'] as $i => $prize) {
            $claim = $this->rewardedClaim($prize, $this->participant('08120000010'.$i));
            $this->actingAs($this->admin);
        }

        $this->actingAs($this->admin);
        foreach (['/admin', '/admin/antrean-foto', '/admin/pemenuhan', '/admin/pemenuhan?tab=bensin', '/admin/pemenuhan?tab=barang',
            '/admin/kirim-voucher', '/admin/peringkat', '/admin/papan', '/admin/pembayaran',
            '/admin/master-data/warung', '/admin/master-data/area', '/admin/master-data/mitra', '/admin/master-data/jenis-voucher',
            '/admin/pengaturan', '/admin/log', '/admin/pengguna', '/admin/pengguna?tab=peserta'] as $url) {
            $this->get($url)->assertOk();
        }
        // Alamat lama diarahkan ke menu yang baru.
        $this->get('/admin/master-data')->assertInertia(fn ($page) => $page->component('admin/master-data')->has('counts')->has('stock'));
        foreach (['/admin/generator', '/admin/master-data/isi-papan', '/admin/pemenuhan?tab=bantuan'] as $url) {
            $this->get($url)->assertOk();
        }
        $this->get('/admin/mitra')->assertRedirect('/admin/pembayaran');
        $this->get('/admin/mitra?tab=akun')->assertRedirect('/admin/master-data/mitra');
    }

    public function test_outlet_account_belongs_to_one_warung_and_follows_its_area(): void
    {
        $this->actingAs($this->admin);
        $outlet = Outlet::first();

        $this->post('/admin/mitra', ['name' => 'Bu Warung', 'type' => 'outlet', 'whatsapp' => '081299990001'])->assertSessionHasErrors('outlet_id');
        $this->post('/admin/mitra', ['name' => 'Bu Warung', 'type' => 'outlet', 'outlet_id' => $outlet->id, 'whatsapp' => '081299990001'])->assertRedirect();
        $account = Partner::where('outlet_id', $outlet->id)->firstOrFail();
        $this->assertSame($outlet->area_id, $account->area_id);

        // Satu akun per warung.
        $this->post('/admin/mitra', ['name' => 'Lain', 'type' => 'outlet', 'outlet_id' => $outlet->id, 'whatsapp' => '081299990002'])->assertSessionHasErrors('outlet_id');

        // Area utama warung berubah: akunnya ikut.
        $other = Area::where('id', '!=', $outlet->area_id)->firstOrFail();
        $this->put("/admin/master-data/titik/{$outlet->id}", ['name' => $outlet->name, 'whatsapp' => '081299990010', 'area_ids' => [$other->id]])->assertRedirect();
        $this->assertSame($other->id, $account->fresh()->area_id);

        // Mitra voucher tidak punya area (PRD bagian 16).
        $this->post('/admin/mitra', ['name' => 'Kopi Tanpa Area', 'type' => 'umum', 'whatsapp' => '081299990003'])->assertSessionHasNoErrors();
    }

    public function test_token_success_needs_reference_and_third_failure_needs_admin(): void
    {
        $claim = $this->rewardedClaim('token');
        $this->actingAs($this->admin);
        $voucher = $claim->fresh()->voucher;
        $voucher->update(['status' => 'pending_process', 'destination' => '12345678901']);

        $this->post("/admin/pemenuhan/token/{$voucher->id}/berhasil", ['reference' => ''])->assertSessionHasErrors('reference');

        foreach ([1, 2, 3] as $attempt) {
            // Peserta mengisi ulang nomor tujuan.
            Voucher::whereKey($voucher->id)->update(['status' => 'pending_process']);
            $this->post("/admin/pemenuhan/token/{$voucher->id}/gagal", ['reason' => 'Nomor tidak terdaftar'])->assertRedirect();
        }
        $this->assertSame('needs_admin', $voucher->fresh()->status);
        $this->assertSame(3, $voucher->fresh()->failed_attempts);

        Voucher::whereKey($voucher->id)->update(['status' => 'pending_process']);
        $this->post("/admin/pemenuhan/token/{$voucher->id}/berhasil", ['reference' => 'REF-001'])->assertRedirect();
        $this->assertSame('sent', $voucher->fresh()->status);
        $this->assertSame('REF-001', $voucher->fresh()->reference);
    }

    public function test_fuel_and_goods_fulfilment_flow(): void
    {
        $this->actingAs($this->admin);
        $fuelClaim = $this->rewardedClaim('bensin');
        $fuel = $fuelClaim->fresh()->voucher;

        $this->post("/admin/pemenuhan/bensin/{$fuel->id}/hubungi")->assertRedirect();
        $this->assertSame('contacted', $fuel->fresh()->status);
        $this->post("/admin/pemenuhan/bensin/{$fuel->id}/serahkan", ['date' => now()->toDateString(), 'recipient' => ''])->assertSessionHasErrors('recipient');
        $this->post("/admin/pemenuhan/bensin/{$fuel->id}/serahkan", ['date' => now()->toDateString(), 'recipient' => 'Tari'])->assertRedirect();
        $this->assertSame('handed_over', $fuel->fresh()->status);

        $goodsClaim = $this->rewardedClaim('merch', $this->participant('081200000002'));
        $gift = Gift::where('claim_id', $goodsClaim->id)->firstOrFail();
        $this->post("/admin/pemenuhan/barang/{$gift->id}/kirim")->assertStatus(422); // belum ada alamat
        $gift->update(['status' => 'ready_to_ship', 'area' => 'Sukapura', 'address' => 'Jl. Contoh 1']);
        $this->post("/admin/pemenuhan/barang/{$gift->id}/kirim")->assertRedirect();
        $this->post("/admin/pemenuhan/barang/{$gift->id}/selesai")->assertRedirect();
        $this->assertSame('done', $gift->fresh()->status);
        $this->assertNotNull($gift->fresh()->shipped_at);
    }

    public function test_voucher_dispatch_marks_sent(): void
    {
        // Voucher mitra (bukan pulsa/kuota, yang menunggu nomor HP dan tidak dikirim lewat layar ini).
        $claim = $this->rewardedClaim('voucher', voucherTypeId: VoucherType::where('fulfillment', 'mitra')->value('id'));
        $this->actingAs($this->admin);
        $voucher = $claim->fresh()->voucher;

        $this->get('/admin/kirim-voucher')->assertInertia(fn ($page) => $page->where('rows.0.code', $voucher->code));
        $this->post("/admin/kirim-voucher/{$voucher->id}/terkirim")->assertRedirect();
        $this->assertNotNull($voucher->fresh()->sent_at);

        // Yang sudah dikirim tetap tampil di daftar, dengan status terkirim.
        $this->get('/admin/kirim-voucher')->assertInertia(fn ($page) => $page
            ->where('rows.0.code', $voucher->code)
            ->whereNot('rows.0.sent_at', null)
            ->where('counts.sudah', 1));
        $this->get('/admin/kirim-voucher?tab=perlu')->assertInertia(fn ($page) => $page->where('rows', []));
    }

    public function test_emergency_pause_needs_reason_and_confirmation_and_blocks_claims(): void
    {
        $this->actingAs($this->admin);
        $this->post('/admin/darurat/jeda', ['scope' => 'program', 'reason' => 'Uji', 'confirm' => true])->assertSessionHasErrors('reason');
        $this->post('/admin/darurat/jeda', ['scope' => 'program', 'reason' => 'Gangguan sistem', 'confirm' => false])->assertSessionHasErrors('confirm');
        $this->post('/admin/darurat/jeda', ['scope' => 'program', 'reason' => 'Gangguan sistem', 'confirm' => true])->assertRedirect();
        $this->assertTrue(Setting::programPaused());
        $this->assertFalse(Outlet::first()->isActive());

        $this->post('/admin/darurat/lanjutkan', ['scope' => 'program'])->assertRedirect();
        $this->assertFalse(Setting::programPaused());

        $outlet = Outlet::first();
        $this->post('/admin/darurat/jeda', ['scope' => 'outlet', 'outlet_id' => $outlet->id, 'reason' => 'Papan rusak', 'confirm' => true]);
        $this->assertFalse($outlet->fresh()->isActive());
        $this->assertSame(1, ActivityLog::where('action', 'outlet.paused')->count());
    }

    public function test_settings_update_overrides_config_and_is_logged(): void
    {
        $this->actingAs($this->admin)->get('/admin/pengaturan')->assertOk();
        $values = collect(ProgramParameters::editable())->mapWithKeys(fn ($m, $k) => [str_replace('.', '__', $k) => (int) config($k)])->all();
        $values['participant__flags__late_code_minutes'] = 45;

        $this->post('/admin/pengaturan', ['values' => $values])->assertRedirect();
        $this->assertSame('45', Setting::get('param.participant.flags.late_code_minutes'));
        $this->assertDatabaseHas('activity_logs', ['action' => 'settings.updated']);

        // Nilai tersimpan diterapkan saat aplikasi berjalan.
        config(['participant.flags.late_code_minutes' => 30]);
        ProgramParameters::apply();
        $this->assertSame(45, config('participant.flags.late_code_minutes'));
    }

    public function test_partner_pin_reset_payout_and_correction(): void
    {
        $this->actingAs($this->admin);
        Storage::fake('local');
        $this->post('/admin/mitra', ['name' => 'Kopi Baru', 'type' => 'umum', 'area_id' => Area::first()->id, 'whatsapp' => '081299990000'])
            ->assertSessionHas('partner_pin');
        $partner = Partner::where('name', 'Kopi Baru')->firstOrFail();
        $this->assertNotNull($partner->pin_hash);

        $this->post("/admin/mitra/{$partner->id}/koreksi", ['count' => 3, 'reason' => ''])->assertSessionHasErrors('reason');
        $this->post("/admin/mitra/{$partner->id}/koreksi", ['count' => 3, 'reason' => 'Struk mitra lebih banyak'])->assertRedirect();
        // Bukti transfer wajib berupa file (foto atau PDF).
        $this->post("/admin/mitra/{$partner->id}/dibayar", ['paid_at' => now()->toDateString()])->assertSessionHasErrors('proof_file');
        $this->post("/admin/mitra/{$partner->id}/dibayar", [
            'paid_at' => now()->toDateString(),
            'proof_file' => UploadedFile::fake()->create('transfer.pdf', 120, 'application/pdf'),
        ])->assertSessionHasNoErrors();
        $payout = PartnerPayout::where('partner_id', $partner->id)->firstOrFail();
        Storage::disk('local')->assertExists($payout->proof_path);
        $this->get("/admin/mitra/bukti-bayar/{$payout->id}")->assertOk();
        $this->get('/admin/pembayaran/ekspor')->assertOk();
        $this->post("/admin/mitra/{$partner->id}/koreksi", ['count' => 4, 'reason' => 'Coba ubah setelah dibayar'])->assertStatus(422);
    }

    public function test_vouchers_follow_master_data_voucher_types(): void
    {
        // Seeder mengisi semua slot voucher/token/bensin dengan jenis voucher dari master data (merch dan limited tanpa jenis).
        $this->assertSame(0, Slot::whereNull('voucher_type_id')->whereIn('prize_type', ['voucher', 'token', 'bensin'])->count());

        $kopi = VoucherType::where('name', 'Kopi')->firstOrFail();
        $claim = $this->rewardedClaim('voucher', null, $kopi->id);
        $this->actingAs($this->admin);

        $voucher = $claim->fresh()->voucher;
        $this->assertSame($kopi->id, $voucher->voucher_type_id);
        $this->assertSame(30000, $voucher->value);
        $this->assertSame($kopi->partner_id, $voucher->partner_id);
        $reward = RewardPresenter::voucher($voucher);
        $this->assertSame('Voucher Kopi', $reward['title']);
        $this->assertStringContainsString('Kopi Groei', $reward['description']);

        // Jenis yang tidak cocok dengan hadiah slot diganti jenis yang cocok.
        $token = $this->rewardedClaim('token', $this->participant('081200000077'), $kopi->id);
        $this->assertSame('agregator', $token->fresh()->voucher->voucherType->fulfillment);
    }

    public function test_board_print_sheet_lists_slot_codes_and_contents(): void
    {
        $outlet = Outlet::first();
        $this->actingAs($this->admin)->get("/admin/papan/{$outlet->code}/cetak")->assertInertia(fn ($page) => $page
            ->component('admin/cetak-papan')
            ->where('outlet.qr', url($outlet->code))
            ->has('slots', 25)
            ->where('slots.0.code', $outlet->board->slots()->where('position', 'A1')->value('code')));
        $this->assertDatabaseHas('activity_logs', ['action' => 'board.printed', 'actor_type' => 'admin']);
    }

    public function test_new_outlet_gets_qr_address_and_25_slots(): void
    {
        [$first, $second] = Area::orderBy('id')->take(2)->get();
        $this->actingAs($this->admin)->post('/admin/master-data/titik', ['code' => 'w21', 'name' => 'Warung Baru'])->assertSessionHasErrors('area_ids');
        $this->post('/admin/master-data/titik', ['code' => 'w21', 'name' => 'Warung Baru', 'area_ids' => [$first->id, $second->id]])->assertSessionHasErrors('whatsapp');
        $this->post('/admin/master-data/titik', ['code' => 'w21', 'name' => 'Warung Baru', 'whatsapp' => '081299990011', 'area_ids' => [$first->id, $second->id]])->assertRedirect();
        $outlet = Outlet::where('code', 'W21')->firstOrFail();
        $this->assertSame('081299990011', $outlet->whatsapp);
        // Satu warung mencakup banyak area kos; area pertama jadi area utama.
        $this->assertEqualsCanonicalizing([$first->id, $second->id], $outlet->areas()->pluck('areas.id')->all());
        $this->assertSame($first->id, $outlet->area_id);
        // Papan baru kosong sampai diisi generator kode unik.
        $this->assertSame(0, $outlet->board->slots()->count());
        $this->post('/admin/generator/isi')->assertSessionHasNoErrors();
        $this->assertSame(25, $outlet->board->slots()->count());
        $this->assertSame(0, $outlet->board->slots()->whereNull('voucher_type_id')->whereIn('prize_type', ['voucher', 'token', 'bensin'])->count());
        // Admin yang men-scan dianggap uji QR; peserta (tanpa login admin) diarahkan masuk.
        auth()->logout();
        $this->get('/w21')->assertRedirect('/participant/masuk');
    }

    public function test_log_export_is_csv(): void
    {
        $this->actingAs($this->admin)->post('/admin/peringkat/tutup', ['confirm' => true])->assertRedirect();
        $response = $this->get('/admin/log/ekspor');
        $response->assertOk();
        $this->assertStringContainsString('Menutup peringkat', $response->streamedContent());
    }

    public function test_admin_can_delete_a_log_and_the_deletion_is_logged(): void
    {
        $this->actingAs($this->admin);
        ActivityLogger::log('ranking.closed', 'ranking', null, [], $this->admin);
        $log = ActivityLog::latest('id')->first();

        $this->delete("/admin/log/{$log->id}")->assertRedirect();

        $this->assertModelMissing($log);
        $trace = ActivityLog::latest('id')->first();
        $this->assertSame('log.deleted', $trace->action);
        $this->assertStringContainsString('Menutup peringkat', $trace->metadata['reason']);
    }

    public function test_board_only_uses_voucher_types_chosen_for_the_warung(): void
    {
        VoucherType::query()->delete();
        $kopi = VoucherType::create(['name' => 'Kopi', 'partner_label' => 'Kopi', 'value' => 10000, 'quantity' => 50, 'fulfillment' => 'mitra']);
        $laundry = VoucherType::create(['name' => 'Laundry', 'partner_label' => 'Laundry', 'value' => 20000, 'quantity' => 50, 'fulfillment' => 'mitra']);
        $token = VoucherType::create(['name' => 'Token', 'partner_label' => 'Agregator', 'value' => 20000, 'quantity' => 50, 'fulfillment' => 'agregator']);

        $prizes = app(SlotPrizeService::class);
        $outlet = $prizes->createOutlet('W90', 'Warung Uji', [Area::first()->id], [$kopi->id]);
        $prizes->fillEmptyBoards();
        $slots = $outlet->board->slots()->get();
        // Voucher mitra hanya jenis yang dipilih; token tidak dipilih sama sekali, jadi tetap dari semua jenis token.
        $this->assertTrue($slots->where('prize_type', 'voucher')->every(fn (Slot $s) => $s->voucher_type_id === $kopi->id));
        $this->assertTrue($slots->where('prize_type', 'token')->every(fn (Slot $s) => $s->voucher_type_id === $token->id));

        // Pilihan diganti lewat menu Warung: slot kosong ikut, slot yang sudah diambil tidak berubah.
        $used = $slots->where('prize_type', 'voucher')->first();
        $used->update(['status' => 'used']);
        $this->actingAs($this->admin)->put("/admin/master-data/titik/{$outlet->id}", [
            'name' => 'Warung Uji', 'whatsapp' => '081299990012', 'area_ids' => [Area::first()->id], 'voucher_type_ids' => [$laundry->id],
        ])->assertRedirect();

        $after = $outlet->board->slots()->where('prize_type', 'voucher')->get();
        $this->assertSame($kopi->id, $after->firstWhere('id', $used->id)->voucher_type_id);
        $this->assertTrue($after->where('status', '!=', 'used')->every(fn (Slot $s) => $s->voucher_type_id === $laundry->id));
    }

    public function test_photo_page_lists_claim_photos_without_approval_actions(): void
    {
        $claim = $this->rewardedClaim('voucher');
        ClaimPhoto::create(['claim_id' => $claim->id, 'path' => 'claims/uji.jpg', 'perceptual_hash' => str_repeat('0', 16), 'hash_version' => 1, 'brightness' => 120]);

        $this->actingAs($this->admin)->get('/admin/antrean-foto')->assertInertia(fn ($page) => $page
            ->component('admin/antrean-foto')
            ->where('photos.0.claim_code', $claim->claim_code)
            ->where('photos.0.photo_url', route('admin.antrean-foto.foto', $claim))
            ->missing('rejectReasons')
            ->missing('photos.0.can_undo'));
        // Aksi persetujuan sudah tidak ada.
        $this->post("/admin/antrean-foto/{$claim->id}/setujui")->assertNotFound();

        // Detail menampilkan kode voucher hadiah slot itu.
        $this->get('/admin/antrean-foto')->assertInertia(fn ($page) => $page->where('photos.0.voucher_code', $claim->voucher->code));

        // Hapus foto: catatan foto hilang dari galeri, klaim dan hadiahnya tetap, tercatat di log.
        $this->delete("/admin/antrean-foto/{$claim->id}/foto")->assertRedirect();
        $this->assertNull($claim->fresh()->photo);
        $this->assertNotNull($claim->fresh()->voucher);
        $this->assertDatabaseHas('activity_logs', ['action' => 'claim.photo_deleted', 'subject_id' => $claim->id]);
        $this->get('/admin/antrean-foto')->assertInertia(fn ($page) => $page->where('photos', []));
        $this->get('/admin/antrean-foto?warung=W99')->assertInertia(fn ($page) => $page->where('photos', []));
    }

    public function test_voucher_codes_have_no_spaces_or_dashes_and_show_on_board(): void
    {
        // Kode sudah ada di slot sebelum diklaim, dan menjadi kode voucher peserta saat diklaim.
        $slot = Slot::where('status', 'empty')->where('prize_type', '!=', 'merch')->firstOrFail();
        $prepared = $slot->voucher_code;
        $this->assertNotNull($prepared);
        $claim = $this->rewardedClaim('voucher');
        $code = $claim->voucher->code;
        $this->assertSame($claim->slot->voucher_code, $code);
        $this->assertMatchesRegularExpression('/^KGR[A-Z0-9]{6}$/', $code);
        $this->assertSame($code, RewardCreationService::normalizeCode(' '.substr($code, 0, 3).'-'.strtolower(substr($code, 3)).' '));

        $this->actingAs($this->admin)->get('/admin/papan/'.$claim->outlet->code)->assertInertia(fn ($page) => $page
            ->where('selected.slots', fn ($slots) => collect($slots)->contains(fn ($s) => $s['voucher_code'] === $code && $s['claimed'])
                && collect($slots)->contains(fn ($s) => $s['voucher_code'] !== null && ! $s['claimed'])));
    }

    public function test_admin_accounts_can_be_added_and_deactivated_but_not_self(): void
    {
        $this->actingAs($this->admin);
        $this->post('/admin/pengguna/admin', ['name' => 'Admin B', 'email' => 'b@pickme.test', 'password' => 'pendek'])->assertSessionHasErrors('password');
        $this->post('/admin/pengguna/admin', ['name' => 'Admin B', 'email' => 'b@pickme.test', 'password' => 'rahasia123'])->assertRedirect();
        $b = User::where('email', 'b@pickme.test')->firstOrFail();
        $this->assertTrue($b->is_admin);

        $this->post("/admin/pengguna/admin/{$this->admin->id}/status")->assertSessionHasErrors('admin');
        $this->post("/admin/pengguna/admin/{$b->id}/status")->assertRedirect();
        $this->assertFalse($b->fresh()->is_admin);
        $this->actingAs($b->fresh())->get('/admin')->assertForbidden();
    }

    public function test_participants_can_be_edited_reset_and_blocked_but_not_created(): void
    {
        $p = $this->participant();
        $this->actingAs($this->admin);
        $this->get('/admin/pengguna?tab=peserta')->assertInertia(fn ($page) => $page->where('participants.0.id', $p->id));
        $this->get('/admin/pengguna?tab=peserta&q=zzzz')->assertInertia(fn ($page) => $page->where('participants', []));
        $this->get('/admin/pengguna?tab=peserta&q='.substr($p->whatsapp, -4))->assertInertia(fn ($page) => $page->where('participants.0.id', $p->id));
        $this->post('/admin/pengguna/peserta', ['name' => 'Baru'])->assertNotFound();

        $this->post("/admin/pengguna/peserta/{$p->id}/pin")->assertRedirect()->assertSessionHas('partner_pin');
        $pin = session('partner_pin')['pin'];
        $this->assertTrue(Hash::check($pin, $p->fresh()->pin_hash));
        // Tautan WhatsApp ke nomor peserta dengan pesan berisi PIN baru.
        $this->assertStringStartsWith('https://wa.me/62', session('partner_pin')['wa']);
        $this->assertStringContainsString($pin, rawurldecode(session('partner_pin')['wa']));
        $this->get('/admin/pengguna?tab=peserta')->assertInertia(fn ($page) => $page->where('participants.0.wa', fn ($wa) => str_starts_with($wa, 'https://wa.me/62')));

        $this->post("/admin/pengguna/peserta/{$p->id}/blokir", ['reason' => ''])->assertSessionHasErrors('reason');
        $this->post("/admin/pengguna/peserta/{$p->id}/blokir", ['reason' => 'Foto dipakai berulang'])->assertRedirect();
        $this->assertNotNull($p->fresh()->blocked_at);

        // Peserta terblokir tidak bisa masuk; yang sedang masuk dikeluarkan.
        $this->post('/participant/masuk', ['whatsapp' => $p->whatsapp, 'pin' => $pin])->assertSessionHasErrors('pin');
        $this->withSession(['participant_id' => $p->id])->get('/participant/hadiah')->assertRedirect('/participant/masuk');

        $this->post("/admin/pengguna/peserta/{$p->id}/blokir")->assertRedirect();
        $this->assertNull($p->fresh()->blocked_at);
    }

    public function test_server_search_on_log_and_photos_and_partner_can_be_edited(): void
    {
        $claim = $this->rewardedClaim('voucher');
        ClaimPhoto::create(['claim_id' => $claim->id, 'path' => 'claims/uji.jpg', 'perceptual_hash' => str_repeat('0', 16), 'hash_version' => 1, 'brightness' => 120]);
        $this->actingAs($this->admin);

        // Foto klaim: cari kode voucher (boleh dengan strip/spasi) dan nama peserta.
        $code = $claim->voucher->code;
        $this->get('/admin/antrean-foto?q='.urlencode(substr($code, 0, 3).'-'.substr($code, 3)))->assertInertia(fn ($page) => $page->where('photos.0.claim_code', $claim->claim_code));
        $this->get('/admin/antrean-foto?q=Tari')->assertInertia(fn ($page) => $page->where('photos.0.claim_code', $claim->claim_code));
        $this->get('/admin/antrean-foto?q=tidakada')->assertInertia(fn ($page) => $page->where('photos', []));

        // Mitra: ubah nama, nomor, dan jenis; tercatat di log.
        $partner = Partner::where('type', '!=', 'outlet')->firstOrFail();
        $this->put("/admin/mitra/{$partner->id}", ['name' => 'Kopi Baru Sekali', 'whatsapp' => '0812', 'type' => 'kuota'])->assertSessionHasErrors('whatsapp');
        $this->put("/admin/mitra/{$partner->id}", ['name' => 'Kopi Baru Sekali', 'whatsapp' => '081299990099', 'type' => 'kuota'])->assertRedirect();
        $this->assertSame(['Kopi Baru Sekali', '081299990099', 'kuota'], array_values($partner->fresh()->only(['name', 'whatsapp', 'type'])));

        // Log: cari lewat label aksi berbahasa Indonesia.
        $this->get('/admin/log?q='.urlencode('mengubah data mitra'))->assertInertia(fn ($page) => $page
            ->where('search', 'mengubah data mitra')
            ->where('logs.0.action', 'Mengubah data mitra'));
        $this->get('/admin/log?q=zzzzzz')->assertInertia(fn ($page) => $page->where('logs', []));
    }

    public function test_admin_edits_voucher_lines_shown_to_participants(): void
    {
        $this->actingAs($this->admin)
            ->post('/admin/pengaturan/kalimat-voucher', ['lines' => '  kalimat satu 

kalimat dua
'])
            ->assertSessionHasNoErrors();
        $this->assertSame(['kalimat satu', 'kalimat dua'], Setting::voucherLines());

        $this->post('/admin/pengaturan/kalimat-voucher', ['lines' => str_repeat('a', 61)])->assertSessionHasErrors('lines');
        $this->post('/admin/pengaturan/kalimat-voucher', ['lines' => '
 
'])->assertSessionHasErrors('lines');
        $this->assertSame(['kalimat satu', 'kalimat dua'], Setting::voucherLines());

        $this->get('/participant')->assertInertia(fn ($page) => $page->where('voucherLines', ['kalimat satu', 'kalimat dua']));
    }

    public function test_admin_cannot_reject_claims(): void
    {
        $claim = $this->rewardedClaim('voucher', $this->participant(), VoucherType::where('fulfillment', 'mitra')->value('id'));
        $this->actingAs($this->admin)->post("/admin/antrean-foto/{$claim->id}/tolak", ['reason' => 'Foto bukan bungkus program'])->assertNotFound();
        $this->assertSame('approved', $claim->fresh()->status);
    }

    public function test_partner_maps_link_is_validated_and_shown_to_participant(): void
    {
        $partner = Partner::create(['name' => 'Kopi Peta', 'type' => 'umum', 'whatsapp' => '081211112222', 'status' => 'active']);
        $this->actingAs($this->admin);
        $base = ['name' => 'Kopi Peta', 'whatsapp' => '081211112222', 'type' => 'umum', 'address' => 'Jl. Sukabirus 12'];

        $this->put("/admin/mitra/{$partner->id}", [...$base, 'maps_url' => 'https://contoh.com/peta'])->assertSessionHasErrors('maps_url');
        $this->put("/admin/mitra/{$partner->id}", [...$base, 'maps_url' => 'https://maps.app.goo.gl/abc123'])->assertSessionHasNoErrors();
        $this->assertSame('Jl. Sukabirus 12', $partner->fresh()->address);

        $claim = $this->rewardedClaim('voucher', voucherTypeId: VoucherType::where('fulfillment', 'mitra')->value('id'));
        $claim->voucher->update(['partner_id' => $partner->id]);
        $this->withSession(['participant_id' => $claim->participant_id])
            ->get('/participant/voucher/'.$claim->voucher->code)
            ->assertInertia(fn ($page) => $page->where('voucher.maps_url', 'https://maps.app.goo.gl/abc123'));
    }

    public function test_print_export_and_install_guide(): void
    {
        $this->actingAs($this->admin);
        $outlet = Outlet::first();
        $this->get('/admin/cetak-voucher')->assertInertia(fn ($page) => $page->component('admin/cetak-voucher')->where('lastExport', null));
        $csv = $this->get("/admin/cetak-voucher/ekspor?titik={$outlet->code}")->assertOk()->streamedContent();
        $this->assertSame(26, substr_count($csv, chr(10))); // header + 25 slot
        $this->assertNotNull(Setting::get('voucher_export_at'));

        $outlet->board->slots()->update(['installed_at' => null]);
        $this->get("/admin/papan/{$outlet->code}/pasang")->assertInertia(fn ($page) => $page->where('next', 'A1'));
        $this->post("/admin/papan/{$outlet->code}/pasang", ['position' => 'A1', 'installed' => true])->assertRedirect();
        $this->get("/admin/papan/{$outlet->code}/pasang")->assertInertia(fn ($page) => $page->where('next', 'A2'));
        $this->post("/admin/papan/{$outlet->code}/pasang", ['position' => 'Z9', 'installed' => true])->assertSessionHasErrors('position');
    }

    public function test_mystery_gift_admin_toggle_chance_and_pack_done(): void
    {
        $this->actingAs($this->admin);
        $this->get('/admin/mystery-gift')->assertInertia(fn ($page) => $page->component('admin/mystery-gift')->where('enabled', true));

        $this->post('/admin/mystery-gift/peluang', ['chance' => 150])->assertSessionHasErrors('chance');
        $this->post('/admin/mystery-gift/peluang', ['chance' => 30])->assertSessionHasNoErrors();
        $this->assertSame('30', (string) Setting::get('param.participant.mystery_voucher_chance'));

        $claim = $this->rewardedClaim('merch');
        $gift = Gift::create(['claim_id' => $claim->id, 'type' => 'mystery_pack', 'status' => 'pending']);
        $this->post("/admin/mystery-gift/produk/{$gift->id}/selesai")->assertRedirect();
        $this->assertSame('done', $gift->fresh()->status);

        // Dimatikan: peserta yang mencapai cap ke-5 tidak mendapat mystery gift.
        $this->post('/admin/mystery-gift/aktif');
        $this->assertFalse((bool) Setting::get('mystery_enabled', true));
        $participant = $this->participant('081200009999');
        foreach (range(1, 5) as $i) {
            $this->rewardedClaim('voucher', $participant, VoucherType::where('fulfillment', 'mitra')->value('id'));
        }
        $this->assertSame(5, $participant->fresh()->caps);
        $this->assertFalse(Voucher::whereIn('claim_id', $participant->claims()->pluck('id'))->where('source', 'mystery')->exists());
        $this->assertFalse(Gift::whereIn('claim_id', $participant->claims()->pluck('id'))->where('type', 'mystery_pack')->exists());
    }

    public function test_mystery_prizes_and_access_list_are_managed_in_cms(): void
    {
        $this->actingAs($this->admin);
        $this->post('/admin/mystery-gift/hadiah', ['name' => 'Voucher barbershop', 'fulfillment' => 'mitra', 'stock' => 3])->assertSessionHasErrors('partner_id');
        $partner = Partner::create(['name' => 'Barber Rapi', 'type' => 'umum', 'status' => 'active']);
        $this->post('/admin/mystery-gift/hadiah', ['name' => 'Voucher barbershop', 'fulfillment' => 'mitra', 'partner_id' => $partner->id, 'stock' => 3, 'value' => 50000])
            ->assertSessionHasNoErrors();
        $prize = MysteryPrize::firstOrFail();
        $this->post("/admin/mystery-gift/hadiah/{$prize->id}/aktif");
        $this->assertFalse($prize->fresh()->active);
        $prize->update(['given' => 2]);
        $this->put("/admin/mystery-gift/hadiah/{$prize->id}", ['name' => 'Voucher barbershop', 'fulfillment' => 'mitra', 'partner_id' => $partner->id, 'stock' => 1])
            ->assertSessionHasErrors('stock');

        $this->post('/admin/mystery-gift/daftar', ['whatsapp' => '0812-1111-2222', 'kind' => 'block'])->assertSessionHasNoErrors();
        $this->assertDatabaseHas('mystery_access', ['whatsapp' => '081211112222', 'kind' => 'block']);
        $this->post('/admin/mystery-gift/akun', ['audience' => 'list'])->assertSessionHasNoErrors();
        $this->assertSame('list', Setting::get('mystery_audience'));
        $this->get('/admin/mystery-gift')->assertInertia(fn ($page) => $page->has('prizes', 1)->has('access', 1)->where('audience', 'list'));
    }

    public function test_generator_runs_once_and_locks(): void
    {
        Slot::query()->delete();
        Setting::put('generator_run_at', null);
        $this->actingAs($this->admin);
        $boards = Board::count();
        $this->post('/admin/master-data/isi-papan', ['merch' => $boards * 2, 'limited' => $boards, 'quantities' => []])->assertSessionHasNoErrors();
        $this->get('/admin/generator')->assertInertia(fn ($page) => $page->where('locked', false)->has('preview', 7)->where('stock.limited', $boards));

        $this->post('/admin/generator/jalankan', [])->assertSessionHasErrors('confirm');
        $this->post('/admin/generator/jalankan', ['confirm' => true])->assertSessionHasNoErrors();
        $this->assertSame($boards * 25, Slot::count());
        $this->assertSame($boards * 25, Slot::distinct()->count('code'));
        $this->assertSame($boards * 2, Slot::where('prize_type', 'merch')->count());
        $this->assertSame($boards, Slot::where('prize_type', 'limited')->count());
        $this->assertSame(0, Slot::whereIn('prize_type', ['merch', 'limited'])->whereNotNull('voucher_code')->count());

        // Terkunci: tidak bisa dijalankan ulang.
        $this->post('/admin/generator/jalankan', ['confirm' => true])->assertSessionHasErrors('confirm');
        $this->assertSame($boards * 25, Slot::count());
        $this->get('/admin/generator')->assertInertia(fn ($page) => $page->where('locked', true)->where('result.duplicates', 0));
        $this->get('/admin/generator/cetak')->assertInertia(fn ($page) => $page->has('boards', $boards));
    }

    public function test_admin_scanning_outlet_qr_marks_it_tested(): void
    {
        $outlet = Outlet::firstOrFail();
        $this->actingAs($this->admin)->get('/'.strtolower($outlet->code))->assertRedirect('/admin/master-data/warung');
        $this->assertNotNull($outlet->fresh()->qr_tested_at);
        $this->get('/admin/master-data/warung')->assertInertia(fn ($page) => $page->where('outlets.0.qr_tested', fn ($v) => $v !== null));
    }

    public function test_mystery_gift_is_drawn_once_at_fifth_cap_and_not_everyone_wins(): void
    {
        config(['participant.mystery_voucher_chance' => 50]);
        MysteryPrize::create(['name' => 'Voucher Spotify', 'fulfillment' => 'kode', 'stock' => 500]);
        $rewards = app(RewardCreationService::class);
        $outlet = Outlet::firstOrFail();
        $mysteryOf = fn (Participant $p) => Voucher::where('source', 'mystery')->whereIn('claim_id', $p->claims()->pluck('id'))->count();

        $winners = 0;
        foreach (range(1, 60) as $n) {
            $participant = $this->participant('0813'.str_pad((string) $n, 8, '0', STR_PAD_LEFT));
            foreach (range(1, 6) as $cap) {
                $claim = Claim::create(['participant_id' => $participant->id, 'outlet_id' => $outlet->id, 'claim_code' => sprintf('KM%03d%d', $n, $cap), 'status' => 'approved']);
                $rewards->grantCap($claim);
                // Sebelum cap ke-5 tidak pernah ada mystery gift.
                if ($cap < 5) {
                    $this->assertSame(0, $mysteryOf($participant));
                }
            }
            $got = $mysteryOf($participant);
            // Diundi sekali di cap ke-5: dapat satu atau tidak sama sekali, cap ke-6 tidak mengundi ulang.
            $this->assertContains($got, [0, 1]);
            $winners += $got;
        }

        // Peluang 50%: tidak semua dapat, tapi ada yang dapat (gagal hanya bila 60 kali berturut-turut sama, ~1e-18).
        $this->assertGreaterThan(0, $winners);
        $this->assertLessThan(60, $winners);
        $this->assertSame(60 - $winners, ActivityLog::where('action', 'mystery.missed')->count());

        // Peluang 0%: tidak ada yang dapat.
        config(['participant.mystery_voucher_chance' => 0]);
        $participant = $this->participant('081399999999');
        foreach (range(1, 5) as $cap) {
            $rewards->grantCap(Claim::create(['participant_id' => $participant->id, 'outlet_id' => $outlet->id, 'claim_code' => "KZ00{$cap}", 'status' => 'approved']));
        }
        $this->assertSame(5, $participant->fresh()->caps);
        $this->assertSame(0, $mysteryOf($participant));
    }
}
