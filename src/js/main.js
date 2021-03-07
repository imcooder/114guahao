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
            duty: 'http://www.bjguahao.gov.cn/dpt/partduty.htm',
            dutyReferer: 'http://www.bjguahao.gov.cn/dpt/appoint/#{hospitalId}-#{departmentId}.htm',
            sendVCode: 'http://www.bjguahao.gov.cn/v/sendorder.htm',
            vcodeReferer: 'http://www.bjguahao.gov.cn/order/confirm/#{hospitalId}-#{departmentId}-#{doctorId}-#{dutySourceId}.htm',
            confirm: 'http://www.bjguahao.gov.cn/order/confirm.htm',
        },
        PATIENT: [
            {
                'id': '123',
                'name': 'test',
            }
        ],
        /* eslint-enable */
        ERRORCODE: {
            // 服务器定义 不可修改
            E_OK: 0,
            E_OOM: 1,
            E_SYS_ERROR: 2,
            E_DATA_ERROR: 3,
            E_DATA_INCOMPLETE: 4,
            E_DATA_OVERFLOW: 5,
            E_CONF_ERROR: 6,
            E_NETWORKERROR: 7,
            E_UNKNOWN: 8,
            E_RE_LOGIN: 9,
            E_MULTI_LOGIN: 10,
            E_SAIYA_ALL: 11,
            // 自定义
            E_BAD_JSON: 12,
            E_HANDSHAKE_ERROR: 13,
            E_TIMEOUT: 14,
            E_CANCEL: 15,
            E_LOGOUT: 16,
            E_NO_UPDATE: 17,
            E_NORMAL_ERROR: 18,
            E_FILE_NOT_EXIST: 19,
            E_FILE_WRITE_ERROR: 20,
            E_FILE_DELETE_ERROR: 21,
            E_FILE_EXIST: 22,
            E_NEED_LOGIN: 23,
            E_ACCOUNT_INVALID: 24,
            E_SERVER_CONDIG_ERROR: 25,
            E_INVALID_PARAM: 26,
            E_BAD_SMS: 27,
            E_403: 403,
        }
    };

    for (var name in DATA) {
        if (DATA.hasOwnProperty(name)) {
            app.constant(name, DATA[name]);
            // CC[name] = DATA[name];
        }
    }

})();
