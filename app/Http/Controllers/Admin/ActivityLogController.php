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
use App\Support\ActivityLogger;
use App\Support\ClaimFlags;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * A8 Log aktivitas: siapa, kapan, apa, dan alasan untuk setiap aksi. Bisa diekspor CSV dan dihapus per baris;
 * penghapusan sendiri tercatat sebagai log baru supaya jejaknya tidak hilang.
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
        'partner.updated' => 'Mengubah data mitra',
        'partner.area' => 'Mengubah area mitra',
        'payout.paid' => 'Menandai rekap mitra dibayar',
        'payout.corrected' => 'Mengoreksi rekap mitra',
        'master.voucher_type' => 'Mengubah jenis voucher',
        'master.outlet_created' => 'Menambah titik',
        'master.outlet_area' => 'Mengubah area warung',
        'master.outlet_updated' => 'Mengubah warung',
        'master.area' => 'Mengubah area',
        'participant.login' => 'Masuk',
        'participant.registered' => 'Mendaftar',
        'participant.login_locked' => 'Login dikunci sementara',
        'student_confirmation' => 'Menjawab status mahasiswa',
        'consent.accepted' => 'Menyetujui syarat dan privasi',
        'board.printed' => 'Mencetak lembar papan (kode slot)',
        'device.flagged' => 'Perangkat ditandai',
        'log.deleted' => 'Menghapus log aktivitas',
        'claim.photo_deleted' => 'Menghapus foto klaim',
        'admin.created' => 'Menambah admin',
        'admin.updated' => 'Mengubah akun admin',
        'admin.status' => 'Mengubah status admin',
        'participant.updated' => 'Mengubah data peserta',
        'participant.pin_reset' => 'Mereset PIN peserta',
        'participant.blocked' => 'Memblokir peserta',
        'participant.unblocked' => 'Membuka blokir peserta',
        'pin_reset_requested' => 'Minta reset PIN',
    ];

    public function index(Request $request): Response
    {
        $q = trim((string) $request->query('q'));
        $logs = ActivityLog::query()
            ->when($q, function ($query) use ($q) {
                // Cari di nama aksi (bahasa Indonesia), pelaku, peserta, kode klaim, dan detail log.
                $like = '%'.$q.'%';
                $actions = collect(self::ACTIONS)->filter(fn ($label) => str_contains(mb_strtolower($label), mb_strtolower($q)))->keys();
                $admins = User::where('name', 'like', $like)->pluck('id');
                $digits = preg_replace('/\D/', '', $q);
                $people = Participant::where('name', 'like', $like)->when($digits, fn ($p) => $p->orWhere('whatsapp', 'like', "%{$digits}%"))->pluck('id');
                $claims = Claim::where('claim_code', 'like', $like)->pluck('id');
                $query->where(fn ($w) => $w->whereIn('action', $actions)
                    ->orWhere('action', 'like', $like)
                    ->orWhere('metadata', 'like', $like)
                    ->orWhere(fn ($x) => $x->where('actor_type', 'admin')->whereIn('actor_id', $admins))
                    ->orWhere(fn ($x) => $x->where('actor_type', 'participant')->whereIn('actor_id', $people))
                    ->orWhere(fn ($x) => $x->where('subject_type', 'participant')->whereIn('subject_id', $people))
                    ->orWhere(fn ($x) => $x->where('subject_type', 'claim')->whereIn('subject_id', $claims)));
            })
            ->latest()
            ->paginate(50)
            ->withQueryString();

        return Inertia::render('admin/log', [
            'search' => $q,
            'logs' => $this->present(collect($logs->items())),
            'pagination' => ['current' => $logs->currentPage(), 'last' => $logs->lastPage(), 'total' => $logs->total()],
        ]);
    }

    public function destroy(Request $request, ActivityLog $log): RedirectResponse
    {
        $removed = $this->present(collect([$log]))[0];
        $log->delete();
        ActivityLogger::log('log.deleted', 'log', $log->id, [
            'reason' => "{$removed['at_full']} · {$removed['actor']} · {$removed['action']} · {$removed['subject']}",
        ], $request->user());

        return back()->with('status', 'Log dihapus.');
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
                'log' => "Log #{$log->subject_id}",
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
