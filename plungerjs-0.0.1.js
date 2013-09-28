//TODO: compactar o hash tipo "encurtar"
//TODO: testar com outras versões do jquery
//TODO: testar com outros 
(function (PlungerJs, $) {
	"use strict";

    var _init = false;

    var moduleUtils = {
        param: function ($element, name) {
            return $element.data(this.name + "-" + name);
        },
        target: function ($element) {
            var target = $element.attr('target');
            //TODO: implementar um retorno caso não encontre o local
            if (target == "_self") {
                return $element.parent();
            } else {
                return PlungerJs.$(target);
            }
        }
    }

    var moduleManager = new (function(){
		var modules = {}, ini = [];

        var getAction = function(module, action) {
			$.each(module, function (key, value) {
			    if ($.trim(action.toLowerCase()) == $.trim(key.toLowerCase())) {
					action = key;
					return;
				}
			});
			return module[action];
		};

        this.Add = function (name, module) {
            $.extend(module, moduleUtils);

			modules[$.trim(name).toLowerCase()] = module;
            if(module.init){
                ini.push(module);
            }
		};

        this.Call = function (params) {
            console.log(params);
		    var i, j;
		    if (!params.push) {
		        var n = [];
			    for (i = 0, j = arguments.length; i < j; i++) {
					n.push(arguments[i]);
				}
				params = n;
			}
			var module = modules[$.trim(params[0]).toLowerCase()];
			if (!module){
				return;
            }
			
			var action = getAction(module, params[1]);
            if(!action){
                return;
            }
            var args = params.splice(2, params.length);

			action.apply(module.module, args);
		};

		
		
        this.init = function(){
            $.each(ini, function(index, value){
                if(value.init){ 
                    value.init();
                }
            });
        };
	});

    $.extend(PlungerJs, {

		version: "0.0.1",

		base: undefined,

		extend: function () {
            $.each(arguments,function(index, module){
                if(!module.name){
                    throw "name not define in module";
                }
                moduleManager.Add(module.name, module);
            });
			
		},

		init: function (auto, base) {
			var caminho = $('script[src*="plungerjs"]').attr("src");
			if (auto && caminho.toLowerCase().indexOf("init=false") > -1) {
			    return;
			}
			if (_init) {
			    return;
			}
			
			_init = true;

			PlungerJs.base = base || $('body');

            moduleManager.init();
		},

		$ : function(query){
			return this.base.find(query);
		},


	});

	$(document).ready(function () {
		PlungerJs.init(true, $('body'));
	});


    /* principais */
    var unobstrusive = new (function () {
		var me = this, _init = false;

        this.name = "unobstrusive";
        
        var apply = function ($element) {
            $element.find('[data-type]').each(function () {
                moduleManager.Call($(this).data('type'), "render", $(this));
            });
        };

		this.init = function () {
		    if (_init) {
		        return;
		    }
            _init = true;
			$(PlungerJs.base).on('plungerUpdate', function (evt, $element) {
				apply($element);
				evt.preventDefault();
			});
			apply(PlungerJs.base);
		};

		(function( $, oldMethod ){
			$.fn.html = function(){
			    var retorno = oldMethod.apply(this, arguments);
				PlungerJs.base.trigger("plungerUpdate", [this]);
				return retorno;
			 };
		})( jQuery, jQuery.fn.html )

	});

	var route = new (function () {
	    var me = this, _init = false;
	    var pathHash, relativePath;

        this.name = "route";

		this.init = function(){
		    if (_init) {
		        return;
		    }
            _init = true;

			$(window).on('hashchange', function () {
				me.CallModule();
			});

			me.CallModule();
		};
		
		this.CallModule = function () {
		    ParsePath();

			$.each(pathHash, function (index, value) {
				moduleManager.Call(value.split('/'));
			});
		};

		var ParsePath = function() {
			var path = location.href.replace(window.location.origin, "");
			var pattern = /[\w/]+/g;
			var pHash = path.indexOf("#");
			pathHash = pHash >= 0 ? path.substring(pHash).match(pattern) : [];
			var pSubs = pHash >= 0 ? pHash : path.length;
			relativePath = $.trim(path.substring(0, pSubs)) || "/";
		};
		
	});

	var action = new (function () {
	    var me = this, _init = false;
        //TODO: remover este aplicar de evntos, pois pode ser muito "pesado"
	    var events = ["click"];

        this.name = "action";
        
		this.init = function() {
		    if (_init) {
		        return;
		    }
            _init = true;
			$.each(events, function(index, eventType){
                attachEvent(eventType);
            });
		};
		var attachEvent = function (eventType) {
            //TODO: registrar muitos eventos talvez pese na página
		    $(document).on(eventType, 'a[data-action]', function (evt) {
			    var type = $(evt.target).data('action');
				if (type) {
				    moduleManager.Call(type, evt.type, $(evt.target));
					evt.preventDefault();
					return;
				}
			});
        };

	});

    PlungerJs.extend(unobstrusive, route, action);

})(window.PlungerJs = window.PlungerJs || {}, jQuery);



/* modulos iniciais */
(function (PlungerJs, $) {
    "use strict";
	var link = new (function () {
	    var me = this;
        
		this.name = "link";

		var load = function($a) {
		    var $target = me.target($a);
			var options = {
				type: "GET",
                dataType : 'html',
				url: $a.attr('href'),
                cache: me.param($a, "cache"),
				success: function (data, status, xhr) {
                    var _data = $('<html />').html(data);
                    var content = $(_data).find('body').length > 0 ? $(_data).find('body').html() : data;
					$target.html(content);
				}
			};

			$.ajax(options);
		};

		this.click = function ($a) {
			load($a);
		};

		this.load = function (linkname) {
		    console.log(linkname);
		    var $a = PlungerJs.$('a[data-action="' + me.name + '"][id="' + linkname + '"]');
		    console.log($a);
			load($a);
		};
        this.render = function($a){
            load($a);
        }

        return this;

	})();

	PlungerJs.extend(link);

})(PlungerJs, jQuery);