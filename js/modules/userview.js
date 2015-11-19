
UserView = Backbone.View.extend({
	initialize: function(a){
		this._name = a
	}
}),

HeaderView = UserView.extend({
	el: "#header",
	initialize: function(){
		Logger.log("Initialize headerview"),
		UserView.prototype.initialize.call(this, "headerview")
	},
	events: {
		"click a.choose-product": "onChooseProductClicked",
		"click .choose-design": "onChooseDesignClicked",
		"click .add-text": "onAddTextClicked",
		"click .new": "onNewClicked",
		"click .upload-photo": "onUploadClicked"
	},
	onChooseProductClicked: function(e){
		var target = $(e.currentTarget);
		target.hasClass("active") || (
				target.addClass("active"),
				this.trigger("onChooseProductClicked")
			)
	},
	onChooseDesignClicked: function(e){
		var target = $(e.currentTarget);
		target.hasClass("active") || (
				target.addClass("active"),
				this.trigger("onChooseDesignClicked")
			)
	},
	onAddTextClicked: function(){
		this.trigger("onAddTextClicked")
	},
	onNewClicked: function(){
		this.trigger("onNewClicked")
	},
	onUploadClicked: function(e){
		var target = $(e.currentTarget);
		target.hasClass("active") || (
				target.addClass("active"),
				this.trigger("onUploadClicked")
			)
	}
}),

