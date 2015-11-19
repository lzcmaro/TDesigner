
Builder = Backbone.View.extend({
	//在修改时，除默认显示的正面下的design外，其它方位的design需要缓存起来，在切换方位时再加载
	_designSources: {
		"1": [],
		"2": [],
		"3": [],
		"4": []
	},
	//缓存当前builder下的design对象，key值为方位标识符
	_designs: {
		"1": {},
		"2": {},
		"3": {},
		"4": {}
	},
	_views: {},
	_productViewer: null,
	initialize: function(options){
		Logger.log("Initialize builder.")
	},
	render: function(){
		Logger.log("Rendering builder.");
		
		//浏览器不支持canvas时，build.html里的canvas元素会有提示，这里不再提示相关信息
		this._checkBrowser() && (
				this._renderHeaderView(),
				this._renderProductListView(),
				this._renderDesignListView(),
				this._renderUploadView(),
				this._renderDesignPropertyView(),
				this._renderFooterView(),
				this._renderDeviceView(),
				this._init = true,
				this.trigger("inited")
			)
				
	},
	_checkBrowser: function(){
		var canvas = $("#canvas").get(0);
		return canvas.getContext
	},
	_renderHeaderView: function(){
		var that = this,
			view = this._views.headerView = new HeaderView();
		//view.render()
		view.bind("onChooseProductClicked", function(){
			Logger.log("Builder: onChooseProductClicked");
			that.hideDesignListView(),
			that.hideUploadView(),
			that.showProductListView()
		}),
		view.bind("onChooseDesignClicked", function(){
			Logger.log("Builder: onChooseDesignClicked");
			that.hideProductListView(),
			that.hideUploadView(),
			that.showDesignListView()
		}),
		view.bind("onAddTextClicked", function(){
			Logger.log("Builder: onAddTextClicked");
			that.onAddTextDesign()
		}),
		view.bind("onNewClicked", function(){
			Logger.log("Builder: onNewClicked")
		}),
		view.bind("onUploadClicked", function(){
			Logger.log("Builder: onUploadClicked");;
			that.hideProductListView(),
			that.hideDesignListView(),
			that.showUploadView()
		})
	},
	_renderProductListView: function(){
		var that = this, view = this._views.productListView = new ProductListView();
		//view.render()
		view.bind("onItemSelected", function(target, itemData){

			var directionViewer;

			Logger.log( "Builder: product selected", target, itemData );
			
			that._renderProduct( $.extend({}, itemData) ),
			//触发默认方位下的点击事件，以更新当前方位下的素材。
			//因为在切换产品时，其默认显示的是第一个方位，而切换产品前，显示的可能不是第一个方位
			directionViewer = that._productViewer.getChildViewer(),
			$(directionViewer.el).find("li:first").removeClass("selected").trigger("click")
			
		}),
		view.bind("onBoxCloseClicked", function(){
			$("#nav-container .btn").removeClass("active")
		})
	},
	_renderDesignListView: function(){
		var that = this, view = this._views.designListView = new DesignListView();
		//view.render()
		view.bind("onItemSelected", function(target, itemData){
			Logger.log( "Builder: design selected", target, itemData );
			that.addDesign( $.extend({}, itemData) )
			// that.renderDesign( itemData )
		}),
		view.bind("onBoxCloseClicked", function(){
			$("#nav-container .btn").removeClass("active")
		})
	},
	_renderUploadView: function(){
		var that = this, view = this._views.uploadView = new UploadView();
		// view.render(),
		view.bind("onItemSelected", function(target, itemData){
			Logger.log( "Builder: design selected", target, itemData );
			that.addDesign( $.extend({}, itemData) )
			// that.renderDesign( itemData )
		}),
		view.bind("onBoxCloseClicked", function(){
			$("#nav-container .btn").removeClass("active")
		})
	},
	_renderDesignPropertyView: function(){
		var that = this, view = this._views.designpropertyview = new DesignPropertyView();
		view.bind("onCenterHorizontally", function(){
			that.onCenterDesignHorizontally()
		}).bind("onCenterVertically", function(){
			that.onCenterDesignVertically()
		}).bind("onFlipHorizontally", function(){
			that.onFlipDesignHorizontally()
		}).bind("onFlipVertically", function(){
			that.onFlipDesignVertically()
		})
	},
	_renderFooterView: function(){
		var that = this, view = this._views.footerview = new FooterView();
		view.bind("onAddToBasket", function(){
			that.onAddToBasket()
		})
	},
	_renderDeviceView: function(){
		var that = this, view = this._views.deviceview = new DeviceView();

		view.bind("designSelected", function(id){
			var design;
			Logger.log("Builder: designSelected", id);

			design = that.getDesign( id ),
			design && ( 
				that.onSelectDesign( design ), 
				//design被选取后将被前置，这里需要把数据重新排序
				that._preposeDesign( id ) 
			)

		}).bind("onBodyClicked", function(){

			that.deselectAllDesign()

		}).bind("designResize", function(designId, size){

			var design = that.getDesign( designId );
			design && design.resize( size.width, size.height )

		}).bind("designRotate", function(designId, radian){
			var design, angle;

			Logger.log("Builder: designRotate", designId, radian);

			design = that.getDesign( designId );
			//design.rotate()以角度进行变换，这里要换算
			design && (angle = radian * 180 / Math.PI, design.rotate( angle ) )

		}).bind("designReposition", function(designId, position){
			var design;

			Logger.log("Builder: designReposition", designId, position);

			design = that.getDesign( designId );

			design && design.reposition(position.left, position.top)

		}).bind("designDeleted", function(designId){
			Logger.log("Builder: designDeleted", designId);

			that._removeChildDesign( designId ),
			that._updateOrderPrice(),
			that.hideDesignPropertyView()
		}).bind("oninput", function(designId, height){
			var design;
			
			Logger.log("Builder: oninput", designId);
			
			design = that.getDesign( designId );

			design && ( design.defaultHeight.setValue( height ), design.resize( design.bbox.getValue().width, height ) )
		})
	},
	getHeaderView: function(){
		return this._views.headerView
	},
	getProductListView: function(){
		return this._views.productListView
	},
	getDesignListView: function(){
		return this._views.designListView
	},
	getUploadView: function(){
		return this._views.uploadView
	},
	getDeviceView: function(){
		return this._views.deviceview
	},
	hideProductListView: function(){
		var view = this.getProductListView();
		$(view.el).hide(),
		$("#nav-container .btn.choose-product").removeClass("active")
	},
	showProductListView: function(){
		var view = this.getProductListView();
		$(view.el).css("display") === "none" && $(view.el).fadeIn("slow")
	},
	hideDesignListView: function(){
		var view = this.getDesignListView();
		$(view.el).hide(),
		$("#nav-container .btn.choose-design").removeClass("active")
	},
	showDesignListView: function(){
		var view = this.getDesignListView();
		$(view.el).css("display") === "none" && $(view.el).fadeIn("slow")
	},
	hideUploadView: function(){
		var view = this.getUploadView();
		$(view.el).hide(),
		$("#nav-container .btn.upload-photo").removeClass("active")
	},
	showUploadView: function(){
		var view = this.getUploadView();
		$(view.el).css("display") === "none" && $(view.el).fadeIn("slow")
	},
	bindProductViewerEvents: function(){
		var that = this;
		this._productViewer.bind("rendered", function(){
			Logger.log("Builder: product rendered", this);
			//重设当前方位下可设计区域大小
			that.resizePrintingArea(),
			//更新产品规格属性
			that._updateProductSpecifications(),
			//更新价格
			that._updateOrderPrice()
		}).bind("directionChanged", function(direction){
			Logger.log("Builder: direction changed", direction);

			//重设当前方位下可设计区域大小
			that.resizePrintingArea(),

			//TODO: 加载当前方位下的design
			that.deselectAllDesign(),
			that.clearAllDesign(),
			//初始化当前放位下的design
			that.initDirectionDesigns( direction )

		})
	},
	_renderProduct: function(renderData){
		Logger.log("Builder: rendering product", renderData);
		var productViewer = this._productViewer;
		productViewer || ( productViewer = this._productViewer = new ProductViewer(), this.bindProductViewerEvents() ),
		productViewer.setData( $.extend(!0, {}, renderData) ),
		productViewer.render()
	},
	addDesign: function(renderData){
		Logger.log("Builder: adding design", renderData);
		var designType = renderData.type,
			productViewer = this._productViewer,
			design,
			printingArea,
			areaWidth,
			areaHeight,
			bbox,
			imageSize,
			scale;

		if(productViewer){

			if(designType === 1){ //svg

				design = new SVGDesign()

			}else if(designType === 2){ //image

				design = new ImageDesign()

			}else{ //text
				design = new TextDesign()
			}

			//初始化design属性
			design.initFromSerialized( renderData ),
			bbox = design.bbox.getValue();

			//新创建的design，按比例缩放并居中对齐于打印区域
			if( bbox.x === 0 && bbox.y === 0 ){ //x, y为0时，代表该design是新创建的

				//按比例缩放design，并居中对齐
				printingArea = this._getPrintingArea(),
				areaWidth = printingArea.width,
				areaHeight = printingArea.height,
				imageSize = design.getSize(),
				bbox = {
					x: 0,
					y: 0,
					width: imageSize.width,
					height: imageSize.height
				},
				scale = bbox.width / bbox.height;

				//重设design大小
				if( bbox.width >= areaWidth ){

					bbox.width = areaWidth - 30,
					bbox.height = bbox.width / scale

				}

				//重设宽度后，其高度可能依然高出设计区域
				if(bbox.height >= areaHeight ){

					bbox.height = areaHeight * 3 / 2,
					bbox.width = bbox.height * scale

				}

				//重设design位置
				bbox.x = printingArea.x + ( areaWidth - bbox.width ) / 2,
				bbox.y = printingArea.y + ( areaHeight - bbox.height ) / 2;

				//设置design的bbox值，其在render时，bbox的值决定其大小、位置
				design.bbox.setValue( bbox )			

			}

			this._addDesign( design )		

		}
			
	},
	onAddTextDesign: function(){
		var productViewer = this._productViewer,
			productData = productViewer.getData(), 
			data;

		//构造design所需的data数据
		data = {
			id: "",//
			type: 3,
			properties: {
				price: productData.customTextPrice || 0//字体价格由产品规定，不管其字体大小、个数
			}
		},
		this.addDesign( data )
	},
	_addDesign: function(design){
		this.getDeviceView().addDesign( design ),
		this.bindAddedDesignEvents( design ),
		this.onSelectDesign( design ),
		this._addChildDesign( design ),
		this._updateOrderPrice()
	},
	onSelectDesign: function(design){
		this._selectedDesign = design,
		this.showPrintingArea(),
		this.getDeviceView().selectDesign( design ),
		this.showPropertyViewForDesign( design )
	},
	_preposeDesign: function(designId){
		var designs = this._designs[ this._getCurrentDirection().type ],
			tmp = designs[designId];

		//最后添加的无素，在最后渲染，即前置了
		delete designs[designId];
		designs[designId] = tmp;
	},
	showPropertyViewForDesign: function(design){
		var view = this._views.designpropertyview;
		this.hideDesignPropertyView(),
		view.renderForDesign( design ),
		view.onAttach(),
		this.showDesingPropertyView()
	},
	showDesingPropertyView: function(){
		$("#design-property-view").show()
	},
	hideDesignPropertyView: function(){
		$("#design-property-view").hide()
	},
	deselectAllDesign: function(){
		this._selectedDesign = null,
		this.hidePrintingArea(),
		this.hideDesignPropertyView(),
		this.getDeviceView().deselectAllDesign()
	},
	_addChildDesign: function(design){
		var direction = this._getCurrentDirection();
		this._designs[direction.type][design._id] = design
	},
	_removeChildDesign: function(designId){
		var direction = this._getCurrentDirection();
		delete this._designs[direction.type][designId]
	},
	getDesign: function(id){
		var direction = this._getCurrentDirection();
		return this._designs[direction.type][id]
	},
	clearAllDesign: function(){
		this.getDeviceView().clearAllDesign()
	},
	initDirectionDesigns: function(direction){
		var deviceview, designs, designSources;
		Logger.log("Builder: initDirectionDesigns");
		
		deviceview = this.getDeviceView(),
		designs = this._designs[direction],
		designSources = this._designSources[direction || 1];

		$.each(designs, function(i, n){
			deviceview.addDesign( n )
		});

		if( designSources ){
			for (var i = 0; i < designSources.length; i++) {
				this.addDesign( designSources[i] )
			};
			delete this._designSources[direction]
		}

	},
	bindAddedDesignEvents: function(design){
		var that = this;			

		design.bind("designUpdated", function(){
			Logger.log("Builder: designUpdated", this.getId());
			// that._views.designpropertyview.refresh()
		}),
		design.bind("propertyChanged", function(a, b, c){
			Logger.log("Builder: propertyChanged", this.getId(), a, b, c)
		})
	},
	_getCurrentDirection: function(){
		var directionViewer = this._productViewer.getChildViewer();
		return directionViewer.getSelected()
	},
	_getPrintingArea: function(){
		var direction = this._getCurrentDirection(),
			printingArea = direction.printingArea;
		return printingArea
	},
	resizePrintingArea: function(){
		var printingArea = this._getPrintingArea();
		$("#printing-area").css({
			top: printingArea.y,
			left: printingArea.x,
			width: printingArea.width,
			height: printingArea.height
		})
	},
	showPrintingArea: function(){
		Logger.log("Builder: show printingArea");
		this.resizePrintingArea(),
		$("#printing-area").show()
	},
	hidePrintingArea: function(){
		Logger.log("Builder: hide printingArea");
		$("#printing-area").hide()
	},
	onCenterDesignHorizontally: function(){
		var design = this._selectedDesign, printingArea, designBBox, x;
		
		if(!design) return;
		
		Logger.log("Builder: onCenterDesignHorizontally", design.getId());

		printingArea = this._getPrintingArea(),
		designBBox = design.bbox.getValue(),
		//重设其x坐标，水平居中
		x = printingArea.x + ( printingArea.width - designBBox.width ) / 2,
		design.reposition(x, designBBox.y)
	},
	onCenterDesignVertically: function(){
		var design = this._selectedDesign, printingArea, designBBox, y;
		
		if(!design) return;
		
		Logger.log("Builder: onCenterDesignHorizontally", design.getId());

		printingArea = this._getPrintingArea(),
		designBBox = design.bbox.getValue(),
		//重设其y坐标，垂直居中
		y = printingArea.y + ( printingArea.height - designBBox.height ) / 2,
		design.reposition(designBBox.x, y)
	},
	onFlipDesignHorizontally: function(){
		var design = this._selectedDesign;
		
		if(!design) return;
		
		Logger.log("Builder: onFlipDesignHorizontally", design.getId());

		design.transformHorizontally()
	},
	onFlipDesignVertically: function(){
		var design = this._selectedDesign;
		
		if(!design) return;
		
		Logger.log("Builder: onFlipDesignVertically", design.getId());

		design.transformVertically()
	},
	initProductImages: function(product){
		var directions = product.directions, d;

		//向数据写入方位图片路径
		for (var j = 0, l = directions.length; j < l; j++) {
			d = directions[j];
			//获取方位图
			d.blockImages = this.getProductImages(product.id, d, "400x400")
		}
	},
	getProductImages: function(productId, direction, imageSize){
		var blocks = direction.blocks,
			colors,
			blockColor,
			images = [],
			basePath = Utils.getSitePath() + "upload/product";

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
	loadApp: function(){
		var that = this,
			oper = Utils.getQueryParameter("oper"),
			productId,
			designId;
		
		Logger.log("Builder: loadApp");

		if(oper === "new"){//新增

			productId = Utils.getQueryParameter("productId"),
			designId = Utils.getQueryParameter("designId");
			
			this.renderProduct(productId, function(){
				that._renderDesign( designId )
			})

		}else if(oper === "update"){//修改
			
			productId = Utils.getQueryParameter("productId");

			Utils.request({
				url: Utils.getSitePath() + "js/product-update.json",
				data: {
					productId: productId
				},
				success: function(data){
					var currentDirection, designs;

					that._renderProduct( data.productData ),
					currentDirection = that._getCurrentDirection().type,
					designs = data.designData[currentDirection];

					//渲染当前方位下的design
					for (var i = 0; i < designs.length; i++) {
						that.addDesign( designs[i] )
					};

					//缓存其它方位下的design，以便在切换方位时，加载该方位下的design
					delete data.designData[currentDirection],
					$.extend(that._designSources, data.designData)
					
				}
			})


		}else{
			//默认加载产品列表里的第一个？？？
			this._renderDefaultProduct()
		}
	},
	_renderDefaultProduct: function(){
		var productListView = this.getProductListView();
		$(productListView.el).find(".list-container li:first").trigger("click")
	},
	renderProduct: function(productId, callback){
		var that = this;

		if( productId ){

			Utils.request({
				url: "/shop/diy_goods!queryDiyGoodsById.action",
				// url: "/designer/js/product.json",
				data: {
					id: productId
				},
				success: function(data){
					//初始化产品图片
					// that.initProductImages( data ),
					that._renderProduct( $.extend({}, data) ),
					callback && callback()
				}
			})

		}else{
			this._renderDefaultProduct(),
			callback && callback()
		}
			
	},
	_renderDesign: function(designId){
		var that = this;

		if( !designId ) return;

		Utils.request({
			url: "/shop/materials!queryMaterialById.action",
			data: {
				id: designId
			},
			success: function(data){
				that.addDesign( data )
			}
		})
	},
	onAddToBasket: function(){
		var a = parent.jQuery;

		Logger.log("Builder: onAddToBasket");

		if( !this._productViewer ) return;
		
		if(a && !a.memberVerify()){
		 	a.showLoginWindow();
		 	return;
		}
		
		this.saveApp(function(data){
			a && a.showCartInfo(data);
		})
	},
	saveApp: function(callback){
		var productData = this._getProductData(),
			designData = this._getDesignData();

		Utils.request({
			url: "/shop/diy_goods!addBasket.action",
			data: {
				productData: JSON.stringify( productData ),
				designData: JSON.stringify( designData ),
				quantity: $("#product-quantity").val()
			},
			type: "post",
			success: function(data){ 
				callback && callback(data)
			}
		})
	},
	_getProductData: function(){
		var productData = $.extend({}, this._productViewer.getData());
		//更新产品的规格属性
		productData.specifications = this._getSelectedSpecifications();
		return productData
	},
	_getDesignData: function(){
		var designs = this._designs, designData = {};
		$.each(designs, function(i, n){
			designData[i] = [];
			$.each(n, function(j, d){
				designData[i].push( {
					id: d.getData().id, //原designId
					type: d.getData().type,
					properties: d.getSerializedProperties()
				} )
			})
		})
		return designData
	},
	_updateOrderPrice: function(){
		var productViewer = this._productViewer, 
			designs = this._designs,
			orderPrice = 0,
			productPrice = productViewer.getData().price,
			designType,
			designPrice = 0,
			hasText;

		Logger.log("Builder: _updateOrderPrice");

		orderPrice += productPrice;

		$.each(designs, function(i, n){
			//text 价格由product决定，每个方位下都要重新计算，与数量、字符数无关
			hasText = false;

			$.each(n, function(j, m){
				designPrice = 0,
				designType = m.getData().type;
				switch(designType){
					case 1: //svg
					case 2: //image
						designPrice = m.price.getValue();
						break;
					case 3: //text 价格由product决定，与数量、字符数无关
						hasText || ( designPrice = m.price.getValue(), hasText = true );
						break;
				}
				orderPrice += designPrice;
				// orderPrice += m.price.getValue()
			})
		})

		$("#order-price").text( orderPrice.toFixed(2) )
	},
	_updateProductSpecifications: function(){
		var wapper = $("#footer .product-specifications"),
			specifications = this._productViewer.getData().specifications,
			tpl = '<div><div class="left spe-name"></div><select></select></div>',
			values;

		wapper.html("");

		$.each(specifications, function(i, n){
			var $el = $(tpl), $sel = $el.find("select"), values = n.values, html = '';
			
			$el.attr("sid", n.id).find("div.spe-name").html( n.name + ":" );

			for (var j = 0; j < values.length; j++) {
				if( values[j] == n.value ){
					html += '<option value=' + values[j] + ' selected="selected">' + values[j] + '</option>'
				}else{
					html += '<option value=' + values[j] + '>' + values[j] + '</option>'
				}				
			};

			$sel.attr("id", "sel" + n.id)
				.html( html )
				.data( "data-options", n )
				.filterSelector({
					width: 80,
					header: false,
					multiple: false
				}),
			$el.appendTo( wapper )

		})

	},
	_getSelectedSpecifications: function(){
		var wapper = $("#footer .product-specifications"), specifications = [];

		wapper.find("> div").each(function(i, n){
			var $n = $(n), $sel = $n.find("select");
			//构造下拉框原来的数据，以便在修改进来时可以初始化下拉框选项
			specifications.push( $.extend( {}, $sel.data("data-options"), {value: $sel.getSelectedValue()} ) )
		});

		return specifications
	},
	isInited: function(){
		return this._init
	}

});

