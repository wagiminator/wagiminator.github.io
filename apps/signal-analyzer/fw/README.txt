fx2lafw firmware for Cypress FX2 based logic analyzers
=======================================================

These files are the open-source fx2lafw firmware of the sigrok project,
version 0.1.7, built from the source at
https://github.com/sigrokproject/sigrok-firmware-fx2lafw (commit 0f2d324)
with SDCC 4.4. The Signal Analyzer loads them into the RAM of the analyzer
over WebUSB each time it is plugged in, as sigrok/PulseView do.

  fx2lafw-saleae-logic.fw     "24 MHz 8 channel" analyzers (USB ID 0925:3881)
  fx2lafw-cypress-fx2.fw      Cypress FX2 boards without EEPROM (04b4:8613)
  fx2lafw-sigrok-fx2-8ch.fw   sigrok fx2grok, 8 channels (1d50:608c)
  fx2lafw-sigrok-fx2-16ch.fw  sigrok fx2grok, 16 channels (1d50:608d)

fx2lafw is free software under the GNU General Public License version 2 or
later (see COPYING-fx2lafw.txt); the source code is available at the address
above. The firmware runs on the analyzer and is not part of the web app's code.
