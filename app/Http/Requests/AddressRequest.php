<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'recipient' => ['required', 'string', 'min:2', 'max:60'],
            // Hanya area pengiriman yang ditetapkan admin (PRD FR-18).
            'area' => ['required', Rule::exists('areas', 'name')->where('is_delivery_area', true)],
            'address' => ['required', 'string', 'min:10', 'max:200'],
            'note' => ['nullable', 'string', 'max:200'],
        ];
    }

    public function messages(): array
    {
        return [
            'recipient.required' => 'Isi nama penerima.',
            'area.required' => 'Pilih area pengiriman.',
            'area.exists' => 'Hadiah hanya diantar di area yang tersedia.',
            'address.required' => 'Isi alamat lengkap dan patokan.',
            'address.min' => 'Isi alamat lengkap dan patokan.',
        ];
    }
}
