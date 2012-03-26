/**
 * Q.js - An small action queing system.
 * 
 * Q.js allows you to queue namespaced actions and attach
 * a countdown value. When the countdown value reaches zero
 * the code attached to the action will be executed unless 
 * another action has occured within the same namespace.
 * Both ticks and timout values should be expressed in seconds;
 *
 *     
 */

var Q = Q || function(_opt){
    var opt = _opt || {};
    var _delim = opt.delimiter || ':';
    var actionMap = {};
    var tick = 10000; // 10s tick by default
    if(opt.tick){
	if(opt.tick < 1) tick = 1000;
	else tick = opt.tick * 1000;
    }
    var Q = {};
   
    /**
     * 
     */
    function drain(){
	var current = (new Date()).getTime();
	var actionQueue = [];
	for(var i in actionMap){
	    for(var j in actionMap[i]){
		if(actionMap[i][j].runAt <= current){
		    actionQueue.push(actionMap[i][j]);
		    unset(i,j);
		}
	    }
	}
	while(actionQueue.length > 0){
	    var evt = actionQueue.pop();
	    if(evt.repeat){
		set(evt.objectName, evt.methodName, evt.apply, evt.timeout, evt.repeat);
	    }
	    evt.apply();
	}
    }

    function unset(objectName, methodName){
	actionMap[objectName][methodName] = null;
	if(actionMap[objectName].length == 0){
	    actionMap[objectName] = null;
	}
    }
    
    function set(objectName, methodName, fn, timeout, shouldRepeat){
	if(!actionMap[objectName]){
	    actionMap[objectName] = {};
	}
	actionMap[objectName][methodName] = {
	    objectName: objectName,
	    methodName: methodName,
	    timeout: timeout,
	    runAt: timeout * 1000  + (new Date()).getTime(),
	    apply: fn,
	    repeat: shouldRepeat
	};
    }

    function require(context, args){
	var missing = [];
	for(var i in args){
	    if(!context[i]) missing.push(i);
	}
	var err = 'QError: Missing argument(s):';
	for(var i in missing){
	    err += i + ' ';
	}
	if(missing.length > 0){
	    throw err;
	}
    } 

    // Public methods
    Q.delimiter = function(){ return _delim;};

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
    Q.enqueue = function(opts){
	require(opts, ['name', 
		       'action', 
		       'timeout']);
	var ns = opts.name.split(_delim);
	set(ns[0], ns[1] || 'self', opts.action, opts.timeout, !!opts.repeat);
    };
    /**
     * Q.dequeue - Remove a function from the set of actions to be triggered.
     * 
     * @param name The namespace of the function to be removed.
     */
    Q.dequeue = function(opts){
	requre(opts, ['name']);
	var ns = opts.name.split(_delim);
	unset(ns[0], ns[1] || 'self');
    };
    
    
    return Q;
    
};