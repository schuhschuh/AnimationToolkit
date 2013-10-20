//~ AFTER EFFECTS SPINE JSON FORMAT EXPORT SCRIPT
//~
//~ Copyright (C) 2013 Nguyen Dang Quang <nguyendangquang82@yahoo.com>
//~ Copyright (C) 2013 Andreas Schuh     <andreas.schuh.84@gmail.com>
//~
//~ Permission is hereby granted, free of charge, to any person obtaining a copy
//~ of this software and associated documentation files (the "Software"), to deal
//~ in the Software without restriction, including without limitation the rights
//~ to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//~ copies of the Software, and to permit persons to whom the Software is
//~ furnished to do so, subject to the following conditions:
//~ 
//~ The above copyright notice and this permission notice shall be included in all
//~ copies or substantial portions of the Software.
//~
//~ THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
//~ INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
//~ PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
//~ HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//~ OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
//~ SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//~
//~
//~ Before using this script for the first time you must set up After Effects as follows:
//~
//~ 1.  Allow the script to write files to disk:
//~     -  Go to menu Edit - Preferences - General...
//~     -  Check the box: Allow Scripts to Write Files and Access Network.
//~ 2.  Create a PNG template to be used by the script:
//~     -  Create an empty composition, then go to menu Composition - Add to Render Queue.
//~     -  On the Output Module option, click on: Lossless.
//~     -  Choose Format: PNG Sequence, Channels: RGB + Alpha. Press OK.
//~     -  Click the Arrow next to the Output Module option - Make Template...
//~     -  In the Setting Name dialog, type in exactly this text: PNG
//~     -  Click OK and you are ready.

// =============================================================================
// global scene positioning settings
// =============================================================================

CAMERA_DISTANCE     = 700;     // 3D only, default is 700 in AE
CAMERA_CENTER       = [50,50]; // define scene alignment relative to Spine's root bone
                               // [0: leftmost .. 100: rightmost ]: percentage of composition width
                               // [0: topmost  .. 100: bottommost]: percentage of composition height
FORCE_CAMERA_CENTER = false;   // force camera center even when it is overridden in AE

// animation export settings
FPS_FORCED      = -1;    // force exported animation keyframe data to this frame rate
                         //    -1: export keyframes only
                         //     0: use composition settings
                         // 1..99: use specified frame rate
FPS_MULTIPLIER  = 1;     // multiplicative factor for frame rate, e.g., [0.5..3]
FPS_COMPRESSION = true;  // whether to remove redundant keyframes
                         // false: write all sampled timeline keyframes
                         // true:  write only required keyframes
PUPPET_EXTENSION = true; // how to export Puppet animations
                         //   false: export as Spine slot animations
                         //   true:  custom Spine JSON format extension

// output settings
FOLDER_SUFFIX = ' [Spine{fps}]';

// user interaction
SHOW_FPS_DIALOG = true; // prompt user to enter desired frame rate

// =============================================================================
// auxiliary functions
// =============================================================================

// -----------------------------------------------------------------------------
// file path related functions
function getFileExt(path)
{
    _idx = path.lastIndexOf('.');
    if (_idx > 0) return path.substr(_idx);
    // leading dot has different meaning on Unix (hidden file)
    return '';
}

function removeFileExt(path)
{
    _ext = getFileExt(path);
    return path.substr(0, path.length - _ext.length);
}

function basename(path)
{
    _idx = path.lastIndexOf('/');
    if (_idx > 0) path = path.substr(_idx + 1, path.length - _idx - 1);
    _idx = path.lastIndexOf('\\');
    if (_idx > 0) path = path.substr(_idx + 1, path.length - _idx - 1);
    return path;
}

// -----------------------------------------------------------------------------
// convert string to safe identifier name that should not cause any encoding issues
// such as we had with a layer named "eye + sport + beak" where the whitespaces
// before and after the + had different hex code in the text file and in the
// exported footage file name
function safeName(str)
{
  return str.replace(/\s/g, '_');
}

// -----------------------------------------------------------------------------
// get Spine bone name of given AE layer
function boneName(layer)
{
    if (layer == null) return 'root';
    if (layer.isNameSet) _name = layer.name;
    else                 _name = removeFileExt(layer.name)
    return _name.replace('_decomposed','');
}

// -----------------------------------------------------------------------------
// get Spine puppet name of given AE layer
function puppetName(layer)
{
    return boneName(layer);
}

// -----------------------------------------------------------------------------
// get Spine slot name of given AE layer
function slotName(layer)
{
    if (layer.isNameSet) _name = layer.name;
    else                 _name = removeFileExt(layer.name)
    return _name.replace('_decomposed','');
}

// -----------------------------------------------------------------------------
// get Spine attachment name of given AE layer
function attachmentName(layer)
{
    _name = removeFileExt(layer.source.name.split('/')[0]); // e.g., "<layer>/<PSD name>"
    return safeName(_name.replace('_decomposed',''));
}

// -----------------------------------------------------------------------------
// get Spine attachment name of given AE layer
function footageName(item)
{
    if (item.typeName != "Footage" && item.source) item = item.source;
    _name = removeFileExt(item.name.split('/')[0]); // e.g., "<layer>/<PSD name>"
    return safeName(_name.replace('_decomposed',''));
}

// -----------------------------------------------------------------------------
// get layer attributes as Spine slot attachment properties string
function attachmentProps(layer)
{
    _anchorPoint = layer.anchorPoint.valueAtTime(comp.workAreaStart, false);
    _props = "\"width\": "  + layer.width
           + ", \"height\": " + layer.height;
    _value = valueToString(layer.width/2 - _anchorPoint[0]);
    if (_value != '0') _props += ", \"x\": " + _value;
    _value = valueToString(-(layer.height/2 - _anchorPoint[1]));
    if (_value != '0') _props += ", \"y\": " + _value;
    _value = footageName(layer);
    if (_value != attachmentName(layer)) _props += ", \"name\": \"" + _value + "\"";
    return _props;
}

// -----------------------------------------------------------------------------
// test if object is a string
function isString(s) {
    return typeof(s) === 'string' || s instanceof String;
}

// -----------------------------------------------------------------------------
// compare two floating point values; if one or both arguments are arrays, the comparison is done element-wise
function isEqual(a, b)
{
    if (a instanceof Array) {
        if (b instanceof Array) {
            if (a.length != b.length) return false;
            for (i = 0; i < a.length; i++) {
                if (Math.abs(a[i] - b[i]) > 1.e-9) return false;
            }
        } else {
            for (i = 0; i < a.length; i++) {
                if (Math.abs(a[i] - b) > 1.e-9) return false;
            }
        }
    } else if (b instanceof Array) {
        if (a instanceof Array) {
            if (a.length != b.length) return false;
            for (i = 0; i < a.length; i++) {
                if (Math.abs(a[i] - b[i]) > 1.e-9) return false;
            }
        } else {
            for (i = 0; i < b.length; i++) {
                if (Math.abs(b[i] - a) > 1.e-9) return false;
            }
        }
    } else if (isString(a) || isString(b)) {
        if (a != b) return false;
    } else {
        if (Math.abs(a - b) > 1.e-9) return false;
    }
    return true;
}

// -----------------------------------------------------------------------------
// negation of isEqual
function notEqual(a, b)
{
    return ! isEqual(a, b);
}