ListView = UserView.extend({
	initialize: function(a){
		UserView.prototype.initialize.call(this, a),
		this._data = {},
		this._pageSize = 25,
		this.listContainer = this.$(".list-container"),
		this.preview = $("#preview"),
		this.initUI(),
		this.loadListData()
	},
	events: {
		"click .box-close": "onBoxCloseClicked",
		"click .list li": "onItemClicked",
		"mouseenter .list li": "onItemMouseenter"
	},
	onBoxCloseClicked: function(e){
		e.stopPropagation(),
		$(this.el).fadeOut("slow"),
		this.trigger("onBoxCloseClicked")
	},
	onItemClicked: function(e){
		var item = $(e.currentTarget);

		e.stopPropagation(),

		//design可添加多个，需再次触发其选中事件
		$(this.el).hasClass("product-listview") && item.hasClass("selected") || (
				this.selectedItem && this.selectedItem.removeClass("selected"),
				item.addClass("selected"),
				this.selectedItem = item,
				this.trigger("onItemSelected", item, this.getItemData( item.index() ))
			)
	},
	onItemMouseenter: function(e){
		var that = this,
			highlightSelector = this.highlightSelector || this._makeHighlight(),
			target = $(e.currentTarget),
			position = target.position();
		
		e.stopPropagation();

		// if( target.hasClass("loading") ) return;

		//缓存当前ITEM并重定位高亮层的显示位置
		highlightSelector
			.css({
				top: position.top - 5,
				left: position.left - 5
			})
			.data("data-target", target)
			.html( target.html() )
			.show()
		
	},
	_makeHighlight: function(){
		//绑定的move事件用其name来定义，避免事件冲突（ListView有多个子类）
		var	eventName = "mousemove." + this._name;

		this.highlightSelector = $("<div/>")
			.addClass("highlightSelector")
			//高亮层点击事件，触发当前ITEM点击事件
			.bind("click", function(e){
				e.stopPropagation(),
				$(this).data("data-target").trigger("click")
			})
			// .bind("mouseleave", this, function(e){
			// 	$(document).unbind("mousemove.listview"),
			// 	$(this).hide(),
			// 	e.data.preview.hide()
			// })
			.appendTo(this.el);

		//如果鼠标快速划过，可能没有触发highlightSelector的mouseleave事件，这里在mousemove里处理，避免preview没有自动隐藏的问题
		$(document).unbind(eventName).bind(eventName, this, function(e){
			var listView = e.data,
				highlightSelector = listView.highlightSelector;

			highlightSelector.css("display") !== "none" && !Utils.containsPoint(e, highlightSelector) && (
					highlightSelector.hide(),
					listView.preview.hide()
				)
			 	
		});

		return this.highlightSelector

	},
	getItemData: function(index){
		return this._data[this.pagebar.currentPage][index]
	},
	cachePageData: function(pageData){
		this._data[this.pagebar.currentPage] = pageData
	},
	initUI: function(){
		var that = this;

		this.categorySelector = this.$("select.category").filterSelector({
			width: 238,
			header: false,
			multiple: false,
			noneSelectedText: "Select Category",
			change: function(e){				
				that._onSelectorChanged( $(this).getSelectedValue() ),
				that.loadSubCategory()
			}
		}),

		this.subCategorySelector = this.$("select.sub-category").filterSelector({
			width: 208,
			header: false,
			multiple: false,
			style: 'display: none; margin-left: 30px;',
			noneSelectedText: "All Subtoptics",
			change: function(e){
				that._onSelectorChanged( $(this).getSelectedValue() )
			}
		}),

		this.loadCategory()
	},
	loadCategory: function(){
		this._loadCategory( {url: this.loadCategoryUrl}, this.buildCategory, this )
	},
	loadSubCategory: function(){
		var that = this;
		this.$(".selector:last").hide(),
		//判断当前选中的分类是否为空，避免加载无用数据
		this.category && this._loadCategory( {url: this.loadCategoryUrl, parentId: this.category}, this.buildSubCategory, this )
	},
	_loadCategory: function(opt, handler, handlerScope){
		Utils.request({
			url: opt.url,
			data: {
				id: opt.parentId || ""
			},
			success: function(data){
				handler && handler.call( handlerScope || this, data )
			}
		})
	},
	buildCategory: function(data){
		var selector = this.categorySelector;
		//为下拉选择框添加默认选项
		selector.html( '<option value="" selected="selected">Select Category</option>' ),
		this._buildCategory( selector, data )
	},
	buildSubCategory: function(data){
		var selector = this.subCategorySelector;
		//为下拉选择框添加默认选项
		selector.html( '<option value="" selected="selected">All Subtoptics</option>' ),
		this._buildCategory( selector, data ),
		//子分类在加载前可能被隐藏
		data.length > 0 && this.$(".selector:last").show()
	},
	_buildCategory: function(selector, data){
		var html = '';

		for (var j = 0; j < data.length; j++) {
			html += '<option value=' + data[j].id + '>' + data[j].name + '</option>'
		};

		selector.append( html ).refreshSelector()
	},
	_onSelectorChanged: function(value){
		Logger.log("ListView: category selected");
		this.category = value,
		this.pagebar && ( this.pagebar.currentPage = 1 ),
		this.listContainer.html(""),
		this.loadListData()
	},
	loadListData: function(){
		var builder = window.builder, that = this;

		this.listContainer.find("> ul").hide();

		Utils.request({
			url: this.loadListUrl,
			data: this.queryParameters(),
			// loaderTarget: "#main",
			async: builder.isInited() || !$(this.el).hasClass("product-listview"), //产品列表在第一次加载时使用同步，方便build在初始化时，默认加载列表中的第一个产品
			success: function(data){
				that.renderList( data )
			}
		})
	},
	renderList: function(){},
	queryParameters: function(){
		return {
			category: this.category || "",
			"pager.pageSize": this._pageSize,
			"pager.pageNumber": this.pagebar ? this.pagebar.currentPage : 1
		}
	},
	makePagination: function(el, totalRow){
		var that = this;
		this.pagebar = new PaginationView({
			el: el,
			totalRow: totalRow,
			pageSize: this._pageSize,
			turnPage: function(currentPage, pageSize){			
				var ul = that.listContainer.find("> ul");
				ul.eq(currentPage - 1).length === 0 ? that.loadListData() : ( ul.hide(), ul.eq(currentPage - 1).fadeIn("slow") )
			}
		}),
		this.pagebar.render()
	}
}),

