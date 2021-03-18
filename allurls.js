
function loadPage() {
    chrome.storage.local.get(null, function (result) {
        var str = '<table><tr><th>Url</th><th>Reason</th></tr><tr>';
        for (var key in result) {
            var reason = result[key];
            str = str.concat('<td>', key, '</td><td>',  reason, '</td></tr>');
         }
        str = str.concat('</table>');
        document.getElementById("p1").innerHTML = str;
    });
  }
  
  document.getElementById('refresh_button').addEventListener('click', loadPage);
