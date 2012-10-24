/*!
 * jQuery Disabler
 * Author: Doug Estep.
 * Version 1.0.0
 * 
 * API Documention:
 *   http://dougestep.com/jquery-disabler/1/docs/api/
 * 
 * Depends:
 *   jquery 1.7.2 +
 *   jquery-ui 1.8.20 using the following plugins.
 *     jQuery UI widget factory
 *     Datepicker
 */
(function($, undefined) {
	var classDisablerIgnoreReadOnly = "disabler-ignore-readonly";
	var classDisablerHideReadOnly = "disabler-hide-readonly";
	var classDisablerShowTextReadOnly = "disabler-show-text-readonly";
	var classPanelsDatePicker = "panels-date-picker";
	var classDisabled = "ui-state-disabled";
	var classReadOnlyText = "disabler-read-only-text";
	var classReadOnlyRemoveMe = "disabler-read-only-remove-me";
	var dataReadOnlyByDisabler = "disabler-read-only";
	var dataHiddenInputs = "disabler-hidden-inputs";
	var dataAnchorHref = "disabler-anchor-href";
	var dataSavedEvents = "disabler-saved-events";
	var dataReadOnlyDisplay = "data-disabler-read-only-display";
	
	$.widget("dtg.disabler", {
		// default options
		options: {
			// supply true to disable the contents of the plugin; false to enable.
			disable : false,
			// supply true to set all inputable columns within the plugin to read-only.
			readonly : false,
			
			/**
			 * Event fired before the contents is disabled or enabled.
			 * @param event null is always passed.
			 * @param data an object containing the following values:
			 * 	{
			 * 		containerId: the ID representing the container to disable.
			 * 		disabledFlag If true, a disable transaction happened. If false, a prior disable transaction was reversed.  
			 * 		element : this.element;
			 * 	}
			 * @return return true to continue with the function; false to not continue with the function.  
			 */ 
			beforeDisable : function(event, data) {
				return true;
			},
			
			/**
			 * Event fired after the contents is disabled or enabled.
			 * @param event null is always passed.
			 * @param data an object containing the following values:
			 * 	{
			 * 		containerId: the ID representing the container to disable.
			 * 		disabledFlag If true, a disable transaction happened. If false, a prior disable transaction was reversed.  
			 * 		element : this.element;
			 * 	}
			 */ 
			afterDisable : function(event, data) {
			},
			
			/**
			 * Event fired before a container has been set to read-only or undone from a previous read-only call.
			 * @param event null is always passed.
			 * @param data an object containing the following values:
			 * 	{
			 * 		containerId: the ID representing the container to set to read-only.
			 * 		readOnlyFlag If true, the inputable columns were set to read-only. If false, a prior read-only function was reversed.
			 * 		useDefaults true if the readOnlyUseDefaults method was invoked; false if not.  
			 * 		element : this.element;
			 * 	}
			 * @returns true to continue with the operation; false to cancel.
			 */
			beforeReadOnly : function(event, data) {
				return true;
			},
			
			/**
			 * Event fired at the beginning of an iteration within the loop which is examining each input when doing 
			 * a readOnly function.
			 * @param event null is always passed.
			 * @param data an object containing the following values:
			 * 	{
			 * 		input : the input control being examined.
			 * 		index : the index within the loop. Starts with zero.
			 * 		containerId: the ID representing the container to set to read-only.
			 * 		readOnlyFlag If true, the inputable columns were set to read-only. If false, a prior read-only function was reversed.
			 * 		useDefaults true if the readOnlyUseDefaults method was invoked; false if not.  
			 * 		element : this.element;
			 * 	}
			 * @returns true to continue with the operation; false to cancel.
			 */
			readOnlyIteration : function(event, data) {
				return true;
			},
			
			/**
			 * Event fired after a container has been set to read-only or undone from a previous read-only call.
			 * @param event null is always passed.
			 * @param data an object containing the following values:
			 * 	{
			 * 		containerId: the ID representing the container to set to read-only.
			 * 		readOnlyFlag If true, the inputable columns were set to read-only. If false, a prior read-only function was reversed.  
			 * 		element : this.element;
			 * 	}
			 */ 
			afterReadOnly : function(event, data) {
			},
			
			/**
			 * Event fired after all input controls that have been flagged to be hidden upon a read-only operation have been successfully hidden.
			 * @param event null is always passed.
			 * @param data an object containing the following values:
			 * 	{
			 * 		containerId: the ID representing the container which contains the input controls that have been hidden.  The ID has been properly escaped.
			 * 		hiddenInput an array containing all input controls that have been hidden.  
			 * 		element : this.element;
			 * 	}
			 */
			processHiddenInputsReadOnly : function(event, data) {			
			},
			
			/**
			 * Event fired at the end of each iteration through all hidden input controls after the control as been unhidden.
			 * @param data an object containing the following values:
			 * 	{
			 * 		containerId: the ID representing the container which contains the input controls to unhide.  The ID has been properly escaped.
			 * 		hiddenInput an array containing all input controls that were previously hidden.  
			 * 		element : this.element;
			 * 	}
			 */
			processHiddenInputsNotReadOnlyIteration : function(event, data) {				
			}
		},
		
		_create : function() {
			this._initOptions();
			
			if (this.options.disable) {
				this._setOption("disable", this.options.disable);
			}
			if (this.options.readonly) {
				this._setOption("readonly", this.options.readonly);
			}
		},
		
		_initOptions : function() {
			this.options.disable = this._ensureBoolean(this.options.disable);
			this.options.readonly = this._ensureBoolean(this.options.readonly);
		},
		
		_ensureBoolean : function(value) {
			var bool = false;
			if (this._isNotNullAndNotUndefined(value)) {
				var flag = new String(value).toLowerCase();
				bool = flag == "true";
			}
			return bool;
		},
		
		_setOption: function( key, value ) {	
			this._initOptions();
			this.options[ key ] = value;
			
			var panelId = this.element.attr("id");
			switch (key) {
			case 'disable':
				this._doDisable(panelId, value);
				break;
			case 'readonly':
				this.readOnly(panelId, this.options.readonly);
				break;
			}
		},
		
		_getIdOrBust : function(id) {
			if (this._isNullOrUndefined(id)) {
				id = this.element.attr("id");
			}
			if (this._isNullOrUndefined(id) || $.trim(id).length == 0) {
				throw "You must supply an ID value or the container in which this plugin is acting against must have an \"id\" attribute with value. You supplied " + id;
			}
			return id;
		},
		
		/**
		 * Enables the inputable columns within the supplied container.
		 * @param containerId the ID representing the container to set to enable. Set to null or undefined to enable the entire 
		 * container in which this plugin is acting against.  An exception will be thrown if this value is null or 
		 * undefined and the container in which this plugin is acting against doesn't have an ID attribute with a value.
		 */
		enable : function(containerId) {
			containerId = this._getIdOrBust(containerId);
			this._doDisable(containerId, false);
		},
		
		/**
		 * Disables the inputable columns within the supplied container.
		 * @param containerId the ID representing the container to set to disable. Set to null or undefined to diable the entire 
		 * container in which this plugin is acting against.  An exception will be thrown if this value is null or 
		 * undefined and the container in which this plugin is acting against doesn't have an ID attribute with a value.
		 */
		disable : function(containerId) {
			containerId = this._getIdOrBust(containerId);
			this._doDisable(containerId, true);
		},
		
		_doDisable : function(containerId, disabled) {
			var escapedId = this._escape(containerId);
			var continueDisable = this._trigger("beforeDisable", null, {
				'containerId' : escapedId,
				'disabledFlag' : disabled,
				'element' : this.element
			});
			
			if (continueDisable) { 
				if (disabled) {
					this.readOnlyUseDefaults(containerId, true);
					$("#" + escapedId).addClass("ui-state-disabled");
				} else {
					$("#" + escapedId).removeClass("ui-state-disabled");
					this.readOnlyUseDefaults(containerId, false);
				}
				
				this.options.disable = disabled;
				
				this._trigger("afterDisable", null, {
					'containerId' : escapedId,
					'disabledFlag' : disabled,
					'element' : this.element
				});
			}
		},
		
		/**
		 * Sets the inputable columns contained with the supplied container to read-only, disables buttons, and unbinds all events.
		 * Warning: this method can be expensive for very busy panels because it has to traverse the entire DOM to unbind all
		 * events. Use with caution.
		 * @param containerId the ID representing the container to set to read-only. Set to null or undefined to set the entire 
		 * container in which this plugin is acting against to read-only.  An exception will be thrown if this value is null or 
		 * undefined and the container in which this plugin is acting against doesn't have an ID attribute with a value.
		 * @param readOnlyFlag set to true to set to read-only.  Set to false to undo the read-only 
		 * columns set by this function, to enable the buttons, and bind the events back.  Setting this parameter to false will 
		 * not remove the read-only attribute of a column that was not set to read-only by this function.
		 */
		readOnly : function(containerId, readOnlyFlag) {
			containerId = this._getIdOrBust(containerId);
			readOnlyFlag = this._defaultReadOnlyFlag(readOnlyFlag);
			this._doReadOnly(containerId, readOnlyFlag, false);
		},
		
		_defaultReadOnlyFlag : function(readOnlyFlag) {
			if (readOnlyFlag == undefined) {
				readOnlyFlag = true;
			}
			return readOnlyFlag;
		},
		
		/**
		 * Sets the inputable columns contained with the supplied container to read-only, disables buttons, and unbinds all events.
		 * This method ignores requests to hide inputs as well as show text only.
		 * Warning: this method can be expensive for very busy content because it has to traverse the entire DOM to unbind all
		 * events. Use with caution.
		 * @param containerId the ID representing the container to set to read-only. Set to null or undefined to set the entire 
		 * container in which this plugin is acting against to read-only.  An exception will be thrown if this value is null or 
		 * undefined and the container in which this plugin is acting against doesn't have an ID attribute with a value.
		 * @param readOnlyFlag set to true to set to read-only.  Set to false to undo the read-only 
		 * columns set by this function, to enable the buttons, and bind the events back.  Setting this parameter to false will 
		 * not remove the read-only attribute of a column that was not set to read-only by this function.
		 */
		readOnlyUseDefaults : function(containerId, readOnlyFlag) {
			containerId = this._getIdOrBust(containerId);
			readOnlyFlag = this._defaultReadOnlyFlag(readOnlyFlag);
			this._doReadOnly(containerId, readOnlyFlag, true);
		},
		
		_doReadOnly : function(containerId, readOnlyFlag, useDefaults) {
			var escapedId = this._escape(containerId);
			var continueReadOnly = this._trigger("beforeReadOnly", null, {
				'containerId' : escapedId,
				'readOnlyFlag' : readOnlyFlag,
				'useDefaults' : useDefaults,
				'element' : this.element
			});
			if (!continueReadOnly) { return; }		
			
			if (readOnlyFlag == undefined || this.element.hasClass(classDisabled)) {
				// the element is disabled
				return;
			}
			
			var hiddenInputs = [];
			var selector = this._formatSelectorForContainerId(escapedId);
			var topElement = $(selector);
			if (topElement.length == 0) { return; }
			
			if (this._isInputControl(topElement)) {
				this._doReadOnlyIteration(topElement, readOnlyFlag, hiddenInputs, useDefaults);
			}
			
			var plugin = this;
			topElement.find("*").each(function(index) {
				var inp = $(this);
				var continueIteration = plugin._trigger("readOnlyIteration", null, {
					'input' : inp,
					'index' : index,
					'containerId' : escapedId,
					'readOnlyFlag' : readOnlyFlag,
					'useDefaults' : useDefaults,
					'element' : plugin.element
				});
				if (!continueIteration) {
					return true;
				}
				var inputDisabler = inp.data("disabler");
				if (inputDisabler != undefined) {
					// Ignore this input because it has a disabler of it's own acting on it. 
					return true;
				}
				
				plugin._doReadOnlyIteration(inp, readOnlyFlag, hiddenInputs, useDefaults);
			});
			
			this._processHiddenInputsOnReadOnly(escapedId, readOnlyFlag, hiddenInputs);

			this.options.readonly = readOnlyFlag;
			
			// fire user event
			this._trigger("afterReadOnly", null, {
				'containerId' : escapedId,
				'readOnlyFlag' : readOnlyFlag,
				'useDefaults' : useDefaults,
				'element' : this.element
			});
		},
		
		_isInputControl : function(element) {
			var type = this._whatTypeAmI(element);
			return type == "a" || type == "submit" || type == "button" 
				|| type == "select" || type == "checkbox" 
				|| type == "radio" || type == "text" 
				|| type == "textarea";
		},
		
		_whatTypeAmI : function(inp) {
			var type = inp.attr("type");
			if (type == undefined) {
				if (inp[0] == undefined) {
					type = "";
				} else {
					type = inp[0].tagName;
				}
			}
			return type.toLowerCase();
		},
		
		_doReadOnlyIteration : function(inp, readOnlyFlag, hiddenInputs, useDefaults) {
			if (readOnlyFlag) {
				this._turnReadOnlyOn(inp, hiddenInputs, useDefaults);
			} else {
				this._turnReadOnlyOff(inp);
			}
		},
		
		_turnReadOnlyOn : function(inp, hiddenInputs, useDefaults) {
			var type = this._whatTypeAmI(inp);
			if (inp.data(dataReadOnlyByDisabler) != undefined) { 
				// this element has already been set to read-only by this plugin
				return; 
			}
			if (inp.attr("readonly") != undefined || inp.attr("disabled") != undefined) { 
				// this element is already read-only or disabled outside the control of this plugin
				return; 
			}
			if ((inp.hasClass("hasDatepicker") || inp.hasClass(classPanelsDatePicker)) && inp.datepicker("option", "disabled")) { 
				// this element is controlled via the datepicker widget and has been disabled outside the control of this plugin
				return; 
			}
			
			inp.data(dataReadOnlyByDisabler, true);
			
			if (!useDefaults) {
				if (inp.hasClass(classDisablerIgnoreReadOnly)) {
					// marked to ignore
					return;
				}
				if (inp.hasClass(classDisablerHideReadOnly)) {
					// keep record of what is being hidden in order to unhide later
					hiddenInputs.push(inp);
					inp.hide();
					return;
				}
				
				if (inp.hasClass(classDisablerShowTextReadOnly)) {
					this._showTextReadOnly(inp, type);
					return;
				} 
			}
			
			if (type == "a") {
				this._disableLink(inp);
			} else if (type == "submit" || type=="button") {
				inp.attr("disabled", "true");
			} else if (type == "select" || type=="checkbox" || type=="radio") {
				this._disableEvents(inp);
				inp.attr("disabled", "true");
			} else if (inp.hasClass("hasDatepicker") || inp.hasClass(classPanelsDatePicker)) {
				inp.attr("disabled", "true");
				inp.datepicker("disable");
			} else if (type == "text" || type == "textarea") {
				inp.attr("readonly", "readonly");
				inp.attr("disabled", "true");
			} else {
				this._disableEvents(inp);
			}
		},
		
		_showTextReadOnly : function(inp, type) {
			var overrideText = "";
			var text = "";
			if (type == "a") {
				text = inp.text();
			} else if (type == "text" || type == "textarea") {
				text = inp.val();
			} else if (type == "radio" || type == "checkbox") {
				if (inp.attr("checked") != undefined) {
					// check for data attribute specifying what to display when readonly
					text = inp.attr(dataReadOnlyDisplay);
					if (text == undefined) {
						// no value specified. take value of element.
						text = inp.val();
					}
					// Check if the parent container has the data attribute specifying what to display when readonly
					overrideText = inp.parent().attr(dataReadOnlyDisplay);
					if (overrideText != undefined) {
						text = overrideText;
					}
				}				
			} else if (type == "select") {
				var options = [];
				// loop through SELECT options in the event of multiselect = true
				inp.find('option:selected').each(function(index) {
					var option = $(this);
					// check for data attribute specifying what to display when readonly
					var optionText = option.attr(dataReadOnlyDisplay);
					if (optionText == undefined) {
						optionText = option.text();
					}
					options.push(optionText);
				});
				// return comma-delimeted list of text values
				text = options.join(", ");
			}  
			
			// wrap a SPAN around the input in order to find all elements affected by this operation
			inp.wrap('<span class="' + classReadOnlyText + '"></span>');
			inp.parent("span." + classReadOnlyText).data(dataReadOnlyByDisabler, true); 
			
			// wrap a SPAN around the text being displayed and place the SPAN beside the element.  This SPAN will be removed when this operation is undone.
			inp.parent().after('<span class="' + classReadOnlyRemoveMe + '">' + text + '</span>');
			
			// hide the element
			inp.hide();
		},
		
		_turnReadOnlyOff : function(inp) {
			if (inp.data(dataReadOnlyByDisabler) == undefined) { 
				// if the element was set to read-only by this plugin, ignore
				return; 
			}
			
			inp.removeData(dataReadOnlyByDisabler);
			if (inp.hasClass(classReadOnlyText)) {
				// remove the SPAN surrounding the text of the element being displayed
				var span = inp.next('span.' + classReadOnlyRemoveMe);
				span.remove();
				
				// unwrap the SPAN element put around the element by this plugin
				var child = inp.children();
				child.unwrap();
				// show the previously hidden element
				child.show();
				return;
			}
			
			var type = this._whatTypeAmI(inp);
			if (type == "a") {
				this._enableLink(inp);
			} else if (type == "submit" || type=="button") {
				inp.removeAttr("disabled");
			} else if (type == "select" || type=="checkbox" || type=="radio") {
				this._enableEvents(inp);
				inp.removeAttr("disabled");
			} else if (inp.hasClass("hasDatepicker") || inp.hasClass(classPanelsDatePicker)) {
				inp.removeAttr("disabled");
				inp.datepicker("enable");
			} else if (type == "text" || type == "textarea") {
				inp.removeAttr("readonly");
				inp.removeAttr("disabled");
			} else {
				this._enableEvents(inp);
			}
		},
		
		_processHiddenInputsOnReadOnly : function(containerId, readOnlyFlag, hiddenInputs) {
			var escapedId = this._escapeValue(this.element.attr("id"));
			if (readOnlyFlag) {
				if (hiddenInputs.length > 0) {
					// save hidden elements on the container to be unhidden later
					$("#" + escapedId).data(dataHiddenInputs, hiddenInputs);
				}
				
				this._trigger("processHiddenInputsReadOnly", null, {
					'containerId' : escapedId,
					'hiddenInput' : hiddenInput,
					'element' : this.element
				});
			} else {
				hiddenInputs = $("#" + escapedId).data(dataHiddenInputs);
				if (hiddenInputs != undefined) {
					// unhide previously hidden elements
					for (var i = 0; i < hiddenInputs.length; i++) {
						var hiddenInput = hiddenInputs[i];
						hiddenInput.show();
						
						this._trigger("processHiddenInputsNotReadOnlyIteration", null, {
							'containerId' : escapedId,
							'hiddenInput' : hiddenInput,
							'element' : this.element
						});
					}
					// remove the array from the container
					$("#" + escapedId).removeData(dataHiddenInputs);
				}
			}
		},
		
		_disableLink : function(inp) {
			// save all events
			this._disableEvents(inp);
			
			var href = inp.attr("href");
			if (href != undefined) {
				// save the HREF attribute value and remove the value
				inp.data(dataAnchorHref, href);
				inp.attr("href", "#");
			}
			
			// override all click events
			inp.on("click", function(e) {
				e.preventDefault();
			});
			
			inp.addClass(classDisabled);
		},
		
		_disableEvents : function(inp) {
			// jQuery adds an "events" data attribute on the element when events are registered
			var events = inp.data("events");
			if (events != undefined) { 			
				var savedEvents = [];
				// loop through each event found on the element...
				$.each(events, function(eventName, handlers) {
					// on each event, loop through each handler
				    $.each(handlers, function(index) {
				    	var handler = handlers[index];
				    	if (handler != undefined) {
				    		// save the event and handler
					    	var eventObj = {
					    		'eventName' : eventName, 
					    		'handler' : handler
					    	};
					    	savedEvents.push(eventObj);
				    	}
				    });
				});
				// store the saved events as a data attribute on the element
				inp.data(dataSavedEvents, savedEvents);
				
				// unbind all events
				inp.unbind();
			}			
		},
		
		_enableLink : function(inp) {
			// unbind event put on by disable function
			inp.unbind();
			
			// put back all events removed from the disableEvents step
			this._enableEvents(inp);
			
			// put back the HREF removed from the disableLink step
			var href = inp.data(dataAnchorHref);
			if (href != undefined) {
				inp.attr("href", href);
				inp.removeData(dataAnchorHref);
			}
			
			inp.removeClass(classDisabled);
		},
		
		_enableEvents : function(inp) {
			var savedEvents = inp.data(dataSavedEvents);
			if (savedEvents != undefined) { 
				// loop through each saved event and register events on element.
				$.each(savedEvents, function(index) {
					var savedEvent = savedEvents[index];
					var eventName = savedEvent.eventName;
					var handler = savedEvent.handler;
					inp.on(eventName, handler); 
				});
			}
		},
		
		_escape : function(containerId) {
			if (containerId == undefined) {
				containerId = this.element.attr("id");
			}
			return this._escapeValue(containerId);
		},
		
		_escapeValue : function(str) {
			str = str.replace(/\+/g,"\\+");
			str = str.replace(/\\/g,"\\");
			str = str.replace(/\//g,"\\/");
			str = str.replace(/!/g,"\\!");
			str = str.replace(/"/g,'\\"');
			str = str.replace(/#/g,"\\#");
			str = str.replace(/\$/g,"\\$");
			str = str.replace(/%/g,"\\%");
			str = str.replace(/&/g,"\\&");
			str = str.replace(/'/g,"\\'");
			str = str.replace(/\(/g,"\\(");
			str = str.replace(/\)/g,"\\)");
			str = str.replace(/\*/g,"\\*");
			str = str.replace(/,/g,"\\,");
			str = str.replace(/\./g,"\\.");
			str = str.replace(/:/g,"\\:");
			str = str.replace(/;/g,"\\;");
			str = str.replace(/\?/g,"\\?");
			str = str.replace(/@/g,"\\@");
			str = str.replace(/\[/g,"\\[");
			str = str.replace(/\]/g,"\\]");
			str = str.replace(/\^/g,"\\^");
			str = str.replace(/`/g,"\\`");
			str = str.replace(/\{/g,"\\{");
			str = str.replace(/\}/g,"\\}");
			str = str.replace(/\|/g,"\\|");
			str = str.replace(/\~/g,"\\~");
			
			return str;
		},
	
		_isNotNullAndNotUndefined : function(obj) {
			return obj != undefined && obj != null;
		},
		
		_isNullOrUndefined : function(obj) {
			return obj == null || obj == undefined;
		},
		
		_formatSelectorForContainerId : function(containerId) {
			var panelId = this._escapeValue(this.element.attr("id"));
			if (panelId == containerId) {
				containerId = null;
			}
			var selector = '#' + containerId + ' ';
			if (this._isNullOrUndefined(containerId)) {
				selector = '';
			}
			if (selector == '') {
				selector = '#' + panelId;
			} else {
				selector = '#' + panelId + ' ' + selector;
			}
			return selector + ' ';
		},
	});
	
	$.extend( $.dtg.disabler, {
		version: "1.0.0"
	});
}(jQuery));
