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
set (PROJECT_VERSION 0.1)

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

if (CMAKE_INSTALL_PREFIX MATCHES "${PROJECT_NAME}")
  set (RUNTIME_INSTALL_DIR .)
else ()
  set (RUNTIME_INSTALL_DIR bin)
endif ()
get_filename_component (RUNTIME_INSTALL_ABSDIR "${CMAKE_INSTALL_PREFIX}/${RUNTIME_INSTALL_DIR}" ABSOLUTE)

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
 _add_executable (${tgt} src/${tgt}.cc ${ARGN})
 if (PNG_FOUND)
   target_link_libraries (${tgt} ${PNG_LIBRARIES})
 endif ()
 if (JPEG_FOUND)
   target_link_libraries (${tgt} ${JPEG_LIBRARIES})
 endif ()
 if (TIFF_FOUND)
   target_link_libraries (${tgt} ${TIFF_LIBRARIES})
 endif ()
 install (TARGETS ${tgt} RUNTIME DESTINATION ${RUNTIME_INSTALL_DIR})
endmacro ()

# Note: Modifying the documents.wflow file manually seems to corrupt it.
macro (configure_workflow src dest)
  file (MAKE_DIRECTORY "${dest}.workflow/Contents/QuickLook")
  configure_file (
    "${src}.workflow/Contents/document.wflow"
    "${dest}.workflow/Contents/documents.wflow"         @ONLY
  )
  configure_file (
    "${src}.workflow/Contents/Info.plist"
    "${dest}.workflow/Contents/Info.plist"              COPYONLY
  )
  configure_file (
    "${src}.workflow/Contents/QuickLook/Thumbnail.png"
    "${dest}.workflow/Contents/QuickLook/Thumbnail.png" COPYONLY
  )
endmacro ()

macro (install_workflow src)
  install (
    DIRECTORY   "${src}.workflow"
    DESTINATION "$ENV{HOME}/Library/Workflows/Applications/Folder Actions"
  )
endmacro ()

# -----------------------------------------------------------------------------
# configure config.h
configure_file (src/config.h.in ${PROJECT_BINARY_DIR}/src/config.h @ONLY)
include_directories (${PROJECT_BINARY_DIR}/src)

# -----------------------------------------------------------------------------
# tools
add_executable (crop-frames)

# -----------------------------------------------------------------------------
# Mac OS X workflows
if (APPLE)
  option (INSTALL_WORKFLOWS "Enable installation of Mac OS X Workflows" OFF)
  mark_as_advanced (INSTALL_WORKFLOWS)
  if (INSTALL_WORKFLOWS)
    set (FOLDER_ACTIONS
      "osx/Crop Animation Frames (Individually)"
      "osx/Crop Animation Frames (Fixed Size)"
    )
    foreach (workflow IN LISTS FOLDER_ACTIONS)
      install_workflow ("${workflow}")
    endforeach ()
  endif ()
endif ()
