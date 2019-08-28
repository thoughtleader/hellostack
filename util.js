(function(jQuery) {
  var plugin = {
    name:"util",
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
      jQuery(context).util({
        type:"links"
      });

      jQuery(context).util({
        type:"links",
        json: json
      });
    */
    init: function(o) {
      jQuery.util("events", jQueryj(this), o);

      return jQuery(this);
    },
    events: function() {

    }
  };

  var util = plugin.methods.util = {
    /*
      jQueryj.util();

      jQueryj.util({
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
        jQuery.util("string", "compare", {
          this: "test",
          toThat: "testing"
        })

        jQuery.util("string", "bestMatch", {
          this: "test",
          toThat: ["testing", "another string", "and another string"]
        })
    */
    string:function(operation, o) {
      var fn = jQuery.methods(operation, {
        compare:function() {
          return private.compareTwoStrings;
        },
        bestMatch: function() {
          return private.findBestMatch;
        }
      });

      return fn.apply(plugin.methods.private, [o["this"], o.toThat]);
    },
    /*
      jQuery.util("events", context, type, json)
    */
    events: function(context, o) {
      var events = plugin.events;

      var event = events[o.type];
      if(!event) {
        event = events.def;
      }

      event.apply(context, arguments);

      return context;
    }
  }

  var private = plugin.methods.private = {
    compareTwoStrings: function(first, second) {
      first = first.replace(/\s+/g, '');
      second = second.replace(/\s+/g, '');

      if (!first.length && !second.length) return 1;                   // if both are empty strings
      if (!first.length || !second.length) return 0;                   // if only one is empty string
      if (first === second) return 1;       							 // identical
      if (first.length === 1 && second.length === 1) return 0;         // both are 1-letter strings
      if (first.length < 2 || second.length < 2) return 0;			 // if either is a 1-letter string

      var firstBigrams = new Map();
      for (var i = 0; i < first.length - 1; i++) {
        const bigram = first.substr(i, 2);
        const count = firstBigrams.has(bigram)
          ? firstBigrams.get(bigram) + 1
          : 1;

        firstBigrams.set(bigram, count);
      }
      var intersectionSize = 0;
      for (var i = 0; i < second.length - 1; i++) {
        const bigram = second.substr(i, 2);
        const count = firstBigrams.has(bigram)
          ? firstBigrams.get(bigram)
          : 0;

        if (count > 0) {
          firstBigrams.set(bigram, count - 1);
          intersectionSize++;
        }
      }

      return (2.0 * intersectionSize) / (first.length + second.length - 2);
    },
    findBestMatch: function(mainString, targetStrings) {
      if (!this.areArgsValid(mainString, targetStrings)) throw new Error('Bad arguments: First argument should be a string, second should be an array of strings');

      var ratings = [];
      var bestMatchIndex = 0;

      for (var i = 0; i < targetStrings.length; i++) {
        const currentTargetString = targetStrings[i];
        const currentRating = this.compareTwoStrings(mainString, currentTargetString);
        ratings.push({target: currentTargetString, rating: currentRating});
        if (currentRating > ratings[bestMatchIndex].rating) {
          bestMatchIndex = i
        }
      }

      var bestMatch = ratings[bestMatchIndex];

      return {
        ratings:ratings,
        bestMatch: bestMatch,
        bestMatchIndex: bestMatchIndex
      };
    },
    flattenDeep: function(arr) {
      var _this = this;

      return Array.isArray(arr) ? arr.reduce(function (a, b) {
        return a.concat(_this.flattenDeep(b));
      }, []) : [arr];
    },
    areArgsValid: function(mainString, targetStrings) {
      if (typeof mainString !== 'string') return false;
      if (!Array.isArray(targetStrings)) return false;
      if (!targetStrings.length) return false;
      if (targetStrings.find(function (s) {
        return typeof s !== 'string';
      })) return false;
      return true;
    },
    letterPairs:function(str) {
      const pairs = [];
      for (var i = 0, max = str.length - 1; i < max; i++) pairs[i] = str.substring(i, i + 2);
      return pairs;
    },
    wordLetterPairs: function(str) {
      const pairs = str.toUpperCase().split(' ').map(letterPairs);
      return this.flattenDeep(pairs);
    }
  }

  // DON'T MODIFY > dollarJ (based on jQuery) plugin boilerplate
  jQuery.fn[plugin.name]=function(a){var b=plugin.methods.dom;if(b[a]){return b[a].apply(this,Array.prototype.slice.call(arguments,1))}else if(typeof a==="object"||!a){return b.init.apply(this,arguments)}else{jQuery.error("Method "+a+" does not exist on jQuery(el)."+plugin.name)}};jQuery[plugin.name]=function(a){if(jQuery.isNumeric(a)){a=parseInt(a)}var b=plugin.methods.util;if(b[a]){return b[a].apply(b,Array.prototype.slice.call(arguments,1))}else if(typeof a==="object"||!a||plugin.data[a]||jQuery.isNumeric(a)){return b.init.apply(b,arguments)}else{jQuery.error("Method "+a+" does not exist on jQuery."+plugin.name)}}
})(jQuery);
