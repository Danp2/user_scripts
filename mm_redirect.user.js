// ==UserScript==
// @name         Mattermost App Redirector
// @version      2025-08-15
// @match        https://team.vates.fr/*
// @exclude      https://team.vates.fr/landing#/*
// @grant        none
// @run-at       document-start
// @license      Unlicensed
// ==/UserScript==

(function() {
    'use strict';
    console.log(`Starting ${GM_info.script.name} version ${GM_info.script.version}...`);

    const href = window.location.href;

    // Redirect to Mattermost app and close tab
    window.location.replace(href.replace("https:", "mattermost:"));
    window.close();
})();