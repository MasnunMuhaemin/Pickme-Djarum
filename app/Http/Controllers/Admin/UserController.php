<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Area;
use App\Models\Participant;
use App\Models\User;
use App\Support\ActivityLogger;
use App\Support\Mask;
use App\Support\Pin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Kelola pengguna: akun admin (tambah, ubah, aktif/nonaktif) dan peserta (lihat, ubah data, reset PIN, blokir).
 * Peserta tidak dibuat dari admin karena wajib mendaftar sendiri (persetujuan data dan batas usia).
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->query('tab') === 'peserta' ? 'peserta' : 'admin';
        $search = trim((string) $request->query('q'));

        $participants = Participant::query()
            ->with('area')
            ->withCount(['claims' => fn ($q) => $q->where('status', 'approved')])
            ->when($search, fn ($q) => $q->where(fn ($q) => $q->where('name', 'like', "%{$search}%")
                ->when(preg_replace('/\D/', '', $search), fn ($q, $digits) => $q->orWhere('whatsapp', 'like', "%{$digits}%"))))
            ->orderByRaw('blocked_at is null')
            ->latest('id')
            ->paginate(25)
            ->withQueryString();

        // Permintaan "Lupa PIN" yang belum ditangani: diminta setelah reset PIN terakhir oleh admin.
        $ids = collect($participants->items())->pluck('id');
        $requested = ActivityLog::where('action', 'pin_reset_requested')->where('subject_type', 'participant')->whereIn('subject_id', $ids)
            ->selectRaw('subject_id, max(created_at) as at')->groupBy('subject_id')->pluck('at', 'subject_id');
        $resetDone = ActivityLog::where('action', 'participant.pin_reset')->whereIn('subject_id', $ids)
            ->selectRaw('subject_id, max(created_at) as at')->groupBy('subject_id')->pluck('at', 'subject_id');

        return Inertia::render('admin/pengguna', [
            'tab' => $tab,
            'search' => $search,
            'me' => $request->user()->id,
            'admins' => User::orderByDesc('is_admin')->orderBy('name')->get()->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'active' => (bool) $u->is_admin,
                'created' => $u->created_at?->translatedFormat('d M Y'),
            ]),
            'participants' => collect($participants->items())->map(fn (Participant $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'whatsapp' => $p->whatsapp,
                'area_id' => $p->area_id,
                'area' => $p->area?->name,
                'wa' => Mask::waLink($p->whatsapp, "Halo {$p->name}, ini admin PICKME."),
                'caps' => $p->caps,
                'claims' => $p->claims_count,
                'registered' => ($p->registered_at ?? $p->created_at)?->translatedFormat('d M Y'),
                'blocked' => $p->blocked_at?->translatedFormat('d M Y H:i'),
                'blocked_reason' => $p->blocked_reason,
                'pin_requested' => isset($requested[$p->id]) && (! isset($resetDone[$p->id]) || $requested[$p->id] > $resetDone[$p->id]),
            ]),
            'pagination' => ['current' => $participants->currentPage(), 'last' => $participants->lastPage(), 'total' => $participants->total()],
            'areas' => Area::orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storeAdmin(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'max:72'],
        ], ['email.unique' => 'Email ini sudah dipakai akun lain.', 'password.min' => 'Kata sandi minimal 8 karakter.']);

        $user = User::create([...$data, 'password' => Hash::make($data['password']), 'is_admin' => true, 'email_verified_at' => now()]);
        ActivityLogger::log('admin.created', 'admin', $user->id, ['email' => $user->email], $request->user());

        return back()->with('status', "Admin {$user->name} ditambahkan. Berikan email dan kata sandinya secara langsung.");
    }

    public function updateAdmin(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:80'],
            'email' => ['required', 'email', 'max:120', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'max:72'],
        ], ['email.unique' => 'Email ini sudah dipakai akun lain.', 'password.min' => 'Kata sandi minimal 8 karakter.']);

        $user->update(['name' => $data['name'], 'email' => $data['email']] + ($data['password'] ? ['password' => Hash::make($data['password'])] : []));
        ActivityLogger::log('admin.updated', 'admin', $user->id, ['password_changed' => (bool) $data['password']], $request->user());

        return back()->with('status', "Akun {$user->name} diperbarui.");
    }

    /** Aktif/nonaktifkan admin. Tidak bisa menonaktifkan diri sendiri atau admin aktif terakhir. */
    public function toggleAdmin(Request $request, User $user): RedirectResponse
    {
        if ($user->is_admin) {
            if ($user->id === $request->user()->id) {
                return back()->withErrors(['admin' => 'Tidak bisa menonaktifkan akun sendiri.']);
            }
            if (User::where('is_admin', true)->count() <= 1) {
                return back()->withErrors(['admin' => 'Harus ada minimal satu admin aktif.']);
            }
        }
        $user->update(['is_admin' => ! $user->is_admin]);
        ActivityLogger::log('admin.status', 'admin', $user->id, ['active' => $user->is_admin], $request->user());

        return back()->with('status', "Akun {$user->name} ".($user->is_admin ? 'diaktifkan' : 'dinonaktifkan').'.');
    }

    public function updateParticipant(Request $request, Participant $participant): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:60'],
            'area_id' => ['required', 'exists:areas,id'],
        ]);
        // Status mahasiswa tidak diubah admin: hanya mahasiswa yang bisa ikut PICKME.
        $before = $participant->only(['name', 'area_id']);
        $participant->update($data);
        ActivityLogger::log('participant.updated', 'participant', $participant->id, ['from' => $before, 'to' => $data], $request->user());

        return back()->with('status', "Data peserta {$participant->name} diperbarui.");
    }

    /** PIN baru 4 angka, ditampilkan sekali ke admin untuk diberikan ke peserta (mis. setelah Lupa PIN). */
    public function resetParticipantPin(Request $request, Participant $participant): RedirectResponse
    {
        $pin = Pin::generate();
        $participant->update(['pin_hash' => Hash::make($pin)]);
        ActivityLogger::log('participant.pin_reset', 'participant', $participant->id, [], $request->user());

        return back()->with('status', "PIN {$participant->name} direset.")->with('partner_pin', [
            'name' => $participant->name,
            'pin' => $pin,
            'wa' => Mask::waLink($participant->whatsapp, "Halo {$participant->name}, PIN baru PICKME kamu: {$pin}. Masuk pakai nomor WhatsApp ini dan PIN tersebut. Jangan bagikan PIN ke siapa pun."),
        ]);
    }

    public function toggleBlock(Request $request, Participant $participant): RedirectResponse
    {
        if ($participant->blocked_at) {
            $participant->update(['blocked_at' => null, 'blocked_reason' => null]);
            ActivityLogger::log('participant.unblocked', 'participant', $participant->id, [], $request->user());

            return back()->with('status', "Blokir {$participant->name} dibuka.");
        }

        $data = $request->validate(['reason' => ['required', 'string', 'min:5', 'max:200']], [
            'reason.required' => 'Tulis alasan blokir.',
            'reason.min' => 'Alasan minimal 5 huruf.',
        ]);
        $participant->update(['blocked_at' => now(), 'blocked_reason' => $data['reason']]);
        ActivityLogger::log('participant.blocked', 'participant', $participant->id, ['reason' => $data['reason']], $request->user());

        return back()->with('status', "{$participant->name} diblokir.");
    }
}
