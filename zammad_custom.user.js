// ==UserScript==
// @name     Zammad customizations
// @match    https://help.vates.tech/*
// @version  2024-10-18
// @license      GPL-v3
// @author       DanP2
// @require            https://code.jquery.com/jquery-3.6.0.min.js
// @require            https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@v1.2/waitForKeyElements.js
// @require            https://cdn.jsdelivr.net/npm/hotkeys-js@3.13.7/dist/hotkeys.min.js
// @require            https://openuserjs.org/src/libs/sizzle/GM_config.js
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM.getValue
// @grant              GM.setValue
// @grant              GM_registerMenuCommand
// @grant              GM_addStyle
// @grant              GM_getResourceText
// @icon https://avatars.githubusercontent.com/u/1380327?s=200&v=4
// @run-at   document-idle
// @description Customize Zammad
// ==/UserScript==

(function() {
    'use strict';

    console.log(`Starting ${GM_info.script.name} version ${GM_info.script.version}...`);

    const disabledHotkeys = [
        {saveName: "disableUpdateClosed", hotkey: "ctrl+shift+c", default: true, desc: "Update as closed"},
      ];
    
      const addedHotkeys = [
        {saveName: "addCloseActive", hotkey: "ctrl+alt+w", default: true, desc: "Closing active ticket", func: a => closeTicket()},
        {saveName: "addCollapseAll", hotkey: "ctrl+alt+z", default: true, desc: "Collapse all articles", func: a => collapseEntries(true)},
        {saveName: "addExpandAll", hotkey: "ctrl+alt+x", default: true, desc: "Expand all articles", func: a => collapseEntries(false)},
        {saveName: "addPriorTicket", hotkey: "ctrl+alt+up", default: true, desc: "Prior ticket", func: a => prevTicket()},
        {saveName: "addNextTicket", hotkey: "ctrl+alt+down", default: true, desc: "Next ticket", func: a => nextTicket()},
        {saveName: "addClearDups", hotkey: "ctrl+alt+n", default: true, desc: "Clear duplicate notifications", func: a => clearNotifications()},
        {saveName: "addReplyLast", hotkey: "ctrl+alt+l", default: true, desc: "Reply to last response", func: a => replyLast()},
      ];


    let gmc;
    setupScript();

    function setupScript() {
        GM_addStyle(".ticket-article.extended \
            { \
                max-width:10000px; \
            }");
            
        let cfg = buildConfig();
        gmc = new GM_config(cfg);
    };

    function buildConfig() {

        const configId = 'zammadCfg';
 
        const iframecss = `
            height: 555px;
            width: 435px;
            border: 1px solid;
            border-radius: 3px;
            position: fixed;
            z-index: 9999;
            `;

        let cfg = {
            'id': configId, // The id used for this instance of GM_config
            title: "Script Settings",
            frameStyle: iframecss,
            'fields': // Fields object
            {
                closeNotification: {
                    section: [ 'Notifications', ''],
                    label: 'Close notifications when clicked?',
                    labelPos: 'right',
                    type: 'checkbox',
                    default: true,
                },
                requireAlt: {
                    label: 'Require Alt key?',
                    labelPos: 'right',
                    type: 'checkbox',
                    default: false,
                },
                ticketExtended: {
                    section: ['Tickets', ''],
                    label: 'Use extended view?',
                    labelPos: 'right',
                    type: 'checkbox',
                    default: false,
                },
                articleResize: {
                    section: ['Articles', ''],
                    label: 'Control click to expand / collapse?',
                    labelPos: 'right',
                    type: 'checkbox',
                    default: true,
                },
                articleHideBlocked: {
                    label: 'Hide blocked remote content message?',
                    labelPos: 'right',
                    type: 'checkbox',
                    default: true,
                },
            },
            'events': {
                'init': onInit,
                'save': onSave,
            }
        };

        let addSection = true;

        // Add disable hotkeys
        disabledHotkeys.forEach(h => {
            let entry = {label: `Disable "${h.desc}"? (${h.hotkey})`, labelPos: "right", type: "checkbox", default: h.default};
            if (addSection) {
                entry.section = ['Hotkeys', 'Remove hotkeys'];
                addSection = false;
            }
            cfg.fields[h.saveName] = entry;
        });

        addSection = true;

        // Add new hotkeys
        addedHotkeys.forEach(h => {
            let entry = {label: `Enable "${h.desc}"? (${h.hotkey})`, labelPos: "right", type: "checkbox", default: h.default};
            if (addSection) {
                entry.section = ['', 'Add hotkeys'];
                addSection = false;
            }
            cfg.fields[h.saveName] = entry;
        });

        return cfg;
    }
    
    // initialization complete
    function onInit() {
        const popoverSelector = "div.popover--notifications";
        const notificationLinkSelector = "div.js-items > div.activity-entry > div.activity-body > a.activity-message";
        const activityRemoveSelector = "div.activity-remove";
        const appSelector = "div#app";
        const ticketSelector = "div.ticket-article";
        const ticketItemSelector = "div.ticket-article-item";
        // const blockedContentSelector = "div.article-meta-permanent";
        const blockedContentSelector = "div.remote-content-message";

        GM_registerMenuCommand(`${GM_info.script.name} Settings`, () => {
            gmc.open();
        });

        waitForKeyElements(popoverSelector, (element) => {
            // Close notification on click
            $(element).on('click', notificationLinkSelector, function(e) {
                const closeNotification = gmc.get('closeNotification');
                const requireAlt = gmc.get('requireAlt');

                if (closeNotification) {
                    if (!requireAlt || e.altKey) {
                        $(e.currentTarget).next(activityRemoveSelector).trigger("click");
                        }
                    }
                });

                onElementInserted(appSelector, ticketItemSelector, function(element) {
                    console.log("new article added");
                    triggerHashChange();
                });
            }

        );

        // Expand / collapse ticket entry
        $("body").on('click', '.textBubble', function(e) {
            const articleResize = gmc.get('articleResize');

            if (articleResize && e.ctrlKey) {
                e.stopImmediatePropagation();
                $(e.currentTarget).find(".js-toggleFold:visible").trigger("click");
            }
        });

        // hide blocked content notices
        $(window).on( 'hashchange', function( e ) {
            console.log( 'ticket switch detected' );
            const articleHideBlocked = gmc.get('articleHideBlocked');
            const ticketExtended = gmc.get('ticketExtended');

            if (articleHideBlocked) $(blockedContentSelector).hide();
            else $(blockedContentSelector).show();

            if(ticketExtended) $(ticketSelector).addClass("extended");
            else $(ticketSelector).removeClass("extended");
        } );

        // hide content on initial load
        // triggerHashChange()

        setupHotkeys();
        
        console.log(`Successfully started ${GM_info.script.name} version ${GM_info.script.version}!`);
    }
    
    function onSave() {
        gmc.close();
        setupHotkeys();
        triggerHashChange();
    }

    function triggerHashChange() {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
    }

    // https://stackoverflow.com/questions/10415400/jquery-detecting-div-of-certain-class-has-been-added-to-dom
    function onElementInserted(containerSelector, elementSelector, callback) {

        var onMutationsObserved = function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    var elements = $(mutation.addedNodes).find(elementSelector);
                    for (var i = 0, len = elements.length; i < len; i++) {
                        callback(elements[i]);
                    }
                }
            });
        };

        var target = $(containerSelector)[0];
        var config = { childList: true, subtree: true };
        var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
        var observer = new MutationObserver(onMutationsObserved);
        observer.observe(target, config);

    }

    function setupHotkeys() {
        // unbind all hotkeys
        hotkeys.unbind();

        // build string of hotkeys to disable
        let hkDisabled = '';
        let isDisabled, isEnabled;

        disabledHotkeys.forEach(h => {
            isDisabled = gmc.get(h.saveName);

            if (isDisabled) {
                console.log(`> Disabling "${h.desc}" hotkey (${h.hotkey})`);
                hkDisabled = hkDisabled.concat(`${h.hotkey},`);
            }
        });

        // Override default hotkeys
        hotkeys(hkDisabled, function(event, handler){
            // Prevent the default action
            event.stopImmediatePropagation();
            event.preventDefault();
            console.log(`Blocked ${hotkeys.getPressedKeyString()}`); 
        });

        // Add new hotkeys
        addedHotkeys.forEach(h => {
            isEnabled = gmc.get(h.saveName);

            if (isEnabled) {
                console.log(`> Adding "${h.desc}" hotkey (${h.hotkey})`);
                hotkeys(h.hotkey, function(e){
                  ("function" === typeof h.func) && h.func(h);
                });
            }  
        });

        // console.log(hotkeys.getAllKeyCodes());
    }

    const closeTicket = () => {
        $('#navigation .tasks .is-active .js-close').trigger('click');
    };

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
    
        // enable reverse sorting of jQuery output
        jQuery.fn.reverse = [].reverse;
    
        // Get all notification activity elements
        let t = $(activitySelector).reverse();
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
    
        // Remove duplicates starting with the oldest entries
        t.each(function(){
          let key = $(this).find(activityLinkSelector).attr('href').match(/\d+/);

          if (countByTicket[key] > 1) {
            $(this).find("div.activity-remove").click();
            countByTicket[key]--;
          }
        });
    };

    const replyLast = () => {
        const customerArticleSelector = "div.ticket-article-item.customer";
        const customerReplySelector = "a.article-action[data-type^='emailReply']";
        const activeArticleSelector = ".active.content .article-new .articleNewEdit-body";

        // Reply to last customer response
        let custResponse = $(customerArticleSelector).last();
        
        if (custResponse.length) {
            // Click "reply all" if present; otherwise click "reply"
            $(custResponse).find("a.article-action[data-type^='emailReply']").last().get(0).click();

            waitForKeyElements(activeArticleSelector, (element) => {
                // remove text after signature block
                $(element).find('div[data-signature=true]').siblings('div').remove();
            });
        }
    };

})();
