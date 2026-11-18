; C64 SID Tracker: the music player of the songs (64tass)
;
;   +0  JMP init    (A: ignored; the settings below say where to start)
;   +3  JMP play    (once per frame, or more often with a CIA timer)
;   +6  JMP jam     (A: voice 0-2, X: note 1-95 or 0 for key off, Y: instrument)
;
; The song data follows the player. Table addresses are filled in by the tracker:
; every label p_<table>_<n> marks an instruction whose operand is TAB + offset.
; The player uses no zero page; the pattern and order list pointers are self-modifying.
;
; Pattern bytes (one row ends with a note, a key off or a run of empty rows):
;   $00        end of the pattern
;   $01-$5F    note (C-0 .. A#7)
;   $61        key off
;   $80-$8F p  command 0-F with parameter p
;   $A0-$BF    instrument 0-31
;   $C0-$FF    1-64 rows without a new note
; Order list bytes: $00-$7F pattern, $80-$BF transpose ($A0 = none), $FF n: go to n.
; Wave table rows (waveform, note): waveform $00 keeps the waveform, $FF jumps to
; the row in the note byte ($FF: stop); note $00-$7F relative (signed, 7 bits),
; $80+n absolute note n.

        .cpu "6502"
SID     = $d400
TAB     = $ff00

        * = BASE

        jmp init
        jmp play
        jmp jam

; ---------------------------------------------------------------- settings
startpos .byte 0,0,0            ; start index in the order list of each voice
starttr  .byte 0,0,0            ; transpose at the start
skiprows .byte 0                ; rows to skip silently at the start
initspd  .byte 6                ; frames per row
cialo    .byte 0                ; CIA timer for several calls per frame (0: once a frame)
ciahi    .byte 0
autoplay .byte 1                ; 0: start silent, only notes played with jam sound
keepsid  .byte 0                ; 1: leave the SID as it is
olo      .byte 0,0,0            ; order list of each voice
ohi      .byte 0,0,0
sidoff   .byte 0,7,14
vbits    .byte 1,2,4
zero     .byte 0

; ---------------------------------------------------------------- init
init    ldx #0
        lda #0
in_clr  sta vars,x
        inx
        cpx #varsend-vars
        bne in_clr
        lda initspd
        sta speed
        lda autoplay
        sta songon
        lda #$0f
        sta mvol
        ldx #2
in_v    lda startpos,x
        sta ordpos,x
        lda starttr,x
        sta trans,x
        lda #$ff
        sta wpos,x
        lda #<zero              ; the first row starts the first pattern
        sta plo,x
        lda #>zero
        sta phi,x
        dex
        bpl in_v
        lda keepsid             ; the tracker changes the song while it plays
        bne in_cia
        ldx #$18
        lda #0
in_sid  sta SID,x
        dex
        bpl in_sid
in_cia  lda ciahi
        beq in_skip
        lda cialo
        sta $dc04
        lda ciahi
        sta $dc05
in_skip ldy skiprows
        beq in_end
in_row  sty skipcnt
        ldx #2
in_vc   lda rows,x
        beq in_new
        dec rows,x
        inc vrow,x
        jmp in_nx
in_new  jsr fetch
        jsr settle
in_nx   dex
        bpl in_vc
        ldy skipcnt
        dey
        bne in_row
in_end  rts

; a row while skipping: only what later rows need
settle  jsr rowpos
        lda pins,x
        beq se_1
        sta ins,x
se_1    lda pnote,x
        beq se_2
        cmp #$fe
        beq se_2
        sta base,x
se_2    lda pcmd,x
        cmp #$0f
        bne se_3
        lda ppar,x
        beq se_3
        sta speed
se_3    rts

; ---------------------------------------------------------------- play
play    lda songon
        beq fx
        lda tick
        bne look
        ldx #2
rs_lp   lda rows,x
        beq rs_new
        dec rows,x
        inc vrow,x
        jmp rs_nx
rs_new  lda fetched,x
        bne rs_have
        jsr fetch
rs_have lda #0
        sta fetched,x
        jsr apply
rs_nx   dex
        bpl rs_lp
look    lda speed               ; two frames before the next row: read it ahead
        cmp #3
        bcc tk
        sbc #2
        cmp tick
        bne tk
        ldx #2
lk_lp   lda rows,x
        ora fetched,x
        bne lk_nx
        jsr fetch
        inc fetched,x
        jsr gateoff
lk_nx   dex
        bpl lk_lp
tk      inc tick
        lda tick
        cmp speed
        bcc fx
        lda #0
        sta tick
fx      ldx #2
fx_lp   jsr voice
        dex
        bpl fx_lp
        lda fswp                ; filter sweep
        beq f_out
        bmi f_neg
        clc
        adc fcut
        bcc f_set
        lda #$ff
        bne f_set
f_neg   clc
        adc fcut
        bcs f_set
        lda #0
f_set   sta fcut
f_out   lda fcut
        sta SID+$16
        lda fres
        ora froute
        sta SID+$17
        lda ftyp
        ora mvol
        sta SID+$18
        rts

; a new note comes: gate off before it, and a hard restart for instruments that want it
gateoff lda pnote,x
        beq go_end
        cmp #$fe
        beq go_end
        lda pcmd,x
        cmp #3
        beq go_end
        lda #0
        sta gate,x
        ldy pins,x
        bne go_1
        ldy ins,x
go_1
p_i_flags_1 lda TAB,y
        and #1
        beq go_end
        ldy sidoff,x
        lda #$0f
        sta SID+5,y
        lda #$00
        sta SID+6,y
go_end  rts

; ---------------------------------------------------------------- jam
jam     sty tmp
        stx tmp2
        tax
        lda tmp
        sta pins,x
        lda tmp2
        bne jm_1
        lda #$fe
jm_1    sta pnote,x
        lda #0
        sta pcmd,x
        sta ppar,x
        sta prows,x
        sta pfirst,x
        jmp apply

; ---------------------------------------------------------------- reading rows
fetch   lda #0
        sta pnote,x
        sta pins,x
        sta pcmd,x
        sta ppar,x
        sta prows,x
        sta pfirst,x
ft_lp   jsr patbyte
        bne ft_1
        jsr nextpat
        jmp ft_lp
ft_1    cmp #$c0
        bcc ft_2
        and #$3f
        sta prows,x
        rts
ft_2    cmp #$a0
        bcc ft_3
        and #$1f
        sta pins,x
        jmp ft_lp
ft_3    cmp #$80
        bcc ft_4
        and #$0f
        sta pcmd,x
        jsr patbyte
        sta ppar,x
        jmp ft_lp
ft_4    cmp #$60
        bcc ft_note
        beq ft_end
        lda #$fe                ; key off
        sta pnote,x
ft_end  rts
ft_note clc
        adc trans,x
        bmi ft_lo
        beq ft_lo
        cmp #96
        bcc ft_ok
        lda #95
        bne ft_ok
ft_lo   lda #1
ft_ok   sta pnote,x
        rts

nextpat jsr ordbyte
        cmp #$ff
        bne np_1
        jsr ordbyte
        sta ordpos,x
        inc looped,x
        jmp nextpat
np_1    cmp #$80
        bcc np_2
        sec
        sbc #$a0
        sta trans,x
        jmp nextpat
np_2    tay
p_patlo_1 lda TAB,y
        sta plo,x
p_pathi_1 lda TAB,y
        sta phi,x
        ldy ordpos,x
        dey
        tya
        sta ppos,x
        lda #1
        sta pfirst,x
        rts

ordbyte lda olo,x
        clc
        adc ordpos,x
        sta ord_rd+1
        lda ohi,x
        adc #0
        sta ord_rd+2
        inc ordpos,x
ord_rd  lda $ffff
        rts

patbyte ldy plo,x
        sty pat_rd+1
        ldy phi,x
        sty pat_rd+2
        inc plo,x
        bne pat_rd
        inc phi,x
pat_rd  lda $ffff
        rts

rowpos  lda pfirst,x
        beq rp_1
        lda ppos,x
        sta vpos,x
        lda #$ff
        sta vrow,x
rp_1    inc vrow,x
        lda prows,x
        sta rows,x
        rts

; ---------------------------------------------------------------- a new row
apply   jsr rowpos
        lda pins,x
        beq ap_1
        sta ins,x
ap_1    lda pcmd,x
        bne ap_1b
        lda cmd,x               ; no command: a tone portamento goes on until it arrives
        cmp #3
        bne ap_1z
        lda pnote,x
        beq ap_keep
ap_1z   lda #0
        beq ap_c
ap_1b   cmp #4
        bcc ap_c                ; 1-2: slides while the command is in the rows
        lda #0
ap_c    sta cmd,x
        lda ppar,x
        sta par,x
ap_keep lda pnote,x
        bne ap_0
        jmp ap_cmd
ap_0    cmp #$fe
        bne ap_2
        lda #0
        sta gate,x
        jmp ap_cmd
ap_2    ldy cmd,x
        cpy #3
        bne trigger
        sta tmp                 ; tone portamento: same pitch, slide to the new note
        ldy base,x
p_freqlo_1 lda TAB,y
        clc
        adc slo,x
        sta tmp2
p_freqhi_1 lda TAB,y
        adc shi,x
        sta tmp3
        ldy tmp
        lda tmp2
        sec
p_freqlo_2 sbc TAB,y
        sta slo,x
        lda tmp3
p_freqhi_2 sbc TAB,y
        sta shi,x
        tya
        sta base,x
        jmp ap_cmd

trigger sta base,x
        lda gate,x              ; still on: off for a moment, the envelope starts again
        beq tr_0
        ldy sidoff,x
        lda wave,x
        and #$fe
        sta SID+4,y
tr_0    lda #0
        sta slo,x
        sta shi,x
        sta wval,x
        sta wabs,x
        sta arp,x
        sta arpc,x
        ldy ins,x
p_i_wave_1 lda TAB,y
        sta wpos,x
p_i_pw_1 lda TAB,y
        beq tr_1
        sta pwhi,x
        lda #0
        sta pwlo,x
        sta pdir,x
tr_1
p_i_vdel_1 lda TAB,y
        sta vdel,x
p_i_vspd_1 lda TAB,y
        sta vspd,x
p_i_vdep_1 lda TAB,y
        sta vdep,x
p_i_flags_2 lda TAB,y
        and #2
        beq tr_nf
        lda vbits,x
        ora froute
        sta froute
p_i_fcut_1 lda TAB,y
        sta fcut
p_i_fswp_1 lda TAB,y
        sta fswp
p_i_fres_1 lda TAB,y
        sta fres
p_i_ftyp_1 lda TAB,y
        sta ftyp
        jmp tr_2
tr_nf   lda vbits,x
        eor #$ff
        and froute
        sta froute
tr_2
p_i_ad_1 lda TAB,y
        sta ad,x
p_i_sr_1 lda TAB,y
        sta sr,x
        lda #1
        sta wadsr,x
        sta gate,x
        jsr vibcalc

ap_cmd  ldy pcmd,x              ; commands that act once
        lda ppar,x
        cpy #4
        bne c_5
        pha
        lsr
        lsr
        lsr
        lsr
        sta vspd,x
        pla
        and #$0f
        sta vdep,x
        lda #0
        sta vdel,x
        jmp vibcalc
c_5     cpy #5
        bne c_6
        sta ad,x
        lda #1
        sta wadsr,x
        rts
c_6     cpy #6
        bne c_7
        sta sr,x
        lda #1
        sta wadsr,x
        rts
c_7     cpy #7
        bne c_8
        sta wave,x
        lda #$ff
        sta wpos,x
        rts
c_8     cpy #8
        bne c_9
        sta arp,x
        rts
c_9     cpy #9
        bne c_a
        sta pwhi,x
        lda #0
        sta pwlo,x
        rts
c_a     cpy #$a
        bne c_b
        sta fcut
        lda #0
        sta fswp
        rts
c_b     cpy #$b
        bne c_c
        pha
        and #$f0
        sta fres
        pla
        and #$07
        asl
        asl
        asl
        asl
        sta ftyp
        rts
c_c     cpy #$c
        bne c_d
        and #$0f
        sta mvol
        rts
c_d     cpy #$d
        bne c_f
        sta fswp
        rts
c_f     cpy #$f
        bne c_end
        tay
        beq c_end
        sty speed
c_end   rts

; vibrato step: a part of the semitone at the note, depth/32 per frame
vibcalc lda #0
        sta voffl,x
        sta voffh,x
        sta vstl,x
        sta vsth,x
        lda vspd,x
        bne vc_0
        rts
vc_0    lsr
        sta vph,x
        lda vspd,x
        asl
        sta vsp2,x
        ldy base,x
        cpy #95
        bcc vc_1
        dey
vc_1
p_freqlo_3 lda TAB+1,y
        sec
p_freqlo_4 sbc TAB,y
        sta m0
p_freqhi_3 lda TAB+1,y
p_freqhi_4 sbc TAB,y
        sta m1
        lda #0
        sta m2
        sta r0
        sta r1
        sta r2
        lda vdep,x
        sta mc
        ldy #4
vc_lp   lsr mc
        bcc vc_sh
        lda r0
        clc
        adc m0
        sta r0
        lda r1
        adc m1
        sta r1
        lda r2
        adc m2
        sta r2
vc_sh   asl m0
        rol m1
        rol m2
        dey
        bne vc_lp
        ldy #5
vc_lp2  lsr r2
        ror r1
        ror r0
        dey
        bne vc_lp2
        lda r0
        sta vstl,x
        lda r1
        sta vsth,x
vc_end  rts

; ---------------------------------------------------------------- every frame
voice   ldy wpos,x              ; wave table
        cpy #$ff
        beq w_done
p_wtw_1 lda TAB,y
        cmp #$ff
        bne w_step
p_wtn_1 lda TAB,y
        sta wpos,x
        cmp #$ff
        beq w_done
        tay
p_wtw_2 lda TAB,y
        cmp #$ff
        bne w_step
        lda #$ff                ; a jump to a jump: stop
        sta wpos,x
        bne w_done
w_step  cmp #0
        beq w_keep
        sta wave,x
w_keep
p_wtn_2 lda TAB,y
        bmi w_abs
        cmp #$40
        bcc w_rel
        ora #$80
w_rel   sta wval,x
        lda #0
        beq w_set
w_abs   and #$7f
        sta wval,x
        lda #1
w_set   sta wabs,x
        iny
        tya
        sta wpos,x
w_done
        lda cmd,x               ; slides
        beq s_done
        cmp #1
        bne s_2
        lda slo,x
        clc
        adc par,x
        sta slo,x
        bcc s_done
        inc shi,x
        jmp s_done
s_2     cmp #2
        bne s_3
        lda slo,x
        sec
        sbc par,x
        sta slo,x
        bcs s_done
        dec shi,x
        jmp s_done
s_3     lda shi,x               ; tone portamento: the offset goes to 0
        bmi s_up
        lda slo,x
        sec
        sbc par,x
        sta slo,x
        lda shi,x
        sbc #0
        sta shi,x
        bpl s_done
        bmi s_zero
s_up    lda slo,x
        clc
        adc par,x
        sta slo,x
        lda shi,x
        adc #0
        sta shi,x
        bmi s_done
s_zero  lda #0
        sta slo,x
        sta shi,x
        sta cmd,x               ; arrived
s_done
        lda wabs,x              ; the note
        beq n_rel
        lda wval,x
        jmp n_ok
n_rel   lda wval,x
        bmi n_neg
        clc
        adc base,x
        cmp #96
        bcc n_ok
        lda #95
        bne n_ok
n_neg   clc
        adc base,x
        bcc n_one
        bne n_ok
n_one   lda #1
n_ok    sta tmp
        lda arp,x               ; arpeggio
        beq n_fin
        ldy arpc,x
        iny
        cpy #3
        bcc n_c
        ldy #0
n_c     tya
        sta arpc,x
        beq n_fin
        lda arp,x
        cpy #1
        bne n_lo
        lsr
        lsr
        lsr
        lsr
        bpl n_add
n_lo    and #$0f
n_add   clc
        adc tmp
        cmp #96
        bcc n_st
        lda #95
n_st    sta tmp
n_fin   ldy tmp
p_freqlo_5 lda TAB,y
        clc
        adc slo,x
        sta flo
p_freqhi_5 lda TAB,y
        adc shi,x
        sta fhi
        lda vstl,x              ; vibrato
        ora vsth,x
        beq v_done
        lda vdel,x
        beq v_go
        dec vdel,x
        jmp v_done
v_go    lda vph,x
        cmp vspd,x
        bcs v_down
        lda voffl,x
        clc
        adc vstl,x
        sta voffl,x
        lda voffh,x
        adc vsth,x
        sta voffh,x
        jmp v_ph
v_down  lda voffl,x
        sec
        sbc vstl,x
        sta voffl,x
        lda voffh,x
        sbc vsth,x
        sta voffh,x
v_ph    inc vph,x
        lda vph,x
        cmp vsp2,x
        bcc v_add
        lda #0
        sta vph,x
v_add   lda flo
        clc
        adc voffl,x
        sta flo
        lda fhi
        adc voffh,x
        sta fhi
v_done
        ldy ins,x               ; pulse sweep
p_i_pspl_1 lda TAB,y
p_i_psph_1 ora TAB,y
        beq p_done
        lda pdir,x
        bne p_down
        lda pwlo,x
        clc
p_i_pspl_2 adc TAB,y
        sta pwlo,x
        lda pwhi,x
p_i_psph_2 adc TAB,y
        bcs p_top
p_i_pmax_1 cmp TAB,y
        bcc p_st
p_top   lda #1
        sta pdir,x
        lda #0
        sta pwlo,x
p_i_pmax_2 lda TAB,y
p_st    sta pwhi,x
        jmp p_done
p_down  lda pwlo,x
        sec
p_i_pspl_3 sbc TAB,y
        sta pwlo,x
        lda pwhi,x
p_i_psph_3 sbc TAB,y
        bcc p_bot
p_i_pmin_1 cmp TAB,y
        bcs p_st
p_bot   lda #0
        sta pdir,x
        sta pwlo,x
p_i_pmin_2 lda TAB,y
        jmp p_st
p_done
        ldy sidoff,x            ; to the SID
        lda flo
        sta SID,y
        lda fhi
        sta SID+1,y
        lda pwhi,x
        sta tmp
        lda pwlo,x
        lsr tmp
        ror a
        lsr tmp
        ror a
        lsr tmp
        ror a
        lsr tmp
        ror a
        sta SID+2,y
        lda tmp
        sta SID+3,y
        lda wadsr,x
        beq o_1
        lda #0
        sta wadsr,x
        lda ad,x
        sta SID+5,y
        lda sr,x
        sta SID+6,y
o_1     lda wave,x
        and #$fe
        ora gate,x
        sta SID+4,y
        rts

; ---------------------------------------------------------------- variables
vars
ordpos  .fill 3, 0
trans   .fill 3, 0
plo     .fill 3, 0
phi     .fill 3, 0
rows    .fill 3, 0
fetched .fill 3, 0
pnote   .fill 3, 0
pins    .fill 3, 0
pcmd    .fill 3, 0
ppar    .fill 3, 0
prows   .fill 3, 0
pfirst  .fill 3, 0
ppos    .fill 3, 0
vpos    .fill 3, 0
vrow    .fill 3, 0
looped  .fill 3, 0
ins     .fill 3, 0
cmd     .fill 3, 0
par     .fill 3, 0
base    .fill 3, 0
gate    .fill 3, 0
wave    .fill 3, 0
wpos    .fill 3, 0
wval    .fill 3, 0
wabs    .fill 3, 0
arp     .fill 3, 0
arpc    .fill 3, 0
slo     .fill 3, 0
shi     .fill 3, 0
pwlo    .fill 3, 0
pwhi    .fill 3, 0
pdir    .fill 3, 0
vdel    .fill 3, 0
vspd    .fill 3, 0
vdep    .fill 3, 0
vph     .fill 3, 0
vsp2    .fill 3, 0
voffl   .fill 3, 0
voffh   .fill 3, 0
vstl    .fill 3, 0
vsth    .fill 3, 0
ad      .fill 3, 0
sr      .fill 3, 0
wadsr   .fill 3, 0
speed   .fill 1, 0
tick    .fill 1, 0
songon  .fill 1, 0
mvol    .fill 1, 0
fcut    .fill 1, 0
fswp    .fill 1, 0
fres    .fill 1, 0
ftyp    .fill 1, 0
froute  .fill 1, 0
tmp     .fill 1, 0
tmp2    .fill 1, 0
tmp3    .fill 1, 0
flo     .fill 1, 0
fhi     .fill 1, 0
m0      .fill 1, 0
m1      .fill 1, 0
m2      .fill 1, 0
r0      .fill 1, 0
r1      .fill 1, 0
r2      .fill 1, 0
mc      .fill 1, 0
skipcnt .fill 1, 0
varsend
