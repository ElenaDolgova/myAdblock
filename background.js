"use strict"

var enable = true;

// 1. Если url не начинается с / или || это значит 
const badDomains = [
    "google-analyticts.com",
    "www.google-analytics.com",
    "mc.yandex.ru",
    "pagead2.googlesyndication.com",
    "yastatic.net",
    "a.yandex-team.ru"
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

// var storage = chrome.storage.local;

let leetRequestFilter = function(details) {
    const url = new URL(details.url);
    var host = url.host;
    console.log("host", host);
    let findedIndex = badDomains.findIndex(item => item == host);
    var block = false;
    if(findedIndex == -1) {
        var reason = 'There is good domain ';
        chrome.storage.local.set({[host]: reason}, function() {
        });
    } else {
        // console.log("findedIndex", findedIndex);
        var reason = 'There is bad domain ' + badDomains[findedIndex];
        chrome.storage.local.set({[host]: reason}, function() {
        });
        block = true;
    }

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
