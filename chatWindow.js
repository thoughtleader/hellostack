function setup$j() {
  if(!window.$j) {
    include "config.js"
  }
  jQuery("body").on({
    "chat.ready": function(e) {
      var $body = jQuery(this);
      WebFontConfig = {
        google: {
          families: ['Roboto:400,500,700']
        }
      };

      (function(d) {
        var wf = d.createElement('script'), s = d.scripts[0];
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
        wf.async = true;

        s.parentNode.insertBefore(wf, s);

        if($j.options.bubble.version==1) {
          return false;
        }

        var $bubble = $j.el.chat.bubble = jQuery($j.html.bubble)
          .appendTo($body)
          .css("z-index", $.style.zIndex);

        $j.el.chat.notifications = $bubble.find("[chat=notifications] > div");
        $j.el.chat.master_button = $bubble.find("[chat=master_button]");
        // SET some of the themeable/configurable styles (TODO > migrate to POSTCSS so this is much more seamless)
        $bubble.find("[chat=master_button] [chat=icon]").css($j.style.master_button)

        init_bubble_events($bubble)

      })(document);
    }
  });

  function init_bubble_events($bubble) {
    // TODO: THESE functions SHOULD NOT JUST SIT HERE IN THIS SCOPE
    function count_queue() {
      var $queue = $j.el.chat.notifications;

      return $j.el.chat.master_button
        .add($queue.parent())
        .attr({
          queued_messages:$queue.find("[chat=message]").length
        })
    }

    $bubble
      .on({
        /*
            $j.el.chat.bubble.trigger("notify.message", {
              subject:"New message",
              message:"<p>Here's <b>an easy way to reduce</b> paper. Choose to receive bill notifications and payment alerts in your inbox.</p>"
            })
        */
        "notify.message": function(e, o) {
          if(!$j.el.chat.window.is("[state=minimized]")) {
            return false;
          }

          var $queue = $j.el.chat.notifications,
            $message = jQuery($j.html.message);

          var subject = o.subject;
          if(!subject) {
            subject = "new message";
          }
          $message
            .attr("index", $queue.find("[chat=message]").length+1)
            .find("[message=subject]").html(subject)
            .css({
              color:$j.style.colors.accent
            })
            .end().find("[message=body]").html(o.message)

          $message.appendTo($queue)

          jQuery("[chat=message]").last().trigger("show.message")
        },
        "queue.message": function() {

        },
        /*
          $j.el.chat.bubble.trigger("show.bubble", function(anim) {})

          TODO -Done: MOVE TO USING TIMELINES IN ANIME (Show has keyframe specs and hide just reverse timeline)
          TODO: Bubble is hidden or shown as part of chat timeline, but need to use show.bubble still without rest of timeline
        */
        "show.bubble":function(e) {
          console.log("SHOW BUBBLE")
          var bubble = $j.motion.animations.bubble.show;
          if(bubble.animation) {
            return bubble.animation.play();
          }
          bubble.animation = anime(bubble.config(e));
        },
        /*
          $j.el.chat.bubble.trigger("hide.bubble", function(anim) {

          })

          TODO - DONE: MOVE TO USING TIMELINES IN ANIME (Show has keyframe specs and hide just reverse timeline)
        */
        "hide.bubble": function(e) {
          var bubble = $j.motion.animations.bubble.hide;
          if(bubble.animation) {
            return bubble.animation.play();
          }
          return bubble.animation = anime(bubble.config(e));
        },
      })
      .on({
        "show.message": function(e, afterRemoving) {
          var $currentMsg = jQuery(this),
            $prevMsg = $currentMsg.prev(), prevMsg;
          if($prevMsg.length<1) {
            prevMsg = ""
          } else {
            prevMsg = $prevMsg[0]
          }

          var timeline = anime.timeline({
            easing:$j.motion.message.show.easing,
            duration: $j.motion.message.show.duration,
            changeComplete: function() {
              count_queue();

              $prevMsg.hide();
            }
          })

          timeline
            .add({
              targets:prevMsg,
              bottom:[0, -350]
            })
            .add({
              targets:$currentMsg[0],
              bottom:[-350, 0]
            });
        },
        "remove.message": function(e) {
          var $currentMsg = jQuery(this),
            $prevMsg = $currentMsg.prev(), prevMsg;
          if($prevMsg.length<1) {
            prevMsg = ""
          } else {
            prevMsg = $prevMsg[0]
          }

          var timeline = anime.timeline({
            easing:$j.motion.message.show.easing,
            duration: $j.motion.message.show.duration,
            changeBegin: function() {
              $prevMsg.show();
            },
            changeComplete: function() {
              $currentMsg.remove();
              count_queue();
            }
          })

          timeline
            .add({
              targets:$currentMsg[0],
              bottom:[0, -350]
            })
            .add({
              targets:prevMsg,
              bottom:[-350, 0]
            });
        },
        "click": function(e) {
          if($j.el.chat) {
            $j.el.chat.window.trigger("chat.expanded");
          }
        }
      }, "[chat=message]")
      .on({
        click: function(e) {
          e.stopImmediatePropagation();
          jQuery(this).trigger("remove.message");
        }
      }, "[action=close]")
      .on({
        click: function(e) {
          e.stopImmediatePropagation();

          if($(this).is("[clickable=false]")) {
            return false;
          }
          $(this).attr("clickable", "false")

          proxyClick();

          var $chat = $j.el.chat;
          // If there is no exisiting DOM for chat window or we have a stored reference but its not visible (because it's removed from active dom)
          if(!$chat.window || !$chat.window.is(":visible")) {
           // AND YET the maximized flag in local storage insists that the chat is already maximized
            if(localStorage.getItem("mpc_chat_maximized")==="true") {
              // THEN make sure to expand to force creation and expansion (this is a hack to deal with mypoloicy events
              proxyClick();
            }
          }

          console.log("Looking for a valid chat contianer")
          $j.timers.chatContainer = setInterval(function() {
            var $chat = $j.el.chat;
            if($chat && $chat.window) {
              console.log("Found a visible and properly inserted chat contianer")
              $chat.window.trigger("chat.expanded");
              clearInterval($j.timers.chatContainer);
            }
          }, 400);

          function proxyClick() {
            var $bubble = jQuery($j.el.app.bubble);
            $bubble[0].click()

            return $bubble;
          }
        }
      }, "[chat=master_button]")

    // TODO: PUT MAX COUNT to keep form blowing things up
    $j.timers.chat_clientID = setInterval(function() {
      var clientID = _chat_clientId;
      if(clientID) {
        clearInterval($j.timers.chat_clientID);
        console.log("CLIENT ID FOUND > ", clientID, Date.now())

        var $chat = $j.el.chat;
        if(localStorage.getItem("mpc_chat_maximized")==="true") {
          return $chat.window.trigger("chat.expanded");
        }

        if($($j.el.app.bubble).css("display")!=="none") {
          $j.data.bubble.app.visible.initally = true;
          return $chat.bubble.trigger("show.bubble");
        }
        $j.data.bubble.app.visible.initally = false;
      }
    }, 300)

  }

  return $j.data;
}
setup$j();

