/* Character ROM of the MEGA65 Open ROMs: free, compatible replacement for the Commodore
 * character ROM (upper case/graphics, then lower/upper case). https://github.com/MEGA65/open-roms
 * Licensed under the GNU Lesser General Public License v3 (see roms/LICENSE-open-roms.txt).
 */
window.C64_CHARGEN = (function () {
  var s =
  "PGZubmBmPgA8ZmZ+ZmZmAHxmZnxmZn4APGZmYGBmPgB8ZmZmZmZ8AH5mYHhgZn4AfmZgeGBgYAA+ZmBuZmY+AGZmZn5mZmYAfhgY" +
  "GBgYfgB+ZgYGZmZ8AGZmbHhsZmYAYGBgYGBmfgBjd39/a2NjAGZmdn5uZmYAPGZmZmZmPgB8ZmZ+YGBgADxmZmZqbDYAfGZmfGZm" +
  "ZgA+YHA8Dg58AH4YGBgYGBgAZmZmZmZuPABmZmYsPBgYAGNja39/d2MAZmY8GDxmZgBmZm48GBgYAH5mDBgwdn4APDAwMDAwPAA8" +
  "ZmB4MDB+ADwMDAwMDDwACBw+HBwcHAAAED9/PxAAAAAAAAAAAAAAODg4ODgAOABsbEgAAAAAAAAAAAAAAAAAGH5gfgZ+GABiZgwY" +
  "MGZGADxmZjx0bj4AGBgQAAAAAAAcMDAwMDAcADgMDAwMDDgACCocfxwqCAAAGBh+GBgAAAAAAAAYGAgAAAAAPAAAAAAAAAAAABgY" +
  "AAIGDBgwYEAAPGZufnZmPAAYOBgYGBh+AHxmBhwwZn4AfGYGDAZmfgBgYGx+DAwMAH5mYHwGZnwAPmZgfGZmPgB+ZgYeBgYGADxm" +
  "ZjxmZn4APGZmPgZmfAAAGBgAGBgAAAAYGAAYGAgAAAwYMBgMAAAAADwAPAAAAAAwGAwYMAAAfmYGDBgAGAAAAAD//wAAAAgcPn8+" +
  "HD4AGBgYGBgYGBgAAAD//wAAAAAA//8AAAAAAP//AAAAAAAAAAAA//8AADAwMDAwMDAwDAwMDAwMDAwAAADg8DgYGBgYHA8HAAAA" +
  "GBg48OAAAADAwMDAwMD//8DgcDgcDgcDAwcOHDhw4MD//8DAwMDAwP//AwMDAwMDADx+fn5+PAAAAAAAAP//ADZ/f38+HAgAYGBg" +
  "YGBgYGAAAAAHDxwYGMPnfjw8fufDADxmQkJmPAAYGH5+GBg8AAYGBgYGBgYGCBw+fz4cCAAYGBj//xgYGKBQoFCgUKBQGBgYGBgY" +
  "GBgAAAA+djY2AP9/Px8PBwMBAAAAAAAAAADw8PDw8PDw8AAAAAD//////wAAAAAAAAAAAAAAAAAA/8DAwMDAwMDAqlWqVapVqlUD" +
  "AwMDAwMDAwAAAACqVapV//78+PDgwIADAwMDAwMDAxgYGB8fGBgYAAAAAA8PDw8YGBgfHwAAAAAAAPj4GBgYAAAAAAAA//8AAAAf" +
  "HxgYGBgYGP//AAAAAAAA//8YGBgYGBj4+BgYGMDAwMDAwMDA4ODg4ODg4OAHBwcHBwcHB///AAAAAAAA////AAAAAAAAAAAAAP//" +
  "/wMDAwMDA///AAAAAPDw8PAPDw8PAAAAABgYGPj4AAAA8PDw8AAAAADw8PDwDw8PD8OZkZGfmcH/w5mZgZmZmf+DmZmDmZmB/8OZ" +
  "mZ+fmcH/g5mZmZmZg/+BmZ+Hn5mB/4GZn4efn5//wZmfkZmZwf+ZmZmBmZmZ/4Hn5+fn54H/gZn5+ZmZg/+ZmZOHk5mZ/5+fn5+f" +
  "mYH/nIiAgJScnP+ZmYmBkZmZ/8OZmZmZmcH/g5mZgZ+fn//DmZmZlZPJ/4OZmYOZmZn/wZ+Pw/Hxg/+B5+fn5+fn/5mZmZmZkcP/" +
  "mZmZ08Pn5/+cnJSAgIic/5mZw+fDmZn/mZmRw+fn5/+BmfPnz4mB/8PPz8/Pz8P/w5mfh8/Pgf/D8/Pz8/PD//fjwePj4+P//+/A" +
  "gMDv/////////////8fHx8fH/8f/k5O3///////JyYDJgMnJ/+eBn4H5gef/nZnz58+Zuf/DmZnDi5HB/+fn7///////48/Pz8/P" +
  "4//H8/Pz8/PH//fV44Dj1ff//+fngefn////////5+f3/////8P////////////n5//9+fPnz5+//8OZkYGJmcP/58fn5+fngf+D" +
  "mfnjz5mB/4OZ+fP5mYH/n5+TgfPz8/+BmZ+D+ZmD/8GZn4OZmcH/gZn54fn5+f/DmZnDmZmB/8OZmcH5mYP//+fn/+fn////5+f/" +
  "5+f3///z58/n8//////D/8P/////z+fz58///4GZ+fPn/+f/////AAD////348GAwePB/+fn5+fn5+fn////AAD//////wAA////" +
  "//8AAP///////////wAA///Pz8/Pz8/Pz/Pz8/Pz8/Pz////Hw/H5+fn5+Pw+P///+fnxw8f////Pz8/Pz8/AAA/H4/H4/H4/Pz4" +
  "8ePHjx8/AAA/Pz8/Pz8AAPz8/Pz8/P/DgYGBgcP///////8AAP/JgICAweP3/5+fn5+fn5+f////+PDj5+c8GIHDw4EYPP/Dmb29" +
  "mcP/5+eBgefnw//5+fn5+fn5+ffjwYDB4/f/5+fnAADn5+dfr1+vX69fr+fn5+fn5+fn////wYnJyf8AgMDg8Pj8/v//////////" +
  "Dw8PDw8PDw//////AAAAAAD//////////////////wA/Pz8/Pz8/P1WqVapVqlWq/Pz8/Pz8/Pz/////VapVqgABAwcPHz9//Pz8" +
  "/Pz8/Pzn5+fg4Ofn5//////w8PDw5+fn4OD///////8HB+fn5////////wAA////4ODn5+fn5+cAAP///////wAA5+fn5+fnBwfn" +
  "5+c/Pz8/Pz8/Px8fHx8fHx8f+Pj4+Pj4+PgAAP///////wAAAP////////////8AAAD8/Pz8/PwAAP////8PDw8P8PDw8P/////n" +
  "5+cHB////w8PDw//////Dw8PD/Dw8PA8Zm5uYGY+AAAAPAY+Zn4AAGBgfGZmfgAAAD5gYGB+AAAGBj5mZn4AAAA8Zn5gfgAADhg8" +
  "GBgYAAAAPmZmfgY8AGBgfGZmZgAAGAAYGBgYAAAMAAwMDGx4AGBmbHhsZgAAGBgYGBg8AAAAfmtrY2MAAAB8ZmZmZgAAADxmZmY+" +
  "AAAAfGZmfmBgAAA+ZmZ+BgYAAH5mYGBgAAAAPmB+Bn4AABh+GBgYHAAAAGZmZmY+AAAAZmZmNBgAAABjY2trPwAAAGY8GDxmAAAA" +
  "ZmZmPBgwAAB+DBgwfgA8MDAwMDA8ADxmYHgwMH4APAwMDAwMPAAIHD4cHBwcAAAQP38/EAAAAAAAAAAAAAA4ODg4OAA4AGxsSAAA" +
  "AAAANjZ/Nn82NgAYfmB+Bn4YAGJmDBgwZkYAPGZmPHRuPgAYGBAAAAAAABwwMDAwMBwAOAwMDAwMOAAIKhx/HCoIAAAYGH4YGAAA" +
  "AAAAABgYCAAAAAA8AAAAAAAAAAAAGBgAAgYMGDBgQAA8Zm5+dmY8ABg4GBgYGH4AfGYGHDBmfgB8ZgYMBmZ+AGBgbH4MDAwAfmZg" +
  "fAZmfAA+ZmB8ZmY+AH5mBh4GBgYAPGZmPGZmfgA8ZmY+BmZ8AAAYGAAYGAAAABgYABgYCAAADBgwGAwAAAAAPAA8AAAAADAYDBgw" +
  "AAB+ZgYMGAAYAAAAAP//AAAAPGZmfmZmZgB8ZmZ8ZmZ+ADxmZmBgZj4AfGZmZmZmfAB+ZmB4YGZ+AH5mYHhgYGAAPmZgbmZmPgBm" +
  "ZmZ+ZmZmAH4YGBgYGH4AfmYGBmZmfABmZmx4bGZmAGBgYGBgZn4AY3d/f2tjYwBmZnZ+bmZmADxmZmZmZj4AfGZmfmBgYAA8ZmZm" +
  "amw2AHxmZnxmZmYAPmBwPA4OfAB+GBgYGBgYAGZmZmZmbjwAZmZmLDwYGABjY2t/f3djAGZmPBg8ZmYAZmZuPBgYGAB+ZgwYMHZ+" +
  "ABgYGP//GBgYwMAwMMDAMDAYGBgYGBgYGKpVqlWqVapVM5nMZjOZzGYAAAAAAAAAAPDw8PDw8PDwAAAAAP//////AAAAAAAAAAAA" +
  "AAAAAAD/wMDAwMDAwMCqVapVqlWqVQMDAwMDAwMDAAAAAKpVqlXMmTNmzJkzZgMDAwMDAwMDGBgYHx8YGBgAAAAADw8PDxgYGB8f" +
  "AAAAAAAA+PgYGBgAAAAAAAD//wAAAB8fGBgYGBgY//8AAAAAAAD//xgYGBgYGPj4GBgYwMDAwMDAwMDg4ODg4ODg4AcHBwcHBwcH" +
  "//8AAAAAAAD///8AAAAAAAAAAAAA////AAEDRmw4EAAAAAAA8PDw8A8PDw8AAAAAGBgY+PgAAADw8PDwAAAAAPDw8PAPDw8Pw5mR" +
  "kZ+Zwf///8P5wZmB//+fn4OZmYH////Bn5+fgf//+fnBmZmB////w5mBn4H///Hnw+fn5////8GZmYH5w/+fn4OZmZn//+f/5+fn" +
  "5///8//z8/OTh/+fmZOHk5n//+fn5+fnw////4GUlJyc////g5mZmZn////DmZmZwf///4OZmYGfn///wZmZgfn5//+BmZ+fn///" +
  "/8GfgfmB///ngefn5+P///+ZmZmZwf///5mZmcvn////nJyUlMD///+Zw+fDmf///5mZmcPnz///gfPnz4H/w8/Pz8/Pw//DmZ+H" +
  "z8+B/8Pz8/Pz88P/9+PB4+Pj4///78CAwO//////////////x8fHx8f/x/+Tk7f//////8nJgMmAycn/54GfgfmB5/+dmfPnz5m5" +
  "/8OZmcOLkcH/5+fv///////jz8/Pz8/j/8fz8/Pz88f/99XjgOPV9///5+eB5+f////////n5/f/////w////////////+fn//35" +
  "8+fPn7//w5mRgYmZw//nx+fn5+eB/4OZ+ePPmYH/g5n58/mZgf+fn5OB8/Pz/4GZn4P5mYP/wZmfg5mZwf+Bmfnh+fn5/8OZmcOZ" +
  "mYH/w5mZwfmZg///5+f/5+f////n5//n5/f///Pnz+fz/////8P/w//////P5/Pnz///gZn58+f/5/////8AAP///8OZmYGZmZn/" +
  "g5mZg5mZgf/DmZmfn5nB/4OZmZmZmYP/gZmfh5+Zgf+BmZ+Hn5+f/8GZn5GZmcH/mZmZgZmZmf+B5+fn5+eB/4GZ+fmZmYP/mZmT" +
  "h5OZmf+fn5+fn5mB/5yIgICUnJz/mZmJgZGZmf/DmZmZmZnB/4OZmYGfn5//w5mZmZWTyf+DmZmDmZmZ/8Gfj8Px8YP/gefn5+fn" +
  "5/+ZmZmZmZHD/5mZmdPD5+f/nJyUgICInP+ZmcPnw5mZ/5mZkcPn5+f/gZnz58+Jgf/n5+cAAOfn5z8/z88/P8/P5+fn5+fn5+dV" +
  "qlWqVapVqsxmM5nMZjOZ//////////8PDw8PDw8PD/////8AAAAAAP//////////////////AD8/Pz8/Pz8/VapVqlWqVar8/Pz8" +
  "/Pz8/P////9VqlWqM2bMmTNmzJn8/Pz8/Pz8/Ofn5+Dg5+fn//////Dw8PDn5+fg4P///////wcH5+fn////////AAD////g4Ofn" +
  "5+fn5wAA////////AADn5+fn5+cHB+fn5z8/Pz8/Pz8/Hx8fHx8fHx/4+Pj4+Pj4+AAA////////AAAA/////////////wAAAP/+" +
  "/LmTx+///////w8PDw/w8PDw/////+fn5wcH////Dw8PD/////8PDw8P8PDw8A==";
  var b = atob(s), a = new Uint8Array(b.length);
  for (var i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
  return a;
})();
