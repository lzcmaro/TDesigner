Widget = Backbone.View.extend({
	initialize: function(a) {
		this._template = a,
		this._data = {}
	},
	setValue: function(a) {this._data = a},
	updateValue: function(a){ this.setValue(a) },
	render: function(a) {
		var b = "#template-widget-" + this._template,
			c = _.template($(b).html()),
			d = c($.extend({}, this._data, {
				__wid: this.cid
			}));

		// Logger.log("Widget: rendering", this);
			
		$(this.el).html(d),
		//widget会被重新渲染，这里再次绑定事件
		this.delegateEvents()
	},
	onAttach: function() {}
}),

NullWidget = Widget.extend({
	initialize: function() {
		Widget.prototype.initialize.call(this, "nullwidget")
	}
}),

ColorWidget = Widget.extend({
	initialize: function(){
		Widget.prototype.initialize.call(this, "colorwidget");
		this._data = {
			items: []
		}
	},
	events: {
		"click li": "onItemClicked"
	},
	setValue: function(a){
		this._data.items = a
	},
	onItemClicked: function(e){

		var target = $(e.currentTarget),
			index = this.$("li.selected").index(),
			itemData = this._data.items[index];

		Logger.log("ColorWidget: onItemClicked", e.currentTarget);

		e.stopPropagation();

		// target.hasClass("selected") || ( 
			$(this.el).find("li").removeClass("selected"), 
			target.addClass("selected"), 
			this._showColorSettings( target ) 
		// )

		// this.trigger("itemChanged", index, $.extend({}, itemData, {selected: true}))
	},
	_showColorSettings: function(target){
		var selectedColor = target.attr("data-val"), colorSettings = this.colorSettings;

		colorSettings.find("li").removeClass("selected"),
		colorSettings.find("li[data-val=" + selectedColor + "]").addClass("selected"),
		colorSettings.show()
	},
	onAttach: function(){
		var that = this, colorSettings = this.colorSettings || ( this.colorSettings = $("#design-color-settings") ), tpl;

		Logger.log("ColorWidget: onAttach");

		//加载颜色设置面板
		colorSettings.attr("rendered") || (
				tpl = $("#template-color-settings-item").html(),
				colorSettings.find(".list-container").html( _.template(tpl, {colors: ColorWidget.COLORS}) )
			)

		// this.colorSettings || ( this.colorSettings = $("#design-color-settings") );

		colorSettings
			.undelegate("click")
			.delegate("li", "click", function(e){
				var target = $(e.currentTarget),
					targetValue = target.attr("data-val"), 
					a = $(that.el).find("li.selected"),
					b = a.index(),
					c = that._data.items[b];

				Logger.log("ColorWidget: colorSelected", e.currentTarget);

				e.stopPropagation();

				target.hasClass("selected") || ( 
					target.closest("ul").find("li").removeClass("selected"), 
					target.addClass("selected"),
					a.attr({
						"data-val": targetValue,
						"title": targetValue
					}).find("span:last").css("background", targetValue), 
					that.trigger("itemChanged", b, $.extend({}, c, {color: targetValue})) 
				)

			})
			.delegate(".box-close", "click", function(e){
				e.stopPropagation();
				$(this).closest(".box").hide(),
				$(that.el).find("li.selected").removeClass("selected")
			})

		// this.colorSettings.hide(),
		this.$("li.selected").trigger("click")

	}
}, {
	COLORS: ["#000000", "#993300", "#333300", "#003300", "#003366", "#000080", "#333399", "#333333", 
        "#800000", "#FF6600", "#808000", "#008000", "#008080", "#0000FF", "#666699", "#808080", 
        "#FF0000", "#FF9900", "#99CC00", "#339966", "#33CCCC", "#3366FF", "#800080", "#999999",
        "#FF00FF", "#FFCC00", "#FFFF00", "#00FF00", "#00FFFF", "#00CCFF", "#993366", "#C0C0C0",
        "#FF99CC", "#FFCC99", "#FFFF99", "#CCFFCC", "#CCFFFF", "#99CCFF", "#CC99FF", "#FFFFFF"]
}),

TextEditorWidget = Widget.extend({
	initialize: function(a) {
		Widget.prototype.initialize.call(this, "editorwidget"),
		this._data = {
			text: a || ""
		}
	},
	events: {
		"click li": "onItemClicked"
	},
	setValue: function(a) {
		this._data.text = a,
		$("textarea", this.el).val(a)
	},
	updateValue: function(a) {
		this._data.text = a
	},
	onAttach: function() {
		var that = this, textSettings = this.textSettings || ( this.textSettings = $("#design-text-settings") ), tpl;

		// textSettings.attr("rendered") || (
				tpl = $("#template-editor").html(),
				textSettings.find(".editor-container").html( _.template( tpl, $.extend( {}, this._data, {__wid: this.cid} ) ) )
			// )

		//删除tinyMCE可能残留的菜单弹出层，避免冲突
		$(".mceListBoxMenu, .mce_forecolor, .mce_backcolor").remove();

		//在弹出窗里挂载富文件编辑器
		tinyMCE.init({
			theme: "advanced",
			mode: "exact",
			valid_elements: "*[*]",
			elements: this.cid,
			// language: "zh-cn",
			theme_advanced_toolbar_location: "top",
			theme_advanced_resizing: !1,
			// plugins: "table,inlinepopups",
			//plugins: "autolink,lists,spellchecker,pagebreak,style,layer,table,save,advhr,advimage,advlink,emotions,iespell,inlinepopups,contextmenu,paste,nonbreaking,xhtmlxtras,template",
			theme_advanced_buttons1: "bold,italic,underline,|,justifyleft,justifycenter,justifyright,|,forecolor",
			theme_advanced_buttons2: "fontselect,fontsizeselect",
			theme_advanced_buttons3: "",
			theme_advanced_toolbar_align: "left",
			theme_advanced_statusbar_location: "none",
			// theme_advanced_source_editor_width: 600,
			// theme_advanced_source_editor_height: 350,
			theme_advanced_fonts: "Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats",
			verify_html: !1,
			width: 240,
			height: 156,
			setup: function(b) {
				b.onClick.add(function(b, c) {					
					var d = b.getContent(), e = "Write your text here";
					d = d.replace(/<[^>]+>/g, ""), //去除HTML标签
					e === $.trim(d) && b.setContent("")
				}),
				b.onKeyUp.add(function(b, c) {
					that.trigger("valueChanged", b.getContent())
				})
			},
			onchange_callback: function(b) {
				that.trigger("valueChanged", b.getContent())
			}
		});

		textSettings
			.undelegate("click")
			.delegate(".box-close", "click", function(e){
				e.stopPropagation();
				$(this).closest(".box").hide(),
				$(that.el).find("li.selected").removeClass("selected")
			})
		
		this.$("li.selected").trigger("click")
	},
	onItemClicked: function(e){

		var target = $(e.currentTarget);

		Logger.log("TextWidget: onItemClicked", e.currentTarget);

		e.stopPropagation();

		target.addClass("selected"), 
		this.textSettings && this.textSettings.show()
	}
});	

