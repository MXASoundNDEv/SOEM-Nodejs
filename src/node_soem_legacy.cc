// N-API port of the historical node-soem NAN binding (node-soem-master.cc)
// Exposes a NodeSoemMaster class with methods mapped to SOEM ec_* functions.

#include <napi.h>
#include <string>
#ifdef __cplusplus
extern "C"
{
#endif
#include "ethercat.h"
#ifdef __cplusplus
}
#endif

using namespace Napi;

class NodeSoemMaster : public ObjectWrap<NodeSoemMaster>
{
public:
    static Object Init(Napi::Env env, Object exports)
    {
        Function func = DefineClass(env, "NodeSoemMaster", {
                                                               InstanceMethod("init", &NodeSoemMaster::InitMaster),
                                                               InstanceMethod("configInit", &NodeSoemMaster::ConfigInit),
                                                               InstanceMethod("configMap", &NodeSoemMaster::ConfigMap),
                                                               InstanceMethod("configDC", &NodeSoemMaster::ConfigDC),
                                                               InstanceMethod("sendProcessdata", &NodeSoemMaster::SendProcessdata),
                                                               InstanceMethod("receiveProcessdata", &NodeSoemMaster::ReceiveProcessdata),
                                                               InstanceMethod("writeState", &NodeSoemMaster::WriteState),
                                                               InstanceMethod("readState", &NodeSoemMaster::ReadState),
                                                               InstanceMethod("statecheck", &NodeSoemMaster::Statecheck),
                                                               InstanceMethod("getSlaves", &NodeSoemMaster::GetSlaves),
                                                               InstanceMethod("getInterfaceName", &NodeSoemMaster::GetInterfaceName),
                                                               InstanceMethod("getMap", &NodeSoemMaster::GetMap),
                                                               InstanceMethod("getExpectedWC", &NodeSoemMaster::GetExpectedWC),
                                                           });

        exports.Set("NodeSoemMaster", func);
        return exports;
    }

    NodeSoemMaster(const CallbackInfo &info) : ObjectWrap<NodeSoemMaster>(info)
    {
        Env env = info.Env();
        std::string ifname = "eth0";
        if (info.Length() > 0 && info[0].IsString())
        {
            ifname = info[0].As<String>().Utf8Value();
        }
        ifname_ = strdup(ifname.c_str());
        memset(ioMap_, 0, sizeof(ioMap_));
    }

    ~NodeSoemMaster()
    {
        if (ifname_)
            free(ifname_);
    }

private:
    // Methods
    Value InitMaster(const CallbackInfo &info)
    {
        Env env = info.Env();
        int ret = ec_init(ifname_);
        return Number::New(env, ret);
    }

    Value ConfigInit(const CallbackInfo &info)
    {
        Env env = info.Env();
        int ret = ec_config_init(FALSE);
        return Number::New(env, ret);
    }

    Value ConfigMap(const CallbackInfo &info)
    {
        Env env = info.Env();
        int ret = ec_config_map((void *)&ioMap_);
        return Number::New(env, ret);
    }

    Value ConfigDC(const CallbackInfo &info)
    {
        Env env = info.Env();
        int ret = ec_configdc();
        return Number::New(env, ret);
    }

    Value SendProcessdata(const CallbackInfo &info)
    {
        Env env = info.Env();
        int ret = ec_send_processdata();
        return Number::New(env, ret);
    }

    Value ReceiveProcessdata(const CallbackInfo &info)
    {
        Env env = info.Env();
        int ret = ec_receive_processdata(5000);
        return Number::New(env, ret);
    }

    Value WriteState(const CallbackInfo &info)
    {
        Env env = info.Env();
        if (info.Length() < 2)
        {
            TypeError::New(env, "writeState requires (slave, state)").ThrowAsJavaScriptException();
            return env.Null();
        }
        int slave = info[0].As<Number>().Int32Value();
        int reqstate = info[1].As<Number>().Int32Value();
        ec_slave[slave].state = reqstate;
        int ret = ec_writestate(slave);
        return Number::New(env, ret);
    }

    Value ReadState(const CallbackInfo &info)
    {
        Env env = info.Env();
        int ret = ec_readstate();
        return Number::New(env, ret);
    }

    Value Statecheck(const CallbackInfo &info)
    {
        Env env = info.Env();
        if (info.Length() < 2)
        {
            TypeError::New(env, "statecheck requires (slave, state [, timeout])").ThrowAsJavaScriptException();
            return env.Null();
        }
        int slave = info[0].As<Number>().Int32Value();
        int reqstate = info[1].As<Number>().Int32Value();
        int timeout = 1000;
        if (info.Length() >= 3 && info[2].IsNumber())
            timeout = info[2].As<Number>().Int32Value();
        int ret = ec_statecheck(slave, reqstate, timeout);
        return Number::New(env, ret);
    }

    Value GetSlaves(const CallbackInfo &info)
    {
        Env env = info.Env();
        Array arr = Array::New(env);
        int i = 1;
        while (i <= ec_slavecount)
        {
            Object s = Object::New(env);
            s.Set("name", String::New(env, ec_slave[i].name));
            s.Set("state", Number::New(env, ec_slave[i].state));
            s.Set("ALStatuscode", Number::New(env, ec_slave[i].ALstatuscode));
            s.Set("configadr", Number::New(env, ec_slave[i].configadr));
            s.Set("aliasadr", Number::New(env, ec_slave[i].aliasadr));
            unsigned int numbytes = ec_slave[i].Obytes;
            if ((numbytes == 0) && (ec_slave[i].Obits > 0))
                numbytes = 1;
            if (numbytes > 8)
                numbytes = 8;
            s.Set("Obits", Number::New(env, ec_slave[i].Obits));
            s.Set("Obytes", Number::New(env, ec_slave[i].Obytes));
            s.Set("outputs", ArrayBuffer::New(env, (void *)ec_slave[i].outputs, numbytes));
            numbytes = ec_slave[i].Ibytes;
            if ((numbytes == 0) && (ec_slave[i].Ibits > 0))
                numbytes = 1;
            if (numbytes > 8)
                numbytes = 8;
            s.Set("Ibits", Number::New(env, ec_slave[i].Ibits));
            s.Set("Ibytes", Number::New(env, ec_slave[i].Ibytes));
            s.Set("inputs", ArrayBuffer::New(env, (void *)ec_slave[i].inputs, numbytes));
            s.Set("pdelay", Number::New(env, ec_slave[i].pdelay));
            arr.Set(i - 1, s);
            i++;
        }
        return arr;
    }

    Value GetInterfaceName(const CallbackInfo &info)
    {
        Env env = info.Env();
        return String::New(env, ifname_ ? ifname_ : "");
    }

    Value GetMap(const CallbackInfo &info)
    {
        Env env = info.Env();
        ArrayBuffer buf = ArrayBuffer::New(env, (void *)&ioMap_, sizeof(ioMap_));
        return buf;
    }

    Value GetExpectedWC(const CallbackInfo &info)
    {
        Env env = info.Env();
        int exp = ec_group[0].outputsWKC * 2 + ec_group[0].inputsWKC;
        return Number::New(env, exp);
    }

    char *ifname_{nullptr};
    char ioMap_[4096];
};

Object InitAll(Napi::Env env, Object exports)
{
    return NodeSoemMaster::Init(env, exports);
}

NODE_API_MODULE(node_soem_legacy, InitAll)
