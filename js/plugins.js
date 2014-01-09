// Avoid `console` errors in browsers that lack a console.
(function() {
  var method;
  var noop = function () {};
  var methods = [
    'assert', 'clear', 'count', 'debug', 'dir', 'dirxml', 'error',
    'exception', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log',
    'markTimeline', 'profile', 'profileEnd', 'table', 'time', 'timeEnd',
    'timeStamp', 'trace', 'warn'
  ];
  var length = methods.length;
  var console = (window.console = window.console || {});

  while (length--) {
    method = methods[length];

    // Only stub undefined methods.
    if (!console[method]) {
      console[method] = noop;
    }
  }
}());

//Hiding the top hardware for touch devices
if (Modernizr.touch) {
  (function (a) {
    var b = a.document;
    if (!location.hash && a.addEventListener) {
      window.scrollTo(0, 1);
      var c = 1,
        d = function () {
          return a.pageYOffset || b.compatMode === "CSS1Compat" && b.documentElement.scrollTop || b.body.scrollTop || 0;
        }, e = setInterval(function () {
          if (b.body) {
            clearInterval(e);
            c = d();
            a.scrollTo(0, c === 1 ? 0 : 1);
          }
        }, 15);
    a.addEventListener("load", function () {
        setTimeout(function () {
          if (d() < 20) {
            a.scrollTo(0, c === 1 ? 0 : 1);
          }
        }, 0);
      });
    }
  })(this);
}

// Place any jQuery/helper plugins in here.
/*
  BigVideo - The jQuery Plugin for Big Background Video (and Images)
  by John Polacek (@johnpolacek)
  
  Dual licensed under MIT and GPL.

    Dependencies: jQuery, jQuery UI (Slider), Video.js, ImagesLoaded
*/

