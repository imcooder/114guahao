/**
 * @file duer chat module
 * @author duer
 */

/* globals $, _, angular, _appEnv, CC, moment, nw */
var app = angular.module('114guahao', ['ui.bootstrap']);

(function () {
    var toMap = function (arr) {
        var map = {};
        arr.forEach(function (item) {
            map[item] = item;
        });
        return map;
    };
    var DATA = {
        URLS: {
            host: 'www.114yygh.com',
            status: 'https://www.114yygh.com/web/user/real-name/status?_time=#{now}',
            duty: 'http://www.bjguahao.gov.cn/dpt/partduty.htm',
            patientList: 'https://www.114yygh.com/web/patient/list?_time=#{time}&showType=USER_CENTER',
            deptList: 'https://www.114yygh.com/web/department/hos/list?_time=#{time}&hosCode=#{hospitalId}',
            deptListReferer: 'https://www.114yygh.com/hospital/#{hospitalId}/home',
            dutyReferer: 'http://www.bjguahao.gov.cn/dpt/appoint/#{hospitalId}-#{departmentId}.htm',
            sendVCode: 'http://www.bjguahao.gov.cn/v/sendorder.htm',
            vcodeReferer: 'http://www.bjguahao.gov.cn/order/confirm/#{hospitalId}-#{departmentId}-#{doctorId}-#{dutySourceId}.htm',
            confirm: 'http://www.bjguahao.gov.cn/order/confirm.htm',
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36 Edg/89.0.774.75'
        },
        PATIENT: [
            {
                'id': '123',
                'name': 'test',
            }
        ],
        /* eslint-enable */
        ERRORCODE: {
            E_OK: 'ok',
            E_NETWORKERROR: 'bad_network',
            E_UNKNOWN: 'unknown',
            E_BAD_JSON: 'invalid_json',
            E_TIMEOUT: 'timeout',
            E_CANCEL: 'cancel',
            E_NEED_LOGIN: 'need_login',
            E_ACCOUNT_INVALID: 'account_invalid',
            E_INVALID_PARAM: 'invalid_param',
            E_BAD_SMS: 'bad_sms'
        }
    };

    for (var name in DATA) {
        if (DATA.hasOwnProperty(name)) {
            app.constant(name, DATA[name]);
            // CC[name] = DATA[name];
        }
    }

})();
