/**
 * @file 文件介绍
 * @author
 */
/* globals app, $, _, angular,util,connectService */
app.service('audioModel', function () {
    var $audio = null;
    var ps = null;

    var model = {
        play: function (url) {
            if ($audio) {
                $audio.remove();
                $audio = null;
            }
            $audio = $('<audio src="' + url + '" autoplay></audio').appendTo(document.body);
            var audio = $audio.get(0);
            var promise = new Promise(function (resolve, reject) {
                audio.onerror = function () {
                    console.error('audio error');
                    $audio.remove();
                    reject();
                };
                audio.onended = function () {
                    $audio.remove();
                    console.log('play end:' + url);
                    resolve();
                };
            });
            return promise;
        },
        stop: function () {
            if ($audio) {
                $audio.remove();
                $audio = null;
            }
        }
    };
    return model;
});
