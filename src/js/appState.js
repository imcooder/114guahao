/**
 * @file 文件介绍
 * @author
 */
/* globals app, $, _, angular,util,connectService */
app.service('appState', function(util) {
    var model = {
        appRoot: '',
        tmpDir: '', // 临时目录
        init: function() {
            console.log(navigator);
            var gui = require('nw.gui');
            var path = require('path');
            var os = require('os');
            var win = gui.Window.get();
            this.appRoot = window.appRootDir;
            this.appPath = path.dirname(process.execPath);
            this.tmpDir = os.tmpdir();
            this.appRoot = path.resolve('.');
            console.debug(this.appRoot);
            console.debug(this.appPath);
        },
        isIOS: function() {
            return navigator.platform == 'iPhone';
        },
        isAndroid: function() {
            return navigator.userAgent.match(/linux/i);
        },
        isWeb: function() {
            return navigator.platform == 'win32';
        },
        path: function() {
            var path = require('path');
            if (process.platform.startsWith('win')) {
                path = path.win32;
            }
            return path.join.apply(path, arguments);
        },
        appPathJoin: function() {
            var args = [
                this.appPath
            ].concat(_.toArray(arguments));
            return this.path.apply(this, args);
        },
        appRootJoin: function() {
            var args = [
                this.appRoot
            ].concat(_.toArray(arguments));
            return this.path.apply(this, args);
        },
        onDeviceReady: function() {
            console.log('appState onDeviceReady');
            var self = this;
            window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, function(fileSystem) {
                console.log(fileSystem.name);
                console.log(fileSystem.root.name);
                appRoot = fileSystem.name;
                fileSystem.root.getDirectory("data", {
                    create: true
                }, function(fileEntry) {
                    console.log('create data dir success', fileEntry);
                    self.appRoot = fileEntry.fullPath;
                    console.log('appRoot:' + self.appRoot);
                }, function() {
                    console.error('create data dir failed');
                });
                fileSystem.root.getDirectory("data/tmp", {
                    create: true
                }, function(fileEntry) {
                    console.log('create data dir success', fileEntry);
                    self.tmpDir = fileEntry.fullPath;
                    console.log('tmpDir:' + self.tmpDir);
                }, function() {
                    console.error('create data dir failed');
                });
            }, null);
        },
    };
    model.init();
    util.on('deviceready', function() {
        model.onDeviceReady();
    });
    return model;
});
