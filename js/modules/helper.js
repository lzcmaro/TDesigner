
;(function(win){

    Logger = (function() {

        var that = this, name, _i, _len, _ref = ['log', 'info', 'warn', 'error'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            name = _ref[_i];
            this[name] = (function(name) {
                return function() {
                    //ie浏览器下，其console.apply支持的参数和firefox不同，这里做兼容处理
                    var args = 1 <= arguments.length ? [].slice.call(arguments, 0) : [];
                    if (that.DEBUG !== undefined && that.DEBUG === false) {
                        return;
                    }
                    try {
                        return console[name].apply(console, args);
                    } catch(e) {
                        return console[name](args);
                    }
                };
            })(name);
        }
        this.debug = this.log;

        return this

    })();

})(window)

;(function($){

    Utils = {
        /**
         * 获取string长度，中文按2个字节长度计算
         */
        getStrLength: function(a) {
            var b = 0;
            if($.trim(a)){        
               b = $.trim(a).replace(/[^\x00-\xff]/g,"##").length
            }
            return b
        },
        /**
         * 获取游览器URL中的查询参数
         * a, 参数name
         */
        getQueryParameter: function(a) {
            var c = location.href, b = "";
            c = c.replace("?", "?&").split("&");
            for (i = 1; i < c.length; i++) {
                if (c[i].indexOf(a + "=") == 0) {
                    b = c[i].replace(a + "=", "")
                }
            }
            return b
        },
        showLoading: function(target){
            var loaderSelector = "#loader",
                loaderBackSelector = "#loader-back",
                loaderTpl = '<div id="loader" class="loader"><img src="images/loading.gif"/></div><div id="loader-back" class="loader-back"></div>',
                exsitLoader = $(loaderSelector).length >= 1;

            if( target ){

                if( typeof target.html !== "function" )
                    target = $(target);

                if( exsitLoader ){
                    target.append( $(loaderSelector) ).append( $(loaderBackSelector) )
                }else{
                    target.append( loaderTpl )
                }

                $(loaderSelector).css({top: target.height() / 2 + "px"}).show(), 
                $(loaderBackSelector).show()

            }else{

                if( exsitLoader ){
                    $("body").append( $(loaderSelector) ).append( $(loaderBackSelector) )
                }else{
                    $("body").append( loaderTpl )
                }

                $(loaderSelector).css({top: $(window).height() / 2 + "px"}).show(), 
                $(loaderBackSelector).show()
            }
            
        },
        hideLoading: function(){
            $("#loader").hide(), $("#loader-back").hide()
        },
        routes: {},
        request: function(opt){
            
            if (!opt || !opt.url) return;
            
            var key = "_" + encodeURIComponent(opt.url).replace(/[\/\.%!?&=]/g, ""), 
                route = Utils.routes[key] || {};
            
            //避免重复发送请求
            if (opt.url === route.url && route.request) return;
            
            Utils.routes[key] = {url: opt.url, request: true};
            
            var loader = opt.loader === undefined ? true : opt.loader === true;           
            
            $.ajax({
                url: opt.url,
                cache: opt.cache === undefined ? false : opt.cache === true,
                type: opt.type || "get",
                data: opt.data || {},
                dataType: opt.dataType || "json",
                timeout: opt.timeout || 60000,
                async: opt.async === undefined ? true : opt.async === true,
                beforeSend: function(b) {
                    $.isFunction(opt.beforeSend) && opt.beforeSend.call(this, b),               
                    //加入loading效果
                    loader === true && Utils.showLoading(opt.loaderTarget)
                },
                success: function(b) {
                    if(b.code == "0"){
                        $.isFunction(opt.success) && opt.success.call(this, b.data)
                    }else{ //其它异常
                        alert(b.msg || "未知错误")
                    }                               
                },
                error: function(b, c, d) {
                    Logger.error("Request error.", b, c, d), $.isFunction(opt.error) && opt.error.call(this, b, c, d)
                },
                complete: function() {
                    delete Utils.routes[key],
                    setTimeout(function(){
                        loader === true && Utils.hideLoading()
                    }, 300),     
                    $.isFunction(opt.complete) && opt.complete.call(this)
                }
            });
        },
        /**
         * 判断当前坐标是否在element内
         * a, event对象
         * b, 可能坐标在其之内的对象
         */
        containsPoint: function (a, b) {
            if(!a || !b || b.length <= 0) return;
            var c = b.offset(),
                d = b.outerWidth(),
                e = b.outerHeight(),
                f = this._getCalculatedMargin(b);
            if (f[3] < 0 && f[1] < 0) {
                if (a.pageX > c.left + d + -f[1] || a.pageX < c.left + f[3] || a.pageY > c.top + e || a.pageY < c.top) return !1
            } else if (a.pageX > c.left + d || a.pageX < c.left || a.pageY > c.top + e || a.pageY < c.top) return !1;
            return !0
        },
        _getCalculatedMargin: function (a) {
            if (a) {
                var b = parseInt(a.css("marginLeft"), 10),
                    c = parseInt(a.css("paddingLeft"), 10),
                    d = parseInt(a.css("marginTop"), 10),
                    e = parseInt(a.css("paddingTop"), 10),
                    f = parseInt(a.css("marginRight"), 10),
                    g = parseInt(a.css("paddingRight"), 10),
                    h = parseInt(a.css("marginBottom"), 10),
                    i = parseInt(a.css("paddingBottom"), 10);
                return [d + e, f + g, h + i, b + c]
            }
            return [0, 0, 0, 0]
        },
        getSitePath: function() {
            if(!this._sitePath){
                var a = window.document.location.pathname, b = a.substring(0, a.substr(1).indexOf('/') + 2);
                this._sitePath = b;
            }
            return this._sitePath
        },
        preloadImages: function(el, images, callback){
            var count, image;

            count = images.length,
            //TODO：应用初始化时，预加载loading.gif？
            el.addClass("loading").html('<img src="images/loading.gif"/>');

            for (var i = 0; i < count; i++) {
                image = new Image(),
                image.onload = (function(index){
                    return function(){
                        var loadedAll, imageWidth, imageHeight;
                        // console.log( "image loaded.", this);
                        imageWidth = this.width,
                        imageHeight = this.height,
                        el.prepend( this ),
                        loadedAll = el.find("> img").length - 1 === count,
                        //这里返回当前图片的原始尺寸，方便后面获取
                        callback && callback.call( this, {width: imageWidth, height: imageHeight, index: index} ),
                        //需要等待所有图片加载完成后才去掉loading效果
                        loadedAll && el.removeClass("loading").find("img:last").remove()
                    }
                })( i ),
                image.src = images[i]
            };
        }
        
    }; 

})(jQuery)   

