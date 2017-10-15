/**
 * purpose：     SSE通用解决方案
 * author：      仲强
 * version:      0.1
 * date:         2017-10-15
 * email:        gerry.zhong@outlook.com
 * update:          --1.1   提供通用初始化解决方案
 */
(function (window) {
    var initParam = {
        url :'',                                //所链接的服务器地址
        data:'',                                //所发送的客户端数据
        customEvent:[],                         //自定义事件 格式：[{name:'事件名称',callback:function(res){}}]
        withCredentials:false,                 //是否发送跨域凭证
        serverTimeout:60000,                    //服务器http默认超时时间   带考虑：客户端配置服务器时间，不安全
        clientConnection:3000,                  //设置浏览器重连时间，浏览器默认3s重连，
        openEvent:function () {},              //客户端开始链接的事件
        messageEvent:function () {},           //客户端接受到消息的事件（如不自定义系统默认）
        errorEvent:function () {}              //客户端错误事件
    }
    //初始化参数固定类型检查
    var initParamType = {
        url :'String',
        data:'Object',
        customEvent:'Array',
        withCredentials:'Boolean',
        serverTimeout:'Number',
        clientConnection:'Number',
        openEvent:'function',
        messageEvent:'function',
        errorEvent:'function'
    };

    // 依赖的工具类型
    var tool = {
        isSupported:function () {
            if (!EventSource) throw new Error("sorry,your browser does't support this property")
        },
        //类型判断
        is: (function checkType() {
            var is = {
                types: ["Array", "Boolean", "Date", "Number", "Object", "RegExp", "String", "Window", "HTMLDocument", "function", "FormData"]
            };
            for (var i = 0, c; c = is.types[i++];) {
                is[c] = (function (type) {
                    return function (obj) {
                        var temp;
                        if (type === "function") {
                            temp = typeof obj == type
                        } else {
                            temp = Object.prototype.toString.call(obj) == "[object " + type + "]";
                        }
                        return temp;
                    }
                })(c);
            }
            ;
            return is;
        })(),
        // 判断是否是当前自身属性
        hasOwn: function (obj, key) {
            return Object.prototype.hasOwnProperty.call(obj, key)
        },
        //获取对象的key
        keys: function (obj) {
            if (Object.keys) return Object.keys(obj);

            var keys = [];
            for (var key in obj) {
                if (this.hasOwn(obj, key)) keys.push(key);
            }
            ;
            return keys
        },
        //each循环
        each: function (obj, callback) {
            var keys = this.keys(obj);
            if (this.is.Array(obj) && [].forEach) {  //判断是否为数组且支持新特性
                obj.forEach(callback);
            } else {
                var i = 0, len = keys.length, key, item;
                while (i < len) {
                    key = keys[i++];
                    item = obj[key];
                    callback.call(obj, item, key);
                }
            }
        },
        // 合并对象
        MergeObject: function (target, source) {
            if (Object.assign) {
                return Object.assign(target, source)
            }
            var sourceKeys = this.keys(source),
                i = 0
            var len = sourceKeys.length;
            while (i < len) {
                var key = sourceKeys[i++]
                target[key] = source[key];
            }
            return target;
        },
        // 初始化参数
        initParam:function (options) {
            var temp = {};
            tool.MergeObject(temp, initParam);
            //解决深度拷贝引用地址问题
            temp.data = JSON.parse(JSON.stringify(temp.data))
            tool.MergeObject(temp, options);
            tool.checkDataTypeBatch(temp, initParamType);
            return temp;
        },
        //批量检查数据类型和修正
        checkDataTypeBatch: function (obj, objType) {
            tool.each(obj, function (value, key) {
                var typeName = objType[key];
                if (!tool.is[typeName](value)) {
                    obj[key] = initParam[key]
                }
            })
        },
    }

    // 抛出对象
    var output = {
        create:function (options) {
            var param = tool.initParam(options),sendData = '';

            if (param.data){
                tool.each(param.data, function (item, index) {
                    sendData += (index + "=" + item + "&")
                });
                sendData = sendData.slice(0, -1);
            }

            var es = new EventSource(param.url+'?'+sendData);

            es.addEventListener('open',function (e) {
                param.openEvent(e)
            });

            es.addEventListener('message',function (e) {
                param.messageEvent(e)
            });

            es.addEventListener('error',function (e) {
                param.errorEvent(e)
            });

            // 创建用户自定义事件
            if (param.customEvent.length > 0){
                tool.each(param.customEvent,function (item) {
                    es.addEventListener(item.name,item.callback);
                })
            }
        }
    }

    // 注册全局的对象
    window.SSE = new (function () {
        tool.isSupported()    //检测版本
        return output;
    })
})(this)