(function($) {

  $.BigVideo = function(options) {

      var defaults = {
    // If you want to use a single mp4 source, set as true
    useFlashForFirefox:true,
    // If you are doing a playlist, the video won't play the first time
    // on a touchscreen unless the play event is attached to a user click
    forceAutoplay:false,
    controls:false,
    doLoop:false,
    container:$('body')
      };

      var BigVideo = this,
    player,
    vidEl = '#big-video-vid',
    wrap = $('<div id="big-video-wrap"></div>'),
    video = $(''),
    mediaAspect = 16/10,
    vidDur = 0,
    defaultVolume = 0,
    isInitialized = false,
    isSeeking = false,
    isPlaying = false,
    isQueued = false,
    isAmbient = false,
    playlist = [],
    currMediaIndex,
    currMediaType;

      var settings = $.extend({}, defaults, options);

      function updateSize() {
    var windowW = $(window).width();
    var windowH = $(window).height();
    var windowAspect = windowW/windowH;
    if (windowAspect < mediaAspect) {
      // taller
      if (currMediaType === 'video') {
        player
          .width(windowH*mediaAspect)
          .height(windowH);
        $(vidEl)
          .css('top',0)
          .css('left',-(windowH*mediaAspect-windowW)/2)
          .css('height',windowH);
        $(vidEl+'_html5_api').css('width',windowH*mediaAspect);
        $(vidEl+'_flash_api')
          .css('width',windowH*mediaAspect)
          .css('height',windowH);
      } else {
        // is image
        $('#big-video-image')
          .css({
            width: 'auto',
            height: windowH,
            top:0,
            left:-(windowH*mediaAspect-windowW)/2
          });
      }
    } else {
      // wider
      if (currMediaType === 'video') {
        player
          .width(windowW)
          .height(windowW/mediaAspect);
        $(vidEl)
          .css('background-color', '#000')
          .css('top',-(windowW/mediaAspect-windowH)/2)
          .css('left',0)
          .css('height',windowW/mediaAspect);
        $(vidEl+'_html5_api').css('width','100%');
        $(vidEl+'_flash_api')
          .css('width',windowW)
          .css('height',windowW/mediaAspect);
      } else {
        // is image
        $('#big-video-image')
          .css({
            width: windowW,
            height: 'auto',
            top:-(windowW/mediaAspect-windowH)/2,
            left:0
          });
      }
    }
  }

  function initPlayControl() {
    // create video controller
    var markup = '<div id="big-video-control-container">';
    markup += '<div id="big-video-control">';
    markup += '<a href="#" id="big-video-control-play"></a>';
    markup += '<div id="big-video-control-middle">';
    markup += '<div id="big-video-control-bar">';
    markup += '<div id="big-video-control-bound-left"></div>';
    markup += '<div id="big-video-control-progress"></div>';
    markup += '<div id="big-video-control-track"></div>';
    markup += '<div id="big-video-control-bound-right"></div>';
    markup += '</div>';
    markup += '</div>';
    markup += '<div id="big-video-control-timer"></div>';
    markup += '</div>';
    markup += '</div>';
    settings.container.append(markup);

    // hide until playVideo
    $('#big-video-control-container').css('display','none');

    // add events
    $('#big-video-control-track').slider({
      animate: true,
      step: 0.01,
      slide: function(e,ui) {
        isSeeking = true;
        $('#big-video-control-progress').css('width',(ui.value-0.16)+'%');
        player.currentTime((ui.value/100)*player.duration());
      },
      stop:function(e,ui) {
        isSeeking = false;
        player.currentTime((ui.value/100)*player.duration());
      }
    });
    $('#big-video-control-bar').click(function(e) {
      player.currentTime((e.offsetX/$(this).width())*player.duration());
    });
    $('#big-video-control-play').click(function(e) {
      e.preventDefault();
      playControl('toggle');
    });
    player.on('timeupdate', function() {
      if (!isSeeking && (player.currentTime()/player.duration())) {
        var currTime = player.currentTime();
        var minutes = Math.floor(currTime/60);
        var seconds = Math.floor(currTime) - (60*minutes);
        if (seconds < 10) seconds='0'+seconds;
        var progress = player.currentTime()/player.duration()*100;
        $('#big-video-control-track').slider('value',progress);
        $('#big-video-control-progress').css('width',(progress-0.16)+'%');
        $('#big-video-control-timer').text(minutes+':'+seconds+'/'+vidDur);
      }
    });
  }

  function playControl(a) {
    var action = a || 'toggle';
    if (action === 'toggle') action = isPlaying ? 'pause' : 'play';
    if (action === 'pause') {
      player.pause();
      $('#big-video-control-play').css('background-position','-16px');
      isPlaying = false;

    } else if (action === 'play') {
      player.play();
      $('#big-video-control-play').css('background-position','0');
      isPlaying = true;
    }
  }

  function setUpAutoPlay() {
    player.play();
    settings.container.off('click',setUpAutoPlay);
      }

  function nextMedia() {
    currMediaIndex++;
    if (currMediaIndex === playlist.length) currMediaIndex=0;
    playVideo(playlist[currMediaIndex]);
      }

      function playVideo(source) {

    // clear image
    $(vidEl).css('display','block');
    currMediaType = 'video';
    player.src(source);
    isPlaying = true;
    $('#big-video-control-container').css('display','none');
    if (isAmbient) {
      player.ready(function(){
        player.volume(0);
      });
      doLoop = true;
    } else {
      player.ready(function(){
        player.volume(defaultVolume);
      });
      doLoop = false;
    }
    $('#big-video-image').css('display','none');
    $(vidEl).css('display','block');
      }

      function showPoster(source) {
    // remove old image
    $('#big-video-image').remove();

    // hide video
    player.pause();
    $(vidEl).css('display','none');
    $('#big-video-control-container').css('display','none');

    // show image
    currMediaType = 'image';
    var bgImage = $('<img id="big-video-image" src='+source+' />');
    wrap.append(bgImage);

    $('#big-video-image').imagesLoaded(function() {
      mediaAspect = $('#big-video-image').width() / $('#big-video-image').height();
      updateSize();
    });
      }

  BigVideo.init = function() {
    if (!isInitialized) {
      // create player
      settings.container.prepend(wrap);
      var autoPlayString = settings.forceAutoplay ? 'autoplay' : '';
      player = $('<video id="'+vidEl.substr(1)+'" class="video-js vjs-default-skin" preload="auto" data-setup="{}" '+autoPlayString+' webkit-playsinline></video>');
      player.css('position','absolute');
      wrap.append(player);

      var videoTechOrder = ['html5','flash'];
      // If only using mp4s and on firefox, use flash fallback
      var ua = navigator.userAgent.toLowerCase();
      var isFirefox = ua.indexOf('firefox') != -1;
      if (settings.useFlashForFirefox && (isFirefox)) {
        videoTechOrder = ['flash', 'html5'];
      }
      player = videojs(vidEl.substr(1), { 
        controls:false, 
        autoplay:true, 
        preload:'auto', 
        techOrder:videoTechOrder
      });

      // add controls
      if (settings.controls) initPlayControl();

      // set initial state
      updateSize();
      isInitialized = true;
      isPlaying = false;

      if (settings.forceAutoplay) {
        $('body').on('click', setUpAutoPlay);
      }

      $('#big-video-vid_flash_api')
        .attr('scale','noborder')
        .attr('width','100%')
        .attr('height','100%');

      // set events
      $(window).resize(function() {
        updateSize();
      });

      player.on('loadedmetadata', function(data) {
        if (document.getElementById('big-video-vid_flash_api')) {
          // use flash callback to get mediaAspect ratio
          mediaAspect = document.getElementById('big-video-vid_flash_api').vjs_getProperty('videoWidth')/document.getElementById('big-video-vid_flash_api').vjs_getProperty('videoHeight');
        } else {
          // use html5 player to get mediaAspect
          mediaAspect = $('#big-video-vid_html5_api').prop('videoWidth')/$('#big-video-vid_html5_api').prop('videoHeight');
        }
        updateSize();
        var dur = Math.round(player.duration());
        var durMinutes = Math.floor(dur/60);
        var durSeconds = dur - durMinutes*60;
        if (durSeconds < 10) durSeconds='0'+durSeconds;
        vidDur = durMinutes+':'+durSeconds;
      });

      player.on('ended', function() {
        if (settings.doLoop) {
          player.currentTime(0);
          player.play();
        }
        if (isQueued) {
          nextMedia();
        }
      });
    }
      };

      BigVideo.show = function(source,options) {
    if (options === undefined) options = {};
    isAmbient = options.ambient === true;
    if (isAmbient || options.doLoop) settings.doLoop = true;
    if (typeof(source) === 'string') {
      var ext = source.substring(source.lastIndexOf('.')+1);
      if (ext === 'jpg' || ext === 'gif' || ext === 'png') {
        showPoster(source);
      } else {
        if (options.altSource && navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
          source = options.altSource;
        }
        playVideo(source);
        isQueued = false;
      }
    } else {
      playlist = source;
      currMediaIndex = 0;
      playVideo(playlist[currMediaIndex]);
      isQueued = true;
    }
      };

      // Expose Video.js player
      BigVideo.getPlayer = function() {
        return player;
      };

      // Expose BigVideoJS player actions (like 'play', 'pause' and so on)
      BigVideo.triggerPlayer = function(action){
        playControl(action);
      };
  };

})(jQuery);

