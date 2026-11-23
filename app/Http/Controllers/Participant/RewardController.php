<?php

namespace App\Http\Controllers\Participant;

use App\Http\Controllers\Controller;
use App\Models\Participant;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RewardController extends Controller
{
    public function index(Request $request): Response
    {
        $participant = Participant::findOrFail($request->session()->get('participant_id'));
        $claims = $participant->claims()->where('status', 'approved')->with(['voucher', 'gifts', 'slot'])->get();

        $rewards = $claims->flatMap(function ($claim) {
            $items = [];
            if ($claim->voucher) {
                $items[] = [
                    'id' => $claim->voucher->id,
                    'kind' => 'voucher',
                    'title' => $this->title($claim->voucher->type),
                    'status' => $claim->voucher->status,
                    'code' => $claim->voucher->code,
                    'action' => $claim->voucher->type === 'voucher' ? 'Lihat kode' : 'Isi nomor',
                    'href' => $claim->voucher->type === 'voucher'
                        ? route('participant.voucher', $claim->voucher->code)
                        : route('participant.nomor-tujuan', $claim->voucher->id),
                ];
            }
            foreach ($claim->gifts as $gift) {
                $items[] = [
                    'id' => $gift->id,
                    'kind' => 'gift',
                    'title' => $gift->type === 'mystery_pack' ? 'Mystery gift' : 'Merchandise',
                    'status' => $gift->status,
                    'code' => null,
                    'action' => $gift->status === 'pending_address' ? 'Isi alamat' : null,
                    'href' => $gift->status === 'pending_address' ? route('participant.alamat', $gift->id) : null,
                ];
            }

            return $items;
        })->values();

        return Inertia::render('participant/hadiah', ['rewards' => $rewards]);
    }

    private function title(string $type): string
    {
        return match ($type) {
            'voucher' => 'Voucher Kopi Grosir',
            'token' => 'Token listrik',
            'bensin' => 'Bensin motor',
            default => 'Hadiah',
        };
    }
}
