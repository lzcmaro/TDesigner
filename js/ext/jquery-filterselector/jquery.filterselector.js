/**
 * 	jQuery Selector UI Widget 1.0 
 *
 * 	Depends: 
 *	   - jQuery 1.4.2+
 * 	Auther:
 *     - Gavin Li 2012.08.09
 *  Update:
 *     - 2014.02.12
 * 
 *  Reference resources: jquery.multiselect.js (http://www.erichynds.com/jquery/jquery-ui-multiselect-widget)
 * 	Example: 		
		<select name="example" multiple="multiple">
			<option value="option1">Option 1</option>
			<option value="option2" selected="true">Option 2</option>
			<option value="option3">Option 3</option>
		</select>
		
		$('select').filterSelector({
			multiple: false,
			click: function(){
				// todo
			}
		});
 */
(function($){

	var selectorID = 0;
	
	$.extend($.fn, {
		filterSelector: function(options){
			return this.each(function(){
				var selector = $.data(this, 'selector');
				if(!selector){
					selector = new $.filterSelector(options, this);
					$.data(this, 'selector', selector);
				}
			});
		}
	});
	
	$.filterSelector = function(options, el){	
		if ( arguments.length ) {
			this.init( options, el );
		}			
	};
	
	$.filterSelector.prototype = {
		eventPrefix: "",
		escape: /[\-\[\]{}()*+?.,\\\^$|#\s]/g,
		isOpen: false,
		checkAllFlag: false,
		minWidth: 50, // min width for selector
		disabled: false,

		options: {
			header: true, // show header
			width: false, // selector width
			height: false, // list height
			style: '',
			checkAllText: 'Check all / Uncheck all',
			noneSelectedText: 'Select options',
			selectedText: '# selected',
			displaySelectedText: false,
			selectedList: 2,
			multiple: true,
			filter: false, // filter keyword
			groupSelected: false // group by selected
		},
				
		// init data
		init: function(options, el){
			
			var o = (this.options = $.extend(true, {}, this.options, options));
							
			this.element = $(el);

			this.selector = $('<span />')
				.addClass('selector')
				.addClass(o.filter === true ? "selector-filter" : "")
				.attr({'title': this.element.attr('title'), 'style': o.style})
				.insertAfter( this.element ),
				
			this.input = $('<input ' + (o.filter !== true ? 'readonly="true"' : '') + ' ></input>')
				.addClass('selector-input')
				.appendTo(this.selector),
				
			this.button = $('<a href="#"></a>')
				.addClass('selector-button')
				.appendTo(this.selector),
				
			this.menu = $('<div />')
				.addClass('selector-menu')
				.appendTo( document.body );
			
			
			
			if(o.header !== false){
				this.header = $('<div />')
					.addClass('selector-menu-header')
					.appendTo( this.menu ),
				this.headerLinkContainer = $('<ul />')
					.html(function(){
						var str = '';
						if(typeof o.header === "string"){
							str += '<li>' + o.header + '</li>';
						} else if(o.header === true && o.multiple === true){
							str += '<li><a class="selector-menu-checklink" href="#"><span>' + o.checkAllText + '</span></a></li>';
						}
						str += '<li class="li-close"><a href="#" class="selector-menu-close"><span class="icon-close"/></a></li>';
						return str;
					})
					.appendTo( this.header );
			}
										
			
			this.checkboxContainer = $('<div />')
				.addClass('selector-menu-list')
				.addClass( o.multiple ? '' : 'selector-menu-single')
				.append('<ul />')
				.appendTo( this.menu );

			this.checkboxContainer.find("ul").height(o.height);
	
			this.build();
			this.cacheData();
			this.bindEvents();
			this._trigger("create");			
		},
		
		// build menu
		build: function(){
			var el = this.element,
				o = this.options,
				html = "",
				id = selectorID++; // unique ID for the label & option tags
				
			el.attr("multiple", "multiple").hide();
			
			// build items
			el.find('option').each(function( i ){
				var parent = this.parentNode,
					title = this.innerHTML,
					description = this.title,
					value = this.value,
					inputID = 'selector-' + id + '-option-' + i,
					isDisabled = this.disabled,
					isSelected = this.selected,
					labelClasses = [];			
			
				if( isDisabled ){
					labelClasses.push( 'item-disabled' );
				}

				// bitemsers automatically select the first option
				// by default with single selects
				if( isSelected && !o.multiple ){
					labelClasses.push( 'item-active' );
				}
				
				html += '<li>';
				
				// create the label
				html += '<label for="' + inputID + '" title="' + description + '" class="' + labelClasses.join(' ') + '">';
				html += '<input id="' + inputID + '" name="selector_' + id + '" type="' + (o.multiple ? "checkbox" : "radio") + '" value="' + value + '" title="' + title + '"';

				// pre-selected?
				if( isSelected ){
					html += ' checked="checked"';
				}

				// disabled?
				if( isDisabled ){
					html += ' disabled="disabled"';
				}

				// add the title and close everything off
				html += ' /><span>' + title + '</span></label></li>';
			});
			
			// insert into the DOM
			this.checkboxContainer.find('ul').html( html );
			
			this.labels = this.checkboxContainer.find('label');
			this.inputs = this.checkboxContainer.find('input');
			
			this.setSelectorWidth();
			this.setMenuWidth();
			
			// remember default value
			this.button[0].defaultValue = this.update();
		},
		
		/**
		 * updates the button text.
		 * @param onlyUpdateText 标识是否只更新input的文本内容（）
		 */
		update: function(onlyUpdateText){
			var o = this.options,
				$checkboxContainer = this.checkboxContainer,
				$inputs = this.inputs,
				$checked = $inputs.filter(':checked'),
				numInputs = $inputs.length,
				numChecked = $checked.length,				
				value;
			
			onlyUpdateText || $('li.group-line', $checkboxContainer).remove();
			
			if( numChecked === 0 ){
				value = o.noneSelectedText;
			} else {
													
				if($.isFunction( o.selectedText )){
					value = o.selectedText.call(this, numChecked, numInputs, $checked.get());
				} else if( /\d/.test(o.selectedList) && o.selectedList > 0 && numChecked <= o.selectedList){
					value = $checked.map(function(){ return $(this).next().html(); }).get().join(', ');
				} else {
					// 2 selected / 2 of 10 selected
					value = o.selectedText.replace('#', numChecked).replace('#', numInputs);;
				}
				
				// group by selected
				if(!onlyUpdateText && o.multiple === true && o.groupSelected === true && numChecked !== numInputs){
					//2013.01.18 选项数据过多时，ie下可能会弹出“是否停止脚本”的询问窗，原因是JS执行过慢
					if(numChecked <= numInputs / 2){
						// var $checkedList = $checked.closest('li').remove();
						// //ie6 bug
						// if($.browser.msie && $.browser.version === '6.0'){
						// 	$checkedList.find('input').attr("checked", true);
						// }
						// $('li:first', $checkboxContainer).before($checkedList).before('<li class="group-line"></li>');
						$('li:first', $checkboxContainer).before('<li class="group-line"></li>');
						var dom;
						for (var i = 0; i < $inputs.length; i++) {
							dom = $inputs[i];
							if(dom.checked === true){
								//console.log(dom.value);
								$('li:first', $checkboxContainer).before($(dom).closest("li"))
							}
						};
					}else{
						//var $uncheckedList = $inputs.filter(":not(:checked)").closest('li').remove();					
						//$('li:last', $checkboxContainer).after($uncheckedList).after('<li class="group-line"></li>');
						$('ul', $checkboxContainer).append('<li class="group-line"></li>');
						var dom;
						for (var i = 0; i < $inputs.length; i++) {
							dom = $inputs[i];
							if(dom.checked === false){
								//console.log(dom.value);
								$('ul', $checkboxContainer).append($(dom).closest("li"))
							}
						};
					}					
				}
				
			}
			
			if(o.displaySelectedText === true || numChecked === 0 || o.multiple === false) this.input.val(value);
			
			return value;
		},
		
		// bind events
		bindEvents: function(){
			var self = this, selector = this.selector, input = this.input, button = this.button, o = this.options;
						
			if(o.filter === true){
				input.bind({
					keydown: function( e ){
						// prevent the enter key from submitting the form / closing the widget
						if(e.which === 13){
							e.preventDefault();
							return;
						}
					},
					keyup: function(){
						self._filter();
					},
					focus: function(){
						selector.hasClass("selector-disabled") || (input.toggleClass('selector-input-active', true), input.val(""), self.open());
					}
				});
			}else{
				input.bind({
					click: function(){
						selector.hasClass("selector-disabled") || (input.toggleClass('selector-input-active', true), button.trigger("click"));
					}
				});
			}					
			
			button.bind({
				click: function( e ){
					e.preventDefault(), self[ self.isOpen ? 'close' : 'open' ]();
				}
			});
			
			// header links
			if(o.header !== false){
				this.header
					.delegate('a', 'click.selector', function( e ){
						e.preventDefault();
						// close / checkAll or uncheckAll
						if( $(this).hasClass('selector-menu-close') ){
							self.close();
						}else if($(this).hasClass('selector-menu-checklink')){
							self._toggleChecked((self.checkAllFlag = !self.checkAllFlag));
						}
					});
			};
			
			// menu list
			this.checkboxContainer
				//label.mouseenter
				.delegate('label', 'mouseenter.selector', function(){
					if( !$(this).is('.item-disabled, .group-line') ){
						self.labels.removeClass('item-hover');
						$(this).addClass('item-hover').find('input').focus();
					}
				})
				//label.keydown
				.delegate('label', 'keydown.selector', function(e){
					e.preventDefault();
				
					switch(e.which){
						case 9: // tab
						case 27: // esc
							self.close();
							break;
						case 38: // up
						case 40: // down
						case 37: // left
						case 39: // right
							self._traverse(e.which, this);
							break;
						case 13: // enter
							$(this).find('input')[0].click();
							break;
					}
				})
				//input.click
				.delegate('input[type="checkbox"], input[type="radio"]', 'click.selector', function( e ){
					var val = this.value,
						checked = this.checked,
						tags = self.element.find('option'),
						dom,
						label;
					
					// bail if this input is disabled or the event is cancelled
					if( this.disabled || self._trigger('click', e, { value: val, text: this.title, checked: checked }) === false ){
						e.preventDefault();
						return;
					}
										
					// make sure the input has focus. otherwise, the esc key
					// won't close the menu after clicking an item.
					//$(this).focus();
					
					// change state on the original option tags
					for (var i = 0; i < tags.length; i++) {
						dom = tags[i]
						if( dom.value === val ){
							dom.selected = checked;
						} else if( !o.multiple ){
							dom.selected = false;
						}
					};
					
									
					if( o.multiple === true ){
						
						// fire change on the select box
						self._trigger("change");

						// setTimeout is to fix selector issue #14 and #47. caused by jQuery issue #3827
						// http://bugs.jquery.com/ticket/3827 
						setTimeout($.proxy(self.update, self), 10);

					}else{// some additional single select-specific logic

						label = $(this).closest('label'),
						label.hasClass("item-active") || (
								self.labels.removeClass('item-active'),
								label.toggleClass('item-active', checked ),
								
								// fire change on the select box
								self._trigger("change"),

								// setTimeout is to fix selector issue #14 and #47. caused by jQuery issue #3827
								// http://bugs.jquery.com/ticket/3827 
								setTimeout($.proxy(self.update, self), 10)
							)
						
						// close menu
						self.close();

					}
					
				});
			
			// close each widget when clicking on any other element/anywhere else on the page
			$(document).bind('mousedown.selector', function( e ){
				if(self.isOpen && !$.contains(self.menu[0], e.target) && e.target !== self.button[0] && e.target !== self.input[0]){
					self.close();
				}
			});
			
		},
		
		//open selector list
		open: function(){
		
			// bail if the beforeopen event returns false, this widget is disabled, or is already open 
			if( this.disabled || this.isOpen || this._trigger('beforeopen') === false ){
				return;
			}

			var input = this.input,
				menu = this.menu,
				o = this.options,
				win = $(window),
				winHeight = win.height(),
				pos = input.offset(), 
				menuTop = pos.top + input.outerHeight() + 1;

			
			this.checkboxContainer
				.scrollTop(0) // set the scroll of the checkbox container
				// .find('ul').height(o.height); // reset list height
			
			// show menu
			menu.css({ 
				top: winHeight - menuTop > menu.outerHeight() ? menuTop : pos.top - menu.outerHeight() - 1,
				left: pos.left,
				display: 'block'
			});
			
			// select the first option
			// triggering both mouseover and mouseover because 1.4.2+ has a bug where triggering mouseover
			// will actually trigger mouseenter.  the mouseenter trigger is there for when it's eventually fixed
			//this.labels.eq(0).trigger('mouseover').trigger('mouseenter').find('input').trigger('focus');
			
			this.input.addClass('selector-input-active');
			this.button.addClass('selector-button-active');
			this.isOpen = true;
			this._trigger('open');
		},
		
		// close list
		close: function(){
			if(this.isOpen === false || this._trigger('beforeclose') === false){
				return;
			}
			
			this.menu.hide();
			this.options.filter === true && this.items.show();
			this.update(true);
			this.input.removeClass('selector-input-active');
			this.button.removeClass('selector-button-active');
			this.isOpen = false;
			this._trigger('close');
		},
		
		// checkAll or uncheckAll
		_toggleChecked: function(flag){
			var self = this, $inputs = this.inputs.filter(function(){
					return !this.disabled && $.css($(this).parents('li')[0], "display") !== 'none';
				});

			// toggle state on inputs
			$inputs.attr("checked", flag === true);

			// give the first input focus
			//$inputs.eq(0).focus();
			
			// update button text
			this.update();

			// toggle state on original option tags
			this.element.find('option').attr("selected", flag === true);

			// trigger the change event on the select
			if( $inputs.length ) {
				this._trigger("change");
			}
		},
		
		// get selected text
		getSelectedText: function(){
			if(this.options.multiple === true){
				$checked = this.inputs.filter(':checked');
				return $checked.map(function(){
					return $(this).attr('title');
				}).get().join(',');
			}			
			return this.inputs.filter(':checked').attr('title');			
		},
		
		// get selected value
		getSelectedValue: function(){
			if(this.options.multiple === true){
				$checked = this.inputs.filter(':checked');
				return $checked.map(function(){
					return $(this).val();
				}).get().join(',');
			}			
			return this.inputs.filter(':checked').val();
		},		
		
		// set selected option by values
		setSelectedOptions: function(values){
			if(values === undefined || values === null) return;
			//var bt = new Date().getTime();
			var arr = ("" + values).split(","), //避免传的值为number后使用split()报错
				arr2 = arr.slice(0),
				inputs = this.inputs,
				tags = this.element.find('option'),
				labels = this.labels;

			tags.attr("selected", false),
			inputs.attr("checked", false),
			labels.removeClass('item-hover');

			//避免单选时，传了多个value值过来后，选中多个值
			if( this.options.multiple !== true ){
				var selector = ':[value="' + arr[arr.length - 1] + '"]';
				labels.removeClass('item-active');
				tags.filter(selector).attr("selected", true),
				inputs.filter(selector).attr("checked", true).closest('label').addClass('item-active')
			}else{
				// for (var i = 0; i < arr.length; i++) {
				// 	selector = ':[value="' + arr[i] + '"]';
				// 	tags.filter(selector).attr("selected", true),
				// 	inputs.filter(selector).attr("checked", true)				
				// }

				var dom;
				for (var i = 0; i < inputs.length && arr.length > 0; i++) {
					dom = inputs[i];
					for (var j = 0; j < arr.length; j++) {
						if(dom.value === arr[j]){
							dom.checked = true;
							arr.splice(j, 1);
							break;
						}
					};
				};				
				setTimeout(function(){
					for (var i = 0; i < tags.length && arr2.length > 0; i++) {
						dom = tags[i];
						for (var j = 0; j < arr2.length; j++) {
							if(dom.value === arr2[j]){
								dom.selected = true;
								arr2.splice(j, 1);
								break;
							}
						};
					};
				}, 0)
			}

			this.update();
			// var et = new Date().getTime();
			// console.log("Selected options - " + (et - bt) + "ms");
		},
		
		// toggle selector state
		disableSelector: function(state){
			this.close(),
			this.selector.toggleClass("selector-disabled", state === true),
			this.disabled = (state === true)
		},
		
		// toggle options state
		disableOptions: function(values, state){
			if(values === undefined || values === null) return;
			
			var inputs = this.inputs, 
				tags = this.element.find('option'), 
				arr = ("" + values).split(","), 
				arr2 = arr.slice(0),
				dom;

			for (var i = 0; i < inputs.length && arr.length > 0; i++) {
				dom = inputs[i];
				for (var j = 0; j < arr.length; j++) {
					if(dom.value === arr[j]){
						$(dom).attr("disabled", state === true).closest("label").toggleClass("item-disabled", state === true);
						arr.splice(j, 1);
						break;
					}
				};
			};
			setTimeout(function(){
				for (var i = 0; i < tags.length && arr2.length > 0; i++) {
					dom = tags[i];
					for (var j = 0; j < arr2.length; j++) {
						if(dom.value === arr2[j]){
							dom.disabled = (state === true);
							arr2.splice(j, 1);
							break;
						}
					};
				};
			}, 0)			
		},
		
		// set width of selector
		setSelectorWidth: function(){
			var w = this.options.width;				
			if( /\d/.test(w) && w >= this.minWidth ){
				this.input.width( w );
			}			
		},
	
		// set width of menu
		setMenuWidth: function(){
			var m = this.menu,
				width = this.input.outerWidth()-
					parseInt(m.css('padding-left'),10)-
					parseInt(m.css('padding-right'),10)-
					parseInt(m.css('border-right-width'),10)-
					parseInt(m.css('border-left-width'),10);
					
			m.width( width || this.input.outerWidth() );
		},
						
		cacheData: function(){
			// each list item
			this.items = this.checkboxContainer.find("li:not(.group-line)");
			
			// cache options
			this.cache = this.element.children().map(function(){				
				return $(this).map(function(){
					return this.innerHTML.toLowerCase();
				}).get();
			}).get();
		},
	
		getInputValue: function(){
			return $.trim(this.input.val());
		},
		
		// filter options
		_filter: function(e){
			var term = this.getInputValue(), items = this.items, inputs = this.inputs, cache = this.cache;
			
			if( !term ){
				items.show();
			} else {
				items.hide();
				
				var regex = new RegExp(term.toLowerCase().replace(this.escape, "\\$&"), 'gi');
				
				this._trigger("filter", e, $.map(cache, function(v, i){
					if( v.search(regex) !== -1 ){
						items.eq(i).show();
						return inputs.get(i);
					}					
					return null;
				}));
			}
			
			if(!this.isOpen){
				if(!term && inputs.filter(':checked').length > 0){
					this.update();
				}
				this.open();
			}
		},	
		
		// move up or down within the menu
		_traverse: function( which, start ){
			var $start = $(start),
				moveToLast = which === 38 || which === 37,				
				// select the first li that isn't an optgroup label / disabled
				$next = $start.parent()[moveToLast ? 'prevAll' : 'nextAll'](':not(.item-disabled, .group-line)')[moveToLast ? 'last' : 'first']();
			
			// if at the first/last element
			if( !$next.length ){
				var $container = this.menu.find('ul:last');			
				// move to the first/last
				$container.find('label')[ moveToLast ? 'last' : 'first' ]().trigger('mouseover');			
				// set scroll position
				$container.scrollTop( moveToLast ? $container.height() : 0 );			
			} else {
				$next.find('label').trigger('mouseover');
			}
		},
		
		// @see jquery.ui.widget.js
		_trigger: function( type, event, data ) {
			var prop, orig,
				callback = this.options[ type ];

			data = data || {};
			event = $.Event( event );
			event.type = ( type === this.eventPrefix ?
				type :
				this.eventPrefix + type ).toLowerCase();
			
			// the original event may come from any element
			// so we need to reset the target on the new event
			event.target = this.element[ 0 ];

			// copy original event properties over to the new event
			orig = event.originalEvent;
			if ( orig ) {
				for ( prop in orig ) {
					if ( !( prop in event ) ) {
						event[ prop ] = orig[ prop ];
					}
				}
			}
			
			//使用trigger()时，在IE6下，选其它选项时，会把element的第一项也选中，未知原因
			this.element.trigger( event, data );

			return !( $.isFunction(callback) && callback.call( this.element[0], event, data ) === false || event.isDefaultPrevented() );				
			
		}
		
	};
	
	//对外接口
	$.extend($.fn, {
		/**
		 * 获取选取的text，多个以","号分隔
		 */
		getSelectedText: function(){
			var selector = this.data("selector");
			return selector ? (selector.getSelectedText() || "") : ""
		},
		/**
		 * 获取选取的value，多个以","号分隔
		 */
		getSelectedValue: function(){
			var selector = this.data("selector");
			return selector ? (selector.getSelectedValue() || "") : ""
		},
		/**
		 * 设置下拉框默认选中项
		 * a, 选项的value，多个以","分隔，为空字符串时即清空选取项
		 */
		setSelectedOptions: function(a){
			var selector = this.data("selector");
			return selector && selector.setSelectedOptions(a), this
		},
		/**
		 * 设置下拉框可用状态
		 * a, true时为不可用
		 */
		disableSelector: function(a){
			var selector = this.data("selector");
			return selector && selector.disableSelector(a), this
		},
		/**
		 * 刷新下拉框UI（动态添加选项后使用）
		 */
		refreshSelector: function(){
			var selector = this.data("selector");
			return selector && (selector.build(), selector.cacheData()), this
		},
		/**
		 * 设置选项可用状态
		 * a, 选项的value，多个以","号分隔
		 * b, true时为不可用
		 */
		disableOptions: function(a, b){
			var selector = this.data("selector");
			return selector && selector.disableOptions(a, b), this
		}
	});
	
})(jQuery);	
