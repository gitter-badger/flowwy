define(function (require, exports, module) {

        var Modifier        = require('famous/core/Modifier');
        var Surface         = require('famous/core/Surface');
        var OptionsManager  = require('famous/core/OptionsManager');
        var RenderNode      = require('famous/core/RenderNode');
        var Transform       = require('famous/core/Transform');
        var Utility         = require('famous/utilities/Utility');
        var Transitionable  = require('famous/transitions/Transitionable');
        var TransitionableTransform = require('famous/transitions/TransitionableTransform');
        var Easing          = require('famous/transitions/Easing');
        
        function Box(options) {
            this.options = Object.create(Box.DEFAULT_OPTIONS);
            this._optionsManager = new OptionsManager(this.options);

            if (options) this.setOptions(options);

            this._showing = false;
            this.nodes = [];
            this.transforms = [];
            this.states = [];
        }
        // inTransform => showTransform
        // showTransform => outTransform
        Box.DEFAULT_OPTIONS = {
            inTransform: Transform.scale(0.001, 0.001, 0.001),
            inOpacity: 0,
            inOrigin: [0.5, 0.5],
            outTransform: Transform.scale(0.001, 0.001, 0.001),
            outOpacity: 0,
            outOrigin: [0.5, 0.5],
            showTransform: Transform.identity,
            showOpacity: 1,
            showOrigin: [0.5, 0.5],

            inTransition: true, //second param in set
            outTransition: true, //second param in set
            overlap: false
        };
         /**
         * Patches the Lightbox instance's options with the passed-in ones.
         *
         * @method setOptions
         * @param {Options} options An object of configurable options for the Lightbox instance.
         */
        Box.prototype.setOptions = function setOptions(options) {
            return this._optionsManager.setOptions(options);
        };
        Box.prototype.addRenderable = function(renderable) {
            this._transform = new TransitionableTransform(this.options.inTransform);
            this._opacity = new Transitionable(this.options.inOpacity);
            this._origin = new Transitionable(this.options.inOrigin);
            var transform = new Modifier({
                transform:  this._transform,
                opacity: this._opacity,
                origin: this._origin
            });
            var node = new RenderNode();
            node.add(transform).add(renderable);
            this.nodes.push(node);
        };
        Box.prototype.removeRenderable = function() {
            var self = this;
            if(self.nodes.length == 0)
                return;
            var node = self.nodes[self.nodes.length - 1];
            if(self._showing){
                self.hide(function(){
                    self.nodes.splice(self.nodes.indexOf(node), 1);
                })
            }
            else
                self.nodes.splice(self.nodes.indexOf(node), 1);
            
        };

        Box.prototype.hide = function(transition, callback) {
            var self = this;
            if(!self._showing)
                return;
            self._showing = false;

            if (transition instanceof Function) {
                callback = transition;
                transition = undefined;
            }
            if (!transition) transition = this.options.outTransition;

            var _cb = callback ? Utility.after(3, function(){
                callback.call(self);
            }) : undefined;

            self._transform.set(this.options.outTransform, transition, _cb);
            self._opacity.set(this.options.outOpacity, transition, _cb);
            self._origin.set(this.options.outOrigin, transition, _cb);
        };

        /**
         * Show displays the targeted renderable with a transition and an optional callback to
         *  execute afterwards.
         * @method show
         * @param {Object} renderable The renderable you want to show.
         * @param {Transition} [transition] Overwrites the default transition in to display the
         * passed-in renderable.
         * @param {function} [callback] Executes after transitioning in the renderable.
         */
        Box.prototype.show = function (transition, callback) {
            var self = this;
            self._showing = true;

            if (transition instanceof Function) {
                callback = transition;
                transition = undefined;
            }
            if (!transition) transition = this.options.inTransition;

            var _cb = callback ? Utility.after(3, function(){
                callback.call(self);
            }) : undefined;

            //self._transform.set(Transform.identity, true, _cb);
            self._transform.set(this.options.showTransform, transition, _cb);
            
            self._opacity.set(this.options.showOpacity, transition, _cb);
            self._origin.set(this.options.showOrigin, transition, _cb);
        };

        Box.prototype.popIn = function (transition, callback) {
            var modifier = this._transform;
            if (transition instanceof Function) {
                callback = transition;
                transition = undefined;
            }
            transition = transition ? transition : {
                transition:         Easing.inOutExpoNorm,
                duration:           500
            };

            modifier.halt();
            modifier.set(
                Transform.thenMove(
                    Transform.scale( 0.000001, 0.000001, 0.000001),
                    [window.innerWidth * 0.5, window.innerHeight * 0.5]));

            modifier.set( Transform.identity, transition, callback);
            this._origin.set(this.options.showOrigin, transition);
            this._opacity.set(this.options.showOpacity, transition);
        };

        Box.prototype.popOut = function (transition, callback) {
            var modifier = this._transform;
            if (transition instanceof Function) {
                callback = transition;
                transition = undefined;
            }
            transition = transition ? transition : {
                transition:     Easing.inOutExpoNorm,
                duration:       500
            };

            modifier.halt();
            modifier.set(
                Transform.thenMove(Transform.scale( 0.000001, 0.000001),
                    [window.innerWidth * 0.5, window.innerHeight * 0.5]),
                transition,
                callback
            );
        };
        /**
         * Generate a render spec from the contents of this component.
         *
         * @private
         * @method render
         * @return {number} Render spec for this component
         */
        Box.prototype.render = function () {
            var result = [];
            for (var i = 0; i < this.nodes.length; i++) {
                result.push(this.nodes[i].render());
            }
            return result;
        };

        Box.prototype.getSize = function(){
            var self = this;
            if(self.nodes.length == 0)
                return;
            var node = self.nodes[self.nodes.length - 1];
            return node.getSize();
        };

        module.exports = Box;

    });

