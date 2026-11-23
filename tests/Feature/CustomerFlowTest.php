<?php

namespace Tests\Feature;

use App\Models\Area;
use App\Models\Claim;
use App\Models\Participant;
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
    }

    private function register(string $birthDate = '2000-01-01'): array
    {
        return [
            'name' => 'Sakinah',
            'whatsapp' => '081234567890',
            'birth_date' => $birthDate,
            'area_id' => Area::first()->id,
            'pin' => '1234',
            'pin_confirmation' => '1234',
            'device_id' => 'test-device-1',
        ];
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

        $png = imagecreatetruecolor(200, 200);
        imagefill($png, 0, 0, imagecolorallocate($png, 120, 120, 120));
        ob_start();
        imagepng($png);
        $bytes = ob_get_clean();
        imagedestroy($png);

        $this->post('/participant/foto', [
            'photo' => UploadedFile::fake()->createWithContent('bungkus.png', $bytes)->mimeType('image/png'),
            'outlet' => 'W07',
        ])->assertRedirect('/participant/slot');

        $claim = Claim::firstOrFail();
        $this->assertSame('draft', $claim->status);
        $this->assertMatchesRegularExpression('/^KLM-\d{4}$/', $claim->claim_code);
        $this->assertNotNull($claim->slot_id);
        $this->assertSame('held', $claim->slot->status);
        $this->assertDatabaseHas('claim_photos', ['claim_id' => $claim->id]);

        $this->post('/participant/slot', ['code' => 'ZZZZZZ'])->assertSessionHasErrors('code');
        $this->assertSame('held', $claim->fresh()->slot->status);

        $this->post('/participant/slot', ['code' => $claim->slot->code])->assertRedirect();
        $this->assertSame('approved', $claim->fresh()->status);
        $this->assertSame('used', $claim->fresh()->slot->status);
        $this->assertSame(1, $participant->fresh()->caps);

        $this->assertTrue(
            Voucher::where('claim_id', $claim->id)->exists() || $claim->fresh()->gifts()->exists()
        );
        $this->get('/participant/hadiah')->assertOk()->assertInertia(fn ($page) => $page
            ->component('participant/hadiah')
            ->where('approvedClaims', 1)
            ->has('rewards', 1, fn ($reward) => $reward
                ->hasAll(['id', 'kind', 'title', 'description', 'status', 'status_label', 'tone', 'action', 'href'])
                ->etc()
            )
        );
        if ($voucher = Voucher::where('claim_id', $claim->id)->first()) {
            $this->get("/participant/voucher/{$voucher->code}")->assertOk()->assertInertia(fn ($page) => $page
                ->component('participant/voucher')
                ->where('voucher.code', $voucher->code)
                ->has('reward.status_label')
            );
        }
    }

    public function test_scan_resolves_known_outlet_and_rejects_unknown_code(): void
    {
        $this->post('/participant/scan', ['code' => 'w07'])
            ->assertRedirect('/participant/masuk');

        $this->post('/participant/scan', ['code' => 'XX99'])
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

        $this->post('/participant/mahasiswa', ['is_student' => true])->assertRedirect('/participant/papan');
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