ProductListView = ListView.extend({
	el: "#product-listview",
	initialize: function(){
		Logger.log("Initialize productlistview"),
		this.loadCategoryUrl = Utils.getSitePath() + "js/product-category-list.json",
		// this.loadCategoryUrl = "/shop/goods_category!queryChilds.action",
		this.loadListUrl = Utils.getSitePath() + "js/product-list.json",
		// this.loadListUrl = "/shop/diy_goods!queryDiyGoodsPager.action",
		ListView.prototype.initialize.call(this, "productlistview")
	},
	renderList: function(data){
		var tpl = $("#template-list-product").html(),
			rows = data.rows,
			pagebar,
			builder = window.builder,
			$list,
			productData,
			productImages;

		Logger.log("ProductListView: renderList.", data);

		$list = $( _.template(tpl, {rows: rows}) ).appendTo( this.listContainer );

		//预加载item的图片，加入loading效果
		for (var i = 0, k = rows.length; i < k; i++) {
			productData = rows[i],
			// 取第一个方位下的图
			productImages =  builder.getProductImages(productData.id, productData.directions[0], "400x400"),
			
			Utils.preloadImages( $list.find("> li").eq( i ), productImages )
		};

		
		//向数据写入方位图片路径
		// for (var i = 0, k = rows.length; i < k; i++) {
		// 	builder.initProductImages( rows[i] )
		// };				

		// this.listContainer.append( _.template(tpl, {rows: rows}) ),
		pagebar = this.pagebar,
		pagebar ? pagebar.refresh( {totalRow: data.total, pageSize: this._pageSize, currentPage: pagebar.currentPage} ) : this.makePagination("#product-listview-pagination", data.total),
		this.cachePageData( rows )
	},
	onItemMouseenter: function(e){
		var target = $(e.currentTarget), 
			tpl = $("#template-product-preview").html();
		
		// Logger.log("ProductListView: onItemMouseenter", target);

		ListView.prototype.onItemMouseenter.call(this, e),

		//预览当前产品
		// this.preview
		// 	.removeClass("design-preview")
		// 	.addClass("product-preview")
		// 	.html( _.template(tpl, this.getItemData( target.index() )) )
		// 	.show()
		this._viewProduct( this.getItemData( target.index() ) )
	},
	_viewProduct: function(productData){
		var el = this.preview,
			tpl = $("#template-product-preview").html(),
			$imageContainer,
			directions = productData.directions,
			productImages;

		el.removeClass("design-preview")
			.addClass("product-preview")
			.html( _.template(tpl, productData) )
			.show();

		$imageContainer = el.find(".image-container");

		for (var i = 0; i < directions.length; i++) {
			productImages =  builder.getProductImages(productData.id, directions[i], "400x400"),
			Utils.preloadImages( $imageContainer.find("> div").eq( i ), productImages )
		};
	}
}),

