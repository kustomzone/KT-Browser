(function($) {
    $.fn.webview = function(params) {
        var request = require('request');
        var openfpt_api_key = "01b4a2586f2f4ea0a73a6c650f8bd49f"

        var settings = $.extend({
                url: "",
                tab: null
            }, params),
            t = this,
            lastUrl = ''
        pref = ''
        var settingmng = require('electron-settings')

        if(!settingmng.get("settings.allowScript")) {
            pref = 'javascript=0'
        }
        if(!settingmng.get("settings.allowImage")) {
            pref = 'images=0'
        }
        if(!settingmng.get("settings.allowScript") && !settingmng.get("settings.allowImage")) {
            pref = 'javascript=0, images=0'
        }
        t.isPrivacy = false
        t.webview = $('<webview class="webview" preload="js/extensions/preload.js" webpreferences="' + pref + '" useragent="Mozilla/5.0 (Windows NT) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36 KT-Browser/7.0.1" autosize="on" src="about:blank" plugins>').appendTo($(this))[0]
        t.storage = new Storage()
        t.string = "Siema"
        t.contextMenu = new ContextMenu(t.webview)
        t.fitToParent = function() {
            $(t.webview).css({
                width: window.innerWidth,
                height: window.innerHeight - 79
            })
            t.webview.executeJavaScript('isfullscreen()', true, function(result) {
                if(result == true) {
                    $(t.webview).css({
                        width: window.innerWidth,
                        height: window.innerHeight,
                        marginTop: '-48px'
                    })
                    settings.tab.instance.bar.css('display', 'none')
                } else {
                    $(t.webview).css({
                        width: window.innerWidth,
                        height: window.innerHeight - 79,
                        marginTop: '48px'
                    })
                    settings.tab.instance.bar.css('display', 'block')
                }
            })
        }

        t.fitToParent()

        globalShortcut.register('F12', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.inspectElement(0, 0)
        });
        globalShortcut.register('CmdOrCtrl+Shift+I', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.inspectElement(0, 0)
        });
        globalShortcut.register('F5', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.reload()
        });
        globalShortcut.register('CmdOrCtrl+R', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.reload()
        });
        globalShortcut.register('CmdOrCtrl+Shift+R', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.reloadIgnoringCache()
        });
        globalShortcut.register('Shift+F5', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.reloadIgnoringCache()
        });
        globalShortcut.register('Alt+Home', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.loadURL(settings.get("settings.homePage", "kt-browser://newtab"))
        });

        globalShortcut.register('CmdOrCtrl+P', () => {
            if(remote.getCurrentWindow().isFocused())
                t.webview.print({
                    silent: false,
                    printBackground: false
                })
        });
        $(window).resize(function() {
            t.fitToParent()
        })

        t.updateURLBarIcon = function() {
            settings.tab.instance.bar.rdBtn.show()
            settings.tab.instance.bar.searchInput.css("width", "calc(100% - 120px)")
            if(t.webview.getURL().startsWith("http://")) {
                settings.tab.instance.bar.searchIcon.html('http')
            }
            if(t.webview.getURL().startsWith("https://")) {
                settings.tab.instance.bar.searchIcon.html('https')
            }
            if(t.webview.getURL().startsWith("kt-browser://")) {
                settings.tab.instance.bar.searchIcon.html('public')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if(t.webview.getURL().startsWith("kt-browser://newtab")) {
                settings.tab.instance.bar.searchIcon.html('search')
            }
            if(t.webview.getURL().startsWith("file://")) {
                settings.tab.instance.bar.searchIcon.html('storage')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if(t.webview.getURL().includes(`reader/index.html?url=`)) {
                settings.tab.instance.bar.searchIcon.html('remove_red_eye')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if(t.webview.getURL().startsWith("data:text")) {
                settings.tab.instance.bar.searchIcon.html('description')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if(t.webview.getURL().startsWith("data:image")) {
                settings.tab.instance.bar.searchIcon.html('image')
                settings.tab.instance.bar.rdBtn.hide()
                settings.tab.instance.bar.searchInput.css("width", "calc(100% - 88px)")
            }
            if(t.isPrivacy) {
                settings.tab.instance.bar.searchIcon.html('vpn_lock')
            }
        }

        this.webview.addEventListener('ipc-message', function(e) {
            if(e.channel == 'clicked') {
                settings.tab.instance.bar.suggestions.css('display', 'none')
                settings.tab.instance.menu.hide()
            }
            if(e.channel == 'status') {
                if(typeof e.args[0] == 'undefined' || !e.args[0] || e.args[0].length === 0 || e.args[0] === "" || !/[^\s]/.test(e.args[0]) || /^\s*$/.test(e.args[0]) || e.args[0].replace(/\s/g, "") === "") {
                    settings.tab.instance.status.css("display", "none")
                } else {
                    if(e.args[0].length > 71) {
                        settings.tab.instance.status.html(e.args[0].substring(0, 70) + "...")
                    } else {
                        settings.tab.instance.status.html(e.args[0]);
                    }
                    settings.tab.instance.status.css("display", "inline")
                }
            }
        })

        //webview ready event
        $(t.webview).ready(function() {
            var ses = t.webview.getWebContents().session

            settings.tab.instance.bar.searchInput.focus()
            settings.tab.Favicon.css('opacity', "0")
            settings.tab.Preloader.css('opacity', "0")

            ses.allowNTLMCredentialsForDomains('*')
            ses.on('will-download', (event, item, webContents) => {})

            if(fileToStart != null) {
                url = fileToStart;
                fileToStart = null;
            }

            if(settings.url != null || settings.url != "")
                t.webview.loadURL(settings.url)
        });
        //webview newwindow event
        t.webview.addEventListener('new-window', (e) => {
            const protocol = require('url').parse(e.url).protocol
            if(protocol === 'http:' || protocol === 'https:') {
                var tab = new Tab(),
                    instance = $('#instances').browser({
                        tab: tab,
                        url: e.url
                    })
                addTab(instance, tab);
            }
        });

        t.webview.addEventListener('did-frame-finish-load', function(isMainFrame) {
            settings.tab.Favicon.css('opacity', "1");
            settings.tab.Preloader.css('opacity', "0");

            if(lastUrl != t.webview.getURL()) {
                if(!t.isPrivacy) {
                    t.storage.saveHistory(t.webview.getTitle(), t.webview.getURL())
                }
                lastUrl = t.webview.getURL()
            }
            if(!t.webview.getURL().startsWith("kt-browser://newtab") && t.webview.getURL() != "about:blank" && !t.webview.getURL().includes(`reader/index.html?url=`)) {
                settings.tab.instance.bar.searchInput.val(t.webview.getURL());
            }

            if(t.webview.canGoBack()) {
                settings.tab.instance.bar.backBtn.enabled = true
            } else {
                settings.tab.instance.bar.backBtn.enabled = false
            }
            if(t.webview.canGoForward()) {
                settings.tab.instance.bar.forwardBtn.enabled = true
            } else {
                settings.tab.instance.bar.forwardBtn.enabled = false
            }

            t.updateURLBarIcon()

            if(isMainFrame) {
                settings.tab.instance.webview.webview.executeJavaScript('stylishMenu()', false);
                settings.tab.instance.webview.webview.executeJavaScript('isNightMode()', true, function(result) {
                    if(result == true) {
                        settings.tab.instance.webview.webview.executeJavaScript('NightMode()', false);
                    }
                })
                settings.tab.instance.webview.webview.executeJavaScript('LaBanDic()', true, function(result) {
                    if(result == true) {
                        t.webview.executeJavaScript('var lbplugin_event_opt={"extension_enable":true,"dict_type":1,"dbclk_event":{"trigger":"none","enable":true,"display":1},"select_event":{"trigger":"ctrl","enable":true,"display":1}};function loadScript(t,e){var n=document.createElement("script");n.type="text/javascript",n.readyState?n.onreadystatechange=function(){("loaded"===n.readyState||"complete"===n.readyState)&&(n.onreadystatechange=null,e())}:n.onload=function(){e()},n.src=t,document.getElementsByTagName("head")[0].appendChild(n)}setTimeout(function(){null==document.getElementById("lbdictex_find_popup")&&loadScript("http://stc.laban.vn/dictionary/js/plugin/lbdictplugin.min.js?"+Date.now()%1e4,function(){lbDictPlugin.init(lbplugin_event_opt)})},1e3);', true)
                    }
                })
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("banner300250-L"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("div-banner300250"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("banner-LR"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("aCenter padB2 banner-position"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
                t.webview.executeJavaScript('for(var list=document.getElementsByClassName("ad-div mastad"),i=list.length-1;i>=0;i--)list[i]&&list[i].parentElement&&list[i].parentElement.removeChild(list[i]);', true)
            }
            t.webview.executeJavaScript('try { function a() {return $(document.body).css("background-color")} a() } catch(err) {}', true, function(result) {
                if(result !== null) {
                    if((result.replace(/^.*,(.+)\)/, '$1') == 0)) {
                        t.webview.executeJavaScript('try {$(document.body).css("background-color", "#fff")} catch(err) {}', true)
                    }
                }
            })
            settings.tab.instance.webview.webview.executeJavaScript('isMacRender()', true, function(result) {
                if(result == true) {
                    settings.tab.instance.webview.webview.executeJavaScript('MacRender()', false);
                }
            })
        });
        t.webview.addEventListener('did-fail-load', function(e) {
            let errorCode = e.errorCode
            let errorDescription = e.errorDescription

            let dir = __dirname
            if(!errorCode == 0)
                settings.tab.instance.status.html(errorDescription + ": " + errorCode);
            settings.tab.instance.status.css("display", "inline")
        })

        t.webview.addEventListener('leave-html-full-screen', function() {
            t.fitToParent()
        });
        t.webview.addEventListener('enter-html-full-screen', function() {
            t.fitToParent()
        });

        t.webview.addEventListener('plugin-crashed', function(e) {
            remote.getCurrentWindow().webContents.executeJavaScript("$('.maindiv').msgBox({title:'" + "Plugin Error" + "',message:'" + "Plugin " + e.name + " is not responding." + "',buttons:[{text:'OK',callback:function(){$('p').fadeIn()}}],blend:!0});")
        });
        t.webview.addEventListener('did-start-loading', function() {
            settings.tab.instance.bar.suggestions.css('display', 'none');
            settings.tab.Favicon.css('opacity', "0");
            settings.tab.Preloader.css('opacity', "1");
            settings.tab.instance.webview.webview.executeJavaScript('stylishMenu()', false);
        });
        t.webview.addEventListener('page-title-updated', function(title) {
            settings.tab.Title.html("<p style='display: inline; width:50%;'>" + "&nbsp;&nbsp;" + t.webview.getTitle() + "</p>");
            if(lastUrl != t.webview.getURL()) {
                t.storage.saveHistory(t.webview.getTitle(), t.webview.getURL())
                lastUrl = t.webview.getURL()
            }
            if(!t.webview.getURL().startsWith("kt-browser://newtab") && t.webview.getURL() != "about:blank" && !t.webview.getURL().includes(`reader/index.html?url=`)) {
                settings.tab.instance.bar.searchInput.val(t.webview.getURL());
            }
        });
        t.webview.addEventListener('load-commit', function(e) {
            if(e.url.length > 65 && !e.url.startsWith("about:")) {
                settings.tab.instance.status.html("Loading: " + e.url.substring(0, 64) + "...")
            } else {
                settings.tab.instance.status.html("Loading: " + e.url + "...")
            }
            settings.tab.instance.status.css("display", "inline")
            settings.tab.instance.bar.suggestions.css('display', 'none');
            if(settingmng.get("settings.blockUnsafeWeb")) {
                if(!e.url.startsWith("kt-browser://") && !e.url.startsWith("about:") && !e.url.startsWith("chrome://") && !e.url.startsWith("file://") && e.isMainFrame) {
                    request('http://api.openfpt.vn/cyradar?api_key=' + openfpt_api_key + '&url=' + e.url, function(error, response, body) {
                        if(JSON.parse(body).conclusion != "safe") {
                            t.webview.loadURL("")
                            //TODO: warning page
                        }
                    });
                }
            }
        });

        t.webview.addEventListener('page-favicon-updated', function(favicon) {
            settings.tab.Favicon.html("<div class='favicon' style='background-image: url(\"" + favicon.favicons[0] + "\");'></div>");
            settings.tab.Favicon.css('opacity', "1");
            settings.tab.Preloader.css('opacity', "0");
        });

        return this
    }
}(jQuery))