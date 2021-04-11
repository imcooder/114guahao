/**
 * @file 针对网络请求等做全局性的修改
 * @author
 *
 */
/* globals app, $, _, chrome,_appEnv, cpp, CC */
(function() {
    console.debug('chrome:', _appEnv);
    if (_appEnv === 'web') {
        return;
    }
    // 对http请求做必要的header修改
    chrome.webRequest.onBeforeSendHeaders.addListener(function(details) {
        //console.debug('chrome:onBeforeSendHeaders');
        var list = [];
        var xMap = {};
        for (var i = 0; i < details.requestHeaders.length; ++i) {
            if (details.requestHeaders[i].name.startsWith('xxx-')) {
                list.push(details.requestHeaders[i]);
                xMap[details.requestHeaders[i].name.slice(4).toLowerCase()] = 1;
            }
        }
        if (list.length) {
            var index = details.requestHeaders.length - 1;
            while (index >= 0) {
                var h = details.requestHeaders[index];
                if (xMap.hasOwnProperty(h.name.toLowerCase())) {
                    details.requestHeaders.splice(index, 1);
                    //console.debug(h.name.toLowerCase());
                    index--;
                    continue;
                }
                if (h.name.startsWith('xxx-')) {
                    h.name = h.name.slice(4);
                }
                index--;
            }
        }
        return {
            requestHeaders: details.requestHeaders
        };
    }, {
        urls: ['http://*.baidu.com/*', 'https://*.baidu.com/*', 'http://*.bjguahao.gov.cn/*', 'https://*.114yygh.com/*', 'http://*.114yygh.com/*']
    }, ['blocking', 'requestHeaders']);
})();
