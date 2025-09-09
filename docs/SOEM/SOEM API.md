voilà une mise en forme Markdown propre, **sans rien supprimer** du contenu fourni. Tu peux le coller tel quel dans un `.md`.

---

# SOEM API

The SOEM API is defined in `soem/soem.h`.

## Initialization and configuration

### `int ecx_init(ecx_contextt *context, const char *ifname)`

Initialise lib in single NIC mode

**Parameters :**

* context – \[in] context struct
* ifname – \[in] Dev name, f.e. “eth0”

**Returns :**

> > 0 if OK

---

### `int ecx_init_redundant(ecx_contextt *context, ecx_redportt *redport, const char *ifname, char *if2name)`

Initialise lib in redundant NIC mode

**Parameters :**

* context – \[in] context struct
* redport – \[in] pointer to redport, redundant port data
* ifname – \[in] Primary Dev name, f.e. “eth0”
* if2name – \[in] Secondary Dev name, f.e. “eth1”

**Returns :**

> > 0 if OK

---

### `int ecx_config_init(ecx_contextt *context)`

Enumerate and init all slaves.

**Parameters :**

* context – \[in] context struct

**Returns :**
Workcounter of slave discover datagram = number of slaves found

---

### `int ecx_config_map_group(ecx_contextt *context, void *pIOmap, uint8 group)`

Map all PDOs in one group of slaves to IOmap

In packed mode, processdata for a slave may not start at a byte boundary.

In non-overlapped mode, inputs follow outputs in sequential order.

In overlapped mode, inputs will replace outputs in the incoming frame. Use this mode for TI ESC when using LRW. Packed mode is not possible when overlapped mode is enabled.

**Parameters :**

* context – \[in] context struct
* pIOmap – \[out] pointer to IOmap
* group – \[in] group to map, 0 = all groups

**Returns :**
IOmap size

---

### `int ecx_writestate(ecx_contextt *context, uint16 slave)`

Write slave state, if slave = 0 then write to all slaves. The function does not check if the actual state is changed.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number, 0 master

**Returns :**
Workcounter or EC\_NOFRAME

---

### `uint16 ecx_statecheck(ecx_contextt *context, uint16 slave, uint16 reqstate, int timeout)`

Check actual slave state. This is a blocking function. To refresh the state of all slaves ecx\_readstate() should be called

> **Warning**
> If this is used for slave 0 (=all slaves), the state of all slaves is read by an bitwise OR operation. The returned value is also the bitwise OR state of all slaves. This has some implications for the BOOT state. The Boot state representation collides with INIT | PRE\_OP so this function cannot be used for slave = 0 and reqstate = EC\_STATE\_BOOT and also, if the returned state is BOOT, some slaves might actually be in INIT and PRE\_OP and not in BOOT.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number, 0 all slaves (only the “slavelist\[0].state” is refreshed)
* reqstate – \[in] Requested state
* timeout – \[in] Timeout value in us

**Returns :**
Requested state, or found state after timeout.

---

### `int ecx_slavembxcyclic(ecx_contextt *context, uint16 slave)`

Set a slave’s mailbox to be cyclic.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number

**Returns :**
1 if the mailbox was set to cyclic, 0 if it cannot be set.

---

### `int ecx_readstate(ecx_contextt *context)`

Read all slave states in slavelist.

> **Warning**
> The BOOT state is actually higher than INIT and PRE\_OP (see state representation)

**Parameters :**

* context – \[in] context struct

**Returns :**
lowest state found

---

### `int ecx_reconfig_slave(ecx_contextt *context, uint16 slave, int timeout)`

Reconfigure slave.

**Parameters :**

* context – \[in] context struct
* slave – \[in] slave to reconfigure
* timeout – \[in] local timeout f.e. EC\_TIMEOUTRET3

**Returns :**
Slave state

---

### `int ecx_recover_slave(ecx_contextt *context, uint16 slave, int timeout)`

Recover slave.

**Parameters :**

* context – \[in] context struct
* slave – \[in] slave to recover
* timeout – \[in] local timeout f.e. EC\_TIMEOUTRET3

**Returns :**

> > 0 if successful

---

### `char *ecx_elist2string(ecx_contextt *context)`

Look up error in ec\_errorlist and convert to text string.

**Parameters :**

* context – \[in] context struct

**Returns :**
readable string

---

### `struct ecx_context`

Context structure, referenced by all ecx functions

