$(function () {

    /* View Code */
    var helper = function () {
        var self = this,
            resizeTimer = null;

        this.resizeHandler = function () {
            $('.view').height($(document).height() - $('header').height() * 2);
            $('.photo-item').width(window.innerWidth * 0.75)
                .first().css('margin-left', window.innerWidth * 0.125 + 'px')
                .end()
                .last().css('margin-right', window.innerWidth * 0.125 + 'px');
            $('.photo-frame').height($('.photo-frame').width());
            $('.photo-pic-overlay').height($('.photo-pic-overlay').width());
        };

        this.resizeHandler();

        $(window).bind('resize', function () {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(self.resizeHandler, 100);
        });
    }();


    /* Controller Code */



    /* Test Code */
    $(document).bind('touchstart', function(){console.log('touchstart')});
    $(document).bind('touchmove', function(){console.log('touchmove')});
    $(document).bind('touchend', function(){console.log('touchend')});
    $(document).bind('mousedown', function(){console.log('mousedown')});
    $(document).bind('mousemove', function(){console.log('mousemove')});
    $(document).bind('mouseup', function(){console.log('mouseup')});


});

