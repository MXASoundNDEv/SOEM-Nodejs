// Platform-specific includes
#ifdef _WIN32
// Minimize windows header to avoid winsock.h inclusion
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
// Include winsock2 before windows.h to avoid conflicts
#include <winsock2.h>
#include <ws2tcpip.h>
#include <windows.h>
#include <time.h>
#else
#include <sys/time.h>
#include <unistd.h>
#endif

#include "soem_wrap.hpp"
#include <cstring>
#include <vector>

namespace soemnode
{

    Napi::FunctionReference constructor;

    Master::Master(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Master>(info)
    {
        if (info.Length() > 0 && info[0].IsString())
        {
            ifname_ = info[0].As<Napi::String>().Utf8Value();
        }
        std::memset(&ctx_, 0, sizeof(ctx_));
    }

    Napi::Value Master::init(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (opened_)
            return Napi::Boolean::New(env, true);
        int ret = ecx_init(&ctx_, ifname_.c_str());
        opened_ = (ret != 0);
        return Napi::Boolean::New(env, opened_);
    }

    Napi::Value Master::configInit(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (!opened_)
            return Napi::Number::New(env, 0);
        int slaves = ecx_config_init(&ctx_);
        return Napi::Number::New(env, slaves);
    }

    Napi::Value Master::configMapPDO(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (!opened_)
            return env.Undefined();
        static uint8 IOmap[4096];
        // Use the group-based map call in current SOEM API. Use group 0.
        ecx_config_map_group(&ctx_, IOmap, 0);
        ecx_configdc(&ctx_);
        return env.Undefined();
    }

    Napi::Value Master::state(const Napi::CallbackInfo &info)
    {
        return Napi::Number::New(info.Env(), ctx_.slavelist[0].state);
    }

    Napi::Value Master::readState(const Napi::CallbackInfo &info)
    {
        ecx_readstate(&ctx_);
        return Napi::Number::New(info.Env(), ctx_.slavelist[0].state);
    }

    Napi::Value Master::sdoRead(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 3)
            return env.Null();
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 index = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        uint8 sub = static_cast<uint8>(info[2].As<Napi::Number>().Uint32Value());
        bool CA = false;
        if (info.Length() >= 4 && info[3].IsBoolean())
            CA = info[3].As<Napi::Boolean>().Value();
        uint8 buf[512];
        int sz = sizeof(buf);
        int wkc = ecx_SDOread(&ctx_, slave, index, sub, CA ? TRUE : FALSE, &sz, buf, EC_TIMEOUTRXM);
        if (wkc <= 0)
            return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, buf, sz);
    }

    Napi::Value Master::sdoWrite(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 4)
            return Napi::Boolean::New(env, false);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 index = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        uint8 sub = static_cast<uint8>(info[2].As<Napi::Number>().Uint32Value());
        Napi::Buffer<uint8_t> data = info[3].As<Napi::Buffer<uint8_t>>();
        int sz = static_cast<int>(data.Length());
        bool CA = false;
        if (info.Length() >= 5 && info[4].IsBoolean())
            CA = info[4].As<Napi::Boolean>().Value();
        int wkc = ecx_SDOwrite(&ctx_, slave, index, sub, CA ? TRUE : FALSE, sz, data.Data(), EC_TIMEOUTRXM);
        return Napi::Boolean::New(env, wkc > 0);
    }

    Napi::Value Master::writeState(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2)
            return Napi::Number::New(env, 0);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 req = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        ctx_.slavelist[slave].state = req;
        int ret = ecx_writestate(&ctx_, slave);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::stateCheck(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2)
            return Napi::Number::New(env, 0);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 req = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 3 && info[2].IsNumber())
            timeout = info[2].As<Napi::Number>().Int32Value();
        uint16 ret = ecx_statecheck(&ctx_, slave, req, timeout);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::reconfigSlave(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 1)
            return Napi::Number::New(env, 0);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        int timeout = EC_TIMEOUTRET3;
        if (info.Length() >= 2 && info[1].IsNumber())
            timeout = info[1].As<Napi::Number>().Int32Value();
        int ret = ecx_reconfig_slave(&ctx_, slave, timeout);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::recoverSlave(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 1)
            return Napi::Number::New(env, 0);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        int timeout = EC_TIMEOUTRET3;
        if (info.Length() >= 2 && info[1].IsNumber())
            timeout = info[1].As<Napi::Number>().Int32Value();
        int ret = ecx_recover_slave(&ctx_, slave, timeout);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::slaveMbxCyclic(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 1)
            return Napi::Number::New(env, 0);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        int ret = ecx_slavembxcyclic(&ctx_, slave);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::configDC(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        int ok = ecx_configdc(&ctx_);
        return Napi::Boolean::New(env, ok != 0);
    }

    Napi::Value Master::getSlaves(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        Napi::Array arr = Napi::Array::New(env);
        int i = 1;
        while (i <= ctx_.slavecount)
        {
            Napi::Object s = Napi::Object::New(env);
            s.Set("name", Napi::String::New(env, ctx_.slavelist[i].name ? ctx_.slavelist[i].name : ""));
            s.Set("state", Napi::Number::New(env, ctx_.slavelist[i].state));
            s.Set("ALstatuscode", Napi::Number::New(env, ctx_.slavelist[i].ALstatuscode));
            s.Set("configadr", Napi::Number::New(env, ctx_.slavelist[i].configadr));
            s.Set("aliasadr", Napi::Number::New(env, ctx_.slavelist[i].aliasadr));
            uint32 numbytes = ctx_.slavelist[i].Obytes;
            if ((numbytes == 0) && (ctx_.slavelist[i].Obits > 0))
                numbytes = 1;
            if (numbytes > 8)
                numbytes = 8;
            s.Set("Obits", Napi::Number::New(env, ctx_.slavelist[i].Obits));
            s.Set("Obytes", Napi::Number::New(env, ctx_.slavelist[i].Obytes));
            s.Set("outputs", Napi::ArrayBuffer::New(env, (void *)ctx_.slavelist[i].outputs, numbytes));
            numbytes = ctx_.slavelist[i].Ibytes;
            if ((numbytes == 0) && (ctx_.slavelist[i].Ibits > 0))
                numbytes = 1;
            if (numbytes > 8)
                numbytes = 8;
            s.Set("Ibits", Napi::Number::New(env, ctx_.slavelist[i].Ibits));
            s.Set("Ibytes", Napi::Number::New(env, ctx_.slavelist[i].Ibytes));
            s.Set("inputs", Napi::ArrayBuffer::New(env, (void *)ctx_.slavelist[i].inputs, numbytes));
            s.Set("pdelay", Napi::Number::New(env, ctx_.slavelist[i].pdelay));
            arr.Set(i - 1, s);
            i++;
        }
        return arr;
    }

    Napi::Value Master::initRedundant(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2)
            return Napi::Boolean::New(env, false);
        std::string if1 = info[0].As<Napi::String>().Utf8Value();
        std::string if2 = info[1].As<Napi::String>().Utf8Value();
        ecx_redportt redport;
        std::memset(&redport, 0, sizeof(redport));
        int ret = ecx_init_redundant(&ctx_, &redport, if1.c_str(), const_cast<char *>(if2.c_str()));
        opened_ = (ret != 0);
        return Napi::Boolean::New(env, opened_);
    }

    Napi::Value Master::configMapGroup(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (!opened_)
            return env.Null();
        int group = 0;
        if (info.Length() >= 1 && info[0].IsNumber())
            group = info[0].As<Napi::Number>().Int32Value();
        static uint8 IOmap[8192];
        int bytes = ecx_config_map_group(&ctx_, IOmap, static_cast<uint8>(group));
        if (bytes <= 0)
            return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, IOmap, bytes);
    }

    Napi::Value Master::sendProcessdataGroup(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        int group = 0;
        if (info.Length() >= 1 && info[0].IsNumber())
            group = info[0].As<Napi::Number>().Int32Value();
        int ret = ecx_send_processdata_group(&ctx_, static_cast<uint8>(group));
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::receiveProcessdataGroup(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        int group = 0;
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 1 && info[0].IsNumber())
            group = info[0].As<Napi::Number>().Int32Value();
        if (info.Length() >= 2 && info[1].IsNumber())
            timeout = info[1].As<Napi::Number>().Int32Value();
        int ret = ecx_receive_processdata_group(&ctx_, static_cast<uint8>(group), timeout);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::mbxHandler(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        int group = 0;
        int limit = 10;
        if (info.Length() >= 1 && info[0].IsNumber())
            group = info[0].As<Napi::Number>().Int32Value();
        if (info.Length() >= 2 && info[1].IsNumber())
            limit = info[1].As<Napi::Number>().Int32Value();
        int ret = ecx_mbxhandler(&ctx_, static_cast<uint8>(group), limit);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::elist2string(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        char *s = ecx_elist2string(&ctx_);
        if (!s)
            return env.Null();
        Napi::String out = Napi::String::New(env, s);
        return out;
    }

    Napi::Value Master::SoEread(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 4)
            return env.Null();
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint8 driveNo = static_cast<uint8>(info[1].As<Napi::Number>().Uint32Value());
        uint8 elementflags = static_cast<uint8>(info[2].As<Napi::Number>().Uint32Value());
        uint16 idn = static_cast<uint16>(info[3].As<Napi::Number>().Uint32Value());
        uint8 buf[2048];
        int sz = sizeof(buf);
        int wkc = ecx_SoEread(&ctx_, slave, driveNo, elementflags, idn, &sz, buf, EC_TIMEOUTRXM);
        if (wkc <= 0)
            return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, buf, sz);
    }

    Napi::Value Master::SoEwrite(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 5)
            return Napi::Boolean::New(env, false);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint8 driveNo = static_cast<uint8>(info[1].As<Napi::Number>().Uint32Value());
        uint8 elementflags = static_cast<uint8>(info[2].As<Napi::Number>().Uint32Value());
        uint16 idn = static_cast<uint16>(info[3].As<Napi::Number>().Uint32Value());
        Napi::Buffer<uint8_t> data = info[4].As<Napi::Buffer<uint8_t>>();
        int sz = static_cast<int>(data.Length());
        int wkc = ecx_SoEwrite(&ctx_, slave, driveNo, elementflags, idn, sz, data.Data(), EC_TIMEOUTRXM);
        return Napi::Boolean::New(env, wkc > 0);
    }

    Napi::Value Master::readeeprom(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2)
            return env.Null();
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 eeproma = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 3 && info[2].IsNumber())
            timeout = info[2].As<Napi::Number>().Int32Value();
        uint32 val = ecx_readeeprom(&ctx_, slave, eeproma, timeout);
        return Napi::Number::New(env, val);
    }

    Napi::Value Master::writeeeprom(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 4)
            return Napi::Number::New(env, 0);
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 eeproma = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        uint16 data = static_cast<uint16>(info[2].As<Napi::Number>().Uint32Value());
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 4 && info[3].IsNumber())
            timeout = info[3].As<Napi::Number>().Int32Value();
        int ret = ecx_writeeeprom(&ctx_, slave, eeproma, data, timeout);
        return Napi::Number::New(env, ret);
    }

    Napi::Value Master::APRD(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 3)
            return env.Null();
        uint16 ADP = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 ADO = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        int length = info[2].As<Napi::Number>().Int32Value();
        if (length < 0 || length > 0xFFFF)
            return env.Null();
        std::vector<uint8_t> buf(static_cast<size_t>(length));
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 4 && info[3].IsNumber())
            timeout = info[3].As<Napi::Number>().Int32Value();
        int wkc = ecx_APRD(&ctx_.port, ADP, ADO, static_cast<uint16>(length), buf.data(), timeout);
        if (wkc <= 0)
            return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, buf.data(), length);
    }

    Napi::Value Master::APWR(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 3)
            return Napi::Number::New(env, 0);
        uint16 ADP = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        uint16 ADO = static_cast<uint16>(info[1].As<Napi::Number>().Uint32Value());
        Napi::Buffer<uint8_t> data = info[2].As<Napi::Buffer<uint8_t>>();
        if (data.Length() > 0xFFFF)
            return Napi::Number::New(env, 0);
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 4 && info[3].IsNumber())
            timeout = info[3].As<Napi::Number>().Int32Value();
        int wkc = ecx_APWR(&ctx_.port, ADP, ADO, static_cast<uint16>(data.Length()), data.Data(), timeout);
        return Napi::Number::New(env, wkc);
    }

    Napi::Value Master::LRW(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 3)
            return Napi::Number::New(env, 0);
        uint32 LogAdr = static_cast<uint32>(info[0].As<Napi::Number>().Uint32Value());
        int length = info[1].As<Napi::Number>().Int32Value();
        if (length < 0 || length > 0xFFFF)
            return Napi::Number::New(env, 0);
        Napi::Buffer<uint8_t> buf = info[2].As<Napi::Buffer<uint8_t>>();
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 4 && info[3].IsNumber())
            timeout = info[3].As<Napi::Number>().Int32Value();
        int wkc = ecx_LRW(&ctx_.port, LogAdr, static_cast<uint16>(length), buf.Data(), timeout);
        return Napi::Number::New(env, wkc);
    }

    Napi::Value Master::LRD(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2)
            return env.Null();
        uint32 LogAdr = static_cast<uint32>(info[0].As<Napi::Number>().Uint32Value());
        int length = info[1].As<Napi::Number>().Int32Value();
        if (length < 0 || length > 0xFFFF)
            return env.Null();
        std::vector<uint8_t> buf(static_cast<size_t>(length));
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 3 && info[2].IsNumber())
            timeout = info[2].As<Napi::Number>().Int32Value();
        int wkc = ecx_LRD(&ctx_.port, LogAdr, static_cast<uint16>(length), buf.data(), timeout);
        if (wkc <= 0)
            return env.Null();
        return Napi::Buffer<uint8_t>::Copy(env, buf.data(), length);
    }

    Napi::Value Master::LWR(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 2)
            return Napi::Number::New(env, 0);
        uint32 LogAdr = static_cast<uint32>(info[0].As<Napi::Number>().Uint32Value());
        Napi::Buffer<uint8_t> data = info[1].As<Napi::Buffer<uint8_t>>();
        if (data.Length() > 0xFFFF)
            return Napi::Number::New(env, 0);
        int timeout = EC_TIMEOUTRET;
        if (info.Length() >= 3 && info[2].IsNumber())
            timeout = info[2].As<Napi::Number>().Int32Value();
        int wkc = ecx_LWR(&ctx_.port, LogAdr, static_cast<uint16>(data.Length()), data.Data(), timeout);
        return Napi::Number::New(env, wkc);
    }

    Napi::Value Master::dcsync0(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 4)
            return env.Null();
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        bool act = info[1].As<Napi::Boolean>().Value();
        uint32 CyclTime = static_cast<uint32>(info[2].As<Napi::Number>().Uint32Value());
        int32 CyclShift = static_cast<int32>(info[3].As<Napi::Number>().Int32Value());
        ecx_dcsync0(&ctx_, slave, act, CyclTime, CyclShift);
        return Napi::Boolean::New(env, true);
    }

    Napi::Value Master::dcsync01(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        if (info.Length() < 5)
            return env.Null();
        uint16 slave = static_cast<uint16>(info[0].As<Napi::Number>().Uint32Value());
        bool act = info[1].As<Napi::Boolean>().Value();
        uint32 CyclTime0 = static_cast<uint32>(info[2].As<Napi::Number>().Uint32Value());
        uint32 CyclTime1 = static_cast<uint32>(info[3].As<Napi::Number>().Uint32Value());
        int32 CyclShift = static_cast<int32>(info[4].As<Napi::Number>().Int32Value());
        ecx_dcsync01(&ctx_, slave, act, CyclTime0, CyclTime1, CyclShift);
        return Napi::Boolean::New(env, true);
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

    Napi::Value Master::listInterfaces(const Napi::CallbackInfo &info)
    {
        Napi::Env env = info.Env();
        Napi::Array interfaces = Napi::Array::New(env);

#ifdef _WIN32
        // Windows implementation using WinPcap/Npcap
        ec_adaptert *adapter = nullptr;
        adapter = ec_find_adapters();

        uint32_t index = 0;
        ec_adaptert *current = adapter;
        while (current != nullptr)
        {
            Napi::Object interfaceObj = Napi::Object::New(env);
            interfaceObj.Set("name", Napi::String::New(env, current->name ? current->name : ""));
            interfaceObj.Set("description", Napi::String::New(env, current->desc ? current->desc : ""));
            interfaces.Set(index++, interfaceObj);
            current = current->next;
        }

        // Free the adapter list
        ec_free_adapters(adapter);
#else
        // Linux implementation
        ec_adaptert *adapter = nullptr;
        adapter = ec_find_adapters();

        uint32_t index = 0;
        ec_adaptert *current = adapter;
        while (current != nullptr)
        {
            Napi::Object interfaceObj = Napi::Object::New(env);
            interfaceObj.Set("name", Napi::String::New(env, current->name ? current->name : ""));
            interfaceObj.Set("description", Napi::String::New(env, current->desc ? current->desc : ""));
            interfaces.Set(index++, interfaceObj);
            current = current->next;
        }

        // Free the adapter list
        ec_free_adapters(adapter);
#endif

        return interfaces;
    }

    Napi::Function Master::Init(Napi::Env env)
    {
        Napi::Function func = DefineClass(env, "Master", {InstanceMethod("init", &Master::init), InstanceMethod("configInit", &Master::configInit), InstanceMethod("configMapPDO", &Master::configMapPDO), InstanceMethod("configMapGroup", &Master::configMapGroup), InstanceMethod("state", &Master::state), InstanceMethod("readState", &Master::readState), InstanceMethod("sdoRead", &Master::sdoRead), InstanceMethod("sdoWrite", &Master::sdoWrite), InstanceMethod("sendProcessdata", &Master::sendProcessdata), InstanceMethod("sendProcessdataGroup", &Master::sendProcessdataGroup), InstanceMethod("receiveProcessdata", &Master::receiveProcessdata), InstanceMethod("receiveProcessdataGroup", &Master::receiveProcessdataGroup), InstanceMethod("close", &Master::close), InstanceMethod("writeState", &Master::writeState), InstanceMethod("stateCheck", &Master::stateCheck), InstanceMethod("reconfigSlave", &Master::reconfigSlave), InstanceMethod("recoverSlave", &Master::recoverSlave), InstanceMethod("slaveMbxCyclic", &Master::slaveMbxCyclic), InstanceMethod("mbxHandler", &Master::mbxHandler), InstanceMethod("configDC", &Master::configDC), InstanceMethod("dcsync0", &Master::dcsync0), InstanceMethod("dcsync01", &Master::dcsync01), InstanceMethod("getSlaves", &Master::getSlaves), InstanceMethod("elist2string", &Master::elist2string), InstanceMethod("SoEread", &Master::SoEread), InstanceMethod("SoEwrite", &Master::SoEwrite), InstanceMethod("readeeprom", &Master::readeeprom), InstanceMethod("writeeeprom", &Master::writeeeprom), InstanceMethod("initRedundant", &Master::initRedundant), StaticMethod("listInterfaces", &Master::listInterfaces)});
        constructor = Napi::Persistent(func);
        constructor.SuppressDestruct();
        return func;
    }

    Napi::Object InitAll(Napi::Env env, Napi::Object exports)
    {
        exports.Set("Master", Master::Init(env));
        return exports;
    }

    NODE_API_MODULE(soem_addon, InitAll)

} // namespace soemnode