**Public Members**

* `ecx_portt port`
  port, may include red\_port
* `ec_slavet slavelist[EC_MAXSLAVE]`
  list of detected slaves
* `int slavecount`
  number of slaves found in configuration
* `ec_groupt grouplist[EC_MAXGROUP]`
  list of groups
* `boolean ecaterror`
  ecaterror state
* `int64 DCtime`
  last DC time from slaves
* `ec_enit *ENI`
  network information hook
* `int (*FOEhook)(uint16 slave, int packetnumber, int datasize)`
  registered FoE hook
* `int (*EOEhook)(ecx_contextt *context, uint16 slave, void *eoembx)`
  registered EoE hook
* `int manualstatechange`
  flag to control legacy automatic state change or manual state change
* `void *userdata`
  opaque pointer to application userdata, never used by SOEM.
* `boolean overlappedMode`
  In overlapped mode, inputs will replace outputs in the incoming frame. Use this mode for TI ESC\:s. Processdata is always aligned on a byte boundary.
* `boolean packedMode`
  Do not map each slave on a byte boundary. May result in smaller frame sizes. Has no effect in overlapped mode.

---

### `struct ec_slavet`

Slave state All slave information is put in this structure. Needed for most user interaction with slaves.

**Public Members**

* `uint16 state`
  state of slave
* `uint16 ALstatuscode`
  AL status code
* `uint16 configadr`
  Configured address
* `uint16 aliasadr`
  Alias address
* `uint32 eep_man`
  Manufacturer from EEprom
* `uint32 eep_id`
  ID from EEprom
* `uint32 eep_rev`
  revision from EEprom
* `uint32 eep_ser`
  serial number from EEprom
* `uint16 Itype`
  Interface type
* `uint16 Dtype`
  Device type
* `uint16 Obits`
  output bits
* `uint32 Obytes`
  output bytes, if Obits < 8 then Obytes = 0
* `uint8 *outputs`
  output pointer in IOmap buffer
* `uint32 Ooffset`
  output offset in IOmap buffer
* `uint8 Ostartbit`
  startbit in first output byte
* `uint16 Ibits`
  input bits
* `uint32 Ibytes`
  input bytes, if Ibits < 8 then Ibytes = 0
* `uint8 *inputs`
  input pointer in IOmap buffer
* `uint32 Ioffset`
  input offset in IOmap buffer
* `uint8 Istartbit`
  startbit in first input byte
* `ec_smt SM[EC_MAXSM]`
  SM structure
* `uint8 SMtype[EC_MAXSM]`
  SM type 0=unused 1=MbxWr 2=MbxRd 3=Outputs 4=Inputs
* `ec_fmmut FMMU[EC_MAXFMMU]`
  FMMU structure
* `uint8 FMMU0func`
  FMMU0 function 0=unused 1=outputs 2=inputs 3=SM status
* `uint8 FMMU1func`
  FMMU1 function
* `uint8 FMMU2func`
  FMMU2 function
* `uint8 FMMU3func`
  FMMU3 function
* `uint16 mbx_l`
  length of write mailbox in bytes, if no mailbox then 0
* `uint16 mbx_wo`
  mailbox write offset
* `uint16 mbx_rl`
  length of read mailbox in bytes
* `uint16 mbx_ro`
  mailbox read offset
* `uint16 mbx_proto`
  mailbox supported protocols
* `uint8 mbx_cnt`
  Counter value of mailbox link layer protocol 1..7
* `boolean hasdc`
  has DC capability
* `uint8 ptype`
  Physical type; Ebus, EtherNet combinations
* `uint8 topology`
  topology: 1 to 3 links
* `uint8 activeports`
  active ports bitmap : ….3210 , set if respective port is active
* `uint8 consumedports`
  consumed ports bitmap : ….3210, used for internal delay measurement
* `uint16 parent`
  slave number for parent, 0=master
* `uint8 parentport`
  port number on parent this slave is connected to
* `uint8 entryport`
  port number on this slave the parent is connected to
* `int32 DCrtA`
  DC receivetimes on port A
* `int32 DCrtB`
  DC receivetimes on port B
* `int32 DCrtC`
  DC receivetimes on port C
* `int32 DCrtD`
  DC receivetimes on port D
* `int32 pdelay`
  propagation delay
* `uint16 DCnext`
  next DC slave
* `uint16 DCprevious`
  previous DC slave
