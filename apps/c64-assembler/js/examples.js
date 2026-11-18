/* C64 Assembler: example programs (written for this app) */
window.AsmExamples = [
  {
    name: "Hello",
    text: `; Hello: clears the screen, sets the colours and prints a line.
; RUN starts it, RTS goes back to BASIC.

        * = $0801
        .basic                  ; 10 SYS 2061: the code right after this line

CHROUT  = $ffd2                 ; KERNAL: print a character

        lda #0                  ; black border and background
        sta $d020
        sta $d021
        lda #13                 ; light green text
        sta $0286
        ldx #0
-       lda text,x
        beq +                   ; 0 ends the text
        jsr CHROUT
        inx
        bne -
+       rts

text    .text 147               ; clear the screen
        .text "hello from the c64 assembler!", 13, 13
        .text "edit the code and press ctrl+enter.", 13, 0
`
  },
  {
    name: "Raster bars",
    text: `; Raster bars: changes the border and background colour on
; every raster line, and moves the bars a little each frame.

        * = $0801
        .basic

BARS    = 64                    ; lines of colour

        sei                     ; the timing must not be disturbed
frame   lda #$f0                ; wait for the bottom of the screen
-       cmp $d012
        bne -
        inc phase               ; move the bars
        lda phase
        and #$3f
        clc
        adc #$50
        sta top
-       cmp $d012               ; wait for the first line of the bars
        bne -
        ldx #0
line    txa                     ; a colour for every 4 lines
        lsr a
        lsr a
        clc
        adc phase
        and #$0f
        tay
        lda colours,y
        ldy $d012
-       cpy $d012               ; wait for the next line
        beq -
        sta $d020
        sta $d021
        inx
        cpx #BARS
        bne line
        lda #6                  ; back to the usual blue
        sta $d020
        sta $d021
        jmp frame

phase   .byte 0
top     .byte 0
colours .byte 6, 14, 3, 1, 3, 14, 6, 0
        .byte 2, 10, 7, 1, 7, 10, 2, 0
`
  },
  {
    name: "Sprite",
    text: `; Sprite: a ball that bounces around the screen.
; Shows sprite registers, a raster wait and a macro.

        * = $0801
        .basic

SPRITE  = $2000                 ; sprite data (64 bytes, in the VIC bank)

; move a coordinate by its speed and turn round at the edges
bounce  .macro pos, speed, min, max
        lda \\pos
        clc
        adc \\speed
        sta \\pos
        cmp #\\min
        bcc _turn
        cmp #\\max
        bcc _done
_turn   lda #0
        sec
        sbc \\speed
        sta \\speed
_done
        .endm

        lda #SPRITE / 64        ; sprite pointer
        sta $07f8
        lda #1                  ; sprite 0 on
        sta $d015
        lda #7                  ; yellow
        sta $d027
loop    lda #$fb                ; once a frame
-       cmp $d012
        bne -
        bounce xpos, dx, 26, 230
        bounce ypos, dy, 52, 228
        lda xpos
        sta $d000
        lda ypos
        sta $d001
        jmp loop

xpos    .byte 100
ypos    .byte 80
dx      .byte 2
dy      .byte 1

        * = SPRITE
        .byte %00000000, %11111111, %00000000
        .byte %00000011, %11111111, %11000000
        .byte %00000111, %11111111, %11100000
        .byte %00011111, %11111111, %11111000
        .byte %00011111, %11111111, %11111000
        .byte %00111111, %11111111, %11111100
        .rept 4
        .byte %01111111, %11111111, %11111110
        .endr
        .byte %11111111, %11111111, %11111111
        .rept 4
        .byte %01111111, %11111111, %11111110
        .endr
        .byte %00111111, %11111111, %11111100
        .byte %00011111, %11111111, %11111000
        .byte %00011111, %11111111, %11111000
        .byte %00000111, %11111111, %11100000
        .byte %00000011, %11111111, %11000000
        .byte %00000000, %11111111, %00000000
`
  },
  {
    name: "Sound",
    text: `; Sound: plays a little tune on voice 1 of the SID, again and again.

        * = $0801
        .basic

SID     = $d400
LEN     = 12                    ; frames per note

        lda #15                 ; volume
        sta SID+24
        lda #$09                ; attack 0, decay 9
        sta SID+5
        lda #$00                ; sustain 0, release 0
        sta SID+6
        sei
next    ldx pos
        lda tune,x              ; note number, $ff: from the start
        cmp #$ff
        bne +
        lda #0
        sta pos
        beq next
+       tay
        lda freqlo,y
        sta SID+0
        lda freqhi,y
        sta SID+1
        lda #$10                ; triangle, gate off ...
        sta SID+4
        lda #$11                ; ... and on: the note starts
        sta SID+4
        inc pos
        ldy #LEN
wait    lda #$fa                ; wait LEN frames
-       cmp $d012
        bne -
-       cmp $d012
        beq -
        dey
        bne wait
        jmp next

pos     .byte 0
tune    .byte 0, 2, 4, 5, 7, 7, 9, 9, 9, 9, 7, 7
        .byte 5, 5, 5, 5, 4, 4, 2, 2, 2, 2, 0, 0, $ff
; C4 to C5 (PAL)
freqlo  .byte <$1167, <$1270, <$1389, <$14b2, <$15ed, <$173b, <$189c, <$1a13, <$1ba0, <$1d45, <$1f02, <$20da, <$22ce
freqhi  .byte >$1167, >$1270, >$1389, >$14b2, >$15ed, >$173b, >$189c, >$1a13, >$1ba0, >$1d45, >$1f02, >$20da, >$22ce
`
  },
  {
    name: "Scroller",
    text: `; Scroller: a line of text moves smoothly across the bottom row.
; The VIC moves the picture by 0-7 pixels; every 8 pixels the
; characters move one place.

        * = $0801
        .basic

ROW     = $0400 + 24 * 40       ; the last line of the screen

        lda #147                ; clear the screen
        jsr $ffd2
        ldx #39                 ; colour of the bottom line
        lda #1
-       sta $d800 + 24 * 40,x
        dex
        bpl -
        lda $d016               ; 38 columns: the edges stay hidden
        and #$f7
        sta $d016
loop    lda #$f8                ; below the text
-       cmp $d012
        bne -
        dec fine
        bpl set
        lda #7
        sta fine
        ldx #0                  ; one character to the left
-       lda ROW + 1,x
        sta ROW,x
        inx
        cpx #39
        bne -
        ldy pos                 ; and a new one on the right
        lda text,y
        cmp #$ff
        bne +
        ldy #0
        sty pos
        lda text
+       sta ROW + 39
        inc pos
set     lda $d016
        and #$f8
        ora fine
        sta $d016
        jmp loop

fine    .byte 7
pos     .byte 0
text    .screen "this text is written in screen codes with .screen ...    "
        .byte $ff
`
  }
];
