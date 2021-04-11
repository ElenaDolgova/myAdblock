"use strict"

var enable = true;

const badDomains = [
    "||saas.kek^",
    "||saas.kek.lol.bar^",
    "||saas.bar^",
    "||kek.bar.saas^",
    "||kek.bar^",
    "||bar^",
    "||yastatic.net^",
    "||imgur.com^",
    "||yandex-team.ru^",
    "||google-analytics.com^",
    "www.google-analytics.com",
    "||mc.yandex.ru^",
    "||pagead2.googlesyndication.com^",
    "|a.yandex-team.ru|",
    "|yt.yandex-team.ru|",
    "|tsum.yandex-team.ru|",
    "/banner/*/img^",
    "/*/banner/img^",
    "/banner/img/*^",
    "/banner/*/popy/hop^", 
    "/metrika/*^",
    "/global-notifications/*/butterfly.js^",
    "/static/media/*^"
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
            let lastTable = NaN;
            d.split(".").forEach(function(splitStr, i, arr) {
                let leaf = (i == arr.length - 1);
                let reason = NaN;
                if(leaf){
                    reason = domain;
                }
                if(lastTable) {
                    if(lastTable.tree[splitStr]) {
                        lastTable = lastTable.tree[splitStr];
                        if (leaf) {
                            lastTable.isLeaf = leaf;
                            lastTable.reason = reason;
                        }
                    } else {
                        let newLastTable = {isLeaf: leaf, tree : {}, reason: reason};
                        lastTable.tree[splitStr] = newLastTable;
                        lastTable = newLastTable;
                     }
                } else {
                    if(hashRegexContainsDomain[splitStr]) {
                        lastTable = hashRegexContainsDomain[splitStr];
                        if(leaf) {
                            lastTable.isLeaf = leaf;
                        }
                    } else {
                        lastTable = {isLeaf: leaf, tree : {}, reason: reason};
                        hashRegexContainsDomain[splitStr] = lastTable;
                    }
                }
            });
        }
    });
    return hashRegexContainsDomain;
}

let parsePathWithStar = function() {
    var pathWithStar = {};
    
    badDomains.forEach(function(ruleWithStar, i, arr) {
       if(ruleWithStar.startsWith("/") && ruleWithStar.endsWith("^")) {
            let d = ruleWithStar.substr(1, ruleWithStar.length - 2);
            let lastTable = NaN;

            let splittingPath =  d.split("/");

            for(let i = 0; i < splittingPath.length; i++) {
                let splitStr = splittingPath[i];

                if(lastTable) {
                    if(lastTable.tree[splitStr]) {
                        lastTable = lastTable.tree[splitStr];
                    } else {
                        let newLastTable = {tree : {}, reason: []};
                        lastTable.tree[splitStr] = newLastTable;
                        lastTable = newLastTable;
                     }
                } else {
                    if(pathWithStar[splitStr]) {
                        lastTable = pathWithStar[splitStr];
                    } else {
                        lastTable = {tree : {}, reason: []};
                        pathWithStar[splitStr] = lastTable;
                    }
                }
                if(splitStr == "*") { // пришел конец
                    lastTable.reason.push(ruleWithStar);
                    break;
                }
            }
        }
    });
    return pathWithStar;
}


var hashRegexFullDomain = parseHashRegexFullDomain();
var hashRegexContainsDomain = parseUrlsHashRegexContainsDomain();
var pathWithStar = parsePathWithStar();