DesignListView = ListView.extend({
	el: "#design-listview",
	initialize: function(a){
		Logger.log("Initialize designlistview"),
		this.loadCategoryUrl = Utils.getSitePath() + "js/design-category-list.json",
		// this.loadCategoryUrl = "/shop/material_category!queryChilds.action",
		this.loadListUrl = Utils.getSitePath() + "js/design-list.json",
		// this.loadListUrl = "/shop/materials!queryMaterialsPager.action",
		ListView.prototype.initialize.call(this, a || "designlistview")
	},
	renderList: function(data){
		var that = this,
			tpl = $("#template-list-design").html(),
			rows = data.rows,
			pagebar,
			$list,
			$li,
			designData;

		Logger.log("DesignListView: renderList.", data);

		$list = $("<ul></ul>")
			.addClass("list")
			.appendTo( this.listContainer );

		//预加载item的图片，加入loading效果
		for (var i = 0, k = rows.length; i < k; i++) {
			designData = rows[i],
			$li = $("<li></li>")
				.attr("pid", designData.id)
				.appendTo( $list ),			
			Utils.preloadImages( $li, [designData.properties.src], function(o){
				that._resetImage( $(this), o, 40)

			} )
		};		

		// this.listContainer.append( _.template(tpl, {rows: rows}) ),
		pagebar = this.pagebar,
		pagebar ? pagebar.refresh( {totalRow: data.total, pageSize: this._pageSize, currentPage: pagebar.currentPage} ) : this.makePagination("#design-listview-pagination", data.total),
		this.cachePageData( rows )
	},
	onItemMouseenter: function(e){
		var target = $(e.currentTarget), 
			tpl = $("#template-design-preview").html(),
			designData,
			image;
		
		// Logger.log("DesignListView: onItemMouseenter", target);

		ListView.prototype.onItemMouseenter.call(this, e),

		designData = this.getItemData( target.index() ),

		//按原始比例缩放图片并居中显示
		image = this.highlightSelector.find("> img:first"),

		this._viewDesign( designData )
		,this._resetImage(image, {width: designData.properties.defaultWidth, height: designData.properties.defaultHeight}, 50)
	},
	_viewDesign: function(designData){
		var that = this,
			el = this.preview,
			tpl = $("#template-design-preview").html();

		el.removeClass("product-preview")
			.addClass("design-preview")
			.html( _.template(tpl, designData) )
			.show();

		Utils.preloadImages( el.find(".image-container"), [designData.properties.src], function(o){
			that._resetImage( $(this), o, 150)
		} )
	},
	_resetImage: function(image, defaultSize, newValue){
		var defaultWidth = defaultSize.width,
			defaultHeight = defaultSize.height;

		if(defaultWidth > defaultHeight){
			image.css({
				width: newValue,
				height: defaultHeight / defaultWidth * newValue,
				"margin-top": (1 - defaultHeight / defaultWidth) * newValue / 2
			})
		}else if(defaultHeight > defaultWidth){
			image.css({
				height: newValue,
				width: defaultWidth / defaultHeight * newValue,
				"margin-left": (1 - defaultWidth / defaultHeight) * newValue / 2
			})
		};
	}
}),

UploadView = DesignListView.extend({
	el: "#upload-view",
	initialize: function(){
		Logger.log("Initialize uploadview"),
		DesignListView.prototype.initialize.call(this, "uploadview"),
		this._data = []
	},
	initUI: function(){
		var that = this;

		new qq.FileUploader({
				element: this.$(".uploader").get(0),
				listElement: "",
				// action: "js/upload-design.json", 
				action: "/shop/materials!upload.action",
				disableDefaultDropzone: true,
				autoUpload: true,
				inputName: "materialFile",
				uploadButtonText: "Upload photo",
				// cancelButtonText: "Cancel",
				// failUploadText: "Upload failed",
				allowedExtensions: ["gif", "png", "jpeg", "jpg", "bmp"],
				sizeLimit: 1024 * 1000 * 2 , //2MB
				forceMultipart: true, //不使用XHR方式提交
				onSubmit: function(){
					Utils.showLoading()
				},		
				onComplete: function(id, fileName, responseJSON){
					if(responseJSON.success){
						//添加素材到列表	
						that.pushItem( responseJSON.data ),
						that.renderList( responseJSON.data )				
					}
					Utils.hideLoading()
				},
				onError: function(id, fileName, message){
					Logger.error(id, fileName, message);
				}
			})
	},
	//父类ListView在初始化面板时会调用该方法进行加载数据，这里不需要
	loadListData: function(){},
	pushItem: function(itemData){
		var maxLength = 25, data = this._data, dataLength, sub;
		data.push( itemData ),
		dataLength = data.length;

		if( dataLength > maxLength ){
			sub = dataLength - maxLength;
			data.splice(0, sub);
			//删除列表中的item
			for (var i = 0; i < sub; i++) {
				this.listContainer.find("li").eq(i).remove()
			};
		}
		
	},
	renderList: function(designData){
		var that = this, 
			// tpl, 
			$list,
			$li;

		Logger.log("UploadView: renderList.");	

		$list = this.listContainer.find("> ul"),
		$list.length === 1 || (
				$list = $("<ul></ul>").addClass("list").appendTo( this.listContainer )
			);

		//预加载item的图片，加入loading效果
		$li = $("<li></li>")
			.attr("pid", designData.id)
			.appendTo( $list ),			
		Utils.preloadImages( $li, [designData.properties.src], function(o){
			that._resetImage( $(this), o, 40)

		} )	

		// tpl = $("#template-list-design").html(),
		// this.listContainer.html( _.template(tpl, {rows: this._data}) )
	},
	getItemData: function(index){
		return this._data[index]
	}
}),

