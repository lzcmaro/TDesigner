
;(function($){

    /**
     * 重写jquery.ui.draggable的_mouseCapture()，以对jqeury.ui.rotate放行
     */

    var _mouseCapture;

    if( $.ui.draggable ){

        _mouseCapture = $.ui.draggable.prototype._mouseCapture;

        $.ui.draggable.prototype._mouseCapture = function(event){

            if( $(event.target).is('.ui-rotate-handle') )
                return false;

            return _mouseCapture.apply(this, arguments);

        }

    } 

})(jQuery)

/*!
 * jQuery UI Rotate 1.0.0
 *
 *
 * Depends:
 *  jquery.ui.core.js
 *  jquery.ui.mouse.js
 *  jquery.ui.widget.js
 */
;(function($, undefined){

    $.widget("ui.rotate", $.ui.mouse, {
        radian: 0,
        options: {
            handles: "ne",
            zIndex: 1000
        },
        _create: function(){
            var that = this, o = this.options, handle, hname, i, k, n;

            this.element.addClass("ui-rotate");

            this.handles = o.handles || (!$('.ui-rotate-handle', this.element).length ? "se,sw,ne,nw" : { se: '.ui-rotate-se', sw: '.ui-rotate-sw', ne: '.ui-rotate-ne', nw: '.ui-rotate-nw' });
            
            if(this.handles.constructor == String) {

                this.handles === 'all' && (this.handles = 'se,sw,ne,nw');

                n = this.handles.split(","); 

                this.handles = {};

                for(i = 0, k = n.length; i < k; i++) {

                    handle = $.trim( n[i] ), 

                    hname = 'ui-rotate-' + handle;

                    //Insert into internal handles object and append to element
                    this.handles[handle] = '.ui-rotate-' + handle;

                    $('<div class="ui-rotate-handle ' + hname + ' ui-icon"></div>')
                        .css({zIndex: o.zIndex})
                        .appendTo( this.element )
                }

            };

            // this._handles = $('.ui-rotate-handle', this.element)
            //     .disableSelection();

            // //Matching axis name
            // this._handles.mouseover(function() {
            //     var axis;
            //     if (!that.rotating) {
            //         if (this.className)
            //             axis = this.className.match(/ui-rotate-(se|sw|ne|nw)/i);
            //         //Axis, default = ne
            //         that.axis = axis && axis[1] ? axis[1] : 'ne';
            //     }
            // });

            this._mouseInit()
        },
        _destroy: function(){
            this._mouseDestroy();

            this.element
                .removeClass("ui-rotate ui-rotate-disabled ui-rotate-rotating")
                .removeData("rotate")
                .unbind(".rotate")
                .find("ui-rotate-handle").remove();

            return this
        },
        _mouseCapture: function(event) {
            var el = this.element, handle = false;
            
            for (var i in this.handles) {
                if ( el.find(this.handles[i])[0] === event.target ) {
                    handle = true;
                }
            }

            return !this.options.disabled && handle;
        },
        _mouseStart: function(event){

            var o = this.options, el = this.element, offset = el.offset(), bbox, pivot, radian;

            this.rotating = true;

            //bbox, pivot重新计算，element可能被移动、缩放
            bbox = this.bbox = {width: el.innerWidth(), height: el.innerHeight(), x: offset.left, y: offset.top};

            //旋转轴点，矩形中心
            pivot = this.pivot = {x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2};

            radian = this.radian || 0;

            //当前倾斜弧度
            this.originalRadian = radian;

            //计算角度差，鼠标位置与转轴的弧度 － 当前element倾斜的弧度
            this._diffRadian = Math.atan2( event.clientY - pivot.y, event.clientX - pivot.x ) - radian;

            //TODO: 图层可能已被翻转，需要重新计算当前角度
            
            el.addClass("ui-rotate-rotating");

            this._trigger("start", event, this.ui());

            return true
        },
        _mouseDrag: function(event){

            var el = this.element, pivot = this.pivot, radian, matrix, angle, transformCss;

            radian = this.radian = Math.atan2( event.clientY - pivot.y, event.clientX - pivot.x ) - this._diffRadian;

            matrix = this._matrix( radian );
            transformCss = "matrix(" + matrix.M11.toFixed(16) + "," + matrix.M21.toFixed(16) + "," + matrix.M12.toFixed(16) + "," + matrix.M22.toFixed(16) + ", 0, 0)";
            
            //转换为角度
            // angle = this.angle = radian * 180 / Math.PI;
            // transformCss = "rotate(" + angle + "deg)";

            el.css({
                "transform": transformCss,
                "-o-transform": transformCss,
                "-webkit-transform": transformCss,
                "-moz-transform": transformCss
            });

            // calling the user callback at the end
            this._trigger('rotate', event, this.ui());

            return false
        },
        _mouseStop: function(event){
            this.rotating = false;

            this.element.removeClass("ui-rotate-rotating");

            this._trigger("stop", event, this.ui());          

            return false
        },
        _matrix: function(radian, x, y){
            var cos = Math.cos(radian), 
                sin = Math.sin(radian),
                x = x || 1,
                y = y || 1;
            return {
                M11: cos * x, M12: -sin * y,
                M21: sin * x, M22: cos * y
            }
        },
        ui: function() {
            return {
                element: this.element,
                bbox: this.bbox,
                pivot: this.pivot,
                radian: this.radian,
                originalRadian: this.originalRadian
            };
        },
        plugins: {}
    })

})(jQuery)
