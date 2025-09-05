cmake_minimum_required(VERSION 3.18)
project(soem_node LANGUAGES C CXX)

# Allow position independent code
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Prefer explicit node-addon-api include from node_modules (installed by npm)
set(NODE_ADDON_API_INCLUDE "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api/include")
set(NODE_ADDON_API_PKGROOT "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")

# SOEM submodule
add_subdirectory(external/soem EXCLUDE_FROM_ALL)

# Add addon source
option(BUILD_LEGACY_BINDING "Build legacy node-soem binding (node_soem_legacy.cc)" OFF)
if(BUILD_LEGACY_BINDING)
  add_library(soem_addon MODULE src/addon.cc src/node_soem_legacy.cc)
else()
  add_library(soem_addon MODULE src/addon.cc)
endif()

include_directories(${CMAKE_JS_INC} ${NODE_ADDON_API_INCLUDE} ${NODE_ADDON_API_PKGROOT} include)

# Ensure the SOEM headers are available to the addon target. The SOEM sources
# put public headers under external/soem/include (e.g. include/soem/soem.h).
target_include_directories(soem_addon PRIVATE 
  ${CMAKE_SOURCE_DIR}/external/soem/include
  ${CMAKE_SOURCE_DIR}/include
)
add_compile_definitions(NAPI_VERSION=8)

if(UNIX AND NOT APPLE)
  target_link_libraries(soem_addon PRIVATE soem ${CMAKE_JS_LIB} rt pthread)
else()
  target_link_libraries(soem_addon PRIVATE soem ${CMAKE_JS_LIB})
endif()

set_target_properties(soem_addon PROPERTIES 
  PREFIX "" 
  OUTPUT_NAME "soem_addon" 
  SUFFIX ".node"
  POSITION_INDEPENDENT_CODE ON)
