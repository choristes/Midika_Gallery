/* View Code */

// レイアウトヘルパー
var helper = function () {
    var o = {};

    o.resizeTimer = null; // onresize処理のタイマー
    o.photoItemWidth = 0; // .photo-item の width
    o.picNum = 3; // 画像の枚数（ホーム画像を含めて）
    o.onPic = 0; // 真ん中にある画像の番号

    o.resizeHandler = function () {
        var viewHeight = $(document).height() - $('header').height() * 2; // .view の height 

        // デフォルト デバイスの向きが縦の場合
        o.photoItemWidth = window.innerWidth * 0.75;
        
        if (window.orientation && (window.orientation === 90 || window.orientation === -90)) {
            // デバイスの向きが横の場合
            o.photoItemWidth = window.innerWidth * 0.4;
        }

        endItemMargin = (window.innerWidth - o.photoItemWidth) / 2;



        $('.view').height(viewHeight);
        $('.photo-item').width(o.photoItemWidth)
            .first().css('margin-left', endItemMargin + 'px')
            .end()
            .last().css('margin-right', endItemMargin + 'px');

        $('.photo-frame').height($('.photo-frame').width());
        $('.photo-pic-overlay').height($('.photo-pic-overlay').width());

        // console.log('resizeHandler完了');
    };

    o.resetPhotoListPos = function (e) {
        $('.photo-list').css('left', '-' + (o.photoItemWidth * o.onPic) +'px');
    };

    o.init = function () {
        o.resizeTimer = setTimeout(function () {
            o.resizeHandler();
        }, 100);

        $(window).bind('resize', function () {
            clearTimeout(o.resizeTimer);
            o.resizeTimer = setTimeout(function(){
                o.resizeHandler();
                o.resetPhotoListPos();
            }, 100);
            // 問題：どうして縦になるとき、resizeHandler は二回も実行される？
            // タイマーをクリアしたから、実行回数は一回だけなはずだが
            // 原因：resizeHandlerが実行した後、DOMの変動によってresizeイベントが引き起こされたのです
        });
    };        

    return o;
}();


/* Controller Code */

// スワイプコントロール（.gallery-view 中の .photo-list を動かす） 
var swipeControl = function () {
    var o = {},
        startX = 0;

    function touchHandler (e) {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0], // jQuery eventObj fix
            styleObj = {};

        e.preventDefault();

        switch (e.type) {
            case 'touchstart':
                startX = touch.clientX;
                break;

            case 'touchend':
                // helper の変数に依頼
                // 50px 以上も移動したら、スワイプ操作だと認識される
                if (touch.clientX - startX < -50) {
                    if (helper.onPic < helper.picNum - 1) {
                        styleObj.left = '-=' + helper.photoItemWidth;
                        helper.onPic += 1;
                    } else {
                        // ここに「リミット」の演出を入れる予定
                    }
                } else if (touch.clientX - startX > 50) {
                    if (helper.onPic > 0) {
                        styleObj.left = '+=' + helper.photoItemWidth;
                        helper.onPic -= 1;
                    } else {
                        // ここに「リミット」の演出を入れる予定
                    }
                } else {
                    styleObj = {};
                }
                $('.photo-list').css(styleObj);
                break;
        }
    };

    o.init = function () {
        $(document).bind('touchstart', touchHandler);
        $(document).bind('touchend', touchHandler);
    };

    return o;
}();

$(function () {
    
    /* Init */
    swipeControl.init();
    helper.init();

    /* Test */
    // $(window).bind('resize', function () {
    //     console.log('onresize');
    // });

});

