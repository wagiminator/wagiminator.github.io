# Sources of the embedded menu programs

`menucode.js` contains the two C64 menu programs as base64:

- `menu.asm`: menu program of the Magic Desk Cartridge Generator v3.0, (c) 2013-2019 Žarko Živanov ([original](https://bitbucket.org/zzarko/magic-desk-cartridge-generator/)), as included in [C64-Collection](https://github.com/wagiminator/C64-Collection/tree/master/C64_Cartridge_64k_256k/software/Cartridge_Generator_Multi_PRG).
- `menu-single.asm`: the same with the single program modification by Feandreu ([original](https://github.com/Feandreu/mdeskcrtgenfsp)); it starts the first program without showing the menu.

Both are licensed under the GNU General Public License v3 (`gpl.txt`), like `cartgen.js`, which is a JavaScript port of `crtgen.py` from the same package. Assemble with Kick Assembler 5.5.
