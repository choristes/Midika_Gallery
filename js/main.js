/* View Code */

// レイアウトヘルパー
var helper = function () {
    var o = {};

    o.resizeTimer = null; // resize処理のタイマー
    o.photoItemWidth = 0; // .photo-item の width
    o.picNum = 2; // 画像の枚数（ホーム画像を含めて）、初期は2
    o.instructionPicNum = $('.instruction').length;
    o.onPic = 0; // 画面の真ん中にある画像の番号
    window.orientation = (typeof window.orientation !== 'undefined') ? window.orientation : 90;

    o.gotoPic = function (picId) {
        if (picId >= 0 && picId <= o.picNum - 1){
            o.onPic = picId;
            $('.photo-list').css('left', '-' + (o.onPic * o.photoItemWidth) + 'px');
        } else {
            // ここに「リミット」の演出を入れる予定
        }
    };

    o.toggleDetail = function (picId) {
        if (picId > o.instructionPicNum - 1) {
            // 真ん中の画像の情報を開閉、ほかの画像を開閉する
            $('.photo-frame').eq(picId).next().toggleClass('transparent')
                .parent().toggleClass('on')
                    .siblings().toggleClass('transparent');

            // .overlay を開閉する
            if (!$('.overlay').hasClass('on')) {
                $('.overlay').addClass('on');
            } else {
                $('.overlay').removeClass('on');
            }
        }
    };

    o.resizeHandler = function () {
        var viewHeight = $(document).height() - $('header').height() * 2; // .view の height 

        // デフォルト デバイスの向きが縦の場合
        o.photoItemWidth = Math.floor(window.innerWidth * 0.75);
        
        if (window.orientation === 90 || window.orientation === -90) {
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
        startX = 0,
        startY = 0;

    function touchHandler (e) {
        var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]; // jQuery eventObj fix

        e.preventDefault();

        switch (e.type) {
            case 'touchstart':
                startX = touch.clientX,
                startY = touch.clientY;
                break;

            case 'touchend':
                // helper の変数に依頼
                // 50px 以上も移動したら、スワイプ操作だと認識される
                if (touch.clientX - startX < -50) {
                    helper.gotoPic(helper.onPic + 1);
                } else if (touch.clientX - startX > 50) {
                    helper.gotoPic(helper.onPic - 1);
                } else {
                    //スワイプ操作ではない場合、タッチ操作かをチェック
                    if ($(e.target).is('.photo-frame') || $(e.target).parent().is('.photo-frame')) {
                        helper.toggleDetail(helper.onPic);
                    }
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

// マウスコントロール
var mouseControl = function () {
    var o = {};

    o.detailClickHandler = function (e) {
        e.preventDefault();

        if ($(e.currentTarget).parent().index() === helper.onPic) {
            helper.toggleDetail(helper.onPic);            
        } else {
            helper.gotoPic($(e.currentTarget).parent().index());            
        }
    };

    o.init = function () {
        // .photo-listに.photo-itemのclickイベントをdelegate
        $('.gallery-view').delegate('.photo-frame', 'click', o.detailClickHandler);
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
        helper.picNum = result.data.length + helper.instructionPicNum;
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
                comNum: dataItem.comments.count,
                link: dataItem.link
            };

            // info 詳細を入れる
            $('.photo-item').not('.instruction').eq(index)
                .find('.photo-pic')
                    .attr('src', info.lowRes)
                    .attr('alt', info.caption)
                .end()
                .find('.photo-time')
                    .html(
                        (1900 + info.time.getYear()) + '.'
                        + info.time.getMonth() + '.'
                        + info.time.getDate() + ' '
                        + info.time.getHours() + ':'
                        + info.time.getMinutes()
                    )
                .end()
                .find('.photo-title')
                    .attr('href', info.link).html(info.caption)
                .end()
                .find('.photo-interactions')
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
    mouseControl.init();

    geolocation.init();

    /* Test */
    // $(window).bind('resize', function () {
    //     console.log('onresize');
    // });

});

