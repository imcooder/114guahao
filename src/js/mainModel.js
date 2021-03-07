/**
 * @file 文件介绍
 * @author
 */
/* globals app, $, _, angular,util,connectService */
app.service('mainModel', function($q, $http, util, URLS, ERRORCODE, uploadService, appState, apiModel) {
    var mkdirp = require('mkdirp');
    var fs = require('fs');
    var logDir = appState.tmpDir + '/114/log';
    var logFile = logDir + '/' + moment().format('YYYYMMDD_HHmmss_SSS') + '.log';
    var mainData = {
        listData: [],
        mapData: {},
        isRecording: false,
        isPlaying: false,
        playAudioId: '',
        playAudioUrl: '',
        recordTime: 0,
        playTime: 0,
        appRoot: '',
        recordFileReady: false,
        isCommiting: false,
        commitProgress: 0,
        cookieStatus: '',
        cookie: 'SESSION_COOKIE=3cab1829cea36bdbceb27f7e; Hm_lvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1474767806,1474769522,1476579903,1476591163; Hm_lpvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1476595884; JSESSIONID=6D92BAAA195FE45263B73DA438A02FAC; SESSION_COOKIE=3cab1829cea36bdbceb27f7e; Hm_lvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1474767806,1474769522,1476579903,1476591163; Hm_lpvt_bc7eaca5ef5a22b54dd6ca44a23988fa=1476600780; JSESSIONID=78405A0EEAD3B2BA701A82150FE08FB5',
        hospitalId: '122', //广安门中医院
        departmentId: '', //科室id
        patientId: '', //患者id
        doctorId: '', //医生id
        isDutyDataReady: false,
        dutyDate: "2016-10-16",
        dutyCode: 1, //1：上午 2 下午，4 晚上
        vcode: "",
        vcodeStatus: 0,
        dutySourceId: '',
        status: "",
        dutyMap: {},
        dutyInfo: {},
        querySessionTimer: null,
        confirmStatus: '',
        smsStatus: {},
    };
    var model = {
        mainData: mainData,
        init: function() {
            console.log('mainModel.init');
            var self = this;
            self.mainData.dutyMap = {};
            try {
                self.mainData.dutyMap = JSON.parse(localStorage.getItem('duty_data'));
            } catch (e) {
                console.error('bad duty_data');
            }
            if (!self.mainData.dutyMap) {
                self.mainData.dutyMap = {};
            }
            console.log('dutyMap:', self.mainData.dutyMap);
            self.startDutyTimer(500);
            self.rewriteConsole();
        },
        reloadList: function() {
            mainData.listData.length = 0;
            mainData.mapData = {};
            var self = this;
            var p = util.http({
                url: URLS.list,
            }).then(function(res) {
                console.log('reload success', res);
                if (!res.data.status) {
                    if (angular.isArray(res.data.data)) {
                        res.data.data.forEach(function(item) {
                            var tag = item.tag || '';
                            item.tag = tag.split('|');
                            var id = item['id'];
                            if (!mainData.mapData[id]) {
                                mainData.mapData[id] = item;
                                mainData.listData.push(item);
                            } else {
                                mainData.mapData[id] = angular.extend(mainData.mapData[id], item);
                            }
                        });
                        self.sort();
                    }
                    console.log(mainData.listData);
                    console.log(mainData.mapData);
                }
            }).catch(function(err) {
                console.error('reload failed');
            });
            return p;
        },
        getItem: function(id) {
            if (!mainData.mapData[id]) {
                return false;
            }
            return mainData.mapData[id];
        },
        sort: function() {
            mainData.listData.sort(function(a, b) {
                var timeA = a.time || a.ctime || 0;
                var timeB = b.time || b.ctime || 0;
                return timeB - timeA;
            });
        },
        updateDutyStatus: function(input) {
            //console.debug('updateDutyStatus:', input);
            var self = this;
            var hospitalId = input.hospitalId || '';
            var departmentId = input.departmentId || '';
            var doctorId = input.doctorId || '';
            var dutyDate = input.dutyDate || '';
            var dutyCode = input.dutyCode || '';
            var key = hospitalId + '_' + departmentId + '_' + doctorId + '_' + dutyDate + '_' + dutyCode;
            var item = input;
            if (!self.mainData.dutyMap[key]) {
                self.mainData.dutyMap[key] = item;
            } else {
                angular.extend(self.mainData.dutyMap[key], item);
            }
            self.flushDutyDate();
        },
        getSmsStatus: function(key) {
            var self = this;
            if (!self.mainData.smsStatus.hasOwnProperty(key)) {
                return false;
            }
            return self.mainData.smsStatus[key];
        },
        updateSmsStatus: function(key, value) {
            var self = this;
            if (!key) {
                return self;
            }
            self.mainData.smsStatus[key] = value;
            return self;
        },
        getDutyStatus: function(input) {
            var self = this;
            var hospitalId = input.hospitalId || '';
            var departmentId = input.departmentId || '';
            var doctorId = input.doctorId || '';
            var dutyDate = input.dutyDate || '';
            var dutyCode = input.dutyCode || '';
            var key = hospitalId + '_' + departmentId + '_' + doctorId + '_' + dutyDate + '_' + dutyCode;
            //console.debug('getDutyStatus:', input, key);
            if (!self.mainData.dutyMap.hasOwnProperty(key)) {
                //console.debug('bad data', self.mainData.dutyMap, key);
                return {};
            }
            return self.mainData.dutyMap[key];
        },
        getDuty: function() {
            console.log('getDuty');
            var self = this;
            var data = {};
            data.hospitalId = self.mainData.hospitalId;
            data.departmentId = self.mainData.departmentId;
            data.dutyCode = 1;
            data.dutyDate = self.mainData.dutyDate;
            var opt = {};
            opt.method = 'POST';
            opt['cookie'] = self.mainData.cookie;
            opt['host'] = 'www.bjguahao.gov.cn';
            opt['origin'] = 'http://www.bjguahao.gov.cn';
            opt['referer'] = util.format(URLS.dutyReferer, {
                hospitalId: data.hospitalId,
                departmentId: data.departmentId,
            });
            opt['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
            opt['data'] = data;
            //apiModel.http(opt);
            opt.url = URLS.duty;
            var p = new Promise(function(resolve, reject) {
                apiModel.http(opt).then(function(res) {
                    console.log('getDuty success:', res);
                    mainData.cookieStatus = '登陆状态正确';
                    if (res.code == 200) {
                        // success
                        if (res.data) {
                            res.data.forEach(function(item) {
                                var dutySourceId = item.dutySourceId || '';
                                var doctorName = item.doctorName || '';
                                var dutySourceStatus = item.dutySourceStatus || 0;
                                var doctorId = item.doctorId || '';
                                var hospitalId = item.hospitalId || '';
                                var departmentId = item.departmentId || '';
                                var remainAvailableNumber = item.remainAvailableNumber || 0;
                                angular.extend(item, {
                                    dutyDate: data.dutyDate,
                                    dutyCode: data.dutyCode,
                                });
                                self.updateDutyStatus(item);
                            });
                        }
                        resolve();
                        return;
                    } else if (res.code == 2009) {
                        console.log('用户未登陆');
                        mainData.cookieStatus = '登陆状态错误';
                        reject({
                            status: ERRORCODE.E_NEED_LOGIN,
                            msg: res.msg || '用户未登陆'
                        });
                        return;
                    } else {
                        console.error('验证码失败');
                        reject({
                            status: ERRORCODE.E_UNKNOWN,
                            msg: res.msg || '验证码失败'
                        });
                        return;
                    }
                }).catch(function(err) {
                    console.error('getDuty failed:', err);
                    var res = {
                        status: -1,
                        msg: '错误'
                    };
                    try {
                        res.status = err.status || ERRORCODE.E_UNKNOWN,
                            res.msg = err.msg || '错误'
                    } catch (e) {
                        console.error('error:', e);
                    }
                    reject(res);
                    return;
                });
            });
            return p;
        },
        sendVCode: function() {
            console.log('sendVCode');
            var self = this;
            var p = new Promise(function(resolve, reject) {
                var doctorId = self.mainData.doctorId;
                var dutySourceId = self.mainData.dutySourceId;
                var departmentId = self.mainData.departmentId;
                var hospitalId = self.mainData.hospitalId;
                console.debug('dutySourceId', dutySourceId);
                console.debug('doctorId', doctorId);
                console.debug('departmentId', departmentId);
                console.debug('hospitalId', hospitalId);
                if (!doctorId || !dutySourceId || !departmentId || !hospitalId) {
                    console.error('参数不全');
                    reject({
                        status: ERRORCODE.E_INVALID_PARAM,
                        msg: '参数不全'
                    });
                    return;
                }
                var opt = {};
                opt.method = 'POST';
                opt['cookie'] = self.mainData.cookie;
                opt['host'] = 'www.bjguahao.gov.cn';
                opt['origin'] = 'http://www.bjguahao.gov.cn';
                opt['referer'] = util.format(URLS.vcodeReferer, {
                    hospitalId: hospitalId,
                    departmentId: departmentId,
                    doctorId: doctorId,
                    dutySourceId: dutySourceId,
                });
                opt['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
                opt.data = [];
                opt.url = URLS.sendVCode;
                console.debug('opt:', opt);
                apiModel.http(opt).then(function(res) {
                    console.log('sendVCode return:', res);
                    mainData.cookieStatus = '登陆状态正确';
                    if (res.code == 200) {
                        console.log('验证码成功');
                        self.updateSmsStatus(dutySourceId, true);
                        resolve();
                        return;
                    } else if (res.code == 813) {
                        console.log('用户未登陆');
                        mainData.cookieStatus = '登陆状态错误';
                        reject({
                            status: ERRORCODE.E_NEED_LOGIN,
                            msg: res.msg || '登陆状态错误'
                        });
                        return;
                    } else {
                        console.error('验证码失败');
                        reject({
                            status: ERRORCODE.E_UNKNOWN,
                            msg: res.msg || '验证码失败'
                        });
                        return;
                    }
                }).catch(function(err) {
                    console.error('验证码网络失败');
                    reject({
                        status: ERRORCODE.E_NETWORKERROR,
                        msg: '验证码网络失败'
                    });
                });
            });
            return p;
        },
        confirm: function() {
            console.log('confirm');
            var self = this;
            var p = new Promise(function(resolve, reject) {
                var data = {};
                data.doctorId = self.mainData.doctorId;
                data.dutySourceId = self.mainData.dutySourceId;
                data.departmentId = self.mainData.departmentId;
                data.hospitalId = self.mainData.hospitalId;
                data.patientId = self.mainData.patientId;
                data.hospitalCardId = '';
                data.medicareCardId = '';
                data.reimbursementType = -1;
                data.smsVerifyCode = self.mainData.vcode;
                data.isFirstTime = 2;
                data.hasPowerHospitalCard = '2';
                data.cidType = 1;
                data.childrenBirthday = '';
                data.childrenGender = 2;
                data.isAjax = true;
                console.debug('input', data);
                if (!data.doctorId || !data.departmentId || !data.hospitalId || !data.patientId || !data.smsVerifyCode) {
                    console.error('参数不全');
                    reject({
                        status: ERRORCODE.E_INVALID_PARAM,
                        msg: '参数不全'
                    });
                    return;
                }
                var opt = {};
                opt.method = 'POST';
                opt['cookie'] = self.mainData.cookie;
                opt['host'] = 'www.bjguahao.gov.cn';
                opt['origin'] = 'http://www.bjguahao.gov.cn';
                opt['referer'] = util.format(URLS.vcodeReferer, {
                    hospitalId: data.hospitalId,
                    departmentId: data.departmentId,
                    doctorId: data.doctorId,
                    dutySourceId: data.dutySourceId,
                });
                opt['content-type'] = 'application/x-www-form-urlencoded; charset=UTF-8';
                opt.data = data;
                opt.url = URLS.confirm;
                console.debug('opt:', opt);
                apiModel.http(opt).then(function(res) {
                    console.log('confirm return:', res);
                    mainData.cookieStatus = '登陆状态正确';
                    if (res.code == 200) {
                        console.log('confirm:预约成功');
                        var resData = [];
                        if (angular.isArray(res.data)) {
                            resData = res.data[0];
                        }
                        console.log('data:', resData);
                        var key = 'id_' + Date.now();
                        localStorage.setItem(key, JSON.stringify(resData));
                        resolve(resData);
                        return;
                    } else if (res.code == 813 || res.code == 2009) {
                        console.log('confirm:用户未登陆');
                        mainData.cookieStatus = '登陆状态错误';
                        reject({
                            status: ERRORCODE.E_NEED_LOGIN,
                            msg: res.msg || '用户未登陆'
                        });
                        return;
                    } else if (res.code == 7001) {
                        console.log('confirm:短信验证错误');
                        mainData.vcode = '';
                        reject({
                            status: ERRORCODE.E_NEED_LOGIN,
                            msg: res.msg || '短信验证错误'
                        });
                        return;
                    } else if (res.code == 403) {
                        console.log('confirm:超过停挂时间');
                        reject({
                            status: ERRORCODE.E_403,
                            msg: res.msg || '超过停挂时间'
                        });
                        return;
                    } else {
                        console.error('confirm:失败');
                        reject({
                            status: ERRORCODE.E_UNKNOWN,
                            msg: res.msg || '失败'
                        });
                        return;
                    }
                }).catch(function(err) {
                    console.error('confirm:网络失败');
                    reject({
                        status: ERRORCODE.E_NETWORKERROR,
                        msg: '网络失败'
                    });
                });
            });
            return p;
        },
        processNext: function() {
            console.debug('processNext');
        },
        start: function() {
            console.debug('start');
            var self = this;
            var p = self.getDuty();
            p.then(function(res) {
                console.log("getDuty success");
                mainData.commitProgress = 100;
                //alert('添加成功');
            }).catch(function(e) {
                console.log("getDuty failed:", e);
                mainData.isCommiting = false;
                //alert('添加失败');
            });
        },
        refreshDoctorDutyId: function() {
            console.debug('refreshDoctorDutyId');
        },
        flushDutyDate: function() {
            var self = this;
            localStorage.setItem('duty_data', JSON.stringify(self.mainData.dutyMap));
        },
        checkDuty: function() {
            console.debug('checkDuty');
            var self = this;
            var input = {
                hospitalId: self.mainData.hospitalId,
                departmentId: self.mainData.departmentId,
                doctorId: self.mainData.doctorId,
                dutyDate: self.mainData.dutyDate,
                dutyCode: self.mainData.dutyCode,
            };

            function checkDuty() {
                self.mainData.dutyInfo = {};
                var dutyInfo = self.getDutyStatus(input);
                if (dutyInfo.doctorId && dutyInfo.hasOwnProperty('dutySourceId') && dutyInfo.dutySourceId) {
                    self.mainData.dutyInfo = dutyInfo;
                    util.trigger('doctor_duty_changed');
                    return;
                }
            }
            checkDuty();
            util.trigger('doctor_duty_changed');
            self.getDuty().then(function() {
                checkDuty();
            }).catch(function(err) {
                console.debug('获取值班信息失败:', err);
            });
            return;
        },
        startDutyTimer: function(nextTime = 3000) {
            var self = this;
            self.stopDutyTimer();
            self.querySessionTimer = setInterval(function() {
                self.checkDuty();
            }, nextTime);
            return this;
        },
        stopDutyTimer: function() {
            if (this.querySessionTimer) {
                clearInterval(this.querySessionTimer);
                this.querySessionTimer = null;
            }
        },
        rewriteConsole: function() {
            var methods = ['log', 'warn', 'error', 'info'];
            mkdirp.sync(logDir);
            var fd = logFileFd = fs.openSync(logFile, 'a');
            methods.forEach(function(name) {
                var old = window.console[name];
                var fn = function() {
                    old.apply(window.console, arguments);
                    var logData = '';
                    for (var i = 0; i < arguments.length; i++) {
                        var temp = '';
                        if (i === 0 && _.isString(arguments[i])) {
                            temp = arguments[i];
                        } else {
                            try {
                                temp = JSON.stringify(arguments[i]);
                            } catch (e) {
                                temp = '[Circular]';
                            }
                        }
                        logData += (i > 0 ? '\t' : '') + temp;
                    }
                    var str = [
                        moment().format('YYYYMMDD_HHmmss_SSS'),
                        name,
                        logData
                    ].join('\t') + '\n';
                    fs.write(fd, str, null, 'utf-8');
                    // processService.work('log', {
                    //    logFile: logFile,
                    //    logText: str
                    // });
                };
                window.console[name] = fn;
            });
        },
    };
    util.on('deviceready', function() {})
    util.on('doctor_duty_changed', function() {
        console.debug('doctor_duty_changed');
    });
    return model;
});
