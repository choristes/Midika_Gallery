/* View Code */

// レイアウトヘルパー
var helper = function () {
    var o = {};

    o.resizeTimer = null; // resize処理のタイマー
    o.photoItemWidth = 0; // .photo-item の width
    o.picNum = 3; // 画像の枚数（ホーム画像を含めて）
    o.onPic = 0; // 画面の真ん中にある画像の番号

    o.resizeHandler = function () {
        var viewHeight = $(document).height() - $('header').height() * 2; // .view の height 

        // デフォルト デバイスの向きが縦の場合
        o.photoItemWidth = Math.floor(window.innerWidth * 0.75);
        
        if (window.orientation && (window.orientation === 90 || window.orientation === -90)) {
            // デバイスの向きが横の場合
            o.photoItemWidth = Math.floor(window.innerWidth * 0.4);
        }

        endItemMargin = Math.floor(($('.view').width() - o.photoItemWidth) / 2);



        $('.view').height(viewHeight);
        $('.photo-item').width(o.photoItemWidth)
            .first().css('margin-left', endItemMargin + 'px');

        $('.photo-frame').height($('.photo-frame').width());
        $('.photo-pic-overlay').height($('.photo-pic-overlay').width());

        // console.log('resizeHandler完了');
    };

    o.resetPhotoListPos = function (e) {
        $('.photo-list').css('left', '-' + ((o.photoItemWidth) * o.onPic) +'px'); // ズレ修正
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
            // 原因：スマホでresizeHandlerが実行した後、DOMの変動によってresizeイベントが引き起こされたのです
        });
    };        

    return o;
}();


/* Controller Code */

// スワイプコントロール（.gallery-view 中の .photo-list を動かす） 
var swipeControl = function () {
    var o = {},
        startX = 0;

    // .photo-list を動かす
    o.gotoPic = function (step) {
        var styleObj = {};
        step = Math.floor(step);

        if (step > 0) {
            if (helper.onPic < helper.picNum - 1) {
                styleObj.left = '-=' + (helper.photoItemWidth); // ズレ修正
                helper.onPic += 1;
            } else {
                // ここに「リミット」の演出を入れる予定
            }
        } else if (step < 0) {
            if (helper.onPic > 0) {
                styleObj.left = '+=' + (helper.photoItemWidth); // ズレ修正
                helper.onPic -= 1;
            } else {
                // ここに「リミット」の演出を入れる予定
            }
        } else {
            styleObj = {};
        }

        $('.photo-list').css(styleObj);
    };

    function touchHandler (e) {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]; // jQuery eventObj fix

        e.preventDefault();

        switch (e.type) {
            case 'touchstart':
                startX = touch.clientX;
                break;

            case 'touchend':
                // helper の変数に依頼
                // 50px 以上も移動したら、スワイプ操作だと認識される
                if (touch.clientX - startX < -50) {
                    o.gotoPic(1);
                } else if (touch.clientX - startX > 50) {
                    o.gotoPic(-1);
                }

                break;
        }
    };

    o.init = function () {
        $('.gallery-view').bind('touchstart', touchHandler);
        $('.gallery-view').bind('touchend', touchHandler);
    };

    return o;
}();

// 抽出関数（JSONPでInstagramのAPIからデータを抽出）
// Geolocationを取得してから初期化される
function dataGatherer (lat, lng) {
    var url = 'https://api.instagram.com/v1/media/search?lat='
            + lat
            + '&lng='
            + lng
            + '&distance=5000'
            + '&client_id=9e3fbb0b157c4390b1c224f0f174e39c';

    
    // JSONP
    $.getJSON(url + "&callback=?", function (result) {
        // .photo-item の個数を満たす
        helper.picNum = result.data.length + $('.instruction').length;
        while ($('.photo-item').length < helper.picNum) {
            $('.photo-item:last').clone(true).appendTo($('.photo-list'));
        }

        // .photo-item の詳細を入れる
        $.each(result.data, function (index, dataItem) {
            // data を整理
            var info = {
                lowRes: dataItem.images.low_resolution.url,
                stdRes: dataItem.images.standard_resolution.url,
                caption: dataItem.caption ? dataItem.caption.text : 'Untitled',
                time: new Date(dataItem.created_time * 1000), // UNIX Time Stamp をJSのDate対象に変換
                likeNum: dataItem.likes.count,
                comNum: dataItem.comments.count
            };

            // info 詳細を入れる
            $('.photo-item').not('.instruction').eq(index)
                .find('.photo-pic')
                    .attr('src', info.lowRes)
                    .attr('alt', info.caption)
                .end()
                .find('.photo-time')
                    .html(
                        info.time.getYear() + '.'
                        + info.time.getMonth() + '.'
                        + info.time.getDate() + ' '
                        + info.time.getHours() + ':'
                        + info.time.getMinutes()
                    )
                .end()
                .find('.photo-title')
                    .html(info.caption)
                .end()
                .find('photo-interactions')
                    .html(info.likeNum + ' ♥ ' + info.comNum + ' …');
        });
    });
};

// Geolocationコントロール   
var geolocation = function () {
    var o = {};

    o.init = function () {

        // Loading表現

        // Callbackで
        // Loading表現を切る
        // 位置情報を使ってInstagram APIと通信
        function callback (pos) {
            var lat = pos.coords.latitude,
                lng = pos.coords.longitude;

            dataGatherer(lat, lng);
        };

        // Geolocationを取得
        navigator.geolocation.getCurrentPosition(callback);
    };

    return o;
}();

$(function () {
    
    /* Init */
    helper.init();    
    swipeControl.init();

    geolocation.init();

    /* Test */
    // $(window).bind('resize', function () {
    //     console.log('onresize');
    // });

});

