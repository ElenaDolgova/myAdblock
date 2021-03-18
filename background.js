"use strict"

var enable = true;

// 1. одинарные палки - полное совпадение домена
// 2. начало с двойных палок - 

// 1. Если url не начинается с / или || это значит 
const badDomains = [
    "google-analyticts.com",
    "www.google-analytics.com",
    "mc.yandex.ru",
    "pagead2.googlesyndication.com",
    "yastatic.net",
    "a.yandex-team.ru",
    "i.stack.imgur.com",
    "cdn.sstatic.net"
    // "/banner/*/img^", // ищем только в pathname. его конец должен быть как /img или /img? или /img/ И содержать /banner/
    // "||ads.example.com^", // ищем только в хосте содержание ads.example.com: или ads.example.com/
    // "|http://example.com/|" // начало с http или https, значит ищем полное совпадение с хостом
]
// предполагается предподготоваить список фильтров в hashMap
//  в котором по ключу будут лежать "разобранные" фильтры
// Например, для "/banner/*/img" в мапе будут лежать /img
// значение, лежащее по ключу - это список обрезанных фильтров. [/banner/*, /add/*/banner/*]

// приходит урл. сначала для него проверяем хост
// после проверяем pathname. берем каждую часть пути, начиная с конца. Часть - это от / до / или от / до ? или от / до ничего
// в pathname в конце просто ничего нет. 
// и потом берем изначальную строку, обрезаем ее до момента встречи с /img и спрашиваем по регекспу какой подходит 

let leetRequestFilter = function(details) {
    const url = new URL(details.url);
    var initiator = details.initiator;
    var host = url.host;
    
    let foundIndex = badDomains.findIndex(item => item == host);
    var block = false;
    var reason = null;
    if(foundIndex == -1) {
        reason = {
            host: [host],
            isGood: true,
            details: ''
        };
    } else {
        reason = {
            host: [host],
            isGood: false,
            details: badDomains[foundIndex]
        };
        block = true;
    }

    chrome.storage.local.get(initiator, function (result) {
        if(isEmpty(result)) {
            console.log('result is null initiator', initiator);
            console.log('result is null', result);
            console.log('result is null reason', reason);
            var reasons = [];
            reasons.push(reason);
            console.log('result is null reasons', reasons);
            chrome.storage.local.set({[initiator]: reasons}, function() {
            });
        } else {
            
            var reasons = [];
        
            // уникальность todo
            for(var key in result) {
                result[key].forEach(function(res, i, arr) {
                    reasons.push(res);
                });
            }
            reasons.push(reason);
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
