"use strict"

var enable = true;

// 1. Если url не начинается с / или || это значит 
const badDomains = [
    "google-analyticts.com",
    "mc.yandex.ru",
    "/banner/*/img^", // ищем только в pathname. его конец должен быть как /img или /img? или /img/ И содержать /banner/
    "||ads.example.com^", // ищем только в хосте содержание ads.example.com: или ads.example.com/
    "|http://example.com/|" // начало с http или https, значит ищем полное совпадение с хостом
]
// предполагается предподготоваить список фильтров в hashMap
//  в котором по ключу будут лежать "разобранные" фильтры
// Например, для "/banner/*/img" в мапе будут лежать /img
// значение, лежащее по ключу - это список обрезанных фильтров. [/banner/*, /add/*/banner/*]

// приходит урл. сначала для него проверяем хост
// после проверяем pathname. берем каждую часть пути, начиная с конца. Часть - это от / до / или от / до ? или от / до ничего
// в pathname в конце просто ничего нет. 
// и потом берем изначальную строку, обрезаем ее до момента встречи с /img и спрашиваем по регекспу какой подходит 

var storage = chrome.storage.local;

let leetRequestFilter = function(details) {
    const url = new URL(details.url);
    // console.log("Trying to load: ", url);
    // console.log("host is: ", url.host);
    // console.log("query is: ", url.search);
    var host = url.host
    
    storage.set({[host]: host}, function() {
        console.log('Value is set to ' + host);
    });

    storage.get(null, function (result) {
        console.log('try to get', result);
    });

    const block = false;
    // вот тут для url проверяем нужно его блокировать или нет
    // можно ли сделать глобальную мапу, в которую складывать url и причину скрытия (если есть), чтобы потом отобразить 
    // на all_urls.html ?

    // можно ли в мапе искать по регекспу? как меньше
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
