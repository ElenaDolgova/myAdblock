"use strict"

var enable = true;

const badDomains = [
    "google-analyticts.com",
    "mc.yandex.ru",
]

let leetRequestFilter = function(details){
    const url = new URL(details.url);
    console.log("Trying to load: ", url);
    console.log("host is: ", url.host);
    console.log("query is: ", url.search);

    const block = false;

    if(block){
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
