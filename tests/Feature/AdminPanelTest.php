<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Area;
use App\Models\Claim;
use App\Models\Gift;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Partner;
use App\Models\Setting;
use App\Models\Slot;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherType;
use App\Support\ProgramParameters;
use App\Support\RewardPresenter;
use Database\Seeders\AdminSeeder;
use Database\Seeders\CustomerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
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

    /** Klaim bertanda (pending) di slot kosong dengan jenis hadiah tertentu. */
    private function pendingClaim(string $prize = 'voucher', ?Participant $participant = null): Claim
    {
        $slot = Slot::where('status', 'empty')->firstOrFail();
        $slot->update(['prize_type' => $prize, 'status' => 'used', 'used_at' => now()]);

        return Claim::create([
            'participant_id' => ($participant ?? $this->participant())->id,
            'outlet_id' => Outlet::first()->id,
            'slot_id' => $slot->id,
            'code' => $slot->code,
            'claim_code' => 'KLM-'.random_int(1000, 9999),
            'flag' => 'first_photo',
            'status' => 'pending',
            'submitted_at' => now(),
        ]);
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
            $claim = $this->pendingClaim($prize, $this->participant('08120000010'.$i));
            $this->actingAs($this->admin)->post("/admin/antrean-foto/{$claim->id}/setujui");
        }
        $this->pendingClaim('voucher', $this->participant('081200000199'));

        $this->actingAs($this->admin);
        foreach (['/admin', '/admin/antrean-foto', '/admin/pemenuhan', '/admin/pemenuhan?tab=bensin', '/admin/pemenuhan?tab=barang',
            '/admin/kirim-voucher', '/admin/peringkat', '/admin/papan', '/admin/mitra', '/admin/mitra?tab=akun',
            '/admin/master-data', '/admin/pengaturan', '/admin/log'] as $url) {
            $this->get($url)->assertOk();
        }
    }

    public function test_approving_a_claim_creates_reward_and_cap_and_is_logged(): void
    {
        $claim = $this->pendingClaim('voucher');

        $this->actingAs($this->admin)->post("/admin/antrean-foto/{$claim->id}/setujui")->assertRedirect();

        $claim->refresh();
        $this->assertSame('approved', $claim->status);
        $this->assertSame($this->admin->id, $claim->decided_by);
        $this->assertNotNull($claim->voucher);
        $this->assertSame(1, $claim->participant->fresh()->caps);
        $this->assertDatabaseHas('activity_logs', ['action' => 'claim.approved_by_admin', 'actor_type' => 'admin', 'actor_id' => $this->admin->id]);
    }

    public function test_reject_requires_a_reason_from_the_list_and_can_be_undone(): void
    {
        $claim = $this->pendingClaim();
        $this->actingAs($this->admin);

        $this->post("/admin/antrean-foto/{$claim->id}/tolak", ['reason' => ''])->assertSessionHasErrors('reason');
        $this->post("/admin/antrean-foto/{$claim->id}/tolak", ['reason' => 'asal'])->assertSessionHasErrors('reason');
        $this->post("/admin/antrean-foto/{$claim->id}/tolak", ['reason' => 'Foto buram atau terlalu gelap'])->assertRedirect();
        $this->assertSame('rejected', $claim->fresh()->status);

        $this->post("/admin/antrean-foto/{$claim->id}/urungkan")->assertRedirect();
        $this->assertSame('pending', $claim->fresh()->status);
    }

    public function test_undo_approval_removes_unprocessed_reward_but_not_processed_one(): void
    {
        $claim = $this->pendingClaim('voucher');
        $this->actingAs($this->admin)->post("/admin/antrean-foto/{$claim->id}/setujui");
        $this->post("/admin/antrean-foto/{$claim->id}/urungkan")->assertRedirect();
        $this->assertSame('pending', $claim->fresh()->status);
        $this->assertNull($claim->fresh()->voucher);
        $this->assertSame(0, $claim->participant->fresh()->caps);

        // Sudah dikirim lewat WhatsApp: tidak bisa diurungkan.
        $this->post("/admin/antrean-foto/{$claim->id}/setujui");
        $claim->fresh()->voucher->update(['sent_at' => now()]);
        $this->post("/admin/antrean-foto/{$claim->id}/urungkan")->assertSessionHasErrors('undo');
        $this->assertSame('approved', $claim->fresh()->status);
    }

    public function test_token_success_needs_reference_and_third_failure_needs_admin(): void
    {
        $claim = $this->pendingClaim('token');
        $this->actingAs($this->admin)->post("/admin/antrean-foto/{$claim->id}/setujui");
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
        $fuelClaim = $this->pendingClaim('bensin');
        $this->post("/admin/antrean-foto/{$fuelClaim->id}/setujui");
        $fuel = $fuelClaim->fresh()->voucher;

        $this->post("/admin/pemenuhan/bensin/{$fuel->id}/hubungi")->assertRedirect();
        $this->assertSame('contacted', $fuel->fresh()->status);
        $this->post("/admin/pemenuhan/bensin/{$fuel->id}/serahkan", ['date' => now()->toDateString(), 'recipient' => ''])->assertSessionHasErrors('recipient');
        $this->post("/admin/pemenuhan/bensin/{$fuel->id}/serahkan", ['date' => now()->toDateString(), 'recipient' => 'Tari'])->assertRedirect();
        $this->assertSame('handed_over', $fuel->fresh()->status);

        $goodsClaim = $this->pendingClaim('merch', $this->participant('081200000002'));
        $this->post("/admin/antrean-foto/{$goodsClaim->id}/setujui");
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
        $claim = $this->pendingClaim('voucher');
        $this->actingAs($this->admin)->post("/admin/antrean-foto/{$claim->id}/setujui");
        $voucher = $claim->fresh()->voucher;

        $this->get('/admin/kirim-voucher')->assertInertia(fn ($page) => $page->where('rows.0.code', $voucher->code));
        $this->post("/admin/kirim-voucher/{$voucher->id}/terkirim")->assertRedirect();
        $this->assertNotNull($voucher->fresh()->sent_at);
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
        $values['participant__slot_hold_minutes'] = 45;

        $this->post('/admin/pengaturan', ['values' => $values])->assertRedirect();
        $this->assertSame('45', Setting::get('param.participant.slot_hold_minutes'));
        $this->assertDatabaseHas('activity_logs', ['action' => 'settings.updated']);

        // Nilai tersimpan diterapkan saat aplikasi berjalan.
        config(['participant.slot_hold_minutes' => 30]);
        ProgramParameters::apply();
        $this->assertSame(45, config('participant.slot_hold_minutes'));
    }

    public function test_partner_pin_reset_payout_and_correction(): void
    {
        $this->actingAs($this->admin);
        $this->post('/admin/mitra', ['name' => 'Kopi Baru', 'type' => 'umum', 'whatsapp' => '081299990000'])
            ->assertSessionHas('partner_pin');
        $partner = Partner::where('name', 'Kopi Baru')->firstOrFail();
        $this->assertNotNull($partner->pin_hash);

        $this->post("/admin/mitra/{$partner->id}/koreksi", ['count' => 3, 'reason' => ''])->assertSessionHasErrors('reason');
        $this->post("/admin/mitra/{$partner->id}/koreksi", ['count' => 3, 'reason' => 'Struk mitra lebih banyak'])->assertRedirect();
        $this->post("/admin/mitra/{$partner->id}/dibayar", ['paid_at' => now()->toDateString(), 'proof' => 'TRF-123'])->assertRedirect();
        $this->post("/admin/mitra/{$partner->id}/koreksi", ['count' => 4, 'reason' => 'Coba ubah setelah dibayar'])->assertStatus(422);
    }

    public function test_vouchers_follow_master_data_voucher_types(): void
    {
        // Seeder mengisi semua slot non-merch W07 dengan jenis voucher dari master data.
        $this->assertSame(0, Slot::whereNull('voucher_type_id')->where('prize_type', '!=', 'merch')->count());

        $kopi = VoucherType::where('name', 'Kopi')->firstOrFail();
        $claim = $this->pendingClaim('voucher');
        $claim->slot->update(['voucher_type_id' => $kopi->id]);
        $this->actingAs($this->admin)->post("/admin/antrean-foto/{$claim->id}/setujui");

        $voucher = $claim->fresh()->voucher;
        $this->assertSame($kopi->id, $voucher->voucher_type_id);
        $this->assertSame(30000, $voucher->value);
        $this->assertSame($kopi->partner_id, $voucher->partner_id);
        $reward = RewardPresenter::voucher($voucher);
        $this->assertSame('Voucher Kopi', $reward['title']);
        $this->assertStringContainsString('Kopi Groei', $reward['description']);

        // Jenis yang tidak cocok dengan hadiah slot diganti jenis yang cocok.
        $token = $this->pendingClaim('token', $this->participant('081200000077'));
        $token->slot->update(['voucher_type_id' => $kopi->id]);
        $this->post("/admin/antrean-foto/{$token->id}/setujui");
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
        $this->actingAs($this->admin)->post('/admin/master-data/titik', ['code' => 'w21', 'name' => 'Warung Baru', 'area_id' => Area::first()->id])->assertRedirect();
        $outlet = Outlet::where('code', 'W21')->firstOrFail();
        $this->assertSame(25, $outlet->board->slots()->count());
        $this->assertSame(0, $outlet->board->slots()->whereNull('voucher_type_id')->where('prize_type', '!=', 'merch')->count());
        $this->get('/w21')->assertRedirect('/participant/masuk');
    }

    public function test_log_export_is_csv(): void
    {
        $this->actingAs($this->admin)->post('/admin/peringkat/tutup', ['confirm' => true])->assertRedirect();
        $response = $this->get('/admin/log/ekspor');
        $response->assertOk();
        $this->assertStringContainsString('Menutup peringkat', $response->streamedContent());
    }
}
