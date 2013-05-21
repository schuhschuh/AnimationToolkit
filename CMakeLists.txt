###############################################################################
# Animation Toolkit
#
# Copyright (C) 2013, Andreas Schuh.
#
# Distributed under the GNU GPL; see accompanying file COPYING.txt for details.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY, to the extent permitted by law; without even the
# implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
###############################################################################

cmake_minimum_required (VERSION 2.8)

# -----------------------------------------------------------------------------
# CMake modules
set (CMAKE_MODULE_PATH "${CMAKE_CURRENT_SOURCE_DIR}/config")

include (Macros)

# -----------------------------------------------------------------------------
# project attributes
set (PROJECT_NAME    AnimationToolkit)
set (PROJECT_VERSION 0.1)

split_version (
  PROJECT_VERSION
    PROJECT_VERSION_MAJOR
    PROJECT_VERSION_MINOR
    PROJECT_VERSION_PATCH
)

project (${PROJECT_NAME})

# -----------------------------------------------------------------------------
# settings
set (CMAKE_RUNTIME_OUTPUT_DIRECTORY bin)
set (CMAKE_LIBRARY_OUTPUT_DIRECTORY lib)
set (CMAKE_ARCHIVE_OUTPUT_DIRECTORY lib)

if (NOT CMAKE_BUILD_TYPE)
  set (
    CMAKE_BUILD_TYPE Release CACHE STRING
      "Choose the type of build, options are: Debug Release RelWithDebInfo MinSizeRel."
    FORCE
  )
endif ()
mark_as_advanced (CMAKE_BUILD_TYPE)

if (APPLE)
  if (DEFINED CMAKE_OSX_ARCHITECTURES)
    mark_as_advanced (CMAKE_OSX_ARCHITECTURES)
  endif ()
  if (DEFINED CMAKE_OSX_DEPLOYMENT_TARGET)
    mark_as_advanced (CMAKE_OSX_DEPLOYMENT_TARGET)
  endif ()
  if (DEFINED CMAKE_OSX_SYSROOT)
    mark_as_advanced (CMAKE_OSX_SYSROOT)
  endif ()
endif ()

set_default_install_prefix ()
set (RUNTIME_INSTALL_DIR bin)
get_filename_component (RUNTIME_INSTALL_ABSDIR "${CMAKE_INSTALL_PREFIX}/${RUNTIME_INSTALL_DIR}" ABSOLUTE)

# -----------------------------------------------------------------------------
# dependencies
if (APPLE)
  set (CMAKE_FIND_LIBRARY_SUFFIXES ".a;.dylib;.so")
else (WIN32)
  set (CMAKE_FIND_LIBRARY_SUFFIXES ".a;.lib")
else ()
  set (CMAKE_FIND_LIBRARY_SUFFIXES ".a;.so")
endif ()

option (USE_PNG    "Enable support for PNG images."          ON)
option (USE_JPEG   "Enable support for JPEG images."         ON)
option (USE_TIFF   "Enable support for TIFF images."         ON)
option (USE_FFMPEG "Enable support for movies using FFmpeg." OFF)

find_package (ZLIB)
find_package (BZip2)

if (USE_PNG)
  find_package (PNG REQUIRED)
endif ()
if (USE_JPEG)
  find_package (JPEG REQUIRED)
endif ()
if (USE_TIFF)
  find_package (TIFF    REQUIRED)
  find_package (LibLZMA REQUIRED)
endif ()
if (USE_FFMPEG)
  find_package (FFMPEG COMPONENTS avcodec avdevice avfilter avformat swscale swresample)
endif ()

set (CIMG_LIBRARIES)
if (PNG_FOUND)
  include_directories (${PNG_INCLUDE_DIRS})
  list (APPEND CIMG_LIBRARIES ${PNG_LIBRARIES})
  add_definitions (-Dcimg_use_png)
endif ()
if (JPEG_FOUND)
  include_directories (${JPEG_INCLUDE_DIR})
  list (APPEND CIMG_LIBRARIES ${JPEG_LIBRARIES})
  add_definitions (-Dcimg_use_jpeg)
endif ()
if (TIFF_FOUND AND LIBLZMA_FOUND)
  include_directories (${TIFF_INCLUDE_DIR} ${LIBLZMA_INCLUDE_DIRS})
  list (APPEND CIMG_LIBRARIES ${TIFF_LIBRARIES} ${LIBLZMA_LIBRARIES})
  add_definitions (-Dcimg_use_tiff)
endif ()
if (BZIP2_FOUND)
  include_directories (${BZIP2_INCLUDE_DIR})
  list (APPEND CIMG_LIBRARIES ${BZIP2_LIBRARIES})
endif ()
if (ZLIB_FOUND)
  include_directories (${ZLIB_INCLUDE_DIRS})
  list (APPEND CIMG_LIBRARIES ${ZLIB_LIBRARIES})
endif ()
if (FFMPEG_FOUND)
  include_directories (${FFMPEG_INCLUDE_DIRS})
  list (APPEND CIMG_LIBRARIES ${FFMPEG_LIBRARIES})
  add_definitions (-Dcimg_use_ffmpeg)
endif ()

include_directories (BEFORE ${PROJECT_SOURCE_DIR}/src)

# -----------------------------------------------------------------------------
# configure config.h
configure_file (src/config.h.in ${PROJECT_BINARY_DIR}/src/config.h @ONLY)
include_directories (${PROJECT_BINARY_DIR}/src)

# -----------------------------------------------------------------------------
# tools
add_tool (crop-frames)

# ----------------------------------------------------------------------------
# packaging
set (CPACK_PACKAGE_NAME                "${PROJECT_NAME}")
set (CPACK_PACKAGE_VENDOR              "Andreas Schuh")
set (CPACK_PACKAGE_VERSION             "${PROJECT_VERSION}")
set (CPACK_PACKAGE_VERSION_MAJOR       "${PROJECT_VERSION_MAJOR}")
set (CPACK_PACKAGE_VERSION_MINOR       "${PROJECT_VERSION_MINOR}")
set (CPACK_PACKAGE_VERSION_PATCH       "${PROJECT_VERSION_PATCH}")
set (CPACK_PACKAGE_DESCRIPTION_SUMMARY "The Animation Toolkit - Simple tools for Animators")
set (CPACK_PACKAGE_DESCRIPTION_FILE    "${PROJECT_SOURCE_DIR}/config/Description.md")
set (CPACK_RESOURCE_FILE_README        "${PROJECT_SOURCE_DIR}/config/Description.html")
set (CPACK_RESOURCE_FILE_LICENSE       "${PROJECT_SOURCE_DIR}/COPYING.txt")

get_default_install_prefix (CPACK_PACKAGING_INSTALL_PREFIX)

include (CPack)

cpack_add_install_type (Full)
cpack_add_install_type (Tools)

cpack_add_component(
  tools
    DISPLAY_NAME "Basic Tools"
    DESCRIPTION  "Basic tools that are executed from a terminal."
    REQUIRED
    INSTALL_TYPES Full Tools
)
