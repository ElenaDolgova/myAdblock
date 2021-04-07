function loadBlockedUrls(det) {
    chrome.tabs.query({active: true, currentWindow: true}, tabs => {
        const url = new URL(tabs[0].url);
        
        chrome.storage.local.get(url.origin, function (reasons) {
            console.log("inside ", reasons);
            var str = '<table><tr><th>Url</th></tr><tr>';

            for(var key in reasons){
                reasons[key].forEach(function(reason, i, arr) {
                    var host = reason.host;
                    var isGood = reason.isGood;
    
                    if(!isGood){
                        str = str.concat('<td>', host, '</td></tr>'); 
                    }
                });
            }
            str = str.concat('</table>');
            document.getElementById("p2").innerHTML = str;
        });

    });
  }
  
  document.getElementById('paged_blocked_button').addEventListener('click', loadBlockedUrls);