* `int32 DCcycle`
  DC cycle time in ns
* `int32 DCshift`
  DC shift from clock modulus boundary
* `uint8 DCactive`
  DC sync activation, 0=off, 1=on
* `uint16 SIIindex`
  link to SII config
* `uint8 eep_8byte`
  1 = 8 bytes per read, 0 = 4 bytes per read
* `uint8 eep_pdi`
  0 = eeprom to master , 1 = eeprom to PDI
* `uint8 CoEdetails`
  CoE details
* `uint8 FoEdetails`
  FoE details
* `uint8 EoEdetails`
  EoE details
* `uint8 SoEdetails`
  SoE details
* `int16 Ebuscurrent`
  E-bus current
* `uint8 blockLRW`
  if >0 block use of LRW in processdata
* `uint8 group`
  group
* `uint8 FMMUunused`
  first unused FMMU
* `boolean islost`
  Boolean for tracking whether the slave is (not) responding, not used/set by the SOEM library
* `int (*PO2SOconfig)(ecx_contextt *context, uint16 slave)`
  registered configuration function PO->SO
* `int mbxhandlerstate`
  mailbox handler state, 0 = no handler, 1 = cyclic task mbx handler, 2 = slave lost
* `int mbxrmpstate`
  mailbox handler robust mailbox protocol state
* `uint16 mbxinstateex`
  mailbox handler RMP extended mbx in state
* `uint8 *coembxin`
  pointer to CoE mailbox in buffer
* `boolean coembxinfull`
  CoE mailbox in flag, true = mailbox full
* `int coembxoverrun`
  CoE mailbox in overrun counter
* `uint8 *soembxin`
  pointer to SoE mailbox in buffer
* `boolean soembxinfull`
  SoE mailbox in flag, true = mailbox full
* `int soembxoverrun`
  SoE mailbox in overrun counter
* `uint8 *foembxin`
  pointer to FoE mailbox in buffer
* `boolean foembxinfull`
  FoE mailbox in flag, true = mailbox full
* `int foembxoverrun`
  FoE mailbox in overrun counter
* `uint8 *eoembxin`
  pointer to EoE mailbox in buffer
* `boolean eoembxinfull`
  EoE mailbox in flag, true = mailbox full
* `int eoembxoverrun`
  EoE mailbox in overrun counter
* `uint8 *voembxin`
  pointer to VoE mailbox in buffer
* `boolean voembxinfull`
  VoE mailbox in flag, true = mailbox full
* `int voembxoverrun`
  VoE mailbox in overrun counter
* `uint8 *aoembxin`
  pointer to AoE mailbox in buffer
* `boolean aoembxinfull`
  AoE mailbox in flag, true = mailbox full
* `int aoembxoverrun`
  AoE mailbox in overrun counter
* `uint8 *mbxstatus`
  pointer to out mailbox status register buffer
* `char name[EC_MAXNAME + 1]`
  readable name

---

### `struct ec_groupt`

for list of ethercat slave groups

**Public Members**

* `uint32 logstartaddr`
  logical start address for this group
* `uint32 Obytes`
  output bytes, if Obits < 8 then Obytes = 0
* `uint8 *outputs`
  output pointer in IOmap buffer
* `uint32 Ibytes`
  input bytes, if Ibits < 8 then Ibytes = 0
* `uint8 *inputs`
  input pointer in IOmap buffer
* `boolean hasdc`
  has DC capability
* `uint16 DCnext`
  next DC slave
* `int16 Ebuscurrent`
  E-bus current
* `uint8 blockLRW`
  if >0 block use of LRW in processdata
* `uint16 nsegments`
  IO segments used
* `uint16 Isegment`
  1st input segment
* `uint16 Ioffset`
  Offset in input segment
* `uint16 outputsWKC`
  Expected workcounter outputs
* `uint16 inputsWKC`
  Expected workcounter inputs
* `boolean docheckstate`
  check slave states
* `uint32 IOsegment[EC_MAXIOSEGMENTS]`
  IO segmentation list. Datagrams must not break SM in two.
* `uint8 *mbxstatus`
  pointer to out mailbox status register buffer
* `int32 mbxstatuslength`
  mailbox status register buffer length
* `uint16 mbxstatuslookup[EC_MAXSLAVE]`
  mailbox status lookup table
* `uint16 lastmbxpos`
  mailbox last handled in mxbhandler
* `ec_mbxqueuet mbxtxqueue`
  mailbox transmit queue struct

