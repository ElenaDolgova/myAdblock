

function loadPage() {
    storage.get(null, function (result) {
        console.log('try to get in load page', result);
    });
    // chrome.tabs.executeScript({
    //   file: 'alert.js'
    // }); 
  }
