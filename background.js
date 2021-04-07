"use strict"

var enable = true;

const badDomains = [
    "||saas.kek^",
    "||saas.kek.bar^",
    "||saas.bar^",
    "||kek.bar.saas^",
    "||kek.bar^",
    "||bar^",
    "||yastatic.net^",
    "||imgur.com^",
    "||yandex-team.ru^",
    "google-analyticts.com",
    "www.google-analytics.com",
    "mc.yandex.ru",
    "pagead2.googlesyndication.com",
    "|a.yandex-team.ru|",
    "|yt.yandex-team.ru|",
    "|tsum.yandex-team.ru|",
    "sb.scorecardresearch.com^",
    "/banner/*/img^",
    "/rpc/instances/GetRevisionStats^",
    // "/banner/*/img^", // ищем только в pathname. его конец должен быть как /img или /img? или /img/ И содержать /banner/
    // "||ads.example.com^", // ищем только в хосте содержание ads.example.com: или ads.example.com/
    // "|http://example.com/|" // начало с http или https, значит ищем полное совпадение с хостом
]

let parseHashRegexFullDomain = function() {
    var hashRegexFullDomain = {};
    const regexFullDomain = new RegExp('^\\|.*\\|$');
    
    badDomains.forEach(function(domain, i, arr) {
        if (regexFullDomain.test(domain)) {
            let d = domain.substr(1, domain.length - 2);
            hashRegexFullDomain[d] = domain;
        }
    });
    return hashRegexFullDomain;
}

let parseUrlsHashRegexContainsDomain = function() {
    var hashRegexContainsDomain = {};
    const regexContainsDomain = new RegExp('^\\|\\|.*\\^$');
    
    badDomains.forEach(function(domain, i, arr) {
        if(regexContainsDomain.test(domain)) {
            let d = domain.substr(2, domain.length - 3);
            console.log("split ", d);
            let lastKey = NaN;
            let lastTable = NaN;
            d.split(".").forEach(function(splitStr, i, arr) {
                console.log("splitting ", splitStr);
                if(lastKey) {
                    if(lastTable[splitStr]) {
                        lastTable = lastTable[splitStr];
                        lastKey = splitStr;
                    } else {
                        let newLastTable = {};
                        lastTable[splitStr] = newLastTable;
                        lastTable = newLastTable;
                        lastKey = splitStr;
                     }
                } else {
                    if(hashRegexContainsDomain[splitStr]) {
                        lastTable = hashRegexContainsDomain[splitStr];
                        lastKey = splitStr;
                    } else {
                        lastTable = {}
                        lastKey = splitStr;
                        hashRegexContainsDomain[splitStr] = lastTable;
                    }
                }
            });
        }
    });
    return hashRegexContainsDomain;
}

let parseHashRegexContains = function() {
    var hashRegexContains = [];
    const regexContainsPathName = new RegExp('[^\\|].*\^$');
    
    badDomains.forEach(function(domain, i, arr) {
       if(regexContainsPathName.test(domain)) {
            let d = domain.substr(0, domain.length - 1);
            console.log("regexContainsPathName ", d);
            hashRegexContains.push(d);
        }
    });
    return hashRegexContains;
}


var hashRegexFullDomain = parseHashRegexFullDomain();
var hashRegexContainsDomain = parseUrlsHashRegexContainsDomain();
var hashRegexContains = parseHashRegexContains();

let leetRequestFilter = function(details) {

    const url = new URL(details.url);
    let initiator = details.initiator;
    let host = url.host;

    let block = false;
    let reason = {
        host: host,
        isGood: true,
        details: ''
    };

    if(hashRegexFullDomain[host]) {
    reason = {
        host: host,
        isGood: false,
        details: hashRegexFullDomain[host]
    };
        block = true;
    }

    if(!block) {
        let isContains = false;
        let lastFountTable = NaN;
        host.split(".").forEach(function(splitHost, i, arr) { // ищем пока не конец или пока не нашли
           if(hashRegexContainsDomain[splitHost]) {
            lastFountTable = hashRegexContainsDomain[splitHost];
           } 
        });
    for(let key in hashRegexContainsDomain) { // contains 
        let reg = new RegExp(key);
        if(reg.test(host)) {
            reason = {
                host: host,
                isGood: false,
                details: hashRegexContainsDomain[key]
            };
            block = true;
        }
    }
}

    let path = url.pathname;
    if(!block) {
        hashRegexContains.forEach(function(res, i, arr) {
            let reg = new RegExp(res);
            if(reg.test(path)){
                reason = {
                    host: path,
                    isGood: false,
                    details: res
                };
                block = true;
            }
        });
    }

    chrome.storage.local.get(initiator, function (result) {
        if(isEmpty(result)) {
            let reasons = [];
            reasons.push(reason);
            chrome.storage.local.set({[initiator]: reasons}, function() {
            });
        } else {
            let reasons = [];
        
            let isNeedToAdd = true;
            for(let key in result) {
                result[key].forEach(function(res, i, arr) {
                    if(res.host == reason.host){
                        isNeedToAdd = false;
                    }
                    reasons.push(res);
                });
            }
            if(isNeedToAdd) {
                reasons.push(reason);
            }
            chrome.storage.local.set({[initiator]: reasons}, function() {
            });
        }
    });

    if(block) {
        console.log("BLOCKED: ", url.host);
    }
    return {cancel: block};
}

chrome.webRequest.onBeforeRequest.addListener(
    leetRequestFilter,
    {
        urls:["http://*/*","https://*/*"]
    },
    ["blocking"]
);

function isEmpty(obj) {

    // null and undefined are "empty"
    if (obj == null) return true;

    // Assume if it has a length property with a non-zero value
    // that that property is correct.
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;

    // If it isn't an object at this point
    // it is empty, but it can't be anything *but* empty
    // Is it empty?  Depends on your application.
    if (typeof obj !== "object") return true;

    // Otherwise, does it have any properties of its own?
    // Note that this doesn't handle
    // toString and valueOf enumeration bugs in IE < 9
    for (var key in obj) {
        if (hasOwnProperty.call(obj, key)) return false;
    }

    return true;
}