---

## Sending and receiving data

### `int ecx_send_processdata(ecx_contextt *context)`

Send processdata to slaves. Group number is zero (default).

**Parameters :**

* context – \[in] context struct

**Returns :**
Work counter.

---

### `int ecx_send_processdata_group(ecx_contextt *context, uint8 group)`

Transmit processdata to slaves.

Uses LRW, or LRD/LWR if LRW is not allowed (blockLRW).

In overlap mode, outputs are sent in the outgoing frame and inputs will replace outputs in the incoming frame.

In non-overlap mode, outputs are followed by extra space for inputs in the incoming frame.

The inputs are gathered with the receive processdata function. In contrast to the base LRW function this function is non-blocking. If the processdata does not fit in one datagram, multiple are used. In order to recombine the slave response, a stack is used.

**Parameters :**

* context – \[in] context struct
* group – \[in] group number

**Returns :**

> > 0 if processdata is transmitted.

---

### `int ecx_receive_processdata(ecx_contextt *context, int timeout)`

Receive processdata from slaves. Group number is zero (default).

**Parameters :**

* context – \[in] context struct
* timeout – \[in] Timeout in us.

**Returns :**
Work counter.

---

### `int ecx_receive_processdata_group(ecx_contextt *context, uint8 group, int timeout)`

Receive processdata from slaves. Second part from ec\_send\_processdata(). Received datagrams are recombined with the processdata with help from the stack. If a datagram contains input processdata it copies it to the processdata structure.

**Parameters :**

* context – \[in] context struct
* group – \[in] group number
* timeout – \[in] Timeout in us.

**Returns :**
Work counter.

---

### `int ecx_mbxhandler(ecx_contextt *context, uint8 group, int limit)`

Combined handler for both incoming and outgoing mailbox messages.

This function processes both incoming and outgoing mailbox messages for the specified group, dividing the processing limit between them. It first handles incoming messages and then uses the remaining limit for outgoing messages.

**Parameters :**

* context – \[in] context tructure.
* group – \[in] Group number.
* limit – \[in] The maximum number of mailboxes to process.

**Returns :**
count of processed outgoing mailboxes.

---

## Distributed clocks

### `boolean ecx_configdc(ecx_contextt *context)`

Locate DC slaves, measure propagation delays.

**Parameters :**

* context – \[in] context struct

**Returns :**
boolean if slaves are found with DC

---

### `void ecx_dcsync0(ecx_contextt *context, uint16 slave, boolean act, uint32 CyclTime, int32 CyclShift)`

Set DC of slave to fire sync0 at CyclTime interval with CyclShift offset.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number.
* act – \[in] TRUE = active, FALSE = deactivated
* CyclTime – \[in] Cycltime in ns.
* CyclShift – \[in] CyclShift in ns.

---

### `void ecx_dcsync01(ecx_contextt *context, uint16 slave, boolean act, uint32 CyclTime0, uint32 CyclTime1, int32 CyclShift)`

Set DC of slave to fire sync0 and sync1 at CyclTime interval with CyclShift offset.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number.
* act – \[in] TRUE = active, FALSE = deactivated
* CyclTime0 – \[in] Cycltime SYNC0 in ns.
* CyclTime1 – \[in] Cycltime SYNC1 in ns. This time is a delta time in relation to the SYNC0 fire. If CylcTime1 = 0 then SYNC1 fires a the same time as SYNC0.
* CyclShift – \[in] CyclShift in ns.

---

## CoE

### `int ecx_SDOread(ecx_contextt *context, uint16 slave, uint16 index, uint8 subindex, boolean CA, int *psize, void *p, int timeout)`

CoE SDO read, blocking. Single subindex or Complete Access.

Only a “normal” upload request is issued. If the requested parameter is <= 4bytes then a “expedited” response is returned, otherwise a “normal” response. If a “normal” response is larger than the mailbox size then the response is segmented. The function will combine all segments and copy them to the parameter buffer.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* index – \[in] Index to read
* subindex – \[in] Subindex to read, must be 0 or 1 if CA is used.
* CA – \[in] FALSE = single subindex. TRUE = Complete Access, all subindexes read.
* psize – \[inout] Size in bytes of parameter buffer, returns bytes read from SDO.
* p – \[out] Pointer to parameter buffer
* timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response

---