// -----------------------------------------------------------------------------
// discard all keyframes which are redundant and those do not need to be exported
function sparsifyKeyFrames(comp, key, setup)
{
    _out = new Array();
    if (key.length == 0) return _out;
    // first keyframe required if either of the following is true (in this order)
    // - keyframe value different from setup pose
    // - keyframe occuring at later time and it is not the only keyframe
    // - keyframe followed by one which has a different value
    if (setup == null || notEqual(key[0].value, setup) ||
            (key.length > 1 && (key[0].time > comp.workAreaStart || notEqual(key[0].value, key[1].value)))) {
        _out.push(key[0]);
    }
    // intermediate keyframes only required if not identical to both previous and next keyframes
    for (k = 1; k < key.length - 1; k++) {
        if (notEqual(key[k-1].value, key[k].value) || notEqual(key[k].value, key[k+1].value)) {
            _out.push(key[k]);
        }
    }
    // last keyframe only required if different from second to last keyframe
    if (key.length > 1 && notEqual(key[key.length-2].value, key[key.length-1].value)) {
        _out.push(key[key.length-1]);
    }
    return _out;
}

// -----------------------------------------------------------------------------
// convert AE opacity value to Spine slot RGBA color string
function opacityToColor(opacity)
{
    _A = (255 * opacity/100).toString(16).toUpperCase();
    if (_A.length == 1) _A = '0' + _A;
    return 'FFFFFF' + _A;
}

// -----------------------------------------------------------------------------
// convert AE interpolation type to Spine interpolation "curve" value
function interpolationToCurve(type)
{
    if (type == KeyframeInterpolationType.LINEAR) {
        return ""; //", \"curve\": \"linear\"";
    } else if (type == KeyframeInterpolationType.HOLD) {
        return ", \"curve\": \"stepped\"";
    } else {
        alert("Unsupported keyframe interpolation type used (" + type + "). Only linear and hold keys are supported!");
    }
}

// -----------------------------------------------------------------------------
// convert value to rounded string
function valueToString(value)
{
    return (Math.round(value * 1000) / 1000).toString(10);
}

// -----------------------------------------------------------------------------
// replace all occurrences of substr by insstr
function replaceAll(str, substr, insstr)
{
    if (substr == insstr) return str;
    while (str.indexOf(substr) != -1) str = str.replace(substr, insstr);
    return str;
}

// -----------------------------------------------------------------------------
// restore File path and name
function restoreFilePath(path)
{
    return replaceAll(path, '%20', ' ');
}

// -----------------------------------------------------------------------------
// image sequence footage related functions
function getSequencePrefix(item)
{
    _pos = item.name.indexOf('[');
    if (_pos == -1) return item.name;
    return item.name.substr(0, _pos);
}

function getSequenceSuffix(item)
{
    _pos = item.name.indexOf(']');
    if (_pos == -1) return '';
    return item.name.substr(_pos, item.name.length - _pos);
}

function getSequenceRange(item)
{
    _prefix = getSequencePrefix(item);
    _suffix = getSequenceSuffix(item);
    _range  = item.name.substr(_prefix.length, item.name.length - _prefix.length - _suffix.length);
    _pos    = _range.indexOf('-');
    if (_pos <= 1 || _pos >= _range.length-2) return [-1, -1, -1];
    _start  = _range.substr(1, _pos);
    _end    = _range.substr(_pos + 1, _range.length);
    if (_start.length == _end.length) _width = _start.length;
    else                              _width = 0;
    return [parseInt(_start, 10), parseInt(_end, 10), _width];
}

function getSequenceFile(prefix, suffix, n)
{
    for (_w = 0; _w < 8; _w++) {
        _idx = n.toString();
        while (_idx.length < _w) _idx = '0' + _idx;
        _f = new File(prefix + _idx + suffix);
        if (_f.exists()) return _f;
    }
    return null;
}

function isSequence(item)
{
    return getSequenceRange(item)[0] != -1;
}

// -----------------------------------------------------------------------------
// save footage as PNG
function saveFootageAsPNG(dir, footage)
{
    if (footage == null) return false;
    // import single sequence image as new footage
    _tempFootage = false;
    if (footage instanceof File) {
        if (getFileExt(footage.name).toLowerCase() == '.png') {
            footage.file.copy(dir + '/' + removeFileExt(restoreFilePath(footage.name)) + '.png');
            return true;
        }
        _io = new ImportOptions(footage);
        _io.importAs = ImportAsType.FOOTAGE;
        _io.sequence = false;
        footage = app.project.importFile(_io);
        if (footage == null) {
            alert('Failed to import sequence file "' + _io.file + '" as single footage!');
            return false;
        }
        _tempFootage = true;
    // if footage source is a file, check that it exists
    } else if (footage.file != null) {
        if (!footage.file.exists) {
            alert('Missing footage file "' + restoreFilePath(footage.file.path) + '/' + restoreFilePath(footage.file.name) + '" of footage named "' + footage.name + '"!');
            return false;
        }
        if (getFileExt(footage.file.name).toLowerCase() == '.png') {
            footage.file.copy(dir + '/' + footageName(footage) + '.png');
            return true;
        }
    }
    // else solid, text, ...
    // create temporary composition
    _comp  = app.project.items.addComp('Export Spine Footage', footage.width, footage.height, 1, 1, 1);
    _layer = _comp.layers.add(footage);
    if (layer == null) {
        alert('Failed to add footage ' + footage.name + ' as layer of temporary export composition!');
        _comp.remove();
        return false;
    }
    // render footage using PNG output template
    _name = footageName(footage);
    _item = app.project.renderQueue.items.add(_comp);
    _item.outputModules[1].applyTemplate('PNG');
    _item.outputModules[1].file = new File(dir + '/' + _name + '_[#].png');
    if (_item.outputModules[1].file.exists) _item.outputModules[1].file.remove();
    app.project.renderQueue.render();
    // remove suffix _0 from rendered file
    _f = new File(dir + '/' + _name + '_0.png');
    _f.copy(dir + '/' + _name + '.png');
    _f.remove();
    // clean up
    _comp.remove();
    if (_tempFootage) footage.remove();
    app.project.renderQueue.showWindow(false);
    return true;
}

// -----------------------------------------------------------------------------
// remove all keyframes of a property
function resetProperty(prop)
{
  for (_i = prop.numKeys; _i > 0; _i--) prop.removeKey(_i);
}

// -----------------------------------------------------------------------------
// reset general transformation of layer
function resetTransform(layer)
{
    resetProperty(layer.anchorPoint);
    resetProperty(layer.position);
    resetProperty(layer.rotation);
    resetProperty(layer.scale);
}

// -----------------------------------------------------------------------------
// render distorted layer attachments
function saveLayerAsPNGs(dir, layer, fps)
{
    if (layer == null) return 0;
    // create temporary composition
    _comp = app.project.items.addComp('Render Spine Attachments', layer.width, layer.height, 1, layer.outPoint - layer.inPoint, fps);
    _comp.workAreaStart = layer.inPoint;
    layer.copyToComp(_comp);
    if (_comp.numLayers == 0) {
        alert('Failed to copy layer ' + layer.name + ' to temporary export composition!');
        _comp.remove();
        return 0;
    }
    // reset general layer transformation as it is reflected by the bone animation
    _layer = _comp.layer(1);
    resetTransform(_layer);
    _layer.position.setValue(_layer.anchorPoint.value);
    // render layer using PNG output template
    _item = app.project.renderQueue.items.add(_comp);
    _item.outputModules[1].applyTemplate('PNG');
    _item.outputModules[1].file = new File(dir + '/' + footageName(layer) + '_[#####].png');
    app.project.renderQueue.render();
    // clean up
    _comp.remove();
    app.project.renderQueue.showWindow(false);
    return Math.ceil((layer.outPoint - layer.inPoint) * fps);
}

