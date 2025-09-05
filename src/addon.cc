#include "soem_wrap.hpp"
#include <cstring>

namespace soemnode
{

    static Napi::FunctionReference masterCtor;

    Master::Master(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Master>(info)
    {
        if (info.Length() > 0 && info[0].IsString())
        {
            ifname_ = info[0].As<Napi::String>().Utf8Value();
        }
        else
        {
            ifname_ = "eth0";
        }
        memset(&ctx_, 0, sizeof(ctx_));
    }

    Napi::Value Master::init(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (opened_)
            return Napi::Boolean::New(env, true);
        int ret = ecx_init(&ctx_, ifname_.c_str());
        if (ret == 0)
        {
            opened_ = false;
            return Napi::Boolean::New(env, false);
        }
        opened_ = true;
        return Napi::Boolean::New(env, true);
    }

    Napi::Value Master::configInit(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (!opened_)
            return Napi::Boolean::New(env, false);
        int slaves = ecx_config_init(&ctx_);
        return Napi::Number::New(env, slaves);
    }

    Napi::Value Master::configMapPDO(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (!opened_)
            return env.Undefined();
        static uint8 IOmap[4096];
        ecx_config_map_group(&ctx_, IOmap, 0);
        ecx_configdc(&ctx_);
        return env.Undefined();
    }

    Napi::Value Master::state(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        return Napi::Number::New(env, ctx_.slavelist[0].state);
    }

    Napi::Value Master::readState(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        ecx_readstate(&ctx_);
        return Napi::Number::New(env, ctx_.slavelist[0].state);
    }

    Napi::Value Master::sdoRead(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 3)
            return env.Null();
        uint16 slave = (uint16)info[0].As<Napi::Number>().Uint32Value();
        uint16 index = (uint16)info[1].As<Napi::Number>().Uint32Value();
        uint8 subidx = (uint8)info[2].As<Napi::Number>().Uint32Value();
        uint8 buf[512];
        int sz = sizeof(buf);
        int wkc = ecx_SDOread(&ctx_, slave, index, subidx, FALSE, &sz, buf, EC_TIMEOUTRXM);
        if (wkc <= 0)
            return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, buf, sz);
    }

    Napi::Value Master::sdoWrite(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 4)
            return Napi::Boolean::New(env, false);
        uint16 slave = (uint16)info[0].As<Napi::Number>().Uint32Value();
        uint16 index = (uint16)info[1].As<Napi::Number>().Uint32Value();
        uint8 subidx = (uint8)info[2].As<Napi::Number>().Uint32Value();
        Napi::Buffer<uint8_t> data = info[3].As<Napi::Buffer<uint8_t>>();
        int sz = (int)data.Length();
        int wkc = ecx_SDOwrite(&ctx_, slave, index, subidx, FALSE, sz, data.Data(), EC_TIMEOUTRXM);
        return Napi::Boolean::New(env, wkc > 0);
    }

    Napi::Value Master::sendProcessdata(const Napi::CallbackInfo &info)
    {
        int wkc = ecx_send_processdata(&ctx_);
        return Napi::Number::New(info.Env(), wkc);
    }

    Napi::Value Master::receiveProcessdata(const Napi::CallbackInfo &info)
    {
        int wkc = ecx_receive_processdata(&ctx_, EC_TIMEOUTRET);
        return Napi::Number::New(info.Env(), wkc);
    }

    Napi::Value Master::close(const Napi::CallbackInfo &info)
    {
        if (opened_)
        {
            ecx_close(&ctx_);
            opened_ = false;
        }
        return info.Env().Undefined();
    }

    Napi::Function Master::Init(Napi::Env env)
    {
        Napi::Function func = Napi::ObjectWrap<Master>::DefineClass(env, "Master", {InstanceMethod("init", &Master::init), InstanceMethod("configInit", &Master::configInit), InstanceMethod("configMapPDO", &Master::configMapPDO), InstanceMethod("state", &Master::state), InstanceMethod("readState", &Master::readState), InstanceMethod("sdoRead", &Master::sdoRead), InstanceMethod("sdoWrite", &Master::sdoWrite), InstanceMethod("sendProcessdata", &Master::sendProcessdata), InstanceMethod("receiveProcessdata", &Master::receiveProcessdata), InstanceMethod("close", &Master::close)});
        masterCtor = Napi::Persistent(func);
        masterCtor.SuppressDestruct();
        return func;
    }

    Napi::Object InitAll(Napi::Env env, Napi::Object exports)
    {
        exports.Set("Master", Master::Init(env));
        return exports;
    }

    NODE_API_MODULE(soem_addon, InitAll)

} // namespace soemnode
