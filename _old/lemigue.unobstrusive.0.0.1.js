//TODO: indicar (ou desindicar) os links que serão afetados pelo "select"
//TODO: pensar em como resolver um link que possa chamar mais de um hash e mesmo assim se manter ativo?? (será q é válido??)
//TODO: utilizar o parametro grupo apenas como um recurso "extra"
//TODO: verificar se consigo uma "alternativa" para o prametro name que estou passando pela tag a
//TODO: incluir algo que "bloqueiei" a inicialização pois alguns pontos não estão muito bem "corretos";
//TODO: implementar o contem para o hash também
//TODO: ver como implementar a inicialização pelo envento
//TODO: compactar o hash tipo "encurtar"

(function (lemigue, $) {

    $.extend(lemigue, {

        version: "0.0.1",
        //TODO: se deve ou não ficar "publico"??
        Unobstrusive: function () {
            var me = this;
            var isInit = false;
            var componentManager = new lemigue.ComponentManager();

            var route = new lemigue.RouteProvider();
            var link = new lemigue.Link();
           
            this.base = undefined;

            this.init = function () {
                if (isInit)
                    return;

                isInit = true;

                $(window).on('hashchange', function () {
                    route.CallComponent();
                });
                me.base = me.base || $('body');
                
                $(me.base).on('unobstrusiveUpdate', function (evt, $element) {
                    apply($element);
                    evt.preventDefault();
                });
                apply(me.base);
            };

            //TODO: talvez criar uma classe base que implemente estas questões de componentes para não ficar repetindo
            this.RegisterComponent = function (name, component, action) {
                componentManager.Add(name, component, action);
            };

            function apply($element) {
                $element.find('[data-type]').each(function () {
                    console.log($(this).data('type'));
                    componentManager.Call($(this).data('type'), $(this));
                });
            };
            
        },

        ComponentManager: function () {
            var components = {};
            this.Add = function (name, component, defaultAction) {
                if (!defaultAction)
                    defaultAction = "call";
                if (components[name.toLowerCase()])
                    throw "component name '" + name + "' alreay exist";

                components[name.toLowerCase()] = { component: component, defaultAction: defaultAction.toLowerCase() };
            };
            this.Call = function (params) {
                
                if (!params.push) {
                    var n = [];
                    for (var i = 0; i < arguments.length; i++) {
                        n.push(arguments[i]);
                    }
                    params = n;
                }

                if (!components[params[0]])
                    return;

                var component = components[params[0]];
                var defaultAction = getAction(component.component, component.defaultAction);
                var args = [];
                
                if (params.length > 1) {
                    var iArgs = 2;
                    var action = getAction(component.component, params[1]);
                    if (!action) {
                        action = defaultAction;
                        iArgs = 1;
                    }
                    for (var i = iArgs; i < params.length; i++) {
                        args.push(params[i]);
                    }
                }

                action.apply(component.component, args);
            };
            function getAction(component, action) {
                if (typeof (action) != "string")
                    return false;

                $.each(component, function (key, value) {
                    if (action.toLowerCase() == key.toLowerCase()) {
                        action = key;
                        return;
                    }
                });
                return component[action];
            }
        },

        RouteProvider: function () {
            var me = this;
            var componentManager = new lemigue.ComponentManager();
            var pathHash = undefined;
            var relativePath = undefined;
            
            function ParsePath() {
                var path = location.href.replace(window.location.origin, "");

                var pHash = path.indexOf("#");
                pathHash = pHash >= 0 ? path.toLowerCase().substring(pHash + 1).split("#") : [];

                var pSubs = pHash >= 0 ? pHash : path.length;

                relativePath = $.trim(path
                                        .substring(0, pSubs)
                                        .toLowerCase()
                                    ) || "/";
            };

            this.GetRelativePath = function () {
                if (!relativePath)
                    ParsePath();

                return relativePath;
            };
            this.GetPathHash = function () {
                if (!pathHash)
                    ParsePath();
                return pathHash;
            };

            this.RegisterComponent = function (name, component, action) {
                componentManager.Add(name, component, action);
            };

            this.CallComponent = function () {
                ParsePath()
                $.each(pathHash, function (index, value) {
                    componentManager.Call(value.split('/'));
                });
            }
        },

        Link: function () {
            var me = this;
            var componentManager = new lemigue.ComponentManager();

            //TODO: talvez criar uma classe base que implemente estas questões de componentes para não ficar repetindo
            this.RegisterComponent = function (name, component, action) {
                componentManager.Add(name, component, action);
            };

            function init() {
                $(document).on("click", 'a', function (evt) {
                    var type = $(evt.target).data('link-type');
                    if (type) {
                        componentManager.Call(type, $(evt.target));
                        evt.preventDefault();
                        return;
                    }
                });
            };

            init();
        }

    });

    $.extend($, {
        unobstrusive: new lemigue.Unobstrusive()
    });
    

})(window.lemigue = window.lemigue || {}, jQuery);

/* componentes para links */
(function (lemigue, $) {

    $.extend(lemigue, {
        LinkAjax: function () {
            var me = this;
            var name = "ajax";
            
            this.link = function ($a) {
                window.location.href = "#" + name + "/" + $a.data('link-name');
            };

            this.route = function (linkname) {
                var $a = $.unobstrusive.base.find('a[data-link-type="ajax"][data-link-name="' + linkname + '"]');
                var target = $($a.attr('target'));
                var options = {
                    type: "GET",
                    url: $a.attr('href'),
                    success: function (data, status, xhr) {
                        target.html(data);
                        $.unobstrusive.base.trigger("unobstrusiveUpdate", [target]);
                    }
                    //TODO: implementar os outros eventos
                };

                $.ajax(options);
            }
        }
    });

    //TODO: ver se consigo registrar dentro do componente ou utilizar alguma outra forma para realizar este tipo de registro
    //talvez ter uma classe base para se realizar o registro
    var linkAjax = new lemigue.LinkAjax();
    $.unobstrusive.link.RegisterComponent("ajax", linkAjax, "link");
    $.unobstrusive.route.RegisterComponent("ajax", linkAjax, "route");

})(lemigue, jQuery);

/* componentes unobstrusivos */
(function (lemigue, $) {
    $.extend(lemigue, {
        JQueryUI: function () {
            this.render = function ($element) {
                $element[$element.data('type-ui')]();
            };
            this.action = function ($a) {
                $element = $.unobstrusive.base.find($a.attr('target'));
                var path = $a.attr('href').split('/');
                $element[path[0]](path[1]);
            }
        }
    });

    var jQueryUI = new lemigue.JQueryUI();
    $.unobstrusive.RegisterComponent("jqueryui", jQueryUI, "render");
    $.unobstrusive.link.RegisterComponent("jqueryui", jQueryUI, "action");

})(lemigue, jQuery);



/* inicialização */
$(document).ready(function () {
    
    var caminho = $('script[src*="lemigue.unobstrusive"]').attr("src");
    if (caminho.toLowerCase().indexOf("init=false")) {
        return;
    }

    $.unobstrusive.init();


});

/*testes*/
if(QUnit){
    QUnit.log(function (details) {
        console.log("Log: ", details.result, details.message);
    });
}


