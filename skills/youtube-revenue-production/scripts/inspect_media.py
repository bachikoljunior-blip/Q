#!/usr/bin/env python3
"""Read-only media diagnostics. No inference of native speech or device playback.

Requires Python 3.10+, ffmpeg and ffprobe. Exit 0 means diagnostics ran and the
file decoded, even when flags require review; 1 means inspection/decode failed.
"""
from __future__ import annotations

import argparse
import array
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import struct
import subprocess
import sys
import tempfile


def db(value: float) -> float | None:
    return round(10 * math.log10(value), 4) if value > 0 else None


def number(value) -> float | None:
    try:
        result = float(value)
        return result if math.isfinite(result) else None
    except (ValueError, TypeError):
        return None


def faststart(path: Path) -> bool | None:
    if path.suffix.lower() not in {'.mp4', '.mov', '.m4v', '.m4a'}:
        return None
    positions = {}
    total = path.stat().st_size
    with path.open('rb') as src:
        position = 0
        while position + 8 <= total:
            src.seek(position)
            length, kind = struct.unpack('>I4s', src.read(8))
            header = 8
            if length == 1:
                extra = src.read(8)
                if len(extra) != 8:
                    return None
                length = struct.unpack('>Q', extra)[0]
                header = 16
            if length == 0:
                length = total - position
            if length < header or position + length > total:
                return None
            positions.setdefault(kind, position)
            position += length
    if b'moov' not in positions or b'mdat' not in positions:
        return None
    return positions[b'moov'] < positions[b'mdat']


def pcm_stats(path: Path, stream: dict) -> dict:
    original_channels = int(stream.get('channels', 1))
    channels = 2 if original_channels == 2 else 1
    command = ['ffmpeg', '-v', 'error', '-nostdin', '-i', str(path),
               '-map', f'0:{stream["index"]}', '-vn', '-ac', str(channels),
               '-ar', '16000', '-c:a', 'pcm_f32le', '-f', 'f32le', '-']
    n = 0
    sx = sy = ex = ey = xy = 0.0
    peak = 0.0
    with tempfile.TemporaryFile() as errors:
        proc = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=errors)
        pending = b''
        while True:
            chunk = proc.stdout.read(65536)
            if not chunk:
                break
            pending += chunk
            usable = len(pending) // (4 * channels) * (4 * channels)
            values = array.array('f')
            values.frombytes(pending[:usable])
            pending = pending[usable:]
            if sys.byteorder != 'little':
                values.byteswap()
            if not values:
                continue
            left = values[0::channels]
            n += len(left)
            sx += math.fsum(left)
            ex += math.fsum(v * v for v in left)
            peak = max(peak, max(abs(v) for v in values))
            if channels == 2:
                right = values[1::2]
                sy += math.fsum(right)
                ey += math.fsum(v * v for v in right)
                xy += math.fsum(a * b for a, b in zip(left, right))
        proc.stdout.close()
        if proc.wait() or pending:
            errors.seek(0)
            raise RuntimeError('PCM decoding failed: ' + errors.read(2000).decode(errors='replace'))
    result = {'analysis_sample_rate_hz': 16000, 'frames': n,
              'original_channels': original_channels,
              'measurement_layout': 'stereo' if channels == 2 else 'mono' if original_channels == 1 else 'multichannel_downmix_to_mono',
              'sample_peak_dbfs_at_analysis_rate': db(peak * peak),
              'stereo_analysis_applicable': original_channels == 2}
    if not n:
        result['rms_dbfs'] = None
        result['near_silence'] = True
        return result
    energy = ex / n if channels == 1 else (ex + ey) / (2 * n)
    result.update(rms_dbfs=db(energy), near_silence=energy < 1e-7)
    if channels == 2:
        variance = max(0.0, ex - sx * sx / n) * max(0.0, ey - sy * sy / n)
        correlation = (xy - sx * sy / n) / math.sqrt(variance) if variance > 0 else None
        mono_energy = max(0.0, (ex + ey + 2 * xy) / (4 * n))
        ratio = mono_energy / energy if energy > 0 else None
        result.update(left_rms_dbfs=db(ex / n), right_rms_dbfs=db(ey / n),
                      left_right_correlation=round(max(-1.0, min(1.0, correlation)), 6) if correlation is not None else None,
                      mono_rms_dbfs=db(mono_energy),
                      mono_change_vs_mean_channel_db=db(ratio) if ratio is not None else None,
                      mono_cancels_to_zero=energy > 1e-7 and mono_energy <= 1e-15,
                      possible_stereo_cancellation=energy > 1e-7 and ratio is not None and ratio < 10 ** (-12 / 10))
    return result


