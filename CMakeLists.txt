cmake_minimum_required(VERSION 3.18)
project(soem_node LANGUAGES C CXX)

set(CMAKE_C_STANDARD 99)
set(CMAKE_CXX_STANDARD 17)

# Node-API include dirs
execute_process(COMMAND node -p "require('node-addon-api').include" OUTPUT_VARIABLE NAPI_DIR)
string(REGEX REPLACE "\n$" "" NAPI_DIR "${NAPI_DIR}")

# SOEM en sous-module
add_subdirectory(external/soem EXCLUDE_FROM_ALL)

# Addon
add_library(soem_addon MODULE src/addon.cc)

# Définitions pour Linux/raw socket
if(UNIX AND NOT APPLE)
  target_link_libraries(soem_addon PRIVATE soem rt pthread)
else()
  target_link_libraries(soem_addon PRIVATE soem)
endif()

# Include paths
target_include_directories(soem_addon PRIVATE ${NAPI_DIR} external/soem/soem)

# Nom du module .node
set_target_properties(soem_addon PROPERTIES
  PREFIX ""
  OUTPUT_NAME "soem_addon"
)