/*global jQuery */
/*jshint multistr:true browser:true */
/*!
* FitVids 1.0
*
* Copyright 2011, Chris Coyier - http://css-tricks.com + Dave Rupert - http://daverupert.com
* Credit to Thierry Koblentz - http://www.alistapart.com/articles/creating-intrinsic-ratios-for-video/
* Released under the WTFPL license - http://sam.zoy.org/wtfpl/
*
* Date: Thu Sept 01 18:00:00 2011 -0500
*/

(function( $ ){

  "use strict";

  $.fn.fitVids = function( options ) {
    var settings = {
      customSelector: null
    };

    if(!document.getElementById('fit-vids-style')) {

      var div = document.createElement('div'),
          ref = document.getElementsByTagName('base')[0] || document.getElementsByTagName('script')[0],
          cssStyles = '&shy;<style>.fluid-width-video-wrapper{width:100%;position:relative;padding:0;top:50%;margin-top:-30%;}.fluid-width-video-wrapper iframe,.fluid-width-video-wrapper object,.fluid-width-video-wrapper embed {position:absolute;top:0;left:0;width:100%;height:100%;}</style>';

      div.className = 'fit-vids-style';
      div.id = 'fit-vids-style';
      div.style.display = 'none';
      div.innerHTML = cssStyles;

      ref.parentNode.insertBefore(div,ref);

    }

    if ( options ) {
      $.extend( settings, options );
    }

    return this.each(function(){
      var selectors = [
        "iframe[src*='player.vimeo.com']",
        "iframe[src*='youtube.com']",
        "iframe[src*='youtube-nocookie.com']",
        "iframe[src*='kickstarter.com'][src*='video.html']",
        "object",
        "embed"
      ];

      if (settings.customSelector) {
        selectors.push(settings.customSelector);
      }

      var $allVideos = $(this).find(selectors.join(','));
      $allVideos = $allVideos.not("object object"); // SwfObj conflict patch

      $allVideos.each(function(){
        var $this = $(this);
        if (this.tagName.toLowerCase() === 'embed' && $this.parent('object').length || $this.parent('.fluid-width-video-wrapper').length) { return; }
        var height = ( this.tagName.toLowerCase() === 'object' || ($this.attr('height') && !isNaN(parseInt($this.attr('height'), 10))) ) ? parseInt($this.attr('height'), 10) : $this.height(),
            width = !isNaN(parseInt($this.attr('width'), 10)) ? parseInt($this.attr('width'), 10) : $this.width(),
            aspectRatio = height / width;
        if(!$this.attr('id')){
          var videoID = 'fitvid' + Math.floor(Math.random()*999999);
          $this.attr('id', videoID);
        }
        $this.wrap('<div class="fluid-width-video-wrapper"></div>').parent('.fluid-width-video-wrapper').css('padding-top', (aspectRatio * 100)+"%");
        $this.removeAttr('height').removeAttr('width');
      });
    });
  };
})( jQuery );