;(function(){
    /**
     * 距阵对象
     * 扩展canvas的imageData矩阵
     */
    ImageMatrix = function(__width, __height, __data, __buffer){  
        this.width = __width || 0;
        this.height = __height || 0;
        this.channel = 4; //通道数量RGBA
        this.buffer = __buffer || new ArrayBuffer(__height * __width * 4);
        this.data = new Uint8ClampedArray(this.buffer);
        __data && this.data.set(__data);
        this.bytes = 1; //每个数据单位占用字节，因为是uint8数据类型，所以占用字节数为1
        this.type = "CV_RGBA"; //数据类型
    };

    /**
     * 根据x, y坐标获取像素矩阵中的rgba值
     */
    ImageMatrix.prototype.rgba = function(__x, __y){
        var width = this.width,
            pixelArr = this.data,
            index = ( (width * __y) + __x ) * 4;

        return [
            pixelArr[index],
            pixelArr[index + 1],
            pixelArr[index + 2],
            pixelArr[index + 3],
            //返回当前x, y在imageData矩阵中的索引值，方便后面取值
            index
        ]
    };

    ImageMatrix.prototype.clone = function(){
        return new ImageMatrix(this.width, this.height, this.data)
    };

})()

;(function(){
    /**
     * CSS3里的transform:matrix距阵对象
     */
    Matrix = function(a, b, c, d, e, f) {
        if (a != null) {
            this.a = +a;
            this.b = +b;
            this.c = +c;
            this.d = +d;
            this.e = +e;
            this.f = +f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }

    Matrix.prototype.add = function(){
        return this
    }

    Matrix.prototype.toTransformString = function(){
        return ""
    }

})()


;(function($){

    /**
     * 重写jquery.ui.resizable的_mouseCapture()，其存在BUG
     */
    if( $.ui.resizable ){

        $.ui.resizable.prototype._mouseCapture = function(event){

            var el = this.element, handle = false;
            
            for (var i in this.handles) {
                if ( el.find(this.handles[i])[0] === event.target ) {
                    handle = true;
                }
            }

            return !this.options.disabled && handle;

        }

    } 

})(jQuery);


