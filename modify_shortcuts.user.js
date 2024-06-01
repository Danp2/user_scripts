// ==UserScript==
// @name     Modify Zammad shortcuts
// @match    https://help.vates.tech/*
// @version  1.2
// @grant    none
// @require       https://cdn.jsdelivr.net/npm/hotkeys-js@3.13.7/dist/hotkeys.min.js
// @run-at   document-idle
// @description Modify Zammad shortcuts
// ==/UserScript==

// Based on code found at these links:
// https://github.com/scottgifford/greasemonkey-thrutext-extra-shortcuts
// https://gist.github.com/sur5r/4b38693ceffc8177fb485fa120b25c2c

// Blocks following shortcuts --
// Ctrl+Shift+C Update ticket status to closed
//
// Adds following shortcuts --
// Ctrl+Alt+W   Close current ticket (doesn't update ticket status)
// Ctrl+Alt+↑   Move to prior ticket
// Ctrl+Alt+↓   Move to next ticket
// Ctrl+Alt+X   Expand all articles
// Ctrl+Alt+Z   Collapse all articles
// Ctrl+Alt+N   Clear duplicate notifications

(function() {
  'use strict';

  console.log(`Starting ${GM_info.script.name} version ${GM_info.script.version}...`);

  const disabledHotkeys = [
    {hotkey: "ctrl+shift+c", enabled: true, desc: "Update as closed"},

  ];

  const addedHotkeys = [
    {hotkey: "ctrl+alt+w", enabled: true, desc: "Closing active ticket", func: a => $('#navigation .tasks .is-active .js-close').trigger('click')},
    {hotkey: "ctrl+alt+z", enabled: true, desc: "Collapse all articles", func: a => collapseEntries(true)},
    {hotkey: "ctrl+alt+x", enabled: false, desc: "Expand all articles", func: a => collapseEntries(false)},
    {hotkey: "ctrl+alt+up", enabled: true, desc: "Prior ticket", func: a => prevTicket()},
    {hotkey: "ctrl+alt+down", enabled: true, desc: "Next ticket", func: a => nextTicket()},
    {hotkey: "ctrl+alt+n", enabled: true, desc: "Clear duplicate notifications", func: a => clearNotifications()},

  ];

  const nextTicket = () => {
    var t, el, n;
    (t = $('#navigation .tasks .is-active')).get(0) && (el = t.next()).get(0) ? (el.find('div').first().trigger('click')) : (n = $('#navigation .tasks .task').first()).get(0) ? (n.find('div').first().trigger('click')) : void 0;
  };

  const prevTicket = () => {
    var t, el, n;
    (t = $('#navigation .tasks .is-active')).get(0) && (n = t.prev()).get(0) ? (n.find('div').first().trigger('click')) : (el = $('#navigation .tasks .task').last()).get(0) ? (el.find('div').first().trigger('click')) : void 0;
  };

  const collapseEntries = (action, root) => {
    if (action === undefined) {
      action = false;
    }

    if (root === undefined) {
        root = document;
    }

    const articleSelector = ".ticket-article-item";
    const expandedSelector = ".textBubble-overflowContainer.is-open:not(.hide)";
    const collapsedSelector = ".textBubble-overflowContainer:not(.is-open):not(.hide)";
    const toggleFoldClass = "js-toggleFold";

    let activeSelector = (action) ? expandedSelector : collapsedSelector;
    const elements = root.querySelectorAll(articleSelector);
    root.querySelectorAll(articleSelector)
      .forEach((elt, i) => {
        if (elt.querySelector(activeSelector)) {
          elt.getElementsByClassName(toggleFoldClass)[0].click();
        }
    });
  };

  const clearNotifications = () => {
    const activitySelector = "div.popover div.activity-entry";
    const activityLinkSelector = "div.activity-body a.activity-message";

    // Get all notification activity elements
    let t = $(activitySelector);
    let origCount = t.length;

    // Build array of ticket numbers
    let tickets = t.find(activityLinkSelector).map(function(i,el) { return $(el).attr('href').match(/\d+/); }).get();

    // Count duplicates
    const countByTicket = {};
    for (let i = 0; i < tickets.length; i++) {
        let ele = tickets[i];
        if (countByTicket[ele]) {
          countByTicket[ele] += 1;
        } else {
          countByTicket[ele] = 1;
        }
    }

    // Remove duplicates starting with the newest entries
    t.each(function(){
      let key = $(this).find(activityLinkSelector).attr('href').match(/\d+/);
      // console.log(`> Checking ${key}`);

      if (countByTicket[key] > 1) {
        //  console.log(`> Removing ${key} notification`);

        $(this).find("div.activity-remove").click();
        countByTicket[key]--;
      }
    });

  };

  // Disable hotkeys
  disabledHotkeys.forEach(h => {
    if (h.enabled) {
      console.log(`> Disabling "${h.desc}" hotkey (${h.hotkey})`);

      hotkeys(h.hotkey, function(event, handler){
        // Prevent the default action
        event.preventDefault();
        event.stopImmediatePropagation();
      });
    }
  });

  // Add hotkeys
  addedHotkeys.forEach(h => {
    if (h.enabled) {
      console.log(`> Adding "${h.desc}" hotkey (${h.hotkey})`);

      hotkeys(h.hotkey, function(e){
        ("function" === typeof h.func) && h.func(h);
      });
    }
  });

  console.log(`Successfully started ${GM_info.script.name} version ${GM_info.script.version}!`);

})();
