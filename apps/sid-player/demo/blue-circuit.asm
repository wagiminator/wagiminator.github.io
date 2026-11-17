; "Blue Circuit" – a little demo tune for the SID Player (original music and player)
        .cpu "6502"
        * = $1000

SID     = $d400
SPEED   = 6
        jmp init
        jmp play

init    ldx #$18
        lda #0
-       sta SID,x
        dex
        bpl -
        sta tick
        sta pos
        sta pos+1
        sta age1
        lda #$f1                ; filter: voice 2, resonance 15
        sta SID+$17
        lda #$1f                ; low pass, full volume
        sta SID+$18
        lda #$00                ; attack/decay, sustain/release per voice
        sta SID+5
        lda #$a6
        sta SID+6
        lda #$09
        sta SID+12
        lda #$00
        sta SID+13
        lda #$0a
        sta SID+19
        lda #$84
        sta SID+20
        lda #$08
        sta pw1+1
        sta SID+3
        sta SID+17
        lda #0
        sta pw1
        lda #1
        sta pwdir
        lda #$20
        sta cut
        sta cutdir
        rts

play    dec tick
        bpl effects
        lda #SPEED-1
        sta tick
        ; ---- next row of all three tracks
        ldy #0
        jsr fetch               ; lead
        beq +
        cmp #$fe
        bne _l1
        lda #$40
        sta SID+4               ; release
        bne +
_l1     tax
        lda flo,x
        sta SID+0
        sta f1
        lda fhi,x
        sta SID+1
        sta f1+1
        lda #$40
        sta SID+4
        lda #$41
        sta SID+4
        lda #0
        sta age1
+       ldy #1
        jsr fetch               ; bass
        beq +
        tax
        lda flo,x
        sta SID+7
        lda fhi,x
        sta SID+8
        lda #$20
        sta SID+11
        lda #$21
        sta SID+11
+       ldy #2
        jsr fetch               ; chord
        beq +
        sta chord
        lda #$40
        sta SID+18
        lda #$41
        sta SID+18
+       inc pos
        bne effects
        inc pos+1

        ; ---- effects every tick
effects inc age1
        ; pulse width sweep of the lead
        lda pwdir
        bmi _pdn
        lda pw1
        clc
        adc #$18
        sta pw1
        lda pw1+1
        adc #0
        sta pw1+1
        cmp #$0e
        bcc _pset
        lda #$ff
        sta pwdir
        bne _pset
_pdn    lda pw1
        sec
        sbc #$18
        sta pw1
        lda pw1+1
        sbc #0
        sta pw1+1
        cmp #$02
        bcs _pset
        lda #1
        sta pwdir
_pset   lda pw1
        sta SID+2
        lda pw1+1
        sta SID+3
        ; vibrato on long lead notes
        lda age1
        cmp #10
        bcc _novib
        and #3
        tax
        lda f1
        clc
        adc vib,x
        sta SID+0
        lda f1+1
        adc vibh,x
        sta SID+1
_novib  ; filter sweep on the bass
        lda cutdir
        bmi _cdn
        inc cut
        lda cut
        cmp #$70
        bcc _cset
        lda #$ff
        sta cutdir
        bne _cset
_cdn    dec cut
        lda cut
        cmp #$18
        bcs _cset
        lda #1
        sta cutdir
_cset   lda cut
        sta SID+$16
        ; arpeggio: root, third, fifth
        inc arpc
        lda arpc
        cmp #3
        bcc +
        lda #0
        sta arpc
+       tax
        lda chord
        and #$7f
        clc
        ldy chord
        bmi _min
        adc majt,x
        jmp _arp
_min    adc mint,x
_arp    tax
        lda flo,x
        sta SID+14
        lda fhi,x
        sta SID+15
        lda #$08
        sta SID+17
        rts

; fetch the byte of track y at the current row; $ff loops the whole song
fetch   lda pos
        clc
        adc trklo,y
        sta zp
        lda pos+1
        adc trkhi,y
        sta zp+1
        sty ysave
        ldy #0
        lda (zp),y
        ldy ysave
        cmp #$ff
        bne +
        lda #0
        sta pos
        sta pos+1
        beq fetch
+       cmp #0
        rts

zp      = $fb
trklo   .byte <trk1, <trk2, <trk3
trkhi   .byte >trk1, >trk2, >trk3
majt    .byte 0, 4, 7
mint    .byte 0, 3, 7
vib     .byte 0, 12, 0, 244
vibh    .byte 0, 0, 0, 255
tick    .byte 0
pos     .word 0
age1    .byte 0
f1      .word 0
pw1     .word 0
pwdir   .byte 0
cut     .byte 0
cutdir  .byte 0
chord   .byte 0
arpc    .byte 0
ysave   .byte 0
;DATA
