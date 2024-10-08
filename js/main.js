
$(function () {
  // initialize BigVideo
  var BV = new $.BigVideo();
  BV.init();
  if (!Modernizr.touch) {
    BV.show('/immaculatereception/img/the_immaculate_reception_-_trailer_640x360.mp4', { ambient: true });
  }

  //blur video on scroll
  $(window).scroll(function(){
    var top = $(window).scrollTop();
    var $vidContainer = $("#big-video-vid");
    var vague = $vidContainer.Vague({intensity:top/50});
    vague.blur();

    $("#big-video-wrap").children("video, object").css('opacity', 100 - (top/5));
  })

  //smooth scrolling: http://css-tricks.com/examples/SmoothPageScroll/
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') 
        || location.hostname == this.hostname) {

      var target = $(this.hash);
      var winHeight = $(window).height();
      
      // if ($(window).width() < 0) {
      //   winHeight = 0;
      // } else {
      //   winHeight = winHeight/4;
      // }
          
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 750);
        return false;
      }
    }
  });

  var iframe = $('#vimeoembed')[0],
      player = $f(iframe);

  // Video Play/Pause toggle
  $('.video-toggle, .trailer').click(function (event) {
    event.preventDefault();

    if (BV.getPlayer().paused())  {
      BV.getPlayer().play();
      player.api('pause');
    } else {
      BV.getPlayer().pause();
    }

    $('.trailer').toggleClass('show').fitVids();
  });


  //import .md
  $.ajax({
    url: "/immaculatereception/showings.md",
    context: document.body,
    success: function(mdText){
      //where text will be the text returned by the ajax call
      var converter = new Showdown.converter();
      var htmlText = converter.makeHtml(mdText);
      $(".showings-list").append(htmlText); //append this to a div with class outputDiv
    }
  });
});