def loudness(path: Path, stream: dict) -> dict:
    proc = subprocess.run(['ffmpeg', '-hide_banner', '-nostdin', '-i', str(path),
                           '-map', f'0:{stream["index"]}', '-vn', '-af',
                           'loudnorm=I=-16:TP=-1.5:LRA=7:print_format=json',
                           '-f', 'null', '-'], capture_output=True, text=True)
    matches = re.findall(r'\{\s*"input_i".*?\}', proc.stderr, re.S)
    if proc.returncode or not matches:
        return {'measured': False, 'reason': 'FFmpeg loudness measurement unavailable'}
    values = json.loads(matches[-1])
    return {'measured': True, 'integrated_lufs': number(values['input_i']),
            'true_peak_dbtp': number(values['input_tp']),
            'loudness_range_lu': number(values['input_lra']),
            'note': 'Mono and stereo integrated values are not directly interchangeable.'}


def inspect(path: Path) -> dict:
    for executable in ['ffmpeg', 'ffprobe']:
        if not shutil.which(executable):
            raise RuntimeError(f'{executable} is required')
    if not path.is_file():
        raise RuntimeError('Input file is missing')
    probe = subprocess.run(['ffprobe', '-v', 'error', '-show_format', '-show_streams',
                            '-of', 'json', str(path)], capture_output=True, text=True)
    if probe.returncode:
        raise RuntimeError('ffprobe failed: ' + probe.stderr[:2000])
    metadata = json.loads(probe.stdout)
    audios = [s for s in metadata.get('streams', []) if s['codec_type'] == 'audio']
    videos = [s for s in metadata.get('streams', []) if s['codec_type'] == 'video']
    digest = hashlib.sha256()
    with path.open('rb') as src:
        for chunk in iter(lambda: src.read(1024 * 1024), b''):
            digest.update(chunk)
    decoded = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', '-i', str(path),
                              '-map', '0:v?', '-map', '0:a?', '-f', 'null', '-'],
                             capture_output=True, text=True)
    clean_decode = decoded.returncode == 0 and not decoded.stderr.strip()
    report = {'file': str(path), 'sha256': digest.hexdigest(), 'bytes': path.stat().st_size,
              'duration_seconds': number(metadata.get('format', {}).get('duration')),
              'full_decode_ok': clean_decode, 'decode_messages': decoded.stderr[:2000],
              'faststart': faststart(path), 'audio_stream_count': len(audios),
              'video_streams': [{k: s.get(k) for k in ['index', 'codec_name', 'profile', 'width', 'height', 'pix_fmt', 'avg_frame_rate']} for s in videos],
              'flags': [], 'scope': 'file_diagnostics_only',
              'native_speech_listened_to': False, 'speaker_device_tested': False,
              'audience_entertainment_tested': False}
    if not clean_decode:
        report['flags'].append('decode_errors')
    if report['faststart'] is False:
        report['flags'].append('mp4_moov_after_mdat')
    if not audios:
        report['flags'].append('audio_missing')
        return report
    selected = next((s for s in audios if s.get('disposition', {}).get('default')), audios[0])
    report['selected_audio_stream'] = {k: selected.get(k) for k in ['index', 'codec_name', 'profile', 'sample_rate', 'channels', 'channel_layout', 'disposition']}
    if len(audios) > 1:
        report['flags'].append('multiple_audio_tracks_only_selected_track_analyzed')
    stats = pcm_stats(path, selected)
    report['signal'] = stats
    report['loudness'] = loudness(path, selected)
    if stats['near_silence']:
        report['flags'].append('audio_near_silence')
    if stats.get('possible_stereo_cancellation'):
        report['flags'].append('possible_stereo_cancellation')
    if not stats['stereo_analysis_applicable'] and selected.get('channels', 1) > 2:
        report['flags'].append('multichannel_stereo_cancellation_not_tested')
    peak = report['loudness'].get('true_peak_dbtp')
    if peak is not None and peak >= 0:
        report['flags'].append('true_peak_at_or_above_zero')
    return report


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('media', type=Path)
    parser.add_argument('--output', type=Path, help='Write JSON here; overwrites an existing report')
    args = parser.parse_args()
    source = args.media.resolve()
    if args.output and (args.output.resolve() == source or (source.exists() and args.output.exists() and args.output.samefile(source))):
        parser.error('Report path must not overwrite the input media')
    try:
        report = inspect(source)
    except (OSError, RuntimeError, ValueError, KeyError) as error:
        report = {'file': str(source), 'inspection_error': str(error), 'full_decode_ok': False,
                  'scope': 'file_diagnostics_only', 'native_speech_listened_to': False,
                  'speaker_device_tested': False, 'audience_entertainment_tested': False}
    rendered = json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + '\n'
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(rendered, encoding='utf-8')
    print(rendered, end='')
    return 0 if report.get('full_decode_ok') else 1


if __name__ == '__main__':
    raise SystemExit(main())
