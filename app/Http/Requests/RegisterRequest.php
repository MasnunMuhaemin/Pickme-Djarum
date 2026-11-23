<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:40'],
            'whatsapp' => ['required', 'string', 'regex:/^08[0-9]{8,11}$/', 'unique:participants,whatsapp'],
            'birth_date' => ['required', 'date', 'before:today'],
            'area_id' => ['required', 'exists:areas,id'],
            'pin' => ['required', 'digits:4', 'confirmed', function (string $attribute, mixed $value, \Closure $fail) {
                if (self::isWeakPin((string) $value)) {
                    $fail('PIN harus 4 angka dan tidak boleh mudah ditebak.');
                }
            }],
            'device_id' => ['sometimes', 'string', 'max:64'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Isi nama panggilanmu, 2 sampai 40 huruf.',
            'name.min' => 'Isi nama panggilanmu, 2 sampai 40 huruf.',
            'whatsapp.required' => 'Nomor WhatsApp harus diawali 08 dan 10 sampai 13 angka.',
            'whatsapp.regex' => 'Nomor WhatsApp harus diawali 08 dan 10 sampai 13 angka.',
            'whatsapp.unique' => 'Nomor ini sudah terdaftar, silakan masuk.',
            'birth_date.required' => 'Tanggal lahir belum valid.',
            'birth_date.date' => 'Tanggal lahir belum valid.',
            'area_id.required' => 'Pilih area kosmu.',
            'area_id.exists' => 'Pilih area kosmu.',
            'pin.digits' => 'PIN harus 4 angka dan tidak boleh mudah ditebak.',
            'pin.confirmed' => 'Ulangi PIN belum sama dengan PIN.',
        ];
    }

    /** PIN dengan semua angka sama (1111) atau berurutan naik/turun (1234, 4321) ditolak (PRD bagian 14). */
    public static function isWeakPin(string $pin): bool
    {
        if (! preg_match('/^\d{4}$/', $pin)) {
            return false;
        }

        $steps = array_map(fn ($i) => (int) $pin[$i + 1] - (int) $pin[$i], [0, 1, 2]);

        return count(array_unique($steps)) === 1 && in_array($steps[0], [-1, 0, 1], true);
    }

    protected function prepareForValidation(): void
    {
        if ($this->whatsapp) {
            $number = preg_replace('/\D/', '', (string) $this->whatsapp);
            if (str_starts_with($number, '62')) {
                $number = '0'.substr($number, 2);
            }
            $this->merge(['whatsapp' => $number]);
        }
    }
}
