cmake_minimum_required(VERSION 3.18)
project(soem_node LANGUAGES C CXX)

set(CMAKE_C_STANDARD 99)
set(CMAKE_CXX_STANDARD 17)

# Node-API include dirs
# Get include path from node-addon-api; the returned string can be prefixed with '-I'.
execute_process(COMMAND node -p "require('node-addon-api').include" OUTPUT_VARIABLE NAPI_DIR)
string(REGEX REPLACE "\n$" "" NAPI_DIR "${NAPI_DIR}")
# Remove a leading -I if present (cmake-js/node may return '-I<path>').
string(REGEX REPLACE "^-I" "" NAPI_DIR "${NAPI_DIR}")
# Remove surrounding double quotes if present
string(REPLACE "\"" "" NAPI_DIR "${NAPI_DIR}")
# Fallback to node_modules path if the command above didn't return a usable path.
if(NOT EXISTS "${NAPI_DIR}")
  set(NAPI_DIR "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api/include")
endif()

# SOEM en sous-module
add_subdirectory(external/soem EXCLUDE_FROM_ALL)

# Addon
add_library(soem_addon MODULE src/addon.cc)

# Définitions pour Linux/raw socket
if(UNIX AND NOT APPLE)
  # On Unix link with soem and system libs; node is usually dynamically available.
  if(DEFINED CMAKE_JS_LIB)
    target_link_libraries(soem_addon PRIVATE soem rt pthread ${CMAKE_JS_LIB})
  else()
    target_link_libraries(soem_addon PRIVATE soem rt pthread)
  endif()
else()
  # On Windows we must link with the node library provided by cmake-js (node.lib)
  if(DEFINED CMAKE_JS_LIB)
    target_link_libraries(soem_addon PRIVATE soem ${CMAKE_JS_LIB})
  else()
    target_link_libraries(soem_addon PRIVATE soem)
  endif()
endif()

# Include paths
# Include node headers provided by cmake-js and node-addon-api include dir.
target_include_directories(soem_addon PRIVATE ${CMAKE_JS_INC} ${NAPI_DIR} ${CMAKE_SOURCE_DIR}/external/soem/include)

# Nom du module .node
set_target_properties(soem_addon PROPERTIES
  PREFIX ""
  OUTPUT_NAME "soem_addon"
)