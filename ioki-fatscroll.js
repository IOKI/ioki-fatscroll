angular.module('ioki.fatscroll', [])
    .directive('fatscroll', ['$window', '$document', '$timeout', '$interval', 'fatscrollsService', function ($window, $document, $timeout, $interval, fatscrollsService) {
        'use strict';

        return {
            restrict: 'A',
            transclude: true,
            templateUrl: 'templates/ioki-fatscroll',
            scope: {
                alwaysvisible: '=',
                thumbheight: '=',
                hasrail: '=',
                adjustcontenttorail: '='
            },
            link: function (scope, element, attrs) {
                var bodyEl = $document.find('body'),
                    scrollWrapper,
                    scrollWrapperHeight,
                    scrollArea, scrollAreaEl,
                    scrollContentHeight;

                var thumb = element.find('thumb'), thumbHeight,
                    rail = element.find('rail');

                var scrollPos,
                    dragStartPos,
                    scrollAreaStartPosition,
                    touchStartPos = 0,
                    touchMoveOffset = 0,
                    valueToScroll = 0;

                var isFixed = scope.thumbheight ? true : false,
                    viewRatio,
                    hideTimeout,
                    reInitInterval;

                /* Add listeners */
                element.on('mousewheel', mousewheel);
                element.on('DOMMouseScroll', mousewheel);
                element.on('wheel', mousewheel);

                /* touch listeners */
                element.on('touchstart', touchStart);
                element.on('touchmove', touchWheel);
                element.on('touchend', touchEnd);

                thumb.on('mousedown touchstart', startDrag);
                rail.on('click', clickOnRail);

                /* Initialize */
                if (!!attrs.fatscrollDynamic) {
                    /*
                     Interval that looks for changes in fatscroll content container's height.
                     */
                    reInitInterval = $interval(function () {
                        /*
                         In this moment value of scrollContentHeight is cached (not refreshed, last known).
                         If scroll-content container changed its height we need to run reinitialization (scrollContentHeight will be updated in init function).
                         */
                        if (scrollContentHeight !== element.find('scroll-content')[0].clientHeight) {
                            /* Add all the scrolls and their scopes to the list  */
                            init(scrollPos);
                        }
                    }, 100);
                } else {
                    init();
                }

                /* DESTRUCTOR */
                scope.$on('$destroy', function () {
                    fatscrollsService.removeFatscroll(attrs.fatscrollName);
                    $interval.cancel(reInitInterval);

                    element.off('mousewheel', mousewheel);
                    element.off('DOMMouseScroll', mousewheel);
                    element.off('wheel', mousewheel);
                    element.off('touchstart', touchStart);
                    element.off('touchmove', touchWheel);
                    element.off('touchend', touchEnd);

                    thumb.off('mousedown touchstart', startDrag);
                    rail.off('click', clickOnRail);
                });

                /**
                 * Method init
                 *
                 * Method invokes addScrollToList and showScroll methods,
                 * gets all the necessary heights and elements,
                 * so the scrolls can work as intended
                 *
                 * @param {Number} [scrollToPos] - Optional scroll position after init.
                 */
                function init(scrollToPos) {
                    var savedPositionObject = fatscrollsService.savedPositionObject[attrs.fatscrollName];

                    scrollToPos = scrollToPos || 0;

                    /* Add all the scrolls and their scopes to the list  */
                    addScrollToList();
                    /* Show the scrolls */
                    showScroll();

                    /* get all the heights and elements needed */
                    scrollWrapper = element[0];

                    scrollArea = scrollWrapper.firstChild;
                    scrollAreaEl = element.find('scroll-area');

                    scrollContentHeight = element.find('scroll-content')[0].clientHeight;
                    scrollWrapperHeight = element.find('scroll-area')[0].clientHeight;

                    viewRatio = scrollWrapperHeight / scrollContentHeight;

                    bodyEl = $document.find('body');

                    /* Adjust thumb height to the content size */
                    calculateThumbHeight();

                    /* Check if there's enough content to scroll */
                    if (scrollContentHeight <= scrollWrapperHeight) {
                        thumb.css('display', 'none');
                        hideRail();
                    } else {
                        thumb.css('display', 'block');
                        showRail();
                    }

                    if (savedPositionObject) {
                        scrollTo(savedPositionObject.element, savedPositionObject.offset);
                        delete fatscrollsService.savedPositionObject[attrs.fatscrollName];
                    } else { // For IE9 bug
                        scrollTo(scrollToPos);
                    }
                }

                /**
                 * Method showRail
                 *
                 * Method show rail if is set, and also if rail is inside the
                 * scroll area it set up width to default
                 */
                function showRail() {
                    if (scope.hasrail) {
                        rail.css('display', 'block');

                        if (scope.adjustcontenttorail) {
                            scrollAreaEl.css('width', '');
                        }
                    }

                }

                /**
                 * Method hideRail
                 *
                 * Method hide rail, and also if rail is inside the
                 * scroll area it set up width to auto
                 */
                function hideRail() {
                    if (scope.hasrail) {
                        rail.css('display', 'none');

                        if (scope.adjustcontenttorail) {
                            scrollAreaEl.css('width', 'auto');
                        }
                    }
                }

                /**
                 * Method showScroll
                 *
                 * Method adds the class to the thumb in order to be visible
                 * then sets the timeout with the method that hides it,
                 * so if scroll is idle, it disappears, if you set attribute
                 * scroll can be always visible
                 */
                function showScroll() {
                    thumb.addClass('visible');
                    if (!scope.alwaysvisible) {
                        hideTimeout = $timeout(hideScroll, 1500);
                    }
                }

                /**
                 * Method hideScroll
                 *
                 * Method removes the class from the thumb, so it can disappear
                 */
                function hideScroll() {
                    thumb.removeClass('visible');
                }

                /**
                 * Method addScrollToList
                 *
                 * Method adds all the fatscrolls on the view
                 * as well as their scopes using service method
                 */
                function addScrollToList() {
                    var scrollName = attrs.fatscrollName,
                        searchScroll;

                    if (scrollName !== undefined) {
                        searchScroll = fatscrollsService.getFatscrolls().filter(function ( obj ) {
                            return obj.name === scrollName;
                        })[0];

                        if (!searchScroll) {
                            fatscrollsService.addFatscroll(scrollName, scope);
                        }
                    }
                }

                /**
                 * Method scrollTo
                 *
                 * Method responsible for all the scrolling
                 *
                 * @param value                        - place to which scroll should be moved
                 * @param additionalOffset             - optional additional offset
                 */
                function scrollTo(value, additionalOffset) {
                    var maxTop,
                        maxTopThumb = calculateMaxTop(),
                        newValue,
                        thumbHeight,
                        fixedThumb,
                        condition;

                    viewRatio = scrollWrapperHeight / scrollContentHeight;

                    /*
                     Cancel timeout every time the scroll moves,
                     so fading effects don't overlap each other
                     and then run showScroll method
                     */
                    $timeout.cancel(hideTimeout);
                    showScroll();

                    maxTop = parseInt(maxTopThumb / viewRatio, 10);

                    if (typeof value === 'string') {
                        value = parseInt(value, 10);
                    }

                    /*
                     If passed value is a DOM element - get its offset,
                     otherwise get the passed value
                     */
                    newValue = (typeof value !== 'number') ? value.offsetTop : value;

                    /*
                     Check if additionalOffset is a number value,
                     if not remain newValue as is
                     */
                    newValue = (typeof additionalOffset !== 'number') ? newValue: newValue + additionalOffset;

                    scrollPos = newValue;

                    thumbHeight = calculateThumbHeight();

                    /*
                     Calculation for fixed thumb, height of thumb is fixed so,
                     when you scroll, the scrollbar should move faster or slower,
                     depending on content
                     */
                    fixedThumb = newValue * viewRatio * ((scrollContentHeight)/(scrollContentHeight-scrollWrapperHeight))*(1-(thumbHeight/scrollWrapperHeight));

                    condition = isFixed ? fixedThumb > maxTopThumb : newValue > maxTop;

                    /*
                     Check if element is out of bounds,
                     if it is, set the thumb position in bounds
                     */
                    if (condition) {
                        thumb.css('top', maxTopThumb + 'px');
                        scrollArea.scrollTop = maxTop;
                    } else if (newValue < 0 || fixedThumb < 0) {
                        thumb.css('top', '0');
                        scrollArea.scrollTop = 0;
                    } else {
                        thumb.css('top', (isFixed ? fixedThumb : newValue * viewRatio) + 'px');
                        scrollArea.scrollTop = newValue;
                        valueToScroll = newValue;
                    }
                }

                /**
                 * Method touchStart
                 *
                 * Method executed on start action on touch devices
                 *
                 * @param ev
                 */
                function touchStart(ev) {
                    touchStartPos = ev.touches[0].pageY + valueToScroll;
                }

                /**
                 * Method touchEnd
                 *
                 * Method save last value on touch devices
                 *
                 */
                function touchEnd() {
                    valueToScroll = touchMoveOffset;
                }

                /**
                 * Method touchMove
                 *
                 * Method executed on every move on touch device
                 *
                 * @param ev
                 */
                function touchMove(ev){
                    touchMoveOffset = touchStartPos - ev.touches[0].pageY;

                    return touchMoveOffset;
                }


                /**
                 * Method mousewheel
                 *
                 * Method gets the delta from the scroll action
                 * then runs the scrollTo method
                 *
                 * @param ev
                 */
                function mousewheel(ev) {
                    /* Prevent from scrolling whole document */
                    ev.preventDefault();

                    var deltaY = ev.deltaY !== undefined ? ev.deltaY : ev.detail * 40;
                    scrollArea.scrollTop += deltaY;

                    scrollTo(scrollArea.scrollTop);
                }

                /**
                 * Method touchWheel
                 *
                 * Method gets the delta from the scroll action
                 * then runs the scrollTo method
                 *
                 * @param ev
                 */
                function touchWheel(ev) {
                    /* Prevent from scrolling whole document */
                    ev.preventDefault();

                    scrollArea.scrollTop = touchMove(ev);

                    scrollTo(scrollArea.scrollTop);
                }

                /**
                 * Method calculateThumbHeight
                 *
                 * Method returns thumb height depending on the ratio and the wrapper height
                 *
                 * @returns {number}
                 */
                function calculateThumbHeight() {
                    var thumbCalculatedHeight;

                    thumbCalculatedHeight = scope.thumbheight ? scope.thumbheight : viewRatio * scrollWrapperHeight;

                    thumb.css({ height: thumbCalculatedHeight + 'px' });

                    return thumbCalculatedHeight;
                }

                /**
                 * Method calculateMaxTop
                 *
                 * Method returns the max top position for the thumb,
                 * so it stops within viewport boundaries
                 *
                 * @returns {number}
                 */
                function calculateMaxTop() {
                    thumbHeight = calculateThumbHeight();

                    return scrollWrapperHeight - thumbHeight;
                }

                /**
                 * Method clickOnRail
                 *
                 * Method to move thumb after click on the rail
                 *
                 * @param ev
                 */
                function clickOnRail(ev) {
                    scrollTo(ev.layerY * ((scrollContentHeight-scrollWrapperHeight)/scrollWrapperHeight));
                }

                /**
                 * Method startDrag
                 *
                 * Method attaches listeners for dragging and stop dragging the thumb
                 * and gets the starting position for dragging
                 *
                 * @param ev
                 */
                function startDrag(ev) {
                    /* prevent text selection in IE */
                    document.onselectstart = function () { return false; };

                    dragStartPos = ev.pageY;
                    scrollAreaStartPosition = scrollArea.scrollTop;

                    $document.on('mousemove', dragTheThumb);
                    $document.on('mouseup', dragStop);
                }

                /**
                 * Method dragStop
                 *
                 * Method removes the event handler responsible for dragging
                 */
                function dragStop() {
                    /* turn on text selection in IE */
                    document.onselectstart = function () { return true; };

                    $document.off('mousemove', dragTheThumb);
                    $document.off('mouseup', dragStop);
                    bodyEl.removeClass('no-select');
                }

                /**
                 * Method dragTheThumb
                 *
                 * Method turns off the selection on the whole document
                 * and drags the thumb within the viewport
                 *
                 * @param ev
                 */
                function dragTheThumb(ev) {
                    thumbHeight = calculateThumbHeight();

                    bodyEl.addClass('no-select');

                    if (isFixed) {
                        scrollTo(scrollAreaStartPosition + ((ev.pageY - dragStartPos) / (calculateMaxTop() / (scrollContentHeight - scrollWrapperHeight))));
                    } else {
                        scrollTo(scrollAreaStartPosition + ((ev.pageY - dragStartPos) / viewRatio ));
                    }
                }

                scope.scrollTo = scrollTo;
            }
        };
    }]);
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
                        return fatscrollsService.fatscrolls[i];
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

            removeFatscroll: function (name) {
                var scroll = fatscrollsService.getFatscroll(name),
                    fatscrolls = fatscrollsService.getFatscrolls(),
                    index = fatscrolls.indexOf(scroll);

                if (index > -1) {
                    fatscrolls.splice(index, 1);
                }
            },

            getFatscrollScope : function (name) {
                var scroll = fatscrollsService.getFatscroll(name);

                return scroll.scope ? scroll.scope : null;
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
                var scrollScope = fatscrollsService.getFatscrollScope(name);

                if (scrollScope !== null) {
                    scrollScope.scrollTo(value, additionalOffset);
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
angular.module('ioki.fatscroll').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('templates/ioki-fatscroll',
    "<scroll-area>\n" +
    "    <scroll-content class=\"scroll-content\" ng-transclude></scroll-content>\n" +
    "</scroll-area>\n" +
    "<rail ng-show=\"hasrail\"></rail>\n" +
    "<thumb></thumb>"
  );

}]);
