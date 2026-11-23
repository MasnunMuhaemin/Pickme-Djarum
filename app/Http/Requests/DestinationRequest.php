<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DestinationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'destination' => ['required', 'string', 'min:8', 'max:30'],
            'name' => ['required', 'string', 'min:2', 'max:60'],
            'whatsapp' => ['required', 'string', 'regex:/^08[0-9]{8,11}$/'],
        ];
    }

    public function messages(): array
    {
        return [
            'destination.required' => 'Isi nomor meter atau ID pelanggan.',
            'destination.min' => 'Isi nomor meter atau ID pelanggan.',
            'name.required' => 'Isi nama sesuai meteran.',
            'whatsapp.regex' => 'Nomor WhatsApp harus diawali 08 dan 10 sampai 13 angka.',
        ];
    }
}
