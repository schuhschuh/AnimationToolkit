/*
 * Copyright (C) 2013, Andreas Schuh
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License long
 * with The Animation Toolkit. If not, see <http://www.gnu.org/licenses/>.
 */

#include <string>
#include "config.h"

using namespace std;

// ----------------------------------------------------------------------------
// CImg
#define cimg_display   0
#define cimg_verbosity 0
#define cimg_plugin "CImgPlugin.h"
#include "CImg.h"
using namespace cimg_library;

// ----------------------------------------------------------------------------
// Checks if given filename contains a format pattern such as in test_%05d.png
bool contains_pattern(const string &str)
{
  const char *p = str.c_str();
  while ((p = strchr(p, '%')) && ++p) {
    while ('0' <= *p && *p <= '9') ++p;
    if (*p == 'd') return true;
  }
  return false;
}

// ----------------------------------------------------------------------------
// Remove '_[0-9]+' pattern from string matching regular expression '*_[0-9]+\.*'
string remove_pattern(const string &str)
{
  string res;
  const char *p = str.c_str();
  while (*p && *p != '_') res.push_back(*p++);
  p++;
  while ('0' <= *p && *p <= '9') p++;
  if (*p != '.') return str;
  return res + p;
}

// ----------------------------------------------------------------------------
// Replace '_[0-9]+' pattern from string matching regular expression '*_[0-9]+\.*'
string replace_pattern(const string &str, const char *sub, int &b)
{
  string res;
  string n;
  const char *p = str.c_str();
  while (*p && *p != '_') res.push_back(*p++);
  p++;
  while ('0' <= *p && *p <= '9') n.push_back(*p++);
  if (!n.empty()) b = atoi(n.c_str());
  if (*p != '.') return str;
  return (res + sub) + p;
}

// ----------------------------------------------------------------------------
// Replace filename extension
string replace_extension(const string &str, const char *ext)
{
  string res(str);
  size_t pos = res.rfind('.');
  if (pos != string::npos) res.replace(pos, string::npos, ext);
  return res;
}

// ----------------------------------------------------------------------------
// Get frame number from filename matching regular expression '*_[0-9]+\.*'
int get_frame_number(const string &str)
{
  string n;
  const char *p = str.c_str();
  while (*p && *p != '_') { p++; } p++;
  while ('0' <= *p && *p <= '9') n.push_back(*p++);
  return n.empty() ? 0 : atoi(n.c_str());
}