// Meteor.startup(function(){

//     define(function(){

//         var ReactiveSurface = require('famodev/ReactiveSurface');
//         var Box             = require('famodev/Box');
//         var Engine          = require("famous/core/Engine");
//         var Easing          = require('famous/transitions/Easing');
//         var mainContext     = Engine.createContext();

//         var sur = new ReactiveSurface({
//             size: [200, 200],
//             properties: {
//                 textAlign: 'center',
//                 color: 'white',
//                 fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//                 fontWeight: '200',
//                 fontSize: '16px',
//                 lineHeight: "200px",
//                 background: 'red'
//             },
//             content: function(){
//                 return 'hello';
//             }
//         });
//         var box = new Box();
//         mainContext.add(box);
//         box.addRenderable(sur);
//         box.show({ duration: 650, curve: 'easeOut' }, function(){
//             console.log('show1');
//         });
//         Meteor.setTimeout(function(){
//             box.hide({ duration: 500, curve: Easing.inCubic }, function(){
//                 console.log('hide1');
//                 test2(box);
//             });
//         }, 3000);

//     })
//     function test2(box){
//         box.show(function(){
//             console.log('show2');
//             Meteor.setTimeout(function(){
//                 box.removeRenderable();
//             }, 1000);
//         });
//     }
// });

// Meteor.startup(function(){

//     define(function(){

//         var ReactiveSurface = require('famodev/ReactiveSurface');
//         var Box             = require('famodev/Box');
//         var Engine          = require("famous/core/Engine");
//         var Easing          = require('famous/transitions/Easing');
//         var mainContext     = Engine.createContext();

//         var sur = new ReactiveSurface({
//             size: [200, 200],
//             properties: {
//                 textAlign: 'center',
//                 color: 'white',
//                 fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//                 fontWeight: '200',
//                 fontSize: '16px',
//                 lineHeight: "200px",
//                 background: 'red'
//             },
//             content: function(){
//                 return 'hello';
//             }
//         });
//         var box = new Box({
//             inTransform: Transform.translate(-300, 0, 0),
//             inOpacity: 0,
//             outOrigin: [0.5, 0.5],
//             outTransform: Transform.translate(300, 0, 0),
//             outOpacity: 0,
//             outOrigin: [0.5, 0.5],
//             showTransform: Transform.identity,
//             showOpacity: 1,
//             showOrigin: [0.5, 0.5],
//         });
//         mainContext.add(box);
//         box.addRenderable(sur);
//         box.show(function(){
//             console.log('show1');
//         });
//         Meteor.setTimeout(function(){
//             box.hide({ duration: 500, curve: Easing.inCubic }, function(){
//                 console.log('hide1');
//                 test2(box);
//             });
//         }, 3000);

//     })
//     function test2(box){
//         box.show(function(){
//             console.log('show2');
//             Meteor.setTimeout(function(){
//                 box.removeRenderable();
//             }, 1000);
//         });
//     }
// });

// Meteor.startup(function(){

//     define(function(){

//         var ReactiveSurface = require('famodev/ReactiveSurface');
//         var Box             = require('famodev/Box');
//         var Engine          = require("famous/core/Engine");
//         var Easing          = require('famous/transitions/Easing');
//         var mainContext     = Engine.createContext();

//         var sur = new ReactiveSurface({
//             size: [200, 200],
//             properties: {
//                 textAlign: 'center',
//                 color: 'white',
//                 fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//                 fontWeight: '200',
//                 fontSize: '16px',
//                 lineHeight: "200px",
//                 background: 'red'
//             },
//             content: function(){
//                 return 'hello';
//             }
//         });
//         var box = new Box({
//         });
//         mainContext.add(box);
//         box.addRenderable(sur);
//         box.show(function(){
//             Meteor.setTimeout(function(){
//                 box.popOut();
//             }, 3000)
//         });

//     })
// });
