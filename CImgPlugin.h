/* CImg Plugin for The Animation Toolkit
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


/// Get autocrop image region, regarding the specified background color.
///
/// \param color Color used for the crop. If \c 0, color is guessed.
/// \param axes Axes used for the crop.
CImg<int> get_autocrop_region(const T *const color=0, const char *const axes="zyx") {
  CImg<int> bb(3,2);
  bb(0,0) = bb(1,0) = bb(2,0) =  0;
  bb(0,1) = bb(1,1) = bb(2,1) = -1;
  if (is_empty()) return bb;
  if (!color) { // Guess color.
    const CImg<T> col1 = get_vector_at(0,0,0);
    bb = get_autocrop_region(col1, axes);
    if (bb(0,0) == 0 && bb(0,1) == _width-1  &&
        bb(1,0) == 0 && bb(1,1) == _height-1 &&
        bb(2,0) == 0 && bb(2,1) == _depth-1) {
      const CImg<T> col2 = get_vector_at(_width-1, _height-1, _depth-1);
      bb = get_autocrop_region(col2, axes);
    }
    return bb;
  }
  for (const char *s = axes; *s; ++s) {
    const char axis = cimg::uncase(*s);
    switch (axis) {
    case 'x' : {
      int x0 = width(), x1 = -1;
      cimg_forC(*this,c) {
        const CImg<intT> coords = get_shared_channel(c)._autocrop(color[c],'x');
        const int nx0 = coords[0], nx1 = coords[1];
        if (nx0>=0 && nx1>=0) { x0 = cimg::min(x0,nx0); x1 = cimg::max(x1,nx1); }
      }
      if (x0 <= x1) bb(0,0) = x0, bb(0,1) = x1;
    } break;
    case 'y' : {
      int y0 = height(), y1 = -1;
      cimg_forC(*this,c) {
        const CImg<intT> coords = get_shared_channel(c)._autocrop(color[c],'y');
        const int ny0 = coords[0], ny1 = coords[1];
        if (ny0>=0 && ny1>=0) { y0 = cimg::min(y0,ny0); y1 = cimg::max(y1,ny1); }
      }
      if (y0 <= y1) bb(1,0) = y0, bb(1,1) = y1;
    } break;
    default : {
      int z0 = depth(), z1 = -1;
      cimg_forC(*this,c) {
        const CImg<intT> coords = get_shared_channel(c)._autocrop(color[c],'z');
        const int nz0 = coords[0], nz1 = coords[1];
        if (nz0>=0 && nz1>=0) { z0 = cimg::min(z0,nz0); z1 = cimg::max(z1,nz1); }
      }
      if (z0 <= z1) bb(2,0) = z0, bb(2,1) = z1;
    }
    }
  }
  return bb;
}
