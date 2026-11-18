; C64 Packer: the self-extracting start of a packed program (64tass)
;
;   10 SYS 2061: moves the unpacker to the top of the memory and the packed data right
;   below it, unpacks to the address of the program (forward, in place), then starts the
;   program with JMP or RUN.
;
; FORMAT = 0: TSCrunch tokens, FORMAT = 1: Exomizer 3 bit stream (protocol flags 39).
; The values in the parameter blocks are filled in by the packer.

        .cpu "6502"
TOP     = $fc00                 ; the unpacker runs here (all RAM, $01 = $34)
src     = $fb                   ; packed data (2 bytes)
dst     = $fd                   ; unpacked data (2 bytes)
ptr     = $f9                   ; copy source (2 bytes)
tbi     = $ff00                 ; Exomizer tables: bit counts and bases (3 x 52 bytes)
tlo     = $ff34
thi     = $ff68

        * = $0801
        .word basend, 10
        .byte $9e
        .text "2061"
        .byte 0
basend  .word 0

; ---------------------------------------------------------------- boot (in the file)
boot    sei
        lda #$7f                ; no interrupts from the CIAs while the ROM is away
        sta $dc0d
        sta $dd0d
        lda $dc0d
        lda $dd0d
        lda #$1b                ; $0b blanks the screen while unpacking
p_blank = *-1
        sta $d011
        lda #0                  ; the last page of the packed data in this file ...
p_sl = *-1
        sta src
        lda #0
p_sh = *-1
        sta src+1
        lda #0                  ; ... and where it goes
p_tl = *-1
        sta dst
        lda #0
p_th = *-1
        sta dst+1
        lda #$34
        sta $01
        lda #<nmi               ; RESTORE while the ROM is away: nothing happens
        sta $fffa
        lda #>nmi
        sta $fffb
        ldx #0                  ; the unpacker to the top (three pages)
bt_img  lda image,x
        sta TOP,x
        lda image+$100,x
        sta TOP+$100,x
        lda image+$200,x
        sta TOP+$200,x
        inx
        bne bt_img
        ldy #0                  ; the packed data below it, from the end backwards
        ldx #0
p_pages = *-1
bt_cp   dey
        lda (src),y
        sta (dst),y
        cpy #0
        bne bt_cp
        dec src+1
        dec dst+1
        dex
        bne bt_cp
        jmp unpack

image
        .logical TOP
; ---------------------------------------------------------------- the unpacker (at TOP)
unpack  lda #0                  ; packed data
p_srcl = *-1
        sta src
        lda #0
p_srch = *-1
        sta src+1
        lda #0                  ; where the program goes
p_dstl = *-1
        sta dst
        lda #0
p_dsth = *-1
        sta dst+1

.if FORMAT == 0
; ---------------------------------------------------------------- TSCrunch
ts_loop jsr getbyte
        tax
        bmi ts_hi
        cmp #$20
        bcc ts_lit
        bne ts_lz2
        jmp finish
ts_lz2
        ; two bytes from close by: offset 127 - token
        eor #$7f                ; 127 - a for a in $21-$7e
        sta ofs
        lda #0
        sta ofs+1
        lda #2
        sta len
        jmp ts_copy
ts_lit  sta len                 ; literal bytes
        lda src
        sta ptr
        lda src+1
        sta ptr+1
        jsr copy
        clc                     ; skip them in the packed data
        lda src
        adc len
        sta src
        bcc ts_loop
        inc src+1
        bcs ts_loop
ts_hi   lsr a
        bcc ts_lz
        cmp #$40                ; $81: the zero run
        beq ts_zero
        and #$3f
        sta cnt                 ; run of length cnt + 1
        jsr getbyte
        jsr fill
        jmp ts_loop
ts_zero lda #0                  ; zero run length - 1
p_zero = *-1
        sta cnt
        lda #0
        jsr fill
        jmp ts_loop
