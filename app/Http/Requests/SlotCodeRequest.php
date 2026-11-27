<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SlotCodeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['code' => ['required', 'string', 'max:12']];
    }

    public function messages(): array
    {
        return ['code.required' => 'Isi kode 6 karakter dari balik hadiah.'];
    }
}
