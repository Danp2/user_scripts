// ==UserScript==
// @name        Append Tunnel Number To XOA
// @namespace   Violentmonkey Scripts
// @include     /(?<=^https:\/\/)\d{5}\.tunnel\.gpn\.vates\.fr/
// @grant       none
// @version     2024-09-16
// @license     GPL-v3
// @author      DanP2
// @icon        https://xen-orchestra.com/blog/content/images/2017/05/xo-logo.png
// @description 9/16/2024, 4:04:07 AM
// @run-at   document-idle
// ==/UserScript==

function appendTunnelToTitle() {
    var regex = /(?<=^https:\/\/)\d{5}/;
    var tunnel = regex.exec(document.URL);
    var prepend = false;
  
    if (prepend) {
      if (!document.title.startsWith(tunnel[0])) {
        document.title = tunnel[0].concat(' - ', document.title);
      }
    }
    else
    {
      if (!document.title.endsWith(tunnel[0])) {
        document.title = document.title.concat(' - ', tunnel[0]);
      }
    }
  }
  
  window.onload = function(){
      appendTunnelToTitle();
  };
  
  new MutationObserver(function(mutations) {
      console.log('Mutation observed');
      setInterval(appendTunnelToTitle, 1000);
  }).observe(document.querySelector('title'), { subtree: true, characterData: true, childList: true });
  