PaginationView = UserView.extend({
	initialize: function(options){
		Logger.log("Initialize pagination"),
		this._configure(options),
		UserView.prototype.initialize.call(this, "paginationview")
	},
	events: {
		"click .page-previous": "onPreviousClicked",
		"click .page-next": "onNextClicked"
	},
	_configure: function(options){
		this.el || (this.el = options.el),
		this.pageSize = options.pageSize || 25,
		this.currentPage = options.currentPage || 1,
		this.totalRow = options.totalRow || 0,
		this.totalPage = Math.ceil(this.totalRow / this.pageSize),
		//切换分页时的回调
		this.turnPage || (this.turnPage = options.turnPage || $.noop)
	},
	onPreviousClicked: function(){
		this.hasBefore() && ( this.turnPage( --this.currentPage, this.pageSize ), this.refreshPage() )
	},
	onNextClicked: function(){
		this.hasNext() && ( this.turnPage( ++this.currentPage, this.pageSize ), this.refreshPage() )
	},
	hasNext: function(){
		return this.currentPage < this.totalPage
	},
	hasBefore: function(){
		return this.currentPage > 1
	},
	refreshPage: function(number){
		var target = $(this.el);
		number && (this.currentPage = number),
		target.find(".page-previous").toggleClass("disabled", !this.hasBefore()),
		target.find(".page-next").toggleClass("disabled", !this.hasNext()),
		target.find(".page-number").html(this.currentPage + "/" + this.totalPage)
	},
	render: function(){
		var data = {
				currentPage: this.currentPage,
				totalPage: this.totalPage,
				hasBefore: this.hasBefore(),
				hasNext: this.hasNext()
			},
			tpl = $("#template-pagination").html();
		$(this.el).html( _.template(tpl, data) )
	},
	refresh: function(options){
		this._configure( options ),
		this.render()
	}
}),

DesignPropertyView = UserView.extend({
	el: "#design-property-view",
	initialize: function(){
		Logger.log("Initialize propertyview");
		UserView.prototype.initialize.call(this, "propertyview")
	},
	events: {
		"click .btnCenterHorizontally": "onCenterHorizontallyClicked",
		"click .btnCenterVertically": "onCenterVerticallyClicked",
		"click .btnFlipHorizontally": "onFlipHorizontallyClicked",
		"click .btnFlipVertically": "onFlipVerticallyClicked"
	},
	render: function(){
		var design = this._design,
			el,
			properties,
			property,
			widget;
		// UserView.prototype.render.call(this);

		//渲染当前design的属性集合
		if( design ){

			el = this.$(".property-list");
			el.html("");

			properties = design.getPropertiesSorted();

			for (var e = 0; e < properties.length; e++) {
				property = properties[e];
				property.property.renderWidget();
				widget = property.property.getRenderedWidget();
				el.append( widget )
			}
			Logger.log("PROPERTY-VIEW: rendered " + properties.length + " properties")

		}

	},
	renderForDesign: function(a){
		this._design = a,
		this.render()
	},
	onCenterHorizontallyClicked: function(e){
		this.trigger("onCenterHorizontally")
	},
	onCenterVerticallyClicked: function(e){
		this.trigger("onCenterVertically")
	},
	onFlipHorizontallyClicked: function(e){
		this.trigger("onFlipHorizontally")
	},
	onFlipVerticallyClicked: function(e){
		this.trigger("onFlipVertically")
	},
	//添加附件（property items）后的处理事件
	onAttach: function() {

		//隐藏所有的settings窗口，避免显示冲突
		this.$(".settings").hide();

		if (this._design) {
			var a = this._design.getPropertiesSorted(), c;
			for (var b = 0; b < a.length; b++) {
				c = a[b];
				c.property.getWidget().onAttach()
			}
		}	
	},
	refresh: function(){
		this.render(),
		this.onAttach()
	}
}),

