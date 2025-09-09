# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-12-27

### Added
- Initial release of SOEM Node.js bindings
- Support for EtherCAT master functionality
- Cross-platform network interface discovery (Windows/Linux)
- TypeScript support with comprehensive type definitions
- Native C++ addon with Node-API 8 compatibility
- Comprehensive utility library for interface management
- Production-ready test suite with Jest
- ESLint configuration for code quality
- GitHub Actions CI/CD pipeline
- Multi-platform build support
- Security scanning with npm audit
- Code coverage reporting
- Multi-platform build and test automation
- Automated release process

### Features
- **Core EtherCAT Operations:**
  - Master initialization and configuration
  - Slave discovery and configuration
  - Process data operations (send/receive)
  - SDO read/write operations
  - State management

- **Network Interface Management:**
  - Automatic interface discovery
  - Cross-platform compatibility (WinPcap/Npcap on Windows, libpcap on Linux)
  - Best interface selection algorithms
  - Interface testing and validation

### Fixed
- Windows .node file generation (was generating .dll)
- Cross-platform interface naming consistency
- Native addon mock system for testing
- TypeScript configuration compatibility
- Enhanced documentation with usage examples
- Updated TypeScript definitions

### Fixed
- Build process optimizations
- Cross-platform compatibility improvements

## [0.1.0] - 2025-09-05

### Added
- Initial release of SOEM-Nodejs
- Core EtherCAT master functionality
- Network interface discovery and management
- Cross-platform support (Windows, Linux)
- TypeScript support with full type definitions
- Comprehensive examples and utilities
- Automatic interface detection and selection
- SDO read/write operations
- Process data communication
- State management and monitoring

### Features
- `SoemMaster.listInterfaces()` - List all available network interfaces
- `EtherCATUtils` - Utility class for interface management
- Automatic interface prioritization (physical Ethernet over virtual)
- Robust error handling and graceful fallbacks
- Multi-platform interface naming support
- Comprehensive examples:
  - `list-interfaces.js` - Display available interfaces
  - `auto-scan.js` - Automatic interface detection and scanning
  - `interface-manager.js` - Complete interface management tool
  - `ethercat-utils.js` - Reusable utility functions

### Technical Details
- Built with Node-API 8 for stability across Node.js versions
- CMake-based build system with cmake-js
- SOEM library integration as git submodule
- Support for Node.js 18+ on x64 and arm64 architectures
- Cross-platform network adapter detection
- Memory-safe native addon implementation

### Dependencies
- Node.js >=18
- node-addon-api ^8.0.0
- Platform-specific network libraries (WinPcap/Npcap on Windows, libpcap on Unix)

### Supported Platforms
- Windows (x64, arm64) with WinPcap/Npcap
- Linux (x64, arm64) with libpcap

[Unreleased]: https://github.com/MXASoundNDEv/SOEM-Nodejs/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MXASoundNDEv/SOEM-Nodejs/releases/tag/v0.1.0

## [Unreleased]

### Added
 - Optionnel `ca` (Complete Access) parameter for `sdoRead` and `sdoWrite` to support Complete Access SDO transfers when required by a slave.
 - Nouveaux wrappers / méthodes exposés côté JS :
   - `writeState(slave, state)` — écrire un état demandé sur un esclave.
   - `stateCheck(slave, reqstate, timeout?)` — attendre qu'un esclave atteigne un état.
   - `reconfigSlave(slave, timeout?)` — reconfigurer un esclave.
   - `recoverSlave(slave, timeout?)` — tenter la récupération d'un esclave en erreur.
   - `slaveMbxCyclic(slave)` — activer la mailbox cyclique.
   - `configDC()` — configurer Distributed Clocks.
   - `getSlaves()` — lister les esclaves et métadonnées.
   - `initRedundant(if1, if2)` — initialiser un master redondant.
   - `configMapGroup(group?)`, `sendProcessdataGroup(group?)`, `receiveProcessdataGroup(group?, timeout?)` — API pour groupes processdata.
   - `mbxHandler(group?, limit?)` — gestionnaire mailbox.
   - `elist2string()` — obtenir une représentation textuelle des erreurs SOEM.
   - `SoEread` / `SoEwrite` — SoE services pour drives compatibles.
   - `readeeprom` / `writeeeprom` — accès EEPROM bas-niveau.
   - `APRD` / `APWR` / `LRW` / `LRD` / `LWR` — primitives bas-niveau d'accès au port.
   - `dcsync0` / `dcsync01` — helpers de configuration DC (single/dual cycle).

### Fixed
- Corrected native wrapper calls for port-centred primitives to pass `&ctx_.port` instead of the whole context, resolving a compile-time type mismatch on Windows/MSVC builds.
 - Continuous Integration now runs integration tests in stub mode (RUN_INTEGRATION_STUB) to validate JS/native API without hardware.
