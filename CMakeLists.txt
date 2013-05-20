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

cmake_minimum_required (VERSION 2.6)

# -----------------------------------------------------------------------------
# project attributes
set (PROJECT_NAME    AnimationToolkit)
set (PROJECT_VERSION 1.2)

project (${PROJECT_NAME})

# -----------------------------------------------------------------------------
# build settings
if (PROJECT_BINARY_DIR MATCHES "^${PROJECT_SOURCE_DIR}$")
  set (CMAKE_RUNTIME_OUTPUT_DIRECTORY bin)
  set (CMAKE_LIBRARY_OUTPUT_DIRECTORY lib)
  set (CMAKE_ARCHIVE_OUTPUT_DIRECTORY lib)
endif ()
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

# ----------------------------------------------------------------------------
# default installation prefix
if (CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT OR NOT CMAKE_INSTALL_PREFIX)
  if (WIN32)
    get_filename_component (
      PREFIX
      "[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion;ProgramFilesDir]"
      ABSOLUTE
    )
    if (NOT PREFIX OR PREFIX MATCHES "/registry")
      set (PREFIX "C:/Program Files")
    endif ()
  elseif (APPLE)
    set (PREFIX "/Applications")
  else ()
    set (PREFIX "/opt")
  endif ()
  set (
    CMAKE_INSTALL_PREFIX "${PREFIX}/${PROJECT_NAME}"
    CACHE PATH "Installation prefix." FORCE
  )
endif ()

# -----------------------------------------------------------------------------
# dependencies
find_package (PNG)
find_package (JPEG)
find_package (TIFF)

if (PNG_FOUND)
  include_directories (${PNG_INCLUDE_DIRS})
  add_definitions (-Dcimg_use_png)
endif ()
if (JPEG_FOUND)
  include_directories (${JPEG_INCLUDE_DIR})
  add_definitions (-Dcimg_use_jpeg)
endif ()
if (TIFF_FOUND)
  include_directories (${TIFF_INCLUDE_DIR})
  add_definitions (-Dcimg_use_tiff)
endif ()

include_directories (BEFORE ${PROJECT_SOURCE_DIR}/src)

# -----------------------------------------------------------------------------
# macros
macro (add_executable tgt)
 _add_executable (${tgt} ${tgt}.cc ${ARGN})
 if (PNG_FOUND)
   target_link_libraries (${tgt} ${PNG_LIBRARIES})
 endif ()
 if (JPEG_FOUND)
   target_link_libraries (${tgt} ${JPEG_LIBRARIES})
 endif ()
 if (TIFF_FOUND)
   target_link_libraries (${tgt} ${TIFF_LIBRARIES})
 endif ()
 if (CMAKE_INSTALL_PREFIX MATCHES "${PROJECT_NAME}")
   install (TARGETS ${tgt} RUNTIME DESTINATION .)
 else ()
   install (TARGETS ${tgt} RUNTIME DESTINATION bin)
 endif ()
endmacro ()

# -----------------------------------------------------------------------------
# tools
add_executable (crop-frames)
