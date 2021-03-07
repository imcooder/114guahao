/**
 * @file 文件介绍
 * @author
 */
/* globals app, $, _, angular,util,connectService */
app.filter('time', function() {
    return function(t) {
        var d = new Date(t * 1000);
        return d.toLocaleString('zh-cn');
    };
});
app.filter('newline', function() {
    return function(str) {
        if (typeof str !== 'String') {
            return str;
        }
        return str.replace(/<n>/gi, '\n');
    };
});
app.filter('timeEclipse', function() {
    return function(t) {
        var sec = parseInt(t, 10);
        if (sec <= 0) {
            return '';
        }
        var str = '';
        if (sec > 60 * 60) {
            str += parseInt(sec / (60 * 60), 10) + '小时';
            sec = sec % (60 * 60);
        }
        if (sec > 60) {
            str += parseInt(sec / (60), 10) + '分';
            sec = sec % (60);
        }
        if (sec) {
            str += sec + '秒';
        }
        return str;
    };
});
app.filter('error', function(ERRORCODE) {
    return function(t) {
        var str = '';
        if (typeof t == 'string') {
            str = t;
        } else if (typeof t == 'number') {
            var code = parseInt(t);
            if (ERRORCODE.E_NEED_LOGIN == code) {
                str = '登陆错误';
            } else if(ERRORCODE.E_INVALID_PARAM == code) {
                str = '参数错误';
            } else if (ERRORCODE.E_BAD_SMS == code) {
                str = '短信验证码错误';
            } else if(ERRORCODE.E_403 == code) {
                str = "超过停挂时间";
            }  else {
                str = '' + code;
            }
        } else {
            str = (typeof t);
        }
        return str;
    };
});

app.filter('sms_status', function(ERRORCODE) {
    return function(t) {
        var str = '';
        if (typeof t == 'string') {
            str = t;
        } else {
            var code = parseInt(t);
            if (ERRORCODE.E_NEED_LOGIN == code) {
                str = '登陆错误';
            } else if(ERRORCODE.E_INVALID_PARAM == code) {
                str = '参数错误';
            } else {
                str = '' + code;
            }
        }
        return str;
    };
});
