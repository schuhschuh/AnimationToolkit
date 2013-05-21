###############################################################################
# Animation Toolkit - CMake macros and functions
#
# Copyright (C) 2013, Andreas Schuh.
#
# Distributed under the GNU GPL; see accompanying file COPYING.txt for details.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY, to the extent permitted by law; without even the
# implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
###############################################################################

# ----------------------------------------------------------------------------
# split version string into parts
function (split_version VERSION MAJOR MINOR PATCH)
  if (VERSION MATCHES "([0-9]+)(\\.[0-9]+)?(\\.[0-9]+)?(rc[1-9][0-9]*|[a-z]+)?")
    if (CMAKE_MATCH_1)
      set (VERSION_MAJOR ${CMAKE_MATCH_1})
    else ()
      set (VERSION_MAJOR 0)
    endif ()
    if (CMAKE_MATCH_2)
      set (VERSION_MINOR ${CMAKE_MATCH_2})
      string (REGEX REPLACE "^\\." "" VERSION_MINOR "${VERSION_MINOR}")
    else ()
      set (VERSION_MINOR 0)
    endif ()
    if (CMAKE_MATCH_3)
      set (VERSION_PATCH ${CMAKE_MATCH_3})
      string (REGEX REPLACE "^\\." "" VERSION_PATCH "${VERSION_PATCH}")
    else ()
      set (VERSION_PATCH 0)
    endif ()
  else ()
    set (VERSION_MAJOR 0)
    set (VERSION_MINOR 0)
    set (VERSION_PATCH 0)
  endif ()
  set ("${MAJOR}" "${VERSION_MAJOR}" PARENT_SCOPE)
  set ("${MINOR}" "${VERSION_MINOR}" PARENT_SCOPE)
  set ("${PATCH}" "${VERSION_PATCH}" PARENT_SCOPE)
endfunction ()

# ----------------------------------------------------------------------------
# get default installation prefix
#
# Note: Do not use version in path as long as Mac OS X workflows cannot be configured.
function (get_default_install_prefix DEFAULT_PREFIX)
  if (WIN32)
    get_filename_component (
      PREFIX
      "[HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion;ProgramFilesDir]"
      ABSOLUTE
    )
    if (NOT PREFIX OR PREFIX MATCHES "/registry")
      set (PREFIX "C:/Program Files")
    endif ()
    set (PREFIX "${PREFIX}/${PROJECT_NAME}")
  else ()
    string (TOLOWER "${PROJECT_NAME}" PROJECT_NAME_LOWER)
    set (PREFIX "/opt/${PROJECT_NAME_LOWER}")
  endif ()
  set (${DEFAULT_PREFIX} "${PREFIX}" PARENT_SCOPE)
endfunction ()

# ----------------------------------------------------------------------------
# set default installation prefix
function (set_default_install_prefix)
  get_default_install_prefix (PREFIX)
  if (CMAKE_INSTALL_PREFIX_INITIALIZED_TO_DEFAULT OR NOT CMAKE_INSTALL_PREFIX)
    set (CMAKE_INSTALL_PREFIX "${PREFIX}" CACHE PATH "Installation prefix." FORCE)
  endif ()
endfunction ()

# ----------------------------------------------------------------------------
# concatenates all list elements into a single string
macro (list_to_string STR)
  set (${STR})
  foreach (ELEM IN LISTS ARGN)
    set (${STR} "${STR}${ELEM}")
  endforeach ()
endmacro ()

# -----------------------------------------------------------------------------
# add command-line tool
macro (add_tool tgt)
 add_executable (${tgt} src/${tgt}.cc ${ARGN})
 if (PNG_FOUND)
   target_link_libraries (${tgt} ${PNG_LIBRARIES})
 endif ()
 if (JPEG_FOUND)
   target_link_libraries (${tgt} ${JPEG_LIBRARIES})
 endif ()
 if (TIFF_FOUND)
   target_link_libraries (${tgt} ${TIFF_LIBRARIES})
 endif ()
 install (TARGETS ${tgt} RUNTIME DESTINATION ${RUNTIME_INSTALL_DIR} COMPONENT tools)
endmacro ()

# -----------------------------------------------------------------------------
# configure Mac OS X workflow
#
# Attention: Modifying the documents.wflow file manually seems to corrupt it.
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

# -----------------------------------------------------------------------------
# install Mac OS X workflow
macro (install_workflow src)
  install (
    DIRECTORY   "${src}.workflow"
    DESTINATION "$ENV{HOME}/Library/Workflows/Applications/Folder Actions"
    COMPONENT   workflows
  )
endmacro ()
