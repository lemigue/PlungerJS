//TODO: indicar (ou desindicar) os links que serão afetados pelo "select"
//TODO: pensar em como resolver um link que possa chamar mais de um hash e mesmo assim se manter ativo?? (será q é válido??)
//TODO: utilizar o parametro grupo apenas como um recurso "extra"
//TODO: verificar se consigo uma "alternativa" para o prametro name que estou passando pela tag a
//TODO: incluir algo que "bloqueiei" a inicialização pois alguns pontos não estão muito bem "corretos";
//TODO: implementar o contem para o hash também

(function ($) {

    $.extend($, {
        unobstrusive: new (function () {
            this.version = "0.0.1";

            var me = this;
            var _isInit = false;

            this.prefix = "";
            this.base = undefined;
            
            this.init = function () {
                if (_isInit)
                    return;

                _isInit = true;

                if (!me.base)
                    me.base = $('body');

                me.linkajax.init();
                me.updateRoute();

            };

            this.updateRoute = function () {
                me.route.Reload();
                me.$.find('a').each(function () {
                    if (me.route.isActive($(this))) {
                        me.link.Select($(this));
                    }
                });
                me.route.callRouteComponent();
            };

        })
    });

    //stilos
    $.extend($.unobstrusive, {
        css: {
            selected: "selected"
        },
        getCss: function (style) {
            return $.unobstrusive.prefix + style;
        }
    });

    /*route*/
    $.extend($.unobstrusive, {
        route: new (function () {
            var me = this;
            this._relativePath = undefined;
            this._pathHash = undefined;
            this._components = new ComponentManager();

            this._init = function () {                
                var relativePath = location.href.replace(window.location.origin, "");

                var pHash = relativePath.indexOf("#");
                if (pHash >= 0) {
                    this._pathHashs = relativePath.toLowerCase().substring(pHash + 1).split("#");
                }
                var pSubs = pHash >= 0 ? pHash - 1 : relativePath.length;
                
                this._relativePath = $.trim(
                                        relativePath
                                        .substring(0, pSubs)
                                        .toLowerCase()
                                    );

                if (this._relativePath == "")
                    this._relativePath = "/";

            };
            this.Reload = function () {
                this._init();
            }
            this.isActive = function ($a) {
                var b = this._checkLink($a);
                return b ? b : this._checkContain($a);
            }

            this._checkLink = function ($a) {
                var link = $a.attr('href');
                return link == undefined ? false : this._checkUrl(link);
            }
            this._checkUrl = function (link) {
                var b = $.trim(link).toLowerCase() == this._relativePath;
                return b ? b : this._checkHash(link);
            }
            this._checkHash = function (link) {
                var b = this._pathHashs ? ('#' + this._pathHashs.join('#')).toLowerCase() == link : false;
                return b;
            }
            this._checkContain = function ($a) {
                var link = "";
                if ($a.data('route-contains') != undefined)
                    link = $.trim($a.data('route-contains')).toLowerCase();

                return link != "" && this._relativePath.indexOf(link) == 0;
            };

            this.registreComponent = function (initRoute, component) {
                this._components.Add(initRoute, component, "default");
            };

            this.callRouteComponent = function () {
                if (!this._pathHashs || this._pathHashs.length <= 0)
                    return;
                this._pathHashs.forEach(function (value, index) {
                    me._components.Call.apply(me._components, value.split("/"));
                });
            };

        })
    });
    
    
    /*selected link*/
    $.extend($.unobstrusive, {
        link : new (function () {
            var me = this;

            this._cssSelected = function () {
                return $.unobstrusive.getCss($.unobstrusive.css.selected);
            };
        
            this.Select = function ($a) {
                if ($a.data('link-noselect'))
                    return;
                var group = this.Group($a);
                group.find("> a").removeClass(this._cssSelected());
                $a.addClass(this._cssSelected());
            };

            this.Group = function ($a) {
                if ($a.data('link-group'))
                    return $.unobstrusive.base.find('a[data-link-grou="' + $a.data('link-group') + '"]');
                else
                    return $($a).parent().siblings('li');
            }
        })
    });
    
    /* link ajax */
    $.extend($.unobstrusive, {
        linkajax : new(function() {
            var name = "link";
            var link = $.unobstrusive.link;//TODO: tentar remover esta dependencia
            this.init = function () {
                $(document).on("click", 'a[data-link-type="ajax"]', function (evt) {
                    evt.preventDefault();
                    var linkName = $(evt.target).data('link-name');
                    window.location.href = "#" + name + "/" + linkName;
                });
                $.unobstrusive.route.registreComponent(name,this);
            };
            this.default = function (linkName) {
                
                var $a = $.unobstrusive.base.find('a[data-link-type="ajax"][data-link-name="' + arguments[0] + '"]');
                var target = $($a.attr('target'));
                console.log($a.attr('href'));
                var options = {
                    type: "GET",
                    url: $a.attr('href'),
                    success: function (data, status, xhr) {
                        link.Select($a);
                        target.html(data);
                    }
                    //TODO: implementar os outros eventos
                };

                $.ajax(options);

            };
        })
    });


    function ComponentManager() {
        this._components = {};
        this.Add = function (name, component, defaultAction) {
            if (!defaultAction)
                defaultAction = "call";
            if (this._components[name.toLowerCase()])
                throw "component name '" + name + "' alreay exist";

            this._components[name.toLowerCase()] = { component: component, defaultAction: defaultAction.toLowerCase() };
        };
        this.Call = function () {
            var component = this._components[arguments[0]];
            if (!component)
                return;
            var action = component.component[component.defaultAction];
            var args = [];

            if (arguments.length > 1) {
                var iArgs = 1;
                if (component.component[arguments[1]]) {
                    action = component.component[arguments[1]];
                    iArgs = 2;
                }
                for (var i = iArgs; i < arguments.length; i++) {
                    args.push(arguments[i]);
                }
            }
            console.log('aqui');
            action.apply(component.component, args);
        }
    }
    //TODO: não inicializar automaticamente??
    $(document).ready($.unobstrusive.init);
    $(window).on('hashchange', $.unobstrusive.updateRoute);

})(jQuery);


//7,90 KB (8.094 bytes) - 8,00 KB (8.192 bytes)