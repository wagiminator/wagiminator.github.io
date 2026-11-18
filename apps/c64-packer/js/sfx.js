/* C64 Packer: the self-extracting start and the tape loader, assembled from asm/sfx.asm and asm/turbo.asm (node asm/build.js) */
window.PackerSFX = {
 "tscrunch": {
  "code": "AQgLCAoAnjIwNjEAAAB4qX+NDdyNDd2tDdytDd2pG40R0KkAhfupAIX8qQCF/akAhf6pNIUBqQCN+v+p/Y37/6IAvW0InQD8vW0JnQD9vW0KnQD+6NDroACiAIix+5H9wADQ98b8xv7K0PBMAPypAIX7qQCF/KkAhf2pAIX+IAH9qjA3ySCQF9ADTAz9SX+N/vypAI3//KkCjf38TLf8jf38pfuF+aX8hfog4/wYpftt/fyF+5DH5vyww0qQH8lA8A4pP438/CAB/SDM/EwQ/KkAjfz8qQAgzPxMEPxKkBYpH439/O79/CAB/Y3+/KkAjf/8TLf8KR+N/fwgAf2N/vwgAf0KLv387v38OGqN//wYpf1t/vyF+aX+bf/8hfog4/xMEPw4pf3t/vyF+aX+7f/8hfog4/xMEPys/PyR/YjA/9D5OKX9bfz8hf2QAub+YKAAsfmR/cjM/fzQ9hil/W39/IX9kALm/mAAAAAAQKAAsfvm+9AC5vxgqTWFAakbjRHQqYGNDdypAPApqQCFLYUvhTGpAIUuhTCFMqk6jQACqYqNAQKpAI0CAoV6qQKFe6lg0AapTKIAoACNBQGOBgGMBwGiBL1k/Z0AAcoQ90wAAak3hQFY",
  "top": 64512,
  "image": 2157,
  "imageEnd": 2518,
  "iend": 64873,
  "fields": {
   "pages": 90,
   "mode": 393,
   "starth": 442,
   "sl": 35,
   "sh": 39,
   "zero": 209,
   "dsth": 123,
   "endh": 405,
   "th": 47,
   "startl": 440,
   "dstl": 119,
   "tl": 43,
   "blank": 30,
   "endl": 397,
   "srcl": 111,
   "srch": 115
  }
 },
 "exomizer": {
  "code": "AQgLCAoAnjIwNjEAAAB4qX+NDdyNDd2tDdytDd2pG40R0KkAhfupAIX8qQCF/akAhf6pNIUBqQmN+v+p/o37/6IAvW0InQD8vW0JnQD9vW0KnQD+6NDroACiAIix+5H9wADQ98b8xv7K0PBMAPypAIX7qQCF/KkAhf2pAIX+IAr+jfr9ogCKKQ/QDKkBjQX+qQCNBv7wK6kBjfv9qQCN/P2sB/7wCQ77/S78/YjQ9xitBf5t+/2NBf6tBv5t/P2NBv6tBf6dNP+tBv6daP+OCP6iAyCO/Y0H/qIBII798AitB/4JCI0H/q4I/q0H/p0A/+jgNNCQqQGNAv6NA/4gCv4gyf2tAv4KDQP+jQL+IID9kA6pAY0D/iAK/iDJ/UyW/KIAIID9sAPo0PjgENADTBX+4BHQKaIQII79jf79rfz9jf/9qQGNA/6l+4X5pfyF+iDU/aX5hful+oX8TJb8jgT+vQD/qiCO/a4E/hh9NP+N/v2t/P19aP+N//2tAv4pA8kB0AUggP2wSq3//dAfrf79yQOwGMkB0AqiAiCO/RhpMNASogQgjv0YaSDQCKIEII79GGkQjQT+qr0A/6ogjv2uBP4YfTT/jQD+rfz9fWj/jQH+qQCNA/44pf3tAP6F+aX+7QH+hfog1P1MlvwO+v3QCCAK/jgqjfr9YI79/akAjfv9jfz9rf39KQeq8AwggP0u+/0u/P3K0PSt/f1KSkqq8A+t+/2N/P0gCv6N+/3K0PGt+/1goACR/eb90ALm/mCgALH5kf3m+dAC5vrm/dAC5v6t/v3QA87//c7+/a3+/Q3//dDdYAAAAAAAAAAAAAAAAAAAAECgALH75vvQAub8YKk1hQGpG40R0KmBjQ3cqQDwKakAhS2FL4UxqQCFLoUwhTKpOo0AAqmKjQECqQCNAgKFeqkChXupYNAGqUyiAKAAjQUBjgYBjAcBogS9bf6dAAHKEPdMAAGpN4UBWA==",
  "top": 64512,
  "image": 2157,
  "imageEnd": 2783,
  "iend": 65138,
  "fields": {
   "pages": 90,
   "starth": 707,
   "mode": 658,
   "blank": 30,
   "sl": 35,
   "sh": 39,
   "dsth": 123,
   "dstl": 119,
   "startl": 705,
   "srcl": 111,
   "tl": 43,
   "th": 47,
   "endl": 662,
   "endh": 670,
   "srch": 115
  }
 },
 "turbo": {
  "header": "eKlXjSQDqfGNJQOpAIXGqQuNEdClASnfhQGpLI0G3KkBjQfcIIUD0ANMEAGpAo0g0EyCAyDMAyajpaPJv9D1IN0DyUDw+cla0OqgAyDdA5msAIgQ96AAhKQg3QORrI0g0EWkhaTmrNAC5q2lrMWupa3lr5DkIN0DRaRgqRAsDdzw+60P3EqpGY0P3GCiCCDMAyajytD4paNJ/2AAAAAAAAAAAAAAAAAAAAAA",
  "file": "UQM=",
  "fileStart": 804,
  "stage2": "IIUDqqUBCSCFAYrwA0x9A6kbjRHQqQ6NINCiBKWulS2lr5UuysoQ9KkA0ARYTAAAqU2NJAOpAY0lA1iiAI53AYx4Aa52Ab1yAe52AckN0AqiV44kA6LxjiUDrncBrHgBGGBSVU4NAAAA",
  "stage2Start": 272,
  "fields": {
   "mode": 41,
   "start": 46
  }
 }
};
