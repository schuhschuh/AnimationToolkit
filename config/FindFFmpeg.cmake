# - Try to find FFmpeg
# Once done this will define
#
#  FFMPEG_FOUND - system has FFmpeg
#  FFMPEG_INCLUDE_DIRS - the FFmpeg include directory
#  FFMPEG_LIBRARIES - Link these to use FFmpeg
#
#  Copyright (c) 2008 Andreas Schneider <mail@cynapses.org>
#  Modified for other libraries by Lasse Kärkkäinen <tronic>
#  Modified by Andreas Schuh to consider find_package COMPONENTS <andreas.schuh.84@gmail.com>
#
#  Redistribution and use is allowed according to the terms of the New
#  BSD license.
#  For details see the accompanying COPYING-CMAKE-SCRIPTS file.
#

if (NOT FFMPEG_FIND_COMPONENTS AND NOT FFMPEG_FIND_OPTIONAL_COMPONENTS)
  set(FFMPEG_FIND_COMPONENTS avcodec avformat swscale)
endif ()

if (FFMPEG_LIBRARIES AND FFMPEG_INCLUDE_DIRS)
  # in cache already
  set(FFMPEG_FOUND TRUE)
else (FFMPEG_LIBRARIES AND FFMPEG_INCLUDE_DIRS)
  find_package(PkgConfig)

  set(FFMPEG_FOUND TRUE)
  set(FFMPEG_INCLUDE_DIRS)
  set(FFMPEG_LIBRARIES)

  foreach (lib IN LISTS FFMPEG_FIND_COMPONENTS FFMPEG_FIND_OPTIONAL_COMPONENTS)
    string(TOUPPER "${lib}" LIB)
    # use pkg-config to get the directories and then use these values
    # in the FIND_PATH() and FIND_LIBRARY() calls
    if (PKG_CONFIG_FOUND)
      pkg_check_modules(_FFMPEG_${LIB} lib${lib})
    endif ()
    # find include directory
    find_path(FFMPEG_${LIB}_INCLUDE_DIR
      NAMES ${lib}.h
      PATHS ${_FFMPEG_${LIB}_INCLUDE_DIRS} /usr/include /usr/local/include /opt/local/include /sw/include
      PATH_SUFFIXES ffmpeg lib${lib}
    )
    # find library
    find_library(FFMPEG_${LIB}_LIBRARY
      NAMES ${lib}
      PATHS ${_FFMPEG_${LIB}_LIBRARY_DIRS} /usr/lib /usr/local/lib /opt/local/lib /sw/lib
    )
    # mark variables as advanced if not required
    if (NOT FFMPEG_FIND_REQUIRED)
      mark_as_advanced(FFMPEG_${LIB}_INCLUDE_DIR FFMPEG_${LIB}_LIBRARY)
    endif ()
    # append to FFMPEG_INCLUDE_DIRS and FFMPEG_LIBRARIES
    if (FFMPEG_${LIB}_LIBRARY)
      list(APPEND FFMPEG_INCLUDE_DIRS ${FFMPEG_${LIB}_INCLUDE_DIR})
      list(APPEND FFMPEG_LIBRARIES    ${FFMPEG_${LIB}_LIBRARY})
    # set FFMPEG_FOUND to FALSE if required library not found
    else ()
      list(FIND FFMPEG_FIND_COMPONENTS IDX ${lib})
      if (NOT IDX EQUAL -1)
        set(FFMPEG_FOUND FALSE)
      endif ()
    endif ()
  endforeach ()

  if (FFMPEG_FOUND)
    if (NOT FFMPEG_FIND_QUIETLY)
      message(STATUS "Found FFMPEG: ${FFMPEG_LIBRARIES}")
    endif (NOT FFMPEG_FIND_QUIETLY)
  else (FFMPEG_FOUND)
    if (FFMPEG_FIND_REQUIRED)
      message(FATAL_ERROR "Could not find FFMPEG libavcodec, libavformat or libswscale")
    endif (FFMPEG_FIND_REQUIRED)
  endif (FFMPEG_FOUND)

endif (FFMPEG_LIBRARIES AND FFMPEG_INCLUDE_DIRS)