### `int ecx_SDOwrite(ecx_contextt *context, uint16 Slave, uint16 Index, uint8 SubIndex, boolean CA, int psize, const void *p, int Timeout)`

CoE SDO write, blocking. Single subindex or Complete Access.

A “normal” download request is issued, unless we have small data, then a “expedited” transfer is used. If the parameter is larger than the mailbox size then the download is segmented. The function will split the parameter data in segments and send them to the slave one by one.

**Parameters :**

* context – \[in] context struct
* Slave – \[in] Slave number
* Index – \[in] Index to write
* SubIndex – \[in] Subindex to write, must be 0 or 1 if CA is used.
* CA – \[in] FALSE = single subindex. TRUE = Complete Access, all subindexes written.
* psize – \[in] Size in bytes of parameter buffer.
* p – \[out] Pointer to parameter buffer
* Timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response

---

## FoE

### `int ecx_FOEdefinehook(ecx_contextt *context, void *hook)`

FoE progress hook.

**Parameters :**

* context – \[in] context struct
* hook – \[in] Pointer to hook function.

**Returns :**
1

---

### `int ecx_FOEread(ecx_contextt *context, uint16 slave, char *filename, uint32 password, int *psize, void *p, int timeout)`

FoE read, blocking.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number.
* filename – \[in] Filename of file to read.
* password – \[in] password.
* psize – \[inout] Size in bytes of file buffer, returns bytes read from file.
* p – \[out] Pointer to file buffer
* timeout – \[in] Timeout per mailbox cycle in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response

---

### `int ecx_FOEwrite(ecx_contextt *context, uint16 slave, char *filename, uint32 password, int psize, void *p, int timeout)`

FoE write, blocking.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number.
* filename – \[in] Filename of file to write.
* password – \[in] password.
* psize – \[in] Size in bytes of file buffer.
* p – \[out] Pointer to file buffer
* timeout – \[in] Timeout per mailbox cycle in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response

---

## EoE

### `int ecx_EOEdefinehook(ecx_contextt *context, void *hook)`

EoE fragment data handler hook. Should not block.

**Parameters :**

* context – \[in] context struct
* hook – \[in] Pointer to hook function.

**Returns :**
1

---

### `int ecx_EOEsetIp(ecx_contextt *context, uint16 slave, uint8 port, eoe_param_t *ipparam, int timeout)`

EoE EOE set IP, blocking. Waits for response from the slave.

**Parameters :**

* context – \[in] Context struct
* slave – \[in] Slave number
* port – \[in] Port number on slave if applicable
* ipparam – \[in] IP parameter data to be sent
* timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response or returned result code

---

### `int ecx_EOEgetIp(ecx_contextt *context, uint16 slave, uint8 port, eoe_param_t *ipparam, int timeout)`

EoE EOE get IP, blocking. Waits for response from the slave.

**Parameters :**

* context – \[in] Context struct
* slave – \[in] Slave number
* port – \[in] Port number on slave if applicable
* ipparam – \[out] IP parameter data retrieved from slave
* timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response or returned result code

---

### `int ecx_EOEsend(ecx_contextt *context, uint16 slave, uint8 port, int psize, void *p, int timeout)`

EoE ethernet buffer write, blocking.

If the buffer is larger than the mailbox size then the buffer is sent in several fragments. The function will split the buf data in fragments and send them to the slave one by one.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* port – \[in] Port number on slave if applicable
* psize – \[in] Size in bytes of parameter buffer.
* p – \[in] Pointer to parameter buffer
* timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave transmission

---

### `int ecx_EOErecv(ecx_contextt *context, uint16 slave, uint8 port, int *psize, void *p, int timeout)`

EoE ethernet buffer read, blocking.

If the buffer is larger than the mailbox size then the buffer is received by several fragments. The function will assamble the fragments into a complete Ethernet buffer.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* port – \[in] Port number on slave if applicable
* psize – \[inout] Size in bytes of parameter buffer.
* p – \[in] Pointer to parameter buffer
* timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response or error code

---

### `int ecx_EOEreadfragment(ec_mbxbuft *MbxIn, uint8 *rxfragmentno, uint16 *rxframesize, uint16 *rxframeoffset, uint16 *rxframeno, int *psize, void *p)`

EoE mailbox fragment read

Will take the data in incoming mailbox buffer and copy to destination Ethernet frame buffer at given offset and update current fragment variables

**Parameters :**

