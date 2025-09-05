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

        std::string ifname_ = "eth0";
        bool opened_ = false;
        ecx_contextt ctx_ = {0};
    };

} // namespace soemnode