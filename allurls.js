

function loadPage() {
    return "Ggggg";
    // return storage.get(null, function (result) {
    //     console.log('try to get in load page', result);
    // });
    // chrome.tabs.executeScript({
    //   file: 'alert.js'
    // }); 
  }
  
  document.getElementById('p1').addEventListener('click', loadPage);
