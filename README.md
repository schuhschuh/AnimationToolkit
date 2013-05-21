  
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


INSTALLATION
============

Installer packages for The Animation Toolkit can be downloaded from [here][7].
At the moment, only Intel-based Apple computers running Mac OS X >=10.7
are supported. Double click the installer (.mpkg file) and follow the instructions
on screen. This will install the [basic tools](#tools) into the folder
`/opt/animationtoolkit/bin`.

Additionally, some useful [Automator Workflows](#workflows) which make use
of the basic tools of the toolkit and are more convenient to use are installed
into the folder `/Users/<user>/Library/Workflows/Applications/Folder Actions`.


<a id="workflows"></a>
MAC OS WORKFLOWS
================

In a nutshell, Folder Actions are scripts that can be attached to folders.
They enable events (actions) to take place when items are added or removed from
that folder. Events can also occur when the folder is opened, closed or moved.

The Animation Toolkit provides the following Folder Actions:

- [Crop Animation Frames (Individually)](#action-crop-frames-individually)
- [Crop Animation Frames (Fixed Size)](#action-crop-frames-fixed)

To attach a Folder Action to a folder, right click on the folder and select
the option `Folder Action Setup...` from the `Services` menu. Find the respective
Folder Action in the list, select it, and click on `Attach`. Close the dialog.
The Folder Action should now be successfully attached and is ready to use.


Crop Animation Frames (Individually)
------------------------------------

This Folder Action processes each animation file separately, appending the pixel
coordinates of the crop region to a CSV spreadsheet file which has the same name
as the animation frames.
For example, copy the file animation_000000.png into the folder which the
action is attached to. This will create a cropped image
Cropped/animation_000000.png and store the coordinates in the spreadsheet
Cropped/animation.csv. Copying the file animation_000001.png into the
folder will create the cropped image Cropped/animation_000001.png and append
the coordinates to the existing spreadsheet Cropped/animation.csv.

If a movie file such as animation.mov is copied into the folder, each frame
of the movie is cropped using the bounding box which covers the object in all
frames of the movie and writes the resulting movie to the file
Cropped/animation.mov along with the spreadsheet Cropped/animation.csv.

Crop Animation Frames (Fixed Size)
----------------------------------

This Folder Action processes the image sequences similar to the
[Crop Animation Frames (Individually)](#action-crop-frames-individually).

If a movie file such as animation.mov is copied into the folder, however,
each frame of the movie is cropped using the smallest fixed size bounding
box which covers the object in each frame of the move and writes the
resulting cropped frames to separate PNG files.


<a id="tools"></a>
BASIC TOOLS
===========

The tools provided by The Animation Toolkit have to be executed in a command
window such as the **[Terminal][5]** application on Mac OS X or the
**[Command Prompt][6]** on Microsoft Windows. Users of Linux systems will
likely be familiar with their command shell and know how to run the following
commands. Others may refer to the documentation of their respective operating
system.

<a id="crop-frames"></a>
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


<a id="build"></a>
BUILDING THE SOFTWARE FROM SOURCES
==================================

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
    $ mkdir build && cd build
    $ cmake ..
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
- `INSTALL_WORKFLOWS`: Whether to install the [Mac OS X Workflows](#workflows).



[1]: http://www.adobe.com/products/aftereffects.html
[2]: http://www.gnu.org/licenses/
[3]: http://cimg.sourceforge.net/
[4]: http://www.gnu.org/software/make/
[5]: http://www.apple.com/osx/apps/all.html#terminal
[6]: http://windows.microsoft.com/en-gb/windows-vista/command-prompt-frequently-asked-questions
[7]: https://projects.andreasschuh.com/projects/animationtoolkit/files
