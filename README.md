  
INTRODUCTION
============

**The Animation Toolkit Workflows** for Mac OS X automatize and simplify the
use of the basic tools of [The Animation Toolkit][1] for users of the Mac OS X
operating system.


SOFTWARE LICENSE
================

The Animation Toolkit Workflows is free software: you can redistribute it and/or
modify it under the terms of the **[GNU General Public License][2]** as published
by the Free Software Foundation, either version 3 of the License, or (at your option)
any later version.

**The Animation Toolkit Workflows is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more
details.**

You should have received a copy of the GNU General Public License along with
The Animation Toolkit Workflows. If not, see <http://www.gnu.org/licenses/>.


INSTALLATION
============

Before the workflows can be used, **The Animation Toolkit** has to be installed.
Therefore, follow the installation instructions given [here][3] if not done yet.

To install the Mac OS X Workflows of The Animation Toolkit, download the compressed
archive containing the workflows from [here][4]. Open the archive by double clicking
on it in the Finder. Install each workflow by `double click`ing on it and choosing
`Install` from the dialog.


FOLDER ACTIONS
==============

In a nutshell, Folder Actions are scripts that can be attached to folders.
They enable events (actions) to take place when items are added or removed from
that folder. Events can also occur when the folder is opened, closed or moved.

The Animation Toolkit provides the following Folder Actions:

- [Crop Animation Frames (Individually)](#crop-frames-individually)
- [Crop Animation Frames (Fixed Size)](#crop-frames-fixed)

To attach a Folder Action to a folder, open the `Finder` window and create a new
empty folder. Then right click on this new folder and select the option
`Folder Action Setup...` (from the `Services` menu). Find the respective
Folder Action in the list, select it, and click on `Attach`. Close the dialog.
The Folder Action should now be successfully attached and is ready to use.


<a id="crop-frames-individually"></a>
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


<a id="crop-frames-fixed"></a>
Crop Animation Frames (Fixed Size)
----------------------------------

This Folder Action processes the image sequences similar to the
[Crop Animation Frames (Individually)](#action-crop-frames-individually).

If a movie file such as animation.mov is copied into the folder, however,
each frame of the movie is cropped using the smallest fixed size bounding
box which covers the object in each frame of the move and writes the
resulting cropped frames to separate PNG files.



[1]: https://github.com/schuhschuh/AnimationToolkit
[2]: http://www.gnu.org/licenses/
[3]: https://github.com/schuhschuh/AnimationToolkit/blob/master/README.md
[4]: https://github.com/schuhschuh/AnimationToolkit/archive/workflows-v0.1.zip
