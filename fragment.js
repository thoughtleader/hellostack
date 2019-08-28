(function(jQuery) {
  var plugin = {
    name:"fragment",
    methods: {},
    init:false,
    requests:{},
    data: {
      loaded:{
        events:false
      }
    },
    events: {
      def: function() {

      }
    }
  };

  plugin.methods.dom = {
    /*
        jQuery(context).fragment({

        });
    */
    init: function(o) {
      jQuery.fragment("events", jQuery(this), o);

      return jQuery(this);
    },

    /*
        jQuery("body").fragment("message", {
          time:new Date(),
          announcement: {
            type:"reply",
            entity:{
              type:"human",
              name:"Boss"
            }
          },
          lines:[
            "Hello"
          ]
       })
    */
    message:function(o) {
      var $hola = $("<div type='hola'><div><div px='icon'></div><div id='body'></div></div></div></div>")

      var $message = plugin.methods.build.message(o).appendTo($hola.find("#body"));

      $hola = $hola.appendTo($(this))

      return $message;
    }
  };


  var util = plugin.methods.util = {
    /*
      jQuery.fragment();

      jQuery.fragment({
        after:function() {
          // EVENT ALSO FIRES ON BODY
        }
      })
    */
    init: function(o) {
      plugin.init=true;
      return plugin;
    },
    /*
      jQuery.fragment("events", context, type, json)
    */
    // events: function(context, o) {
    //   var events = plugin.events;
    //
    //   var event = events[o.type];
    //   if(!event) {
    //     event = events.def;
    //   }
    //
    //   event.apply(context, arguments);
    //
    //   return context;
    // }
  };

  // TODO: All the stringified html should be introduced differently, using a semi modern approach
  //       Use something like posthtml
  var build = plugin.methods.build = {
    /*
        build.message({ ... });

        <div px="message">
          <div>
            <div type="announcement"></div>
            <div type="lines"></div>
          </div>
        </div>
    */
    message:function(o) {
      var html = '<div px="message"> \
        <div> \
          <div type="announcement"></div> \
          <div type="lines"></div> \
        </div> \
      </div>';

      var $message = $(html);

      var announcement = o.announcement;
      if(announcement) {
        // TODO: Move these strings to the options object in chatWindow head
        var $anouncement = this.message_announcement([announcement.type, announcement.entity.name])

        //$message.find("[type=announcement]").append($anouncement);
        addInside("announcement", $anouncement);
      }

      // TODO: assuming that the code will stay peformant eniough to not drop anything
      //       If drops happen, will need to run multiple message in one go to catch up
      addInside("lines", this.message_line(o.lines[0]));

      return $message;


      function addInside(type, $el) {
        return $message.find("[type="+type+"]").append($el);
      }
    },
    /*
        message_annoucement(["Reply from", "Mr. Boss"])

        <div>
          <span>
            <b type="action">Reply from </b>
            <b type="name">Boss Bot</b>
          </span>
        </div>
    */
    message_announcement: function(a) {
        var action_text = jQuery.methods(a[0], {
          reply: function () {
            return "Reply from";
          },
          alert: function () {
            return "Message from";
          }
        });

        var $announcement = $("<div>" + this.message_line(partialString(a[0], action_text) + partialString("name", a[1])) + "</div>");

        return $announcement;

        function partialString(type, text) {
          return "<b type='"+type+"'>"+text+"</b>";
        }
    },
    /*
        message_line("Hello")

        <span>Hello,</span>
    */
    message_line: function(text) {
      return "<div>"+text+"</div>";
    }
  }

  var private = plugin.methods.private = {
    def: function() {

    }
  }

  // DON'T MODIFY > dollarJ (based on jQuery) plugin boilerplate
  jQuery.fn[plugin.name]=function(a){var b=plugin.methods.dom;if(b[a]){return b[a].apply(this,Array.prototype.slice.call(arguments,1))}else if(typeof a==="object"||!a){return b.init.apply(this,arguments)}else{jQuery.error("Method "+a+" does not exist on jQuery(el)."+plugin.name)}};jQuery[plugin.name]=function(a){if(jQuery.isNumeric(a)){a=parseInt(a)}var b=plugin.methods.util;if(b[a]){return b[a].apply(b,Array.prototype.slice.call(arguments,1))}else if(typeof a==="object"||!a||plugin.data[a]||jQuery.isNumeric(a)){return b.init.apply(b,arguments)}else{jQuery.error("Method "+a+" does not exist on jQuery."+plugin.name)}}
})(jQuery);
