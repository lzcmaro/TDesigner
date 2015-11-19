

jQuery(function($){

	Preview.load()

});


Preview = {
	load: function(){
		var that = this, productId = that._getQueryParameter( "productId" ), viewMode = this._getQueryParameter( "viewMode" );

		$.ajax({
			url: "product-update.json",
			//url: "/shop/diy_goods!view.action",
			data: {
				id: productId
			},
			dataType: "json",
			success: function(data){
				if(data.code == "0"){
					that.render( viewMode, data.data )
				}else{
					alert( data.msg )
				}
			}
		})
	},
	render: function(viewMode, data){
		var el, productData, designData, directions, directionType, d, viewer, productViewer;

		//缓存渲杂的EL
		el = this.el = $("#device");
		
		productData = this.productData = data.productData,
		designData = this.designData = data.designData,
		directions = productData.directions;
		
		//渲染全部方位下的产品视图
		for (var i = 0; i < directions.length; i++) {
			d = directions[i];
			directionType = d.type,

			viewer = $("<div/>").addClass("viewer").attr("data-direction", directionType),
			productViewer = $("<div/>").addClass("product-viewer").appendTo( viewer ),

			//渲染产品视图
			this.renderProduct( productViewer, directionType ),
			//渲染design视图
			this.renderDesign( viewer, directionType ),

			el.append( viewer )
		};


		if(viewMode === "tile"){ //平铺

			el.addClass("tile").find(".viewer").show()

		}else{
			
			//默认显示第一个面
			el.find(".viewer:first").show()

			//渲染方位选择视图
			this.renderDirectionViewer()

		}
	},
	renderProduct: function(el, directionType){
		var productData = this.productData, directions = productData.directions, d, blockImages, productViewer = $("#product-viewer"), html = '';
		
		for (var i = 0; i < directions.length; i++) {
			d = directions[i];
			if( d.type == directionType ){
				//20140227修改，数据中已没有blockImages
				// blockImages = d.blockImages;
				blockImages = this._getProductImages(productData.id, d, "400x400");

				for (var i = 0; i < blockImages.length; i++) {
					html += '<img src="' + blockImages[i] + '" class="product" />'
				};

				el.html( html );

				break;
			}
		};
	},
	renderDesign: function(el, directionType){
		var	//el = $("#device"), 
			designs = this.designData[ directionType ],
			properties,
			design,
			html = '',
			transform,
			svg,
			wapper,
			nodes,
			nodeColors,
			d;

		// el.find(".design").remove();

		for (var i = 0; i < designs.length; i++) {
			d = designs[i];
			properties = d.properties,
			design = $('<div class="design"></div>'),
			wapper = $('<div class="wapper"></div>'),
			transform = '';

			switch( d.type ){
				case 1: //svg
					svg = this._loadSVG( properties.src ),
					wapper.append( svg ).appendTo( design ),
					svg = wapper.find("svg");

					//着色svg node
					nodeColors = properties.nodeColors;
					for (var j = 0; j < nodeColors.length; j++) {
						svg.find("[id=" + nodeColors[j].nodeId + "]").css("fill", nodeColors[j].color)
					};

					//缩放SVG					
					svg.attr({
						width: properties.bbox.width,
						height: properties.bbox.height
					})
					scaleX = properties.bbox.width / properties.defaultWidth,
					scaleY = properties.bbox.height / properties.defaultHeight,
					transform = "scale(" + scaleX + "," + scaleY + ")",
					nodes = svg.children();

					//缩放svg node
					for (var j = 0; j < nodes.length; j++) {
						this._scale( $(nodes[j]), scaleX, scaleY )
					};

					break;
				case 2: //imgage
					wapper.append( '<img src="' + properties.src + '" />' ).appendTo( design ),
					wapper.find("img").css({
						width: properties.bbox.width,
						height: properties.bbox.height
					});
					break;
				case 3: //text
					design.css({
						width: properties.bbox.width,
						height: properties.bbox.height
					}).addClass("design-text"),
					wapper.append( properties.text.replace(/\&gt;/g, ">").replace(/\&lt;/g, "<") ).appendTo( design );
					break;
			}

			//翻转图形（只翻转其wapper）
			properties.flipHorizontally && this._transformHorizontally( wapper ),
			properties.flipVertically && this._transformVertically( wapper ),
			
			//旋转图形
			this._rotate( design, properties.angle ),

			//重定位图形
			design.css({
				top: properties.bbox.y,
				left: properties.bbox.x
			}).appendTo( el )
		};

		
	},
	_transformHorizontally: function(el){
		this._transform( el, "matrix(-1, 0, 0, 1, 0, 0)" )
	},
	_transformVertically: function(el){
		this._transform( el, "matrix(1, 0, 0, -1, 0, 0)" )
	},
	_transform: function(el, nTransform){
		var oTransform = el.css("transform") || $wapper.css("-o-transform") || $wapper.css("-moz-transform") || $wapper.css("-webkit-transform") || "", 
			transform;

		//如果el原来没有设置fransform样式，在firefox下取到的值为"none"
		oTransform = oTransform.replace(/none/, ""),

		transform =  oTransform + " " + nTransform;

		el.css({
			'transform': transform,
			'-o-transform': transform,
			'-moz-transform': transform,
			'-webkit-transform': transform
		});
	},
	_rotate: function(el, angle){
		var transform = " rotate(" + angle + "deg)";
		el.css({
			'transform': transform,
			'-o-transform': transform,
			'-moz-transform': transform,
			'-webkit-transform': transform
		})
	},
	_scale: function(el, scaleX, scaleY){
		var transform = "scale(" + scaleX + "," + scaleY + ")";
		el.css({
			'transform': transform,
			'-o-transform': transform,
			'-moz-transform': transform,
			'-webkit-transform': transform
		})
	},
	_loadSVG: function(url){
		var source = "";
		
		$.ajax({
			url: url,
			async: false,
			dataType: "text",
			success: function(data){
				source = data
			}
		});

		return source
	},
	renderDirectionViewer: function(){
		var that = this,
			el = $("#direction-list-container"),
			productData = this.productData, 
			directions = productData.directions,
			blockImages,
			html,
			d;

		el.delegate("li", "click", function(e){
			var $self = $(this), v = $self.attr("val");
			$self.hasClass("selected") || (
					el.find("li.selected").removeClass("selected"),
					$self.addClass("selected"),
					// that.renderProduct( v ),
					// that.renderDesign( v )
					that.el.find(".viewer").hide(),
					that.el.find(".viewer[data-direction=" + v + "]").show()
				)
			
		});

		html = '<ul>';
		for (var i = 0; i < directions.length; i++) {
			d = directions[i],
			// blockImages = d.blockImages;
			blockImages = this._getProductImages(productData.id, d, "400x400");

			html += '<li val="' + d.type + '" class="' + (i === 0 ? "selected" : "") + '">';
			for (var j = 0; j < blockImages.length; j++) {
				html += '<img src="' + blockImages[j] + '" />'
			};
			html += '</li>'
		};
		html += '</ul>';

		el.html( html )
	},
	_getProductImages: function(productId, direction, imageSize){
		var blocks = direction.blocks,
			colors,
			blockColor,
			images = [],
			basePath = "/designer/upload/product";

		for (var i = 0, blocksLength = blocks.length; i < blocksLength; i++) {

			colors = blocks[i].colors;
			blockColor = null;

			for (var j = 0; j < colors.length; j++) {
				if( colors[j].selected ){
					blockColor = colors[j].color;
					break;
				}
			};

			//取块的第一个颜色
			if(!blockColor) blockColor = colors[0].color;

			//方位下的图分为“方位图”和“块图”两种
			images.push( basePath + "/" + productId + "/" + direction.type + "-" + blocks[i].orderNo + "-" + blockColor + "-" + imageSize + ".png" )
			
		};
		
		return images
	},
	_getQueryParameter: function(a){
		var c = location.href, b = "";
        c = c.replace("?", "?&").split("&");
        for (i = 1; i < c.length; i++) {
            if (c[i].indexOf(a + "=") == 0) {
                b = c[i].replace(a + "=", "")
            }
        }
        return b
	}
};