/**
 *
 * Version: 0.0.4
 * Author: Gianluca Guarini
 * Contact: gianluca.guarini@gmail.com
 * Website: http://www.gianlucaguarini.com/
 * Twitter: @gianlucaguarini
 *
 * Copyright (c) 2013 Gianluca Guarini
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 **/

;(function(window, document, $) {
  "use strict";

  // Plugin private cache

  var cache = {
    filterId: 0
  };

  var Vague = function(elm, customOptions) {
    // Default oprions
    var defaultOptions = {
      intensity: 5,
      forceSVGUrl: false
    },
      options = $.extend(defaultOptions, customOptions);

    /*
     *
     * PUBLIC VARS
     *
     */

    this.$elm = elm instanceof $ ? elm : $(elm);

    /*
     *
     * PRIVATE VARS
     *
     */


    var blurred = false;

    /*
     *
     * features detection
     *
     */

    var browserPrefixes = ' -webkit- -moz- -o- -ms- '.split(' '),
      cssPrefixString = {},
      cssPrefix = function(property) {
        if (cssPrefixString[property] || cssPrefixString[property] === '') return cssPrefixString[property] + property;
        var e = document.createElement('div');
        var prefixes = ['', 'Moz', 'Webkit', 'O', 'ms', 'Khtml']; // Various supports...
        for (var i in prefixes) {
          if (typeof e.style[prefixes[i] + property] !== 'undefined') {
            cssPrefixString[property] = prefixes[i];
            return prefixes[i] + property;
          }
        }
        return property.toLowerCase();
      },

      // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/css-filters.js
      cssfilters = function() {
        var el = document.createElement('div');
        el.style.cssText = browserPrefixes.join('filter' + ':blur(2px); ');
        return !!el.style.length && ((document.documentMode === undefined || document.documentMode > 9));
      }(),

      // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/svg-filters.js
      svgfilters = function() {
        var result = false;
        try {
          result = typeof SVGFEColorMatrixElement !== undefined &&
            SVGFEColorMatrixElement.SVG_FECOLORMATRIX_TYPE_SATURATE == 2;
        } catch (e) {}
        return result;
      }(),

      /*
       *
       * PRIVATE METHODS
       *
       */

      appendSVGFilter = function() {

        var filterMarkup = "<svg id='vague-svg-blur' style='position:absolute;' width='0' height='0' >" +
          "<filter id='blur-effect-id-" + cache.filterId + "'>" +
          "<feGaussianBlur stdDeviation='" + options.intensity + "' />" +
          "</filter>" +
          "</svg>";

        $("body").append(filterMarkup);

      };

    /*
     *
     * PUBLIC METHODS
     *
     */

    this.init = function() {
      // checking the css filter feature

      if (svgfilters) {
        appendSVGFilter();
      }

      this.$elm.data("vague-filter-id", cache.filterId);

      cache.filterId++;

    };

    this.blur = function() {
      var filterValue,
        loc = window.location,
        svgUrl = options.forceSVGUrl ? loc.protocol + "//" + loc.host + loc.pathname : '',
        filterId = this.$elm.data("vague-filter-id"),
        cssProp = {};
      if (cssfilters) {
        filterValue = "blur(" + options.intensity + "px)";
      } else if (svgfilters) {
        filterValue = "url(" + svgUrl + "#blur-effect-id-" + filterId + ")";
      } else {
        filterValue = "progid:DXImageTransform.Microsoft.Blur(pixelradius=" + options.intensity + ")";
      }
      cssProp[cssPrefix('Filter')] = filterValue;

      this.$elm.css(cssProp);

      blurred = true;
    };

    this.unblur = function() {
      var cssProp = {};
      cssProp[cssPrefix('Filter')] = "none";
      this.$elm.css(cssProp);
      blurred = false;
    };

    this.toggleblur = function() {
      if (blurred) {
        this.unblur();
      } else {
        this.blur();
      }
    };

    this.destroy = function() {
      if (svgfilters) {
        $("filter#blur-effect-id-" + this.$elm.data("vague-filter-id")).parent().remove();
      }
      this.unblur();
    };
    return this.init();
  };

  $.fn.Vague = function(options) {
    return new Vague(this, options);
  };

  window.Vague = Vague;

}(window, document, jQuery));

