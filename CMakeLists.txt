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
# configure config.h
configure_file (src/config.h.in ${PROJECT_BINARY_DIR}/src/config.h @ONLY)
include_directories (${PROJECT_BINARY_DIR}/src)

# -----------------------------------------------------------------------------
# tools
add_tool (crop-frames)

# -----------------------------------------------------------------------------
# Mac OS X workflows
if (APPLE)
  option (INSTALL_WORKFLOWS "Enable installation of Mac OS X Workflows" OFF)
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
if (APPLE)
  cpack_add_install_type (Workflows)
endif ()

cpack_add_component(
  tools
    DISPLAY_NAME "Basic Tools"
    DESCRIPTION  "Basic tools that are executed from a terminal."
    REQUIRED
    INSTALL_TYPES Full Tools
)

cpack_add_component(
  workflows
    DISPLAY_NAME  "Automator Workflows"
    DESCRIPTION   "Automator workflows such as folder actions which ease the use of the basic tools."
    DEPENDS       tools
    INSTALL_TYPES Full Workflows
)
