<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Claim;
use App\Models\Gift;
use App\Models\Outlet;
use App\Models\Participant;
use App\Models\Partner;
use App\Models\User;
use App\Models\Voucher;
use App\Support\ClaimFlags;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A8 Log aktivitas: siapa, kapan, apa, dan alasan untuk setiap aksi. Tidak bisa diubah; bisa diekspor CSV.
 */
class ActivityLogController extends Controller
{
    private const ACTIONS = [
        'claim.approved_by_admin' => 'Menyetujui klaim',
        'claim.rejected_by_admin' => 'Menolak klaim',
        'claim.decision_undone' => 'Mengurungkan keputusan klaim',
        'claim.approved' => 'Klaim disetujui otomatis',
        'claim.queued' => 'Klaim masuk antrean foto',
        'claim.code_rejected' => 'Kode slot ditolak',
        'slot.assigned' => 'Slot ditahan untuk peserta',
        'reward.created' => 'Hadiah dibuat',
        'mystery.voucher' => 'Mystery gift: voucher',
        'mystery.free_pack' => 'Mystery gift: bungkus gratis',
        'token.sent' => 'Menandai token listrik berhasil',
        'token.failed' => 'Menandai token listrik gagal',
        'fuel.contacted' => 'Menghubungi peserta untuk bensin tunai',
        'fuel.handed_over' => 'Menyerahkan bensin tunai',
        'gift.shipped' => 'Mengirim hadiah barang',
        'gift.completed' => 'Hadiah barang selesai',
        'gift.address_saved' => 'Mengisi alamat pengiriman',
        'voucher.destination_saved' => 'Mengisi nomor tujuan',
        'voucher.sent_whatsapp' => 'Mengirim voucher lewat WhatsApp',
        'program.paused' => 'Menjeda seluruh program',
        'program.resumed' => 'Melanjutkan program',
        'outlet.paused' => 'Menjeda titik',
        'outlet.resumed' => 'Melanjutkan titik',
        'settings.updated' => 'Mengubah parameter',
        'ranking.closed' => 'Menutup peringkat',
        'partner.created' => 'Menambah mitra',
        'partner.pin_reset' => 'Mereset PIN mitra',
        'partner.status' => 'Mengubah status mitra',
        'payout.paid' => 'Menandai rekap mitra dibayar',
        'payout.corrected' => 'Mengoreksi rekap mitra',
        'master.voucher_type' => 'Mengubah jenis voucher',
        'master.outlet_created' => 'Menambah titik',
        'master.area' => 'Mengubah area',
        'participant.login' => 'Masuk',
        'participant.registered' => 'Mendaftar',
        'participant.login_locked' => 'Login dikunci sementara',
        'student_confirmation' => 'Menjawab status mahasiswa',
        'consent.accepted' => 'Menyetujui syarat dan privasi',
        'board.printed' => 'Mencetak lembar papan (kode slot)',
        'device.flagged' => 'Perangkat ditandai',
    ];

    public function index(): Response
    {
        $logs = ActivityLog::latest()->paginate(50);

        return Inertia::render('admin/log', [
            'logs' => $this->present(collect($logs->items())),
            'pagination' => ['current' => $logs->currentPage(), 'last' => $logs->lastPage(), 'total' => $logs->total()],
        ]);
    }

    public function export(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Waktu', 'Pelaku', 'Aksi', 'Objek', 'Detail']);
            ActivityLog::latest()->chunk(500, function ($chunk) use ($out) {
                foreach ($this->present($chunk) as $row) {
                    fputcsv($out, [$row['at_full'], $row['actor'], $row['action'], $row['subject'], $row['detail']]);
                }
            });
            fclose($out);
        }, 'log-aktivitas-'.now()->format('Ymd-His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** @param  Collection<int, ActivityLog>  $logs */
    private function present(Collection $logs): array
    {
        $ids = fn (string $type, string $field = 'actor') => $logs->where("{$field}_type", $type)->pluck("{$field}_id")->filter()->unique();
        $users = User::whereIn('id', $ids('admin'))->pluck('name', 'id');
        $participants = Participant::whereIn('id', $ids('participant')->merge($ids('participant', 'subject')))->pluck('name', 'id');
        $claims = Claim::whereIn('id', $ids('claim', 'subject'))->pluck('claim_code', 'id');
        $vouchers = Voucher::whereIn('id', $ids('voucher', 'subject'))->get(['id', 'code', 'type'])->keyBy('id');
        $outlets = Outlet::whereIn('id', $ids('outlet', 'subject'))->pluck('code', 'id');
        $partners = Partner::whereIn('id', $ids('partner', 'subject'))->pluck('name', 'id');
        $gifts = Gift::whereIn('id', $ids('gift', 'subject'))->pluck('type', 'id');

        return $logs->map(function (ActivityLog $log) use ($users, $participants, $claims, $vouchers, $outlets, $partners, $gifts) {
            $actor = match ($log->actor_type) {
                'admin' => $users[$log->actor_id] ?? 'Admin',
                'participant' => 'Peserta '.($participants[$log->actor_id] ?? ''),
                'partner' => 'Mitra',
                default => 'Sistem',
            };
            $voucher = $vouchers[$log->subject_id] ?? null;
            $subject = match ($log->subject_type) {
                'claim' => 'Klaim '.($claims[$log->subject_id] ?? "#{$log->subject_id}"),
                'voucher' => ($voucher?->type === 'token' ? 'Voucher token ' : 'Voucher ').($voucher?->code ?? "#{$log->subject_id}"),
                'outlet' => 'Papan '.($outlets[$log->subject_id] ?? "#{$log->subject_id}"),
                'partner' => 'Mitra '.($partners[$log->subject_id] ?? "#{$log->subject_id}"),
                'gift' => ($gifts[$log->subject_id] ?? 'Hadiah').' #'.$log->subject_id,
                'program' => 'Program',
                'settings' => 'Pengaturan',
                'ranking' => 'Peringkat',
                'participant' => 'Peserta '.($participants[$log->subject_id] ?? "#{$log->subject_id}"),
                default => ucfirst($log->subject_type).($log->subject_id ? " #{$log->subject_id}" : ''),
            };
            $meta = (array) $log->metadata;

            return [
                'id' => $log->id,
                'at' => $log->created_at?->format('d M H:i'),
                'at_full' => $log->created_at?->format('Y-m-d H:i:s'),
                'actor' => trim($actor),
                'actor_type' => $log->actor_type,
                'action' => self::ACTIONS[$log->action] ?? $log->action,
                'subject' => $subject,
                'detail' => $meta['reason'] ?? (isset($meta['flags']) && $meta['flags'] ? 'Tanda: '.implode(', ', ClaimFlags::labels((array) $meta['flags'])) : ''),
            ];
        })->values()->all();
    }
}
