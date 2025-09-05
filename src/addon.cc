#include "soem_wrap.hpp"
#include <cstring>

using namespace Napi;
using namespace soemnode;

static FunctionReference masterCtor;

Master::Master(const CallbackInfo &info) : ObjectWrap<Master>(info)
{
    Env env = info.Env();
    if (info.Length() > 0 && info[0].IsString())
    {
        ifname_ = info[0].As<String>().Utf8Value();
    }
    else
    {
        ifname_ = "eth0";
    }
}

Value Master::init(const CallbackInfo &info)
{
    Env env = info.Env();
    if (opened_)
        return Boolean::New(env, true);
    if (ec_init(ifname_.c_str()))
    {
        opened_ = true;
        return Boolean::New(env, true);
    }
    return Boolean::New(env, false);
}

Value Master::configInit(const CallbackInfo &info)
{
    Env env = info.Env();
    if (!opened_)
        return Boolean::New(env, false);
    int slaves = ec_config_init(FALSE);
    return Number::New(env, slaves);
}

Value Master::configMapPDO(const CallbackInfo &info)
{
    Env env = info.Env();
    ec_config_map(&ec_slave[0].userdata);
    ec_configdc();
    return env.Undefined();
}

Value Master::state(const CallbackInfo &info)
{
    Env env = info.Env();
    return Number::New(env, ec_slave[0].state);
}

Value Master::readState(const CallbackInfo &info)
{
    Env env = info.Env();
    ec_readstate();
    return Number::New(env, ec_slave[0].state);
}

Value Master::sdoRead(const CallbackInfo &info)
{
    Env env = info.Env();
    if (info.Length() < 3)
        return env.Null();
    uint16 slave = info[0].As<Number>().Uint32Value();
    uint16 index = info[1].As<Number>().Uint32Value();
    uint8 subidx = info[2].As<Number>().Uint32Value();
    uint8 buf[512];
    int sz = sizeof(buf);
    int wkc = ec_SDOread(slave, index, subidx, FALSE, &sz, buf, EC_TIMEOUTRXM);
    if (wkc <= 0)
        return env.Null();
    return Buffer<uint8_t>::Copy(env, buf, sz);
}

Value Master::sdoWrite(const CallbackInfo &info)
{
    Env env = info.Env();
    if (info.Length() < 4)
        return Boolean::New(env, false);
    uint16 slave = info[0].As<Number>().Uint32Value();
    uint16 index = info[1].As<Number>().Uint32Value();
    uint8 subidx = info[2].As<Number>().Uint32Value();
    Buffer<uint8_t> data = info[3].As<Buffer<uint8_t>>();
    int sz = data.Length();
    int wkc = ec_SDOwrite(slave, index, subidx, FALSE, sz, data.Data(), EC_TIMEOUTRXM);
    return Boolean::New(env, wkc > 0);
}

Value Master::sendProcessdata(const CallbackInfo &info)
{
    int wkc = ec_send_processdata();
    return Number::New(info.Env(), wkc);
}

Value Master::receiveProcessdata(const CallbackInfo &info)
{
    int wkc = ec_receive_processdata(EC_TIMEOUTRET);
    return Number::New(info.Env(), wkc);
}

Value Master::close(const CallbackInfo &info)
{
    if (opened_)
    {
        ec_close();
        opened_ = false;
    }
    return info.Env().Undefined();
}

Function Master::Init(Env env)
{
    Function func = DefineClass(env, "Master", {InstanceMethod("init", &Master::init), InstanceMethod("configInit", &Master::configInit), InstanceMethod("configMapPDO", &Master::configMapPDO), InstanceMethod("state", &Master::state), InstanceMethod("readState", &Master::readState), InstanceMethod("sdoRead", &Master::sdoRead), InstanceMethod("sdoWrite", &Master::sdoWrite), InstanceMethod("sendProcessdata", &Master::sendProcessdata), InstanceMethod("receiveProcessdata", &Master::receiveProcessdata), InstanceMethod("close", &Master::close)});
    masterCtor = Persistent(func);
    masterCtor.SuppressDestruct();
    return func;
}

Object InitAll(Env env, Object exports)
{
    exports.Set("Master", Master::Init(env));
    return exports;
}

NODE_API_MODULE(soem_addon, InitAll)