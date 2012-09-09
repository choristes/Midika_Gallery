$(document).ready(function () {
    function resizeHandler () {
        $('.view').height($(document).height() - $('header').height() * 2);
        $('.photo-item').width(window.innerWidth * 0.75)
            .first().css('margin-left', window.innerWidth * 0.125 + 'px')
            .end()
            .last().css('margin-right', window.innerWidth * 0.125 + 'px');
        $('.photo-frame').height($('.photo-frame').width());
        $('.photo-pic-overlay').height($('.photo-pic-overlay').width());
    };

    resizeHandler();
    $(window).bind('resize', resizeHandler);
});
