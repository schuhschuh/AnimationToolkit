  
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

To install the Mac OS X Workflows of The Animation Toolkit, download the compressed
archive containing the workflows from [here][4]. Open the archive by double clicking
on it in the Finder. Install each workflow by `double click`ing on it and choosing
`Install` from the dialog.

By default, [Folder Actions of The Animation Toolkit](#folder-actions) are attched
to the user's Desktop. Any image or movie file with an extension of a supported file
format are processed. The results are placed in automatically created folders on
the Desktop. These folders are named after the respective Folder Action.

In case you want to attach a Folder Action to a different folder, open the `Finder`
window and create a new empty folder or go to an already existing folder you want
to use for the Folder Action. Then right click on this new folder and select the option
`Folder Action Setup...` (from the `Services` menu). Find the respective
Folder Action in the list, select it, and click on `Attach`. Close the dialog.
The Folder Action should now be successfully attached and is ready to use.
The Folder Action Setup dialog can also be used to disable Folder Actions again,
such as in particular the by default attached actions for the Desktop.

Before the workflows can be used, **The Animation Toolkit** has to be installed.
Therefore, follow the installation instructions given [here][3] if not done yet.


<a id="folder-actions"></a>
FOLDER ACTIONS
==============

In a nutshell, Folder Actions are programs (scripts) that can be attached to
folders. They enable events (actions) to take place when items are added or
removed from that folder. Events can also occur when the folder is opened,
closed or moved.

The Animation Toolkit provides the following Folder Actions:

- [Crop Animation](#crop-animation)
- [Crop Animation (Min Size PNG)](#crop-animation-min-size-png)
- [Crop Animation (One Size PNG)](#crop-animation-one-size-png)
- [Crop Animation (Same Box PNG)](#crop-animation-same-box-png)


<a id="crop-animation"></a>
Crop Animation
--------------

This Folder Action crops each frame of an animation dropped into the folder
the action is attached to (i.e., the Desktop by default) such that the output
has minimum size. It adds all information regarding the crop to a CSV
spreadsheet file which has the same name as the animation file(s).

For example, dropping the file `animation_000000.png` into the folder,
will create a new image `Cropped Animation/animation_000000.png` which is
cropped using the minimal bounding box surrounding the object in this frame.
The corresponding CSV spreadsheet is named `Cropped Animation/animation.csv`.
Dropping another frame of the animation, e.g., `animation_000001.png` into
the folder will create the cropped image `Cropped/animation_000001.png`
and append the information of the crop region to the existing spreadsheet
`Cropped/animation.csv`.

If a movie such as `animation.mov` is dropped into the folder, however,
each frame of the movie is cropped using the bounding box which covers
the object in all frames of the movie. Use the Folder Action
[Crop Animation (Min Size PNG)](#crop-animation-min-size-png) instead
to crop each frame individually to the minimum size as described above.
The cropped movie is written to the file `Cropped/animation.mov` and the
crop information added to the spreadsheet `Cropped/animation.csv`.

A log file is written to `Cropped Animation/Workflow.log` which can help
to identify problems that prevent the successful execution of the workflow.


<a id="crop-animation-min-size-png"></a>
Crop Animation (Min Size PNG)
-----------------------------

Does the same as the [Crop Animation](#crop-animation) Folder Action,
but always outputs a sequence of PNG images, each cropped to the
minimum size. The cropped animations can be found in the
`Cropped Animation (Min Size PNG)` subfolder.


<a id="crop-animation-one-size-png"></a>
Crop Animation (One Size PNG)
-----------------------------

Does the same as the [Crop Animation](#crop-animation) Folder Action,
but always outputs a sequence of PNG images, where all frames of an
animation are cropped to the same minimum size. The cropped animations
can be found in the `Cropped Animation (One Size PNG)` subfolder.


<a id="crop-animation-same-box-png"></a>
Crop Animation (Same Box PNG)
-----------------------------

Does the same as the [Crop Animation](#crop-animation) Folder Action,
but always outputs a sequence of PNG images, where all frames of an
animation are cropped using the bounding box which covers the object
in all frames of the animation. The cropped animations can be found
in the `Cropped Animation (Same Box PNG)` subfolder.



[1]: https://github.com/schuhschuh/AnimationToolkit
[2]: http://www.gnu.org/licenses/
[3]: https://github.com/schuhschuh/AnimationToolkit/blob/master/README.md
[4]: https://github.com/schuhschuh/AnimationToolkit/archive/workflows-0.1.zip
