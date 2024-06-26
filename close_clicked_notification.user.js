// ==UserScript==
// @name     Close clicked Zammad notification
// @match    https://help.vates.tech/*
// @version  2024-06-25
// @license      GPL-v3
// @author       DanP2
// @grant    none
// @require https://code.jquery.com/jquery-3.6.0.min.js
// @require https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// @icon https://avatars.githubusercontent.com/u/1380327?s=200&v=4
// @run-at   document-idle
// @description  Close clicked Zammad notification
// ==/UserScript==

(function() {
    'use strict';

    console.log(`Starting ${GM_info.script.name} version ${GM_info.script.version}...`);

    const popoverSelector = "div.popover--notifications";
    const notificationLinkSelector = "div.js-items > div.activity-entry > div.activity-body > a.activity-message";
    const activityRemoveSelector = "div.activity-remove";


    waitForKeyElements(popoverSelector, (element) => {
      // Close notification on click
      $(element).on('click', notificationLinkSelector, function(e) {
        // e.preventDefault();
        $(e.currentTarget).next(activityRemoveSelector).trigger("click");
      });
    });

    console.log(`Successfully started ${GM_info.script.name} version ${GM_info.script.version}!`);
})();
