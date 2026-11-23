<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Nomor meter atau ID pelanggan PLN, diisi dua kali dan harus sama (PRD bagian 14).
 * Panjang final dipastikan bersama agregator; sementara 8 sampai 20 angka.
 */
class DestinationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'destination' => ['required', 'regex:/^[0-9]{8,20}$/', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'destination.required' => 'Isi nomor meter atau ID pelanggan.',
            'destination.regex' => 'Nomor meter atau ID pelanggan hanya angka, 8 sampai 20 digit.',
            'destination.confirmed' => 'Kedua isian nomor belum sama.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'destination' => preg_replace('/\D/', '', (string) $this->destination),
            'destination_confirmation' => preg_replace('/\D/', '', (string) $this->destination_confirmation),
        ]);
    }
}
