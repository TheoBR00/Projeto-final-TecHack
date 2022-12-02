let cookiesScore;
let storageScore;
let tabs;

function showCookiesForTab(tabs) {
    //get the first tab object in the array
    let tab = tabs.pop();

    let fp = 0;
    let tp = 0;
    let session = 0;
    let nav = 0;
  
    //get all cookies in the domain
    var gettingAllCookies = browser.cookies.getAll({url: tab.url});
    gettingAllCookies.then((cookies) => {
  
      //set the header of the panel
      var activeTabUrl = document.getElementById('header-title');
      var text = document.createTextNode("Cookies at: "+tab.title);
      activeTabUrl.appendChild(text);
  
      var cookieList = document.getElementById('cookie-list');
  
      if (cookies.length > 0) {
        
        let li = document.createElement("li");
        let contagem = document.createTextNode("Quantidade de cookies na página: " + cookies.length);
        li.appendChild(contagem);
        cookieList.appendChild(li);
        for (let cookie of cookies) {
          console.log(cookie.domain);
          if(tab.url.includes(cookie.domain) == true){
            fp++;
          }
          else{
            tp++;
          }
          
          if((cookie.session != undefined) == true){
            session++;
          }
          else{
            nav++;
          }
          let li = document.createElement("li");
          if(cookie.session == true && fp > tp){
            let content = document.createTextNode(cookie.name + ": "+ cookie.value + ": " + "cookie de sessão e primeira parte");
            li.appendChild(content);
            cookieList.appendChild(li);
          }
          else if(cookie.session == true && fp < tp){
            let content = document.createTextNode(cookie.name + ": "+ cookie.value + ": " + "cookie de sessão e terceira parte");
            li.appendChild(content);
            cookieList.appendChild(li);
          }
          else if(cookie.session == false && fp > tp){
            let content = document.createTextNode(cookie.name + ": "+ cookie.value + ": " + "cookie de navegação e primeira parte");
            li.appendChild(content);
            cookieList.appendChild(li);
          }
          else if(cookie.session == false && fp < tp){
            let content = document.createTextNode(cookie.name + ": "+ cookie.value + ": " + "cookie de navegação e terceira parte");
            li.appendChild(content);
            cookieList.appendChild(li);
          }
          
          
        }
        let li_2 = document.createElement("li");
        let contagem_2 = document.createTextNode("Quantidade de cookies de terceira parte na página: " + (cookies.length - fp));
        li_2.appendChild(contagem_2);
        cookieList.appendChild(li_2);

        let li_3 = document.createElement("li");
        let contagem_3 = document.createTextNode("Quantidade de cookies de primeira parte na página: " + (fp));
        li_3.appendChild(contagem_3);
        cookieList.appendChild(li_3);

        

          
        
      } else {
        let p = document.createElement("p");
        let content = document.createTextNode("No cookies in this tab.");
        let parent = cookieList.parentNode;
  
        p.appendChild(content);
        parent.appendChild(p);
      }
    });
  }
  
  //get active tab to run an callback function.
  //it sends to our callback an array of tab objects
  function getActiveTab() {
    return browser.tabs.query({currentWindow: true, active: true});
  }
  getActiveTab().then(showCookiesForTab);

  // Referências: https://github.com/nabendu82/List-all-cookies

  "use strict";

/* ################################################################################################## */
/* ################################################################################################## */
/* ################################################################################################## */
/* 
StoragErazor by gab.ai/miraculix
*/
/* ################################################################################################## */
/* ################################################################################################## */
/* ################################################################################################## */

const VERSION = browser.runtime.getManifest().version;
const ICON_DEFAULT = "icons/recycle.png";

var gDisplayNotifications = true;

/* ################################################################################################## */
/* ################################################################################################## */

const razorNotification = {
  _notificationIcon: browser.extension.getURL(ICON_DEFAULT),
  _notificationId: "srazor",

  display: (text, millis) => {

    if (!gDisplayNotifications) return;

    browser.notifications.create(razorNotification._notificationId, {
      "type": "basic",
      "iconUrl": razorNotification._notificationIcon,
      "title": "StoragErazor v" + VERSION,
      "message": text
    });

    window.setTimeout(() => {
      browser.notifications.clear(razorNotification._notificationId);
    }, millis);
  }
}

/* ################################################################################################## */
/* ################################################################################################## */

const storageRazor = {

  removeCache: false,
  removeLocal: true,
  removeIndexed: true,

  init: async () => {
    let result = await storageRazor.readSettings();
    if (result === true) {
      let opts = {
        cache: storageRazor.removeCache,
        local: storageRazor.removeLocal,
        indexed: storageRazor.removeIndexed
      };
      console.log(opts);
      storageRazor.removeData(false, opts);
    }
    else {
      console.log("Running for the first time");
      razorNotification.display(
        "Running for the first time. Review the settings and change them if desired.", 11111)
      browser.runtime.openOptionsPage();
      storageRazor.writeSettings();
    }
    browser.runtime.onMessage.addListener(storageRazor.message);
  },

  removeData: (display_notification, options) => {
    browser.browsingData.remove({},
    {
        cache: options.cache, 
        localStorage: options.local, 
        indexedDB: options.indexed
    }).then( display_notification ? storageRazor.onSuccessRemove : null, storageRazor.onErrorRemove);
  },

  onSuccessRemove: () => {
    razorNotification.display("Data has been successfully removed", 3333);
  },

  onErrorRemove: (error) => {
    razorNotification.display("Error removing data: " + error, 11111);
  },

  message: (request, sender, sendResponse) => {
    if (request.getopts != null)
    {
      browser.runtime.sendMessage({
        options: true,
        removeCache: storageRazor.removeCache, 
        removeLocal: storageRazor.removeLocal, 
        removeIndexed: storageRazor.removeIndexed
      });

      console.log(removeLocal);

    } else 
    if (request.options != null)
    {
      storageRazor.removeCache = request.removeCache;
      storageRazor.removeLocal =  request.removeLocal;
      storageRazor.removeIndexed = request.removeIndexed;
      storageRazor.writeSettings();
    } else
    if (request.erase != null)
    {
      let opts = {
        local: false,
        indexed: false,
        cache: false
      }
      if (request.erase == "all") opts.local = opts.indexed = opts.cache = true;
      else if (request.erase == "cache") opts.cache = true;
      else if (request.erase == "local") opts.local = true;
      else if (request.erase == "indexed") opts.indexed = true;
      storageRazor.removeData(true, opts);
    }

  },

  readSettings: async () => {

    let settings = await browser.storage.local.get([
      'removeCache',
      'removeLocal',
      'firstRun',
      'removeIndexed'
    ]);

    if (settings.removeCache !== undefined) storageRazor.removeCache = settings.removeCache;
    if (settings.removeLocal !== undefined) storageRazor.removeLocal = settings.removeLocal;
    if (settings.removeIndexed !== undefined) storageRazor.removeIndexed = settings.removeIndexed;
    if (settings.firstRun !== undefined) return true;
    return false;

  },

  writeSettings: () => {
    browser.storage.local.set({
      removeCache: storageRazor.removeCache,
      removeLocal: storageRazor.removeLocal,
      removeIndexed: storageRazor.removeIndexed,
      firstRun: false
    });

  }

}

/* ################################################################################################## */
/* ################################################################################################## */

requestIdleCallback(() => { storageRazor.init(); }, { timeout: 10000 });

/* ################################################################################################## */
/* ################################################################################################## */

// Referências: https://github.com/Miraculix200/StoragErazor