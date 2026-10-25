<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdateRapatRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tanggal'       => ['sometimes', 'date_format:Y-m-d'],
            'topik'         => ['sometimes', 'string', 'min:3', 'max:500'],
            'pimpinanRapat' => ['sometimes', 'string', 'min:2', 'max:255'],
            'notulis'       => ['sometimes', 'string', 'min:2', 'max:255'],
            'waktu'         => ['sometimes', 'nullable', 'string', 'max:255'],
            'tempat'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'status'        => ['sometimes', 'string', 'in:Selesai,Berlangsung,Dijadwalkan'],
            'ringkasanAI'   => ['sometimes', 'nullable', 'string'],
            'ideBaruAI'     => ['sometimes', 'nullable', 'string'],

            // anggota bisa berupa JSON string (dari SPA) atau array
            'anggota'               => ['sometimes', 'nullable'],
            'anggota.*.nama'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'anggota.*.jabatan'     => ['sometimes', 'nullable', 'string', 'max:255'],
            'anggota.*.asalInstansi'=> ['sometimes', 'nullable', 'string', 'max:255'],

            // poin pembahasan
            'poinPembahasan'        => ['sometimes', 'nullable'],
            'poinPembahasan.*.isi'  => ['sometimes', 'nullable', 'string'],

            // tindak lanjut
            'tindakLanjut'            => ['sometimes', 'nullable'],
            'tindakLanjut.*.tugas'    => ['sometimes', 'nullable', 'string'],
            'tindakLanjut.*.pic'      => ['sometimes', 'nullable', 'string', 'max:255'],
            'tindakLanjut.*.deadline' => ['sometimes', 'nullable', 'string', 'max:255'],
            'tindakLanjut.*.selesai'  => ['sometimes', 'nullable'],
            'tindakLanjut.*.teks'     => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'tanggal.date_format'    => 'Format tanggal harus YYYY-MM-DD.',
            'topik.min'              => 'Topik minimal 3 karakter.',
            'topik.max'              => 'Topik maksimal 500 karakter.',
            'pimpinanRapat.min'      => 'Nama pimpinan minimal 2 karakter.',
            'notulis.min'            => 'Nama notulis minimal 2 karakter.',
            'status.in'              => 'Status harus salah satu dari: Selesai, Berlangsung, Dijadwalkan.',
        ];
    }

    /**
     * Kembalikan JSON error agar konsisten dengan respons API.
     */
    protected function failedValidation(Validator $validator): never
    {
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'pesan'   => 'Validasi gagal. Periksa kembali data yang dimasukkan.',
                'errors'  => $validator->errors(),
            ], 422)
        );
    }
}