// ----------------------------------------------------------------------------
int main(int argc, char *argv[])
{
  // Command help
  cimg_usage("[options] -i animation.mov  -o frames.png [-c coords.csv]\n"
"              [options] -i frames_\%6d.png -o frames.png [-c coords.csv]\n"
"\n version: " VERSION);
  cimg_help(" This program can be used to crop all frames of an image sequence such as an animation.\n"
            " All frames of the sequence are expected to have the same size. Each frame is by\n"
            " default cropped to the smallest possible bounding box. A CSV file with the minimum\n"
            " and maximum pixel indices of the region used to crop each frame is optionally\n"
            " stored along with the cropped images. Additionally, relative pixel offsets for\n"
            " the center of the bounding boxes are computed and stored in the CSV file. This\n"
            " allows the recovery of the global animation from the cropped image sequence.\n");
  // Command-line options
  char default_ifname[32];
  bool   append         = cimg_option("-a", false, "Process single image file and append to existing CSV spreadsheet.");
  string ifname         = cimg_option("-i", "animation_000000.png",   "Input sequence, e.g., movie.mov, movie_000.png, or movie_\%06d.png.");
  string default_ofname = append ? ifname : remove_pattern(ifname);
  string ofname  = cimg_option("-o", default_ofname.c_str(),  "Output sequence, e.g., cropped.mov or cropped.png.");
  string default_csvname = replace_extension(append ? remove_pattern(ofname) : ofname, ".csv");
  string csvname = cimg_option("-c", default_csvname.c_str(), "Output CSV spreadsheet for pixel coordinates. (false: no output)");
  // Replace _[0-9]+ pattern of input filename by format string
  int fbegin = get_frame_number(ifname);
  if (default_ofname != ifname) ifname = replace_pattern (ifname, "_\%06d", fbegin);
  // Remaining command-line options
         fbegin  = cimg_option("-b", fbegin, "Index of first frame of image sequence.");
  int    fend    = cimg_option("-e", -1,     "Index of last frame of image sequence.");
  int    fstride = cimg_option("-s", 1,      "Increment/Stride of image frame indices.");
  bool   bbunion = cimg_option("-u", false,  "Crop all images using the union of all bounding boxes.");
  bool   bbfixed = cimg_option("-f", false,  "Crop all images using a fixed size bounding box.");
  int    verbose = cimg_option("-v", 0,      "Verbosity of output messages. (0: none, 1: status, 2: debug)");
  // CImg info
  if (verbose > 2) cimg::info();
  // Check arguments
  for (int i = 0; i < argc; ++i) {
    if (strcmp(argv[i], "-h") == 0 || strcmp(argv[i], "-help") == 0 || strcmp(argv[i], "--help") == 0) {
      // Help already printed by CImg macros cimg_usage and cimg_help above
      printf("\n");
      exit(0);
    }
  }
  if (ifname.empty() || ofname.empty()) {
    fprintf(stderr, "No input or output image sequence specified!\n");
    exit(1);
  }
  if (fbegin < 0) {
    fprintf(stderr, "Invalid frame start index (-b): %d\n", fbegin);
    exit(1);
  }
  if (fstride < 1) {
    fprintf(stderr, "Invalid frame index increment (-s): %d\n", fstride);
    exit(1);
  }
  // Ensure that all frames of output sequence have same size
  // if output format can store sequence in single file
  bbfixed = bbfixed || CImgList<>::is_saveable(ofname.c_str());
  // Read input sequence
  if (verbose) { printf("Read image sequence from %s...", ifname.c_str()); fflush(stdout); }
  CImgList<unsigned char> seq;
  try {
    if (contains_pattern(ifname)) {
      char buffer[1024];
      for (int frame = fbegin; fend < 0 || frame <= fend; frame += fstride) {
        if (frame > 1e6) {
          if (verbose) { printf(" failed\n"); fflush(stdout); }
          fprintf(stderr, "Error: Too many input frames...!\n");
          exit(1);
        }
        snprintf(buffer, 1024, ifname.c_str(), frame);
        FILE *tmp = fopen(buffer, "r");
        if (!tmp) {
          if (frame > fbegin && fend < 0) break;
          if (verbose) { printf(" failed\n"); fflush(stdout); }
          fprintf(stderr, "Error: Cannot read frame %d of image sequence."
                          " Expected to find it in file %s!\n", frame, buffer);
          exit(1);
        }
        fclose(tmp);
        CImg<unsigned char> img(buffer);
        seq.push_back(img);
      }
    } else {
      seq.assign(ifname.c_str());
    }
  } catch(const CImgException &err) {
    if (verbose) { printf(" failed\n"); fflush(stdout); }
    fprintf(stderr, "Error: %s\n", err.what());
    exit(1);
  }
  if (seq.size() < 1) {
    if (verbose) { printf(" failed\n"); fflush(stdout); }
    fprintf(stderr, "Error: Input image sequence is empty!\n");
    exit(1);
  }
  if (verbose) { printf(" done\n"); fflush(stdout); }
  if (verbose > 1) {
    printf("\n");
    printf("#frames: %d\n", seq.size());
    printf("width:   %d\n", seq.front().width());
    printf("height:  %d\n", seq.front().height());
    printf("\n");
  }
  // Determine crop regions
  if (verbose) {
    printf("Determine bounding boxes...");
    if (verbose > 1) printf("\n\n");
    fflush(stdout);
  }
  CImgList<int> bb(seq.size());
  cimglist_for(seq,frame) {
    // Get crop region
    bb[frame] = seq[frame].get_autocrop_region(0, "yx");
    // Ensure that center is well defined
    bb[frame](0,1) += (bb[frame](0,1) - bb[frame](0,0) + 1) % 2;
    bb[frame](1,1) += (bb[frame](1,1) - bb[frame](1,0) + 1) % 2;
    // Print crop region
    if (verbose > 1) {
      const int cx = (bb[frame](0,0) + bb[frame](0,1))/2;
      const int cy = (bb[frame](1,0) + bb[frame](1,1))/2;
      printf("frame %6d: x=[%6d,%6d], y=[%6d,%6d], c=[%6d,%6d]\n",
          fbegin + frame * fstride, bb[frame](0,0), bb[frame](0,1), bb[frame](1,0), bb[frame](1,1), cx, cy);
    }
  }
  // Adjust bounding boxes
  if (bbfixed) {
    int fx = 0;
    int fy = 0;
    cimglist_for(bb,frame) {
      fx = cimg::max(fx, bb[frame](0,1) - bb[frame](0,0) + 1);
      fy = cimg::max(fy, bb[frame](1,1) - bb[frame](1,0) + 1);
    }
    cimglist_for(bb,frame) {
      const int sx = bb[frame](0,1) - bb[frame](0,0);
      const int sy = bb[frame](1,1) - bb[frame](1,0);
      bb[frame](0,0) -= (fx - sx)     / 2;
      bb[frame](0,1) += (fx - sx + 1) / 2;
      bb[frame](1,0) -= (fy - sy)     / 2;
      bb[frame](1,1) += (fy - sy + 1) / 2;
    }
  } else if (bbunion) {
    int x0 = seq.front().width();
    int x1 = -1;
    int y0 = seq.front().height();
    int y1 = -1;
    cimglist_for(bb,frame) {
      x0 = cimg::min(x0,bb[frame](0,0));
      x1 = cimg::max(x1,bb[frame](0,1));
      y0 = cimg::min(y0,bb[frame](1,0));
      y1 = cimg::max(y1,bb[frame](1,1));
    }
    cimglist_for(bb,frame) {
      bb[frame](0,0) = x0;
      bb[frame](0,1) = x1;
      bb[frame](1,0) = y0;
      bb[frame](1,1) = y1;
    }
    if (verbose) {
      const int cx = (x0 + x1)/2;
      const int cy = (y0 + y1)/2;
      printf("union:     x=[%6d,%6d], y=[%6d,%6d], c=[%6d,%6d]\n", x0, x1, y0, y1, cx, cy);
    }
  }
  if (verbose) { if (verbose == 1) printf(" done"); printf("\n"); fflush(stdout); }
  // Crop images
  if (verbose) { printf("Crop frames of image sequence..."); fflush(stdout); }
  cimglist_for(seq,frame) {
    seq[frame].crop(bb[frame](0,0), bb[frame](1,0), bb[frame](0,1), bb[frame](1,1));
  }
  if (verbose) { printf(" done\n"); fflush(stdout); }
  // Write output sequence
  try {
    if (verbose) { printf("Writing cropped sequence to %s...", ofname.c_str()); fflush(stdout); }
    seq.save(ofname.c_str());
    if (verbose) { printf(" done\n"); fflush(stdout); }
  } catch (const CImgException &err) {
    printf(" failed\n");
    fflush(stdout);
    fprintf(stderr, "Error: %s\n", err.what());
    exit(1);
  }
  // Write spreadsheet
  if (!csvname.empty() && csvname != "false" && csvname != "no" && csvname != "0") {
    FILE *csv = NULL;
    if (append) {
      csv = fopen(csvname.c_str(), "r");
      if (csv) {
        fclose(csv);
        csv = fopen(csvname.c_str(), "a");
      }
    }
    if (!csv) {
      csv = fopen(csvname.c_str(), "w");
      if (csv) fprintf(csv, " frame,     sx,     sy,     x0,     y0,     x1,     y1,     cx,     cy,     ox,     oy\n");
    }
    if (!csv) {
      fprintf(stderr, "Failed to open spreadsheet file %s!\n", csvname.c_str());
      exit(1);
    }
    if (verbose) { printf("Writing bounding boxes to %s...", csvname.c_str()); fflush(stdout); }
    int px = -1, py = -1;
    cimglist_for(bb,frame) {
      const int x0 = bb[frame](0,0);
      const int x1 = bb[frame](0,1);
      const int y0 = bb[frame](1,0);
      const int y1 = bb[frame](1,1);
      const int sx = x1 - x0;
      const int sy = y1 - y0;
      const int cx = (x0 + x1)/2;
      const int cy = (y0 + y1)/2;
      const int ox = (px == -1) ? 0 : (cx - px);
      const int oy = (py == -1) ? 0 : (cy - py);
      fprintf(csv, "%6d, %6d, %6d, %6d, %6d, %6d, %6d, %6d, %6d, %6d, %6d\n",
                   fbegin + frame * fstride, sx, sy, x0, y0, x1, y1, cx, cy, ox, oy);
      px = cx, py = cy;
    }
    fclose(csv);
    if (verbose) { printf(" done\n"); fflush(stdout); }
  }
  return 0;
}