var Froogaloop=function(){function e(a){return new e.fn.init(a)}function h(a,c,b){if(!b.contentWindow.postMessage)return!1;var f=b.getAttribute("src").split("?")[0],a=JSON.stringify({method:a,value:c});"//"===f.substr(0,2)&&(f=window.location.protocol+f);b.contentWindow.postMessage(a,f)}function j(a){var c,b;try{c=JSON.parse(a.data),b=c.event||c.method}catch(f){}"ready"==b&&!i&&(i=!0);if(a.origin!=k)return!1;var a=c.value,e=c.data,g=""===g?null:c.player_id;c=g?d[g][b]:d[b];b=[];if(!c)return!1;void 0!==
a&&b.push(a);e&&b.push(e);g&&b.push(g);return 0<b.length?c.apply(null,b):c.call()}function l(a,c,b){b?(d[b]||(d[b]={}),d[b][a]=c):d[a]=c}var d={},i=!1,k="";e.fn=e.prototype={element:null,init:function(a){"string"===typeof a&&(a=document.getElementById(a));this.element=a;a=this.element.getAttribute("src");"//"===a.substr(0,2)&&(a=window.location.protocol+a);for(var a=a.split("/"),c="",b=0,f=a.length;b<f;b++){if(3>b)c+=a[b];else break;2>b&&(c+="/")}k=c;return this},api:function(a,c){if(!this.element||
!a)return!1;var b=this.element,f=""!==b.id?b.id:null,d=!c||!c.constructor||!c.call||!c.apply?c:null,e=c&&c.constructor&&c.call&&c.apply?c:null;e&&l(a,e,f);h(a,d,b);return this},addEvent:function(a,c){if(!this.element)return!1;var b=this.element,d=""!==b.id?b.id:null;l(a,c,d);"ready"!=a?h("addEventListener",a,b):"ready"==a&&i&&c.call(null,d);return this},removeEvent:function(a){if(!this.element)return!1;var c=this.element,b;a:{if((b=""!==c.id?c.id:null)&&d[b]){if(!d[b][a]){b=!1;break a}d[b][a]=null}else{if(!d[a]){b=
!1;break a}d[a]=null}b=!0}"ready"!=a&&b&&h("removeEventListener",a,c)}};e.fn.init.prototype=e.fn;window.addEventListener?window.addEventListener("message",j,!1):window.attachEvent("onmessage",j);return window.Froogaloop=window.$f=e}();
