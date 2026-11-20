# Sources of the embedded menu programs

`menucode.js` contains the two C64 menu programs as base64:

- `menu.asm`: menu program of the Magic Desk Cartridge Generator v3.0, (c) 2013-2019 Žarko Živanov ([original](https://bitbucket.org/zzarko/magic-desk-cartridge-generator/)), as included in [C64-Collection](https://github.com/wagiminator/C64-Collection/tree/master/C64_Cartridge_64k_256k/software/Cartridge_Generator_Multi_PRG).
- `menu-single.asm`: the same with the single program modification by Feandreu ([original](https://github.com/Feandreu/mdeskcrtgenfsp)); it starts the first program without showing the menu.

Both are licensed under the GNU General Public License v3 (`gpl.txt`), like `cartgen.js`, which is a JavaScript port of `crtgen.py` from the same package. Assemble with Kick Assembler 5.5.

## Changes to the original start routine
The original routine started a program by calling the Commodore BASIC ROM directly (`$E453`, `$E3BF`, `$A871`, `$A533`, `$A68E`, `$A7AE`). Replacement ROMs such as the MEGA65 Open ROMs, which the C64 Emulator Web App uses unless the original ROMs are loaded, have different code at these addresses, so every program started with RUN crashed (e.g. "BRK at $0003"). The new routine in both files:

- copies the copy routine to `$0340` with a loop that also works for more than 128 bytes,
- hooks the CHRIN vector (`$0324`) and starts the BASIC ROM through its cold start vector (`JMP ($A000)`),
- copies the program on the first CHRIN call (when BASIC is ready), sets the BASIC pointers and the top of memory (`$A000`, the cartridge is switched off),
- starts it with `JMP` (programs with a start address) or types `RUN` into the keyboard buffer and returns to CHRIN with X and Y unchanged,
- copies exactly the program length (the original copied one byte more).

Only the KERNAL jump table and vectors and the BASIC cold start vector are used, so it works with the original ROMs as well as with replacements.
