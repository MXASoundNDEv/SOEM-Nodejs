Glossary
Asynchronous Data
Data transmission that occurs independently of regular cycle timing, often used for configuration and management tasks within EtherCAT networks.

CoE
CANopen over EtherCAT. A protocol that allows for device management and configuration using the CANopen object directory model within an EtherCAT framework.

Configuration Management
The process of adjusting and setting device parameters within an EtherCAT network, often facilitated by asynchronous data exchanges.

Cyclic Data
Data transmitted at regular, timed intervals, primarily used for real-time control and monitoring in applications.

Datagram
An encapsulated unit of data carried within EtherCAT frames, representing a segment of information transmitted between devices.

DC
Distributed Clocks. A synchronization feature in EtherCAT that allows devices to achieve precise timing coordination, essential for applications requiring synchronized operation.

Diagnostics
The procedure of monitoring and analyzing the performance and status of devices within an EtherCAT network for troubleshooting and maintenance.

EoE
Ethernet over EtherCAT. A protocol that allows standard Ethernet packets to be transmitted within the EtherCAT frame, facilitating IP-based communication alongside EtherCAT.

EtherCAT
Ethernet for Control Automation Technology. A real-time Ethernet network protocol primarily used in industrial automation.

FMMU
Fieldbus Memory Management Unit. A component in EtherCAT responsible for mapping data between the EtherCAT protocol and the memory of slave devices, facilitating flexible data exchanges.

FoE
File Access over EtherCAT. A service within EtherCAT that enables the transfer and management of files between devices over the network.

Frame
A fundamental data packet in EtherCAT communication that can contain one or more datagrams and consists of a header and a data payload.

Low Latency
The minimal delay in data transmission, essential for achieving fast response times in real-time applications.

PDO
Process Data Object. A data structure used in EtherCAT for real-time communication, allowing the exchange of critical process data between devices.

Real-Time Performance
The capability of a communication system to provide timely and deterministic responses, crucial for applications requiring precise control.

SDO
Service Data Object. A mechanism in CANopen-over-EtherCAT for transferring configuration parameters and non-periodic data between devices.

SM
Sync Manager. A component that manages the timing and coordination of data transmission in EtherCAT, ensuring synchronization of cyclic and asynchronous data.

SoE
Servo over EtherCAT. A protocol specifically designed for motion control applications, enabling real-time data exchange for servo drives and enhancing control precision.

Synchronization
The coordination of data transmission timings within the EtherCAT framework, ensuring that devices operate in unison, especially in real-time applications.

Topology
The layout and arrangement of devices in an EtherCAT network, which can be line, star, or tree structured.

WKC
Working counter. Indicates the number of datagrams successfully processed by the slaves during a communication cycle. This counter helps the master device verify that all expected responses have been received.

XoE
eXtension over EtherCAT. A term encompassing various protocols like CoE, FoE, EoE, and SoE that facilitate various data transmissions within an EtherCAT network.