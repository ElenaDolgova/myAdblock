"use strict"

window.onload = function() {
    function updateLabel(value) {
        document.getElementById('popup_button').value = value;
    }

    // updateLabel("pop");
    
    // document.getElementById('popup_button').

    chrome.tabs.query(
        {
            active: true, 
            currentWindow: true
        }, 
        tabs => {
            const tabId = tabs[0].id;
            console.log("tabId {}", tabId );
            console.log("tabs[0].active {}", tabs[0].active);
            // updateLabel("pop");
        }
    );
}

function dawn(input) {
    input.value = input.value != 'Disable' ? 'Disable' : 'Enable'
}
