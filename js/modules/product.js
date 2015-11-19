Viewer = Backbone.View.extend({
	initialize: function(a, b){
		// this._id = null,
		this._name = a,
		this._template = b,
		this._data = null
	},
	render: function(a){
		var b = $("#template-viewer-" + this._template).html();
		$(this.el).html( _.template(b, a || this._getRenderData()) ),
		this.trigger("rendered")
	},
	refresh: function(){
		this.render()
	},
	_getRenderData: function(){
		return {
			cid: this.cid,
			renderData: this._data
		}
	},
    setData: function(data){
    	this._data = data
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
    getParentViewer: function(){
    	return this._parentViewer
    },
    addChildViewer: function(a){
    	this._childViewer = a,
    	a._parentViewer = this
    },
    /**
	 * 获取子视图对象，如方位下的块视图对象
	 */
	getChildViewer: function(){return this._childViewer}

}),

ProductViewer = Viewer.extend({
	el: "#product-viewer", 
	imageDatas: {},
	highlightImageDatas: {},
	initialize: function(){
		Logger.log("Initialize product viewer.");
		Viewer.prototype.initialize.call(this, "productviewer", "product"),
		this.bindEvents()
	},
	bindEvents: function(){
		var that = this, 
			$el = $(this.el),
			offset = $el.offset();

		$el.bind("mousemove", function(e){
				//Logger.log("mouseenter", e.pageX, e.pageY);
				// that.getProductType() === 2 && that._onMouseenterBlockImage( e.pageX - offset.left, e.pageY - offset.top )
			})
			.bind("click", function(e){
				//Logger.log("click", e.pageX, e.pageY);
				that.getProductType() === 2 && that._onSelectBlockImage( e.pageX - offset.left, e.pageY - offset.top )
			});
	},
	render: function(){
		Logger.log("ProductViewer render.");
		
		var data = this._data,  
			directionViewer = this.getChildViewer();

		//在渲染到画布时，因为加入了图片预加载效果，Image.onload()为异步执行，回调过程中才真正把图片写到canvas里，如果不判断当前是否已渲染完成，可能会执行多次
		this.rendering = true;
			
		// if(data.type === 1){ //普通DIY产品
			
			directionViewer || ( directionViewer = new DirectionViewer(), this.addChildViewer(directionViewer), this._bindDirectionViewerEvents() ),
			directionViewer.setData( data.directions ),
			directionViewer.render()

		// }else{			

		// }

		//在渲染产品时，其默认方位被触发click事件，所以这里不需调用renderToCanvas()，见builder._renderProductListView()
		this.renderToCanvas(), 
		this.trigger("rendered")
		
	},
	_onMouseenterBlockImage: function(offsetX, offsetY){
		//TODO
	},
	/**
	 * 选择块图
	 */
	_onSelectBlockImage: function(offsetX, offsetY){
		Logger.log("onSelectBlockImage", offsetX, offsetY);
		var that = this,
			imageDatas = this.imageDatas;

		$.each( imageDatas, function(i, n){
			
			var ctx,
				imageData,
				blockViewer,
				pixel = n.rgba( offsetX, offsetY );

			// Logger.log(i, pixel);

			//判断是否为有效像素点，即 0 < alpha < 255
			if( pixel[3] > 0 ){

				//当前鼠标划过的位置在有效像素点上，高亮当前块图
				that.lighlightBlockImage( i, n ),

				blockViewer = that.getChildViewer().getChildViewer(),

				//显示选中的块的颜色选项
				//先删除其selected样式，避免在第一次点击时不触发其选中事件，从而导致颜色选项视图不显示
				$(blockViewer.el).find("li[val=" + i + "]").removeClass("selected").trigger("click")

			}else{				
				//还原画布上的图像
				ctx = document.getElementById("canvas-" + i).getContext("2d"),
				imageData = ctx.createImageData(n.width, n.height),
				imageData.data.set( n.data ),
				ctx.putImageData( imageData, 0, 0 )
				
			}

			
		})

	},
	/**
	 * 获取高亮后的imageData矩阵数据
	 */
	_getLighlightMatrix: function(blockNo, imageMatrix){
		var imgWidth = imageMatrix.width,
			imgHeight = imageMatrix.height,
			maxAlpha = 255,
			highlightImageData = this.highlightImageDatas[blockNo],
			pixel,
			tempMatrix,
			imageData;

		if( !highlightImageData ){

			//创建新的像素矩阵对象，避免改变原来的数据
			tempMatrix = imageMatrix.clone();
			
			for( var x = 0; x < imgWidth; x++ ){
			
				for( var y = 0; y < imgHeight; y++ ){
					
					pixel = tempMatrix.rgba( x, y );
					
					//其周边像素如果为透明点的话，说明其为有效像素的边界点
					if( pixel[3] === maxAlpha && (
								//左上
								// tempMatrix.rgba( x - 1, y -1 )[3] < maxAlpha ||
								//上
								tempMatrix.rgba( x, y - 1 )[3] < maxAlpha ||
								//右上
								// tempMatrix.rgba( x + 1, y - 1 )[3] < maxAlpha ||
								//左
								tempMatrix.rgba( x - 1, y )[3] < maxAlpha ||
								//左下
								// tempMatrix.rgba( x - 1, y + 1 )[3] < maxAlpha ||
								//下
								tempMatrix.rgba( x, y + 1 )[3] < maxAlpha ||
								//右下
								// tempMatrix.rgba( x + 1, y + 1 )[3] < maxAlpha ||
								//右
								tempMatrix.rgba( x + 1, y )[3] < maxAlpha
							) ){

						//设为红色
						pixelIndex = pixel[4];
						tempMatrix.data[ pixelIndex ] = 255;
						tempMatrix.data[ pixelIndex + 1 ] = 0;
						tempMatrix.data[ pixelIndex + 2 ] = 0;
						tempMatrix.data[ pixelIndex + 3 ] = maxAlpha;
						
					}
					
				}
				
			}

			//缓存高亮的imageData
			highlightImageData = this.highlightImageDatas[blockNo] = tempMatrix

		}

		return highlightImageData

	},
	lighlightBlockImage: function(blockNo, imageMatrix){
		var ctx = document.getElementById("canvas-" + blockNo).getContext("2d"),
			imageMatrix = imageMatrix || this.imageDatas[ blockNo ],
			tempMatrix = this._getLighlightMatrix( blockNo, imageMatrix ),
			imageData = ctx.createImageData(imageMatrix.width, imageMatrix.height);

		imageData.data.set( tempMatrix.data ),
		ctx.putImageData( imageData, 0, 0 )
	},
	_bindDirectionViewerEvents: function(){
		var that = this, directionViewer = this.getChildViewer();
		directionViewer.bind("itemSelected", function(target){
			Logger.log("ProductViewer onDirectionItemSelected", target);

			//加载图片后高亮原来的选中区域，这里处理逻辑导致显示有卡顿，暂时去掉
			// var blockViewer = this.getChildViewer(), selectedBlockNo = blockViewer.getSelected().orderNo;
			// that.renderToCanvas(function(blockNo){
			// 	//画布渲染时，其图像是异步加载的，这里使用回调处理
			// 	//可能方位下存在多个块，即可能加载多个图，进行多次回调
			// 	// blockNo === selectedBlockNo && that.lighlightBlockImage( blockNo )
			// })
			
			that.renderToCanvas(),
			that.trigger("directionChanged", target.attr("val"))
		}),
		directionViewer.bind("blockChanged", function(blockNo){
			Logger.log("ProductViewer blockChanged");
			// that.renderToCanvas()
		}),
		directionViewer.bind("blockColorChanged", function(){
			Logger.log("ProductViewer blockColorChanged");
			that.renderToCanvas()
		})
	},
	_createProductCanvas: function(direction){

		var $el = $(this.el),
			tpl = '<canvas id="$id" width="400" height="400"></canvas>',
			blocks = direction.blocks;

		for (var i = 0, k = blocks.length; i < k; i++) {
			$( tpl.replace(/\$id/, "canvas-" + blocks[i].orderNo) )
				.css({
					width: 400,
					height: 400,
					position: "absolute",
					left: 0,
					top: 0
				})
				.appendTo( $el )
		};

	},
	renderToCanvas: function(callback){
		Logger.log("Render product canvas.");

		var that = this,
			img,
			direction = this.getChildViewer().getSelected(),
			productImages = window.builder.getProductImages(this._data.id, direction, "400x400");

		// Logger.log( productImages )

		//显示loader层
		// Utils.showLoading( "#main" ),
		//清除画板
		this.clearCanvas(),
		this.clearImageDatas(),
		//创建画布，每张产品图片渲染到不同画布里去，方便后面取值
		// this._createProductCanvas( direction );

		// for (var i = 0, imagesLength = productImages.length; i < imagesLength; i++) {
		// 	img = new Image();
		// 	img.onload = (function(index){
		// 		return function(){
		// 			Logger.log("image loaded.", this);
		// 			var left = 0,
		// 				top = 0,
		// 				imgWidth = 400,
		// 				imgHeight = 400,
		// 				blockNo = direction.blocks[index].orderNo,
		// 				canvas = document.getElementById("canvas-" + blockNo),
		// 				ctx = canvas.getContext("2d"),
		// 				imageData;

		// 			//在canvas上绘制图片, drawImage(image, left, top, width, height)
		// 			ctx.drawImage(this, left, top, imgWidth, imgHeight),

		// 			//缓存图片像素数据，以便后面判断区域是否被选取、划过
		// 			imageData = ctx.getImageData(left, top, imgWidth, imgHeight),
		// 			that.cacheImageData( blockNo, imageData ),
		// 			//回调里传递当前块图的orderNo，以便在后面判断是否已加载完指定图片
		// 			callback && callback( blockNo )
					
		// 		}
		// 	})(i),
		// 	img.src = productImages[i]
		// };		
		
		// setTimeout(function(){
		// 	Utils.hideLoading()
		// }, 300)

		Utils.preloadImages( $(this.el), productImages, function(o){

			var left = 0,
				top = 0,
				imgWidth = 400,
				imgHeight = 400,
				blockNo = direction.blocks[o.index].orderNo,
				canvas, //document.getElementById("canvas-" + blockNo),
				ctx,
				imageData;

			canvas = that.$("#canvas-" + blockNo),
			canvas = canvas.length === 1 ? canvas.get(0) : $('<canvas width="400" height="400"></canvas>')
				.attr("id", "canvas-" + blockNo)
				.css({
					width: 400,
					height: 400,
					position: "absolute",
					left: 0,
					top: 0
				})
				.appendTo( that.el ).get(0),
			ctx = canvas.getContext("2d"),
			//在canvas上绘制图片, drawImage(image, left, top, width, height)
			ctx.drawImage(this, left, top, imgWidth, imgHeight),

			//删除Utils.preloadImages创建的图片
			$(this).remove(),

			//缓存图片像素数据，以便后面判断区域是否被选取、划过
			imageData = ctx.getImageData(left, top, imgWidth, imgHeight),
			that.cacheImageData( blockNo, imageData ),
			//回调里传递当前块图的orderNo，以便在后面判断是否已加载完指定图片
			callback && callback( blockNo )

		} )
		
		
	},
	clearCanvas: function(){
		Logger.log("clearing canvas.");
		$(this.el).empty()		
	},
	clearImageDatas: function(){
		Logger.log("clearing image data.");
		this.imageDatas = {},
		this.highlightImageDatas = {}
	},
	/**
	 * 缓存图片像素数据，以便后面判断区域是否被选取、划过
	 */
	cacheImageData: function(blockNo, imageData){
		//imageData为canvas画布里的图形像素矩阵对象，有特殊性，不便操作，这里使用自定义的矩阵对象
		this.imageDatas[blockNo] = new ImageMatrix(imageData.width, imageData.height, imageData.data)
	},
	getProductId: function(){
		return this._data.id
	},
	getProductType: function(){
		return this._data.type
	},
	/**
	 * 获取产品图片集合
	 * @param direction 产品的方位数据
	 * @param imageSize 图片大小
	 */
	getImages: function(direction, imageSize){
		// var product = this._data, 
		// 	blocks = direction.blocks,
		// 	colors,
		// 	blockColor,
		// 	images = [];

		// for (var i = 0, blocksLength = blocks.length; i < blocksLength; i++) {

		// 	colors = blocks[i].colors;
		// 	blockColor = null;

		// 	for (var j = 0; j < colors.length; j++) {
		// 		if( colors[j].selected ){
		// 			blockColor = colors[j].color;
		// 			break;
		// 		}
		// 	};

		// 	//取块的第一个颜色
		// 	if(!blockColor) blockColor = colors[0].color;

		// 	//方位下的图分为“方位图”和“块图”两种
		// 	images.push( ProductViewer.imageBasePath + "/" + product.id + "/" + direction.type + "-" + blocks[i].orderNo + "-" + blockColor + "-" + imageSize + ".png" )

			
		// };
		
		// return images
		
	},
	/**
	 * 获取产品属性，保存时用到
	 */
	getSerializedProperties: function(){
		//保存时只需知道某方位下的某块，选了哪个颜色，至于方位下的design元素，不在这里获取
		var data = this._data, 
			directions = data.directions,
			d,
			blocks,
			b,
			colors,
			c
			//格式如：{1: [ {1: aeaeae}, {2: ffffff}, {1: ff0000}, ... ] }
			result = []

		for (var i = 0; i < directions.length; i++) {
			d = directions[i];
			blocks = d.blocks;
			//
			result.push( { type: d.type, blockImages: d.blockImages, blocks: [] } );

			for (var j = 0; j < blocks.length; j++) {
				b = blocks[j];
				colors = b.colors;
				result[i].blocks.push( {id: b.id, orderNo: b.orderNo, colors: colors} );

				// for (var k = 0; k < colors.length; k++) {
				// 	c = colors[k];

				// 	if( c.selected ){
				// 		result[i].blocks[j].color = c.color;
				// 		break;
				// 	}
				// };
				// //没有selected，默认取第一个
				// if( !result[i].blocks[j].color ) result[i].blocks[j].color = colors[0].color ;
			};
		};	

		return result
	}

}),
ProductPropertyViewer = Viewer.extend({	
	initialize: function(a, b){
		Viewer.prototype.initialize.call(this, a, b),
		// this._cacheMap = {},
		// this._cacheMapKey = "id",
		// this._selected = null,
		//这里不使用backbone的delegate，避免子类的EL相同时，可能绑定多次事件
		this.bindEvents()
	},
	bindEvents: function(){
		var that = this;
		$(this.el).undelegate("li", "click").delegate("li", "click", function(e){
			that.onItemClicked( e )
		})
	},
	/**
	 * item点击事件
	 * 改变item样式，调用onValueChanged()，触发itemSelected事件
	 */
	onItemClicked: function(e){
		var target = $(e.currentTarget);

		Logger.log("ProductPropertyViewer onItemClicked", e.currentTarget);

		e.stopPropagation();
		target.hasClass("selected") || ( this.$("li.selected").removeClass("selected"), target.addClass("selected"), this.setValue(target.attr("val")), this.onValueChanged(), this.trigger("itemSelected", target) )
	},
	/**
	 * 缓存当前对象数据的map，方便以key值获取，如方位集合
	 */
	cacheData: function(key){
		var data = this._data, d;

		if( !data || !$.isArray( data ) ) return;

		// data = $.extend([], this._data),
		//重设map
		this._cacheMap = {};

		for (var i = 0, k = data.length; i < k; i++) {
			d = data[i],
			//默认以其ID值作为KEY
			this._cacheMap[ d[ key || "id" ] ] = d
		};
	},
	setData: function(data){
		var selected, d;
		
		if( data && $.isArray(data)){

			this._data = data,

			this.cacheData( this._cacheMapKey )

			for (var i = 0, k = data.length; i < k; i++) {
				if(data[i].selected){
					selected = data[i];
					this.setSelected( selected );
					break
				}
			};

			//默认第一个选中
			selected || ( this._data[0].selected = true, this.setSelected( this._data[0] ) )

		}
		
	},
	setValue: function(a){
		Logger.log("ProductPropertyViewer setValue", a);

		var data = this._data, key = this._cacheMapKey, d;
		
		for (var i = 0, k = data.length; i < k; i++) {
			d = data[i];
			if(d[key] == a) 
				d.selected = true;
			else
				delete d.selected
		};

		this.setSelected( this.getValue( a ) )
	},
	getValue: function(a){
		return this._cacheMap[a]
	},
	setSelected: function(a){
		this._selected = a;
	},
	getSelected: function(){
		return this._selected
	},
	onValueChanged: function(){}
}),
DirectionViewer = ProductPropertyViewer.extend({
	el: "#direction-list-container",
	initialize: function(){
		Logger.log("Initialize direction viewer");
		ProductPropertyViewer.prototype.initialize.call(this, "directionviewer", "direction"),
		//这里以方位的type属性作为map的key值
		this._cacheMapKey = "type"
	},
	render: function(){
		Logger.log("DirectionViewer render.");

		var blockViewer = this.getChildViewer();

		blockViewer || ( blockViewer = new BlockViewer(), this.addChildViewer(blockViewer), this._bindBlockViewerEvents() ),
		blockViewer.setData( this.getSelected().blocks ),
		blockViewer.render(),
		this.renderDirectionViewer()
	},
	renderDirectionViewer: function(){
		var builder, productData, productImages, directions;

		Logger.log("Render direction view.");
		ProductPropertyViewer.prototype.render.call(this),

		//为图片加上预加载效果
		builder = window.builder,
		productData = this.getParentViewer().getData(),
		directions = this.getData();

		for (var i = 0; i < directions.length; i++) {
			productImages =  builder.getProductImages(productData.id, directions[i], "400x400"),
			Utils.preloadImages( this.$("li").eq( i ), productImages )
		};

	},
	/**
	 * 更新方位图片数据
	 */
	_refreshDirectionImages: function(){
		var productViewer = this.getParentViewer(),
			product = productViewer.getData(),
			directions = this._data,
			d;

		// if(product.type === 1){

			for (var i = 0, k = directions.length; i < k; i++) {
				d = directions[i];
				//获取方位图
				d.blockImages = window.builder.getProductImages(product.id, d, "400x400")
			};

		// }else{

		// }
	},
	_bindBlockViewerEvents: function(){
		var that = this, blockViewer = this.getChildViewer();
		
		blockViewer.bind("itemSelected", function(target){
			Logger.log("DirectionViewer onBlockItemSelected", target);
			
			that.trigger("blockChanged", target.attr("val")),
			//复杂DIY产品的颜色选项视图在初始化时不显示，这里主动渲染
			this.renderBlockColorViewer()
		}),
		blockViewer.bind("colorChanged", function(blockColor){
			
			Logger.log("DirectionViewer blockColorChanged", blockColor);

			that._changeOtherBlockColor( blockColor ),

			that._refreshDirectionImages(),

			that.renderDirectionViewer(),

			that.trigger("blockColorChanged");

		})
	},
	_changeOtherBlockColor: function(selectedColor){
		var	selectedBlock = this.getChildViewer().getSelected(),
			selectedBlockGroupId = selectedBlock.groupId,
			directions = this._data, 
			directionsLength = directions.length, 
			d, 
			blocks, 
			blocksLength, 
			b, 
			colors, 
			colorsLength, 
			c;
		
		for (var i = 0; i < directionsLength; i++) {

			d = directions[i], blocks = d.blocks, blocksLength = blocks.length;

			for (var j = 0; j < blocksLength; j++) {
				b = blocks[j];
				//判断当前方位下的当前块，其所属分组是否和当前选择换颜色的块的组相同
				if(b.groupId === selectedBlockGroupId){

					colors = b.colors, colorsLength = colors.length;

					//遍历当前块下的颜色列表，把相同颜色的项添加selected标识
					for (var k = 0; k < colorsLength; k++) {
						c = colors[k];
						if(c.color === selectedColor){
							c.selected = true
						}else{
							delete c.selected
						}
					};

				}
			};
		};
	},
	onValueChanged: function(){
		this.getChildViewer().setData( this.getSelected().blocks )
	}
}),
BlockViewer = ProductPropertyViewer.extend({
	el: "#block-list-container",
	initialize: function(){
		Logger.log("Initialize block viewer");
		ProductPropertyViewer.prototype.initialize.call(this, "blockviewer", "block"),
		//这里以方位的orderNo属性作为map的key值
		this._cacheMapKey = "orderNo"
	},
	render: function(){
		Logger.log("BlockViewer render.");

		var productViewer = this.getParentViewer().getParentViewer(),
			productType = productViewer.getProductType(),
			colorViewer = this.getChildViewer();

		if(productType === 1){ //普通DIY产品，显示方位（因只有一个块，可以看成是方位）颜色

			colorViewer = new DirectionColorViewer(),

			//普通的DIY产品，其方位下只有一个块
			colorViewer.setData( this.getSelected().colors )

		}else{
			//复杂DIY产品在渲染时不显示颜色选项
			colorViewer = new BlockColorViewer(),
			colorViewer.setData( null )			
		}

		this.addChildViewer(colorViewer),
		this._bindColorViewerEvents(),
		colorViewer.render(),
		this.renderBlockViewer()

	},
	renderBlockViewer: function(){
		Logger.log("Render block view.");
		ProductPropertyViewer.prototype.render.call(this)
	},
	/**
	 * 渲染块的颜色选项视图
	 * DirectionViewer里触发，因为复杂DIY产品在初始化时，不显示颜色选项视图
	 */
	renderBlockColorViewer: function(){
		var selectedBlock = this.getSelected(),
			blockColors = selectedBlock.colors,
			selectedColor,
			colorViewer = this.getChildViewer();

		// for (var i = 0, k = blockColors.length; i < k; i++) {
		// 	color = blockColors[i];
		// 	if( color.selected ){
		// 		selectedColor = color.color;
		// 		break
		// 	}
		// };

		// //默认第一个选中
		// if( !selectedColor ) blockColors[0].selected = true;

		Logger.log("BlockViewer: renderBlockColorViewer", selectedBlock, blockColors),

		colorViewer.setData( blockColors ),
		colorViewer.render()
	},
	_bindColorViewerEvents: function(){
		var that = this, colorViewer = this.getChildViewer();
		colorViewer.unbind("itemSelected").bind("itemSelected", function(target){
			Logger.log("BlockViewer onColorItemSelected", target);
			var selectedBlock = that.getSelected();
			that.renderBlockViewer(),
			that.trigger("colorChanged", target.attr("val"))
		})
	},
	onValueChanged: function(){
		this.getChildViewer().setData( this.getSelected().colors )
	}
}),
ColorViewer = ProductPropertyViewer.extend({
	el: "#color-list-container",
	initialize: function(a, b){
		ProductPropertyViewer.prototype.initialize.call(this, a, b),
		//这里以方位的color属性作为map的key值
		this._cacheMapKey = "color"
	},
	render: function(){
		Logger.log("ColorViewer render.")

		ProductPropertyViewer.prototype.render.call(this);
		//添加自定义样式，以便控制EL显示的位置
		if(this.getName() === "directioncolorviewer"){
			$(this.el).removeClass("block-color-list").addClass("direction-color-list")
		}else{
			$(this.el).removeClass("direction-color-list").addClass("block-color-list")
		}
	}
}),
DirectionColorViewer = ColorViewer.extend({
	initialize: function(){
		Logger.log("Initialize direction color viewer");
		ColorViewer.prototype.initialize.call(this, "directioncolorviewer", "color")
	}
}),
BlockColorViewer = ColorViewer.extend({
	initialize: function(){
		Logger.log("Initialize block color viewer");
		ColorViewer.prototype.initialize.call(this, "blockcolorviewer", "color")
	}
});

