# Builds the demo tune "Blue Circuit" (needs python3 and 64tass): writes demo.asm and blue-circuit.sid
NOTES = {'C':0,'C#':1,'D':2,'D#':3,'E':4,'F':5,'F#':6,'G':7,'G#':8,'A':9,'A#':10,'B':11}
def n(s):
    name, octv = s[:-1], int(s[-1]); return octv*12 + NOTES[name]
# lead melody: (note or 'R', rows); 16 rows per bar
A = [('E5',4),('A5',4),('G5',2),('E5',2),('D5',4), ('C5',6),('D5',2),('E5',4),('C5',4),
     ('G4',4),('C5',4),('E5',4),('G5',4), ('F5',2),('E5',2),('D5',4),('B4',8),
     ('E5',4),('A5',4),('B5',2),('A5',2),('G5',4), ('A5',6),('G5',2),('F5',4),('E5',4),
     ('D5',4),('E5',4),('G5',4),('E5',4), ('D5',8),('B4',4),('R',4)]
B = [('A5',2),('A5',2),('C6',4),('A5',4),('G5',4), ('B5',2),('B5',2),('D6',4),('B5',4),('G5',4),
     ('C6',4),('B5',4),('A5',4),('E5',4), ('A5',12),('R',4),
     ('F5',2),('G5',2),('A5',4),('C6',4),('A5',4), ('G5',2),('A5',2),('B5',4),('D6',4),('B5',4),
     ('E6',4),('D6',4),('C6',4),('G5',4), ('B5',8),('D6',4),('B5',4)]
chordsA = ['A2m','F2','C3','G2','A2m','F2','C3','G2']
chordsB = ['F2','G2','A2m','A2m','F2','G2','C3','G2']
intro_chords = ['A2m','A2m']
def lead_rows(seq):
    rows = []
    for note, ln in seq:
        rows.append(0xFE if note == 'R' else n(note))
        rows += [0] * (ln - 1)
    return rows
lead = [0xFE]*32 + lead_rows(A) + lead_rows(B)
def chord(c):
    minor = c.endswith('m'); root = n(c.rstrip('m')); return root, minor
bass, arp = [], []
for c in intro_chords + chordsA + chordsB:
    root, minor = chord(c)
    # bass: root and octave in a driving rhythm
    pat = [root, 0, 0, root+12, 0, 0, root, 0, root+12, 0, 0, root, 0, 0, root+12, 0]
    bass += [x if x else 0 for x in pat]
    # arpeggio chord (root, bit 7 = minor), retriggered every quarter
    ch = root + 12 + (0x80 if minor else 0)
    arp += [ch, 0, 0, 0] * 4
assert len(lead) == len(bass) == len(arp), (len(lead), len(bass), len(arp))
# frequency table (PAL)
freq = [round(440 * 2 ** ((k - 57) / 12) * 16777216 / 985248) for k in range(96)]
freq = [min(f, 0xFFFF) for f in freq]
def bytes_(name, data):
    out = [f"{name}"]
    for i in range(0, len(data), 16):
        out.append("        .byte " + ",".join(f"${b:02x}" for b in data[i:i+16]))
    return "\n".join(out)
asm = open('blue-circuit.asm').read()
asm = asm.replace(';DATA', "\n".join([
    bytes_('flo', [f & 255 for f in freq]), bytes_('fhi', [f >> 8 for f in freq]),
    bytes_('trk1', lead + [0xFF]), bytes_('trk2', bass + [0xFF]), bytes_('trk3', arp + [0xFF])]))
open('demo.asm', 'w').write(asm)
print('rows', len(lead), 'seconds', len(lead) * 6 / 50)
import struct, subprocess
subprocess.run(['64tass','-q','--nostart','-o','code.bin','demo.asm'], check=True)
code = open('code.bin','rb').read()
def s32(t): b = t.encode('latin-1'); return b + bytes(32 - len(b))
hdr = b'PSID' + struct.pack('>HHHHHHHI', 2, 0x7C, 0x1000, 0x1000, 0x1003, 1, 1, 0) + s32('Blue Circuit') + s32('wagiminator.github.io') + s32('2026 SID Player demo') + struct.pack('>H', 0x34) + bytes(4)
assert len(hdr) == 0x7C
open('blue-circuit.sid','wb').write(hdr + code)
print('sid bytes', len(hdr + code))
