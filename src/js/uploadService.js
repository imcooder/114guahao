/**
 * @file 文件介绍
 * @author
 */
/* globals app, $, _, angular,util,connectService */

app.service('uploadService', function ($http, URLS) {
    var model = {
        init: function () {
            console.log('[upload] init');
        },
        upload: function(file) {
            console.log('[upload] file:' + file);
            var fd = new FormData();
            fd.append('file', file);
            var uploadUrl = URLS.upload;
            return $http.post(uploadUrl, fd, {
                transformRequest: angular.identity,
                headers: {'Content-Type': undefined}
            }).success(function(data){
                console.log('success');
                console.log(data);
            }).error(function(err){
                console.log('failed');
                console.error(err);
            });
        }
    };
    model.init();
    return model;
});
