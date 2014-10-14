angular.module('ioki.fatscroll')
    .factory('fatscrollsService', function () {
        'use strict';

        var fatscrollsService = {
            fatscrolls: [],

            getFatscrolls: function () {
                return fatscrollsService.fatscrolls;
            },

            getFatscroll: function (name) {
                for (var i = 0, len = fatscrollsService.fatscrolls.length; i < len; i++) {
                    if (fatscrollsService.fatscrolls[i].name === name) {
                        return fatscrollsService.fatscrolls[i].scope;
                    }
                }

                return null;
            },

            addFatscroll: function (name, scope) {

                if (name !== undefined && scope !== undefined) {
                    fatscrollsService.fatscrolls.push({
                        name: name,
                        scope: scope
                    });
                }

            },

            moveMeTo: function (name, element, additionalOffset) {
                var scroll = fatscrollsService.getFatscroll(name);

                if (scroll !== null) {
                    scroll.scrollTo(element, additionalOffset);
                }

            }
        };

        return fatscrollsService;
    });

