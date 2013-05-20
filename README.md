  
INTRODUCTION
============

**The Animation Toolkit** contains simple programs that have been written to
support the integration of animations, which have been created using dedicated
tools such as [Adobe After Effects][1], into other software.

At the moment, the toolkit merely consists of a single command-line tool.


SOFTWARE LICENSE
================

The Animation Toolkit is free software: you can redistribute it and/or modify
it under the terms of the **[GNU General Public License][2]** as published by the
Free Software Foundation, either version 3 of the License, or (at your option)
any later version.

**The Animation Toolkit is distributed in the hope that it will be useful, but
WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.**

You should have received a copy of the GNU General Public License along with
The Animation Toolkit. If not, see <http://www.gnu.org/licenses/>.


DOCUMENTATION
=============

The tools provided by The Animation Toolkit have to be executed in a command
window such as the "Terminal" application on Mac OS X or the Command Prompt
on Microsoft Windows.


crop-frames
-----------

    crop-frames: [options] -i animation.mov  -o frames.png [-c coords.csv]
                 [options] -i frames_%6d.png -o frames.png [-c coords.csv]
 
This program can be used to crop all frames of an image sequence such as an animation.
All frames of the sequence are expected to have the same size. Each frame is by
default cropped to the smallest possible bounding box. A CSV file with the minimum
and maximum pixel indices of the region used to crop each frame is optionally
stored along with the cropped images. Additionally, relative pixel offsets for
the center of the bounding boxes are computed and stored in the CSV file. This
allows the recovery of the global animation from the cropped image sequence.
 
    -i <file>         Input sequence, e.g., movie.mov or movie_%05d.png.
    -o <file>         Output sequence, e.g., cropped.mov or cropped.png.
    -c <file>         Output CSV spreadsheet for pixel coordinates.
    -b <index>        Index of first frame of image sequence.
    -s <n>            Increment/Stride of image frame indices.
    -e <index>        Index of last frame of image sequence.
    -u <false|true>   Crop all images using the union of all bounding boxes.
    -f <false|true>   Crop all images using a fixed size bounding box.
    -v <int>          Verbosity of output messages (0: none, 1: status, 2: debug).


BUILD AND INSTALLATION
======================

Dependencies
------------

The Animation Toolkit includes a copy of the [CImg Library][3], which is
extended using the plugin framework of the library. In order to read and
write PNG, JPEG, and/or TIFF images, the respective libraries must be
installed on the system.


Build Steps
-----------

The steps to build and install the software are as follows:

1. Extract source files.
2. Run CMake to configure the build tree.
3. Build the software using selected build tool.
4. Test the built software.
5. Install the built files.

On Unix-like systems with [GNU Make][4] as build tool, these build steps can be
summarized by the following sequence of commands executed in a shell.

    $ tar xzf AnimationToolkit-1.2-source.tar.gz
    $ cd AnimationToolkit-1.2-source
    $ cmake .
    $ make
    $ make install (optional)

To configure the build interactively with `ccmake` instead of `cmake` as shown
above, for example to change the installation directory,

- press 'c' to configure the build system and 'e' to ignore warnings,
- set `CMAKE_INSTALL_PREFIX` and other CMake variables and options,
- continue pressing 'c' until the option 'g' is available,
- then press 'g' to generate the configuration files for GNU Make.


CMake Options
-------------

- `CMAKE_INSTALL_PREFIX`: Root directory used for the installation of the tools.



[1]: http://www.adobe.com/products/aftereffects.html
[2]: http://www.gnu.org/licenses/
[3]: http://cimg.sourceforge.net/
[4]: http://www.gnu.org/software/make/