* MbxIn – \[in] Received mailbox containing fragment data
* rxfragmentno – \[inout] Fragment number
* rxframesize – \[inout] Frame size
* rxframeoffset – \[inout] Frame offset
* rxframeno – \[inout] Frame number
* psize – \[inout] Size in bytes of frame buffer.
* p – \[out] Pointer to frame buffer

**Returns :**
0= if fragment OK, >0 if last fragment, <0 on error

---

## SoE

### `int ecx_SoEread(ecx_contextt *context, uint16 slave, uint8 driveNo, uint8 elementflags, uint16 idn, int *psize, void *p, int timeout)`

SoE read, blocking.

The IDN object of the selected slave and DriveNo is read. If a response is larger than the mailbox size then the response is segmented. The function will combine all segments and copy them to the parameter buffer.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* driveNo – \[in] Drive number in slave
* elementflags – \[in] Flags to select what properties of IDN are to be transferred.
* idn – \[in] IDN.
* psize – \[inout] Size in bytes of parameter buffer, returns bytes read from SoE.
* p – \[out] Pointer to parameter buffer
* timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response

---

### `int ecx_SoEwrite(ecx_contextt *context, uint16 slave, uint8 driveNo, uint8 elementflags, uint16 idn, int psize, void *p, int timeout)`

SoE write, blocking.

The IDN object of the selected slave and DriveNo is written. If a response is larger than the mailbox size then the response is segmented.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* driveNo – \[in] Drive number in slave
* elementflags – \[in] Flags to select what properties of IDN are to be transferred.
* idn – \[in] IDN.
* psize – \[in] Size in bytes of parameter buffer.
* p – \[out] Pointer to parameter buffer
* timeout – \[in] Timeout in us, standard is EC\_TIMEOUTRXM

**Returns :**
Workcounter from last slave response

---

### `int ecx_readIDNmap(ecx_contextt *context, uint16 slave, uint32 *Osize, uint32 *Isize)`

SoE read AT and MTD mapping.

SoE has standard indexes defined for mapping. This function tries to read them and collect a full input and output mapping size of designated slave.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* Osize – \[out] Size in bits of output mapping (MTD) found
* Isize – \[out] Size in bits of input mapping (AT) found

**Returns :**

> > 0 if mapping successful.

---

## EEPROM

### `void ecx_esidump(ecx_contextt *context, uint16 slave, uint8 *esibuf)`

Dump complete EEPROM data from slave in buffer.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* esibuf – \[out] EEPROM data buffer, make sure it is big enough.

---

### `uint32 ecx_readeeprom(ecx_contextt *context, uint16 slave, uint16 eeproma, int timeout)`

Read EEPROM from slave bypassing cache.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* eeproma – \[in] (WORD) Address in the EEPROM
* timeout – \[in] Timeout in us.

**Returns :**
EEPROM data 32bit

---

### `int ecx_writeeeprom(ecx_contextt *context, uint16 slave, uint16 eeproma, uint16 data, int timeout)`

Write EEPROM to slave bypassing cache.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* eeproma – \[in] (WORD) Address in the EEPROM
* data – \[in] 16bit data
* timeout – \[in] Timeout in us.

**Returns :**

> > 0 if OK

---

### `int ecx_eeprom2master(ecx_contextt *context, uint16 slave)`

Set eeprom control to master. Only if set to PDI.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number

**Returns :**

> > 0 if OK

---

### `int ecx_eeprom2pdi(ecx_contextt *context, uint16 slave)`

Set eeprom control to PDI. Only if set to master.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number

**Returns :**

> > 0 if OK

---

### `uint64 ecx_readeepromAP(ecx_contextt *context, uint16 aiadr, uint16 eeproma, int timeout)`

Read EEPROM from slave bypassing cache. APRD method.

**Parameters :**

* aiadr – \[in] auto increment address of slave
* eeproma – \[in] (WORD) Address in the EEPROM
* timeout – \[in] Timeout in us.

**Returns :**
EEPROM data 64bit or 32bit

---

### `int ecx_writeeepromAP(ecx_contextt *context, uint16 aiadr, uint16 eeproma, uint16 data, int timeout)`

Write EEPROM to slave bypassing cache. APWR method.

**Parameters :**

* aiadr – \[in] configured address of slave
* eeproma – \[in] (WORD) Address in the EEPROM
* data – \[in] 16bit data
* timeout – \[in] Timeout in us.

**Returns :**

