/**
 * @file 文件介绍
 * @author
 */
 /* eslint-disable fecs-camelcase */
/* globals app, $, _, angular, cpp, chatModel, CC */
app.factory('util', function ($http, $timeout) {
    var cefEventMap = {};
    cefEvent = function(eventId, eventBody) {
        if (cefEventMap[eventId]) {
            var index = 0;
            while (index < cefEventMap[eventId].length) {
//                try {
                    cefEventMap[eventId][index](eventBody);
//                } catch (e) {
//                    console.error('error_trigger_eventId', e.stack, e);
//                }
                index++;
            }
        }
    };

    var util = {
        _eventMap: cefEventMap,

        requireUpdateUI: function() {
            $timeout(function(){});
        },
        on: function (event, fn) {
            if (!cefEventMap[event]) {
                cefEventMap[event] = [];
            }
            cefEventMap[event].push(fn);
            if (cefEventMap[event].length > 10) {
                console.warn('**wanrning** cpp事件可能有内存泄露，请检查', cpp._eventMap);
            }
        },
        trigger: function(event, data) {
            setTimeout(function() {
                console.log('cpp.trigger', event);
                cefEvent(event, data);
            }, 0);
        },
        argumentsToString: function (args) {
            var str = '';
            for(var i = 0; i < args.length; i++) {
                var item = '';
                try {
                    item = args[i].toString();
                } catch (e) {
                    console.error('error_trigger_eventId', e.stack, e);
                }
                str += item;
                if (i != args.length - 1) {
                    str += ',';
                }
            }
            return str;
        },
        log: function() {
            console.log(this.argumentsToString(arguments));
        },
        error: function() {
            console.error(this.argumentsToString(arguments));
        },
        /**
         * 对文本做HTML转意
         *
         * @param  {string} html url
         * @return {string}
         */
        encodeHtml: function (html) {
            return String(html)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        },
        parseUrl: function (url) {
            var a = document.createElement('a');
            a.href = url;
            return {
                protocol: a.protocol.replace(':', ''),
                host: a.hostname,
                port: a.port,
                query: a.search
            };
        },
        postJson: function (url, data) {
            return $.ajax({
                url: url,
                data: JSON.stringify(data),
                method: 'POST',
                processData: false,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        },

        /**
         * 根据路径返回文件名
         *
         * @param {string} path filepath
         * @return {string}
         */
        getFileNameFromPath: function (path) {
            if (!path) {
                return '(无名称)';
            }
            if (path.lastIndexOf('.') === 0) {
                return path;
            }
            return path.replace(/(\/|\\)+$/, '').replace(/^(\w|\W)+(\\|\/)/, '');
        },
        getFileNameNoExtFromPath: function (path) {
            if (!path) {
                return '';
            }
            if (path.lastIndexOf('.') === 0) {
                return path;
            }
            return this.getFileNameFromPath(path).replace(/\.[^.]+$/, '');
        },
        getFileFolderPath: function (path) {
            if (!path) {
                return '';
            }
            return path.replace(/(\/|\\)[^\/\\]+$/, '');
        },
        getFileExt: function (path) {
            if (!path) {
                return '';
            }
            if (path.lastIndexOf('.') <= 0) {
                return '';
            }
            return path.replace(/(\w|\W)+\./, '');
        },
        // 获取文件大小友好的可读文本
        getFileSizeText: function (v) {
            v = Number(v) || 0;
            var n = 0;
            var f = '';
            var oneKB = 1024;
            var oneMB = oneKB * 1024;
            var oneGB = oneMB * 1024;
            var oneTB = oneGB * 1024;
            if (v > oneTB) {
                n = v / oneTB;
                f = 'TB';
            }
            else if (v > oneGB) {
                n = v / oneGB;
                f = 'GB';
            }
            else if (v > oneMB) {
                n = v / oneMB;
                f = 'MB';
            }
            else if (v > 0) {
                n = v / oneKB;
                f = 'KB';
            }
            else {
                n = 0;
                f = 'KB';
            }
            return n.toFixed(2) + f;
        },

        /**
         * 简单的模板函数
         *
         * @param  {string} source 模板
         * @param  {Object} data 数据
         * @param  {boolean|Function} isHtmlEncode 是否对数据做HTML转义,或者传入转意函数
         * @return {string}
         */
        format: function (source, data, isHtmlEncode) {
            var toString = Object.prototype.toString;
            if (data) {
                return source.replace(/#\{(.+?)\}/g, function (match, key) {
                    var replacer = data[key];
                    // chrome 下 typeof /a/ == 'function'
                    if ('[object Function]' === toString.call(replacer)) {
                        replacer = replacer(key);
                    }
                    if (replacer === undefined) {
                        return '';
                    }
                    if (typeof isHtmlEncode === 'function') {
                        replacer = isHtmlEncode(replacer);
                    }
                    else if (isHtmlEncode) {
                        replacer = util.encodeHtml(replacer);
                    }
                    return replacer;
                });
            }
            return source;
        },


        versionToNumber: function (version) {
            var num = 0;
            if (typeof version !== 'string') {
                return num;
            }
            var items = version.split('.');
            items.forEach(function (i) {
                num = num * 65536 + parseInt(i, 10);
            });
            return num;
        },

        uuid: (function () {
            // Core Component {{{
            function UUID() {
            }

            /**
             * The simplest function to get an UUID string.
             *
             * @return {string} A version 4 UUID string.
             */
            UUID.generate = function () {
                var rand = UUID._getRandomInt;
                var hex = UUID._hexAligner;
                return hex(rand(32), 8) // time_low
                    + '-' + hex(rand(16), 4) // time_mid
                    + '-' + hex(0x4000 | rand(12), 4) // time_hi_and_version
                    + '-' + hex(0x8000 | rand(14), 4) // clock_seq_hi_and_reserved clock_seq_low
                    + '-' + hex(rand(48), 12); // node
            };

            /**
             * Return an unsigned x-bit random integer.
             *
             * @param {number} x A positive integer ranging from 0 to 53, inclusive.
             * @return {number} An unsigned x-bit random integer (0 <= f(x) < 2^x).
             */
            UUID._getRandomInt = function (x) {
                if (x < 0) {
                    return NaN;
                }
                if (x <= 30) {
                    return (0 | Math.random() * (1 << x));
                }
                if (x <= 53) {
                    return (0 | Math.random() * (1 << 30)) + (0 | Math.random() * (1 << x - 30)) * (1 << 30);
                }
                return NaN;
            };

            // Returns a function that converts an integer to a zero-filled string.
            UUID._getIntAligner = function (radix) {
                return function (num, length) {
                    var str = num.toString(radix);
                    var i = length - str.length;
                    var z = '0';
                    for (; i > 0; i >>>= 1, z += z) {
                        if (i & 1) {
                            str = z + str;
                        }
                    }
                    return str;
                };
            };

            UUID._hexAligner = UUID._getIntAligner(16);

            // }}}

            // UUID Object Component {{{

            /**
             * Names of each UUID field.
             * @type string[]
             * @constant
             * @since 3.0
             */
            UUID.FIELD_NAMES = [
                'timeLow',
                'timeMid',
                'timeHiAndVersion',
                'clockSeqHiAndReserved',
                'clockSeqLow',
                'node'
            ];

            /**
             * Sizes of each UUID field.
             * @type int[]
             * @constant
             * @since 3.0
             */
            UUID.FIELD_SIZES = [
                32,
                16,
                16,
                8,
                8,
                48
            ];

            /**
             * Generates a version 4 {@link UUID}.
             *
             * @return {UUID} A version 4 {@link UUID} object.
             * @since 3.0
             */
            UUID.genV4 = function () {
                var rand = UUID._getRandomInt;
                return new UUID()._init(rand(32), rand(16), // time_low time_mid
 0x4000 | rand(12), // time_hi_and_version
 0x80 | rand(6), // clock_seq_hi_and_reserved
 rand(8), rand(48)); // clock_seq_low node
            };

            /**
             * Converts hexadecimal UUID string to an {@link UUID} object.
             *
             * @param {string} strId UUID hexadecimal string representation ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
             * @return {UUID} {@link UUID} object or null.
             * @since 3.0
             */
            /* eslint-disable */
            UUID.parse = function (strId) {
                var r;
                var p = /^\s*(urn:uuid:|\{)?([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{2})([0-9a-f]{2})-([0-9a-f]{12})(\})?\s*$/i;
                if (r = p.exec(strId)) {
                    var l = r[1] || '';
                    var t = r[8] || '';
                    if (((l + t) === '')
                        || (l === '{' && t === '}')
                        || (l.toLowerCase() === 'urn:uuid:' && t === '')
                    ) {
                        return new UUID()._init(parseInt(r[2], 16), parseInt(r[3], 16), parseInt(r[4], 16), parseInt(r[5], 16), parseInt(r[6], 16), parseInt(r[7], 16));
                    }
                }
                return null;
            };
            /* eslint-enable */
            /**
             * Initializes {@link UUID} object.
             *
             * @param {uint32} [timeLow=0] time_low field (octet 0-3).
             * @param {uint16} [timeMid=0] time_mid field (octet 4-5).
             * @param {uint16} [timeHiAndVersion=0] time_hi_and_version field (octet 6-7).
             * @param {uint8} [clockSeqHiAndReserved=0] clock_seq_hi_and_reserved field (octet 8).
             * @param {uint8} [clockSeqLow=0] clock_seq_low field (octet 9).
             * @param {uint48} [node=0] node field (octet 10-15).
             * @return {UUID} this.
             */
            UUID.prototype._init = function () {
                var names = UUID.FIELD_NAMES;
                var sizes = UUID.FIELD_SIZES;
                var bin = UUID._binAligner;
                var hex = UUID._hexAligner;

                /**
                 * List of UUID field values (as integer values).
                 * @type int[]
                 */
                this.intFields = new Array(6);

                /**
                 * List of UUID field values (as binary bit string values).
                 * @type string[]
                 */
                this.bitFields = new Array(6);

                /**
                 * List of UUID field values (as hexadecimal string values).
                 * @type string[]
                 */
                this.hexFields = new Array(6);

                for (var i = 0; i < 6; i++) {
                    var intValue = parseInt(arguments[i] || 0, 10);
                    this.intFields[i] = this.intFields[names[i]] = intValue;
                    this.bitFields[i] = this.bitFields[names[i]] = bin(intValue, sizes[i]);
                    this.hexFields[i] = this.hexFields[names[i]] = hex(intValue, sizes[i] / 4);
                }

                /**
                 * UUID version number defined in RFC 4122.
                 * @type int
                 */
                this.version = (this.intFields.timeHiAndVersion >> 12) & 0xF;

                /**
                 * 128-bit binary bit string representation.
                 * @type string
                 */
                this.bitString = this.bitFields.join('');

                /**
                 * UUID hexadecimal string representation ("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
                 * @type string
                 */
                this.hexString = this.hexFields[0]
                                 + '-' + this.hexFields[1]
                                 + '-' + this.hexFields[2]
                                 + '-' + this.hexFields[3]
                                 + this.hexFields[4] + '-'
                                 + this.hexFields[5];

                /**
                 * UUID string representation as a URN ("urn:uuid:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx").
                 * @type string
                 */
                this.urn = 'urn:uuid:' + this.hexString;

                return this;
            };

            UUID._binAligner = UUID._getIntAligner(2);

            /**
             *
             * Returns UUID string representation.
             *
             * @return {string} {@link UUID#hexString}.
             */
            UUID.prototype.toString = function () {
                return this.hexString;
            };

            /**
             *
             * Tests if two {@link UUID} objects are equal.
             *
             * @param {uuid} uuid xxx
             * @return {bool} True if two {@link UUID} objects are equal.
             */
            UUID.prototype.equals = function (uuid) {
                if (!(uuid instanceof UUID)) {
                    return false;
                }
                for (var i = 0; i < 6; i++) {
                    if (this.intFields[i] !== uuid.intFields[i]) {
                        return false;
                    }
                }
                return true;
            };

            // }}}

            // UUID Version 1 Component {{{

            /**
             *
             * Generates a version 1 {@link UUID}.
             *
             * @return {UUID} A version 1 {@link UUID} object.
             * since 3.0
             */
            UUID.genV1 = function () {
                var now = new Date().getTime();
                var st = UUID._state;
                if (now !== st.timestamp) {
                    if (now < st.timestamp) {
                        st.sequence++;
                    }
                    st.timestamp = now;
                    st.tick = UUID._getRandomInt(4);
                }
                else if (Math.random() < UUID._tsRatio && st.tick < 9984) {
                    // advance the timestamp fraction at a probability
                    // to compensate for the low timestamp resolution
                    st.tick += 1 + UUID._getRandomInt(4);
                }
                else {
                    st.sequence++;
                }

                // format time fields
                var tf = UUID._getTimeFieldValues(st.timestamp);
                var tl = tf.low + st.tick;
                var thav = (tf.hi & 0xFFF) | 0x1000; // set version '0001'

                // format clock sequence
                st.sequence &= 0x3FFF;
                var cshar = (st.sequence >>> 8) | 0x80; // set variant '10'
                var csl = st.sequence & 0xFF;

                return new UUID()._init(tl, tf.mid, thav, cshar, csl, st.node);
            };

            /**
             * Re-initializes version 1 UUID state.
             * since 3.0
             */
            UUID.resetState = function () {
                UUID._state = new UUID._state.constructor();
            };

            /**
             * Probability to advance the timestamp fraction: the ratio of tick movements to sequence increments.
             * @type float
             */
            UUID._tsRatio = 1 / 4;

            /**
             * Persistent state for UUID version 1.
             * @type UUIDState
             */
            UUID._state = new function UUIDState() {
                var rand = UUID._getRandomInt;
                this.timestamp = 0;
                this.sequence = rand(14);
                this.node = (rand(8) | 1) * 0x10000000000 + rand(40); // set multicast bit '1'
                this.tick = rand(4); // timestamp fraction smaller than a millisecond
            };

            UUID._getTimeFieldValues = function (time) {
                var ts = time - Date.UTC(1582, 9, 15);
                var hm = ((ts / 0x100000000) * 10000) & 0xFFFFFFF;
                return {
                    low: ((ts & 0xFFFFFFF) * 10000) % 0x100000000,
                    mid: hm & 0xFFFF,
                    hi: hm >>> 16,
                    timestamp: ts
                };
            };

            // }}}

            // Misc. Component {{{

            /**
             *
             * Reinstalls {@link UUID.generate} method to emulate the interface of UUID.js version 2.x.
             * since 3.1
             * deprecated Version 2.x. compatible interface is not recommended.
             *
             */
            UUID.makeBackwardCompatible = function () {
                var f = UUID.generate;
                UUID.generate = function (o) {
                    return (o && o.version === 1) ? UUID.genV1().hexString : f.call(UUID);
                };
                UUID.makeBackwardCompatible = function () {
                };
            };

            // }}}
            return UUID;

        })(),
        /* eslint-disable */
        // 获取字符串的32位md5
        md5: function md5(string) {
            function md5_RotateLeft(lValue, iShiftBits) {
                return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
            }

            function md5_AddUnsigned(lX, lY) {
                var lX4;
                var lY4;
                var lX8;
                var lY8;
                var lResult;
                lX8 = (lX & 0x80000000);
                lY8 = (lY & 0x80000000);
                lX4 = (lX & 0x40000000);
                lY4 = (lY & 0x40000000);
                lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
                if (lX4 & lY4) {
                    return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
                }
                if (lX4 | lY4) {
                    if (lResult & 0x40000000) {
                        return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
                    }
                    else {
                        return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
                    }
                }
                else {
                    return (lResult ^ lX8 ^ lY8);
                }
            }
            /* eslint-enable */
            function md5_F(x, y, z) {
                return (x & y) | ((~x) & z);
            }

            function md5_G(x, y, z) {
                return (x & z) | (y & (~z));
            }

            function md5_H(x, y, z) {
                return (x ^ y ^ z);
            }

            function md5_I(x, y, z) {
                return (y ^ (x | (~z)));
            }
            /* eslint-disable */
            function md5_FF(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_F(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }

            function md5_GG(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_G(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }

            function md5_HH(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_H(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }

            function md5_II(a, b, c, d, x, s, ac) {
                a = md5_AddUnsigned(a, md5_AddUnsigned(md5_AddUnsigned(md5_I(b, c, d), x), ac));
                return md5_AddUnsigned(md5_RotateLeft(a, s), b);
            }

            function md5_ConvertToWordArray(string) {
                var lWordCount;
                var lMessageLength = string.length;
                var lNumberOfWordsTemp1 = lMessageLength + 8;
                var lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
                var lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
                var lWordArray = Array(lNumberOfWords - 1);
                var lBytePosition = 0;
                var lByteCount = 0;
                while (lByteCount < lMessageLength) {
                    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                    lBytePosition = (lByteCount % 4) * 8;
                    lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
                    lByteCount++;
                }
                lWordCount = (lByteCount - (lByteCount % 4)) / 4;
                lBytePosition = (lByteCount % 4) * 8;
                lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
                lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
                lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
                return lWordArray;
            }
            /* eslint-enable */
            function md5_WordToHex(lValue) {
                var wordToHexValue = '';
                var wordToHexValueTemp = '';
                var lByte;
                var lCount;
                for (lCount = 0; lCount <= 3; lCount++) {
                    lByte = (lValue >>> (lCount * 8)) & 255;
                    wordToHexValueTemp = '0' + lByte.toString(16);
                    wordToHexValue = wordToHexValue + wordToHexValueTemp.substr(wordToHexValueTemp.length - 2, 2);
                }
                return wordToHexValue;
            }

            function md5_Utf8Encode(string) {
                string = string.replace(/\r\n/g, '\n');
                var utftext = '';
                for (var n = 0; n < string.length; n++) {
                    var c = string.charCodeAt(n);
                    if (c < 128) {
                        utftext += String.fromCharCode(c);
                    }
                    else if ((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                    else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                    }
                }
                return utftext;
            }

            var x = [];
            var k;
            var AA;
            var BB;
            var CC;
            var DD;
            var a;
            var b;
            var c;
            var d;
            var S11 = 7;
            var S12 = 12;
            var S13 = 17;
            var S14 = 22;
            var S21 = 5;
            var S22 = 9;
            var S23 = 14;
            var S24 = 20;
            var S31 = 4;
            var S32 = 11;
            var S33 = 16;
            var S34 = 23;
            var S41 = 6;
            var S42 = 10;
            var S43 = 15;
            var S44 = 21;
            string = md5_Utf8Encode(string);
            x = md5_ConvertToWordArray(string);
            a = 0x67452301;
            b = 0xEFCDAB89;
            c = 0x98BADCFE;
            d = 0x10325476;
            for (k = 0; k < x.length; k += 16) {
                AA = a;
                BB = b;
                CC = c;
                DD = d;
                a = md5_FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
                d = md5_FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
                c = md5_FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
                b = md5_FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
                a = md5_FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
                d = md5_FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
                c = md5_FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
                b = md5_FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
                a = md5_FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
                d = md5_FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
                c = md5_FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
                b = md5_FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
                a = md5_FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
                d = md5_FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
                c = md5_FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
                b = md5_FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
                a = md5_GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
                d = md5_GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
                c = md5_GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
                b = md5_GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
                a = md5_GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
                d = md5_GG(d, a, b, c, x[k + 10], S22, 0x2441453);
                c = md5_GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
                b = md5_GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
                a = md5_GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
                d = md5_GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
                c = md5_GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
                b = md5_GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
                a = md5_GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
                d = md5_GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
                c = md5_GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
                b = md5_GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
                a = md5_HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
                d = md5_HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
                c = md5_HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
                b = md5_HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
                a = md5_HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
                d = md5_HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
                c = md5_HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
                b = md5_HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
                a = md5_HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
                d = md5_HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
                c = md5_HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
                b = md5_HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
                a = md5_HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
                d = md5_HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
                c = md5_HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
                b = md5_HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
                a = md5_II(a, b, c, d, x[k + 0], S41, 0xF4292244);
                d = md5_II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
                c = md5_II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
                b = md5_II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
                a = md5_II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
                d = md5_II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
                c = md5_II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
                b = md5_II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
                a = md5_II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
                d = md5_II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
                c = md5_II(c, d, a, b, x[k + 6], S43, 0xA3014314);
                b = md5_II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
                a = md5_II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
                d = md5_II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
                c = md5_II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
                b = md5_II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
                a = md5_AddUnsigned(a, AA);
                b = md5_AddUnsigned(b, BB);
                c = md5_AddUnsigned(c, CC);
                d = md5_AddUnsigned(d, DD);
            }
            return (md5_WordToHex(a) + md5_WordToHex(b) + md5_WordToHex(c) + md5_WordToHex(d)).toLowerCase();
        },
        http: function (opt) {
            opt = angular.extend({
                method: 'GET',
                responseType: 'json',
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json'
                }
            }, opt);
            var start = Date.now();
            var req = $http(opt);
            req.then(function (res) {
                var end = Date.now();
                if (end - start >= 5000) {
                    console.warn('网络请求时间超过5s' + opt.url, opt);
                }
                var data = res.data;
                if (!data) {
                }
                else {
                    if (data.status === 0) {
                    }
                    else if (data.status === 2) {
                        console.log('未登录或者登录信息已失效，请重启客户端');
                    }
                    else {
                    }
                }
            }, function (err) {
                console.log('[http error apiModel]:', err, opt);
            });
            return req;
        },
        httpPost: function (opt, logId) {
            var def = $q.defer();
            // var timeoutDef = $q.defer();
            logId = logId || util.uuid.generate().replace(/-/g, '');
            // opt.timeout = timeoutDef.promise;
            opt.responseType = 'json';
            opt.headers = {
                SaiyaLogID: logId
            };
            opt.gzip = true;
            var request = require('request');
            if (_.isString(opt.cookie)) {
                var j = request.jar();
                var cookie = request.cookie(opt.cookie);
                j.setCookie(cookie, opt.url);
                opt.jar = j;
                delete opt.cookie;
            }
            var responseData = '';
            var start = Date.now();
            var theRequest = request.post(opt, function (err, response, body) {
                var end = Date.now();
                if (end - start >= 5000) {
                    console.warn('网络请求时间超过5s' + opt.url, opt);
                }
                if (err) {
                    console.log('[http error httpPost]:', err, opt);
                    def.reject({
                        status: ERRORCODE.E_NETWORKERROR,
                        msg: 'net error'
                    });
                    return;
                }
                responseData = body;
                var data = null;
                try {
                    console.log('[httpPost]', opt, response);
                    data = JSON.parse(responseData);
                    console.debug('[httpPost]', {
                        request: opt,
                        url: opt.url,
                        // 这块不要随便改, 因为data可能被其他地方修改
                        response: JSON.parse(responseData)
                    });
                }
                catch (e) {
                    data = null;
                }
                if (!data) {
                    def.resolve({
                        status: ERRORCODE.E_BAD_JSON,
                        msg: 'bad json'
                    });
                    return;
                }
                if (data.status === 0) {
                    def.resolve(data.data);
                }
                else {
                    def.reject(data);
                }
                return;
            });
            var p = def.promise;
            p.cancel = function () {
                theRequest.abort();
                def.reject({
                    status: ERRORCODE.E_TIMEOUT,
                    msg: 'timeout'
                });
                return;
            };
            p.logId = logId;
            return p;
        }
    };
    //CC.util = util;
    return util;
});
