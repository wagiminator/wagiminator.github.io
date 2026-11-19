Firmware for the Hantek 6022BE/BL, DSO-6021 and SainSmart DDS120
================================================================

These files are the open-source oscilloscope firmware by Martin Homuth-Rosemann
(Ho-Ro), which OpenHantek6022 uses too. It is based on the fx2lafw firmware of
the sigrok project and on fx2lib. Built from the source at
https://github.com/Ho-Ro/Hantek6022API (commit cf6a103, firmware version 2.10)
with SDCC 4.4. The Oscilloscope app loads the firmware into the RAM of the
oscilloscope over WebUSB each time it is plugged in, as OpenHantek6022 does.

  dso6022be-firmware.hex   Hantek 6022BE, Voltcraft DSO-2020 (USB ID 04b4:6022, 04b5:6022, 04b4:2020)
  dso6022bl-firmware.hex   Hantek 6022BL (04b4:602a, 04b5:602a)
  dso6021-firmware.hex     Hantek DSO-6021 (04b4:6021)
  dds120-firmware.hex      SainSmart DDS120 (8102:8102)

The firmware is free software under the GNU General Public License version 3
(see COPYING-Hantek6022API.txt; fx2lib is under the GNU LGPL, see COPYING-fx2lib.txt). The source
code is available at the address above. The firmware runs on the oscilloscope
and is not part of the web app's code.
