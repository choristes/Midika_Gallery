(function () {

    /* View Code */

    // レイアウトヘルパー
    var helper = function () {
        var o = {};

        o.controlType = 0; // Touchなら1、Mouseなら2（Android Browserでの混乱を避けるため）
        o.resizeTimer = null; // resize処理のタイマー
        o.photoItemWidth = 0; // .photo-item の width
        o.picNum = 2; // 画像の枚数（ホーム画像を含めて）、初期は2
        o.instructionPicNum = $('.instruction').length;
        o.onPic = 0; // 画面の真ん中にある画像の番号
        window.orientation = (typeof window.orientation !== 'undefined') ? window.orientation : 90;

        o.gotoPic = function (picId) {
            if (!$('.overlay').hasClass('on')) {
                if (picId >= 0 && picId <= o.picNum - 1){
                    o.onPic = picId;
                    o.moveto(-1 * (picId * o.photoItemWidth));
                } else {
                    // リミットの場合、最初か最後の画像に戻る
                    arguments.callee(o.onPic);
                }
            }
        };

        o.moveto = function (offset) {
            $('.photo-list').css('-webkit-transform', 'translate3d(' + offset + 'px, 0, 0)');
            // $('body').css('background-position-x', offset +'px');
        }

        o.toggleDetail = function (picId) {
            if (picId > o.instructionPicNum - 1) {
                // .overlay を開閉する
                if (!$('.overlay').hasClass('on')) {
                    $('.overlay').addClass('on');
                    // 真ん中の画像の情報を開閉、ほかの画像を開閉する
                    $('.photo-frame').eq(picId).next().removeClass('transparent')
                        .parent().addClass('on')
                            .siblings().addClass('transparent');
                } else {
                    $('.overlay').removeClass('on');
                    // 真ん中の画像の情報を開閉、ほかの画像を開閉する
                    $('.photo-frame').eq(picId).next().addClass('transparent')
                        .parent().removeClass('on')
                            .siblings().removeClass('transparent');
                }
            }
        };

        o.resizeHandler = function () {
            var viewHeight = $(document).height() - $('header').height(); // .view の height 

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
        };

        o.resetPhotoListPos = function (e) {
            o.gotoPic(o.onPic);
        };

        // .photo-listのwidthを再調整
        o.resizePhotoList = function () {
            $('.photo-list').width($('.view').width() + o.photoItemWidth * (o.picNum - 1));
        };

        o.init = function () {
            o.resizeTimer = setTimeout(function () {
                o.resizeHandler();
            }, 100);

            $(window).bind('resize', function () {
                clearTimeout(o.resizeTimer);
                o.resizeTimer = setTimeout(function(){
                    o.resizeHandler();
                    o.resizePhotoList();
                    o.resetPhotoListPos();
                }, 100);
                // 問題：どうして縦になるとき、resizeHandler は二回も実行される？
                // タイマーをクリアしたから、実行回数は一回だけなはずだが
                // 原因：スマホでresizeHandlerが実行した後、DOMの変動によってresizeイベントが引き起こされたのです
            });

            $('.photo-list').bind('json.update', o.resizePhotoList);
        };        

        return o;
    }();


    /* Controller Code */

    // スワイプコントロール（.gallery-view 中の .photo-list を動かす） 
    var swipeControl = function () {
        var o = {},
            startX = 0,
            startY = 0,
            startLeft = 0,
            nudgeTimer = null; // touchmoveイベント処理のタイマー

        function touchHandler (e) {
            var touch = e.originalEvent.touches[0] || e.originalEvent.changedTouches[0]; // jQuery eventObj fix

            // .photo-info の子要素でのイベントが防げられないようにする
            if ($(e.target).parents('.photo-info').length === 0) {
                e.preventDefault();            
            }

            // 初めての実行で、controlTypeを決める
            if (helper.controlType === 0) {
                helper.controlType = 1;
            }

            // controlTypeを確認、1ならTouch操作を処理
            if (helper.controlType === 1) {
                switch (e.type) {
                    case 'touchstart':
                        startX = touch.clientX,
                        startY = touch.clientY;
                        startLeft = -1 * helper.onPic * helper.photoItemWidth;

                        // 次のtouchmoveの時に、モーション改善のため、transitionをオフにする
                        $('.photo-list')/*.add('body')*/.removeClass('transition');
                        break;

                    case 'touchmove':
                        // touchmove でのモーション
                        helper.moveto(startLeft + touch.clientX - startX);
                        break;

                    case 'touchend':
                        // touchmoveが終わったら、transitionをオンにする
                        $('.photo-list')/*.add('body')*/.addClass('transition');

                        // helper の変数に依頼
                        // 50px 以上も移動したら、スワイプ操作だと認識される
                        if (touch.clientX - startX < -50) {
                            helper.gotoPic(helper.onPic + 1);
                        } else if (touch.clientX - startX > 50) {
                            helper.gotoPic(helper.onPic - 1);
                        } else {
                            //スワイプ操作ではない場合、タッチ操作かをチェック
                            helper.gotoPic(helper.onPic); // touchmoveの怪しい場合を修正
                            if ($(e.target).is('.photo-frame') || $(e.target).parent().is('.photo-frame')) {
                                helper.toggleDetail(helper.onPic);
                            }
                        }
                        break;
                }
            }  
        };

        o.init = function () {
            $('.gallery-view').bind('touchstart', touchHandler);
            $('.gallery-view').bind('touchmove', touchHandler);
            $('.gallery-view').bind('touchend', touchHandler);
        };

        return o;
    }();

    // マウスコントロール
    var mouseControl = function () {
        var o = {};

        o.clickHandler = function (e) {
            e.preventDefault();

            switch (e.type) {
                case 'click':
                    // 初めての実行で、controlTypeを決める
                    if (helper.controlType === 0) {
                        helper.controlType = 2;
                    }

                    // controlTypeを確認、2ならMouse操作を処理
                    if (helper.controlType === 2) {
                        if ($(e.currentTarget).parent().index() === helper.onPic) {
                            helper.toggleDetail(helper.onPic);            
                        } else {
                            helper.gotoPic($(e.currentTarget).parent().index());            
                        }
                    }

                    break;
            }
        };

        o.init = function () {
            // .photo-listに.photo-itemのclickイベントをdelegate
            $('.gallery-view').delegate('.photo-frame', 'click', o.clickHandler);
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
                $('.photo-item:last').clone(true).removeClass('on') // appendを実行するまえに、classを清掃する
                    .find('.photo-info').addClass('transparent')
                    .end()
                    .appendTo($('.photo-list'));
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
            // json.updateというイベントを引き起こす
            $('.photo-list').trigger('json.update');
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


    /* Init */

    $(function () {
        helper.init();    
        swipeControl.init();
        mouseControl.init();
        geolocation.init();
    });

})();

