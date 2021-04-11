/**
 * @file 文件介绍
 * @author
 */
/* globals app, $, _, angular,util,connectService */
app.service('apiModel', function($q, $http, URLS, util, ERRORCODE) {
    var model = {
        http: function(opt, logId) {
            console.log('apimodel:http', opt);
            var def = $q.defer();
            var timeout = 5000;
            if (opt.hasOwnProperty('timeout') && typeof opt.timeout == 'number') {
                timeout = opt.timeout || 5000;
            }
            var timeoutDef = $q.defer();
            logId = logId || util.uuid.generate().replace(/-/g, '');
            opt.timeout = timeoutDef.promise;
            opt.responseType = 'json';
            if (!opt.headers) {
                opt.headers = {
                    'logid': logId,
                };
            }
            if (opt.logid) {
                opt.headers.logid = opt.logid;
            }
            opt.transformRequest = function(obj) {
                var str = [];
                for (var p in obj) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
                return str.join("&");
            };
            if (opt['content-type']) {
                opt.headers['Content-Type'] = opt['content-type'];
                delete opt['content-type'];
            }
            if (opt.cookie) {
                opt.headers['xxx-Cookie'] = opt.cookie;
                delete opt.cookie;
            }
            if (opt.host) {
                opt.headers['xxx-Host'] = opt.host;
                delete opt.host;
            }
            if (opt.origin) {
                opt.headers['xxx-Origin'] = opt.origin;
                delete opt.origin;
            }
            if (opt.referer) {
                opt.headers['xxx-Referer'] = opt.referer;
                delete opt.referer;
            }
            if (opt.userAgent) {
                opt.headers['xxx-User-Agent'] = opt.userAgent;
                delete opt.userAgent;
            }
            var start = Date.now();
            var req = $http(opt);
            var p = def.promise;
            console.debug('http:request:', opt);
            req.then(function(res) {
                console.debug('http:response:', res);
                var end = Date.now();
                if (end - start >= 5000) {
                    console.warn('[apiModel] 网络请求时间超过5s ' + opt.url, opt);
                }
                var data = res.data;
                if (!data) {
                    console.warn('[apiModel] 数据错误', data);
                    if (p.timer) {
                        clearTimeout(p.timer);
                        p.timer = null;
                    }
                    def.reject({
                        msg: '数据错误',
                        status: ERRORCODE.E_DATA_ERROR
                    });
                } else {
                    if (p.timer) {
                        clearTimeout(p.timer);
                        p.timer = null;
                    }
                    def.resolve(data);
                }
            }, function(err) {
                console.warn('[apiModel]http error', err, opt);
                if (p.timer) {
                    clearTimeout(p.timer);
                    p.timer = null;
                }
                def.reject({
                    msg: '网络错误',
                    status: ERRORCODE.E_NETWORKERROR,
                    req: req
                });
            });
            p.cancel = function() {
                if (p.timer) {
                    clearTimeout(p.timer);
                    p.timer = null;
                }
                timeoutDef.resolve({
                    msg: '超时',
                    status: ERRORCODE.E_TIMEOUT,
                    req: req
                });
            };
            p.logId = logId;
            p.timer = setTimeout(function() {
                p.cancel();
            }, timeout);
            return p;
        },
        init: function() {
            return $q.all([
                model.http({
                    url: URLS.kefuClient + '/config'
                }).then(function(data) {
                    data.permission.forEach(function(item) {
                        model.permissionMap[item.key] = item.value;
                    });
                })
            ]);
        }
    };
    return model;
});