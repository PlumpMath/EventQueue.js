/**
 * 
 * Q.js - An small Javascript action queuing system.
 * 
 * Q.js allows you to queue name-spaced actions and attach
 * a countdown value. When the countdown value reaches zero
 * the code attached to the action will be executed unless 
 * another action has occurred within the same name space.
 * 
 * Optionally you can supply the interval value which represents the
 * granularity of the clock, as well as a delimiter for controlling more
 * complex name spaces.
 *
 * Author: Morgan Todd <tx@lowtech-labs.org>
 * Version 0.2
 *     
 */

var Q = Q || function(_opt){
    var opt = _opt || {};
    var _delim = opt.delimiter || ':';
    var interval = 10000; // 10s interval by default
    if(opt.interval){
        if(opt.interval < 1) interval = 1000;
        else interval = opt.interval * 1000;
    }
    Q.actionMap = Q.actionMap || {};

    function drain(){
        var current = (new Date()).getTime();
        var actionQueue = [];
        for(var i in Q.actionMap){
            for(var j in Q.actionMap[i]){
                if(Q.actionMap[i][j].runAt <= current){
                    actionQueue.push(Q.actionMap[i][j]);
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
	if(Q.actionMap[objectName]){
            Q.actionMap[objectName][methodName] = undefined;
	    delete Q.actionMap[objectName][methodName];
	    var isEmpty = true;
	    for(var i in Q.actionMap[objectName]){
		isEmpty = isEmpty && !Q.actionMap[objectName][i];
	    }
            if(isEmpty){
		Q.actionMap[objectName] = undefined;
		delete Q.actionMap[objectName];
            }
	}
    }
    
    function set(objectName, methodName, fn, timeout, shouldRepeat, context){
        if(!Q.actionMap[objectName]){
            Q.actionMap[objectName] = {};
        }
        Q.actionMap[objectName][methodName] = {
            objectName: objectName,
            methodName: methodName,
            timeout: timeout,
            runAt: timeout * 1000  + (new Date()).getTime(),
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
        var err = 'QError: Missing argument(s): ';
        for(var i in missing){
            err += args[i] + ' ';
        }
        if(missing.length > 0){
            throw err;
        }
    } 
    this.print  = function(){return Q.actionMap;}
    // Public methods
    this.delimiter = function(){ return _delim;};

    /**
     * Q.enqueue - Add a function to the set of actions to be triggered.
     * If an item already exists with the given name, it will be replaced 
     * and its timer will be reset.
     * 
     * @param name The namespace of the function to be called. This can be a 
     * single word, or delimited with Q.delimiter() (the default is a colon ':'.)
     * @param action The function to be called after the specified timeout.
     * @param timeout The period of time to wait, in seconds, to call the function (action)
     * @param repeat (Optional) A boolean value indicating whether the action should be re-
     * triggered indefinitely.
     */
    this.enqueue = function(opts, context){
        require(opts, ['name', 
                       'action', 
                       'timeout']);
        var ns = opts.name.split(_delim);
        set(ns[0], ns[1] || 'self', opts.action, opts.timeout, !!opts.repeat, context);
	return this;
    };
    /**
     * Q.dequeue - Remove a function from the set of actions to be triggered.
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
     * Q.clear - Clear the entire queue
     */
    this.clear = function(){
        Q.actionMap = {};
	return this;
    };
    drain();
    return this;
    
};
