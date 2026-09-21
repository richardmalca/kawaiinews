<?php

use App\Support\Mp3Duration;

/**
 * Arma un MP3 sintético mínimo: un frame header MPEG1 Layer3 válido
 * (128 kbps, 44100 Hz) seguido de bytes de relleno hasta pesar lo
 * necesario para durar exactamente $seconds segundos a ese bitrate.
 */
function fakeMp3(int $seconds, string $id3Prefix = ''): string
{
    $header = "\xFF\xFB\x90\x00";
    $bitrateBytesPerSecond = 128000 / 8; // 16000

    $totalBodyBytes = $bitrateBytesPerSecond * $seconds;
    $padding = str_repeat('a', max(0, $totalBodyBytes - strlen($header)));

    return $id3Prefix.$header.$padding;
}

test('it calculates the duration of a plain mp3 without an id3 tag', function () {
    $contents = fakeMp3(10);

    expect(Mp3Duration::seconds($contents))->toBe(10);
});

test('it skips an id3v2 header before looking for the mpeg frame', function () {
    // "ID3", version (2 bytes), flags (1 byte), tamaño syncsafe de 20 bytes
    // de metadata (4 bytes) + esos 20 bytes de relleno del tag en sí.
    $id3 = "ID3\x03\x00\x00".pack('C4', 0, 0, 0, 20).str_repeat('x', 20);

    $contents = fakeMp3(5, $id3);

    expect(Mp3Duration::seconds($contents))->toBe(5);
});

test('it returns null for content with no valid mpeg frame', function () {
    expect(Mp3Duration::seconds('not an mp3 at all'))->toBeNull();
});
