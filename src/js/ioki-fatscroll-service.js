angular.module('ioki.fatscroll')
    .factory('fatscrollsService', function () {
        'use strict';

        var fatscrollsService = {
            /* Array with all the scrolls */
            fatscrolls: [],

            /**
             *  Key:value map with elements to scroll on init [tocName: element]
             */
            savedPositionObject : {},

            /**
             * Method getFatscrolls
             *
             * @returns {*}
             */
            getFatscrolls: function () {
                return fatscrollsService.fatscrolls;
            },

            /**
             * Method getFatscroll
             *
             * Method gets the selected fatscroll from the list of fatscrolls
             *
             * @param name
             * @returns {*}
             */
            getFatscroll: function (name) {
                for (var i = 0, len = fatscrollsService.fatscrolls.length; i < len; i++) {
                    if (fatscrollsService.fatscrolls[i].name === name) {
                        return fatscrollsService.fatscrolls[i].scope;
                    }
                }

                return null;
            },

            /**
             * Method addFatscroll
             *
             * Method adds fatscroll as well as its scope
             * and it pushes it to the fatscrolls array
             *
             * @param name
             * @param scope
             */
            addFatscroll: function (name, scope) {

                if (name !== undefined && scope !== undefined) {
                    fatscrollsService.fatscrolls.push({
                        name: name,
                        scope: scope
                    });
                }

            },

            /**
             * Method moveMeTo
             *
             * Method gets the name of the fatscroll,
             * and moves it where specified according to element and additionalOffset
             *
             * @param name                  - name of the fatscroll
             * @param value                 - place to which scroll should move
             * @param additionalOffset      - optional additional offset
             */
            moveMeTo: function (name, value, additionalOffset) {
                var scroll = fatscrollsService.getFatscroll(name);

                if (scroll !== null) {
                    scroll.scrollTo(value, additionalOffset);
                }
            },

            /**
             * Method moveMeOnInit
             *
             * Method similar to moveTo but it wait for reinitialization of scrollbar
             * for example when you use expansible table of content
             * it jump when you click and scrollContentHeight.clientHeight changes
             *
             * @param name
             * @param element
             * @param offset [offset = 0]
             */
            moveMeToOnInit: function (name, element, offset) {
                this.savedPositionObject[name] = {element: element, offset: offset || 0};
            }
        };

        return fatscrollsService;
    });