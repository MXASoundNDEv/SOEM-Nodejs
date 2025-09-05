cmake_minimum_required(VERSION 3.18)
project(soem_node LANGUAGES C CXX)

set(CMAKE_C_STANDARD 99)
set(CMAKE_CXX_STANDARD 17)

# Node-API include dirs
# Get include path from node-addon-api; the returned string can be prefixed with '-I'.
execute_process(COMMAND node -p "require('node-addon-api').include" OUTPUT_VARIABLE NAPI_DIR_RAW OUTPUT_STRIP_TRAILING_WHITESPACE)
string(REGEX REPLACE "^-I" "" NAPI_DIR "${NAPI_DIR_RAW}")
string(REPLACE "\"" "" NAPI_DIR "${NAPI_DIR}")
if(NOT EXISTS "${NAPI_DIR}")
  message(WARNING "node-addon-api include path '${NAPI_DIR}' not found, falling back to node_modules path")
  set(NAPI_DIR "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api/include")
endif()

# fallback pour cmake-js include variable (CMAKE_JS_INC fourni par cmake-js)
if(NOT DEFINED CMAKE_JS_INC OR NOT EXISTS "${CMAKE_JS_INC}")
  message(STATUS "CMAKE_JS_INC not defined or not found, attempting common fallback")
  set(CMAKE_JS_INC "${CMAKE_JS_INC}" CACHE PATH "cmake-js include dir fallback")
endif()

# build settings utiles pour modules natifs
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# SOEM: use local copy if present, otherwise fetch from upstream GitHub so CI works without a submodule
if(EXISTS "${CMAKE_SOURCE_DIR}/external/soem/CMakeLists.txt")
  add_subdirectory(external/soem EXCLUDE_FROM_ALL)
else()
  include(FetchContent)
  FetchContent_Declare(
    soem
    GIT_REPOSITORY https://github.com/OpenEtherCATsociety/SOEM.git
    GIT_TAG master
  )
  # This will download and add the SOEM project to the build, creating the same targets
  FetchContent_MakeAvailable(soem)
endif()

# Addon
add_library(soem_addon MODULE src/addon.cc)

# Définitions pour Linux/raw socket
if(UNIX AND NOT APPLE)
  if(DEFINED CMAKE_JS_LIB)
    target_link_libraries(soem_addon PRIVATE soem rt pthread ${CMAKE_JS_LIB})
  else()
    target_link_libraries(soem_addon PRIVATE soem rt pthread)
  endif()
else()
  if(DEFINED CMAKE_JS_LIB)
    target_link_libraries(soem_addon PRIVATE soem ${CMAKE_JS_LIB})
  else()
    target_link_libraries(soem_addon PRIVATE soem)
  endif()
endif()

# Include paths (robustes)
target_include_directories(soem_addon PRIVATE ${CMAKE_JS_INC} ${NAPI_DIR} ${CMAKE_SOURCE_DIR}/external/soem/include)

# Nom du module .node
set_target_properties(soem_addon PROPERTIES
  PREFIX ""
  OUTPUT_NAME "soem_addon"
)