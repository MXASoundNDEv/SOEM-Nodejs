cmake_minimum_required(VERSION 3.18)
project(soem_node LANGUAGES C CXX)

# Allow position independent code
set(CMAKE_POSITION_INDEPENDENT_CODE ON)

# Retrieve node-addon-api include flags
execute_process(COMMAND node -p "require('node-addon-api').include" OUTPUT_VARIABLE NODE_ADDON_API_DIR)
string(REPLACE "\n" "" NODE_ADDON_API_DIR "${NODE_ADDON_API_DIR}")
separate_arguments(NODE_ADDON_API_DIR)

# SOEM submodule
add_subdirectory(external/soem EXCLUDE_FROM_ALL)

# Add addon source
add_library(soem_addon MODULE src/addon.cc)

include_directories(${CMAKE_JS_INC} external/soem/soem)
add_definitions(${NODE_ADDON_API_DIR})
add_compile_definitions(NAPI_VERSION=8)

if(UNIX AND NOT APPLE)
  target_link_libraries(soem_addon PRIVATE soem ${CMAKE_JS_LIB} rt pthread)
else()
  target_link_libraries(soem_addon PRIVATE soem ${CMAKE_JS_LIB})
endif()

set_target_properties(soem_addon PROPERTIES PREFIX "" OUTPUT_NAME "soem_addon" POSITION_INDEPENDENT_CODE ON)
