#pragma once

#include <napi.h>

// Platform-specific includes for SOEM
#ifdef _WIN32
// Windows-specific headers
#include <winsock2.h>
#include <windows.h>
// On modern Windows (UCRT) timespec is provided by the system headers.
// Avoid redefining it here to prevent redefinition errors.
#include <time.h>
#else
// Unix/Linux headers
#include <sys/time.h>
#include <unistd.h>
#endif

extern "C"
{
#include "ethercat.h"
}

namespace soemnode
{

    class Master : public Napi::ObjectWrap<Master>
    {
    public:
        static Napi::Function Init(Napi::Env env);
        static Napi::Value listInterfaces(const Napi::CallbackInfo &info);
        Master(const Napi::CallbackInfo &info);

    private:
        Napi::Value init(const Napi::CallbackInfo &info);
        Napi::Value configInit(const Napi::CallbackInfo &info);
        Napi::Value configMapPDO(const Napi::CallbackInfo &info);
        Napi::Value state(const Napi::CallbackInfo &info);
        Napi::Value readState(const Napi::CallbackInfo &info);
        Napi::Value sdoRead(const Napi::CallbackInfo &info);
        Napi::Value sdoWrite(const Napi::CallbackInfo &info);
        Napi::Value sendProcessdata(const Napi::CallbackInfo &info);
        Napi::Value receiveProcessdata(const Napi::CallbackInfo &info);
        Napi::Value close(const Napi::CallbackInfo &info);
        Napi::Value writeState(const Napi::CallbackInfo &info);
        Napi::Value stateCheck(const Napi::CallbackInfo &info);
        Napi::Value reconfigSlave(const Napi::CallbackInfo &info);
        Napi::Value recoverSlave(const Napi::CallbackInfo &info);
        Napi::Value slaveMbxCyclic(const Napi::CallbackInfo &info);
        Napi::Value configDC(const Napi::CallbackInfo &info);
        Napi::Value getSlaves(const Napi::CallbackInfo &info);
        Napi::Value initRedundant(const Napi::CallbackInfo &info);
        Napi::Value configMapGroup(const Napi::CallbackInfo &info);
        Napi::Value sendProcessdataGroup(const Napi::CallbackInfo &info);
        Napi::Value receiveProcessdataGroup(const Napi::CallbackInfo &info);
        Napi::Value mbxHandler(const Napi::CallbackInfo &info);
        Napi::Value elist2string(const Napi::CallbackInfo &info);

        // SoE / EoE / FoE
        Napi::Value SoEread(const Napi::CallbackInfo &info);
        Napi::Value SoEwrite(const Napi::CallbackInfo &info);

        // EEPROM helpers
        Napi::Value readeeprom(const Napi::CallbackInfo &info);
        Napi::Value writeeeprom(const Napi::CallbackInfo &info);

        // Low-level primitives (APRD / APWR / LRW / LRD / LWR)
        Napi::Value APRD(const Napi::CallbackInfo &info);
        Napi::Value APWR(const Napi::CallbackInfo &info);
        Napi::Value LRW(const Napi::CallbackInfo &info);
        Napi::Value LRD(const Napi::CallbackInfo &info);
        Napi::Value LWR(const Napi::CallbackInfo &info);

        // Distributed clock helpers
        Napi::Value dcsync0(const Napi::CallbackInfo &info);
        Napi::Value dcsync01(const Napi::CallbackInfo &info);

        std::string ifname_ = "eth0";
        bool opened_ = false;
        ecx_contextt ctx_ = {0};
    };

} // namespace soemnode