FooterView = UserView.extend({
	el: "#footer",
	initialize: function(){
		UserView.prototype.initialize.call(this, "footerview")
	},
	events: {
		"click .btnAddToBasket": "onAddToBasketClicked",
		"keydown .product-quantity input": "onKeydown",
		"blur .product-quantity input": "onBlur"
	},
	onAddToBasketClicked: function(e){
		e.stopPropagation();
		this.trigger("onAddToBasket")
	},
	onKeydown: function(e){
		var keyCode = e.keyCode;

		// console.log(keyCode)

		if(keyCode !== 46 && keyCode !== 8 && (keyCode < 48 || keyCode > 57)) return false;
		
	},
	onBlur: function(e){
		//
		var input = $(e.currentTarget), value = $.trim( input.val() );
		if(value === "" || parseInt(value, 10) === 0) input.val( 1 )
	}
}),

DeviceView = UserView.extend({
	el: "#device",
	initialize: function(options){
		Logger.log("Initialize deviceview"),
		UserView.prototype.initialize.call(this, "deviceview"),
		this.initEvents()
	},
	initEvents: function(){
		var that = this;
		$(this.el).bind("click", function(){
			Logger.log("DeviceView: on body clicked");
			that.trigger("onBodyClicked")
		})
	},
	_makeOperationButtons: function(el){
		var tpl = '<a herf="javascript:;" class="btn btnMove"><i class="icon-move-1"></i></a>'
				+ '<a herf="javascript:;" class="btn btnRotate"><i class="icon-cw"></i></a>'
				+ '<a herf="javascript:;" class="btn btnZoom"><i class="icon-resize-horizontal-1"></i></a>'
				+ '<a herf="javascript:;" class="btn btnDelete"><i class="icon-trash"></i></a>';

		$(tpl).appendTo( el )
	},
	_bindAddedDesignEvents: function(design){
		var that = this, $el = $(design.el), designType = design.getData().type;

		$el.bind("click", function(e){
			Logger.log("DeviceView: design clicked", this.id);
			var $self = $(this);

			e.stopPropagation(),

			$self.hasClass("selected") || (
					that.deselectAllDesign(),
					$self.addClass("selected"),
					//为当前EL添加操作按钮层
					$self.attr("maked") === "true" ? $self.find(".btn").show() : ( that._makeOperationButtons( this ), $self.attr("maked", true) ),
					that._selectedDesign = $self,
					//前置当前design
					$self.css("z-index", _zindex()),
					that.trigger("designSelected", this.id)
				);

			function _zindex(){
				var index = 0;
				$(that.el).find("> div.design").each(function(i, n){
					index = Math.max(index, +$(n).css("z-index"))
				})
				return ++index
			}
		})
		.delegate("a.btnDelete", "click.delete", function(e){
			var $self = $(e.currentTarget);

			Logger.log("DeviceView: on delete", $self);

			e.stopPropagation(),

			//删除当前控件
			that.trigger("designDeleted", that._selectedDesign.get(0).id),
			that._selectedDesign.remove(),
			that._selectedDesign = null
			
		}).delegate("a.btnRotate", "mousedown.rotate", function(e){
			var handler = that._selectedDesign.find(".ui-rotate-handle.ui-rotate-ne");

			// Logger.log("DeviceView: on rotate");

			e.preventDefault(),

			handler.length > 0 && (
					//改变event的target对象
					e.target = handler.get(0),
					//触发handler的mousedown，以实现resizeble
					handler.trigger(e)
				)		
			
		}).delegate("a.btnZoom", "mousedown.zoom", function(e){
			var handler = that._selectedDesign.find(".ui-resizable-handle.ui-resizable-se");

			// Logger.log("DeviceView: on zoom");

			e.preventDefault(),

			handler.length > 0 && (
					//改变event的target对象
					e.target = handler.get(0),
					//触发handler的mousedown，以实现resizeble
					handler.trigger(e)
				)		
			
		}),

		$el.draggable({
			containment: "#product-viewer", //设置可拖放的范围
			start: function(ev, ui) {
				var target = $(this),
					position = ui.position,
					btnRotate,
					btnZoom,
					btnDelete;

				Logger.log("DeviceView: start drag");

				//先选中当前要移动的元素
				target
					.trigger("click")
					.find(".btnRotate, .btnZoom, .btnDelete").hide()
				
			},
			drag: function(ev, ui){
				// 当前坐标随着鼠标移动而变化，不需时时更新design属性
				// that.trigger("designReposition", that._selectedDesign.attr("id"), ui.position)
			},
			stop: function(ev, ui){
				Logger.log("DeviceView: drag stop");
				//恢复desgin的高亮层中的按钮显示状态
				$(this).find("a.btn").show(),
				//更新design相关属性
				that.trigger("designReposition", this.id, ui.position)
			}
			
		}),


		$el.resizable({
			minWidth: designType === 3 ? 10 : 30,
			minHeight: designType === 3 ? 10 : 30,
			maxWidth: 300,
			maxHeight: 300,
			handles: "se", //缩放的方向
			aspectRatio: designType !== 3, //文本类型的design不锁定缩放比例
			start: function(ev, ui){
				var target = $(this);
				Logger.log("on zoom start");
				//先选中当前要移动的元素
				target.trigger("click")
					.find(".btnMove, .btnRotate, .btnDelete").hide()
			},
			resize: function(ev, ui){
				// Logger.log(ev, ui);
				that.trigger("designResize", this.id, ui.size)
			},
			stop: function(ev, ui){
				Logger.log("on zoom stop");
				$(this).find("a.btn").show()
			}
        }),

		//这里和jquery.ui.draggable绑定了同一个element，如果不在jquery.ui.draggable里放行，将触发drag事件先，处理详见jquery.ui.rotate.js
        $el.rotate({
        	// handle: ".btnRotate",
        	start: function(ev, ui){
        		var target = $(this);				
				Logger.log("on rotate start");
				//先选中当前要移动的元素
				target.trigger("click")
					.find(".btnMove, .btnZoom, .btnDelete").hide()        		
        	},
        	rotate: function(ev, ui){
        		// that.trigger("rotateDesign", this.id, ui.radian)
        	},
        	stop: function(ev, ui){
        		Logger.log("on rotate stop");
        		$(this).find("a.btn").show(),
        		//图形在旋转过程中会跟着变换，不需在rotate()里回调
        		that.trigger("designRotate", this.id, ui.radian)
        	}
        })
	},
	addDesign: function(design){
		Logger.log("DeviceView: addDesign", design);
		design.render( this.el ),
		this._bindAddedDesignEvents( design )
	},
	selectDesign: function(design){
		Logger.log("DeviceView: selectDesign", design);
		design.el.trigger("click")
	},
	deselectAllDesign: function(){
		Logger.log("DeviceView: deselectAllDesign");
		this._selectedDesign && ( this._selectedDesign.removeClass("selected").find(".btn").hide(), this._selectedDesign = null )
	},
	clearAllDesign: function(){
		Logger.log("DeviceView: clearAllDesign");
		this._selectedDesign = null,
		$(this.el).find(".design").remove()
	}
});

