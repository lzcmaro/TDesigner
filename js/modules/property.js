
Property = Backbone.View.extend({

	initialize: function(title, widget, value) {
		this._title = title,
		this.value = value,
		this._widget = widget,
		widget.setValue(this.value),
		this._defaultData = {
			value: this.value,
			_property_title: title
		}
	},
	setValue: function(a, b) {
		this.value = a,
		this._widget.setValue(a)
	},
	updateValue: function(a) {
		this.value = a,
		this._widget.updateValue(a)
	},
	getDefaultValue: function() {
		return this._defaultData.value
	},
	getValue: function() {
		return this.value
	},
	serialize: function() {
		var a = this._serializeProperty(this.value);
		return a
	},
	_serializeProperty: function(a) {
		if (typeof a == "object") {
			var b = {};
			for (var c in a) {
				var d = a[c];
				b[c] = this._serializeProperty(d)
			}
			return b
		}
		return a
	},
	render: function() {
		this.renderWidget()
	},
	renderWidget: function() {
		this._widget.render(this._defaultData._property_title)
	},
	getRenderedWidget: function() {
		return this._widget.el
	},
	bindWidgetEvent: function(a, b) {
		this._widget.bind(a, b, this)
	},
	getName: function() {
		return this._title
	},
	setName: function(a) {
		this._title = a,
		this._defaultData._property_title = a
	},
	getWidget: function() {
		return this._widget
	},
	handle: function(a) {}
});

ScalarProperty = Property.extend({
	initialize: function(a, b, c) {
		Property.prototype.initialize.call(this, a, b, c);
		var self = this;
		this.bindWidgetEvent("valueChanged", function(newValue) {
			Logger.log("PROPERTY: value changed ", self.getName(), self.getValue(), newValue);
			var oldValue = self.getValue();
			if (oldValue == newValue) return;
			self.updateValue(newValue),
			self.trigger("valueChanged", newValue),
			self.trigger("propertyChanged", self, oldValue, newValue)
		})
	}
});

/**
 * 数组形式的属性
 */
ArrayProperty = Property.extend({
	/**
	 * a, title
	 * b, widget
	 * c, default value
	 */
	initialize: function(a, b, c) {
		Property.prototype.initialize.call(this, a, b, c);
		var d = this;
		this.bindWidgetEvent("itemAdded", function(a) {
			var b = d.getValue().slice(0);
			d.addItem(a);
			var c = d.getValue().slice(0);
			d.trigger("itemAdded", a),
			d.trigger("propertyChanged", d, b, c, !0)
		}),
		/**
		 * a, index
		 * b, item data
		 */
		this.bindWidgetEvent("itemChanged", function(a, b) {
			Logger.log("PROPERTY: itemChanged", a, b);
			var c = d.getValue().slice(0),
			e = d.replaceItem(a, b),
			f = d.getValue().slice(0);
			d.trigger("itemChanged", b, e),
			d.trigger("propertyChanged", d, c, f)
		}),
		/**
		 * a, index
		 */
		this.bindWidgetEvent("itemDeleted", function(a) {
			var b = d.getValue().slice(0),
			c = d.removeItem(a),
			e = d.getValue().slice(0);
			d.trigger("itemDeleted", c),
			d.trigger("propertyChanged", d, b, e, !0)
		}),
		/**
		 * a, old index
		 * b, new index
		 */
		this.bindWidgetEvent("itemMoved", function(a, b) {
			var c = d.getValue().slice(0);
			d.moveItem(a, b);
			var e = d.getValue().slice(0);
			d.trigger("itemMoved", a, b),
			d.trigger("propertyChanged", d, c, e)
		})
	},
	addItem: function(a) {
		$.isArray(this.value) && this.value.push(a)
	},
	removeItem: function(a) {
		if ($.isArray(this.value) && a < this.value.length) {
			var b = this.value[a];
			return this.value.splice(a, 1),
			b
		}
		return null
	},
	moveItem: function(a, b) {
		if ($.isArray(this.value) && a < this.value.length && b < this.value.length) {
			var c = this.value[a];
			this.value.splice(a, 1),
			this.value.splice(b, 0, c)
		}
	},
	replaceItem: function(a, b) {
		if ($.isArray(this.value) && a < this.value.length) {
			var c = this.value[a];
			return this.value[a] = b,
			c
		}
		return null
	},
	size: function() {
		return this.value.length
	}
});


