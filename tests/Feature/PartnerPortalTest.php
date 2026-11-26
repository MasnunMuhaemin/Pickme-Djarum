<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Claim;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Partner;
use App\Models\Slot;
use App\Models\User;
use App\Models\Voucher;
use App\Models\VoucherType;
use Database\Seeders\CustomerSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/** Halaman mitra (PRD bagian 12): masuk PIN, cek dan tukar kode, foto bukti, rekap, antrean top up. */
class PartnerPortalTest extends TestCase
{
    use RefreshDatabase;

    private Partner $kopi;

    private int $slotIndex = 0;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(CustomerSeeder::class);
        Storage::fake('local');
        $this->kopi = Partner::create(['name' => 'Kopi Groei', 'type' => 'umum', 'pin_hash' => Hash::make('2580'), 'status' => 'active']);
    }

    private function voucher(Partner $partner, string $code, string $status = 'sent', string $fulfillment = 'mitra'): Voucher
    {
        $type = VoucherType::create(['name' => 'Kopi Groei', 'partner_id' => $partner->id, 'value' => 30000, 'quantity' => 10, 'fulfillment' => $fulfillment]);
        $participant = Participant::create([
            'name' => 'Raka Pratama', 'whatsapp' => '0812'.random_int(10000000, 99999999), 'birth_date' => '2000-01-01',
            'area_id' => Area::first()->id, 'pin_hash' => Hash::make('4826'),
        ]);
        $claim = Claim::create([
            'participant_id' => $participant->id, 'outlet_id' => Outlet::first()->id,
            'slot_id' => Slot::orderBy('id')->skip($this->slotIndex++)->first()->id, 'code' => 'ABC123', 'status' => 'approved',
        ]);

        return Voucher::create([
            'claim_id' => $claim->id, 'code' => $code, 'type' => 'voucher', 'status' => $status,
            'voucher_type_id' => $type->id, 'partner_id' => $partner->id, 'value' => 30000,
        ]);
    }

    private function login(string $pin = '2580')
    {
        return $this->post('/mitra/masuk', ['pin' => $pin]);
    }

    public function test_login_with_pin_and_wrong_pin_is_limited(): void
    {
        $this->get('/mitra')->assertRedirect('/mitra/masuk');
        $this->login('1111')->assertSessionHasErrors(['pin' => 'PIN salah.']);
        $this->login()->assertRedirect('/mitra');
        $this->get('/mitra')->assertInertia(fn ($page) => $page->component('partner/cek')->where('partner.name', 'Kopi Groei'));

        $this->post('/mitra/keluar');
        foreach (range(1, 5) as $i) {
            $this->login('1111');
        }
        // Setelah batas percobaan, PIN benar pun ditolak sementara.
        $this->login()->assertSessionHasErrors('pin');
    }

    public function test_inactive_partner_cannot_log_in(): void
    {
        $this->kopi->update(['status' => 'inactive']);
        $this->login()->assertSessionHasErrors('pin');
    }

    public function test_check_states_and_redeem_only_once(): void
    {
        $this->voucher($this->kopi, 'KGRVALID1');
        $other = Partner::create(['name' => 'Laundry', 'type' => 'umum', 'status' => 'active']);
        $this->voucher($other, 'KGROTHER1');
        $this->login();

        $this->post('/mitra/cek', ['code' => 'kgr-valid 1'])->assertRedirect('/mitra/kode/KGRVALID1');
        $this->get('/mitra/kode/KGRVALID1')->assertInertia(fn ($page) => $page->component('partner/kode')->where('voucher.holder', 'Raka')->where('voucher.value', 'Rp30.000'));
        // Kode yang tidak bisa ditukar: popup di atas Cek kode.
        $this->post('/mitra/cek', ['code' => 'KGROTHER1'])->assertRedirect('/mitra')->assertSessionHas('mitra_check', ['state' => 'not_mine', 'code' => 'KGROTHER1']);
        $this->get('/mitra')->assertInertia(fn ($page) => $page->where('result.state', 'not_mine'));
        $this->get('/mitra/kode/NOPE12345')->assertRedirect('/mitra')->assertSessionHas('mitra_check.state', 'unknown');

        $this->post('/mitra/kode/KGRVALID1/tukar')->assertRedirect('/mitra')->assertSessionHas('mitra_redeemed.code', 'KGRVALID1');
        $this->get('/mitra')->assertInertia(fn ($page) => $page->where('redeemed.holder', 'Raka'));
        $this->assertSame('redeemed', Voucher::where('code', 'KGRVALID1')->value('status'));
        $this->post('/mitra/kode/KGRVALID1/tukar')->assertSessionHas('mitra_check.state', 'redeemed');
        $this->get('/mitra/kode/KGRVALID1')->assertRedirect('/mitra')->assertSessionHas('mitra_check.state', 'redeemed');

        // Voucher mitra lain tidak bisa ditukar di sini.
        $this->post('/mitra/kode/KGROTHER1/tukar');
        $this->assertSame('sent', Voucher::where('code', 'KGROTHER1')->value('status'));
    }

    public function test_proof_photo_and_weekly_recap(): void
    {
        $this->voucher($this->kopi, 'KGRPHOTO1');
        $this->login();
        $this->post('/mitra/kode/KGRPHOTO1/tukar');

        $this->get('/mitra/rekap')->assertInertia(fn ($page) => $page->where('current.count', 1)->where('current.photos', 0)->where('current.status', 'berjalan'));

        $this->post('/mitra/kode/KGRPHOTO1/foto', ['photo' => UploadedFile::fake()->image('bukti.jpg', 640, 480)])
            ->assertRedirect('/mitra/kode/KGRPHOTO1/selesai');
        $voucher = Voucher::where('code', 'KGRPHOTO1')->first();
        Storage::disk('local')->assertExists($voucher->proof_path);

        $week = now()->startOfWeek()->toDateString();
        $this->get("/mitra/rekap/{$week}")->assertInertia(fn ($page) => $page->where('week.photos', 1)->where('rows.0.has_photo', true));
        $this->get('/mitra/bukti/KGRPHOTO1')->assertOk();
    }

    public function test_recap_lists_every_week_since_partner_started_with_month(): void
    {
        $this->kopi->forceFill(['created_at' => now()->subWeeks(10)])->save();
        $this->login();

        $this->get('/mitra/rekap')->assertInertia(fn ($page) => $page
            ->has('previous', 10)
            ->where('previous.0.label', 'Minggu lalu')
            ->where('previous.9.month', now()->subWeeks(10)->startOfWeek()->format('Y-m')));
    }

    public function test_kuota_top_up_is_done_by_admin_not_partner(): void
    {
        $kuota = Partner::create(['name' => 'Pulsa Jaya', 'type' => 'kuota', 'pin_hash' => Hash::make('3690'), 'status' => 'active']);
        $done = $this->voucher($kuota, 'KGRKUOTA1', 'pending_process', 'kuota');
        $wrong = $this->voucher($kuota, 'KGRKUOTA2', 'pending_process', 'kuota');
        $done->update(['destination' => '081234567890']);

        // Mitra kuota tidak punya menu antrean lagi, dan kode pulsa/kuota tidak ditukar lewat cek kode.
        $this->login('3690');
        $this->get('/mitra/antrean')->assertNotFound();
        $this->get('/mitra/kode/KGRKUOTA1')->assertSessionHas('mitra_check.state', 'unknown');
        $this->post('/mitra/keluar');

        $this->actingAs(User::factory()->create(['is_admin' => true]));
        $this->get('/admin/pemenuhan?tab=topup')->assertInertia(fn ($page) => $page->has('rows.topup', 2)->where('counts.topup', 2));
        $this->post("/admin/pemenuhan/topup/{$done->id}/selesai")->assertSessionHas('status', 'Top up ditandai selesai.');
        $this->assertSame('done', $done->fresh()->status);

        $this->post("/admin/pemenuhan/topup/{$wrong->id}/nomor-salah");
        $this->assertSame('rejected', $wrong->fresh()->status);
        $this->assertSame(1, $wrong->fresh()->failed_attempts);

        // Setelah batas salah: Perlu bantuan, admin isi nomor yang benar lalu kembali ke antrean.
        $wrong->update(['status' => 'needs_admin']);
        $this->post("/admin/pemenuhan/bantuan/{$wrong->id}", ['destination' => '081299998888'])->assertSessionHasNoErrors();
        $this->assertSame('pending_process', $wrong->fresh()->status);
        $this->assertSame('081299998888', $wrong->fresh()->destination);
    }

    public function test_participant_fills_phone_number_for_kuota(): void
    {
        $kuota = Partner::create(['name' => 'Pulsa Jaya', 'type' => 'kuota', 'status' => 'active']);
        $voucher = $this->voucher($kuota, 'KGRKUOTA3', 'pending_data', 'kuota');
        $this->withSession(['participant_id' => $voucher->claim->participant_id]);

        $this->get("/participant/nomor-tujuan/{$voucher->id}")->assertInertia(fn ($page) => $page->where('voucher.kuota', true)->where('reward.kind', 'kuota'));
        $this->post("/participant/nomor-tujuan/{$voucher->id}", ['destination' => '12345678', 'destination_confirmation' => '12345678'])
            ->assertSessionHasErrors('destination');
        $this->post("/participant/nomor-tujuan/{$voucher->id}", ['destination' => '081299998888', 'destination_confirmation' => '081299998888'])
            ->assertRedirect('/participant/terima-kasih');
        $this->assertSame('pending_process', $voucher->fresh()->status);
    }
}