function koreBotChat($) {
  jQuery = $;
  var bot = $j.bot = requireKr('/KoreBot.js').instance();
  var botMessages = {
    message: "Message...",
    connecting: "Connecting...",
    reconnecting: "Reconnecting..."
  };
  var loaded;
  var confirmCloseDialog;
  var messageRead = false; //variable for message read status
  //var chatHistoryLoad = false;
  //var agentTfrOn = false; //Variable for the agent session ON
  var _botInfo = {};
  var detectScriptTag = /<script\b[^>]*>([\s\S]*?)/gm;
  var _eventQueue = {};
  var carouselEles = [];
  var prevRange, accessToken, koreAPIUrl, fileToken, fileUploaderCounter = 0, bearerToken = '', assertionToken = '',
    messagesQueue = [], historyLoading = false;
  var speechServerUrl = '', userIdentity = '', isListening = false, isRecordingStarted = false, isSpeechEnabled = false,
    speechPrefixURL = "", sidToken = "", carouselTemplateCount = 0, waiting_for_message = false, loadHistory = false;
  /******************* Mic variable initilization *******************/
  var _exports = {},
    _template, _this = {};

  var navigator = window.navigator;
  var mediaStream, mediaStreamSource, rec, _connection, intervalKey, context;
  var _permission = false;
  var _user_connection = false;
  var CONTENT_TYPE = "content-type=audio/x-raw,+layout=(string)interleaved,+rate=(int)16000,+format=(string)S16LE,+channels=(int)1";


  var recorderWorkerPath = "../libs/recorderWorker.js";
  var INTERVAL = 250;
  var _pingTimer, _pingTime = 30000, isSendButton = false, allowGoogleSpeech = false;
  var chatRef = {};
  /***************** Mic initilization code end here ************************/

  /******************************* TTS variable initialization **************/
  var _ttsContext = null, _ttsConnection = null, ttsServerUrl = '', ttsAudioSource = null, _txtToSpeak = "",
    isTTSOn = false, isTTSEnabled = false, optionIndex = 65, autoEnableSpeechAndTTS = false;    // Audio context
  /************************** TTS initialization code end here **************/

  /*************************** file upload variable *******************************/
  var appConsts = {};
  var attachmentInfo = {};
  var allowedFileTypes = ["m4a", "amr", "aac", "wav", "mp3", "mp4", "mov", "3gp", "flv", "png", "jpg", "jpeg", "gif", "bmp", "csv", "txt", "json", "pdf", "doc", "dot", "docx", "docm"
    , "dotx", "dotm", "xls", "xlt", "xlm", "xlsx", "xlsm", "xltx", "xltm", "xlsb", "xla", "xlam", "xll", "xlw", "ppt", "pot", "pps", "pptx", "pptm", "potx", "potm", "ppam",
    "ppsx", "ppsm", "sldx", "sldm", "zip", "rar", "tar", "wpd", "wps", "rtf", "msg", "dat", "sdf", "vcf", "xml", "3ds", "3dm", "max", "obj", "ai", "eps", "ps", "svg", "indd", "pct", "accdb",
    "db", "dbf", "mdb", "pdb", "sql", "apk", "cgi", "cfm", "csr", "css", "htm", "html", "jsp", "php", "xhtml", "rss", "fnt", "fon", "otf", "ttf", "cab", "cur", "dll", "dmp", "drv", "7z", "cbr",
    "deb", "gz", "pkg", "rpm", "zipx", "bak", "avi", "m4v", "mpg", "rm", "swf", "vob", "wmv", "3gp2", "3g2", "asf", "asx", "srt", "wma", "mid", "aif", "iff", "m3u", "mpa", "ra", "aiff", "tiff"];
  appConsts.CHUNK_SIZE = 1024 * 1024;
  var filetypes = {}, audio = ['m4a', 'amr', 'wav', 'aac', 'mp3'], video = ['mp4', 'mov', '3gp', 'flv'],
    image = ['png', 'jpg', 'jpeg'];
  filetypes.audio = audio;
  filetypes.video = video;
  filetypes.image = image;
  filetypes.file = {
    limit: {
      size: 25 * 1024 * 1024,
      msg: "Please limit the individual file upload size to 25 MB or lower"
    }
  };
  filetypes.determineFileType = function (extension) {
    extension = extension.toLowerCase();
    if ((filetypes.image.indexOf(extension) > -1)) {
      return "image";
    } else if ((filetypes.video.indexOf(extension) > -1)) {
      return "video";
    } else if ((filetypes.audio.indexOf(extension) > -1)) {
      return "audio";
    } else {
      return "attachment";
    }
  };

  // setInterval(function() {
  //   $j.chat.data("get", "maximized")
  // }, 1000)


  //// SETUP COMM ANALYTICS
  $j.data.setup.comm();
  jQuery("body").trigger("chat.ready");

  var kfrm = {};
  kfrm.net = {};
  window.PieChartCount = 0;
  window.barchartCount = 0;
  window.linechartCount = 0;
  var available_charts = [];
  window.chartColors = ['#75b0fe', '#f78083', '#99ed9e', '#fde296', '#26344a', '#5f6bf7', '#b3bac8', '#99a1fd', '#9cebf9', '#f7c7f4'];
  /**************************File upload variable end here **************************/
  var _escPressed = 0;
  String.prototype.isNotAllowedHTMLTags = function () {
    var wrapper = document.createElement('div');
    wrapper.innerHTML = this;

    var setFlags = {
      isValid: true,
      key: ''
    };
    try {
      if (jQuery(wrapper).find('script').length || jQuery(wrapper).find('video').length || jQuery(wrapper).find('audio').length) {
        setFlags.isValid = false;
      }
      if (jQuery(wrapper).find('link').length && jQuery(wrapper).find('link').attr('href').indexOf('script') !== -1) {
        if (detectScriptTag.test(jQuery(wrapper).find('link').attr('href'))) {
          setFlags.isValid = false;
        } else {
          setFlags.isValid = true;
        }
      }
      if (jQuery(wrapper).find('a').length && jQuery(wrapper).find('a').attr('href').indexOf('script') !== -1) {
        if (detectScriptTag.test(jQuery(wrapper).find('a').attr('href'))) {
          setFlags.isValid = false;
        } else {
          setFlags.isValid = true;
        }
      }
      if (jQuery(wrapper).find('img').length && jQuery(wrapper).find('img').attr('src').indexOf('script') !== -1) {
        if (detectScriptTag.test(jQuery(wrapper).find('img').attr('href'))) {
          setFlags.isValid = false;
        } else {
          setFlags.isValid = true;
        }
      }
      if (jQuery(wrapper).find('object').length) {
        setFlags.isValid = false;
      }

      return setFlags;
    } catch (e) {
      return setFlags;
    }
  };

  String.prototype.escapeHTML = function () {
    //'&': '&amp;',
    var escapeTokens = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };
    var htmlTags = /[<>"']/g;
    return ('' + this).replace(htmlTags, function (match) {
      return escapeTokens[match];
    });
  };

  function xssAttack(txtStr) {
    //   if (compObj && compObj[0] && compObj[0].componentType === "text") {

    var textHasXSS;
    if (txtStr) {
      textHasXSS = txtStr.isNotAllowedHTMLTags();
    }
    if (textHasXSS && !textHasXSS.isValid) {
      txtStr = txtStr.escapeHTML();
    }
    return txtStr;
    //return compObj[0].componentBody;

  }

  var helpers = {
    'nl2br': function (str, runEmojiCheck) {
      if (runEmojiCheck) {
        str = window.emojione.shortnameToImage(str);
      }
      str = str.replace(/(?:\r\n|\r|\n)/g, '<br />');
      return str;
    },
    'br2nl': function (str) {
      str = str.replace(/<br \/>/g, '\n');
      return str;
    },
    'formatAMPM': function (date) {
      var hours = date.getHours();
      var minutes = date.getMinutes();
      var ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      minutes = minutes < 10 ? '0' + minutes : minutes;
      var strTime = hours + ':' + minutes + ' ' + ampm;
      return strTime;
    },
    'formatDate': function (date) {
      var d = new Date(date);
      if (isNaN(d.getTime())) {
        var _tmpDate = new Date().getTime();
        d = new Date(_tmpDate);
      }
      return d.toDateString() + " at " + helpers.formatAMPM(d);
    },
    'convertMDtoHTML': function (val, responseType) {
      var mdre = {};
      //mdre.date = new RegExp(/\\d\(\s*(.{10})\s*\)/g);
      mdre.date = new RegExp(/\\d\(\s*(.{10})\s*(?:,\s*["'](.+?)["']\s*)?\)/g);
      mdre.time = new RegExp(/\\t\(\s*(.{8}\.\d{0,3})\s*\)/g);
      //mdre.datetime = new RegExp(/\\dt\(\s*(.{10})[T](.{12})([z]|[Z]|[+-]\d{4})\s*\)/g);
      mdre.datetime = new RegExp(/\\(d|dt|t)\(\s*([-0-9]{10}[T][0-9:.]{12})([z]|[Z]|[+-]\d{4})[\s]*,[\s]*["']([a-zA-Z\W]+)["']\s*\)/g);
      mdre.num = new RegExp(/\\#\(\s*(\d*.\d*)\s*\)/g);
      mdre.curr = new RegExp(/\\\$\((\d*.\d*)[,](\s*[\"\']\s*\w{3}\s*[\"\']\s*)\)|\\\$\((\d*.\d*)[,](\s*\w{3}\s*)\)/g);

      var regEx = {};
      regEx.SPECIAL_CHARS = /[\=\`\~\!@#\$\%\^&\*\(\)_\-\+\{\}\:"\[\];\',\.\/<>\?\|\\]+/;
      regEx.EMAIL = /^[-a-z0-9~!$%^&*_=+}{\']+(\.[-a-z0-9~!$%^&*_=+}{\']+)*@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,255})+$/i;
      regEx.MENTION = /(^|\s|\\n|")@([^\s]*)(?:[\s]\[([^\]]*)\])?["]?/gi;
      regEx.HASHTAG = /(^|\s|\\n)#(\S+)/g;
      regEx.NEWLINE = /\n/g;
      var _regExForLink = /((?:http\:\/\/|https\:\/\/|www\.)+\S*\.(?:(?:\.\S)*[^\,\s\.])*\/?)/gi;
      // var _regExForMarkdownLink = /\[([^\]]+)\](|\s)+\(([^\)])+\)/g;
      var _regExForMarkdownLink = /\[([^\]]+)\](|\s)\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/g;
      var str = val || '';
      var mmntns = {};
      mmntns.sd = new RegExp(/^(d{1})[^d]|[^d](d{1})[^d]/g);
      mmntns.dd = new RegExp(/^(d{2})[^d]|[^d](d{2})[^d]/g);
      mmntns.fy = new RegExp(/(y{4})|y{2}/g);
      var regexkeys = Object.keys(mdre);

      function matchmap(regexval, stringval) {
        var da;
        var matches = [];
        while ((da = regexval.exec(stringval)) !== null) {
          var keypair = {};
          keypair.index = da.index;
          keypair.matchexp = da[0];
          if (da.length > 1) {
            for (var n = 1; n < da.length; n++) {
              var mstr = "matchval" + n.toString();
              keypair[mstr] = da[n];
            }
          }
          matches.push(keypair);
        }
        return matches;
      }

      function ucreplacer(match) {
        return match.toUpperCase();
      }

      for (var j = 0; j < regexkeys.length; j++) {
        var k;
        switch (regexkeys[j]) {
          case 'date':
            var strvald = str;
            var datematcharray = matchmap(mdre.date, strvald);
            if (datematcharray.length) {
              for (k = 0; k < datematcharray.length; k++) {
                //var fdate = moment(datematcharray[k].matchval).format('DD,dd,MM,YYY');
                var fdate = new Date(datematcharray[k].matchval1).toLocaleDateString();
                fdate = ' ' + fdate.toString() + ' ';
                str = str.replace(datematcharray[k].matchexp.toString(), fdate);
              }
            }
            break;
          case 'time':
            var strvalt = str;
            var timematcharray = matchmap(mdre.time, strvalt);
            if (timematcharray.length) {
              for (k = 0; k < timematcharray.length; k++) {
                var ftime = new Date(timematcharray[k].matchval1).toLocaleTimeString();
                ftime = ' ' + ftime.toString() + ' ';
                str = str.replace(timematcharray[k].matchexp.toString(), ftime);
              }
            }
            break;
          case 'datetime':
            var strvaldt = str;
            var dtimematcharray = matchmap(mdre.datetime, strvaldt);
            if (dtimematcharray.length) {
              for (k = 0; k < dtimematcharray.length; k++) {
                var ms = '';
                var mergekeylength = Object.keys(dtimematcharray[k]).length - 2;
                for (var l = 2; l < mergekeylength; l++) {
                  var keystr = "matchval" + l.toString();
                  ms += dtimematcharray[k][keystr];
                }
                var foptionstring = "matchval" + mergekeylength.toString();
                var fmtstr = dtimematcharray[k][foptionstring];
                fmtstr = fmtstr.replace(mmntns.fy, ucreplacer);
                fmtstr = fmtstr.replace(mmntns.dd, ucreplacer);
                fmtstr = fmtstr.replace(mmntns.sd, ucreplacer);
                //var fdtime = new Date(dtimematcharray[k].matchval).toLocaleString();
                var fdtime = moment(ms).format(fmtstr);
                fdtime = ' ' + fdtime.toString() + ' ';
                str = str.replace(dtimematcharray[k].matchexp.toString(), fdtime);
              }
            }
            break;
          case 'num':
            var strnumval = str;
            var nummatcharray = matchmap(mdre.num, strnumval);
            if (nummatcharray.length) {
              for (k = 0; k < nummatcharray.length; k++) {
                var fnum = Number(nummatcharray[k].matchval1).toLocaleString();
                fnum = ' ' + fnum.toString() + ' ';
                str = str.replace(nummatcharray[k].matchexp.toString(), fnum);
              }
            }
            break;
          case 'curr':
            var strcurval = str;
            var currmatcharray = matchmap(mdre.curr, strcurval);
            var browserLang = window.navigator.language || window.navigator.browserLanguage;
            var curcode = new RegExp(/\w{3}/);
            if (currmatcharray.length) {
              for (k = 0; k < currmatcharray.length; k++) {
                var currops = {}, fcode;
                currops.style = 'currency';
                if (currmatcharray[k].matchval2) {
                  fcode = curcode.exec(currmatcharray[k].matchval2);
                }
                currops.currency = fcode[0].toString();
                var fcurr = Number(currmatcharray[k].matchval1).toLocaleString(browserLang, currops);
                //check for browser support if browser doesnot suppor we get the same value back and we append the currency Code
                if (currmatcharray[k].matchval1.toString() === fcurr.toString()) {
                  fcurr = ' ' + fcurr.toString() + ' ' + currops.currency;
                } else {
                  fcurr = ' ' + fcurr.toString() + ' ';
                }
                str = str.replace(currmatcharray[k].matchexp.toString(), fcurr);
              }
            }
            break;
        }
      }

      function nextLnReplacer(match, p1, offset, string) {
        return "<br/>";
      }

      function ignoreWords(str) {
        var _words = ['onclick', 'onmouse', 'onblur', 'onscroll', 'onStart'];
        _words.forEach(function (word) {
          var regEx = new RegExp(word, "ig");
          str = str.replace(regEx, "");
        });
        return str;
      }

      var nextln = regEx.NEWLINE;

      function linkreplacer(match, p1, offset, string) {
        var dummyString = string.replace(_regExForMarkdownLink, '[]');
        dummyString = ignoreWords(dummyString);
        if (dummyString.indexOf(match) !== -1) {
          var _link = p1.indexOf('http') < 0 ? 'http://' + match : match, _target;
          //_link = encodeURIComponent(_link);
          _target = "target='_blank'";
          return "<span class='isLink'><a " + _target + " href=\"" + _link + "\">" + match + "</a></span>";
        } else {
          return match;
        }
      }

      //check for whether to linkify or not
      try {
        str = decodeURIComponent(str);
      } catch (e) {
        str = str || '';
      }
      var newStr = '', wrapper1;
      if (responseType === 'user') {
        str = str.replace(/onerror=/gi, 'abc-error=');
        wrapper1 = document.createElement('div');
        newStr = str.replace(/â€œ/g, '\"').replace(/â€/g, '\"');
        newStr = newStr.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        wrapper1.innerHTML = xssAttack(newStr);
        if (jQuery(wrapper1).find('a').attr('href')) {
          str = newStr;
        } else {
          str = newStr.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(_regExForLink, linkreplacer);
        }
      } else {
        wrapper1 = document.createElement('div');
        //str = str.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        wrapper1.innerHTML = xssAttack(str);
        if (jQuery(wrapper1).find('a').attr('href')) {
          var linkArray = str.match(/<a[^>]*>([^<]+)<\/a>/g);
          for (var x = 0; x < linkArray.length; x++) {
            var _newLA = document.createElement('div');
            _newLA.innerHTML = linkArray[x];
            jQuery(_newLA).find('a').attr('target', '_blank');
            str = str.replace(linkArray[x], _newLA.innerHTML);
          }
        } else {
          str = wrapper1.innerHTML.replace(_regExForLink, linkreplacer);
        }
      }
      str = helpers.checkMarkdowns(str);
      if (responseType === 'user') {
        str = str.replace(/abc-error=/gi, 'onerror=');
      }
      return helpers.nl2br(str, true);
    },
    'checkMarkdowns': function (val) {
      var txtArr = val.split(/\r?\n/);
      for (var i = 0; i < txtArr.length; i++) {
        var _lineBreakAdded = false;
        if (txtArr[i].indexOf('#h6') === 0 || txtArr[i].indexOf('#H6') === 0) {
          txtArr[i] = '<h6>' + txtArr[i].substring(3) + '</h6>';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('#h5') === 0 || txtArr[i].indexOf('#H5') === 0) {
          txtArr[i] = '<h5>' + txtArr[i].substring(3) + '</h5>';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('#h4') === 0 || txtArr[i].indexOf('#H4') === 0) {
          txtArr[i] = '<h4>' + txtArr[i].substring(3) + '</h4>';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('#h3') === 0 || txtArr[i].indexOf('#H3') === 0) {
          txtArr[i] = '<h3>' + txtArr[i].substring(3) + '</h3>';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('#h2') === 0 || txtArr[i].indexOf('#H2') === 0) {
          txtArr[i] = '<h2>' + txtArr[i].substring(3) + '</h2>';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('#h1') === 0 || txtArr[i].indexOf('#H1') === 0) {
          txtArr[i] = '<h1>' + txtArr[i].substring(3) + '</h1>';
          _lineBreakAdded = true;
        } else if (txtArr[i].length === 0) {
          txtArr[i] = '\r\n';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('*') === 0) {
          if (!isEven(txtArr[i].split('*').length - 1)) {
            txtArr[i] = '\r\n&#9679; ' + txtArr[i].substring(1);
            _lineBreakAdded = true;
          }
        } else if (txtArr[i].indexOf('>>') === 0) {
          txtArr[i] = '<p class="indent">' + txtArr[i].substring(2) + '</p>';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('&gt;&gt;') === 0) {
          txtArr[i] = '<p class="indent">' + txtArr[i].substring(8) + '</p>';
          _lineBreakAdded = true;
        } else if (txtArr[i].indexOf('---') === 0 || txtArr[i].indexOf('___') === 0) {
          txtArr[i] = '<hr/>' + txtArr[i].substring(3);
          _lineBreakAdded = true;
        }
        var j;
        // Matches Image markup ![test](http://google.com/image.png)
        if (txtArr[i].indexOf(' ![') === -1) {// replace method trimming last'$' character, to handle this adding ' ![' extra space
          txtArr[i] = txtArr[i].replace('![', ' ![');
        }
        var _matchImage = txtArr[i].match(/\!\[([^\]]+)\](|\s)+\(([^\)])+\)/g);
        if (_matchImage && _matchImage.length > 0) {
          for (j = 0; j < _matchImage.length; j++) {
            var _imgTxt = _matchImage[j].substring(2, _matchImage[j].indexOf(']'));
            var remainingString = _matchImage[j].substring(_matchImage[j].indexOf(']') + 1).trim();
            var _imgLink = remainingString.substring(1, remainingString.indexOf(')'));
            _imgLink = '<img src="' + _imgLink + '" alt="' + _imgTxt + '">';
            var _tempImg = txtArr[i].split(' ');
            for (var k = 0; k < _tempImg.length; k++) {
              if (_tempImg[k] === _matchImage[j]) {
                _tempImg[k] = _imgLink;
              }
            }
            txtArr[i] = _tempImg.join(' ');
            txtArr[i] = txtArr[i].replace(_matchImage[j], _imgLink);
          }
        }
        // Matches link markup [test](http://google.com/)
        ///var _matchLink = txtArr[i].match(/\[([^\]]+)\](|\s)+\(([^\)])+\)/g);
        var _matchLink = txtArr[i].match(/\[([^\]]+)\](|\s)\((?:[^)(]+|\((?:[^)(]+|\([^)(]*\))*\))*\)/g);
        if (_matchLink && _matchLink.length > 0) {
          for (j = 0; j < _matchLink.length; j++) {
            var _linkTxt = _matchLink[j].substring(1, _matchLink[j].indexOf(']'));
            var remainingString = _matchLink[j].substring(_matchLink[j].indexOf(']') + 1).trim();
            var _linkLink = remainingString.substring(1, remainingString.indexOf(')'));
            _linkLink = _linkLink.replace(/\\n/g, "%0A");
            _linkLink = '<span class="isLink"><a href="' + _linkLink + '" target="_blank">' + helpers.checkMarkdowns(_linkTxt) + '</a></span>';
            txtArr[i] = txtArr[i].replace(_matchLink[j], _linkLink);
          }
        }
        // Matches bold markup *test* doesnot match * test *, * test*. If all these are required then replace \S with \s
        var _matchAstrik = txtArr[i].match(/\*\S([^*]*?)\*/g);
        if (_matchAstrik && _matchAstrik.length > 0) {
          for (j = 0; j < _matchAstrik.length; j++) {
            var _boldTxt = _matchAstrik[j];
            _boldTxt = _boldTxt.substring(1, _boldTxt.length - 1);
            _boldTxt = '<b>' + _boldTxt.trim() + '</b>';
            txtArr[i] = txtArr[i].replace(_matchAstrik[j], _boldTxt);
          }
        }
        // Matches bold markup ~test~ doesnot match ~ test ~, ~test ~, ~ test~. If all these are required then replace \S with \s
        var _matchItalic = txtArr[i].match(/\~\S([^*]*?)\S\~/g);
        if (_matchItalic && _matchItalic.length > 0) {
          for (j = 0; j < _matchItalic.length; j++) {
            var _italicTxt = _matchItalic[j];
            if (txtArr[i].indexOf(_italicTxt) === 0 || txtArr[i][txtArr[i].indexOf(_italicTxt) - 1] === ' ' || txtArr[i].indexOf(_italicTxt) !== -1) {
              _italicTxt = _italicTxt.substring(1, _italicTxt.length - 1);
              _italicTxt = '<i class="markdownItalic">' + _italicTxt + '</i>';
              txtArr[i] = txtArr[i].replace(_matchItalic[j], _italicTxt);
            }
          }
        }
        // Matches bold markup ~test~ doesnot match ~ test ~, ~test ~, ~ test~. If all these are required then replace \S with \s
        var _matchPre = txtArr[i].match(/\`\`\`\S([^*]*?)\S\`\`\`/g);
        var _matchPre1 = txtArr[i].match(/\'\'\'\S([^*]*?)\S\'\'\'/g);
        if (_matchPre && _matchPre.length > 0) {
          for (j = 0; j < _matchPre.length; j++) {
            var _preTxt = _matchPre[j];
            _preTxt = _preTxt.substring(3, _preTxt.length - 3);
            _preTxt = '<pre>' + _preTxt + '</pre>';
            txtArr[i] = txtArr[i].replace(_matchPre[j], _preTxt);
          }
          _lineBreakAdded = true;
        }
        if (_matchPre1 && _matchPre1.length > 0) {
          for (j = 0; j < _matchPre1.length; j++) {
            var _preTxt = _matchPre1[j];
            _preTxt = _preTxt.substring(3, _preTxt.length - 3);
            _preTxt = '<pre>' + _preTxt + '</pre>';
            txtArr[i] = txtArr[i].replace(_matchPre1[j], _preTxt);
          }
          _lineBreakAdded = true;
        }
        if (!_lineBreakAdded && i > 0) {
          txtArr[i] = '\r\n' + txtArr[i];
        }
      }
      val = txtArr.join('');
      return val;
    }
  };

  function isEven(n) {
    n = Number(n);
    return n === 0 || !!(n && !(n % 2));
  }

  function extend() {
    var rec = function (obj) {
      var recRes = {};
      if (typeof obj === "object") {
        for (var key in obj) {
          if (obj.hasOwnProperty(key)) {
            if (typeof obj[key] === "object") {
              recRes[key] = rec(obj[key]);
            } else {
              recRes[key] = obj[key];
            }
          }
        }
        return recRes;
      } else {
        return obj;
      }
    };
    for (var i = 1; i < arguments.length; i++) {
      for (var key in arguments[i]) {
        if (arguments[i].hasOwnProperty(key)) {
          if (typeof arguments[i][key] === "object") {
            arguments[0][key] = rec(arguments[i][key]);
          } else {
            arguments[0][key] = arguments[i][key];
          }
        }
      }
    }
    return arguments[0];
  }

  function chatWindow(cfg) {
    isRecordingStarted = false;
    cfg.botOptions.test = false;
    this.config = {
      "chatTitle": "Kore.ai Bot Chat",
      "container": "body",
      "allowIframe": false,
      "botOptions": cfg.botOptions
    };
    koreAPIUrl = cfg.botOptions.koreAPIUrl;
    bearerToken = cfg.botOptions.bearer;
    //speechServerUrl = cfg.botOptions.speechSocketUrl;
    speechPrefixURL = cfg.botOptions.koreSpeechAPIUrl;
    ttsServerUrl = cfg.botOptions.ttsSocketUrl;
    userIdentity = cfg.botOptions.userIdentity;
    if (cfg.botOptions.recorderWorkerPath && cfg.botOptions.recorderWorkerPath.trim().length > 0) {
      recorderWorkerPath = cfg.botOptions.recorderWorkerPath.trim();
    }
    if (cfg && cfg.chatContainer) {
      delete cfg.chatContainer;
    }
    this.config = extend(this.config, cfg);
    this.init();
    $j.chat = chatRef = this;
  }

  function resetPingMessage() {
    clearTimeout(_pingTimer);
    _pingTimer = setTimeout(function () {
      var messageToBot = {};
      messageToBot["type"] = 'ping';
      bot.sendMessage(messageToBot, function messageSent() {

      });
      resetPingMessage();
    }, _pingTime);
  }

  // TODO: Refactor some of the resize calls,
  //  1. significant performance issues when throttling (slow devices)
  //  2. resizing and small screens hide positioned dialog
  //  3. all of this needs to move to a jquery or at least error check for undefined before operating on a class list
  //window.onresize = function (event) {
    //if (event.target == window) {
      //var _width = jQuery('#chatContainer').width() - 400;
      //jQuery('.kore-chat-window').attr('style','left: '+_width+'+px');
    //}

    //var $chatWindow = jQuery('.kore-chat-window');
    // if (($chatWindow.width() > 400) || ($chatWindow.length && $chatWindow.is(".expanded"))) {
    //   var _koreChatWindowHeight = $chatWindow.width();
    //   jQuery('.carousel').attr('style', 'width: ' + (_koreChatWindowHeight - 85) + 'px !important');
    // } else {
    //   jQuery('.carousel').attr('style', 'width: 300px !important');
    // }
    // for (var i = 0; i < carouselEles.length; i++) {
    //   carouselEles[i].computeResize();
    // }

    // handling quick replies
    // var quickReplyDivs = document.querySelectorAll('.quickReplies');
    // for (var i = 0; i < quickReplyDivs.length; i++) {
    //   var btnsParentDiv = quickReplyDivs[i].querySelectorAll('.quick_replies_btn_parent');
    //   var leftScrollBtn = quickReplyDivs[i].querySelectorAll('.quickreplyLeftIcon');
    //   var rightScrollBtn = quickReplyDivs[i].querySelectorAll('.quickreplyRightIcon');
    //
    //   if (btnsParentDiv[0].hasChildNodes()) {
    //     if (btnsParentDiv[0].scrollLeft > 0) {
    //       jQuery(leftScrollBtn).removeClass("hide");
    //     } else {
    //       jQuery(leftScrollBtn).addClass('hide');
    //     }
    //     if (btnsParentDiv[0].offsetWidth < btnsParentDiv[0].scrollWidth) {
    //       jQuery(rightScrollBtn).removeClass('hide');
    //     } else {
    //       jQuery(rightScrollBtn).addClass("hide");
    //     }
    //   }
    // }

    /* Handling for full size table */
    // if ($chatWindow.width() > 460) {
    //   jQuery(".accordionTable").each(function () {
    //     if (jQuery(this).hasClass("responsive")) {
    //       jQuery(this).addClass("hide")
    //     }
    //   });
    //   jQuery(".tablechartDiv").each(function () {
    //     if (!jQuery(this).hasClass("regular")) {
    //       jQuery(this).removeClass("hide")
    //     }
    //   });
    // } else {
    //   jQuery(".accordionTable").each(function () {
    //     if (jQuery(this).hasClass("responsive")) {
    //       jQuery(this).removeClass("hide")
    //     }
    //   });
    //   jQuery(".tablechartDiv").each(function () {
    //     if (!jQuery(this).hasClass("regular")) {
    //       jQuery(this).addClass("hide")
    //     }
    //   });
    // }
    /* Handling for table ends*/
  //};

  function isMobile() {
    try {
      var isMobile = (/iphone|ipod|android|blackberry|fennec/).test(navigator.userAgent.toLowerCase()) || window.screen.width <= 480;
      return isMobile;
    } catch (e) {
      return false;
    }
  }


  chatWindow.prototype.init = function () {
    var me = this;
    window.chatContainerConfig = me;
    me.config.botOptions.botInfo.name = me.config.botOptions.botInfo.name.escapeHTML();
    _botInfo = me.config.botOptions.botInfo;
    me.config.botOptions.botInfo = {
      chatBot: _botInfo.name,
      taskBotId: _botInfo._id,
      customData: _botInfo.customData,
      tenanturl: _botInfo.tenanturl
    };
    var tempTitle = _botInfo.name;
    me.config.botMessages = botMessages;

    me.config.chatTitle = me.config.botMessages.connecting;
    me.config.userAgentIE = navigator.userAgent.indexOf('Trident/') !== -1;
    var mobileBrowserOpened = isMobile();
    if (mobileBrowserOpened) {
      me.config.isSendButton = true;
    }
    isSendButton = me.config.isSendButton;
    isTTSEnabled = me.config.isTTSEnabled || false;
    allowGoogleSpeech = me.config.allowGoogleSpeech || false;
    isSpeechEnabled = me.config.isSpeechEnabled || false;
    loadHistory = me.config.loadHistory || false;
    historyLoading = loadHistory ? true : false;
    me.config.botOptions.loadHistory = me.config.loadHistory;
    autoEnableSpeechAndTTS = me.config.autoEnableSpeechAndTTS || false;
    /* autoEnableSpeechAndTTS will on if and only if both tts and mic are enabled */
    if (isTTSEnabled && (isSpeechEnabled || allowGoogleSpeech) && autoEnableSpeechAndTTS) {
      isTTSOn = true;
      setTimeout(function () {
        jQuery('.ttspeakerDiv').removeClass('ttsOff');
      }, 350);
    }
    var chatWindowHtml = jQuery(me.getChatTemplate()).tmpl(me.config);
    me.config.chatContainer = chatWindowHtml;

    me.config.chatTitle = tempTitle;
    bot.init(me.config.botOptions, me.config.messageHistoryLimit);
    if (me.config.allowLocation) {
      bot.fetchUserLocation();
    }
    me.render(chatWindowHtml);
    unfreezeUIOnHistoryLoadingFail();
  };
  /*
      TODO: Break apart destroy > utilize chat.close && chat.closed
  */
  chatWindow.prototype.destroy = function () {
    $j.states.destroying = true;
    if ($j.el.chat && $j.el.chat.window) {
      $j.el.chat.window.trigger({
        type: "chat.minimized",
        after: function () {
          var chat = $j.chat;

          if (chat.config && chat.config.chatContainer) {
            $j.el.chat.window.trigger("agent.reset");

            chat.config.chatContainer.remove();

            // Note/Todo: When removing the chat container above, we need to make sure to remove any references
            var $chat = $j.el.chat;
            $chat.window = null;
            $chat.container = null;
            //TODO: Double check for any old references to this element path
            var $agent = $j.data.agent.$;
            $.each($agent, function (key, value) {
              $agent[key] = null;
            })

            $j.motion.timelines.minimize = null;
            $j.motion.timelines.maximize = null;
          }

          $j.el.chat.notifications.find("[action=close]").trigger("click")

          $j.bot.close();

          //TODO: DO we need to update the param if we discover a situation where initial state is wrong
          //$j.data.bubble.app.visible.initally = false;
          var bubble_enabled = true;
          if($($j.el.app.bubble).css("display")==="none") {
            bubble_enabled = false;
          }
          $("body")
            .attr("chat_state", "closed")
            .attr("bubble_enabled", bubble_enabled)

          $j.states.destroying = false;

          if (ttsAudioSource) {
            ttsAudioSource.stop();
          }
          isTTSOn = false;
          if (_ttsContext) {
            _ttsContext.close();
            _ttsContext = null;
          }
        }
      })
    }
  };

  chatWindow.prototype.resetWindow = function () {
    var me = this;
    me.config.chatContainer.find('.kore-chat-header .header-title').html(me.config.botMessages.reconnecting);
    //me.config.chatContainer.find('.chat-container').html("");
    bot.close();
    me.config.botOptions.restorePS = null;
    me.config.botOptions.jwtGrant = null;
    me.config.botOptions.history = null;
    localStorage.removeItem("history");
    localStorage.removeItem("restorePS");
    localStorage.removeItem("jwtGrant");
    localStorage.removeItem("korecom");
    bot.init(me.config.botOptions);

    $j.data.agent = false;
  };

  chatWindow.prototype.bindEvents = function () {
    var me = this;
    var $body = jQuery("body");
    var _chatContainer = me.config.chatContainer;
    // _chatContainer.draggable({
    //   handle: _chatContainer.find(".kore-chat-header .header-title"),
    //   containment: "document",
    // })
    //   .resizable({
    //     handles: "n, e, w, s",
    //     containment: "document",
    //     minWidth: 400
    //   });

    _chatContainer.off('keyup', '.chatInputBox').on('keyup', '.chatInputBox', function (event) {
      var _footerContainer = jQuery(me.config.container).find('.kore-chat-footer');
      var _bodyContainer = jQuery(me.config.container).find('.kore-chat-body');
      _bodyContainer.css('bottom', _footerContainer.outerHeight());
      prevComposeSelection = window.getSelection();
      prevRange = prevComposeSelection.rangeCount > 0 && prevComposeSelection.getRangeAt(0);
      if (this.innerText.length > 0) {
        _chatContainer.find('.chatInputBoxPlaceholder').css('display', 'none');
        _chatContainer.find('.sendButton').removeClass('disabled');
      } else {
        _chatContainer.find('.chatInputBoxPlaceholder').css('display', 'block');
        _chatContainer.find('.sendButton').addClass('disabled');
      }
    });
    _chatContainer.on('click', '.chatInputBoxPlaceholder', function (event) {
      _chatContainer.find('.chatInputBox').trigger('click');
      _chatContainer.find('.chatInputBox').trigger('focus');
    });
    _chatContainer.on('click', '.chatInputBox', function (event) {
      prevComposeSelection = window.getSelection();
      prevRange = prevComposeSelection.rangeCount > 0 && prevComposeSelection.getRangeAt(0);
    });
    _chatContainer.on('blur', '.chatInputBox', function (event) {
      _escPressed = 0;
    });
    _chatContainer.off('click', '.botResponseAttachments').on('click', '.botResponseAttachments', function (event) {
      window.open(jQuery(this).attr('fileid'), '_blank');
    });
    /*_chatContainer.off('click', '.attachments').on('click', '.attachments', function (event) {
            var attachFileID = jQuery(this).attr('fileid');
            var auth = (bearerToken) ? bearerToken : assertionToken;
            $.ajax({
                type: "GET",
                url: koreAPIUrl + "1.1/attachment/file/" + attachFileID + "/url",
                headers: {
                    Authorization: auth
                },
                success: function (response) {
                    var downloadUrl = response.fileUrl;
                    if (downloadUrl.indexOf("?") < 0) {
                        downloadUrl += "?download=1";
                    } else {
                        downloadUrl += "&download=1";
                    }
                    var save = document.createElement('a');
                    document.body.appendChild(save);
                    save.href = downloadUrl;
                    save.target = '_blank';
                    save.download = 'unknown file';
                    save.style.dislay = 'none !important;';
                    save.click();
                    save.remove();
                },
                error: function (msg) {
                    console.log("Oops, something went horribly wrong");
                }
            });
        });*/
    _chatContainer.off('keydown', '.chatInputBox').on('keydown', '.chatInputBox', function (event) {
      var _this = jQuery(this);
      var _footerContainer = jQuery(me.config.container).find('.kore-chat-footer');
      var _bodyContainer = jQuery(me.config.container).find('.kore-chat-body');
      _bodyContainer.css('bottom', _footerContainer.outerHeight());
      if (event.keyCode === 13) {
        if (event.shiftKey) {
          return;
        }
        if (jQuery('.upldIndc').is(':visible')) {
          alert('Wait until file upload is not completed');
          return;
        }
        if (jQuery('.recordingMicrophone').is(':visible')) {
          jQuery('.recordingMicrophone').trigger('click');
        }
        event.preventDefault();

        me.sendMessage(_this, attachmentInfo);

      } else if (event.keyCode === 27) {
        _escPressed++;
        if (_escPressed > 1) {
          _escPressed = 0;
          stop();
          this.innerText = "";
          jQuery('.attachment').empty();
          fileUploaderCounter = 0;
          setTimeout(function () {
            setCaretEnd((document.getElementsByClassName("chatInputBox")));
          }, 100);
        }
      }
    });
    _chatContainer.off('click', '.sendButton').on('click', '.sendButton', function (event) {
      var _this = jQuery('.chatInputBox');
      if (jQuery('.upldIndc').is(':visible')) {
        alert('Wait until file upload is not completed');
        return;
      }
      if (jQuery('.recordingMicrophone').is(':visible')) {
        jQuery('.recordingMicrophone').trigger('click');
      }
      event.preventDefault();
      me.sendMessage(_this, attachmentInfo);

    });
    _chatContainer.off('click', '.notRecordingMicrophone').on('click', '.notRecordingMicrophone', function (event) {
      if (ttsAudioSource) {
        ttsAudioSource.stop();
      }
      if (isSpeechEnabled) {
        getSIDToken();
      }
    });
    _chatContainer.off('click', '.recordingMicrophone').on('click', '.recordingMicrophone', function (event) {
      stop();
      setTimeout(function () {
        setCaretEnd(document.getElementsByClassName("chatInputBox"));
      }, 350);
    });
    // _chatContainer.off('click', '.attachmentBtn').on('click', '.attachmentBtn', function (event) {
    //   if (fileUploaderCounter == 1) {
    //     alert('You can upload only one file');
    //     return;
    //   }
    //   if (jQuery('.upldIndc').is(':visible')) {
    //     alert('Wait until file upload is not completed');
    //     return;
    //   }
    //   jQuery('#captureAttachmnts').trigger('click');
    // });
    // _chatContainer.off('click', '.removeAttachment').on('click', '.removeAttachment', function (event) {
    //   jQuery(this).parents('.msgCmpt').remove();
    //   jQuery('.kore-chat-window').removeClass('kore-chat-attachment');
    //   fileUploaderCounter = 0;
    //   attachmentInfo = {};
    //   jQuery('.sendButton').addClass('disabled');
    //   document.getElementById("captureAttachmnts").value = "";
    // });
    // _chatContainer.off('change', '#captureAttachmnts').on('change', '#captureAttachmnts', function (event) {
    //   var file = jQuery('#captureAttachmnts').prop('files')[0];
    //
    //   attachFile = jQuery('#captureAttachmnts').prop('files')[0];
    //   if (file && file.size) {
    //     if (file.size > filetypes.file.limit.size) {
    //       alert(filetypes.file.limit.msg);
    //       return;
    //     }
    //   }
    //   cnvertFiles(this, file);
    // });
    _chatContainer.off('paste', '.chatInputBox').on('paste', '.chatInputBox', function (event) {
      event.preventDefault();
      var _this = document.getElementsByClassName("chatInputBox");
      var _clipboardData = event.clipboardData || (event.originalEvent && event.originalEvent.clipboardData) || window.clipboardData;
      var _htmlData = '';
      if (_clipboardData) {
        _htmlData = helpers.nl2br(_clipboardData.getData('text').escapeHTML(), false);
        if (_htmlData) {
          insertHtmlData(_this, _htmlData);
        }
      }
      setTimeout(function () {
        setCaretEnd(_this);
      }, 100);
    });
    _chatContainer.off('click', '.sendChat').on('click', '.sendChat', function (event) {
      var _footerContainer = jQuery(me.config.container).find('.kore-chat-footer');
      me.sendMessage(_footerContainer.find('.chatInputBox'));
    });

    _chatContainer.off('click', 'li a').on('click', 'li a', function (e) {
      e.preventDefault();
      var a_link = jQuery(this).attr('href');
      var _trgt = $(this).attr('target');
      if (_trgt === "_self") {
        callListener("provideVal", {link: a_link});
        return;
      }
      if (me.config.allowIframe === true) {
        me.openPopup(a_link);
      } else {
        var _tempWin = window.open(a_link, "_blank");
      }
    });
    _chatContainer
      .off('click', '.buttonTmplContentBox li,.listTmplContentChild .buyBtn,.viewMoreList .viewMore,.listItemPath,.quickReply,.carouselImageContent,.listRightContent')
      .on('click', '.buttonTmplContentBox li,.listTmplContentChild .buyBtn, .viewMoreList .viewMore,.listItemPath,.quickReply,.carouselImageContent,.listRightContent', function (e) {
        e.preventDefault();
        var type = $(this).attr('type');
        if (type) {
          type = type.toLowerCase();
        }
        if (type == "postback" || type == "text") {
          $('.chatInputBox').text($(this).attr('actual-value') || $(this).attr('value'));
          var _innerText = ($(this)[0] && $(this)[0].innerText) ? $(this)[0].innerText.trim() : "" || ($(this) && $(this).attr('data-value')) ? $(this).attr('data-value').trim() : "";
          me.sendMessage($('.chatInputBox'), _innerText);
        } else if (type == "url" || type == "web_url") {
          var a_link = $(this).attr('url');
          if (a_link.indexOf("http:") < 0 && a_link.indexOf("https:") < 0) {
            a_link = "http:////" + a_link;
          }
          if (e.currentTarget.classList && e.currentTarget.classList.length > 0 && e.currentTarget.classList[0] === 'buttonTmplContentChild') {
            var _tempWin = window.open(a_link, "_self");
          } else {
            var _tempWin = window.open(a_link, "_blank");
          }
        }
        if (e.currentTarget.classList && e.currentTarget.classList.length > 0 && e.currentTarget.classList[0] === 'quickReply') {
          var _parentQuikReplyEle = e.currentTarget.parentElement.parentElement;
          var _leftIcon = _parentQuikReplyEle.parentElement.parentElement.querySelectorAll('.quickreplyLeftIcon');
          var _rightIcon = _parentQuikReplyEle.parentElement.parentElement.querySelectorAll('.quickreplyRightIcon');
          setTimeout(function () {
            _parentQuikReplyEle.parentElement.parentElement.getElementsByClassName('user-account')[0].classList.remove('marginT50');
            _parentQuikReplyEle.parentElement.parentElement.removeChild(_leftIcon[0]);
            _parentQuikReplyEle.parentElement.parentElement.removeChild(_rightIcon[0]);
            _parentQuikReplyEle.parentElement.removeChild(_parentQuikReplyEle);
          }, 50);
        }
        // setTimeout(function () {
        //   var _chatInput = _chatContainer.find('.kore-chat-footer .chatInputBox');
        //   _chatInput.focus();
        // }, 600);
      });

    _chatContainer
      .off('click', '.close-btn')
      .on('click', '.close-btn', function (event) {
        confirmCloseDialog.dialog("open");
      });
    $(function () {
      $j.el.dialog = confirmCloseDialog = $("#confirmClose").dialog({
        autoOpen: false,
        draggable:false,
        resizable: false,
        height: "auto",
        width: 400,
        modal: false,
        dialogClass: "chat-dialog",
        buttons: {
          "STAY": {
            text: 'STAY',
            class: 'alignCloseConfirmDialogButtonLeft',
            id:"cancel",
            click: function () {
              $(this).dialog("close");
            }
          },
          "END CHAT": {
            text: 'END CHAT',
            class: 'alignCloseConfirmDialogButtonRight',
            id:"close",
            click: function () {
              if (localStorage.getItem("agentTfrOn")) {
                var agentTfrOn = localStorage.getItem("agentTfrOn");

                if (agentTfrOn == 'true') {
                  var messageToBot = {};
                  messageToBot["message"] = {body: "endAgentChat"}; //change the key word for ending the chat from bot kit
                  messageToBot["resourceid"] = '/bot.message';
                  bot.sendMessage(messageToBot, function messageSent(err) {});
                }

                localStorage.removeItem("agentTfrOn");
                $j.el.chat.window.trigger("agent.deactivate");
              }

              localStorage.removeItem("restorePS");
              localStorage.removeItem("jwtGrant");
              localStorage.removeItem("korecom");

              $j.el.chat.window.trigger("chat.closed")


              $('.recordingMicrophone').trigger('click');
              if (ttsAudioSource) {
                ttsAudioSource.stop();
              }
              isTTSOn = false;
              if (_ttsContext) {
                _ttsContext.close();
                _ttsContext = null;
              }

              var event;
              if(typeof(Event) === 'function') {
                event = new Event('CHAT_ENDED');
              }else{
                event = document.createEvent('Event');
                event.initEvent('CHAT_ENDED', true, true);
              }
              window.dispatchEvent(event);

              $(this).dialog("close");

              $j.chat.destroy();
            }
          }
        },
        // TODO: Since mutliple jquery, we can't rely on ui being returned
        open: function (e, ui) {

        }
      });
    });

    _chatContainer.off('click', '.quickreplyLeftIcon').on('click', '.quickreplyLeftIcon', function (event) {
      var _quickReplesDivs = event.currentTarget.parentElement.getElementsByClassName('buttonTmplContentChild');
      if (_quickReplesDivs.length) {
        var _scrollParentDiv = event.target.parentElement.getElementsByClassName('quick_replies_btn_parent');
        var _totalWidth = _scrollParentDiv[0].scrollLeft;
        var _currWidth = 0;
        for (var i = 0; i < _quickReplesDivs.length; i++) {
          _currWidth += (_quickReplesDivs[i].offsetWidth + 10);
          if (_currWidth > _totalWidth) {
            //_scrollParentDiv[0].scrollLeft = (_totalWidth - _quickReplesDivs[i].offsetWidth+20);
            $(_scrollParentDiv).animate({
              scrollLeft: (_totalWidth - _quickReplesDivs[i].offsetWidth - 50)
            }, $j.data.options.motion.scrollSpeed.normal, function () {
              // deciding to enable left and right scroll icons
              var rightIcon = _scrollParentDiv[0].parentElement.querySelectorAll('.quickreplyRightIcon');
              rightIcon[0].classList.remove('hide');
              if (_scrollParentDiv[0].scrollLeft <= 0) {
                var leftIcon = _scrollParentDiv[0].parentElement.querySelectorAll('.quickreplyLeftIcon');
                leftIcon[0].classList.add('hide');
              }
            });
            break;
          }
        }
      }
    });
    _chatContainer.off('click', '.quickreplyRightIcon').on('click', '.quickreplyRightIcon', function (event) {
      var _quickReplesDivs = event.currentTarget.parentElement.getElementsByClassName('buttonTmplContentChild');
      if (_quickReplesDivs.length) {
        var _scrollParentDiv = event.target.parentElement.getElementsByClassName('quick_replies_btn_parent');
        var _totalWidth = event.target.parentElement.offsetWidth;
        var _currWidth = 0;
        // calculation for moving element scroll
        for (var i = 0; i < _quickReplesDivs.length; i++) {
          _currWidth += (_quickReplesDivs[i].offsetWidth + 10);
          if (_currWidth > _totalWidth) {
            //_scrollParentDiv[0].scrollLeft = _currWidth;
            $(_scrollParentDiv).animate({
              scrollLeft: (_scrollParentDiv[0].scrollLeft + _quickReplesDivs[i].offsetWidth + 20)
            }, $j.data.options.motion.scrollSpeed.normal, function () {
              // deciding to enable left and right scroll icons
              var leftIcon = _scrollParentDiv[0].parentElement.querySelectorAll('.quickreplyLeftIcon');
              leftIcon[0].classList.remove('hide');
              if ((_scrollParentDiv[0].scrollLeft + _totalWidth + 10) >= _scrollParentDiv[0].scrollWidth) {
                var rightIcon = _scrollParentDiv[0].parentElement.querySelectorAll('.quickreplyRightIcon');
                rightIcon[0].classList.add('hide');
              }
            });
            break;
          }
        }
      }
    });

    // TODO: WHAT IS GOING ON WITH THIS EVENT AND THE NEXT EVENT...LOOKS LIKE A CONFLICT
    _chatContainer
      .off('click', '.minimize-btn')
      .on('click', '.minimize-btn', function (event) {
        if (me.minimized === true) {
          $j.el.chat.window.trigger("chat.expanded");
        } else {
          $j.el.chat.window.trigger("chat.minimized");
        }

        $('.recordingMicrophone').trigger('click');
        if (ttsAudioSource) {
          ttsAudioSource.stop();
        }
      });
    _chatContainer
      .off('click', '.minimized')
      .on('click', '.minimized', function (event) {
        $j.el.chat.window.trigger("chat.expanded");
      });

    // _chatContainer
    //   .off('click', '.reload-btn')
    //   .on('click', '.reload-btn', function (event) {
    //     $(this).addClass("disabled").prop('disabled', true);
    //     me.resetWindow();
    //     $('.recordingMicrophone').trigger('click');
    //     if (ttsAudioSource) {
    //       ttsAudioSource.stop();
    //     }
    //   });
    _chatContainer
      .off('click', '.ttspeaker')
      .on('click', '.ttspeaker', function (event) {
        if (isTTSEnabled) {
          if (isTTSOn) {
            if (ttsAudioSource) {
              ttsAudioSource.stop();
            }
            cancelTTSConnection();
            isTTSOn = false;
            $('#ttspeaker')[0].pause();
            $('.ttspeakerDiv').addClass('ttsOff');
          } else {
            if (!_ttsConnection) {
              _ttsConnection = createSocketForTTS();
            }
            isTTSOn = true;
            $('.ttspeakerDiv').removeClass('ttsOff');
          }
        }
      });

    bot
      .removeAllListeners()
      .on("reset", function (data) {
        $j.el.chat.window.trigger("chat.reset", {
          storage:localStorage,
          chatWindow:me
        });
      })
      .on("open", function (response) {
        accessToken = me.config.botOptions.accessToken;
        var _chatInput = _chatContainer.find('.kore-chat-footer .chatInputBox');
        _chatContainer
          .find(".kore-chat-header")
          .find(".header-title").html(me.config.chatTitle)
          .attr('title', me.config.chatTitle)
          .end().find(".disabled")
          .prop("disabled", false)
          .removeClass("disabled");

        var jwtGrant = bot.getJwtGrantData();
        localStorage.setItem("jwtGrant", JSON.stringify(jwtGrant));
        localStorage.setItem("restorePS", true);

        //localStorage.setItem("chatHistoryCount", 10);
        if (!loadHistory) {
          $('.chatInputBox').focus();
          $('.disableFooter').removeClass('disableFooter');
        }
        // $j.el.chat.container.trigger({
        //   type:"gotoRecent",
        //   speed:"instant"
        // })
      })
      .on("message", function (message) {
        if (me.popupOpened === true) {
          $('.kore-auth-popup .close-popup').trigger("click");
        }

        var tempData = JSON.parse(message.data);
        // _chatContainer.trigger({
        //   type: "response",
        //   json: tempData
        // });

        _chatContainer.trigger({
          type: "response.bot",
          json: tempData,
          after:function(message) {
            console.log("RESPONSE BOT CALLBACK w/message ", message)
          }
        });

        // TODO: REFACTOR ALL THIS EXCESSIVE PROCESSING SINCE WE MOVED TO USING DEFIANT TO DO FUZZY XPATH SEAERCHES
        if (tempData.from === "bot" && tempData.type === "bot_response") {
          var msg = "";
          if (tempData.message[0]) {

            if (!tempData.message[0].cInfo) {
              tempData.message[0].cInfo = {
                body:""
              };
            }
            if (tempData.message[0].component && !tempData.message[0].component.payload.text) {
              try {
                msg = tempData.message[0].component = JSON.parse(tempData.message[0].component.payload);
              } catch (err) {
                msg = tempData.message[0].component = tempData.message[0].component.payload;
              }
            }
            if (tempData.message[0].component && tempData.message[0].component.payload && tempData.message[0].component.payload.text) {
              msg = tempData.message[0].cInfo.body = tempData.message[0].component.payload.text;
            }
          }

          if (loadHistory && historyLoading) {
            messagesQueue.push(tempData);

            _chatContainer.trigger({
              type: "response.history",
              json: messageQueue
            });
          } else {
            me.renderMessage(tempData);
          }
        } else if (tempData.from === "self" && tempData.type === "user_message") {
          var tempmsg = tempData.message;
          var msgData = {};
          if (tempmsg && tempmsg.attachments && tempmsg.attachments[0] && tempmsg.attachments[0].fileId) {
            msgData = {
              'type': "currentUser",
              "message": [{
                'type': 'text',
                'cInfo': {'body': tempmsg.body, attachments: tempmsg.attachments},
                'clientMessageId': tempData.id
              }],
              "createdOn": tempData.id
            };
          } else {
            msgData = {
              'type': "currentUser",
              "message": [{
                'type': 'text',
                'cInfo': {'body': tempmsg.body},
                'clientMessageId': tempData.id
              }],
              "createdOn": tempData.id
            };
          }
          me.renderMessage(msgData);
        }

        if(msg && msg.length>0) {
          var type = $.type(msg);
          if(type==="string") {
            msg = JSON.stringify(msg);
          }
          // TODO: Convert to object oriented methods
          var statusCode = false;
          // IF the mesage is not a contained in the list of status codes
          if($j.data.comm.statusCodes.indexOf(msg) > -1) {
             statusCode = true;
          }
          // TODO: No need to classify if we can classify it as a status code
          var classification = $j.data.comm.methods.analyze(msg);
          if(classification) {
            var scene = classification.scene;
            // TODO: Implement method helper to make case handling more OO
            if(scene==="welcome") {
              // TODO: Implement method to reset $j.data.comm
              $j.data.comm.states.provideFeedback = false;
            }
            if(scene==="provideFeedback") {
              $j.data.comm.states.provideFeedback = true;
            }

            // TODO: Handle closing chat on re-entry
            if($j.data.comm.states.provideFeedback===true && scene === "botThanksUser") {
              setTimeout(function() {
                $j.el.chat.window.trigger("chat.close");
              }, $j.data.options.autoClose.delay)
            }
            if(scene==="providedFeedback") {
              setTimeout(function() {
                $j.el.chat.window.trigger("chat.close");
              }, $j.data.options.autoClose.delay);
            }
          }
        }

        if (tempData.type === "appInvalidNotification") {
          setTimeout(function () {
            $('.trainWarningDiv').addClass('showMsg');
          }, 2000)
        }
      });

    // // TODO: Move this more event driven
    // function closeChat(){
    //   $(".chat-box-controls .close-btn").trigger("click");
    //   // NOTE: Potential issue here since the chat dialog could be delayed in being viewed
    //   $(".ui-button:contains(END CHAT)").trigger("click");
    //
    //   localStorage.removeItem("mpc_chat_maximized")
    // }


    _chatContainer
    // TODO: ABSTRACT INVERSE PROPS IN EXPANDED AND MINIMIZED
      .on({
        /*
          $j.el.chat.window.trigger("chat.expanded");

          TODO: Settle on terminology for expansion event (using maximize/expand/& show)
        */
        "chat.expanded":function(e, o) {
          var timeline = $j.motion.timelines.maximize;
          if(timeline) {
            return timeline.play();
          }

          timeline = $j.motion.timelines.maximize = anime.timeline({
            easing: 'easeOutCubic',
            duration: 800,
            changeBegin:function(anim) {
              var $chat = $j.el.chat;
              $chat.window.attr("state", "maximizing");
              // TODO: Move window updates to event on body
              $("body").attr("bubble_enabled", $j.data.bubble.app.visible.initally)

              $chat.notifications.find("[chat=message]").trigger("remove.message")
            },
            changeComplete:function(anim) {
              var $chat = $j.el.chat.window;

              $chat
                .removeClass("minimize")
                .attr("state", "maximized")
                .closest("body").attr("chat_state", "expanded");

              localStorage.setItem("mpc_chat_maximized", true)

              $j.el.chat.container.trigger({
                type:"gotoRecent",
                speed:"instant"
              });

              // TODO: Add enabled and disabled events to master button
              $j.el.chat.master_button.attr("clickable", "true")

              // $j.el.chat.notifications.find("[action=close]").trigger("click")
            }
          });

          timeline
            .add($j.motion.animations.bubble.hide.config(e))
            .add({
              targets: ".kore-chat-window",
              translateY: ["105%", "0%"],
              duration:450
            }, "-=400");
        },
        /*

            $j.el.chat.window.trigger("chat.minimized");
        */
        "chat.minimized":function(e) {
          var timeline = $j.motion.timelines.minimize;
          if(timeline) {
            timeline.play();
            if(e.after) {
              return e.after($j.el.chat.window)
            }
            return timeline;
          }

          timeline = $j.motion.timelines.minimize = anime.timeline({
            easing: 'easeOutElastic(1, .9)',
            duration: 900,
            changeBegin: function() {
              if($j.el.chat.window) {
                $j.el.chat.window.attr("state", "minimizing");
              }
            },
            changeComplete: function(anim) {
              var $chat = $j.el.chat.window;
              if($j.el.chat.window) {
                $chat
                  .addClass("minimize")
                  .attr("state", "minimized")
                  .closest("body").attr("chat_state", "minimized");
              }

              if($j.states.unloading!==true) {
                localStorage.setItem("mpc_chat_maximized", false)

                $j.el.chat.bubble.trigger("show.bubble");

                if(e.after) {
                  return e.after($chat)
                }
              }
            }
          });

          timeline
            .add({
              targets: ".kore-chat-window",
              translateY: ["0%", "105%"],
            })

          },
        /*
            $j.el.chat.window.trigger("chat.close", {
              chat:me
            });
        */
        "chat.close": function(e, o) {
          // TODO: Move this more event driven
          $(this).find(".chat-box-controls .close-btn").trigger("click")
          $(".ui-button:contains(END CHAT)").trigger("click");

          $(this).trigger({
            type:"chat.closed"
          })
        },
        /*
            $j.el.chat.window.trigger("chat.closed", {
              chat:me
            });
        */
        "chat.closed":function(e) {
          if($j.states.unloading!==true) {
            localStorage.removeItem("mpc_chat_maximized");
          }

          $("body").attr({
            chat_state: "closed"
          });
        },
        /*
           $j.el.chat.window.trigger("chat.reset");
        */
        "chat.reset": function(e, o) {
          //console.log("chat resetting", o);
          localStorage.removeItem("mpc_chat_maximized")

          var chat = $j.chat;
          chat.storage.removeItem("history");
          chat.storage.removeItem("restorePS");
          chat.storage.removeItem("jwtGrant");
          chat.storage.removeItem("korecom");
          chat.resetWindow();
        },
        "chat.error": function(e, error) {
          if(!error) {
            error = "Unknown Error with the Chat";
          }

          return _chatContainer
            .find(".errorMsgBlock").addClass("showError")
            .text(error);
        },
        "agent.initiate": function (e, callback) {
          // NOTE: Because MyPolicy is loading several versions of jQuery, can't rely on jQuery data
          //       so mocking this feature into the window under my $j namespace
          if (!window.$j) {
            window.$j = {data: {}};
          }

          var agent = $j.data.agent;

          if (!agent || _chatContainer.find("#liveAgentActor").length < 1) {
            agent = $j.data.agent = {
              active: null,
              setup: false,
              scroll: {
                count: 0,
                throttle: null
              },
              $: {
                window: $("body").find(".kore-chat-window"),
                // scroll:null,
                chatContainer:null,
                actor: null
              },
              init: {
                event: null
              }
            };
            agent.$.scroll = $j.el.chat.container = agent.$.chatContainer = agent.$.window.find(".chat-container");
            $j.el.chat.window = agent.$.window;
          }


          if (!agent.setup) {
            if($j.options.liveAgent.button===true) {
              addActor();
            }
            $j.data.agent.setup = true;
          }

          var localStorage = window.localStorage,
            initEvent;// = "agent.deactivate";
          if (localStorage) {
            var localAgentFlag = JSON.parse(localStorage.getItem("agentTfrOn"));
            if (localAgentFlag === true) {
              initEvent = "agent.activate";
            } else {
              // !localAgentFlag || localAgentFlag==='false'
              initEvent = "agent.deactivate";
            }
          }
          $j.data.agent.init.event = initEvent;

          $(this).trigger("agent.inited", function (callback) {
            $(this).trigger($j.data.agent.init.event);

            if (callback) {
              return callback.apply($(this));
            }
          });

          function addActor() {
            var $actor = $("<div id='liveAgentActor' distance='close'><div>live agent</div></div>");

            $j.data.agent.$.actor = $actor.insertBefore(_chatContainer.find(".kore-chat-footer"));

            $j.data.agent.$.actor.children("div").on("click", function () {
              //NOTE: Shouldn't be triggered if agent is active but relying on dom visibility mainly is not a reliably method
              if ($j.data.agent.active !== true && !$(this).parent().is("[disabled=disabled]")) {
                $(this).trigger("clicked");
              }
            });
          }
        },
        "agent.inited": function (e, callback) {
          if (callback) {
            return callback.apply($(this), [callback]);
          }
        },
        "agent.reset": function (e) {
          $j.data.agent = false;
        },
        "agent.activate": function (e, callback) {
          if($j.options.liveAgent.button===true) {
            if($j.data.agent && $j.data.agent.$.scroll) {
              $j.data.agent.$.scroll.trigger("scrolling.deactivate");
            }
          }

          $(this).trigger("agent.active");
        },
        "agent.active": function (e) {
          $j.data.agent.active = true;

          var localStorage = window.localStorage;
          if (localStorage) {
            localStorage.setItem("agentTfrOn", true);
          }
        },
        "agent.deactivate": function (e) {
          if($j.options.liveAgent.button===true) {
            if($j.data.agent && $j.data.agent.$.scroll) {
              $j.data.agent.$.scroll.trigger("scrolling.activate");
            }
          }

          $(this).trigger("agent.deactive");
        },
        "agent.deactive": function (e) {

          $j.data.agent.active = false;

          // Note: should be using false or null vs removing the value.
          var localStorage = window.localStorage;
          if (localStorage) {
            localStorage.setItem("agentTfrOn", false);
          }
        },
        "response": function (e) {

        },
        "response.bot": function (e) {
          var response = e.json;
          if(!response) {
            return false;
          }

          var message = {
            content:null,
            notify:false,
          };

          var haystack = defiant.search(response, '//body | //message | //payload/payload/text');

          var str = haystack[0];
          if(haystack[1]) {
            str = haystack[1];
          }
          message.content = str;

          if(str && $j.data.comm.statusCodes.join().toLowerCase().search(message.content.toLowerCase())<0) {
            message.notify = true;
          }

          if($j.options.bubble.version===1) {
            return false;
          }
          if(message.notify!==true) {
            return false;
          }

          if(e.after) {
            e.after.apply($(this), [message])
          }

          $j.el.chat.bubble.trigger("notify.message", {
            subject: "New message",
            message: "<p>" + $.trim(message.content).split("\n\n").join("</p><p>") + "</p>"
          });

          if($j.options.liveAgent.button===true) {
            var agent = $j.data.agent;
            if(!agent) {
              return false;
            }
            $j.data.agent.$.scroll.trigger("scrolling.event");
          }
        },
        "response.history": function (e) {
          //console.log("response history", e.json)
        }

      })
      .on({
        /*
            $j.el.chat.container.trigger({
              type:"gotoRecent",
              speed:"instant"
            });

            $j.el.chat.container.trigger({
               type:"gotoRecent",
               speed:"instant"
            })

            TODO: Look into why so many calls happen occassionaly to goto Recent
        */
        "gotoRecent": function(e) {
          var speed = e.speed;

          if(!speed) {
            speed = "normal";
          }

          var $chat = $j.el.chat.container;
          var $lastMsg = $chat.children("li:visible").last();

          var top = 10000;
          if($lastMsg.length>0) {
            if($lastMsg && $lastMsg[0]) {
              top = $lastMsg[0].offsetTop;
            }
          }
          if(top<100) {
            top = $lastMsg.offset().top;
          }

          console.log("LAST MESSAGE - TOP", top)
          if(top===10000) {
            return false;
          }

          anime({
            targets: $chat[0],
            scrollTop:top,
            duration: $j.data.options.motion.scrollSpeed[speed],
            easing: 'easeInOutQuad',
            complete: function() {

            }
          });
        },
        "scrolling.activate": function (e) {
          $(this).on("scroll.kore", function () {
            $(this).trigger("scrolling.event");
          })
        },
        "scrolling.deactivate": function (e) {
          $j.data.agent.$.actor.trigger("hide");

          $(this).off("scroll.kore");

          return $(this);
        },
        // TODO: Not Performant, simplify
        // TODO: Should put some lazy batching and be careful of back to back eventing
        "scrolling.event": function (e) {
          //console.log("SCROLLING EVENT", e)

          if (!$j.data.agent) {
            return false;
          }
          if($j.options.liveAgent.button!==true) {
            return false;
          }

          if ($j.data.agent && $j.data.agent.active === false) {
            var scroll = $j.data.agent.scroll,
              $scroll = $(this);

            ++scroll.count;
            if (scroll.count > 50) {
              scroll.count = 0;
              scrollActions();
            } else {
              clearTimeout(scroll.throttle);
              scroll.throttle = setTimeout(function () {
                if ($j.data.agent.active !== true) {
                  scrollActions();
                }
              }, 100);
            }
          }

          function scrollActions() {
            var $live = {
              actor: $j.data.agent.$.actor,//$(this).parent().siblings("#liveAgentActor"),
              // TODO: Not performant
              control: $scroll.find(".buttonTmplContentBox li:contains('Live Agent')").last()
            };


            var $liveActor = $live.actor;
            var pos = {
              actor: $liveActor.offset(),
              control: $live.control.offset()
            };

            var chatHeight = $j.el.chat.window.height();
            if (chatHeight < 10) {
              return false;
            }
            if (!pos.control || !pos.actor) {
              return false;
            }
            var diff = Math.abs(pos.control.top - pos.actor.top);

            var distanceAttr;
            //IF the actor is less than half the window height then the actor is close
            if (diff < (chatHeight / 3)) {
              distanceAttr = "close";
            } else if (diff < (chatHeight / 2)) {
              distanceAttr = "semi-close";
            } else {
              distanceAttr = "far";
            }

            return $liveActor.trigger("distance." + distanceAttr);
          }
        }
      }, ".chat-container")
      .on({
        click: function(e) {
          var $button = $(e.currentTarget);

          if($button.is(".close-btn")) {
            console.log("close button", e)
          }

          if($button.is(".minimize")) {
            console.log("minimize button", e)
          }
        }
      }, ".chat-box-controls > button")
      .on({
        clicked: function () {
          var $actor = $(this);

          //TODO: Need to discover where the apps events seperate for connecting and connected so don't have to use timeout
          //TODO: Move these into their own binders
          $actor
            .attr("disabled", true)
            .children("div").text("Connecting");
          setTimeout(function () {
            $actor
              .attr("disabled", false)
              .children("div").text("Live Agent");
          }, 10000);

          var $potentialActors = _chatContainer
            .find(".kore-chat-body li:contains('Live Agent')")
            .not("#liveAgentActor");

          return validateActors($potentialActors).trigger("click");

          function validateActors($actors) {
            var $return = $();
            $actors.each(function (i) {
              if (validateActor($(this))) {
                $return = $(this);
                return false;
              }
            });
            return $return;

            function validateActor($actor) {
              var thisText = $actor.text().trim().toLowerCase();

              if (thisText === "live agent") {
                return true;
              }
              return false;
            }
          }
        },
        show: function (e) {
          $(this).trigger("distance.far");
        },
        hide: function (e) {
          $(this).trigger("distance.close");
        },
        "distance.close": function () {
          $(this).attr("distance", "close");
        },
        "distance.semi-close": function () {
          $(this).attr("distance", "semi-close");
        },
        "distance.far": function () {
          $(this).attr("distance", "far");
        }
      }, "#liveAgentActor");

    _chatContainer.trigger("agent.initiate", function () {
      //console.log("calling agent initiate")
      // var state = "agent.activate";
      // if(!$j.data.agent.active) {
      //     state = "agent.deactivate";
      // }
      //
      // $(this).trigger(state);
    });
  };

  $("body").on({
    "dialog.create": function() {
      // $("#confirmClose").dialog({
      //   autoOpen: false,
      //   draggable:false,
      //   resizable: false,
      //   height: "auto",
      //   width: 400,
      //   modal: false,
      //   dialogClass: "chat-dialog",
      //   buttons: {
      //     "STAY": {
      //       text: 'STAY',
      //       class: 'alignCloseConfirmDialogButtonLeft',
      //       id:"cancel",
      //       click: function () {
      //         $(this).dialog("close");
      //       }
      //     },
      //     "END CHAT": {
      //       text: 'END CHAT',
      //       class: 'alignCloseConfirmDialogButtonRight',
      //       id:"close",
      //       click: function () {
      //         if (localStorage.getItem("agentTfrOn")) {
      //           var agentTfrOn = localStorage.getItem("agentTfrOn");
      //
      //           if (agentTfrOn == 'true') {
      //             var messageToBot = {};
      //             messageToBot["message"] = {body: "endAgentChat"}; //change the key word for ending the chat from bot kit
      //             messageToBot["resourceid"] = '/bot.message';
      //             bot.sendMessage(messageToBot, function messageSent(err) {});
      //           }
      //
      //           localStorage.removeItem("agentTfrOn");
      //           $j.el.chat.window.trigger("agent.deactivate");
      //         }
      //
      //         localStorage.removeItem("restorePS");
      //         localStorage.removeItem("jwtGrant");
      //         localStorage.removeItem("korecom");
      //
      //         $j.el.chat.window.trigger("chat.closed")
      //         $j.chat.destroy();
      //
      //         $('.recordingMicrophone').trigger('click');
      //         if (ttsAudioSource) {
      //           ttsAudioSource.stop();
      //         }
      //         isTTSOn = false;
      //         if (_ttsContext) {
      //           _ttsContext.close();
      //           _ttsContext = null;
      //         }
      //
      //         var event;
      //         if(typeof(Event) === 'function') {
      //           event = new Event('CHAT_ENDED');
      //         }else{
      //           event = document.createEvent('Event');
      //           event.initEvent('CHAT_ENDED', true, true);
      //         }
      //         window.dispatchEvent(event);
      //
      //         $(this).dialog("close");
      //       }
      //     }
      //   },
      //   // TODO: Since mutliple jquery, we can't rely on ui being returned
      //   open: function (e, ui) {
      //
      //   }
      // });
    },
    "dialog.destroy": function() {

    }
  })

  /*
      TODO: Expand to other localstorate/persisted data as middle ground approach to consolidate the redundant data be stored
            And to all a single point to run pre and post localstorage actions from
            >>> will move into events eventually when not such a cluster

      $j.chat.data("get", "maximized")

  */
  chatWindow.prototype.data = function(operation, key, value) {
    var post_actions = {
      sync_bubble_visibility: function(maximized_state) {
        console.log("MAXIMIZATION STATE", maximized_state)
      }
    }

    key = jQuery.methods(key, {
      enabled: function() {
        return "_chat_clientId";
      },
      maximized: function() {
        return "mpc_chat_maximized";
      },
      def: function() {
        return key;
      },
      undefined: function() {
        return false;
      }
    });

    if(key===false) {
      return false;
    }

    return jQuery.methods(operation, {
      get: function() {
        var storedValue = localStorage.getItem(key);

        if(!storedValue) {
          post_actions.sync_bubble_visibility("not maximized state")
        } else {
          post_actions.sync_bubble_visibility(storedValue)
        }

        return JSON.parse(storedValue);
      },
      set: function() {
        return localStorage.setItem(key, value);
      },
      "delete": function() {
        return localStorage.removeItem(key)
      }
    });
  }

  chatWindow.prototype.bindIframeEvents = function (authPopup) {
    var me = this;
    authPopup.on('click', '.close-popup', function () {
      $(this).closest('.kore-auth-popup').remove();
      $('.kore-auth-layover').remove();
      me.popupOpened = false;
    });

    var ifram = authPopup.find('iframe')[0];

    ifram.addEventListener('onload', function () {
      // console.log(this);
    }, true);
  };

  chatWindow.prototype.render = function (chatWindowHtml) {
    //console.log("chatWindow render > it is about to open")

    var me = this;
    $(me.config.container).append(chatWindowHtml);

    if (me.config.container !== "body") {
      $(me.config.container).addClass('pos-relative');
      $(me.config.chatContainer).addClass('pos-absolute');
    }

    me.bindEvents();
  };

  chatWindow.prototype.sendMessage = function (chatInput, renderMsg) {
    var me = this;
    if (chatInput.text().trim() === "" && $('.attachment').html().trim().length == 0) {
      return;
    }
    if (me.config.allowLocation) {
      bot.fetchUserLocation();
    }
    var _bodyContainer = $(me.config.chatContainer).find('.kore-chat-body');
    var _footerContainer = $(me.config.chatContainer).find('.kore-chat-footer');
    var clientMessageId = new Date().getTime();
    var msgData = {};
    fileUploaderCounter = 0;
    if (attachmentInfo && Object.keys(attachmentInfo).length) {
      msgData = {
        'type': "currentUser",
        "message": [{
          'type': 'text',
          'cInfo': {
            'body': chatInput.text(),
            'attachments': [attachmentInfo]
          },
          'clientMessageId': clientMessageId
        }],
        "createdOn": clientMessageId
      };
      $('.attachment').html('');
      $('.kore-chat-window').removeClass('kore-chat-attachment');
      document.getElementById("captureAttachmnts").value = "";
    } else {
      attachmentInfo = {};
      msgData = {
        'type': "currentUser",
        "message": [{
          'type': 'text',
          'cInfo': {'body': chatInput.text()},
          'clientMessageId': clientMessageId
        }],
        "createdOn": clientMessageId
      };
    }

    var messageToBot = {};
    messageToBot["clientMessageId"] = clientMessageId;
    if (Object.keys(attachmentInfo).length > 0 && chatInput.text().trim().length) {
      messageToBot["message"] = {body: chatInput.text().trim(), attachments: [attachmentInfo]};
    } else if (Object.keys(attachmentInfo).length > 0) {
      messageToBot["message"] = {attachments: [attachmentInfo]};
    } else {
      messageToBot["message"] = {body: chatInput.text().trim()};
    }
    messageToBot["resourceid"] = '/bot.message';

    if (renderMsg && typeof renderMsg === 'string') {
      messageToBot["message"].renderMsg = renderMsg;
    }
    attachmentInfo = {};
    bot.sendMessage(messageToBot, function messageSent(err) {
      if (err && err.message) {
        setTimeout(function () {
          $('#msg_' + clientMessageId).find('.messageBubble').append('<div class="errorMsg">Send Failed. Please resend.</div>');
        }, 350);
      }
    });
    chatInput.html("");
    $('.sendButton').addClass('disabled');
    _bodyContainer.css('bottom', _footerContainer.outerHeight());
    resetPingMessage();
    /*$('.typingIndicatorContent').css('display', 'block');
        setTimeout(function () {
            $('.typingIndicatorContent').css('display', 'none');
        }, 10000);
        if(renderMsg && typeof renderMsg==='string'){
           msgData.message[0].cInfo.body=renderMsg;
        }
        me.renderMessage(msgData);
    };*/
    /*if(localStorage.getItem('messageSeen')){
        console.log(messageData);
        $(messageData).append('Read');
    }*/
    //0426 SG: Changes for typing bubbles when agent hand off has happened
    if (localStorage.getItem("agentTfrOn")) {
      var agentTfrOn = localStorage.getItem("agentTfrOn");
      if (agentTfrOn == 'true') {
        $('.typingIndicatorContent').css('display', 'none');
        if (renderMsg && typeof renderMsg === 'string') {
          msgData.message[0].cInfo.body = renderMsg;
        }
        me.renderMessage(msgData);
      } else {
        $('.typingIndicatorContent').css('display', 'block');
        setTimeout(function () {
          $('.typingIndicatorContent').css('display', 'none');
        }, 10000);
        if (renderMsg && typeof renderMsg === 'string') {
          msgData.message[0].cInfo.body = renderMsg;
        }

        me.renderMessage(msgData);
      }
    } else {
      $('.typingIndicatorContent').css('display', 'block');
      setTimeout(function () {
        $('.typingIndicatorContent').css('display', 'none');
      }, 10000);
      if (renderMsg && typeof renderMsg === 'string') {
        msgData.message[0].cInfo.body = renderMsg;
      }
      me.renderMessage(msgData);
    }

  };

  chatWindow.prototype.renderMessage = function (msgData) {
    var $chat = {
      window: $(".kore-chat-window")
    };

    $('.messageReadNotification').css('display', 'none');
    var me = this, messageHtml = '', extension = '', _extractedFileName = '';
    customTemplateObj.helpers = helpers;
    customTemplateObj.extension = extension;
    graphLibGlob = me.config.graphLib || "d3";
    var str = msgData.message[0].cInfo.body;

    if (localStorage.getItem("agentTfrOn") && !historyLoading) {
      var newChatHistoryCount = parseInt(localStorage.getItem("chatHistoryCount")) + 1;
      // TODO: UPDATE history should be event driven
      localStorage.setItem("chatHistoryCount", newChatHistoryCount);
      $j.el.chat.window.attr("messages", newChatHistoryCount);
    }
    if (typeof str == 'undefined' || !str || str.length === 0 || str === "" || !/[^\s]/.test(str) || /^\s*$/.test(str) || str.toString().replace(/\s/g, "") === "") {
      //return
      str = msgData.message[0].component.payload.text;
    }
    //Flag to set user is talking to Agent
    if (str.toString().includes("An agent will be assigned to you shortly") && str.indexOf('assigned') > -1 && str.indexOf('to') > -1 && str.indexOf('agent') > -1) {
      localStorage.setItem("agentTfrOn", true);

      if (!historyLoading) {
        var defCount = 10;
        localStorage.setItem("chatHistoryCount", defCount);
        $j.el.chat.window.attr("messages", defCount);
      }
      $chat.window.trigger("agent.activate");

    }
    //Flag to reset the agent flag once the agent ends the chat
    if (str.toString().includes("The Live Agent chat has ended.") && str.indexOf('ended') > -1 && str.indexOf('Live') > -1 && str.indexOf('Agent') > -1) {
      localStorage.setItem("agentTfrOn", false);
      $chat.window.trigger("agent.deactivate");
    }
    //Message read indicator from agent
    if (str.toString() === 'AR') {
      if (!historyLoading) {
        $('.messageReadNotification').css('display', 'block');
        messageRead = true;
      }
      return
    }
    if (str.toString() === 'AT') {
      //console.log("Agent Typing and Message read: ", messageRead);
      if (!historyLoading) {
        if (messageRead) {
          $('.typingIndicatorContent').css('display', 'block');
          $('.messageReadNotification').css('display', 'block');
          return;
        } else {
          $('.typingIndicatorContent').css('display', 'block');
          return;
        }
      } else {
        return;
      }

    }
    if (str.toString() === 'AST') {
      //console.log("Agent stopped typing and messasge read ", messageRead);
      if (messageRead && !historyLoading) {
        $('.typingIndicatorContent').css('display', 'none');
        $('.messageReadNotification').css('display', 'block');
        return;
      } else {
        $('.typingIndicatorContent').css('display', 'none');
        return;
      }
    }
    if (msgData.type === "bot_response") {
      $('.messageReadNotification').css('display', 'none'); //Meesage read indicator from agent
      messageRead = false;
      waiting_for_message = false;
      setTimeout(function () {
        $('.typingIndicator').css('background-image', "url(" + msgData.icon + ")");
      }, 500);
      setTimeout(function () {
        if (!waiting_for_message) {
          $('.typingIndicatorContent').css('display', 'none');
        }
      }, 500);
    } else {
      waiting_for_message = false;
    }
    var _chatContainer = $(me.config.chatContainer).find('.chat-container');
    if (msgData.message && msgData.message[0] && msgData.message[0].cInfo && msgData.message[0].cInfo.attachments) {
      extension = strSplit(msgData.message[0].cInfo.attachments[0].fileName);
    }
    if (msgData.message && msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && msgData.message[0].component.payload.url) {
      extension = strSplit(msgData.message[0].component.payload.url);
      _extractedFileName = msgData.message[0].component.payload.url.replace(/^.*[\\\/]/, '');
    }

    /* checking for matched custom template */
    messageHtml = customTemplateObj.renderMessage(msgData);
    if (messageHtml === '' && msgData && msgData.message && msgData.message[0]) {

      if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && msgData.message[0].component.payload.template_type == "button") {
        messageHtml = $(me.getChatTemplate("templatebutton")).tmpl({
          'msgData': msgData,
          'helpers': helpers,
          'extension': extension
        });
      } else if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && msgData.message[0].component.payload.template_type == "wait_for_response") {// to show typing indicator until next response receive
        waiting_for_message = true;
        $('.typingIndicatorContent').css('display', 'block');
        return;
      } else if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && msgData.message[0].component.payload.template_type == "list") {
        messageHtml = $(me.getChatTemplate("templatelist")).tmpl({
          'msgData': msgData,
          'helpers': helpers,
          'extension': extension
        });
      } else if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && msgData.message[0].component.payload.template_type == "quick_replies") {
        messageHtml = $(me.getChatTemplate("templatequickreply")).tmpl({
          'msgData': msgData,
          'helpers': helpers,
          'extension': extension
        });
        // setTimeout(function () {
        //   var evt = document.createEvent("HTMLEvents");
        //   evt.initEvent('resize', true, false);
        //   window.dispatchEvent(evt);
        // }, 150);
      } else if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && msgData.message[0].component.payload.template_type == "carousel") {
        messageHtml = $(me.getChatTemplate("carouselTemplate")).tmpl({
          'msgData': msgData,
          'helpers': helpers,
          'extension': extension
        });

        //setTimeout(function () {
          $('.carousel:last').addClass("carousel" + carouselTemplateCount);
          var count = $(".carousel" + carouselTemplateCount).children().length;
          if (count > 1) {
            var carouselOneByOne = new PureJSCarousel({
              carousel: '.carousel' + carouselTemplateCount,
              slide: '.slide',
              oneByOne: true
            });
            $('.carousel' + carouselTemplateCount).parent().show();
            $('.carousel' + carouselTemplateCount).attr('style', 'height: 100% !important');
            carouselEles.push(carouselOneByOne);
          }
          //window.dispatchEvent(new Event('resize'));
          // var evt = document.createEvent("HTMLEvents");
          // evt.initEvent('resize', true, false);
          // window.dispatchEvent(evt);
          // carouselTemplateCount += 1;

          $j.el.chat.container.trigger("gotoRecent");
        //});
      } else if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && (msgData.message[0].component.type == "image" || msgData.message[0].component.type == "audio" || msgData.message[0].component.type == "video" || msgData.message[0].component.type == "link")) {
        messageHtml = $(me.getChatTemplate("templateAttachment")).tmpl({
          'msgData': msgData,
          'helpers': helpers,
          'extension': extension,
          'extractedFileName': _extractedFileName
        });
      } else if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.payload && msgData.message[0].component.payload.template_type == "table") {
        messageHtml = $(me.getChatTemplate("tableChartTemplate")).tmpl({
          'msgData': msgData,
          'helpers': helpers,
          'extension': extension
        });
        setTimeout(function () {
          var acc = document.getElementsByClassName("accordionRow");

          for (var i = 0; i < acc.length; i++) {
            acc[i].onclick = function () {
              this.classList.toggle("open");
            }
          }
          var showFullTableModal = document.getElementsByClassName("showMore");

          for (var i = 0; i < showFullTableModal.length; i++) {
            showFullTableModal[i].onclick = function () {
              var parentli = this.parentNode.parentElement;
              $("#dialog").empty();
              $("#dialog").html($(parentli).find('.tablechartDiv').html());
              $(".hello").clone().appendTo(".goodbye");

              var modal = document.getElementById('myPreviewModal');
              $(".largePreviewContent").empty();
              //$(".largePreviewContent").html($(parentli).find('.tablechartDiv').html());
              $(parentli).find('.tablechartDiv').clone().appendTo(".largePreviewContent");

              modal.style.display = "block";

              // Get the <span> element that closes the modal
              var span = document.getElementsByClassName("closeElePreview")[0];

              // When the user clicks on <span> (x), close the modal
              span.onclick = function () {
                modal.style.display = "none";
                $(".largePreviewContent").removeClass("addheight");
              }

            }
          }
        }, 350);

      } else {
        messageHtml = $(me.getChatTemplate("message")).tmpl({
          'msgData': msgData,
          'helpers': helpers,
          'extension': extension
        });
      }
    }
    _chatContainer.append(messageHtml);

    $j.el.chat.container.trigger({
      type:"gotoRecent",
      speed:"fast"
    });

    if (msgData.type === "bot_response" && isTTSOn && isTTSEnabled && !me.minimized && !historyLoading) {
      if (msgData.message[0] && msgData.message[0].component && msgData.message[0].component.type === "template") {
        _txtToSpeak = '';
      } else {
        try {
          _txtToSpeak = msgData.message[0].component.payload.text ? msgData.message[0].component.payload.text.replace(/\r?\n/g, ". .") : "";
          _txtToSpeak = helpers.checkMarkdowns(_txtToSpeak);
          // replacing extra new line or line characters
          _txtToSpeak = _txtToSpeak.replace('___', '<hr/>');
          _txtToSpeak = _txtToSpeak.replace('---', '<hr/>');
        } catch (e) {
          _txtToSpeak = '';
        }
      }
      if (msgData.message[0].component && msgData.message[0].component.payload.speech_hint) {
        _txtToSpeak = msgData.message[0].component.payload.speech_hint;
      }
      if (!_ttsConnection || (_ttsConnection.readyState && _ttsConnection.readyState !== 1)) {
        try {
          _ttsConnection = createSocketForTTS();
        } catch (e) {
          //console.log(e);
        }
      } else {
        socketSendTTSMessage(_txtToSpeak);
      }
    }
  };

  chatWindow.prototype.formatMessages = function (msgContainer) {
    /*adding target to a tags */
    $(msgContainer).find('a').attr('target', '_blank');
  };

  chatWindow.prototype.openPopup = function (link_url) {
    var me = this;
    var popupHtml = $(me.getChatTemplate("popup")).tmpl({
      "link_url": link_url
    });
    $(me.config.container).append(popupHtml);
    me.popupOpened = true;
    me.bindIframeEvents($(popupHtml));
  };

  chatWindow.prototype.getChatTemplate = function (tempType) {
    var chatFooterTemplate =
      '<div class="footerContainer pos-relative"> \
              {{if userAgentIE}} \
              <div class="chatInputBox inputCursor" contenteditable="true" placeholder="${botMessages.message}"></div> \
              {{else}} \
              <div class="chatInputBox" contenteditable="true" placeholder="${botMessages.message}"></div> \
              {{/if}} \
          <div class="attachment"></div> \
          {{if isTTSEnabled}} \
              <div class="sdkFooterIcon ttspeakerDiv ttsOff"> \
                  <button class="ttspeaker"> \
                      <span class="ttsSpeakerEnable"></span> \
                      <span class="ttsSpeakerDisable"></span> \
                      <span style="display:none;"><audio id="ttspeaker" controls="" autoplay="" name="media"><source src="" type="audio/wav"></audio></span>\
                  </button> \
              </div> \
          {{/if}} \
          {{if isSpeechEnabled}}\
          <div class="sdkFooterIcon microphoneBtn"> \
              <button class="notRecordingMicrophone"> \
                  <i class="fa fa-microphone fa-lg"></i> \
              </button> \
              <button class="recordingMicrophone"> \
                  <i class="fa fa-microphone fa-lg"></i> \
                  <span class="recordingGif"></span> \
              </button> \
              <div id="textFromServer"></div> \
          </div> \
          {{/if}}\
          <div class="sdkFooterIcon"> \
              <button class="sdkAttachment attachmentBtn"> \
                  <i class="fa fa fa-paperclip"></i> \
              </button> \
              <input type="file" name="Attachment" class="filety" id="captureAttachmnts"> \
          </div> \
          {{if !(isSendButton)}}<div class="chatSendMsg">Press enter to send</div>{{/if}} \
      </div>';

    var chatWindowTemplate = '<script id="chat_window_tmpl" type="text/x-jqury-tmpl"> \
            <div class="kore-chat-window droppable"> \
                <div class="kore-chat-header"> \
                <div class="security-title">For your security, please do not enter secure information here, such as credit card details.</div>\
                    <div class="header-title" title="${chatTitle}">${chatTitle}</div> \
                    <div class="chat-box-controls"> \
                        <button class="minimize-btn" title="Minimize">&minus;</button> \
                        <button class="close-btn" title="Close">&times;</button> \
                    </div> \
        	    <div id="confirmClose" title="END CHAT" style="display: none;> \
        	       <p>Are you sure you want to end this chat session?</p> \
                </div> \
                </div> \
                <div class="kore-chat-header trainWarningDiv"> \
                    <div class="trainWarningTextDiv displayTable"> \
                        <span class="exclamation-circle"><i class="fa fa-exclamation-circle" aria-hidden="true"></i></span> \
                        <p class="headerTip warningTip">Invalid Token.Please try again later.</p> \
                    </div> \
               </div> \
                <div class="kore-chat-header historyLoadingDiv"> \
                    <div class="historyWarningTextDiv displayTable"> \
                        <span class="circle-o-notch"><i class="fa fa-circle-o-notch" aria-hidden="true"></i></span> \
                        <p class="headerTip warningTip">Loading previous messages..</p> \
                    </div> \
                </div> \
                <div class="kore-chat-body"> \
                    <div class="errorMsgBlock"> \
                    </div> \
                    <ul class="chat-container"></ul> \
                </div> \
        	    <div class="typingIndicatorContent" style="display:none;"><div class="typingIndicator"></div><div class="movingDots"></div></div> \
                <div class="messageReadNotification" style="display:none; color:grey; width: 100%; text-align:right; padding-right:10px;">Read</div>\
                <div class="kore-chat-footer disableFooter">' + chatFooterTemplate + '{{if isSendButton}}<div class="sendBtnCnt"><button class="sendButton disabled" type="button">Send</button></div>{{/if}}</div> \
                 <div id="myModal" class="modalImagePreview hide">\
                      <span class="closeImagePreview">&times;</span>\
                      <img class="modal-content-imagePreview" id="img01">\
                      <div id="caption"></div>\
                </div>\
                <div id="myPreviewModal" class="modalImagePreview hide">\
                      <span class="closeElePreview">&times;</span>\
                      <div class="largePreviewContent"></div>\
                </div>\
            </div> \
        </script>';

    var msgTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                {{each(key, msgItem) msgData.message}} \
                    {{if msgItem.cInfo && msgItem.type === "text"}} \
                        <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} {{if msgData.icon}}with-icon{{/if}}"> \
                            {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                            {{if msgData.icon}}<div class="profile-photo"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                            <div class="messageBubble">\
                                <div> \
                                    {{if msgData.type === "bot_response"}} \
                                        {{if msgItem.component  && msgItem.component.type =="error"}} \
                                            <span style="color:${msgItem.component.payload.color}">{{html helpers.convertMDtoHTML(msgItem.component.payload.text, "bot")}} </span>\
                                         {{else}} \
                                            {{html helpers.convertMDtoHTML(msgItem.cInfo.body, "bot")}} \
                                            {{if msgItem.component && msgItem.component.payload && msgItem.component.payload.videoUrl}}\
                                                <div class="videoEle"><video width="300" controls><source src="${msgItem.component.payload.videoUrl}" type="video/mp4"></video></div>\
                                            {{/if}}\
                                        {{/if}} \
                                    {{else}} \
                                        {{if msgItem.cInfo.renderMsg && msgItem.cInfo.renderMsg !== ""}}\
                                            {{html helpers.convertMDtoHTML(msgItem.cInfo.renderMsg, "user")}} \
                                        {{else}}\
                                            {{html helpers.convertMDtoHTML(msgItem.cInfo.body, "user")}} \
                                        {{/if}}\
                                    {{/if}} \
                                </div>\
                                {{if msgItem.cInfo && msgItem.cInfo.emoji}} \
                                    <span class="emojione emojione-${msgItem.cInfo.emoji[0].code}">${msgItem.cInfo.emoji[0].title}</span> \
                                {{/if}} \
                                {{if msgItem.cInfo.attachments}} \
                                    <div class="msgCmpt attachments" fileid="${msgItem.cInfo.attachments[0].fileId}"> \
                                        <div class="uploadedFileIcon"> \
                                            {{if msgItem.cInfo.attachments[0].fileType == "image"}} \
                                                <span class="icon cf-icon icon-photos_active"></span> \
                                            {{else msgItem.cInfo.attachments[0].fileType == "audio"}}\
                                                <span class="icon cf-icon icon-files_audio"></span> \
                                            {{else msgItem.cInfo.attachments[0].fileType == "video"}} \
                                                <span class="icon cf-icon icon-video_active"></span> \
                                            {{else}} \
                                                {{if extension[1]=="xlsx" || extension[1]=="xls" || extension[1]=="docx" || extension[1]=="doc" || extension[1]=="pdf" || extension[1]=="ppsx" || extension[1]=="pptx" || extension[1]=="ppt" || extension[1]=="zip" || extension[1]=="rar"}}\
                                                    <span class="icon cf-icon icon-files_${extension[1]}"></span> \
                                                {{else extension[1]}}\
                                                    <span class="icon cf-icon icon-files_other_doc"></span> \
                                                {{/if}}\
                                            {{/if}}\
                                        </div> \
                                        <div class="curUseruploadedFileName">${msgItem.cInfo.attachments[0].fileName}</div> \
                                    </div> \
                                {{/if}} \
                                {{if msgData.isError}} \
                                    <div class="errorMsg">Send Failed. Please resend.</div> \
                                {{/if}} \
                            </div> \
                        </li> \
                    {{/if}} \
                {{/each}} \
            {{/if}} \
        </scipt>';
    var templateAttachment = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                {{each(key, msgItem) msgData.message}} \
                    {{if msgItem.component && msgItem.component.payload.url}} \
                        <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} {{if msgData.icon}}with-icon{{/if}}"> \
                            {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                            {{if msgData.icon}}<div class="profile-photo"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                            <div class="messageBubble">\
                                {{if msgItem.component.payload.url}} \
                                    <div class="msgCmpt botResponseAttachments" fileid="${msgItem.component.payload.url}"> \
                                        <div class="uploadedFileIcon"> \
                                            {{if msgItem.component.type == "image"}} \
                                                <span class="icon cf-icon icon-photos_active"></span> \
                                            {{else msgItem.component.type == "audio"}}\
                                                <span class="icon cf-icon icon-files_audio"></span> \
                                            {{else msgItem.component.type == "video"}} \
                                                <span class="icon cf-icon icon-video_active"></span> \
                                            {{else}} \
                                                {{if extension[1]=="xlsx" || extension[1]=="xls" || extension[1]=="docx" || extension[1]=="doc" || extension[1]=="pdf" || extension[1]=="ppsx" || extension[1]=="pptx" || extension[1]=="ppt" || extension[1]=="zip" || extension[1]=="rar"}}\
                                                    <span class="icon cf-icon icon-files_${extension[1]}"></span> \
                                                {{else extension[1]}}\
                                                    <span class="icon cf-icon icon-files_other_doc"></span> \
                                                {{/if}}\
                                            {{/if}}\
                                        </div> \
                                        <div class="botuploadedFileName">${extractedFileName}</div> \
                                    </div> \
                                {{/if}} \
                            </div> \
                        </li> \
                    {{/if}} \
                {{/each}} \
            {{/if}} \
        </scipt>';
    var popupTemplate = '<script id="kore_popup_tmpl" type="text/x-jquery-tmpl"> \
                <div class="kore-auth-layover">\
                    <div class="kore-auth-popup"> \
                        <div class="popup_controls"><span class="close-popup" title="Close">&times;</span></div> \
                        <iframe id="authIframe" src="${link_url}"></iframe> \
                    </div> \
                </div>\
        </script>';
    var buttonTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} with-icon"> \
                    <div class="buttonTmplContent"> \
                        {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                        {{if msgData.icon}}<div class="profile-photo"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                        <ul class="buttonTmplContentBox">\
                            <li class="buttonTmplContentHeading"> \
                                {{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "user")}} {{/if}} \
                                {{if msgData.message[0].cInfo && msgData.message[0].cInfo.emoji}} \
                                    <span class="emojione emojione-${msgData.message[0].cInfo.emoji[0].code}">${msgData.message[0].cInfo.emoji[0].title}</span> \
                                {{/if}} \
                            </li>\
                            {{each(key, msgItem) msgData.message[0].component.payload.buttons}} \
                                <li {{if msgItem.payload}}value="${msgItem.payload}"{{/if}} {{if msgItem.payload}}actual-value="${msgItem.payload}"{{/if}} {{if msgItem.url}}url="${msgItem.url}"{{/if}} class="buttonTmplContentChild" data-value="${msgItem.value}" type="${msgItem.type}">\
                                    ${msgItem.title}\
                                </li> \
                            {{/each}} \
                        </ul>\
                    </div>\
                </li> \
            {{/if}} \
        </scipt>';
    var miniTableChartTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} with-icon tablechart"> \
                    {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                    {{if msgData.icon}}<div class="profile-photo extraBottom"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                    {{if msgData.message[0].component.payload.text}}<div class="messageBubble tableChart">\
                        <span>{{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "bot")}}</span>\
                    </div>{{/if}}\
                    {{each(key, table) msgData.message[0].component.payload.elements}}\
                        <div class="minitableDiv">\
                            <div style="overflow-x:auto; padding: 0 8px;">\
                                <table cellspacing="0" cellpadding="0">\
                                    <tr class="headerTitle">\
                                        {{each(key, tableHeader) table.primary}} \
                                            <th {{if tableHeader[1]}}style="text-align:${tableHeader[1]};" {{/if}}>${tableHeader[0]}</th>\
                                        {{/each}} \
                                    </tr>\
                                    {{each(key, additional) table.additional}} \
                                        <tr>\
                                            {{each(cellkey, cellValue) additional}} \
                                                <td  {{if cellkey === additional.length-1}}colspan="2"{{/if}}  {{if table.primary[cellkey][1]}}style="text-align:${table.primary[cellkey][1]};" {{/if}}>${cellValue}</td>\
                                            {{/each}} \
                                        </tr>\
                                    {{/each}} \
                                </table>\
                            </div>\
                        </div>\
                    {{/each}}\
                </li> \
            {{/if}} \
        </scipt>';
    var miniTableHorizontalTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
            <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} with-icon tablechart"> \
                {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                {{if msgData.icon}}<div class="profile-photo extraBottom"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                {{if msgData.message[0].component.payload.text}}<div class="messageBubble tableChart">\
                    <span>{{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "bot")}}</span>\
                </div>{{/if}}\
                <div class="carousel" id="carousel-one-by-one" style="height: 0px;">\
                    {{each(key, table) msgData.message[0].component.payload.elements}}\
                        <div class="slide">\
                            <div class="minitableDiv">\
                                <div style="overflow-x:auto; padding: 0 8px;">\
                                    <table cellspacing="0" cellpadding="0">\
                                        <tr class="headerTitle">\
                                            {{each(key, tableHeader) table.primary}} \
                                                <th {{if tableHeader[1]}}style="text-align:${tableHeader[1]};" {{/if}}>${tableHeader[0]}</th>\
                                            {{/each}} \
                                        </tr>\
                                        {{each(key, additional) table.additional}} \
                                            <tr>\
                                                {{each(cellkey, cellValue) additional}} \
                                                    <td  {{if cellkey === additional.length-1}}colspan="2"{{/if}}  {{if table.primary[cellkey][1]}}style="text-align:${table.primary[cellkey][1]};" {{/if}}>${cellValue}</td>\
                                                {{/each}} \
                                            </tr>\
                                        {{/each}} \
                                    </table>\
                                </div>\
                            </div>\
                        </div>\
                    {{/each}}\
                </div>\
            </li> \
            {{/if}} \
        </scipt>';
    var tableChartTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} with-icon tablechart"> \
                    {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                    {{if msgData.icon}}<div class="profile-photo extraBottom"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                    {{if msgData.message[0].component.payload.text}}<div class="messageBubble tableChart">\
                        <span>{{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "bot")}}</span>\
                    </div>{{/if}}\
                    <div class="tablechartDiv {{if msgData.message[0].component.payload.table_design && msgData.message[0].component.payload.table_design == "regular"}}regular{{else}}hide{{/if}}">\
                        <div style="overflow-x:auto; padding: 0 8px;">\
                            <table cellspacing="0" cellpadding="0">\
                                <tr class="headerTitle">\
                                    {{each(key, tableHeader) msgData.message[0].component.payload.columns}} \
                                        <th {{if tableHeader[1]}}style="text-align:${tableHeader[1]};"{{/if}}>${tableHeader[0]}</th>\
                                    {{/each}} \
                                </tr>\
                                {{each(key, tableRow) msgData.message[0].component.payload.elements}} \
                                    {{if tableRow.Values.length>1}}\
                                        <tr {{if key > 4}}class="hide"{{/if}}>\
                                            {{each(cellkey, cellValue) tableRow.Values}} \
                                                <td  {{if cellkey === tableRow.Values.length-1}}colspan="2"{{/if}} class=" {{if key == 0}} addTopBorder {{/if}}" {{if msgData.message[0].component.payload.columns[cellkey][1]}}style="text-align:${msgData.message[0].component.payload.columns[cellkey][1]};" {{/if}}>${cellValue}</td>\
                                            {{/each}} \
                                        </tr>\
                                    {{/if}}\
                                {{/each}} \
                            </table>\
                        </div>\
                        {{if msgData.message[0].component.payload.elements.length > 4 && msgData.message[0].component.payload.table_design && msgData.message[0].component.payload.table_design == "regular"}}<div class="showMore">Show more</div>{{/if}}\
                    </div>\
                     <div class="accordionTable {{if msgData.message[0].component.payload.table_design && msgData.message[0].component.payload.table_design == "regular"}}hide{{else}}responsive{{/if}}">\
                        {{each(key, tableRow) msgData.message[0].component.payload.elements}} \
                            {{if key < 4}}\
                                <div class="accordionRow">\
                                    {{each(cellkey, cellValue) tableRow.Values}} \
                                        {{if cellkey < 2}}\
                                            <div class="accordionCol">\
                                                <div class="colTitle hideSdkEle">${msgData.message[0].component.payload.columns[cellkey][0]}</div>\
                                                <div class="colVal">${cellValue}</div>\
                                            </div>\
                                        {{else}}\
                                            <div class="accordionCol hideSdkEle">\
                                                <div class="colTitle">${msgData.message[0].component.payload.columns[cellkey][0]}</div>\
                                                <div class="colVal">${cellValue}</div>\
                                            </div>\
                                        {{/if}}\
                                    {{/each}} \
                                    <span class="fa fa-caret-right tableBtn"></span>\
                                </div>\
                            {{/if}}\
                        {{/each}} \
                        <div class="showMore">Show more</div>\
                    </div>\
                </li> \
            {{/if}} \
        </scipt>';

    var carouselTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} with-icon"> \
                    {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                    {{if msgData.icon}}<div class="profile-photo extraBottom"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                    <div class="carousel" id="carousel-one-by-one" style="height: 0px;">\
                        {{each(key, msgItem) msgData.message[0].component.payload.elements}} \
                            <div class="slide">\
                                {{if msgItem.image_url}} \
                                    <div class="carouselImageContent" {{if msgItem.default_action && msgItem.default_action.url}}url="${msgItem.default_action.url}"{{/if}} {{if msgItem.default_action && msgItem.default_action.title}}data-value="${msgItem.default_action.title}"{{/if}} {{if msgItem.default_action && msgItem.default_action.type}}type="${msgItem.default_action.type}"{{/if}} {{if msgItem.default_action && msgItem.default_action.payload}} value="${msgItem.default_action.payload}"{{/if}}> \
                                        <img alt="image" src="${msgItem.image_url}" onerror="this.onerror=null;this.src=\'../libs/img/no_image.png\';"/> \
                                    </div> \
                                {{/if}} \
                                <div class="carouselTitleBox"> \
                                    <p class="carouselTitle">{{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgItem.title, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgItem.title, "user")}} {{/if}}</p> \
                                    {{if msgItem.subtitle}}<p class="carouselDescription">{{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgItem.subtitle, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgItem.subtitle, "user")}} {{/if}}</p>{{/if}} \
                                    {{if msgItem.default_action && msgItem.default_action.type === "web_url"}}<div class="listItemPath carouselDefaultAction" type="url" url="${msgItem.default_action.url}">${msgItem.default_action.url}</div>{{/if}} \
                                    {{if msgItem.buttons}} \
                                        {{each(key, msgBtn) msgItem.buttons}} \
                                            <div {{if msgBtn.payload}}value="${msgBtn.payload}"{{/if}} {{if msgBtn.url}}url="${msgBtn.url}"{{/if}} class="listItemPath carouselButton" data-value="${msgBtn.value}" type="${msgBtn.type}">\
                                                ${msgBtn.title}\
                                            </div> \
                                        {{/each}} \
                                    {{/if}} \
                                </div>\
                            </div>\
                        {{/each}} \
                    </div>\
                </li> \
            {{/if}}\
        </scipt>';

    var quickReplyTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} with-icon quickReplies"> \
                    <div class="buttonTmplContent"> \
                        {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                        {{if msgData.icon}}<div class="profile-photo"> <div class="user-account avtar marginT50" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                        {{if msgData.message[0].component.payload.text}} \
                            <div class="buttonTmplContentHeading quickReply"> \
                                {{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "user")}} {{/if}} \
                                {{if msgData.message[0].cInfo && msgData.message[0].cInfo.emoji}} \
                                    <span class="emojione emojione-${msgData.message[0].cInfo.emoji[0].code}">${msgData.message[0].cInfo.emoji[0].title}</span> \
                                {{/if}} \
                            </div>\
                            {{/if}} \
                            {{if msgData.message[0].component.payload.quick_replies && msgData.message[0].component.payload.quick_replies.length}} \
                            <div class="fa fa-chevron-left quickreplyLeftIcon hide"></div><div class="fa fa-chevron-right quickreplyRightIcon"></div>\
                                <div class="quick_replies_btn_parent"><div class="autoWidth">\
                                    {{each(key, msgItem) msgData.message[0].component.payload.quick_replies}} \
                                        <div class="buttonTmplContentChild quickReplyDiv"> <span {{if msgItem.payload}}value="${msgItem.payload}"{{/if}} class="quickReply {{if msgItem.image_url}}with-img{{/if}}" type="${msgItem.content_type}">\
                                            {{if msgItem.image_url}}<img src="${msgItem.image_url}">{{/if}} <span class="quickreplyText {{if msgItem.image_url}}with-img{{/if}}">${msgItem.title}</span></span>\
                                        </div> \
                                    {{/each}} \
                                </div>\
                            </div>\
                        {{/if}} \
                    </div>\
                </li> \
            {{/if}} \
        </scipt>';
    var listTemplate = '<script id="chat_message_tmpl" type="text/x-jqury-tmpl"> \
            {{if msgData.message}} \
                <li {{if msgData.type !== "bot_response"}}id="msg_${msgItem.clientMessageId}"{{/if}} class="{{if msgData.type === "bot_response"}}fromOtherUsers{{else}}fromCurrentUser{{/if}} with-icon"> \
                    <div class="listTmplContent"> \
                        {{if msgData.createdOn}}<div class="extra-info">${helpers.formatDate(msgData.createdOn)}</div>{{/if}} \
                        {{if msgData.icon}}<div class="profile-photo"> <div class="user-account avtar" style="background-image:url(${msgData.icon})"></div> </div> {{/if}} \
                        <ul class="listTmplContentBox"> \
                            {{if msgData.message[0].component.payload.title || msgData.message[0].component.payload.heading}} \
                                <li class="listTmplContentHeading"> \
                                    {{if msgData.type === "bot_response" && msgData.message[0].component.payload.heading}} {{html helpers.convertMDtoHTML(msgData.message[0].component.payload.heading, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgData.message[0].component.payload.text, "user")}} {{/if}} \
                                    {{if msgData.message[0].cInfo && msgData.message[0].cInfo.emoji}} \
                                        <span class="emojione emojione-${msgData.message[0].cInfo.emoji[0].code}">${msgData.message[0].cInfo.emoji[0].title}</span> \
                                    {{/if}} \
                                </li> \
                            {{/if}} \
                            {{each(key, msgItem) msgData.message[0].component.payload.elements}} \
                                {{if msgData.message[0].component.payload.buttons}} \
                                    {{if key<= 2 }}\
                                        <li class="listTmplContentChild"> \
                                            {{if msgItem.image_url}} \
                                                <div class="listRightContent" {{if msgItem.default_action && msgItem.default_action.url}}url="${msgItem.default_action.url}"{{/if}} {{if msgItem.default_action && msgItem.default_action.title}}data-value="${msgItem.default_action.title}"{{/if}} {{if msgItem.default_action && msgItem.default_action.type}}type="${msgItem.default_action.type}"{{/if}} {{if msgItem.default_action && msgItem.default_action.payload}} value="${msgItem.default_action.payload}"{{/if}}> \
                                                    <img alt="image" src="${msgItem.image_url}" onerror="this.onerror=null;this.src=\'../libs/img/no_image.png\';"/> \
                                                </div> \
                                            {{/if}} \
                                            <div class="listLeftContent"> \
                                                <div class="listItemTitle">{{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgItem.title, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgItem.title, "user")}} {{/if}}</div> \
                                                {{if msgItem.subtitle}}<div class="listItemSubtitle">{{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgItem.subtitle, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgItem.subtitle, "user")}} {{/if}}</div>{{/if}} \
                                                {{if msgItem.default_action && msgItem.default_action.url}}<div class="listItemPath" type="url" url="${msgItem.default_action.url}">${msgItem.default_action.url}</div>{{/if}} \
                                                {{if msgItem.buttons}}\
                                                <div> \
                                                    <span class="buyBtn" {{if msgItem.buttons[0].type}}type="${msgItem.buttons[0].type}"{{/if}} {{if msgItem.buttons[0].url}}url="${msgItem.buttons[0].url}"{{/if}} {{if msgItem.buttons[0].payload}}value="${msgItem.buttons[0].payload}"{{/if}}>{{if msgItem.buttons[0].title}}${msgItem.buttons[0].title}{{else}}Buy{{/if}}</span> \
                                                </div> \
                                                {{/if}}\
                                            </div>\
                                        </li> \
                                    {{/if}}\
                                {{else}} \
                                    <li class="listTmplContentChild"> \
                                        {{if msgItem.image_url}} \
                                            <div class="listRightContent" {{if msgItem.default_action && msgItem.default_action.url}}url="${msgItem.default_action.url}"{{/if}} {{if msgItem.default_action && msgItem.default_action.title}}data-value="${msgItem.default_action.title}"{{/if}} {{if msgItem.default_action && msgItem.default_action.type}}type="${msgItem.default_action.type}"{{/if}} {{if msgItem.default_action && msgItem.default_action.payload}} value="${msgItem.default_action.payload}"{{/if}}> \
                                                <img alt="image" src="${msgItem.image_url}" onerror="this.onerror=null;this.src=\'../libs/img/no_image.png\';" /> \
                                            </div> \
                                        {{/if}} \
                                        <div class="listLeftContent"> \
                                            <div class="listItemTitle">{{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgItem.title, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgItem.title, "user")}} {{/if}}</div> \
                                            {{if msgItem.subtitle}}<div class="listItemSubtitle">{{if msgData.type === "bot_response"}} {{html helpers.convertMDtoHTML(msgItem.subtitle, "bot")}} {{else}} {{html helpers.convertMDtoHTML(msgItem.subtitle, "user")}} {{/if}}</div>{{/if}} \
                                            {{if msgItem.default_action && msgItem.default_action.url}}<div class="listItemPath" type="url" url="${msgItem.default_action.url}">${msgItem.default_action.url}</div>{{/if}} \
                                            {{if msgItem.buttons}}\
                                            <div> \
                                                <span class="buyBtn" {{if msgItem.buttons[0].type}}type="${msgItem.buttons[0].type}"{{/if}} {{if msgItem.buttons[0].url}}url="${msgItem.buttons[0].url}"{{/if}} {{if msgItem.buttons[0].payload}}value="${msgItem.buttons[0].payload}"{{/if}}>{{if msgItem.buttons[0].title}}${msgItem.buttons[0].title}{{else}}Buy{{/if}}</span> \
                                            </div> \
                                            {{/if}}\
                                        </div>\
                                    </li> \
                                {{/if}} \
                            {{/each}} \
                            </li> \
                            {{if msgData.message[0].component.AlwaysShowGlobalButtons || (msgData.message[0].component.payload.elements.length > 3 && msgData.message[0].component.payload.buttons)}}\
                            <li class="viewMoreList"> \
                                <span class="viewMore" url="{{if msgData.message[0].component.payload.buttons[0].url}}${msgData.message[0].component.payload.buttons[0].url}{{/if}}" type="${msgData.message[0].component.payload.buttons[0].type}" value="{{if msgData.message[0].component.payload.buttons[0].payload}}${msgData.message[0].component.payload.buttons[0].payload}{{else}}${msgData.message[0].component.payload.buttons[0].title}{{/if}}">${msgData.message[0].component.payload.buttons[0].title}</span> \
                            </li> \
                            {{/if}}\
                        </ul> \
                    </div> \
                </li> \
            {{/if}} \
        </scipt>';
    if (tempType === "message") {
      return msgTemplate;
    } else if (tempType === "popup") {
      return popupTemplate;
    } else if (tempType === "templatebutton") {
      return buttonTemplate;
    } else if (tempType === "templatelist") {
      return listTemplate;
    } else if (tempType === "templatequickreply") {
      return quickReplyTemplate;
    } else if (tempType === "templateAttachment") {
      return templateAttachment;
    } else if (tempType === "carouselTemplate") {
      return carouselTemplate;
    } else if (tempType === "tableChartTemplate") {
      return tableChartTemplate;
    } else if (tempType === "miniTableChartTemplate") {
      return miniTableChartTemplate;
    } else if (tempType === "miniTableHorizontalTemplate") {
      return miniTableHorizontalTemplate;
    }else {
      return chatWindowTemplate;
    }
  };

  /*
    $j.chat.logoff("mypolicy")
  */
  chatWindow.prototype.logoff = function (from_which_app) {
    if(localStorage.getItem("jwtGrant")) {
      if (from_which_app && from_which_app === "mypolicy") {
        console.log("myPolicy user: " + localStorage.ajs_user_id + " has logged out of host application.")
      }
    } else {
      console.log("myPolicy user: " + localStorage.ajs_user_id + " has already been logged out.")
    }

    var me = this;
    if (localStorage.getItem("agentTfrOn")) {
      var agentTfrOn = localStorage.getItem("agentTfrOn");
      if (agentTfrOn == 'true') {
        var messageToBot = {};
        messageToBot["message"] = {body: "endAgentChat"}; //change the key word for ending the chat from bot kit
        messageToBot["resourceid"] = '/bot.message';
        bot.sendMessage(messageToBot, function messageSent(err) {
          console.log(err);
        });
      }
    }

    if($j.chat.window) {
      $j.el.chat.window.trigger("chat.closed")
    }

    localStorage.removeItem("restorePS");
    localStorage.removeItem("jwtGrant");
    localStorage.removeItem("korecom");
    localStorage.removeItem("agentTfrOn");

    if (ttsAudioSource) {
      ttsAudioSource.stop();
    }
    isTTSOn = false;
    $j.chat.destroy();
    if (_ttsContext) {
      _ttsContext.close();
      _ttsContext = null;
    }
  };

  function IsJsonString() {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  var chatInitialize;
  var customTemplateObj;

  function insertHtmlData(_txtBox, _html) {
    var _input = _txtBox;
    sel = window.getSelection();
    if (sel.rangeCount > 0) {
      range = sel.getRangeAt(0);
      range.deleteContents();
    }
    prevRange = prevRange ? prevRange : range;
    if (prevRange) {
      node = document.createElement("span");
      prevRange.insertNode(node);
      var _span = document.createElement("span");
      _span.innerHTML = _html;
      prevRange.insertNode(_span);
      prevRange.setEndAfter(node);
      prevRange.setStartAfter(node);
      prevRange.collapse(false);
      sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(prevRange);
      var focused = document.activeElement;
      if (focused && !focused.className == "chatInputBox") {
        _input.focus();
      }
      return _input;
    } else {
      _input.appendChild(html);
    }
  }

  function setCaretEnd(_this) {
    var sel;
    if (_this && _this.item(0) && _this.item(0).innerText.length) {
      var range = document.createRange();
      range.selectNodeContents(_this[0]);
      range.collapse(false);
      var sel1 = window.getSelection();
      sel1.removeAllRanges();
      sel1.addRange(range);
      prevRange = range;
    } else {
      prevRange = false;
      if (_this && _this[0]) {
        _this[0].focus();
      }
    }
  }

  function strSplit(str) {
    return (str.split('.'));
  }

  window.onbeforeunload = function () {
    $j.states.unloading = true;

    // TODO: SHOULD check for chat window in destroy
    if ($j.el.chat && $j.el.chat.window) {
      //console.log("IF seeing this > we have an instance of chat destruction outside of events (onbeforeunload)");
      //chatInitialize.destroy();
      return $j.chat.destroy();
      //return null;
    }
  };
  this.addListener = function (evtName, trgFunc) {
    if (!_eventQueue) {
      _eventQueue = {};
    }
    if (evtName && evtName.trim().length > 0) {
      if (!_eventQueue[evtName]) {
        _eventQueue[evtName] = [];
      }
      if (typeof trgFunc === "function") {
        _eventQueue[evtName].push(trgFunc);
      }
    }
  };
  this.removeListener = function (evtName) {
    if (_eventQueue && _eventQueue[evtName]) {
      delete _eventQueue[evtName];
    }
  };

  this.callListener = function (evtName, data) {
    if (_eventQueue && _eventQueue[evtName]) {
      for (var i = 0; i < _eventQueue[evtName].length; i++) {
        if (typeof _eventQueue[evtName][i] === "function") {
          _eventQueue[evtName][i].call(this, data);
        }
      }
    }
  };
  this.show = function (cfg) {
    if ($j.el.chat.window) {
      return false;
    }
    chatInitialize = new chatWindow(cfg);
    customTemplateObj = new customTemplate(cfg);

    return this;
  };
  this.destroy = function () {
    if (chatInitialize && chatInitialize.destroy) {
      _eventQueue = {};
      chatInitialize.destroy();
    }
    if (_ttsContext) {
      _ttsContext.close();
      _ttsContext = null;
    }
  };
  this.logoffFn = function (from_which_app) {
    console.log("Log off", from_which_app)
    if(from_which_app==="mypolicy") {
      console.log("myPolicy user: "+localStorage.ajs_user_id +" has logged out of host application.")
    }
  };
  this.initToken = function (options) {
    assertionToken = "bearer " + options.accessToken;
  };
  this.showError = function (response) {
    console.log("Chat Error", response)
    try {
      response = JSON.parse(response);
      if (response.errors && response.errors[0]) {
        response = response.errors[0].msg;
      }
    } catch (e) {}

    $j.el.chat.window.trigger("chat.error", response);
  };
  this.botDetails = function (response, botInfo) {
    /* Remove hide class for tts and speech if sppech not enabled for this bot */
    /*setTimeout(function () {
        fetchBotDetails(response,botInfo);
    }, 50);*/
  };


  //TODO: WAY TO MANY Timeouts...need to refactor this, not sure who created
  this.chatHistory = function (res) {
    if (loadHistory) {
      historyLoading = true;
      var me = window.chatContainerConfig;
      if (res && res[1] && res[1].messages.length > 0) {
        $j.el.chat.window.attr("messages", res[1].messages.length);

        //$('.chat-container').hide();
        $('.historyLoadingDiv').addClass('showMsg');
        res[1].messages.forEach(function (msgData, index) {
            var _ignoreMsgs = messagesQueue.filter(function (queMsg) {
              return queMsg.messageId === msgData.messageId;
            });
            //dont show the the history message if we already have same message came from socket connect
            if (!_ignoreMsgs.length) {
              try {
                msgData.message[0].cInfo.body = JSON.parse(msgData.message[0].cInfo.body);
                if (msgData.message[0].cInfo.body && msgData.message[0].cInfo.body.text) {
                  msgData.message[0].cInfo.body = msgData.message[0].cInfo.body.text;
                }
                msgData.message[0].component = msgData.message[0].cInfo.body;
                msgData.icon = userIcon(); //"https://dlnwzkim0wron.cloudfront.net/f-ba5e7eeb-941d-53ed-b350-159917403308.png";
                me.renderMessage(msgData);
              } catch (e) {
                msgData.icon = userIcon();//"https://dlnwzkim0wron.cloudfront.net/f-ba5e7eeb-941d-53ed-b350-159917403308.png";
                me.renderMessage(msgData);
              }
            }
            if (index === res[1].messages.length - 1) {
                $j.el.chat.container
                  .show()
                  .trigger("gotoRecent")
                  .append("<div class='endChatContainer'><span class='endChatContainerText'>End of chat history</span></div>");

                $('.historyLoadingDiv').removeClass('showMsg');
                //$('.chat-container').append("<div class='endChatContainer'><span class='endChatContainerText'>End of chat history</span></div>");
                messagesQueue.forEach(function (msg, currIndex) {
                  me.renderMessage(msg);
                  if (messagesQueue.length - 1 === currIndex) {
                    messagesQueue = [];
                  }
                });
                $('.chatInputBox').focus();
                $('.disableFooter').removeClass('disableFooter');
                historyLoading = false;
            }
        });
        //chatHistoryLoad = false;
      } else {
        //setTimeout(function () {
          $('.chatInputBox').focus();
          $('.disableFooter').removeClass('disableFooter');
          historyLoading = false;
        //});
      }
    }

    var $chatContainer = $j.el.chat.container;
    if($chatContainer.find(".fromOtherUsers").length>1) {
      //could compare if the scroll top and scroll height have been adjusted
      // setTimeout(function() {
      //   $chatContainer.scrollTop(10000);
      // },1000)

    }

    function userIcon() {
      return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACoAAAAqCAYAAADFw8lbAAAEG2lDQ1BJQ0MgUHJvZmlsZQAAOI2tVV1oHFUUPpu5sykkzlNsNIV0qD8NJQ2bVjShtrp/3d02bpZJNtoiyGT27s6Y2Z1xZnZrS5+KoPhi1BeRgv9vBUVQqrbYitiXSoUaNTUIig8t/iAU+qLpeube2cw0P+qDd7h3vvnOueeee86ZewE2ganV3S4ZoN7wHCWXkh87dFjuXoQuuBN6YAB6VM21k6XSBGBTbduENe3GNxDz35d3+rbWyv+x9VSoqwHENiF+peJqdcSvA4gnNdvxALofRH7siGf7GDv0Oegg4ud8XOP4pI9nOX6P6UwracSfI5Y0Xa0g/hrx8GyEr0Uw94G1vhxtUMfQZD8WJceqGibt+NoHOaDQwO6AARrIoCCTwncJGQuqyJpA4X9rdbPZ8Wsr9l53buogvocwRs9U1IyPRxCf0tTsFOK7EV9pGTPFAN+0vZSC+F6Arm3NuXIS8Q7E+aqzv8ztdDl6M9/Brx7Tpx9FvBnxZ43Z4mQw9zvNTWNsYRvimzot+LUwCCDIhleY5nOFfY6lTPJ1hWqFZrJ+vBE/P2cdVLhN4UO3NZXt2Dymp4sBf/FJ9UAJ8QDin6iZU/hawl+2Vwp8IIMNszjB1yIZ6rL9Mt7Tp/N8XWJ6mHg+l8xXjf2FQP993ckrAb5im6yW0Texy2kqZa4vjqhONsdtiiXaKAf2xRbMxFTMqQWzOGqY/eVI3u1I3sPaoPjV0dnJ5rkwx2qmxWQujiWmyWeG9mrMxtWgvtKD70ATWR1+RVaP6KXxq4lcbQM73JdrgR2L9JME2Y19D5kge8kYGQeZPEQeJvtIBtlxsmdlbrSSfX+urdh5ClekTG8G9c6j3AMVxx9Rw8I9rRuV+YHmUCg54TxhaJde+OOW/8iPTRitaEQn/y3m4s/iVXEBx0VxKdQQvxeX8Fm8ZS/Wmih3/mJr1Z7X10qizGRcHbvBJG7E74iNC8fP3BHaWSCnH7/ce+F4tTE/ELJ+FOizxRtFODEcsolvE78lFhJvJN5O/CK8LHwgnBU+Ej4WLoIsnBPOC58KXwjvCp9EcrVxDa3knnne8duXrBdrrEopJW2R7pIy0lbpHmkitCf1S6NSXtqOki0reYuuF42eAYfYCcjjs/5aXC9SAbHbsAKMDf6qMmoZcIRpuqzeGnB0lU4wkwySUVJYVd1jfs13NOLZeCaeBDm+Iz4eH40f8HFn1fh2lI3jmP1vp7xHn/bvI0hb9lHHqOmevCuReEBO4hVJ5UJDGxmWVdOUmciVHepSp0UrI+Dfr/xIv66wezO2+VLIeY8A7P0dz76vQu5wE+AU3qv994XcEJ6Vt78GcPp+rem0gjsiFvsSwK3u3sW/elN4fv3Qbl/Hc6z7JYDlF9vtP99st5ffQvtLAOfMvwH39H07BSJNdwAAAAlwSFlzAAALEwAACxMBAJqcGAAAAVlpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IlhNUCBDb3JlIDUuNC4wIj4KICAgPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4KICAgICAgPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIKICAgICAgICAgICAgeG1sbnM6dGlmZj0iaHR0cDovL25zLmFkb2JlLmNvbS90aWZmLzEuMC8iPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICA8L3JkZjpEZXNjcmlwdGlvbj4KICAgPC9yZGY6UkRGPgo8L3g6eG1wbWV0YT4KTMInWQAACOdJREFUWAm1mVtsHFcZx+eya6dpnVY0cVOHpKlCITTBamu1b9AgUMHrKxbhpeGBF4OEeEBCIIFU8lDUCpAQQgqkSKiIVkKK4sTezQZVFFIq1KrgiFKS2ioSbuklNCkicXEa71z4/c/O2Yx3Z9a7AT5pdmbO+S7/73bOzKzjXBu5Bw8e9BB1uxC/FpmG+m4MOfv37/ePHDkSIR1bDePj4wNxHO92XXdnFDk3c75Bc4y963nOO5yXGFuYm5t708pwdtHloStMjbW97BhoAtIoHh0d3eY43hgARtE+yLGZ6+s8kKUpAjlALzN2gePPXFccJypXKpU3xJfWqft2tC5QpZhDUXQAeIfr+tOu6zzoef6tsYlrLDA6dGcPsUs3+A2ZW+ScKArfgvNJ140PE+W/ijFtQ/dZ1Bao9Xjfvn2Fvr4bv4KCbxQKhVvCMBQwA97AiRu12qzPuALUxA+D3PN93wmC4Bz6vru8fPFHp06dCqytLJAaa1bc4LOCExMT28ngT1BeUtBIZwCT3062oST7QuBDyqSAAw5OV6mYL83Ozv7d2swSywRqBUZGPrPX88IjhUJxNxGoR5DizFLEmG0yO2/LIG91MPrIkBcEtYUo8vefOHHsL9Z2s40WoJaxVJr4CBmqEMkdeK0oFpqFU/ch0YHVV8TNsKKlhNVFjRPWgZSYuQyQK2DjNSpqtFqdfcliSDMqhQ1SUR86dCiampp6P2kuo2AXhmswFBtMrRcxfB58/6RRTlIdv0S2ynGaMpaD22k8n3t50BIYxuRADR3voxc/vnfvntmjR49eFBZq19Q4862C9cbZNEe6h0l3u0gaJdSaG4bRMYL5bersJSm9Sge98fHTw3HsPQrbXpwR2NzIUgYFyuDk8vKlcTXYVT31pjD3CvfZs2fjwcG7vop3XyYVUrom4mlBrk0kYftppTJ7YHFx8W1FYcuWLd6ePXu8/v5+f2np8ZDxV3bturPsedH9RHZbu8jKEarggz09vZcWFxees5hk16TC1gS7zAfi2H2WKG1t5z31F3Eo3X+kh+4vl8srykRzFKR/aGi6MD//WG1sbOxegvk0cn2AVTayyiDCtvSeY0X7qNZZi82kIdkWWRvdLxJ9gVTY81JkFnjmIfd7AillGSDFEAMyUKTh+wP99ST6NZ63dQpkIAzCIkaLTWDkWawG4nyAlHNqm3Ibzbew97yYSXWj6HXfRDFOJE7Hv6nV1JtmBcmT8RMMBxJMJvraHk0KVleDUaW8TQ1Z+zF87I3Om6urG97VIDryjBoZ6tbO/4OB5frSZaayfrSNqQS2CpMYhFFAjRKER9dRsEYpVeZt2rRmaN2bOPYVlNySSisQFmHSmDBKSGm/lfOgatys05rNJ9WRZrevrKzcpAsUZTWGpgydP38+mY93EKnrsWMjbFnWnIUhYRlMsBmgDnXzYTg3a1JY10i13pjUsIRt9v3iJzV9tQZbmRlxWRGMZ+gvqWwgNUKuHWFIgG5OsNXTQIh3clzHZFtPZSEho4hS+trw8PAWdbyWJzuZOgukT8Qjlr5PE6nP1veQts1qxIVFmIRNA8Y9Mnlz4qmA5noqgYRc0k/B+3ewg/0MEH0CaydTZ3V8MDIyOYTZH2NDznRiQxhM0wqb9JkogPoG3UCdRlS8qlWUFUbZ4389MjLx0MaNPb9l3VvVpGhycvKmIIgfZPF+CJD9co7hjpoJPoPFYstKl2x0SkQ21FJyHztU9b33an8aG5t4kej9m82rPwzje3leuV0V1SXIFvsGKIrMeshsJ2lvVhIrUHqCgu4hAjpM12o8qUmVRbdBMVgsNiNMI75Tz4oB2kkNWbB6MNFOssLxNMfvSPM5npZotug2AH8Cxo/hQKHLiBoMwiRsMmYjukRJXEZxN53Pk47vAe5X7LjfKpdnTkthEz08Njb5AKX8CLz3wNtxjYJFKwtvsPGSdJrCLhaLL3N9gTkt+J00lAX5+NDQ3SMCyRIkXaTLnHVt7svl408VCu4DgDwlxxjPeyBhqk7CICzQhQSbSbVGYppArx0jHXgdwufTRM/29vZ8ii6/rDU0Z3lyhoaGivPz8zVWgJ001zOUwY4OysAG4kS5PKtt1Oz1tmgr6s51SAyqyYDOfkQged4s5oGULoGcnp4uHj9+fAl7P0gipam2JCwcfLAgR+mHkp6eQgVPeWB1lZ48xGoe8uK8sGFD8Skp0fOmzu1oYGDApDsMvWNk4nUtD/CbbTVDTmk3D8/CpHmA1h9KuHZnZmZe5/yEgECZdaRoyFOs/J5ohnpghjfPKekxhKGIw6tWZ15F/MV1oqrSktwTCSZTmvJM34DMmT47zLp3TssJwy0eA1KdyFS8ILl1HpjF0qAzZ86YEpOsdOSA1ebBC16gV5HDErbYDEAbHb2joOD7OUoklxgzH7103zWR1YsSktNZwrItDOn3JfEZoLoQWJ0vXfrXD+mVk7y3aK6l/uoRzS4Nya9HyGeWFXJ6V2JdDk4Kg/RYTLpuANWN6kgdXCwWpgn/ArWi70PmJUfzojbRrjOs/9sSSdmQLdmUbWEQlrSqNTdMRmoQFTHveJ9jGXqNmtFXkjWRzUtbWnEX14FsyJZsyrYwCEtaxxqgmrD1qm9APHGyAQQLpETNpZRF9dT75lGOV2AplI6WKDFmyX4SN63MoE29gETSLRuylffdSYpyDcgrgc747Mg6531hbu7Yz6XAkvivvhvVR/X2ma4zjbIDfodUf1PXRPK/++woJSILVltk8iH36+y9W3mPWWH6KKsMC3jtdLVafdUI5PyUSlO3seneTa9PwTKFjuvR8b/5kGttKrW2XuynceY+39vba7480wBvAPhlPoJpfdS3eTkh2kjktvHktJsV504yPKCF/MqVK3q3/wXN/xjf8l8RY9qG7rMoN/XNzDa6Gk/+bCgBYJzquQ9A/SpjzmbnEo+9xhGNvU00X8ChOcqy+n/5s0FGLSVg1QSNbbNUKm0lUh/iWeV2cOpFrC/hXwYYD73h3+joRcpDqbbU9d83VrDbs+3kjjOCgWuRaeD6DyUm7dhFa0AIAAAAAElFTkSuQmCC";
    }
  };

  /*************************************       Microphone code      **********************************************/
  var final_transcript = '';
  var recognizing = false;
  var recognition = null;
  var prevStr = "";
  setTimeout(function () {
    if (allowGoogleSpeech) {
      initGapi();
    }
  }, 2000);

  function isChrome() {
    var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf("OPR") > -1,
      isIEedge = winNav.userAgent.indexOf("Edge") > -1,
      isIOSChrome = winNav.userAgent.match("CriOS");

    if (isIOSChrome) {
      return true;
    } else if (
      isChromium !== null &&
      typeof isChromium !== "undefined" &&
      vendorName === "Google Inc." &&
      isOpera === false &&
      isIEedge === false
    ) {
      return true;
    } else {
      return false;
    }
  }

  function unfreezeUIOnHistoryLoadingFail() {
    //console.log("UNFREEZE UI IN 20000")
    //setTimeout(function () {
      if (loadHistory) {
        $('.chatInputBox').focus();
        $('.disableFooter').removeClass('disableFooter');
        historyLoading = false;
      }

      //console.log("UNFREEZED UI IN 20000")
    //}, 20000);
  }

  if ('webkitSpeechRecognition' in window && isChrome()) {
    recognition = new window.webkitSpeechRecognition;
    final_transcript = '';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = function () {
      prevStr = "";
      recognizing = true;
      $('.recordingMicrophone').css('display', 'block');
      $('.notRecordingMicrophone').css('display', 'none');
    };

    recognition.onerror = function (event) {
      //console.log(event.error);
      $('.recordingMicrophone').trigger('click');
      $('.recordingMicrophone').css('display', 'none');
      $('.notRecordingMicrophone').css('display', 'block');
    };

    recognition.onend = function () {
      recognizing = false;
      $('.recordingMicrophone').trigger('click');
      $('.recordingMicrophone').css('display', 'none');
      $('.notRecordingMicrophone').css('display', 'block');
    };

    recognition.onresult = function (event) {
      final_transcript = '';
      var interim_transcript = '';
      for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript += event.results[i][0].transcript;
        } else {
          interim_transcript += event.results[i][0].transcript;
        }
      }
      final_transcript = capitalize(final_transcript);
      final_transcript = linebreak(final_transcript);
      interim_transcript = linebreak(interim_transcript);
      if (final_transcript !== "") {
        prevStr += final_transcript;
      }
      //console.log('Interm: ',interim_transcript);
      //console.log('final: ',final_transcript);
      if (recognizing) {
        $('.chatInputBox').html(prevStr + "" + interim_transcript);
        $('.sendButton').removeClass('disabled');
      }

      setTimeout(function () {
        setCaretEnd(document.getElementsByClassName("chatInputBox"));
        //document.getElementsByClassName('chatInputBox')[0].scrollTop = document.getElementsByClassName('chatInputBox')[0].scrollHeight;
      }, 350);
    };
  }

  var two_line = /\n\n/g;
  var one_line = /\n/g;

  function linebreak(s) {
    return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
  }

  function capitalize(s) {
    return s.replace(s.substr(0, 1), function (m) {
      return m.toUpperCase();
    });
  }

  function startGoogleWebKitRecognization() {
    if (recognizing) {
      recognition.stop();
      return;
    }
    final_transcript = '';
    recognition.lang = 'en-US';
    recognition.start();
  }

  function startGoogleSpeech() {
    if (rec) {
      rec.record();
      $('.recordingMicrophone').css('display', 'block');
      $('.notRecordingMicrophone').css('display', 'none');
      //console.log('recording...');
      intervalKey = setInterval(function () {
        rec.export16kMono(function (blob) {
          //console.log(new Date());
          if (allowGoogleSpeech) {
            sendBlobToSpeech(blob, 'LINEAR16', 16000);
          } else {
            socketSend(blob);
          }
          rec.clear();
        }, 'audio/x-raw');
      }, 1000);
    }
  }

  function getSIDToken() {
    if (allowGoogleSpeech) {
      if (recognition) { // using webkit speech recognition
        startGoogleWebKitRecognization();
      } else { // using google cloud speech API
        micEnable();
      }
    } else {
      $.ajax({
        url: speechPrefixURL + "asr/wss/start?email=" + userIdentity,
        type: 'post',
        headers: {"Authorization": (bearerToken) ? bearerToken : assertionToken},
        dataType: 'json',
        success: function (data) {
          sidToken = data.link;
          micEnable();
        },
        error: function (err) {
          // console.log(err);
        }

      });
    }
  }

  function micEnable() {
    if (isRecordingStarted) {
      return;
    }
    if (!navigator.getUserMedia) {
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
    }
    if (navigator.getUserMedia) {
      isRecordingStarted = true;
      navigator.getUserMedia({
        audio: true
      }, success, function (e) {
        isRecordingStarted = false;
        alert('Please enable the microphone permission for this page');

      });
    } else {
      isRecordingStarted = false;
      alert('getUserMedia is not supported in this browser.');
    }
  }


  function afterMicEnable() {
    if (navigator.getUserMedia) {
      if (!rec) {
        isRecordingStarted = false;
        console.error("Recorder undefined");
        return;
      }
      if (_connection) {
        cancel();
      }
      try {
        _connection = createSocket();
      } catch (e) {
        isRecordingStarted = false;
        //console.log(e);
        console.error('Web socket not supported in the browser');
      }
    }
  }

  function success(e) {
    isListening = true;
    mediaStream = e;
    if (!context) {
      var Context = window.AudioContext || window.webkitAudioContext;
      context = new Context();
    }
    mediaStreamSource = context.createMediaStreamSource(mediaStream);
    window.userSpeechAnalyser = context.createAnalyser();
    mediaStreamSource.connect(window.userSpeechAnalyser);
    //console.log('Mediastream created');
    if (_connection) {
      _connection.close();
      _connection = null;
    }
    if (rec) {
      rec.stop();
      rec.clear();
      //rec.destroy();
      rec = null;
    }
    rec = new Recorder(mediaStreamSource, {
      workerPath: recorderWorkerPath
    });
    // console.log('Recorder Initialized');
    _permission = true;
    if (!allowGoogleSpeech) {
      afterMicEnable();
    } else {
      startGoogleSpeech();
    }
    setTimeout(function () {
      setCaretEnd(document.getElementsByClassName("chatInputBox"));
    }, 600);
  }

  function cancel() {
    // Stop the regular sending of audio (if present) and disconnect microphone
    clearInterval(intervalKey);
    isRecordingStarted = false;
    if ($('.recordingMicrophone')) {
      $('.recordingMicrophone').css('display', 'none');
    }
    if ($('.notRecordingMicrophone')) {
      $('.notRecordingMicrophone').css('display', 'block');
    }
    if (mediaStream !== null && mediaStream && mediaStream.getTracks()[0].enabled) {
      var track = mediaStream.getTracks()[0];
      track.stop();
    }
    if (_connection) {
      _connection.close();
      _connection = null;
    }
    if (rec) {
      rec.stop();
      rec.clear();
    }
    sidToken = "";
  }

  function socketSend(item) {
    if (_connection) {
      var state = _connection.readyState;
      if (state === 1) {
        if (item instanceof Blob) {
          if (item.size > 0) {
            _connection.send(item);
            //console.log('Send: blob: ' + item.type + ', ' + item.size);
          } else {
            //console.log('Send: blob: ' + item.type + ', ' + item.size);
          }
        } else {
          console.log(item);
          _connection.send(item);
          //console.log('send tag: '+ item);
        }
      } else {
        isRecordingStarted = false;
        console.error('Web Socket readyState != 1: ', state, 'failed to send :' + item.type + ', ' + item.size);
        cancel();
      }
    } else {
      isRecordingStarted = false;
      console.error('No web socket connection: failed to send: ', item);
    }
  }


  function createSocket() {
    window.ENABLE_MICROPHONE = true;
    window.SPEECH_SERVER_SOCKET_URL = sidToken;
    var serv_url = window.SPEECH_SERVER_SOCKET_URL;
    var userEmail = userIdentity;
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var url = serv_url + '&' + CONTENT_TYPE + '&email=' + userEmail;
    var _connection = new WebSocket(url);
    // User is connected to server
    _connection.onopen = function (e) {
      // console.log('User connected');
      _user_connection = true;
      rec.record();
      $('.recordingMicrophone').css('display', 'block');
      $('.notRecordingMicrophone').css('display', 'none');
      //console.log('recording...');
      prevStr = "";
      intervalKey = setInterval(function () {
        rec.export16kMono(function (blob) {
          socketSend(blob);
          rec.clear();
        }, 'audio/x-raw');
      }, INTERVAL);
    };
    // On receving message from server
    _connection.onmessage = function (msg) {
      var data = msg.data;
      var interim_transcript = '';
      //console.log(data);
      if (data instanceof Object && !(data instanceof Blob)) {
        console.log('Got object that is not a blob');
      } else if (data instanceof Blob) {
        console.log('Got Blob');
      } else {
        var res = JSON.parse(data);
        if (isListening && res.status === 0) {
          interim_transcript = res.result.hypotheses[0].transcript;
          if (res.result.final) {
            prevStr += res.result.hypotheses[0].transcript + " ";
            interim_transcript = "";
          }

          console.log('Interm: ', interim_transcript);
          console.log('final: ', prevStr);
          $('.chatInputBox').html(prevStr + "" + interim_transcript);
          setTimeout(function () {
            setCaretEnd(document.getElementsByClassName("chatInputBox"));
            //document.getElementsByClassName('chatInputBox')[0].scrollTop = document.getElementsByClassName('chatInputBox')[0].scrollHeight;
          }, 350);
          /*if (res.result.final) {
                        var final_result = res.result.hypotheses[0].transcript;
                        $('.chatInputBox').html($('.chatInputBox').html() + ' ' + final_result);
                        setTimeout(function () {
                            setCaretEnd(document.getElementsByClassName("chatInputBox"));
                            document.getElementsByClassName('chatInputBox')[0].scrollTop = document.getElementsByClassName('chatInputBox')[0].scrollHeight;
                        }, 350);
                    } else {
                        //$('.chatInputBox').html($('.chatInputBox').html() + ' '+ res.result.hypotheses[0].transcript);
                        console.log('Not final: ', res.result.hypotheses[0].transcript);
                    }*/
        } else {
          console.log('Server error : ', res.status);
        }
      }
    };
    // If server is closed
    _connection.onclose = function (e) {
      if ($('.chatInputBox').text() !== '' && autoEnableSpeechAndTTS) {
        var me = window.chatContainerConfig;
        me.sendMessage($('.chatInputBox'));
      }
      isRecordingStarted = false;
      console.log('Server is closed');
      console.log(e);
      cancel();
    };
    // If there is an error while sending or receving data
    _connection.onerror = function (e) {
      console.log("Error : ", e);
    };
    return _connection;
  }

  function stop() {
    if ($('.chatInputBox').text() !== '' && autoEnableSpeechAndTTS) {
      var me = window.chatContainerConfig;
      me.sendMessage($('.chatInputBox'));
    }
    clearInterval(intervalKey);
    $('.recordingMicrophone').css('display', 'none');
    $('.notRecordingMicrophone').css('display', 'block');
    if (rec) {
      rec.stop();
      isListening = false;
      console.log('stopped recording..');
      setTimeout(function () {
        if (_connection) {
          _connection.close();
          _connection = null;
        }
      }, 1000); // waiting to send and receive last message

      rec.export16kMono(function (blob) {
        socketSend(blob);
        rec.clear();
        if (_connection) {
          _connection.close();
        }
        var track = mediaStream.getTracks()[0];
        track.stop();
        rec.destroy();
        isRecordingStarted = false;
      }, 'audio/x-raw');
    } else {
      console.error('Recorder undefined');
    }
    if (recognizing) {
      recognition.stop();
      recognizing = false;
    }
  }
  /*$(window).on('beforeunload', function () {
        cancel();
    });*/

  /*************************************    Microphone code end here    **************************************/

  /*************************************    TTS code start here         **************************************/
  function createSocketForTTS() {
    window.TTS_SOCKET_URL = ttsServerUrl;
    var serv_url = window.TTS_SOCKET_URL;
    var userEmail = userIdentity;
    window.WebSocket = window.WebSocket || window.MozWebSocket;
    var _ttsConnection = new WebSocket(serv_url);
    _ttsConnection.binaryType = 'arraybuffer';
    // User is connected to server
    _ttsConnection.onopen = function (e) {
      socketSendTTSMessage(_txtToSpeak);
    };
    // On receving message from server
    _ttsConnection.onmessage = function (msg) {
      _txtToSpeak = "";
      if (typeof msg.data === 'string') {
        // do nothing
      } else {
        var _data = msg.data;
        if (isTTSOn) {
          playsound(_data);
        }
      }
    };
    // If server is closed
    _ttsConnection.onclose = function (e) {
      //tts socket closed
    };
    // If there is an error while sending or receving data
    _ttsConnection.onerror = function (e) {
      console.log("Error : ", e);
    };
    return _ttsConnection;
  }

  function cancelTTSConnection() {
    if (_ttsConnection) {
      _ttsConnection.close();
      _ttsConnection = null;
    }
  }

  function socketSendTTSMessage(item) {
    if (_ttsConnection) {
      var state = _ttsConnection.readyState;
      if (state === 1) {
        var auth = (bearerToken) ? bearerToken : assertionToken;
        var _message = {
          message: item,
          'user': _botInfo.name,
          'authorization': auth
        };
        _ttsConnection.send(JSON.stringify(_message));
      } else {
        console.error('Web Socket readyState != 1: ', state);
        cancelTTSConnection();
      }
    } else {
      console.error('No web socket connection: failed to send');
    }
  }

  function initTTSAudioContext() {
    if (!_ttsContext) {
      if (!window.AudioContext) {
        if (!window.webkitAudioContext) {
          console.error("Your browser does not support any AudioContext and cannot play back this audio.");
          return;
        }
        window.AudioContext = window.webkitAudioContext;
      }
      _ttsContext = new AudioContext();
    }
  }

  initTTSAudioContext();

  function playsound(raw) {
    _ttsContext.decodeAudioData(raw, function (buffer) {
      if (!buffer) {
        console.error("failed to decode:", "buffer null");
        return;
      }
      try {
        if (ttsAudioSource) {
          ttsAudioSource.stop();
        }
        ttsAudioSource = _ttsContext.createBufferSource();
        ttsAudioSource.buffer = buffer;
        ttsAudioSource.connect(_ttsContext.destination);
        ttsAudioSource.start(0);
        ttsAudioSource.addEventListener('ended', function () {
          setTimeout(function () {
            if (isTTSOn && autoEnableSpeechAndTTS) {
              $('.notRecordingMicrophone').trigger('click');
            }
          }, 350);
        });
      } catch (e) {
      }
    }, function (error) {
      console.error("failed to decode:", error);
    });
  }

  /******************************** TTS code end here **********************************************/

  /************************************************************************************************************************************************
   ********************************************** kore.ai framework file ******************************************************************************
   ************************************************************************************************************************************************/
  +function () {
    function getHTTPConnecton() {
      var xhr = false;
      xhr = new XMLHttpRequest();
      if (xhr) {
        return xhr;
      } else if (typeof XDomainRequest !== "undefined") {
        return new XDomainRequest();
      }
      return xhr;
    }

    function HttpRequest() {
      var xhr = getHTTPConnecton();
      if (!xhr) {
        throw "Unsupported HTTP Connection";
      }
      try {
        xhr.withCredentials = true;
      } catch (e) {
      }
      xhr.onreadystatechange = function () {
        return xhr.onReadyStateChange && xhr.onReadyStateChange.call(xhr);
      };
      return xhr;
    }

    kfrm.net.HttpRequest = HttpRequest;
  }();

  /********************************  Code end here for attachment *******************************************/
  return {
    initToken: initToken,
    addListener: addListener,
    removeListener: removeListener,
    show: show,
    destroy: destroy,
    showError: showError,
    botDetails: botDetails,
    chatHistory: chatHistory,
    logoff:logoffFn
  };
}

$j.data.setup = {
  /*
        $j.data.setup.comm();
  */
  comm: function() {
    $.extend(true, $j.data.comm, {
      dictionary:{
        byScene:{},
        byIndex:{},
        messages:[]
      },
      classifications:{},
      methods:{},
      states:{
        provideFeedback:false
      }
    });

    var comm = $j.data.comm;
    // TODO: When adding packager, move dictionary data out of scripts
    var scenes = comm.dictionary.scenes;

    comm.methods.mapMessages();
    return comm;
  }
}


$j.data.comm.methods = {
  /*
      $j.data.comm.methods.mapMessages();
  */
  mapMessages: function() {
    var comm = $j.data.comm;

    $.each(comm.dictionary.scenes, function(id) {
      var message = this.message;
      var sceneIndex = (comm.dictionary.messages.push(message.join(" || ")))-1;

      comm.dictionary.byScene[id] = sceneIndex;
      comm.dictionary.byIndex[sceneIndex] = id;
    });

    return comm.dictionary;
  },
  /*
      $j.data.comm.methods.analyze("An agent will be assigned to you shortly.")
  */
  analyze: function(message) {
    var comm = $j.data.comm,
      analysis = jQuery.util("string", "bestMatch", {
        this: message,
        toThat: comm.dictionary.messages
      });
    //analysis = findBestMatch(message, comm.dictionary.messages);

    if(analysis.bestMatch.rating>.5) {
      var sceneName = comm.methods.get.scene(analysis.bestMatchIndex);
      if(sceneName) {
        comm.classifications = {
          scene: sceneName,
          confidence:analysis.bestMatch.rating,
          ratings:analysis.ratings,
          message: {
            sent: message,
            taget: analysis.bestMatch.target
          }
        }
      }

      return comm.classifications;
    }
  },
  get:{
    scene: function(byIndex) {
      return $j.data.comm.dictionary.byIndex[byIndex];
    }
  },
  inventory:{
    domComm: function() {
      var comm =  $j.data.comm;

      var config = {
        selectors:"[class*=message], [class*=Content]",
        minConfidence:.5
      };

      $(".kore-chat-window")
        .find(config.selectors)
        .not(":empty")
        .not(".extra-info")
        .each(function(i) {
          if($(this).parents(config.selectors).length>0) {
            return;
          }

          var message = $.trim($(this).text()),
            analysis = comm.methods.analyze(message);

          if(analysis.bestMatch.rating>config.minConfidence) {
            var sceneName = comm.methods.getScene(analysis.bestMatchIndex);
            if(sceneName) {
              comm.classifications[sceneName] = {
                analysis:analysis,
                message:message
              }
            }
          }
        });

      return comm.classifications;
    }
  }
}
