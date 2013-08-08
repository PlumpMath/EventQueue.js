/**
 * 
 * EventQueue.js - A small Javascript action queuing system.
 * 
 * EventQueue.js allows you to queue name-spaced actions and attach
 * a countdown value. When the countdown value reaches zero
 * the code attached to the action will be executed unless 
 * another action has occurred within the same name space.
 * 
 * Optionally you can supply the interval value which represents the
 * granularity of the clock, as well as a delimiter for controlling more
 * complex name spaces.
 *
 * Author: Morgan Todd <tx@lowtech-labs.org>
 * Version 0.3
 *     
 */

var EventQueue = EventQueue || function(_opt){
    var opt = _opt || {};
    var _delim = opt.delimiter || ':';
    var interval = 1000; // 1s interval by default
    if(opt.interval){
        if(opt.interval < 1) interval = 1000;
        else interval = opt.interval * 1000;
    }
    EventQueue.actionMap = EventQueue.actionMap || {};
    
    function drain(){
        var current = (new Date()).getTime();
        var actionQueue = [];
        for(var i in EventQueue.actionMap){
            for(var j in EventQueue.actionMap[i]){
                if(EventQueue.actionMap[i][j].runAt <= current){
                    actionQueue.push(EventQueue.actionMap[i][j]);
                    unset(i,j);
                }
            }
        }
        while(actionQueue.length > 0){
            var evt = actionQueue.pop();
            if(evt.repeat){
                set(evt.objectName, evt.methodName, evt.apply, evt.timeout, evt.repeat);
            }
            if(evt.context){
                evt.apply.call(evt.context);
            } else {
                evt.apply();
            }
        }
        setTimeout(drain, interval);
    }
    
    function unset(objectName, methodName){
        if(EventQueue.actionMap[objectName]){
            EventQueue.actionMap[objectName][methodName] = undefined;
            delete EventQueue.actionMap[objectName][methodName];
            var isEmpty = true;
            for(var i in EventQueue.actionMap[objectName]){
                isEmpty = isEmpty && !EventQueue.actionMap[objectName][i];
            }
            if(isEmpty || methodName == 'self'){
                EventQueue.actionMap[objectName] = undefined;
                delete EventQueue.actionMap[objectName];
            }
        }
    }
    
    function set(objectName, methodName, fn, timeout, shouldRepeat, isImmediate, context){
        if(!EventQueue.actionMap[objectName]){
            EventQueue.actionMap[objectName] = {};
        }
	var now = (new Date()).getTime()
        EventQueue.actionMap[objectName][methodName] = {
            objectName: objectName,
            methodName: methodName,
            timeout: timeout,
            runAt: isImmediate ? now : (timeout * 1000  + now),
            apply: fn,
            repeat: shouldRepeat,
            context: context
        };
    }
    
    function require(context, args){
        var missing = [];
        for(var i in args){
            if(!context[args[i]]) missing.push(args[i]);
        }
        var err = 'EventQueueError: Missing argument(s): ';
        for(var i in missing){
            err += args[i] + ' ';
        }
        if(missing.length > 0){
            throw err;
        }
    } 
    this.print  = function(){return EventQueue.actionMap;}
    // Public methods
    this.delimiter = function(){ return _delim;};
    
    /**
     * EventQueue.enqueue - Add a function to the set of actions to be triggered.
     * If an item already exists with the given name, it will be replaced 
     * and its timer will be reset.
     * 
     * @param name The namespace of the function to be called. This can be a 
     * single word, or delimited with EventQueue.delimiter() (the default is a colon ':'.)
     * @param action The function to be called after the specified timeout.
     * @param timeout The period of time to wait, in seconds, to call the function (action)
     * @param repeat (Optional) A boolean value indicating whether the action should be re-
     * triggered indefinitely.
     * @param immediate (Optional) A boolean value indicating whether the action should be 
     * triggered immediately.
     */
    this.enqueue = function(opts, context){
        require(opts, ['name', 
                       'action', 
                       'timeout']);
        var ns = opts.name.split(_delim);
        set(ns[0], ns[1] || 'self', opts.action, opts.timeout, !!opts.repeat, opts.immediate || false, context);
        return this;
    };
    /**
     * EventQueue.dequeue - Remove a function from the set of actions to be triggered.
     * 
     * @param name The namespace of the function to be removed.
     */
    this.dequeue = function(opts){
        require(opts, ['name']);
        var ns = opts.name.split(_delim);
        unset(ns[0], ns[1] || 'self');
        return this;
    };
    
    /**
     * EventQueue.clear - Clear the entire queue
     */
    this.clear = function(){
        EventQueue.actionMap = {};
        return this;
    };
    drain();
    return this;
    
};
