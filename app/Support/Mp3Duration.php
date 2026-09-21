<?php

namespace App\Support;

/**
 * Calcula la duración aproximada de un MP3 leyendo el primer frame válido
 * (bitrate, sample rate) y asumiendo CBR — que es lo que devuelven los
 * proveedores de TTS que usa el sitio (Google Cloud TTS, OpenAI,
 * ElevenLabs), así que alcanza sin agregar una dependencia nueva (getID3,
 * ffprobe) solo para esto.
 */
class Mp3Duration
{
    private const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];

    private const SAMPLE_RATES_V1 = [44100, 48000, 32000];

    public static function seconds(string $contents): ?int
    {
        $offset = self::skipId3v2Header($contents);
        $frame = self::firstFrame($contents, $offset);

        if (! $frame) {
            return null;
        }

        [$bitrateKbps, $sampleRate] = $frame;

        if ($bitrateKbps <= 0 || $sampleRate <= 0) {
            return null;
        }

        $bodyLength = strlen($contents) - $offset;
        $bitrateBps = $bitrateKbps * 1000;

        return (int) round(($bodyLength * 8) / $bitrateBps);
    }

    private static function skipId3v2Header(string $contents): int
    {
        if (substr($contents, 0, 3) !== 'ID3') {
            return 0;
        }

        // Tamaño del header ID3v2: 4 bytes "syncsafe" (7 bits útiles cada
        // uno) a partir del byte 6, más los 10 bytes del header en sí.
        $bytes = array_map('ord', str_split(substr($contents, 6, 4)));
        $size = ($bytes[0] << 21) | ($bytes[1] << 14) | ($bytes[2] << 7) | $bytes[3];

        return $size + 10;
    }

    /**
     * @return array{0: int, 1: int}|null [bitrate en kbps, sample rate en Hz]
     */
    private static function firstFrame(string $contents, int $offset): ?array
    {
        $length = strlen($contents);

        for ($i = $offset; $i < $length - 4; $i++) {
            if (ord($contents[$i]) !== 0xFF || (ord($contents[$i + 1]) & 0xE0) !== 0xE0) {
                continue;
            }

            $byte2 = ord($contents[$i + 2]);
            $bitrateIndex = ($byte2 >> 4) & 0x0F;
            $sampleRateIndex = ($byte2 >> 2) & 0x03;

            if ($bitrateIndex === 0 || $bitrateIndex === 15 || $sampleRateIndex === 3) {
                continue;
            }

            return [self::BITRATES_V1_L3[$bitrateIndex], self::SAMPLE_RATES_V1[$sampleRateIndex]];
        }

        return null;
    }
}
