; C64 Packer: tape turbo loader (64tass)
;
; The tape starts with a normal KERNAL file: its header carries this loader in the
; cassette buffer (header bytes 21-191 at $0351); the file itself is just the CHRIN
; vector ($0324), so the loader starts by itself when BASIC wants the next input line
; after LOAD. The loader reads the program in turbo format:
;
;   pulses: bit 0 short (224 cycles), bit 1 long (384 cycles), bytes from the highest bit
;   a block: pilot of $40 bytes, $5A, end address (+1) and load address (high bytes
;   first), the bytes, XOR checksum. The first block is the second part of the loader
;   ($0110), the second one the program.
;
; Timer B of CIA 1 runs one-shot from every pulse; when it has run out at the next
; pulse, the pulse was long.

        .cpu "6502"
THR     = 300                   ; cycles between short and long
ptr     = $ac
eptr    = $ae
byte    = $a3
chk     = $a4
CHRIN   = $f157                 ; the usual CHRIN routine (C64 KERNAL and Open ROMs)

        * = $0351
loader  sei
        lda #<CHRIN             ; CHRIN as before
        sta $0324
        lda #>CHRIN
        sta $0325
        lda #0                  ; keys typed after LOAD are not wanted
        sta $c6
        lda #$0b                ; screen off: no bad lines that delay the pulse checks
        sta $d011
        lda $01                 ; motor on
        and #$df
        sta $01
        lda #<THR
        sta $dc06
        lda #>THR
        sta $dc07
        jsr block               ; the second part of the loader ...
        bne error
        jmp stage2              ; ... goes on with the program
error   lda #2                  ; checksum wrong: red border, stop
        sta $d020
        jmp *

; one turbo block: pilot, sync, end and load address, bytes, checksum; Z = 1 if right
block   jsr rdbit               ; find the bits of the pilot
        rol byte
        lda byte
        cmp #$bf                ; $40 inverted
        bne block
sy_b    jsr rdbyte
        cmp #$40
        beq sy_b
        cmp #$5a
        bne block
        ldy #3                  ; eptr+1, eptr, ptr+1, ptr
ad_l    jsr rdbyte
        sta ptr,y
        dey
        bpl ad_l
        ldy #0
        sty chk
ld_l    jsr rdbyte
        sta (ptr),y
        sta $d020               ; stripes in the border
        eor chk
        sta chk
        inc ptr
        bne ld_c
        inc ptr+1
ld_c    lda ptr
        cmp eptr
        lda ptr+1
        sbc eptr+1
        bcc ld_l
        jsr rdbyte
        eor chk                 ; 0 if right
        rts

; one bit: C = 1 for a short pulse (bit 0)
rdbit   lda #$10
rb_w    bit $dc0d
        beq rb_w
        lda $dc0f
        lsr a
        lda #$19                ; again: force load, one-shot, start
        sta $dc0f
        rts
rdbyte  ldx #8
rby_l   jsr rdbit
        rol byte
        dex
        bne rby_l
        lda byte
        eor #$ff
        rts
hdrend
        .cerror * > $03fc, "the loader is too long for the cassette buffer"

; ---------------------------------------------------------------- the second part (first turbo block)
; in the lower part of the stack page: only needed until the program starts
        * = $0110
stage2  jsr block               ; the program
        tax
        lda $01                 ; motor off
        ora #$20
        sta $01
        txa
        beq st_ok
        jmp error
st_ok   lda #$1b
        sta $d011
        lda #$0e
        sta $d020
        ldx #4                  ; end of a BASIC program: $2d, $2f, $31
st_e    lda eptr
        sta $2d,x
        lda eptr+1
        sta $2e,x
        dex
        dex
        bpl st_e
        lda #0                  ; 0: JMP, 1: RUN
p_mode = *-1
        bne st_run
        cli
        jmp $0000
p_start = *-2
st_run  lda #<feed              ; BASIC gets RUN and Return as its next input line
        sta $0324
        lda #>feed
        sta $0325
        cli
        ldx #0                  ; (the input line is empty so far)
; CHRIN for a while: the characters of RUN
feed    stx fx
        sty fy
        ldx fidx
        lda runtxt,x
        inc fidx
        cmp #13
        bne fd_e
        ldx #<CHRIN             ; the last one: CHRIN as before
        stx $0324
        ldx #>CHRIN
        stx $0325
fd_e    ldx fx
        ldy fy
        clc
        rts
runtxt  .byte $52, $55, $4e, 13 ; RUN
fidx    .byte 0
fx      .byte 0
fy      .byte 0
stage2end
        .cerror * > $01b0, "the second part is too long"

; ---------------------------------------------------------------- the KERNAL file ($0324-$0325)
        * = $0324
file    .word loader            ; CHRIN: the loader
fileend
