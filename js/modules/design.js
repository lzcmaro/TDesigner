Design = Backbone.View.extend({
	initialize: function(a, b, c){
		this._id = "design-" + b + "-" + this._getRandomNumber(),
		this._name = a,
		this._type = b,
		this._template = c,
		this._properties = {},
		this._wapperTpl = '<div class="design-wapper"></div>',
		this._initDefaultProperties()
	},
	_getRandomNumber: function(){
		return parseInt(Math.random() * 10000000000 + 1, 10)
	},
	_initDefaultProperties: function(){
		this.title = new ScalarProperty("title", new NullWidget, ""),
		this.addProperty("title", this.title, {pos: -1}),

		this.des = new ScalarProperty("description", new NullWidget, ""),
		this.addProperty("des", this.des, {pos: -1}),

		this.price = new ScalarProperty("price", new NullWidget, 0),
		this.addProperty("price", this.price, {pos: -1}),

		this.designer = new ScalarProperty("designer", new NullWidget, ""),
		this.addProperty("designer", this.designer, {pos: -1}),

		this.src = new ScalarProperty("src", new NullWidget, ""),
		this.addProperty("src", this.src, {pos: -1}),

		this.defaultWidth = new ScalarProperty("defaultWidth", new NullWidget, 0),
		this.addProperty("defaultWidth", this.defaultWidth, {pos: -1}),

		this.defaultHeight = new ScalarProperty("defaultHeight", new NullWidget, 0),
		this.addProperty("defaultHeight", this.defaultHeight, {pos: -1}),

		this.bbox = new ScalarProperty("bbox", new NullWidget, {
			width: 0,
			height: 0,
			x: 0,
			y: 0
		}),
		this.addProperty("bbox", this.bbox, {pos: -1}),

		this.angle = new ScalarProperty("倾斜角度", new NullWidget, 0),
		this.addProperty("angle", this.angle, {pos: -1}),

		this.flipHorizontally = new ScalarProperty("水平翻转", new NullWidget, 0),
		this.addProperty("flipHorizontally", this.flipHorizontally, {pos: -1}),

		this.flipVertically = new ScalarProperty("垂直翻转", new NullWidget, 0),
		this.addProperty("flipVertically", this.flipVertically, {pos: -1})

	},
	/**
	 * a, key
	 * b, Property Object
	 * c, other value
	 */
	addProperty: function (a, b, c) {
        this._properties[a] = {},
        $.extend(this._properties[a], {
            property: b
        }, c);
        var d = this;
        //绑定Property的changed事件（由它的widget触发）
        b.bind("propertyChanged", function (a, b, c, e) {
           d.onPropertyChanged(a, b, c, e)
        })
    },
    getProperties: function () {
        return this._properties
    },
	getSerializedProperties: function() {
		var a = {};
		for (var b in this._properties) {
			var c = this._properties[b].property;
			a[b] = c.getValue()
		}
		return a
	},
	//获取排序（由它的pos进行排序）后属性集合
    getPropertiesSorted: function () {
        return this._sortProperties()
    },
	_sortProperties: function () {
        var a = [];

        for (var b in this._properties) 
        	a.push($.extend({propertyName: b}, this._properties[b]));

        var c = a.sort(function (a, b) {
            if (a.pos > b.pos) return 1;
            if (a.pos === b.pos) return 0;
            if (a.pos < b.pos) return -1
        });
        return c
    },
    initFromSerialized: function (a) {
    	this._data = {id: a.id, type: a.type},
        // this.setId(a.id),
        this.initFromSerializedProperties(a.properties)
    },
    //初始化控件的属性集合
    initFromSerializedProperties: function (a) {
        if (!a) return;
        for (var b in a) {
            var c = this._properties[b];
            c && c.property.setValue(a[b])
        }
    },
    /**
     * 属性值发生变更
     * a, 属性对象
     * b, 属性原来的值
     * c, 属性变更后的值
     * d, 当属性类型为ArrayProperty时，可能它为true。用来标识是否需重新渲染PropertyView
     */
    onPropertyChanged: function (a, b, c, d) {
        Logger.log("Design: property changed: ", this.getId(), a.getName(), b, c, d);
        this.trigger("propertyChanged", a, b, c),
        this.trigger("designUpdated", this, d)
    },
	render: function(a){
		var b = $("#template-design-" + this._template).html();

		Logger.log("Design: rendering");

		this.el = $( _.template( b, this._getRenderData() ) ).appendTo( a ),
		this.trigger("rendered")
	},
	refresh: function(a){
		this.render(a)
	},
	_getRenderData: function(){
		return {
			__id: this._id,
			renderData: this._data
		}
	},
	setId: function(a){
		this._id = a
	},
	getId: function(){
		return this._id
	},
    getData: function(){
    	return this._data
    },
    setName: function(a){
    	this._name = a
    },
    getName: function(){
    	return this._name
    },
    rotate: function(angle){
    	
    	this._rotate(angle),
		this.angle.setValue( angle )
    },
    _rotate: function(angle){
    	var transformCss = "rotate(" + angle + "deg)";
    	
    	Logger.log("Design: rotate", angle);

    	this.el.css({
    		"transform": transformCss,
			"-o-transform": transformCss,
            "-moz-transform": transformCss,
            "-webkit-transform": transformCss
		});
    },
    reposition: function(x, y){
    	this._reposition(x, y),
		this.bbox.setValue( $.extend( this.bbox.getValue(), {x: x, y: y} ) )
    },
    _reposition: function(x, y){
    	Logger.log("Design: reposition", this.getId(), x, y);
    	this.el.css({
			left: x,
			top: y
		});
    },
	resize: function(width, height){
		this._resize(width, height),
		this.bbox.setValue( $.extend( this.bbox.getValue(), {width: width, height: height} ) )
	},
	_resize: function(width, height){
		$(this.el).css({
			width: width,
			height: height
		});
	},
	transformHorizontally: function(){
		var flipHorizontally = this.flipHorizontally.getValue();
		
		this._transformHorizontally(),
		this.flipHorizontally.setValue( !flipHorizontally )
	},
	transformVertically: function(){
		var flipVertically = this.flipVertically.getValue();
		
		this._transformVertically(),
		this.flipVertically.setValue( !flipVertically )
	},
	_transformHorizontally: function(){
		this._transform( "matrix(-1, 0, 0, 1, 0, 0)" )
	},
	_transformVertically: function(){
		this._transform( "matrix(1, 0, 0, -1, 0, 0)" )
	},
	_transform: function(nTransform){
		var $el = $(this.el), 
			$wapper = $el.find("> .design-wapper"),
			oTransform = $wapper.css("transform") || $wapper.css("-o-transform") || $wapper.css("-moz-transform") || $wapper.css("-webkit-transform") || "", 
			transform;

		//如果el原来没有设置fransform样式，在firefox下取到的值为"none"
		oTransform = oTransform.replace(/none/, ""),

		transform =  oTransform + " " + nTransform;

		//这里只翻转SVG wapper层，避免影响旋转等操作
		$wapper.css({
			'transform': transform,
			'-o-transform': transform,
			'-moz-transform': transform,
			'-webkit-transform': transform
		});
	},
    getSize: function(){
    	return {width: this.defaultWidth.getValue(), height: this.defaultHeight.getValue()}
    }
}),
SVGDesign = Design.extend({
	initialize: function(){
		Logger.log("initialize svgdesign");
		Design.prototype.initialize.call(this, "svgdesign", "svg", "svg");
	},
	/**
	 * 获取其SVG串后手动创建页面SVG DOM，以便后面着色
	 */
	render: function(destination){
		var data = this._data,
			bbox = this.bbox.getValue(),
			tpl = '<div class="design design-svg"></div>',
			wapper;

		Logger.log("SVGDesign: rendering", this);

		this.el = $(tpl).attr("id", this.getId()).appendTo( destination ),
		//加多一个包装层，在进行图片翻转时用上
		wapper = $(this._wapperTpl).appendTo( this.el ),

		wapper.append( this._loadSVG() ),

		this._resize( bbox.width, bbox.height ),
		this._rotate( this.angle.getValue() ),
		this._reposition( bbox.x, bbox.y ),
		this.flipHorizontally.getValue() && this._transformHorizontally(),
		this.flipVertically.getValue() && this._transformVertically(),
		//解析SVG图中可变换颜色的块
		this.inited ? this.fillNodeColor() : ( this._initColorProperties( this.el.find("svg") ), this.inited = true ),

		this.trigger("rendered")

	},
	_loadSVG: function(){
		var source = "";
		
		$.ajax({
			url: this.src.getValue(),
			async: false,
			dataType: "text",
			success: function(data){
				Logger.log("SVGDesign: load svg success");
				source = data

			}
		});

		return source
	},
	_resize: function(width, height){
		var el = this.el, svg = el.find("svg"), children, node, nodeName, defaultSize, scaleX, scaleY, transformCss;
		
		this.el.css({
			width: width,
			height: height
		});
		
		svg.attr({width: width, height: height}),

		defaultSize = this.getSize(),
		scaleX = width / defaultSize.width,
		scaleY = height / defaultSize.height,
		transformCss = "scale(" + scaleX + "," + scaleY + ")",
		children = svg.children();

		//缩放svg node
		for (var i = 0; i < children.length; i++) {
			// node = children[i];
			// nodeName = node.nodeName;
			$(children[i])
				.css({
					'transform': transformCss,
					'-o-transform': transformCss,
					'-moz-transform': transformCss,
					'-webkit-transform': transformCss
				})
				.attr({width: width, height: height})
		};

	},
	_rgb2hex: function(rgb){
		if(!rgb) return "";

		rgb = rgb.toLowerCase();

		if(/^rgb\(.+\)/.test(rgb)){
			rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
			
			rgb = "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
			return rgb
		}else if(/#[a-f0-9]{6}/.test(rgb)){
			return rgb
		}

		function hex(x) {
			return ( "0" + parseInt(x).toString(16) ).slice(-2)
		}

		return ""
	},
	_initColorProperties: function(node){
		var that = this,
			children = node.children(), 
			nodeId, 
			fillColor,
			itemValue;

		for (var i = 0, k = children.length; i < k; i++) {
			this._initColorProperties( $(children[i]) )
		};

		// Logger.log("SVGDesign: ", node, node.attr("change-color") );

		if( node.attr("change-color") == "1" ){
			
			nodeId = node.attr("id");
			//在firefox, chrome下获取的fill为rgb()形式表示，需转换为hex
			fillColor = this._rgb2hex( node.css("fill") ) || "#000000";
			itemValue = {
				color: fillColor,
				nodeId: nodeId
			};

			if(!this.nodeColors){

				this.nodeColors = new ArrayProperty("nodeColors", new ColorWidget, [$.extend( {}, itemValue, {selected: true} )]), 
				this.addProperty("nodeColors", this.nodeColors, {pos: 1}),

				//
				this.nodeColors.bind("itemChanged", function(a, b){
					Logger.log("SVGDesign: itemChanged", a, b);
					that._fillNodeColor(a.nodeId, a.color)
				})

			}else{
				this.nodeColors.addItem( itemValue )

			}

		}		

	},
	/**
	 * 填充SVG node颜色
	 */
	fillNodeColor: function(){
		var nodeColors = this.nodeColors, d;

		if(nodeColors){
			nodeColors = nodeColors.getValue();
			for (var i = 0; i < nodeColors.length; i++) {
				d = nodeColors[i];
				this._fillNodeColor(d.nodeId, d.color)
			};
		}

	},
	_fillNodeColor: function(nodeId, color){
		var svg, node;

		svg = $(this.el).find("svg"),
		node = svg.find("[id=" + nodeId + "]"),
		node.css("fill", color)
		
	}
}),
ImageDesign = Design.extend({
	initialize: function(){
		Logger.log("initialize imagedesign");
		Design.prototype.initialize.call(this, "imagedesign", "image", "image")
	},
	render: function(destination){
		var data = this._data,
			bbox = this.bbox.getValue(),
			tpl = '<div class="design design-image"></div>',
			// imageTpl = '<img />',
			wapper;

		this.el = $(tpl).attr("id", this.getId()).appendTo( destination ),
		wapper = $(this._wapperTpl).append("<img/>").appendTo( this.el ),
		wapper.find(">img").attr("src", this.src.getValue()),

		this._resize( bbox.width, bbox.height ),
		this._rotate( this.angle.getValue() ),
		this._reposition( bbox.x, bbox.y ),
		this.flipHorizontally.getValue() && this._transformHorizontally(),
		this.flipVertically.getValue() && this._transformVertically(),

		this.trigger("rendered")

	},
	_resize: function(width, height){
		this.el.css({
			width: width,
			height: height
		}).find("img").attr({width: width, height: height})
	}
}),
TextDesign = Design.extend({
	initialize: function(){
		Logger.log("initialize textdesign");
		Design.prototype.initialize.call(this, "textdesign", "text", "text");

		this.text = new ScalarProperty("text", new TextEditorWidget, TextDesign.DEFAULT_TEXT),
		this.addProperty("text", this.text, {pos: 1})
	},
	render: function(destination){
		var data = this._data,
			bbox = this.bbox.getValue(),
			tpl = '<div class="design design-text"></div>',
			wapper,
			draw;

		this.el = $(tpl).attr("id", this.getId()).appendTo( destination ),
		$(this._wapperTpl).append( this.text.getValue() ).appendTo( this.el ),

		this._resize( bbox.width, bbox.height ),
		this._rotate( this.angle.getValue() ),
		this._reposition( bbox.x, bbox.y ),
		this.flipHorizontally.getValue() && this._transformHorizontally(),
		this.flipVertically.getValue() && this._transformVertically(),

		this.trigger("rendered")

	},
	getSize: function(){
		return {width: this.defaultWidth.getValue() || 120, height: this.defaultHeight.getValue() || 14}
	},
	_resize: function(width, height){
		var defaultSize, scaleX, scaleY, transformCss;

		//只改变其宽度，文字自动换行，高度自适应
		this.el.css({
			width: width,
			height: "auto"
		})
	},
	/**
     * 属性值发生变更
     * a, 属性对象
     * b, 属性原来的值
     * c, 属性变更后的值
     * d, 当属性类型为ArrayProperty时，可能它为true。用来标识是否需重新渲染PropertyView
     */
    onPropertyChanged: function (a, b, c, d) {
    	var text;

        text = this.text.getValue().replace(/\n/g, "").replace(/<[^>]+>/g, "");

        this.$(".design-wapper").html( text === "" ? TextDesign.DEFAULT_TEXT : this.text.getValue() ),

        Design.prototype.onPropertyChanged.call(this, a, b, c, d)
    }
}, {
	DEFAULT_TEXT: "<p>Write your text here</p>"
});