let getDetailsIfBlock = function(path) {
    let lastFoundTable = NaN;
        let details = NaN;
        let arrSplit = path.split("/");

        for(let i = 0; i < arrSplit.length; i++) {
            let isEndOfPath = i == arrSplit.length - 1; 
            let splitPath = arrSplit[i];

            if(lastFoundTable) {
                if(lastFoundTable.tree["*"]) {
                    let reasons = lastFoundTable.tree["*"].reason;

                    for(let k = 0; k < reasons.length; k++) {
                        let rs = reasons[k];
                        let startIndex = rs.indexOf("*") + 2;
                        let end = rs.substr(startIndex, rs.length - startIndex - 1);
                        // если звездочка стоит в самом конце правила, то правило подходит 
                        //  ИЛИ 
                        // если после звезды путь не подходит, можем переходить на след уровень
                        if(path.endsWith(end)) {
                            details = rs;
                            break;
                        }
                    }
                    if(details || !lastFoundTable.tree[splitPath]){
                        break;
                    }
                    lastFoundTable = lastFoundTable.tree[splitPath];
                } else if (lastFoundTable.tree[splitPath]) {
                    lastFoundTable = lastFoundTable.tree[splitPath];
                    if(isEndOfPath) {
                        break;
                    }
                }
            } else {
                // сюда заходим только один раз, в самом начале
                if(!pathWithStar[splitPath] && !pathWithStar["*"]) {
                    break;
                }

                if(pathWithStar["*"]) {
                    let reasons = pathWithStar["*"].reason;
                    for(let k = 0; k < reasons.length; k++) {
                        let rs = reasons[k];
                        let startIndex = rs.indexOf("*") + 2;
                        let end = rs.substr(startIndex, rs.length - startIndex - 1);
                        if(path.endsWith(end)) {
                            details = rs;
                            break;
                        }
                    }
                    // если нашли подходящее правило 
                    // ИЛИ
                    // если в дереве нет подходящего узла
                    if (details || !pathWithStar[splitPath]) {
                        break;
                    }
                    lastFoundTable = pathWithStar[splitPath];
                } else if (pathWithStar[splitPath]){
                    lastFoundTable = pathWithStar[splitPath];
                    if(isEndOfPath) {
                        break;
                    }
                }
            }
    }

    return details;
}


let leetRequestFilter = function(details) {

    const url = new URL(details.url);
    let initiator = details.initiator;
    if(!initiator) {
        initiator = url.host;
    }
    let host = url.host;

    let reason = {
        host: host,
        isGood: true,
        details: ''
    };

    let reasonDetails = NaN;
    if(hashRegexFullDomain[host]) {
        reasonDetails = hashRegexFullDomain[host];
    }

    if(!reasonDetails) {
        let lastFountTable = NaN;
        let splttingHosts = host.split(".");

        for(let i = 0; i < splttingHosts.length; i++) {
            let splitHost = splttingHosts[i];
            // ищем пока не конец или пока не нашли
            // если уже нашли первое вхождение, то все остальные должны быть в дереве
            if(lastFountTable) {
                if (lastFountTable.tree[splitHost]) {
                    lastFountTable = lastFountTable.tree[splitHost];
                    if(lastFountTable.isLeaf) {
                        reasonDetails = lastFountTable.reason;
                        break;
                    }
                }
           } else if( hashRegexContainsDomain[splitHost]) {
                lastFountTable = hashRegexContainsDomain[splitHost];
           }
        }
}

    let path = url.pathname.substr(1, url.pathname.length - 1);
    if(!reasonDetails) {
        // let details = NaN;
        // path = "loly/pop/banner/img";
        // details = getDetailsIfBlock(path);
        // console.log("path: ", path, " details ", details, "YES");

        // path = "banner/pop/img/lol";
        // details = getDetailsIfBlock(path);
        // console.log("path: ", path, " details ", details, " NO");

        // path = "banner/pop/img";
        // details = getDetailsIfBlock(path);
        // console.log("path: ", path, " details ", details, "YES");

        // path = "banner/img/loly/pop";
        // details = getDetailsIfBlock(path);
        // console.log("path: ", path, " details ", details, "YES");

        // path = "loly/pop/banner/img/loly";
        // details = getDetailsIfBlock(path);
        // console.log("path: ", path, " details ", details, "NO");

        // path = "banner/img/loly/popy/hop";
        // details = getDetailsIfBlock(path);
        // console.log("path: ", path, " details ", details, "YES");
        // console.log("path ", path);

        reasonDetails = getDetailsIfBlock(path);
        if(reasonDetails) {
            host = path;
        }
    }

    if(reasonDetails) {
            reason = {
                host: host,
                isGood: false,
                details: reasonDetails
            }
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

    if(reasonDetails) {
        console.log("BLOCKED: ", url.host);
        return {cancel: true};
    }
    return {cancel: false};
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