> > 0 if OK

---

### `uint64 ecx_readeepromFP(ecx_contextt *context, uint16 configadr, uint16 eeproma, int timeout)`

Read EEPROM from slave bypassing cache. FPRD method.

**Parameters :**

* configadr – \[in] configured address of slave
* eeproma – \[in] (WORD) Address in the EEPROM
* timeout – \[in] Timeout in us.

**Returns :**
EEPROM data 64bit or 32bit

---

### `int ecx_writeeepromFP(ecx_contextt *context, uint16 configadr, uint16 eeproma, uint16 data, int timeout)`

Write EEPROM to slave bypassing cache. FPWR method.

**Parameters :**

* configadr – \[in] configured address of slave
* eeproma – \[in] (WORD) Address in the EEPROM
* data – \[in] 16bit data
* timeout – \[in] Timeout in us.

**Returns :**

> > 0 if OK

---

### `void ecx_readeeprom1(ecx_contextt *context, uint16 slave, uint16 eeproma)`

Read EEPROM from slave bypassing cache. Parallel read step 1, make request to slave.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* eeproma – \[in] (WORD) Address in the EEPROM

---

### `uint32 ecx_readeeprom2(ecx_contextt *context, uint16 slave, int timeout)`

Read EEPROM from slave bypassing cache. Parallel read step 2, actual read from slave.

**Parameters :**

* context – \[in] context struct
* slave – \[in] Slave number
* timeout – \[in] Timeout in us.

**Returns :**
EEPROM data 32bit

---

## EtherCAT low-level API

### `int ecx_BWR(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

