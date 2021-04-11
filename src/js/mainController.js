/**
 * @file 文件介绍
 * @author
 */
/* globals app, $, _, angular,util,connectService */
app.controller('mainController', function($scope, $timeout, $http, mainModel, util, appState, audioModel, PATIENT, ERRORCODE) {
    var AppTabNameMap = {
        view: 0,
        record: 1,
        ci: 2,
        modify: 3
    };
    var defTags = ['召回', '农历', '查看', '生日', '叫早提醒', '天气提醒'];
    $scope.AppTabNameMap = AppTabNameMap;
    $scope.defTags = defTags;
    var viewData = $scope.viewData = {
        app: {},
        displayTab: AppTabNameMap.ci,
        mainData: mainModel.mainData,
        newItem: {
            id: 0,
            query: "",
            type: "",
            tag: [],
        },
        modifyItem: {
            id: 0,
            query: "",
            type: "",
            tag: [],
        },
        vcode: "",
        isModifying: false,
        patientList: PATIENT,
        deptList: mainModel.mainData.deptList
    };
    $scope.mainModel = mainModel;
    var mainData = $scope.mainData = mainModel.mainData;
    var recordMediaTimer = null;
    var recordMedia = null;
    var playMedia = null;
    var playMediaTimer = null;
    var recordingFilePath = '';
    var mediaRecFile = "myRecording100.wav";
    $scope.switch = function(view) {
        viewData.displayTab = view;
        console.log(viewData);
        if (viewData.displayTab == AppTabNameMap.view) {
            reload();
        }
    };

    function commit(item, add = true) {
        console.log('commit', item);
        mainData.isCommiting = true;
        mainData.commitProgress = 0;
        var p = mainModel.uploadRecord(item, add);
        p.then(function(res) {
            mainData.commitProgress = 100;
            console.log("upload record success");
            alert('添加成功');
        }).catch(function(e) {
            console.log("commit failed");
            mainData.isCommiting = false;
            alert('添加失败');
        });
        return p;
    };
    $scope.submit = function() {
        commit(viewData.newItem, true);
    }
    $scope.cancel = function() {
        console.log('cancel');
        mainData.recordFileReady = false;
        return;
    };
    $scope.deleteItem = function(id) {
        console.log('deleteItem:' + id);
        mainModel.delete(id).then(function() {
            console.log('deleteItem:success');
            util.requireUpdateUI();
        }).catch(function() {});
    };

    function stopPlayTimer() {
        if (playMediaTimer) {
            clearInterval(playMediaTimer);
            playMediaTimer = null;
        }
    }
    $scope.reload = function() {
        console.log('reload');
        return;
    }
    $scope.startModify = function(id) {
        console.log('startmodify');
        var item = mainModel.getItem(id);
        if (!item) {
            return;
        }
        viewData.modifyItem = angular.copy(item);
        $scope.switch(AppTabNameMap.modify);
    }
    $scope.commitModify = function() {
        console.log('commit modify');
        commit(viewData.modifyItem, false).then(function() {
            console.log('修改成功');
            viewData.modifyItem = {};
            $scope.switch(AppTabNameMap.view);
            util.requireUpdateUI();
        }).catch(function() {
            console.error('修改失败');
            util.requireUpdateUI();
        });
    }
    $scope.cancelModify = function() {
        console.log('cancel modify');
        viewData.modifyItem = {};
        $scope.switch(AppTabNameMap.view);
        util.requireUpdateUI();
    }

    function reload() {
        mainModel.reloadList();
        console.log(viewData.mainData);
    }

    function refreshDoctorDutyId() {
        //mainModel.
    }

    function initialize() {
        console.log('initialize');
        mainModel.init();
        util.trigger('deviceready');
    };
    $scope.start = function() {
        console.debug('start');
        mainModel.refreshDoctorDutyId();
        mainModel.getDuty().then(function() {
            console.debug('获取duty成功');
            util.requireUpdateUI();
        }).catch(function(err) {
            mainData.status = "获取状态失败";
            console.debug('getDuty failed:', err);
            util.requireUpdateUI();
        });
        util.requireUpdateUI();
    };
    $scope.onReloadPatientList = function () {
        console.debug('reloadPatient');
        mainData.confirmStatus = 'doing';
        mainModel.reloadPatientList().then(function() {
            console.log('reload_patient success');
            util.requireUpdateUI();
        }).catch(function(err) {
            console.log('reload_patient failed:', err);
            if (typeof err == 'number') {
                mainData.confirmStatus = err;
            } else if (typeof err == 'object') {
                mainData.confirmStatus = err.msg || '错误';
            }
            util.requireUpdateUI();
        });
    };
    $scope.onReloadDeptList = function () {
        console.debug('reloadDept');
        // mainData.confirmStatus = 'doing';
        mainModel.reloadDeptList().then(function () {
            console.log('reload_dept success');
            util.requireUpdateUI();
        }).catch(function (err) {
            console.log('reload_dept failed:', err);
            if (typeof err == 'number') {
                mainData.confirmStatus = err;
            } else if (typeof err == 'object') {
                mainData.confirmStatus = err.msg || '错误';
            }
            util.requireUpdateUI();
        });
    };

    function sendVCode() {
        mainData.vcodeStatus = 'doing';
        return mainModel.sendVCode().then(function() {
            console.log('验证码已经成功发送');
            mainData.vcodeStatus = ERRORCODE.E_OK;
            util.requireUpdateUI();
            return 0;
        }).catch(function(err) {
            console.error('发送验证码失败:', err);
            if (typeof err == 'number') {
                mainData.vcodeStatus = err;
            } else if (typeof err == 'object') {
                mainData.vcodeStatus = err.msg || '错误';
            }
            util.requireUpdateUI();
            return -1;
        });
        util.requireUpdateUI();
    }
    $scope.sendVCode = sendVCode;

    function onVcodeReady() {
        console.debug('onVcodeReady');
        mainData.confirmStatus = 'doing';
        mainModel.confirm().then(function() {
            console.log('预约成功');
            mainData.confirmStatus = 'success';
            util.requireUpdateUI();
        }).catch(function(err) {
            console.log('预约失败:', err);
            if (typeof err == 'number') {
                mainData.confirmStatus = err;
            } else if (typeof err == 'object') {
                mainData.confirmStatus = err.msg || '错误';
            }
            util.requireUpdateUI();
        });
    }
    $scope.onVcodeReady = onVcodeReady;

    function onBaseInfoChanged() {
        if (mainData.dutyDate && mainData.doctorId && mainData.patientId && mainData.hospitalId) {
            mainModel.checkDuty();
            util.requireUpdateUI();
            return true;
        }
        return true;
    };
    $scope.$watch('mainData.departmentId', function () {
        console.log('departmentId changed:', mainData.departmentId);
        onBaseInfoChanged();
    });
    $scope.$watch('mainData.dutyDate', function() {
        console.log('dutyDate changed:', mainData.dutyDate);
        onBaseInfoChanged();
    });
    $scope.$watch('mainData.doctorId', function() {
        console.log('doctorId changed:', mainData.doctorId);
        onBaseInfoChanged();
    });
    $scope.$watch('mainData.patientId', function() {
        console.log('patientId changed:', mainData.patientId);
        onBaseInfoChanged();
    });
    $scope.$watch('mainData.hospitalId', function() {
        console.log('hospitalId changed:', mainData.hospitalId);
        mainModel.reloadDeptList().catch(err => {

        });
        onBaseInfoChanged();
    });
    $scope.$watch('mainData.cookie', function() {
        console.log('dutyDate cookie:', mainData.cookie);
        if (mainData.cookie) {
            if (!mainData.dutySourceId) {
                mainModel.checkDuty();
            } else if (!mainModel.getSmsStatus(mainData.dutySourceId)) {
                console.log('自动发送短信');
                sendVCode();
            }
        }
        util.requireUpdateUI();
    });
    util.on('doctor_duty_changed', function() {
        console.log('dutyInfo changed:', mainData.dutyInfo);
        var old = mainData.dutySourceId;
        mainData.dutySourceId = '';
        if (mainData.dutyInfo.hasOwnProperty('dutySourceId')) {
            mainData.dutySourceId = mainData.dutyInfo['dutySourceId'];
        }
        if (old != mainData.dutySourceId) {
            util.trigger('doctor_duty_id_changed');
        }
        util.requireUpdateUI();
    });
    util.on('doctor_duty_id_changed', function() {
        console.log('duty id changed:', mainData.dutySourceId);
        if (mainData.dutySourceId) {
            audioModel.play('file://' + appState.appRootJoin('sound//ready.wav'));
            if (!mainModel.getSmsStatus(mainData.dutySourceId)) {
                console.log('自动发送短信');
                sendVCode();
            }
        }
        util.requireUpdateUI();
    });
    $scope.init = initialize;
    initialize();
});