// =============================================================================
// main
// =============================================================================

// -----------------------------------------------------------------------------
// wrap all code in function to enable use of return statement
function main()
{
    if (!app.project.file) {
        alert('Project unsaved! Please save the project first before you continue.');
        return 1;
    }

    projectName = removeFileExt(restoreFilePath(app.project.file.name));
    outputDir   = restoreFilePath(app.project.file.path) + '/' + projectName;
    jsonName    = projectName;

    // -------------------------------------------------------------------------
    // prompt user for some options
    if (SHOW_FPS_DIALOG) {
        fps = prompt('Specify export frame rate in FPS.\nThe default is to export the After Effects keys only.'
                   + ' When a non-negative frame rate is specified, the animation timeline is sampled also at'
                   + ' intermediate frames, using the interpolation of After Effects.'
                   + '\nEnter 0 to use the composition frame rate.', -1);
        if (fps == null) return 1;
        fps = parseInt(fps, 10);
    } else {
        fps = FPS_FORCED;
    }

    sampleKeyFrames = (fps != -1); // sample AE timeline at specified or composition frame rate
                                   // otherwise, just export AE keyframes

    if (sampleKeyFrames && SHOW_FPS_DIALOG) outputDir += FOLDER_SUFFIX.replace('{fps}', ' ' + fps + 'fps');
    else                                    outputDir += FOLDER_SUFFIX.replace('{fps}', '');
 
    // -------------------------------------------------------------------------
    // create output directory
    f = new Folder(outputDir);
    if (!f.create()) {
        alert('Failed to create directory "' + outputDir + '"!');
        return 1;
    }

    // -------------------------------------------------------------------------
    // create progress bar
    pw = new Window('palette', "Export as Spine JSON", {x:0, y:0, width:420, height:48});
    st = pw.add('statictext',  {x:10, y:10, width:400, height:20}, '');
    pb = pw.add('progressbar', {x:10, y:30, width:400, height:12}, 0, 100);
    pw.center();
    pw.show();

    // -------------------------------------------------------------------------
    // auto select compositions to convert
    autoSelect = true;
    for (i = 1; i <= app.project.items.length; i++) {
        item = app.project.item(i);
        if (item.typeName == 'Composition' && item.selected) autoSelect = false;
    }
    if (autoSelect) {
        st.text = 'Selecting compositions for export...';
        pb.value = 0;
        pw.update();

        for (i = 1; i <= app.project.items.length; i++) {
            item = app.project.item(i);
            if (item.typeName == "Composition") {
                item.selected = true;
                for (j = 1; j <= app.project.items.length; j++) {
                    otherItem = app.project.item(j);
                    for (l = 1; l <= otherItem.numLayers; l++) {
                        if (otherItem.layer(l).source != null && otherItem.layer(l).source.name == item.name) {
                            item.selected = false;
                            break;
                        }
                    }
                }
            } else {
                item.selected = false;
            }
        }
        pb.value = 100;
        pw.update();
    }

    // -------------------------------------------------------------------------
    // deselect empty compositions and check if any composition is selected
    autoSelect = true;
    for (i = 1; i <= app.project.items.length; i++) {
        item = app.project.item(i);
        if (item.typeName == 'Composition' && item.selected) {
            if (item.numLayers == 0) item.selected = false;
            else                     autoSelect = false;
        }
    }
    if (autoSelect) {
        alert("No or empty composition selected for export!");
        return 1;
    }

    // -------------------------------------------------------------------------
    // export selected compositions
    compIdx = new Array();
    for (i = 1; i <= app.project.items.length; i++) {
        item = app.project.item(i);
        if (item.typeName == "Composition") {
            // adjust frame rate of compositions
            if (fps <= 0) fps = Math.round(item.frameRate * 100)/100 * FPS_MULTIPLIER;
            item.frameRate = fps;
            // count number of compositions to export and total number of frames
            if (item.selected) compIdx.push(i);
        }
    }
    if (compIdx.length == 0) {
        pw.close();
        alert("No composition available/selected for export!");
        return 1;
    }

    json = new File(outputDir + '/' + jsonName + '.json');
    if (!json.open('w')) {
        pw.close();
        alert("Failed to create JSON file \"" + outputDir + '/' + jsonName + ".json\"!");
        return 1;
    }

    for (c = 0; c < compIdx.length; c++) {
        comp = app.project.item(compIdx[c]);
        fps  = comp.frameRate;

        // ---------------------------------------------------------------------
        // global camera center
        cameraCenter = CAMERA_CENTER;
        if (!FORCE_CAMERA_CENTER) {
            st.text = comp.name + ': Determining camera center...';
            pb.value = 0;
            pw.update();
            for (l = comp.numLayers; l >= 1; l--) {
                layer = comp.layer(l);
                if (layer.source != null && layer.source.name.toUpperCase() == 'CAMERA CENTER') { 
                    cameraCenter = layer.position.valueAtTime(comp.workAreaStart, false);
                    cameraCenter = [cameraCenter[0] * 100 / comp.width, cameraCenter[1] * 100 / comp.height];
                }
            }
            pb.value = 100;
            pw.update();
        }

        // ---------------------------------------------------------------------
        // decompose any existing pre-composition layers
        deComp = false;
        for (l = comp.numLayers; l >= 1; l--) {
            if (comp.layer(l).source != null && comp.layer(l).source.typeName == "Composition") deComp = true;
        }
        while (deComp) {
            deComp = false;
            for (l = comp.numLayers; l >= 1; l--) {
                layer = comp.layer(l);
                if (layer.source.typeName == "Composition" && layer.enabled) {
                    st.text = comp.name + ': Decomposing layers of ' + layer.source.name + ' pre-composition...';
                    pb.value = 0;
                    pw.update();

                    copiedIndex       = new Array();
                    copiedParentIndex = new Array();
                    for (i = layer.source.numLayers; i >= 1; i--) {
                        if (layer.source.file == null) {
                            layer.source.time = 0;
                            if (layer.threeDLayer && !layer.source.layer(i).threeDLayer) {
                                layer.source.layer(i).threeDLayer = true;
                            }
                            comp.layer(1).selected = true;

                            copiedIndex[i] = i;
                            if (layer.source.layer(i).parent != null) copiedParentIndex[i] = layer.source.layer(i).parent.index;
                            else                                      copiedParentIndex[i] = null;

                            layer.source.layer(i).copyToComp(comp);

                            deCompLayer = comp.layer(1);
                            //deCompLayer.name += "_decomposed";

                            deCompLayer.locked = false;
                            if (!layer.collapseTransformation) deCompLayer.blendingMode = layer.blendingMode;
                            deCompLayer.stretch   = deCompLayer.stretch / 100 * layer.stretch;
                            deCompLayer.startTime = layer.startTime + layer.source.layer(i).startTime * layer.stretch / 100;
                            if (deCompLayer.startTime > deCompLayer.inPoint) deCompLayer.inPoint -= 0.5/fps;
                            deCompLayer.enabled   = layer.enabled && deCompLayer.enabled;
                            if (deCompLayer.inPoint < layer.inPoint) {
                                if (deCompLayer.outPoint < layer.inPoint) deCompLayer.enabled = false;
                                else deCompLayer.inPoint = layer.inPoint;
                            }
                            if (deCompLayer.outPoint > layer.outPoint) {
                                if (deCompLayer.inPoint > layer.outPoint) deCompLayer.enabled = false;
                                else deCompLayer.outPoint = layer.outPoint;
                            }

                            if (deCompLayer.enabled) {
                                keyColor = new Array();
                                for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                    key       = {};
                                    key.time  = t;
                                    key.value = (deCompLayer.opacity.valueAtTime(t, false) * layer.opacity.valueAtTime(t, false)) / 100;
                                    keyColor.push(key);
                                }
                                keyColor = sparsifyKeyFrames(comp, keyColor, 100);
                                for (k = 0; k < keyColor.length; k++) {
                                    deCompLayer.opacity.addKey(keyColor[k].time);
                                    deCompLayer.opacity.setValueAtTime(keyColor[k].time, keyColor[k].value);
                                }
                            }
                        }
                    }
                    for (i = layer.source.numLayers; i >= 1; i--) {
                        if (copiedParentIndex[i] != null) comp.layer(copiedIndex[i]).parent = comp.layer(copiedParentIndex[i]);
                    }
                    for (i = layer.source.numLayers; i >= 1; i--) {
                        if (copiedParentIndex[i] == null) comp.layer(copiedIndex[i]).setParentWithJump(layer);
                    }
                    for (i = layer.source.numLayers; i >= 1; i--) {
                        comp.layer(i).moveAfter(layer);
                    }
                    layer.enabled = false;
                    deComp        = true;

                    pb.value = 100;
                    pw.update();
                }
            }
        }

        // ---------------------------------------------------------------------
        // make all layer and corresponding footage names unique
        for (l = 1; l <= comp.numLayers; l++) {
            // rename any other layers with same name
            n = 1;
            layer = comp.layer(l);
            for (i = l + 1; i <= comp.numLayers; i++) {
                if (comp.layer(i).name == layer.name) {
                    comp.layer(i).name += "_" + (++n);
                }
            }
            if (n > 1) layer.name += "_1";
            // rename any other footages
            if (layer.source && layer.source.typeName == "Footage") {
                n            = 1;
                footage      = layer.source;
                footage.name = footageName(footage);
                for (i = 1; i <= app.project.items.length; i++) {
                    item = app.project.item(i);
                    if (item.typeName == "Footage" && item != footage) {
                        item.name = footageName(item);
                        if (item.name == footage.name) {
                            ++n;
                            item.name += "_" + n;
                        }
                    }
                }
                if (n > 1) {
                    footage.name += "_1";
                }
            }
        }

        // ---------------------------------------------------------------------
        // slot attachments - note that attachment names incl. double quotes already!
        st.text = comp.name + ': Preparing attachments...';
        pb.value = 0;
        pw.update();

        numLayersWithEffect = 0;
        for (l = 1; l <= comp.numLayers; l++) {
            layer = comp.layer(l);
            if (layer.source.typeName == "Composition" || layer.nullLayer) continue;
            if (layer.property('Effects').numProperties > 0 && layer.effectsActive) {
                numLayersWithEffect++;
            }
        }
        if (numLayersWithEffect > 0) {
            st.text = comp.name + ': Rendering distorted attachments...';
            pw.update();
        }

        setupAttachment = {};
        keyAttachment   = {};
        for (l = 1; l <= comp.numLayers; l++) {
            layer = comp.layer(l);
            if (layer.source.typeName == "Composition" || layer.nullLayer) continue;
            name = attachmentName(layer);
            slot = slotName(layer);
            setupAttachment[slot] = 'null';
            keyAttachment  [slot] = new Array();
            // render effect distorted attachments if layer distortion effects
            // such as Transformation or Wave Warp are active; note that the Puppet
            // effect is explicitly exported below; it can be recovered using the
            // As Rigid As Possible algorithm used by the Puppet Tool effect
            if (layer.property('Effects').numProperties > 0 && layer.effectsActive &&
                    !layer.property('Effects').property('Puppet')) {
                num = saveLayerAsPNGs(outputDir, layer, fps);
                if (num == 0) {
                    alert('Failed to render distorted attachments for layer ' + layer.name);
                    pw.close();
                    return 1;
                }
                if (layer.inPoint == comp.workAreaStart) {
                    setupAttachment[slot] = '"' + name + '_00000"';
                    i = 1;
                } else {
                    setupAttachment[slot] = 'null';
                    i = 0;
                }
                while (i < num) {
                    idx = i.toString();
                    while (idx.length < 5) idx = '0' + idx;
                    key        = {};
                    key.time   = layer.inPoint + i / fps;
                    key.value  = '"' + name + '_' + idx + '"';
                    keyAttachment[slot].push(key);
                    i++;
                }
                pb.value += 100 / numLayersWithEffect;
                pw.update();
            // otherwise, consider inPoint and outPoint of static attachment
            } else {
                // inPoint
                if (layer.inPoint > comp.workAreaStart) {
                    key       = {};
                    key.time  = layer.inPoint;
                    key.value = '"' + name + '"';
                    keyAttachment  [slot].push(key);
                    setupAttachment[slot] = 'null';
                } else {
                    setupAttachment[slot] = '"' + name + '"';
                }
                // outPoint
                if (layer.outPoint < comp.workAreaStart + comp.workAreaDuration) {
                    key       = {};
                    key.time  = layer.outPoint;
                    key.value = 'null';
                    keyAttachment[slot].push(key);
                }
            }
            // discard redundant keyframes
            if (FPS_COMPRESSION) {
                keyAttachment[slot] = sparsifyKeyFrames(comp, keyAttachment[slot], setupAttachment[slot]);
            }
        }

        pb.value = 100;
        pw.update();

        // ---------------------------------------------------------------------
        // write animation data in Spine JSON format - see http://esotericsoftware.com/spine-json-format/
        st.text = comp.name + ': Exporting keyframes...';
        pb.value = 0;
        pw.update();

        json.writeln("{");
        // bones (incl. null objects)
        json.writeln("\"bones\": [");
        json.writeln("\t{ \"name\": \"root\" },");
        depth    = new Array();
        maxDepth = 0;
        for (l = 1; l <= comp.numLayers; l++) {
            d = 0;
            for (layer = comp.layer(l); layer.parent != null; layer = layer.parent) d++;
            depth[l] = d;
            if (maxDepth < d) maxDepth = d;
        }
        for (d = 0; d <= maxDepth; d++) {
            for (l = 1; l <= comp.numLayers; l++) {
                layer = comp.layer(l);
                if (depth[l] == d) {
                    setupPosition = layer.position.valueAtTime(comp.workAreaStart, false);
                    setupRotation = layer.rotation.valueAtTime(comp.workAreaStart, false);
                    setupScale    = layer.scale   .valueAtTime(comp.workAreaStart, false);

                    if (layer.parent != null) parentPosition = layer.parent.anchorPoint.valueAtTime(comp.workAreaStart, false);
                    else                      parentPosition = [0, 0];

                    line  = "\t{ \"name\": \"" + boneName(layer) + "\", \"parent\": \"" + boneName(layer.parent) + "\"";
                    value = valueToString(setupPosition[0] - parentPosition[0]);
                    if (value != '0') line += ", \"x\": " + value;
                    value = valueToString(-(setupPosition[1] - parentPosition[1]));
                    if (value != '0') line += ", \"y\": " + value;
                    value = valueToString(setupScale[0] / 100);
                    if (value != '1') line += ", \"scaleX\": " + value;
                    value = valueToString(setupScale[1] / 100);
                    if (value != '1') line += ", \"scaleY\": " + value;
                    value = valueToString(-setupRotation);
                    if (value != '0') line += ", \"rotation\": " + value;
                    line += " },";

                    json.writeln(line);
                }
            }
        }
        json.writeln("],");
        // attachment slots
        json.writeln("\"slots\": [");
        for (l = comp.numLayers; l >= 1; l--) {
            layer = comp.layer(l);
            if (layer.source.typeName == "Composition" || layer.nullLayer) continue;
            slot = slotName(layer);
            if (setupAttachment[slot].indexOf('_decomposed') > -1) {
                alert('Invalid attachment name for layer ' + layer.name + ': ' + setupAttachment[slot]);
                return 1;
            }
            line = "\t{ \"name\": \"" + slot            + "\""
                 + ", \"bone\": \""   + boneName(layer) + "\"";
            if (setupAttachment[slot] != 'null') line += ", \"attachment\": " + setupAttachment[slot];
            // Note: If you notice a problem with the setup opacity always being 100% after loading
            //       the exported JSON file into Spine or one of its runtimes, this might be related
            //       to a bug in the Spine runtimes itself which might ignore the alpha component of
            //       the slot color.
            //
            //       See https://github.com/EsotericSoftware/spine-runtimes/issues/59.
            value = opacityToColor(layer.opacity.valueAtTime(comp.workAreaStart, false));
            if (value != 'FFFFFFFF') line += ", \"color\": \"" + value + "\"";
            // puppet mesh
            if (PUPPET_EXTENSION && layer.effectsActive && layer.property('Effects').property('Puppet')) {
                mesh = layer.property('Effects').property('Puppet').arap.mesh(1);
                if (!mesh) {
                    alert('Missing mesh for Puppet effect of layer ' + layer.name + '!');
                    return 1;
                }
                if (mesh    .property('Deform')   .numProperties > 0 ||
                        mesh.property('Stiffness').numProperties > 0 ||
                        mesh.property('Overlap')  .numProperties > 0) {
                    json.writeln(line + ",");
                    // deform pins
                    if (mesh.property('Deform').numProperties > 0) {
                        json.writeln("\t\t\"deform pins\": [");
                        for (p = mesh.property('Deform').numProperties; p > 0; p--) {
                            pin = mesh.property('Deform').property(p);

                            setupPosition = pin.position.valueAtTime(comp.workAreaStart, false);

                            line  = "\t\t\t{ \"name\": \"" + pin.name + "\"";
                            line += ", \"x\": " + valueToString( setupPosition[0]);
                            line += ", \"y\": " + valueToString(-setupPosition[1]);
                            line += " },";

                            json.writeln(line);
                        }
                        json.writeln("\t\t],");
                    }
                    // stiffness pins
                    if (mesh.property('Stiffness').numProperties > 0) {
                        json.writeln("\t\t\"starch pins\": [");
                        for (p = mesh.property('Stiffness').numProperties; p > 0; p--) {
                            pin = mesh.property('Stiffness').property(p);

                            setupPosition  = pin.position.valueAtTime(comp.workAreaStart, false);
                            setupStiffness = pin.amount  .valueAtTime(comp.workAreaStart, false);
                            setupExtent    = pin.extent  .valueAtTime(comp.workAreaStart, false);

                            line  = "\t\t\t{ \"name\": \"" + pin.name + "\"";
                            line += ", \"x\": "         + valueToString( setupPosition[0]);
                            line += ", \"y\": "         + valueToString(-setupPosition[1]);
                            line += ", \"stiffness\": " + valueToString(setupStiffness / 100);
                            line += ", \"extent\": "    + valueToString(setupExtent);
                            line += " },";

                            json.writeln(line);
                        }
                        json.writeln("\t\t],");
                    }
                    // overlap pins
                    if (mesh.property('Overlap').numProperties > 0) {
                        json.writeln("\t\t\"overlap pins\": [");
                        for (p = mesh.property('Overlap').numProperties; p > 0; p--) {
                            pin = mesh.property('Overlap').property(p);

                            setupPosition = pin.position            .valueAtTime(comp.workAreaStart, false);
                            setupInFront  = pin.property('In Front').valueAtTime(comp.workAreaStart, false);
                            setupExtent   = pin.extent              .valueAtTime(comp.workAreaStart, false);

                            line  = "\t\t\t{ \"name\": \"" + pin.name + "\"";
                            line += ", \"x\": "       + valueToString( setupPosition[0]);
                            line += ", \"y\": "       + valueToString(-setupPosition[1]);
                            line += ", \"infront\": " + valueToString(setupInFront / 100);
                            line += ", \"extent\": "  + valueToString(setupExtent);
                            line += " },";

                            json.writeln(line);
                        }
                        json.writeln("\t\t],");
                    }
                    json.writeln("\t},");
                } else {
                    json.writeln(line + " },");
                }
            } else {
                json.writeln(line + " },");
            }
        }
        json.writeln("],");
        // skins and anchor point of attachment
        json.writeln("\"skins\": {");
        json.writeln("\t\"default\": {");
        for (l = 1; l <= comp.numLayers; l++) {
            layer = comp.layer(l);
            if (layer.source.typeName == "Composition" || layer.nullLayer) continue;
            slot  = slotName(layer);
            props = attachmentProps(layer);
            json.writeln("\t\t\"" + slot + "\": {");
            if (setupAttachment[slot] != 'null') {
              json.writeln("\t\t\t" + setupAttachment[slot] + ": { " + props + " },");
            }
            for (i = 0; i < keyAttachment[slot].length; i++) {
              if (keyAttachment[slot][i].value == 'null' || keyAttachment[slot][i].value == setupAttachment[slot]) continue;
              json.writeln("\t\t\t" + keyAttachment[slot][i].value + ": { " + props + " },");
            }
            json.writeln("\t\t},");
        }
        json.writeln("\t},");
        json.writeln("},");
        // export composition timeline keyframes
        json.writeln("\"animations\": {");
        json.writeln("\t\"01\": {");
        // bone animations, i.e., rigid body + scale transformations
        json.writeln("\t\t\"bones\": {");
        for (l = 1; l <= comp.numLayers; l++) {
            layer = comp.layer(l);
            if (layer.source.typeName == "Composition") continue;
            // setup pose of layer
            setupPosition = layer.position.valueAtTime(comp.workAreaStart, false);
            setupRotation = layer.rotation.valueAtTime(comp.workAreaStart, false);
            setupScale    = layer.scale   .valueAtTime(comp.workAreaStart, false);
            // either sample layer transformation at constant frame rate
            keyPosition = new Array();
            keyRotation = new Array();
            keyScale    = new Array();
            if (sampleKeyFrames) {
                for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                    // position samples
                    key       = {};
                    key.time  = t;
                    key.value = layer.position.valueAtTime(t, false);
                    key.out   = KeyframeInterpolationType.LINEAR;
                    keyPosition.push(key);
                    // rotation samples
                    key       = {};
                    key.time  = t;
                    key.value = layer.rotation.valueAtTime(t, false);
                    key.out   = KeyframeInterpolationType.LINEAR;
                    keyRotation.push(key);
                    // scale samples
                    key       = {};
                    key.time  = t;
                    key.value = layer.scale.valueAtTime(t, false);
                    key.out   = KeyframeInterpolationType.LINEAR;
                    keyScale.push(key);
                }
            // or export AE keyframes
            } else {
                // position keys
                for (k = 1; k <= layer.position.numKeys; k++) {
                    key       = {};
                    key.time  = layer.position.keyTime(k);
                    key.value = layer.position.valueAtTime(key.time, false);
                    key.out   = layer.position.keyOutInterpolationType(k);
                    keyPosition.push(key);
                }
                // rotation keys
                for (k = 1; k <= layer.rotation.numKeys; k++) {
                    key       = {};
                    key.time  = layer.rotation.keyTime(k);
                    key.value = layer.rotation.valueAtTime(key.time, false);
                    key.out   = layer.rotation.keyOutInterpolationType(k);
                    keyRotation.push(key);
                }
                // scale keys
                for (k = 1; k <= layer.scale.numKeys; k++) {
                    key       = {};
                    key.time  = layer.scale.keyTime(k);
                    key.value = layer.scale.valueAtTime(key.time, false);
                    key.out   = layer.scale.keyOutInterpolationType(k);
                    keyScale.push(key);
                }
            }
            // discard redundant keyframes
            if (FPS_COMPRESSION) {
                keyPosition = sparsifyKeyFrames(comp, keyPosition, setupPosition);
                keyRotation = sparsifyKeyFrames(comp, keyRotation, setupRotation);
                keyScale    = sparsifyKeyFrames(comp, keyScale,    setupScale);
            }
            // write keyframes of bone animation
            if (keyPosition.length + keyRotation.length + keyScale.length > 0) {
                json.writeln("\t\t\t\"" + boneName(layer) + "\": {");
                // write position animation
                if (keyPosition.length > 0) {
                    json.writeln("\t\t\t\t\"translate\": [");
                    for (i = 0; i < keyPosition.length; i++) {
                        line = "\t\t\t\t\t{ \"time\": " + valueToString(keyPosition[i].time);
                        if (i < keyPosition.length-1) line += interpolationToCurve(keyPosition[i].out);
                        line += ", \"x\": " + valueToString(  keyPosition[i].value[0] - setupPosition[0] );
                        line += ", \"y\": " + valueToString(-(keyPosition[i].value[1] - setupPosition[1]));
                        line += " }";
                        if (i < keyPosition.length-1) line += ",";
                        json.writeln(line);
                    }
                    json.writeln("\t\t\t\t],");
                }
                // write rotation animation
                if (keyRotation.length > 0) {
                    json.writeln("\t\t\t\t\"rotate\": [");
                    for (i = 0; i < keyRotation.length; i++) {
                        line = "\t\t\t\t\t{ \"time\": " + valueToString(keyRotation[i].time);
                        if (i < keyRotation.length-1) line += interpolationToCurve(keyRotation[i].out);
                        line += ", \"angle\": " + valueToString(-(keyRotation[i].value - setupRotation));
                        line += " }";
                        if (i < keyRotation.length-1) line += ",";
                        json.writeln(line);
                    }
                    json.writeln("\t\t\t\t],");
                }
                // write scale animation
                if (keyScale.length > 0) {
                    json.writeln("\t\t\t\t\"scale\": [");
                    for (i = 0; i < keyScale.length; i++) {
                        line = "\t\t\t\t\t{ \"time\": " + valueToString(keyScale[i].time);
                        if (i < keyScale.length-1) line += interpolationToCurve(keyScale[i].out);
                        line += ", \"x\": " + valueToString(1 + (keyScale[i].value[0] - setupScale[0]) / 100);
                        line += ", \"y\": " + valueToString(1 + (keyScale[i].value[1] - setupScale[1]) / 100);
                        line += " }";
                        if (i < keyScale.length-1) line += ",";
                        json.writeln(line);
                    }
                    json.writeln("\t\t\t\t],");
                }
                json.writeln("\t\t\t},");
            }
            
        }
        json.writeln("\t\t},");

        // slot animations
        json.writeln("\t\t\"slots\": {");
        for (l = 1; l <= comp.numLayers; l++) {
            layer = comp.layer(l);
            slot  = slotName(layer);
            if (layer.source.typeName == "Composition" || layer.nullLayer) continue;
            // color changes
            setupColor = opacityToColor(layer.opacity.valueAtTime(comp.workAreaStart, false));
            keyColor   = new Array();
            if (sampleKeyFrames) {
                for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                    key       = {};
                    key.time  = t;
                    key.value = opacityToColor(layer.opacity.valueAtTime(t, false));
                    key.out   = KeyframeInterpolationType.LINEAR;
                    keyColor.push(key);
                }
            } else {
                for (k = 1; k <= layer.opacity.numKeys; k++) {
                    key       = {};
                    key.time  = layer.opacity.keyTime(k);
                    key.value = opacityToColor(layer.opacity.valueAtTime(key.time, false));
                    key.out   = layer.opacity.keyOutInterpolationType(k);
                    keyColor.push(key);
                }
            }
            if (FPS_COMPRESSION) keyColor = sparsifyKeyFrames(comp, keyColor, setupColor);
            // puppet effect - distorts slot attachment
            keyDeformPin  = new Array();
            keyStarchPin  = new Array();
            keyOverlapPin = new Array();
            if (PUPPET_EXTENSION && layer.effectsActive && layer.property('Effects').property('Puppet')) {
                mesh = layer.property('Effects').property('Puppet').arap.mesh(1);
                if (!mesh) {
                    alert('Missing mesh for Puppet effect of layer ' + layer.name + '!');
                    return 1;
                }
                // deform pins
                if (mesh.property('Deform').numProperties > 0) {
                    for (p = mesh.property('Deform').numProperties; p > 0; p--) {
                        pin = mesh.property('Deform').property(p);
                        // setup pose of pin
                        setupPosition = pin.position.valueAtTime(comp.workAreaStart, false);
                        // either sample pin positions at constant frame rate
                        keyPosition = new Array();
                        if (sampleKeyFrames) {
                            for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                key       = {};
                                key.time  = t;
                                key.value = pin.position.valueAtTime(t, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyPosition.push(key);
                            }
                        // or export AE keyframes
                        } else {
                            for (k = 1; k <= pin.position.numKeys; k++) {
                                key       = {};
                                key.time  = pin.position.keyTime(k);
                                key.value = pin.position.valueAtTime(key.time, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyPosition.push(key);
                            }
                        }
                        // discard redundant keyframes
                        if (FPS_COMPRESSION) {
                            keyPosition = sparsifyKeyFrames(comp, keyPosition, setupPosition);
                        }
                        // store pin keyframes for later
                        if (keyPosition.length > 0) {
                            // TODO similar to other Spine animations, convert values to be relative to setup pose
                            dpin             = {};
                            dpin.name        = pin.name;
                            dpin.keyPosition = keyPosition;
                            keyDeformPin.push(dpin);
                        }
                    }
                }
                // stiffness pins
                if (mesh.property('Stiffness').numProperties > 0) {
                    for (p = mesh.property('Stiffness').numProperties; p > 0; p--) {
                        pin = mesh.property('Stiffness').property(p);
                        // setup pose of pin
                        setupPosition  = pin.position.valueAtTime(comp.workAreaStart, false);
                        setupStiffness = pin.amount  .valueAtTime(comp.workAreaStart, false);
                        setupExtent    = pin.extent  .valueAtTime(comp.workAreaStart, false);
                        // either sample pin properties at constant frame rate
                        keyPosition  = new Array();
                        keyStiffness = new Array();
                        keyExtent    = new Array();
                        if (sampleKeyFrames) {
                            for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                key       = {};
                                key.time  = t;
                                key.value = pin.position.valueAtTime(t, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyPosition.push(key);
                            }
                            for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                key       = {};
                                key.time  = t;
                                key.value = pin.amount.valueAtTime(t, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyStiffness.push(key);
                            }
                            for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                key       = {};
                                key.time  = t;
                                key.value = pin.extent.valueAtTime(t, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyExtent.push(key);
                            }
                        // or export AE keyframes
                        } else {
                            for (k = 1; k <= pin.position.numKeys; k++) {
                                key       = {};
                                key.time  = pin.position.keyTime(k);
                                key.value = pin.position.valueAtTime(key.time, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyPosition.push(key);
                            }
                            for (k = 1; k <= pin.amount.numKeys; k++) {
                                key       = {};
                                key.time  = pin.amount.keyTime(k);
                                key.value = pin.amount.valueAtTime(key.time, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyStiffness.push(key);
                            }
                            for (k = 1; k <= pin.extent.numKeys; k++) {
                                key       = {};
                                key.time  = pin.extent.keyTime(k);
                                key.value = pin.extent.valueAtTime(key.time, false);
                                key.out   = KeyframeInterpolationType.LINEAR;
                                keyExtent.push(key);
                            }
                        }
                        // discard redundant keyframes
                        if (FPS_COMPRESSION) {
                            keyPosition  = sparsifyKeyFrames(comp, keyPosition,  setupPosition);
                            keyStiffness = sparsifyKeyFrames(comp, keyStiffness, setupStiffness);
                            keyExtent    = sparsifyKeyFrames(comp, keyExtent,    setupExtent);
                        }
                        // store pin keyframes for later
                        if (keyPosition.length > 0 || keyStiffness.length > 0 || keyExtent.length > 0) {
                            // TODO similar to other Spine animations, convert values to be relative to setup pose
                            spin              = {};
                            spin.name         = pin.name;
                            spin.keyPosition  = keyPosition;
                            spin.keyStiffness = keyStiffness;
                            spin.keyExtent    = keyExtent;
                            keyStarchPin.push(spin);
                        }
                    }
                }
                // overlap pins
                if (mesh.property('Overlap').numProperties > 0) {
                    //json.writeln("\t\t\t\t\"overlap\": {");
                    for (p = mesh.property('Overlap').numProperties; p > 0; p--) {
                        pin = mesh.property('Overlap').property(p);
                        // setup pose of pin
                        setupPosition = pin.position            .valueAtTime(comp.workAreaStart, false);
                        setupInFront  = pin.property('In Front').valueAtTime(comp.workAreaStart, false);
                        setupExtent   = pin.extent              .valueAtTime(comp.workAreaStart, false);
                        // either sample pin properties at constant frame rate
                        keyPosition = new Array();
                        keyInFront  = new Array();
                        keyExtent   = new Array();
                        if (sampleKeyFrames) {
                            for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                key       = {};
                                key.time  = t;
                                key.value = pin.position.valueAtTime(t, false);
                                keyPosition.push(key);
                            }
                            for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                key       = {};
                                key.time  = t;
                                key.value = pin.property('In Front').valueAtTime(t, false);
                                keyInFront.push(key);
                            }
                            for (t = comp.workAreaStart; t <= comp.workAreaDuration; t += comp.frameDuration) {
                                key       = {};
                                key.time  = t;
                                key.value = pin.extent.valueAtTime(t, false);
                                keyExtent.push(key);
                            }
                        // or export AE keyframes
                        } else {
                            for (k = 1; k <= pin.position.numKeys; k++) {
                                key       = {};
                                key.time  = pin.position.keyTime(k);
                                key.value = pin.position.valueAtTime(key.time, false);
                                keyPosition.push(key);
                            }
                            for (k = 1; k <= pin.property('In Front').numKeys; k++) {
                                key       = {};
                                key.time  = pin.property('In Front').keyTime(k);
                                key.value = pin.property('In Front').valueAtTime(key.time, false);
                                keyInFront.push(key);
                            }
                            for (k = 1; k <= pin.extent.numKeys; k++) {
                                key       = {};
                                key.time  = pin.extent.keyTime(k);
                                key.value = pin.extent.valueAtTime(key.time, false);
                                keyExtent.push(key);
                            }
                        }
                        // discard redundant keyframes
                        if (FPS_COMPRESSION) {
                            keyPosition = sparsifyKeyFrames(comp, keyPosition, setupPosition);
                            keyInFront  = sparsifyKeyFrames(comp, keyInFront,  setupInFront);
                            keyExtent   = sparsifyKeyFrames(comp, keyExtent,   setupExtent);
                        }
                        // store pin keyframes for later
                        if (keyPosition.length > 0 || keyInFront.length > 0 || keyExtent.length > 0) {
                            // TODO similar to other Spine animations, convert values to be relative to setup pose
                            opin             = {};
                            opin.name        = pin.name;
                            opin.keyPosition = keyPosition;
                            opin.keyInFront  = keyInFront;
                            opin.keyExtent   = keyExtent;
                            keyOverlapPin.push(opin);
                        }
                    }
                }
            }
            // write keyframes of slot animation
            if (keyColor.length > 0 || keyAttachment[slot].length > 0
                    || keyDeformPin.length > 0 || keyStarchPin.length > 0 || keyOverlapPin.length > 0) {
                json.writeln("\t\t\t\"" + slot + "\": {");
                if (keyColor.length > 0) {
                    json.writeln("\t\t\t\t\"color\": [");
                    for (i = 0; i < keyColor.length; i++) {
                        line = "\t\t\t\t\t{ \"time\": " + valueToString(keyColor[i].time);
                        if (i < keyColor.length-1) line += interpolationToCurve(keyColor[i].out);
                        line += ", \"color\": \"" + keyColor[i].value + "\"";
                        line += " }";
                        if (i < keyColor.length-1) line += ",";
                        json.writeln(line);
                    }
                    json.writeln("\t\t\t\t],");
                }
                if (keyAttachment[slot].length > 0) {
                    json.writeln("\t\t\t\t\"attachment\": [");
                    for (i = 0; i < keyAttachment[slot].length; i++) {
                        json.writeln("\t\t\t\t\t{ \"time\": " + valueToString(keyAttachment[slot][i].time)
                                + ", \"name\": " + keyAttachment[slot][i].value + " },");
                    }
                    json.writeln("\t\t\t\t],");
                }
                if (keyDeformPin.length > 0) {
                    json.writeln("\t\t\t\t\"shape\": {");
                    json.writeln("\t\t\t\t\t\"deform\": {");
                    for (p = 0; p < keyDeformPin.length; p++) {
                        pin = keyDeformPin[p];
                        json.writeln("\t\t\t\t\t\t\"" + pin.name + "\": {");
                        json.writeln("\t\t\t\t\t\t\t\"translate\": [");
                        for (i = 0; i < pin.keyPosition.length; i++) {
                            json.writeln("\t\t\t\t\t\t\t\t{ \"time\": " + valueToString(pin.keyPosition[i].time)
                                    + ", \"x\": " + valueToString(  pin.keyPosition[i].value[0] )
                                    + ", \"y\": " + valueToString(-(pin.keyPosition[i].value[1]))
                                    + " },");
                        }
                        json.writeln("\t\t\t\t\t\t\t],");
                        json.writeln("\t\t\t\t\t\t},");
                    }
                    json.writeln("\t\t\t\t\t},");
                    if (keyStarchPin.length > 0) {
                        json.writeln("\t\t\t\t\t\"starch\": {");
                        for (p = 0; p < keyStarchPin.length; p++) {
                            pin = keyStarchPin[p];
                            json.writeln("\t\t\t\t\t\t\"" + pin.name + "\": {");
                            if (pin.keyPosition.length > 0) {
                                json.writeln("\t\t\t\t\t\t\t\"translate\": [");
                                for (i = 0; i < pin.keyPosition.length; i++) {
                                    json.writeln("\t\t\t\t\t\t\t\t{ \"time\": " + valueToString(pin.keyPosition[i].time)
                                            + ", \"x\": " + valueToString(  pin.keyPosition[i].value[0] )
                                            + ", \"y\": " + valueToString(-(pin.keyPosition[i].value[1]))
                                            + " },");
                                }
                                json.writeln("\t\t\t\t\t\t\t],");
                            }
                            if (pin.keyStiffness.length > 0) {
                                json.writeln("\t\t\t\t\t\t\t\"stiffness\": [");
                                for (i = 0; i < pin.keyStiffness.length; i++) {
                                    json.writeln("\t\t\t\t\t\t\t\t{ \"time\": " + valueToString(pin.keyStiffness[i].time)
                                            + ", \"stiffness\": " + valueToString(pin.keyStiffness[i].value / 100)
                                            + " },");
                                }
                                json.writeln("\t\t\t\t\t\t\t],");
                            }
                            if (pin.keyExtent.length > 0) {
                                json.writeln("\t\t\t\t\t\t\t\"extent\": [");
                                for (i = 0; i < keyExtent.length; i++) {
                                    json.writeln("\t\t\t\t\t\t\t\t{ \"time\": " + valueToString(pin.keyExtent[i].time)
                                            + ", \"extent\": " + valueToString(pin.keyExtent[i].value)
                                            + " },");
                                }
                                json.writeln("\t\t\t\t\t\t\t],");
                            }
                            json.writeln("\t\t\t\t\t\t},");
                        }
                        json.writeln("\t\t\t\t\t},");
                    }
                    if (keyOverlapPin.length > 0) {
                        json.writeln("\t\t\t\t\t\"overlap\": {");
                        for (p = 0; p < keyOverlapPin.length; p++) {
                            pin = keyOverlapPin[p];
                            json.writeln("\t\t\t\t\t\t\"" + pin.name + "\": {");
                            if (pin.keyPosition.length > 0) {
                                json.writeln("\t\t\t\t\t\t\t\"translate\": [");
                                for (i = 0; i < pin.keyPosition.length; i++) {
                                    json.writeln("\t\t\t\t\t\t\t\t{ \"time\": " + valueToString(pin.keyPosition[i].time)
                                            + ", \"x\": " + valueToString(  pin.keyPosition[i].value[0] )
                                            + ", \"y\": " + valueToString(-(pin.keyPosition[i].value[1]))
                                            + " },");
                                }
                                json.writeln("\t\t\t\t\t\t\t],");
                            }
                            if (pin.keyInFront.length > 0) {
                                json.writeln("\t\t\t\t\t\t\t\"infront\": [");
                                for (i = 0; i < pin.keyInFront.length; i++) {
                                    json.writeln("\t\t\t\t\t\t\t\t{ \"time\": " + valueToString(pin.keyInFront[i].time)
                                            + ", \"infront\": " + valueToString(pin.keyInFront[i].value / 100)
                                            + " },");
                                }
                                json.writeln("\t\t\t\t\t\t\t],");
                            }
                            if (pin.keyExtent.length > 0) {
                                json.writeln("\t\t\t\t\t\t\t\"extent\": [");
                                for (i = 0; i < pin.keyExtent.length; i++) {
                                    json.writeln("\t\t\t\t\t\t\t\t{ \"time\": " + valueToString(pin.keyExtent[i].time)
                                            + ", \"extent\": " + valueToString(pin.keyExtent[i].value)
                                            + " },");
                                }
                                json.writeln("\t\t\t\t\t\t\t],");
                            }
                            json.writeln("\t\t\t\t\t\t},");
                        }
                        json.writeln("\t\t\t\t\t},");
                    }
                    json.writeln("\t\t\t\t},");
                }
                json.writeln("\t\t\t},");
            }
        }
        json.writeln("\t\t},");

        // close remaining open brackets
        json.writeln("\t},");
        json.writeln("},");
        json.writeln("}");

        st.text = comp.name + ': Finished!';
        pb.value = 100;
        pw.update();
    }

    // -------------------------------------------------------------------------
    // remove unused footage
    /*
    st.text = 'Exporting footage...';
    pb.value = 0;
    pw.update();
    if (confirm('Do you want to remove unused footage before continuing with its export?')) {
        st.text = 'Removing unused footage...';
        pw.update();
        app.project.removeUnusedFootage();
        pb.value = 100;
        pw.update();
    }
    */

    // -------------------------------------------------------------------------
    // export layer footage - AFTER compositions as it changes item selections!
    st.text = 'Exporting footage...';
    pb.value = 0;
    pw.update();

    footageIdx = new Array();
    for (i = 1; i <= app.project.items.length; i++) {
        item = app.project.item(i);
        if (item.typeName == "Footage") {
            footage   = item;
            footageOk = false;
            for (j = 1; j <= app.project.items.length; j++) {
                otherItem = app.project.item(j);
                if (otherItem.typeName == "Composition" && otherItem.selected) {
                    comp = otherItem;
                    for (l = 1; l <= comp.numLayers; l++) {
                        layer = comp.layer(l);
                        if (!layer.nullLayer && layer.source == footage) {
                            footageOk = true;
                            break;
                        }
                    }
                    if (footageOk) break;
                }
            }
            if (footageOk) footageIdx.push(i);
        }
    }
    footageOk = true;
    for (i = 0; i < footageIdx.length; i++) {
        footage = app.project.item(footageIdx[i]);
        range   = getSequenceRange(footage);
        if (range[0] != -1) {
            prefix = getSequencePrefix(footage);
            suffix = getSequenceSuffix(footage);
            for (s = range[0]; s <= range[1]; s++) {
                footageOk = saveFootageAsPNG(outputDir, getSequenceFile(prefix, suffix, s)) && footageOk;
            }
        } else {
            footageOk = saveFootageAsPNG(outputDir, footage) && footageOk;
        }
        pb.value = 100 * (i+1)/footageIdx.length;
        pw.update();
    }

    pw.close();
    return footageOk ? 0 : 1;
}

// =============================================================================
// execute main
// =============================================================================

app.activate();

// TODO: How can we just disable them in saveFootageAsPNG?
go = true;
for (i = 1; i <= app.project.renderQueue.numItems; i++) {
    if (app.project.renderQueue.item(i).status == RQItemStatus.QUEUED) {
        app.project.renderQueue.showWindow(true);
        alert('There are queued items in render queue!\nPlease render these first or disable them in the render queue before you try to export the animation.');
        go = false;
    }
}

if (go) {
    app.project.saveWithDialog();
    rc = main();
    if (app.project.file) {
        if (rc == 0) msg = 'Success';
        else         msg = 'Failed';
        if (confirm(msg + '!\nYou hopefully saved your project before the export.'
                  + '\nDo you want to revert to the last saved state now?')) {
            f = app.project.file;
            app.project.close(CloseOptions.DO_NOT_SAVE_CHANGES);
            app.open(f);
        }
    }
}
