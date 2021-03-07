/**
 * @file directive
 * @author duer
 */

/* globals app, $, _, angular, _appEnv, cpp, BMap, BMAP_ANIMATION_BOUNCE, CC, moment, nw */
(function () {

    /* eslint-disable fecs-camelcase, no-var */

    app.directive('sqEnter', function () {
        return {
            restrict: 'A',
            scope: {
                onenter: '&'
            },
            link: function (scope, element, attrs) {
                var input = element.find('.vcode-input');
                setTimeout(function () {
                    element.focus();
                }, 100);
                element.keydown(function (e) {
                    if (!input) {
                        return false;
                    }
                    if (e.keyCode === 13) {
                        console.debug('onenter:', input.val());
                        if (input.val().length > 0) {
                            scope.onenter();
                        }
                        return false;
                    }
                });
            },
            controller: function ($scope) {}
        };
    });
    /* eslint-enable fecs-camelcase */

})();