ts_lz   lsr a
        bcc ts_long
        and #$1f                ; short match: length + 1, one byte offset
        sta len
        inc len
        jsr getbyte
        sta ofs
        lda #0
        sta ofs+1
        jmp ts_copy
ts_long and #$1f
        sta len
        jsr getbyte             ; offset low
        sta ofs
        jsr getbyte             ; offset high, bit 7: lowest bit of the length
        asl a
        rol len
        inc len
        sec                     ; the offset is -(lo | hi << 8) with bit 15 set
        ror a
        sta ofs+1
        ; ptr = dst + offset (a negative number)
        clc
        lda dst
        adc ofs
        sta ptr
        lda dst+1
        adc ofs+1
        sta ptr+1
        jsr copy
        jmp ts_loop
ts_copy sec                     ; ptr = dst - ofs
        lda dst
        sbc ofs
        sta ptr
        lda dst+1
        sbc ofs+1
        sta ptr+1
        jsr copy
        jmp ts_loop

; A times cnt + 1
fill    ldy cnt
fl_l    sta (dst),y
        dey
        cpy #$ff
        bne fl_l
        sec
        lda dst
        adc cnt
        sta dst
        bcc fl_e
        inc dst+1
fl_e    rts
; len bytes (1-64) from ptr to dst, upwards
copy    ldy #0
cp_l    lda (ptr),y
        sta (dst),y
        iny
        cpy len
        bne cp_l
        clc
        lda dst
        adc len
        sta dst
        bcc cp_e
        inc dst+1
cp_e    rts
cnt     .byte 0
len     .byte 0
ofs     .word 0

.else
; ---------------------------------------------------------------- Exomizer 3 (-P39)
        jsr getbyte             ; the first byte is the bit buffer as it is
        sta bitbuf
        ; the tables: 52 entries of bit count and base
        ldx #0
ti_l    txa
        and #15
        bne ti_add
        lda #1
        sta alo
        lda #0
        sta ahi
        beq ti_st
ti_add  lda #1                  ; a += 1 << previous bits
        sta vlo
        lda #0
        sta vhi
        ldy pb
        beq ti_sum
ti_sh   asl vlo
        rol vhi
        dey
        bne ti_sh
ti_sum  clc
        lda alo
        adc vlo
        sta alo
        lda ahi
        adc vhi
        sta ahi
ti_st   lda alo
        sta tlo,x
        lda ahi
        sta thi,x
        stx sx
        ldx #3
        jsr getbits
        sta pb
        ldx #1
        jsr getbits
        beq ti_b
        lda pb
        ora #8
        sta pb
ti_b    ldx sx
        lda pb
        sta tbi,x
        inx
        cpx #52
        bne ti_l
        ; the first literal comes without a flag bit
        lda #1
        sta state
        sta lit
        jsr getbyte
        jsr put
ex_loop lda state               ; was the last one a literal, the one before a match?
        asl a
        ora lit
        sta state
        jsr getbit
        bcc ex_seq
        lda #1                  ; a literal
        sta lit
        jsr getbyte
        jsr put
        jmp ex_loop
ex_seq  ldx #0                  ; Elias gamma code: zeros until a one
ex_g    jsr getbit
        bcs ex_gd
        inx
        bne ex_g
ex_gd   cpx #16
        bne ex_g1
        jmp finish
ex_g1   cpx #17
        bne ex_mat
        ldx #16                 ; literal sequence: 16 bit length
        jsr getbits
        sta len
        lda vhi
        sta len+1
        lda #1
        sta lit
        lda src
        sta ptr
        lda src+1
        sta ptr+1
        jsr copy
        lda ptr
        sta src
        lda ptr+1
        sta src+1
        jmp ex_loop
ex_mat  stx gi                  ; a match: length from table entry gi
        lda tbi,x
        tax
        jsr getbits
        ldx gi
        clc
        adc tlo,x
        sta len
        lda vhi
        adc thi,x
        sta len+1
        lda state               ; the offset again?
        and #3
        cmp #1
        bne ex_off
        jsr getbit
        bcs ex_go
