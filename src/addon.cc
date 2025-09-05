#include "soem_wrap.hpp"
#include <cstring>

using namespace soemnode;

static Napi::FunctionReference masterCtor;

Master::Master(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Master>(info)
{
    Napi::Env env = info.Env();
    if (info.Length() > 0 && info[0].IsString())
    {
        ifname_ = info[0].As<Napi::String>().Utf8Value();
    }
    else
    {
        ifname_ = "eth0";
    }
}

Napi::Value Master::init(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (opened_)
        return Napi::Boolean::New(env, true);
    if (ec_init(ifname_.c_str()))
    {
        opened_ = true;
        return Napi::Boolean::New(env, true);
    }
    return Napi::Boolean::New(env, false);
}

Napi::Value Master::configInit(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (!opened_)
        return Napi::Boolean::New(env, false);
    int slaves = ec_config_init(FALSE);
    return Napi::Number::New(env, slaves);
}

Napi::Value Master::configMapPDO(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    ec_config_map(&ec_slave[0].userdata);
    ec_configdc();
    return env.Undefined();
}

Napi::Value Master::state(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    return Napi::Number::New(env, ec_slave[0].state);
}

Napi::Value Master::readState(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    ec_readstate();
    return Napi::Number::New(env, ec_slave[0].state);
}

Napi::Value Master::sdoRead(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 3)
        return env.Null();
    uint16 slave = info[0].As<Napi::Number>().Uint32Value();
    uint16 index = info[1].As<Napi::Number>().Uint32Value();
    uint8 subidx = info[2].As<Napi::Number>().Uint32Value();
    uint8 buf[512];
    int sz = sizeof(buf);
    int wkc = ec_SDOread(slave, index, subidx, FALSE, &sz, buf, EC_TIMEOUTRXM);
    if (wkc <= 0)
        return env.Null();
    return Napi::Buffer<uint8_t>::Copy(env, buf, sz);
}

Napi::Value Master::sdoWrite(const Napi::CallbackInfo &info)
{
    Napi::Env env = info.Env();
    if (info.Length() < 4)
        return Napi::Boolean::New(env, false);
    uint16 slave = info[0].As<Napi::Number>().Uint32Value();
    uint16 index = info[1].As<Napi::Number>().Uint32Value();
    uint8 subidx = info[2].As<Napi::Number>().Uint32Value();
    Napi::Buffer<uint8_t> data = info[3].As<Napi::Buffer<uint8_t>>();
    int sz = data.Length();
    int wkc = ec_SDOwrite(slave, index, subidx, FALSE, sz, data.Data(), EC_TIMEOUTRXM);
    return Napi::Boolean::New(env, wkc > 0);
}

Napi::Value Master::sendProcessdata(const Napi::CallbackInfo &info)
{
    int wkc = ec_send_processdata();
    return Napi::Number::New(info.Env(), wkc);
}

Napi::Value Master::receiveProcessdata(const Napi::CallbackInfo &info)
{
    int wkc = ec_receive_processdata(EC_TIMEOUTRET);
    return Napi::Number::New(info.Env(), wkc);
}

Napi::Value Master::close(const Napi::CallbackInfo &info)
{
    if (opened_)
    {
        ec_close();
        opened_ = false;
    }
    return info.Env().Undefined();
}

Napi::Function Master::Init(Napi::Env env)
{
    Napi::Function func = Napi::DefineClass(env, "Master", {Napi::InstanceMethod("init", &Master::init), Napi::InstanceMethod("configInit", &Master::configInit), Napi::InstanceMethod("configMapPDO", &Master::configMapPDO), Napi::InstanceMethod("state", &Master::state), Napi::InstanceMethod("readState", &Master::readState), Napi::InstanceMethod("sdoRead", &Master::sdoRead), Napi::InstanceMethod("sdoWrite", &Master::sdoWrite), Napi::InstanceMethod("sendProcessdata", &Master::sendProcessdata), Napi::InstanceMethod("receiveProcessdata", &Master::receiveProcessdata), Napi::InstanceMethod("close", &Master::close)});
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