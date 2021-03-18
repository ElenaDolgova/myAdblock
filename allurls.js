
function loadPage() {
    chrome.storage.local.get(null, function (result) {
        var str = '<table><tr><th>From which page</th><th>Url</th><th>Reason</th></tr><tr>';
        for (var initiator in result) {
            var reasons = result[initiator];
            console.log('reasons ', reasons);
            reasons.forEach(function(reason, i, arr) {
                var host = reason.host;
                var isGood = reason.isGood;
                var details = reason.details;

                if(isGood) {
                    str = str.concat('<td>', initiator,'</td><td>', host, '</td><td>',  'There is good url', '</td></tr>');
                }else {
                    str = str.concat('<td>', initiator,'</td><td>', host, '</td><td>', 'There is bad url because of ', details, '</td></tr>');
                }
                
              });
         }
        str = str.concat('</table>');
        document.getElementById("p1").innerHTML = str;
    });
  }
  
  document.getElementById('refresh_button').addEventListener('click', loadPage);
