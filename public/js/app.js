(function ($, owner) {

    owner.domain = 'healthpal';

    owner.site = 'http://healthpal.britreasure.com';
    owner.serverapi = owner.site + '/index.php/Api/';
    owner.client = 'android';
    owner.user = null;

    owner.obj = function (id) {
        return document.getElementById(id);
    }

    /**
     * 通用出错消息
     */
    owner.toast = function (msg) {
        if (plus.nativeUI.toast)
            plus.nativeUI.toast(msg);
        else
            toast(msg);
    }

    /**
     * 获取query参数
     */
    owner.getQuery = function (name) {
        var result = location.search.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));
        if (result == null || result.length < 1) {
            return '';
        }
        return result[1];
    }

    /**
     * 通用数据查询方法,封装ajax
     */
    owner.query = function (uri, data, successCallback, errorCallback) {
        var url = owner.serverapi + uri;
        var state = owner.getState();
        data.token = state.token || '';
        var options = {
            data: data,
            dataType: 'json',
            type: 'get',
            success: function (respdata) {
                successCallback(respdata);
            }
            ,
            error: function (response) {
                if (errorCallback)
                    errorCallback(response);
                else
                    mui.toast('query network error', {duration: 'long', type: 'div'});
            }
        }
        $.ajax(url, options);
    }

    /**
     * 通用操作提交方法,封装ajax
     */
    owner.submit = function (uri, data, successCallback, errorCallback) {
        var url = owner.serverapi + uri;
        var state = owner.getState();
        data.token = state.token || '';
        for (var key in data) {
            console.log(key + '-----' + data[key]);
        }

        var options = {
            data: JSON.stringify(data || {}),
            dataType: 'json',
            type: 'post',
            headers: {'Content-Type': 'application/json'},
            //contentType: 'application/x-www-form-urlencoded',
            contentType: 'application/json',
            success: function (resdata) {
                console.log(JSON.stringify(resdata));
                if (resdata.msg != 'ok' && resdata.error == 'invalid_token') {
                    localStorage.removeItem('loginstate');
                    return;
                }

                successCallback(resdata);
            },
            error: function (response) {
                if (errorCallback)
                    errorCallback(response);
                else
                    mui.toast('submit network error', {duration: 'long', type: 'div'});

            }
        }
        $.ajax(url, options);
    }

    /**
     * 用户登录
     **/
    owner.login = function (loginInfo, callback) {
        callback = callback || $.noop;
        loginInfo = loginInfo || {};
        loginInfo.account = loginInfo.account || '';
        loginInfo.password = loginInfo.password || '';
        if (loginInfo.account.length < 5) {
            return callback('账号最短为 5 个字符');
        }

        owner.reqlogin(loginInfo.account, loginInfo.password, callback);


        /*
         var users = JSON.parse(localStorage.getItem('$users') || '[]');
         var authed = users.some(function(user) {
         return loginInfo.account == user.account && loginInfo.password == user.password;
         });
         if (authed) {
         return owner.createState(loginInfo.account, callback);
         } else {
         return callback('用户名或密码错误');
         }*/
    };

    owner.createState = function (name, token, userinfo) {
        var state = owner.getState();
        state.account = name;
        state.token = token;//"token123456789";
        state.userinfo = userinfo;
        owner.setState(state);
    };

    /**
     * 新用户注册
     **/
    owner.reg = function (regInfo, callback) {
        callback = callback || $.noop;
        regInfo = regInfo || {};
        regInfo.account = regInfo.account || '';
        regInfo.password = regInfo.password || '';
        if (regInfo.account.length < 5) {
            return callback('用户名最短需要 5 个字符');
        }
        if (regInfo.password.length < 6) {
            return callback('密码最短需要 6 个字符');
        }
        if (!checkEmail(regInfo.email)) {
            return callback('邮箱地址不合法');
        }
        var users = JSON.parse(localStorage.getItem('$users') || '[]');
        users.push(regInfo);
        localStorage.setItem('users', JSON.stringify(users));
        return callback();
    };

    /**
     * 获取当前状态
     **/
    owner.getState = function () {
        var stateText = localStorage.getItem('loginstate') || "{}";
        var s = JSON.parse(stateText);
        return s == null ? {} : s;
    };

    /**
     * 设置当前状态
     **/
    owner.setState = function (state) {
        state = state || {};
        localStorage.setItem('loginstate', JSON.stringify(state));
        //var settings = owner.getSettings();
        //settings.gestures = '';
        //owner.setSettings(settings);
    };

    var checkEmail = function (email) {
        email = email || '';
        return (email.length > 3 && email.indexOf('@') > -1);
    };

    /**
     * 找回密码
     **/
    owner.forgetPassword = function (email, callback) {
        callback = callback || $.noop;
        if (!checkEmail(email)) {
            return callback('邮箱地址不合法');
        }
        return callback(null, '新的随机密码已经发送到您的邮箱，请查收邮件。');
    };

    /**
     * 获取应用本地配置
     **/
    owner.setSettings = function (settings) {
        settings = settings || {};
        localStorage.setItem('$settings', JSON.stringify(settings));
    };

    /**
     * 设置应用本地配置
     **/
    owner.getSettings = function () {
        var settingsText = localStorage.getItem('$settings') || "{}";
        return JSON.parse(settingsText);
    };
    /**
     * 获取本地是否安装客户端
     **/
    owner.isInstalled = function (id) {
        if (id === 'qihoo' && mui.os.plus) {
            return true;
        }
        if (mui.os.android) {
            var main = plus.android.runtimeMainActivity();
            var packageManager = main.getPackageManager();
            var PackageManager = plus.android.importClass(packageManager)
            var packageName = {
                "qq": "com.tencent.mobileqq",
                "weixin": "com.tencent.mm",
                "sinaweibo": "com.sina.weibo"
            }
            try {
                return packageManager.getPackageInfo(packageName[id], PackageManager.GET_ACTIVITIES);
            } catch (e) {
            }
        } else {
            switch (id) {
                case "qq":
                    var TencentOAuth = plus.ios.import("TencentOAuth");
                    return TencentOAuth.iphoneQQInstalled();
                case "weixin":
                    var WXApi = plus.ios.import("WXApi");
                    return WXApi.isWXAppInstalled()
                case "sinaweibo":
                    var SinaAPI = plus.ios.import("WeiboSDK");
                    return SinaAPI.isWeiboAppInstalled()
                default:
                    break;
            }
        }
    };

    /**
     * 检验登录状态并获取用户身份
     */
    owner.checklogin = function (redirect, params) {
        var state = owner.getState();
        var token = state.token;
        var user = owner.getUser(token);

        if (token) {
            return true;
        }
        else {
            owner.setState(null);
            if (redirect) {
                if (mui.os.plus) {
                    location.href = redirect;
                    return;
                }
                mui.openWindow({
                    url: redirect,
                    id: redirect,
                    extras: params,//自定义扩展参数，可以用来处理页面间传值
                });
            }


        }
    };

    /**
     * 提交服务端进行身份验证
     */
    owner.reqlogin = function (account, password, callback) {
        var reqdata = {'mobile': account, 'password': password, 'client': owner.client};
        owner.submit('Global/Login', reqdata, function (resdata) {
            if (resdata && resdata.token) {
                owner.user = resdata.user;
                owner.createState(resdata.user.username, resdata.token);
                if (callback)
                    callback(resdata);
            }
            else {
                mui.toast(resdata.msg, {duration: 'long', type: 'div'});
                owner.user = null;
                owner.setState(null);
            }
        }, function (res) {
            mui.toast('login fail', {duration: 'long', type: 'div'});
        });
    };

    /**
     * 服务端查询用户信息
     * @param (String)token
     */
    owner.queryUser = function (token, callback) {
        console.log('queryUser ');
        if (localStorage.getItem('user'))
            return JSON.parse(localStorage.getItem('user'));

        if (!token) {
            return null;
        }

        owner.query('Global/getUser', {'client': 'android', 'token': token, 'complete': 1}, function (res) {
            console.log(' localStorage set User ' + JSON.stringify(res.user));
            localStorage.setItem('user', JSON.stringify(res.user));
            // if (res.user.avatar)
            //     localStorage.setItem('avatar', owner.user.avatar);

            if (res.user && callback) {
                callback(res.user);
            }
        }, function () {
            localStorage.removeItem('loginstate');
        });

    };
    /**
     * 服务端查询用户信息
     * @param (String)token
     */
    owner.reGetUser = function (token, callback) {
        if (!token) {
            return null;
        }
        owner.query('Global/getUser', {'client': 'android', 'token': token, 'complete': 1}, function (res) {
            console.log(' localStorage set User ' + JSON.stringify(res.user));
            localStorage.setItem('user', JSON.stringify(res.user));
            if (res.user && callback) {
                callback(res.user);
            }
        }, function () {
            localStorage.removeItem('loginstate');
        });

    };

    /**
     * 获取当前用户身份
     */
    owner.getUser = function (token) {
        var userstr = localStorage.getItem('user');
        if (!userstr) {
            if (token) {
                return owner.queryUser(token);
            }
            else {
                return null;
            }
        }
        else {
            return JSON.parse(userstr);
        }
    };

    // /**
    //  * 页面转向
    //  */
    // owner.tourl = function (url, params, unbounce) {
    //     var param = params || {};
    //
    //     if (!mui.os.plus) {
    //         var paramStr = '';
    //         for (var key in params) {
    //             if (paramStr.indexOf('?') > 0) {
    //                 paramStr = paramStr + '&&' + key + '=' + params[key];
    //                 return;
    //             }
    //             paramStr = '?' + key + '=' + params[key];
    //         }
    //         location.href = url + paramStr;
    //         return;
    //
    //     }
    //     var targetWV = plus.webview.getWebviewById(url);
    //
    //     param.closeAll = true;
    //     if (targetWV) {
    //         targetWV.reload();
    //         targetWV.show('slide-in-right', null, null, param);
    //     } else {
    //         mui.openWindow({
    //             url: url,
    //             id: url,
    //             extras: param,//自定义扩展参数，可以用来处理页面间传值
    //             show: {
    //                 aniShow: 'slide-in-right'
    //             }
    //         });
    //     }
    //
    // };

    /**
     * 页面转向
     */
    owner.tourl = function (url, params, unbounce) {
        var showAni = 'pop-in';
        //只有ios支持的功能需要在Android平台隐藏；
        if (mui.os.android) {
            //Android平台暂时使用slide-in-right动画
            if (parseFloat(mui.os.version) < 4.4) {
                aniShow = "slide-in-right";
            }
        }

        var param = params || {};
        if (!mui.os.plus) {
            var paramStr = '';
            for (var key in params) {
                if (paramStr.indexOf('?') > 0) {
                    paramStr = paramStr + '&&' + key + '=' + params[key];
                    return;
                }
                paramStr = '?' + key + '=' + params[key];
            }
            location.href = url + paramStr;
            return;
        }
        var targetWV = plus.webview.getWebviewById(url);
        if (targetWV) {
            targetWV.show(showAni, null, null, param);
            return;
        }

        var extras = {};

        var webview_style = {
            popGesture: "close",
            statusbar: {
                background: "#008E95"
            }
        };

        if (!unbounce) {
            webview_style.bounce = "vertical";
        }

        mui.openWindow({
            url: url,
            id: url,
            extras: param,//自定义扩展参数，可以用来处理页面间传值
            show: {
                event: "loaded",
                extras: extras
            },
            waiting: {
                autoShow: false
            }
        });


    };

    /**
     * 进入同级TAB页面
     */
    // owner.openWV = function (curWVId, tarUri, params, curAni, tarAni, duration, hide) {
    //     if (!mui.os.plus) {
    //         alert('1----' + tarUri);
    //         var paramStr = '';
    //         for (var key in params) {
    //             if (paramStr.indexOf('?') > 0) {
    //                 paramStr = paramStr + '&&' + key + '=' + params[key];
    //                 return;
    //             }
    //             paramStr = '?' + key + '=' + params[key];
    //         }
    //         if (tarUri == 'HBuilder') {
    //             location.href = '../index.html' + paramStr;
    //             return;
    //         }
    //         location.href = tarUri + paramStr;
    //         return;
    //     }
    //     // alert('2----'+tarUri);
    //
    //     var curWV = plus.webview.getWebviewById(curWVId);
    //     var targetWV = plus.webview.getWebviewById(tarUri);
    //     var param = params || {};
    //     if (tarUri == plus.webview.getLaunchWebview().id || tarUri == './doc/index.html') {
    //         owner.setBack(tarUri);
    //         // if (targetWV && targetWV == plus.webview.getLaunchWebview()) {
    //         //     targetWV.reload();
    //         // }
    //     }
    //     // if (hide) {
    //     //     curWV.hide(curAni, duration);
    //     // }
    //     if (targetWV) {
    //         // alert('3----'+targetWV.id);
    //         targetWV.show(tarAni, duration, null, param);
    //     } else {
    //         // alert('4----'+'open');
    //
    //         mui.openWindow({
    //             url: tarUri,
    //             id: tarUri,
    //             extras: param,//自定义扩展参数，可以用来处理页面间传值
    //             show: {
    //                 aniShow: tarAni,
    //                 duration: duration
    //             }
    //         });
    //     }
    //
    //
    // };


    /**
     * 查看是否删除所有webview
     */
    owner.checkClose = function (close) {
        if (close) {
            owner.closeAll();
        }
    };

    /**
     * 删除所有webview
     */
    owner.closeAll = function () {
        if (!mui.os.plus) {
            return;
        }
        var allWV = plus.webview.all();
        var curWV = plus.webview.currentWebview();
        var lwv = plus.webview.getLaunchWebview();
        for (var i = 0; i < allWV.length; i++) {
            if (allWV[i] == lwv || allWV[i].preload || allWV[i].id == 'index-menu.html') {
                console.log('now' + '----------' + JSON.stringify(allWV[i]));
                continue;
            }
            if (curWV == allWV[i] || allWV[i].id.indexOf(curWV.id) != -1) {
                console.log('now' + '----------' + JSON.stringify(curWV));
                continue;
            }
            console.log('close' + '-----------' + JSON.stringify(allWV[i]));

            allWV[i].close('none');
        }
    };
    /**
     * 添加页面回跳记录
     */
    owner.setBack = function (wvid) {
        localStorage.setItem('backId', wvid)

    };

    /**
     * 页面记录回跳
     */
    owner.backUrl = function () {
        var back = localStorage.getItem('backId');
        var backWV = null;
        if (!mui.os.plus) {

            location.href = '../index.html';
            return;
        }

        backWV = plus.webview.getLaunchWebview();
        backWV.show(null, null, {closeAll: true});
    }

    // 动态计算像素值
    owner.remToPx = function (rem) {
        var htmlFontSize = parseFloat(document.documentElement.style.fontSize);
        return rem * htmlFontSize;
    }

    // 图片处理-------------------------------------------------

    /**
     * 拍照
     */
    owner.getImage = function (callback) {
        var c = plus.camera.getCamera();
        c.captureImage(function (e) {
            plus.io.resolveLocalFileSystemURL(e, function (entry) {
                var s = entry.toLocalURL();// + "?version=" + new Date().getTime();
                owner.uploadImg(s, callback);	//上传图片
                //uploadHead(s);
            }, function (e) {
                mui.toast('读取拍照文件错误', {duration: 'long', type: 'div'});
            });
        }, function (s) {
            console.log("error" + s);
        }, {
            filename: "_doc/head.png"
        });
    };
    /**
     * 相册图片
     */
    owner.galleryImg = function (callback) {
        plus.gallery.pick(function (a) {
            //var name = a.substr(a.lastIndexOf('/') + 1);

            plus.io.resolveLocalFileSystemURL(a, function (entry) {
                owner.compressImage(entry.toLocalURL(), entry.name, callback);

                entry.file(function (file) {
                    var fileReader = new plus.io.FileReader();
                    fileReader.readAsDataURL(file);
                    fileReader.onloadend = function (e) {
                        var picUrl = e.target.result.toString();
                    }
                });

                /*plus.io.resolveLocalFileSystemURL("_doc/", function(root) {
                 root.getFile("head.png", {}, function(file) {
                 //文件已存在
                 file.remove(function() {
                 console.log("file remove success");
                 entry.copyTo(root, 'head.png', function(e) {
                 var e = e.fullPath;// + "?version=" + new Date().getTime();



                 //uploadHead(p); //上传图片
                 //变更大图预览的src
                 //目前仅有一张图片，暂时如此处理，后续需要通过标准组件实现
                 },
                 function(e) {
                 console.log('copy image fail:' + e.message);
                 });
                 }, function() {
                 console.log("delete image fail:" + e.message);
                 });
                 }, function() {
                 //文件不存在
                 entry.copyTo(root, 'head.png', function(e) {
                 var path = e.fullPath;// + "?version=" + new Date().getTime();
                 uploadHead(path); //上传图片
                 },
                 function(e) {
                 console.log('copy image fail:' + e.message);
                 });
                 });
                 }, function(e) {
                 alert("读取拍照文件错误：" + e.message);
                 console.log("get _www folder fail");
                 })*/
            }, function (e) {
                mui.toast('读取拍照文件错误' + e.message, {duration: 'long', type: 'div'});

            });
        }, function (a) {
        }, {
            filter: "image"
        });
    };
    /**
     * 压缩图片
     * @param url,filename
     */
    owner.compressImage = function (url, filename, callback) {
        var name = "_doc/upload/" + filename;
        plus.zip.compressImage({
                src: url,//src: (String 类型 )压缩转换原始图片的路径
                dst: name,//压缩转换目标图片的路径
                quality: 40,//quality: (Number 类型 )压缩图片的质量.取值范围为1-100
                overwrite: true//overwrite: (Boolean 类型 )覆盖生成新文件
            },
            function (event) {
                // console.log(event.target)
                // if (callback) {
                //     callback(event.target)
                // }
                // mui.toast('event ' + event.target, {duration: 'long', type: 'div'});

                owner.uploadImg(event.target, callback);
            }, function (error) {
                plus.nativeUI.toast("压缩图片失败，请稍候再试");
            });
    };

    /**
     * 将图片压缩转成base64
     * @param img
     */
    owner.getBase64Image = function (img) {
        var canvas = document.createElement("canvas");
        var width = img.width;
        var height = img.height;
        // calculate the width and height, constraining the proportions
        if (width > height) {
            if (width > 100) {
                height = Math.round(height *= 100 / width);
                width = 100;
            }
        } else {
            if (height > 100) {
                width = Math.round(width *= 100 / height);
                height = 100;
            }
        }
        canvas.width = width;
        /*设置新的图片的宽度*/
        canvas.height = height;
        /*设置新的图片的长度*/
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        /*绘图*/
        var dataURL = canvas.toDataURL("image/png", 0.8);
        return dataURL.replace("data:image/png;base64,", "");
    };


    /**
     * 上传图片
     * @param src
     */
    owner.uploadImg = function (src, callback) {
        var task = plus.uploader.createUpload(app.serverapi + "Global/SetAvatar", {
            method: 'post',
            blocksize: 204800,
            timeout: 10
        });

        task.addFile(src, {key: 'headImg'});

        task.addData('type', 'uploadImg');
        task.addData('token', state.token);
        task.addEventListener('statechanged', stateChanged, false);
        task.start();
        plus.nativeUI.showWaiting("正在上传...");
        function stateChanged(upload, httpstatus) {
            if (upload.state == 4 && httpstatus == 200) {
                plus.uploader.clear();  //清除上传
                console.log(upload.responseText);  //服务器返回存在这里
                var resp = task;
                if (resp) {
                    if (callback) {
                        callback(src);
                    }
                }
                else
                    mui.toast('网络错误 ', {duration: 'long', type: 'div'});

            }
        }
    };

    // --------------------------------------------------------


}(mui, window.app = {}));