BRW “broadcast write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, normally 0
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[in] databuffer to be written to slaves
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_BRD(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

BRD “broadcast read” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, normally 0
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[out] databuffer to put slave data in
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_APRD(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

APRD “auto increment address read” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, each slave ++, slave that has 0 executes
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[out] databuffer to put slave data in
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_ARMW(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

APRMW “auto increment address read, multiple write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, each slave ++, slave that has 0 reads, following slaves write.
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[out] databuffer to put slave data in
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_FRMW(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

FPRMW “configured address read, multiple write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, slave that has address reads, following slaves write.
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[out] databuffer to put slave data in
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `uint16 ecx_APRDw(ecx_portt *port, uint16 ADP, uint16 ADO, int timeout)`

APRDw “auto increment address read” word return primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, each slave ++, slave that has 0 reads.
* ADO – \[in] Address Offset, slave memory address
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
word data from slave

---

### `int ecx_FPRD(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

FPRD “configured address read” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, slave that has address reads.
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[out] databuffer to put slave data in
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `uint16 ecx_FPRDw(ecx_portt *port, uint16 ADP, uint16 ADO, int timeout)`

FPRDw “configured address read” word return primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, slave that has address reads.
* ADO – \[in] Address Offset, slave memory address
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
word data from slave

---

### `int ecx_APWRw(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 data, int timeout)`

APWRw “auto increment address write” word primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, each slave ++, slave that has 0 writes.
* ADO – \[in] Address Offset, slave memory address
* data – \[in] word data to write to slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_APWR(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

APWR “auto increment address write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, each slave ++, slave that has 0 writes.
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[in] databuffer to write to slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_FPWRw(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 data, int timeout)`

FPWR “configured address write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, slave that has address writes.
* ADO – \[in] Address Offset, slave memory address
* data – \[in] word to write to slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_FPWR(ecx_portt *port, uint16 ADP, uint16 ADO, uint16 length, void *data, int timeout)`

FPWR “configured address write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* ADP – \[in] Address Position, slave that has address writes.
* ADO – \[in] Address Offset, slave memory address
* length – \[in] length of databuffer
* data – \[in] databuffer to write to slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_LRW(ecx_portt *port, uint32 LogAdr, uint16 length, void *data, int timeout)`

LRW “logical memory read / write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* LogAdr – \[in] Logical memory address
* length – \[in] length of databuffer
* data – \[inout] databuffer to write to and read from slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_LRD(ecx_portt *port, uint32 LogAdr, uint16 length, void *data, int timeout)`

LRD “logical memory read” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* LogAdr – \[in] Logical memory address
* length – \[in] length of bytes to read from slave.
* data – \[out] databuffer to read from slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_LWR(ecx_portt *port, uint32 LogAdr, uint16 length, void *data, int timeout)`

LWR “logical memory write” primitive. Blocking.

**Parameters :**

* port – \[in] port context struct
* LogAdr – \[in] Logical memory address
* length – \[in] length of databuffer
* data – \[in] databuffer to write to slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

### `int ecx_LRWDC(ecx_portt *port, uint32 LogAdr, uint16 length, void *data, uint16 DCrs, int64 *DCtime, int timeout)`

LRW “logical memory read / write” primitive plus Clock Distribution. Blocking. Frame consists of two datagrams, one LRW and one FPRMW.

**Parameters :**

* port – \[in] port context struct
* LogAdr – \[in] Logical memory address
* length – \[in] length of databuffer
* data – \[inout] databuffer to write to and read from slave.
* DCrs – \[in] Distributed Clock reference slave address.
* DCtime – \[out] DC time read from reference slave.
* timeout – \[in] timeout in us, standard is EC\_TIMEOUTRET

**Returns :**
Workcounter or EC\_NOFRAME

---

## OSAL

### `void osal_get_monotonic_time(ec_timet *ts)`

Returns monotonic time from some unspecified moment in the past.

This time must be strictly increasing. It is used for time intervals measurement.

**Parameters :**

* ts – Pointer to an ec\_timet structure where the time will be stored.

---

### `ec_timet osal_current_time(void)`

Returns the current time.

This time is used to set the initial EtherCAT network DC time and for logging purposes.

**Returns :**
ec\_timet containing the current time.

---

### `void osal_time_diff(ec_timet *start, ec_timet *end, ec_timet *diff)`

Calculates the difference between two timestamps.

**Parameters :**

* start – Pointer to the start timestamp.
* end – Pointer to the end timestamp.
* diff – Pointer to an ec\_timet structure where the difference will be stored.

---

### `void osal_timer_start(osal_timert *self, uint32 timeout_usec)`

Starts the timer with a specified timeout.

**Parameters :**

* self – Pointer to the timer object.
* timeout\_usec – Timeout in microseconds.

---

### `boolean osal_timer_is_expired(osal_timert *self)`

Checks if the timer has expired.

**Parameters :**

* self – Pointer to the timer object.

**Returns :**
True if the timer is expired, false otherwise.

---

### `int osal_usleep(uint32 usec)`

Sleeps for a specified duration in microseconds.

**Parameters :**

* usec – Duration in microseconds.

**Returns :**
0 on success, -1 on failure.

---

### `int osal_monotonic_sleep(ec_timet *ts)`

Sleeps until the specified monotonic time.

**Parameters :**

* ts – Pointer to an ec\_timet structure representing the absolute time to sleep until.

**Returns :**
0 on success, -1 on failure.

---

### `void *osal_malloc(size_t size)`

Allocates memory of the specified size.

**Parameters :**

* size – Size in bytes to allocate.

**Returns :**
Pointer to the allocated memory or NULL on failure.

---

### `void osal_free(void *ptr)`

Frees the allocated memory.

**Parameters :**

* ptr – Pointer to the memory to free.

---

### `int osal_thread_create(void *thandle, int stacksize, void *func, void *param)`

Creates a new thread.

**Parameters :**

* thandle – Pointer to the thread handle which will store the thread ID.
* stacksize – Size of the stack for the new thread.
* func – Pointer to the function to execute in the new thread.
* param – Pointer to parameters to pass to the thread function.

**Returns :**
1 on success, 0 on failure.

---

### `int osal_thread_create_rt(void *thandle, int stacksize, void *func, void *param)`

Creates a new real-time thread.

**Parameters :**

* thandle – Pointer to the thread handle which will store the thread ID.
* stacksize – Size of the stack for the new thread.
* func – Pointer to the function to execute in the new thread.
* param – Pointer to parameters to pass to the thread function.

**Returns :**
1 on success, 0 on failure.

---

### `void *osal_mutex_create(void)`

Creates a mutex.

**Returns :**
Pointer to the created mutex or NULL on failure.

---

### `void osal_mutex_destroy(void *mutex)`

Destroys a mutex.

**Parameters :**

* mutex – Pointer to the mutex to destroy.

---

### `void osal_mutex_lock(void *mutex)`

Locks the mutex.

**Parameters :**

* mutex – Pointer to the mutex to lock.

---

### `void osal_mutex_unlock(void *mutex)`

Unlocks the mutex.

**Parameters :**

* mutex – Pointer to the mutex to unlock.
