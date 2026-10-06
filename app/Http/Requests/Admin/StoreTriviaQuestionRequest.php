<?php

namespace App\Http\Requests\Admin;

use App\Models\TriviaQuestion;
use Illuminate\Foundation\Http\FormRequest;

class StoreTriviaQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'question' => ['required', 'string', 'max:500'],
            'active_date' => ['nullable', 'date'],
            'is_active' => ['boolean'],
            // Siempre selector de opciones, nunca respuesta libre: entre 2
            // y 5 alternativas, y exactamente una marcada como correcta.
            'options' => ['required', 'array', 'min:2', 'max:5'],
            'options.*.label' => ['required', 'string', 'max:255'],
            'options.*.is_correct' => ['boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $correctCount = collect($this->input('options', []))
                ->filter(fn ($option) => ! empty($option['is_correct']))
                ->count();

            if ($correctCount !== 1) {
                $validator->errors()->add('options', 'Debe haber exactamente una opción marcada como correcta.');
            }

            $activeDate = $this->input('active_date');

            // Comparamos por whereDate, no con un unique() de columna
            // normal: el cast "date" del modelo guarda la hora en 00:00:00
            // junto a la fecha, así que una igualdad de string exacta no
            // siempre detecta el duplicado real.
            if ($activeDate) {
                $exists = TriviaQuestion::query()
                    ->whereDate('active_date', $activeDate)
                    ->when($this->route('trivia'), fn ($query, $trivia) => $query->whereKeyNot($trivia))
                    ->exists();

                if ($exists) {
                    $validator->errors()->add('active_date', 'Ya hay una pregunta programada para ese día.');
                }
            }
        });
    }
}