ex_off  lda len+1
        bne ex_j3
        lda len
        cmp #3
        bcs ex_j3
        cmp #1
        bne ex_j2
        ldx #2                  ; length 1: entries 48-51
        jsr getbits
        clc
        adc #48
        bne ex_idx
ex_j2   ldx #4                  ; length 2: entries 32-47
        jsr getbits
        clc
        adc #32
        bne ex_idx
ex_j3   ldx #4                  ; longer: entries 16-31
        jsr getbits
        clc
        adc #16
ex_idx  sta gi
        tax
        lda tbi,x
        tax
        jsr getbits
        ldx gi
        clc
        adc tlo,x
        sta ofs
        lda vhi
        adc thi,x
        sta ofs+1
ex_go   lda #0
        sta lit
        sec
        lda dst
        sbc ofs
        sta ptr
        lda dst+1
        sbc ofs+1
        sta ptr+1
        jsr copy
        jmp ex_loop

; one bit into C
getbit  asl bitbuf
        bne gb_e
        jsr getbyte
        sec
        rol a
        sta bitbuf
gb_e    rts
; X bits (0-16) into A (low) and vhi; more than 7: the bytes come whole
getbits stx nb
        lda #0
        sta vlo
        sta vhi
        lda nb
        and #7
        tax
        beq gs_b
gs_l    jsr getbit
        rol vlo
        rol vhi
        dex
        bne gs_l
gs_b    lda nb
        lsr a
        lsr a
        lsr a
        tax
        beq gs_e
gs_bl   lda vlo
        sta vhi
        jsr getbyte
        sta vlo
        dex
        bne gs_bl
gs_e    lda vlo
        rts
put     ldy #0
        sta (dst),y
        inc dst
        bne pt_e
        inc dst+1
pt_e    rts
; len bytes (16 bit, not 0) from ptr to dst, upwards; ptr and dst move on
copy    ldy #0
cp_l    lda (ptr),y
        sta (dst),y
        inc ptr
        bne cp_1
        inc ptr+1
cp_1    inc dst
        bne cp_2
        inc dst+1
cp_2    lda len
        bne cp_3
        dec len+1
cp_3    dec len
        lda len
        ora len+1
        bne cp_l
        rts
bitbuf  .byte 0
vlo     .byte 0
vhi     .byte 0
nb      .byte 0
len     .word 0
ofs     .word 0
state   .byte 0
lit     .byte 0
gi      .byte 0
alo     .byte 0
ahi     .byte 0
pb      .byte 0
sx      .byte 0
.endif

nmi     rti
getbyte ldy #0
        lda (src),y
        inc src
        bne gt_e
        inc src+1
gt_e    rts

; ---------------------------------------------------------------- start the program
; The unpacker is under the KERNAL ROM: the last steps run from the stack page.
finish  lda #$35                ; I/O on, still no ROM
        sta $01
        lda #$1b
        sta $d011
        lda #$81                ; the timer interrupt of the KERNAL again
        sta $dc0d
        lda #0                  ; 0: JMP, 1: RUN
p_mode = *-1
        beq fn_jmp
        lda #0                  ; end of the BASIC program
p_endl = *-1
        sta $2d
        sta $2f
        sta $31
        lda #0
p_endh = *-1
        sta $2e
        sta $30
        sta $32
        lda #$3a                ; ":RUN" where BASIC goes on after SYS 2061
        sta $0200
        lda #$8a
        sta $0201
        lda #0
        sta $0202
        sta $7a
        lda #$02
        sta $7b
        lda #$60                ; RTS: back into the SYS command
        bne fn_go
fn_jmp  lda #$4c                ; JMP to the program
        ldx #0
p_startl = *-1
        ldy #0
p_starth = *-1
fn_go   sta $0105
        stx $0106
        sty $0107
        ldx #4
fn_s    lda stub,x
        sta $0100,x
        dex
        bpl fn_s
        jmp $0100
stub    lda #$37                ; ROMs on
        sta $01
        cli

iend
        .endlogical
imgend
