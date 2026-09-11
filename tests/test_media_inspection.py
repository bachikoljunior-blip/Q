"""Exercise media diagnostics against real synthetic files, without network calls."""
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import struct
import subprocess
import sys
import tempfile
import unittest
import wave

ROOT=Path(__file__).resolve().parents[1]
SKILL=Path(os.environ.get('Q_SKILL_DIR',ROOT/'skills/youtube-revenue-production'))
SCRIPT=SKILL/'scripts/inspect_media.py'
spec=importlib.util.spec_from_file_location('media_inspection',SCRIPT)
media=importlib.util.module_from_spec(spec);spec.loader.exec_module(media)


class Diagnostics(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.root=Path(self.temp.name)
    def tearDown(self):self.temp.cleanup()
    def signal(self,name,channels=2,right=1,silent=False):
        path=self.root/name
        with wave.open(str(path),'wb') as wav:
            wav.setnchannels(channels);wav.setsampwidth(2);wav.setframerate(48000)
            frames=[]
            for i in range(48000):
                sample=0 if silent else round(5000*math.sin(2*math.pi*440*i/48000))
                values=[sample] if channels==1 else [sample,round(sample*right)]
                frames.append(struct.pack('<'+'h'*channels,*values))
            wav.writeframes(b''.join(frames))
        return path
    def test_centered_stereo_keeps_mono_energy(self):
        p=self.signal('centered.wav');before=hashlib.sha256(p.read_bytes()).hexdigest()
        r=media.inspect(p)
        self.assertTrue(r['full_decode_ok']);self.assertNotIn('possible_stereo_cancellation',r['flags'])
        self.assertAlmostEqual(r['signal']['mono_change_vs_mean_channel_db'],0,places=3)
        self.assertFalse(r['native_speech_listened_to']);self.assertFalse(r['speaker_device_tested'])
        self.assertEqual(before,hashlib.sha256(p.read_bytes()).hexdigest())
    def test_opposite_phase_is_flagged(self):
        r=media.inspect(self.signal('opposite.wav',right=-1))
        self.assertIn('possible_stereo_cancellation',r['flags'])
        self.assertTrue(r['signal']['mono_cancels_to_zero'])
        self.assertLess(r['signal']['left_right_correlation'],-.99)
    def test_silence_is_not_misdiagnosed_as_phase(self):
        r=media.inspect(self.signal('silent.wav',silent=True))
        self.assertIn('audio_near_silence',r['flags']);self.assertNotIn('possible_stereo_cancellation',r['flags'])
        json.dumps(r,allow_nan=False)
    def test_mono_and_one_sided_audio_do_not_imply_cancellation(self):
        for name,channels,right in [('mono.wav',1,1),('left_only.wav',2,0)]:
            r=media.inspect(self.signal(name,channels=channels,right=right))
            self.assertNotIn('possible_stereo_cancellation',r['flags'])
            self.assertNotIn('audio_near_silence',r['flags'])
    def test_mp4_audio_absence_and_atom_order(self):
        for name,flags,expected in [('fast.mp4',['-movflags','+faststart'],True),('tail.mp4',[],False)]:
            p=self.root/name
            subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-f','lavfi','-i','color=c=black:s=64x64:r=10:d=0.4','-an','-c:v','libx264','-pix_fmt','yuv420p',*flags,str(p)],check=True)
            r=media.inspect(p);self.assertTrue(r['full_decode_ok'])
            self.assertIn('audio_missing',r['flags']);self.assertIs(r['faststart'],expected)
    def test_report_cannot_overwrite_input_or_hardlink(self):
        p=self.signal('keep.wav');alias=self.root/'alias.json';os.link(p,alias)
        before=p.read_bytes()
        for output in [p,alias]:
            result=subprocess.run([sys.executable,str(SCRIPT),str(p),'--output',str(output)],capture_output=True)
            self.assertEqual(result.returncode,2)
        self.assertEqual(p.read_bytes(),before)
    def test_bad_file_produces_failure_report(self):
        p=self.root/'broken.mp4';p.write_bytes(b'not a media file')
        output=self.root/'diagnosis.json'
        r=subprocess.run([sys.executable,str(SCRIPT),str(p),'--output',str(output)],capture_output=True,text=True)
        self.assertEqual(r.returncode,1)
        report=json.loads(output.read_text());self.assertFalse(report['full_decode_ok'])
        self.assertFalse(report['speaker_device_tested'])

if __name__=='__main__':unittest.main()
