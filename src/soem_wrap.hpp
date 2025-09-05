#pragma once
#include <napi.h>
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
        Master(const Napi::CallbackInfo &info);

    private:
        // méthodes exposées
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

        // champs
        std::string ifname_;
        bool opened_ = false;
    };

}