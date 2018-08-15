
var firebase = require("firebase");
var FBase = firebase.database();
var q = require('q');
var Config = require('./config').Config;

var Socket = require('./socket');
var Notification = require('./notification');

//debugging
var colors = require('colors');
colors.setTheme({
    info: 'green',
    data: 'magenta',
    warn: 'yellow',
    error: 'red',
    event: 'cyan',
    receivedEvent: 'lightcyan'
});


//trace
var logger = require('tracer').colorConsole({
    format: [
        '{{timestamp}} (in line: {{line}}) >> {{message}}', //default format
        {
            error: '{{timestamp}} <{{title}}> {{message}} (in {{file}}:{{line}})\nCall Stack:\n{{stack}}' // error format
        }
    ],
    dateformat: 'HH:MM:ss.L',
    preprocess: function (data) {
        data.title = data.title.toUpperCase();
    }
});

var inspector = require('schema-inspector');
var Notification = require('./notification');
var socketController = require('./socket');

exports.addPersonalOrder = function (req, res, next) {
    logger.info('EXPRESS: post("/addPersonalOrder") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',

        properties: {
            order_type: {
                type: 'string'
            },
            city: {
                type: 'string'
            },
            pickup_address: {
                type: 'string'
            },
            delivery_address: {
                type: 'string'
            },
            username_delivery_location: {
                type: 'string'
            },
            phone_delivery_location: {
                type: 'string'
            },
            username_pickup_location: {
                type: 'string'
            },
            phone_pickup_location: {
                type: 'string'
            },
            order_price: {
                type: 'string'
            },
            delivery_price: {
                type: 'string'
            }
        }
    };

    var params = req.body;

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        var uRef = FBase.ref('orders').push();
        var id = uRef.key;

        var request = params;
        request.id = id;
        request.status = 'pending';
        request.request_time = Date.now();

        uRef.set(request, function (err) {
            if (err) {
                status = 0;
                message = err;
                makeResponse(res, status, message, data);
            } else {
                status = 1;

                logger.info('request before pickup driver, %O', request);
                enlistDeliveryRequest(request).then(
                    function (r) {
                        status = 1;
                        makeResponse(res, status, message, data);
                    },
                    function (er) {
                        status = 0;
                        message = er;

                        var uid = params.customer.uid;
                        
                        logger.info('no picked up agents');

                        var sockets = Socket.getOnlineSockets();

                        for (var i = 0; i < sockets.length; i++) {
                            var socket = sockets[i];

                            if (socket.id === params.customer.socketID) {
                                socket.emit('noAgentsAcceptedForOrder', Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT);
                            }
                        }


                        socketController.makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT);

                        makeResponse(res, status, message, data);
                    }
                );
            }
        });

    }
};

exports.addStoreOrderRequest = function (req, res, next) {
    logger.info('EXPRESS: post("/addStoreOrderRequest") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            city: {
                type: 'string'
            },
            delivery_address: {
                type: 'string'
            },
            username_delivery_location: {
                type: 'string'
            },
            phone_delivery_location: {
                type: 'string'
            },
            order_price: {
                type: 'string'
            },
            delivery_price: {
                type: 'string'
            }
        }
    };

    var params = req.body;

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = 'not enough params';
        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        var request = params;

        var d = new Date();
        request.timestamp = d.getTime();
        request.date = d.getHours() + ':' + d.getMinutes() + ' - ' + d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
        request.status = 'pending';
        request.request_time = Date.now();

        var dRef = FBase.ref('orders').push();
        request.id = dRef.key;
        dRef.set(request, function (err) {
            if (err) {
                status = 0;
                message = err;
            } else {
                // if (request.request_type === 'homeStore') {
                //     console.log('ok, ok... this is a home store');
                //     // just send a notification to the home store owner about it
                //     Notification.notifyHomeStoreOwnerOfNewDeliveryRequest(request.owner.uid).then(
                //         function (success) {
                //             socketController.makeNotification(request.uid, Config.dict.NEW_DELIVERY_REQUEST_REGISTERED).then(
                //                 function (s) {
                //                     status = 1;
                //                     makeResponse(res, status, message, data);
                //                 },
                //                 function (e) {
                //                     status = 0;
                //                     message = e;
                //                     makeResponse(res, status, message, data);
                //                 }
                //             );
                //         },
                //         function (error) {
                //             status = 0;
                //             message = error;
                //             makeResponse(res, status, message, data);
                //         }
                //     );
                // } else
                //  {
                enlistDeliveryRequest(request).then(
                    function (r) {
                        status = 1;
                        makeResponse(res, status, message, data);
                    },
                    function (er) {
                        status = 0;
                        message = er;

                        var uid = request.uid;

                        var sockets = Socket.getOnlineSockets();

                        for (var i = 0; i < sockets.length; i++) {
                            var socket = sockets[i];
                            logger.info(socket.id);
                            if (socket.id === request.customer.socketID) {
                                socket.emit('noAgentsAcceptedForOrder', Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT);
                            }
                        }


                        socketController.makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT);

                        makeResponse(res, status, message, data);
                    }
                );
                // }
            }
        });
    }
};

exports.getOrders = function (req, res, next) {
    logger.info('post("/getOrders") --> RECEIVED'.event);
    var status, message, data;
    var orders = [];

    var schema = {
        type: 'object'
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').once('value', function (snapshot) {
            var response = snapshot.val();
            if (!response) {
                status = 0;
                message = 'No orders in database';
                makeResponse(res, status, message, data);
            } else {
                logger.info(response);

                if (params.user.type == 'admin') {
                    for (var key in response) {
                        if (response[key].status != 'pending' && response[key].status != 'rejected')
                            orders.push(response[key]);
                    }
                } else if (params.user.type == 'agent') {
                    for (var key in response) {
                        if (response[key].agent_id && response[key].agent_id == params.user.uid) {
                            if (response[key].status != 'pending' && response[key].status != 'rejected')
                                orders.push(response[key]);
                        }
                    }
                } else if (params.user.type === 'owner') {
                    for (var key in response) {
                        if (response[key].store && response[key].store.owner && response[key].store.owner.uid == params.user.uid) {
                            logger.info('aaaa');
                            if (response[key].status != 'pending' && response[key].status != 'rejected')
                                orders.push(response[key]);
                        }
                    }
                } else if (params.user.type === 'customer') {
                    for (var key in response) {
                        if (response[key].customer && response[key].customer.uid == params.user.uid) {
                            if (response[key].status != 'pending' && response[key].status != 'rejected')
                                orders.push(response[key]);
                        }
                    }
                }

                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.getOrdersPending = function (req, res, next) {
    logger.info('post("/getOrdersPending") --> RECEIVED'.event);
    var status, message, data;
    var orders = [];

    var schema = {
        type: 'object'
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').orderByChild('status').equalTo(`pending`).once('value', function (snapshot) {
            var response = snapshot.val();
            if (!response) {
                status = 0;
                message = 'No pending orders in database';
                makeResponse(res, status, message, data);
            } else {
                logger.info(params.user.type);

                if (params.user.type == 'admin') {
                    for (var key in response) { }
                    orders.push(response[key]);
                } else if (params.user.type == 'agent') {
                    for (var key in response) {
                        console.log(response[key].agent_id);
                        console.log(params.user.uid);
                        if (response[key].agent_id && response[key].agent_id == params.user.uid) {
                            orders.push(response[key]);
                        }
                    }
                } else if (params.user.type == 'owner') {
                    for (var key in response) {
                        if (response[key].owner && response[key].owner.uid == params.user.uid) {
                            orders.push(response[key]);
                        }
                    }
                }

                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.getOrdersAccepted = function (req, res, next) {
    logger.info('post("/getOrdersAccepted") --> RECEIVED'.event);
    var status, message, data;
    var orders = [];

    var schema = {
        type: 'object'
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').orderByChild('status').equalTo(`accepted`).once('value', function (snapshot) {
            var response = snapshot.val();
            if (!response) {
                status = 0;
                message = 'No accepted orders in database';
                makeResponse(res, status, message, data);
            } else {
                logger.info(params.user.type);

                if (params.user.type === 'admin') {
                    for (var key in response) {
                        orders.push(response[key]);
                    }
                } else if (params.user.type === 'agent') {
                    for (var key in response) {

                        if (response[key].agent_id && response[key].agent_id == params.user.uid) {
                            orders.push(response[key]);
                        }
                    }
                } else if (params.user.type === 'owner') {
                    for (var key in response) {
                        if (response[key].owner && response[key].owner.uid == params.user.uid) {
                            orders.push(response[key]);
                        }
                    }
                }
                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.getOrdersCompleted = function (req, res, next) {
    logger.info('post("/getOrdersCompleted") --> RECEIVED'.event);
    var status, message, data;
    var orders = [];

    var schema = {
        type: 'object'
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').orderByChild('status').equalTo(`completed`).once('value', function (snapshot) {
            var response = snapshot.val();
            if (!response) {
                status = 0;
                message = 'No completed orders in database';
                makeResponse(res, status, message, data);
            } else {
                logger.info(response);

                if (params.user.type == 'admin') {
                    for (var key in response) {
                        orders.push(response[key]);
                    }
                } else if (params.user.type == 'agent') {
                    for (var key in response) {
                        if (response[key].agent_id && response[key].agent_id == params.user.uid) {
                            orders.push(response[key]);
                        }
                    }
                }

                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.completeOrder = function (req, res, next) {
    logger.info('EXPRESS: post("/completeOrder") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        parameters: {
            order: {
                type: 'object'
            }
        }
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');
        var order = params.order;

        order.status = 'completed';
        order.order_delivery_time = new Date().getTime();

        FBase.ref('orders/' + order.id).set(order, function (err) {
            if (err) {
                status = 0;
                message = err;
            } else {
                status = 1;
            }

            makeResponse(res, status, message, data);
        });
    }
};

exports.getOrdersRejected = function (req, res, next) {
    logger.info('post("/getOrdersRejected") --> RECEIVED'.event);
    var status, message, data;
    var orders = [];

    var schema = {
        type: 'object'
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').orderByChild('status').equalTo(`rejected`).once('value', function (snapshot) {
            var response = snapshot.val();
            if (!response) {
                status = 0;
                message = 'No rejected orders in database';
                makeResponse(res, status, message, data);
            } else {
                logger.info(response);

                if (params.user.type == 'admin') {
                    for (var key in response) {
                        orders.push(response[key]);
                    }
                } else if (params.user.type == 'agent') {
                    for (var key in response) {
                        if (response[key].agent_id && response[key].agent_id == params.user.uid) {
                            orders.push(response[key]);
                        }
                    }
                }

                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}


function enlistDeliveryRequest(dRequest, agentsRejectingDelivery) {
    logger.info('agentsRejectingDelivery: %O', agentsRejectingDelivery);

    var defer = q.defer();
    var agent;
    var counter = 0;
    var noAvailableAgent = false;
    var searchingForAgent = true;

    FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
        var users = snapshot.val();

        if (!users) {
            status = 0;
            message = 'No agents in database';
            logger.info(message);
            defer.reject(Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE);
        } else {
            var agents = [];
            var onlineAgents = [];
            for (var k = 0; k < Socket.getOnlineAgents().length; k++)
                onlineAgents.push(Socket.getOnlineAgents()[k]);

            for (var u in users) {
                agents.push(users[u]);
            }

            logger.info('agents: %O', agents);
            logger.info('onlineAgents: %O', onlineAgents);

            for (var i = 0; i < agents.length; i++) {
                var agent = agents[i];
                if (agent.status === 'paused') {
                    logger.info('paused agent: %O', agent);
                    for (var j = 0; j < onlineAgents.length; j++) {
                        if (agent.uid == onlineAgents[j].uid) {
                            onlineAgents.splice(j, 1);
                            break;
                        }
                    }
                }
            }

            while (searchingForAgent) {
                // logger.info('Trying to find an available agent that wasn\'t asked before. Iteration (%s)', counter);

                agent = getRandomElements(onlineAgents, 1)[0];

                if (!agentsRejectingDelivery) {
                    searchingForAgent = false;
                } else {
                    var notOnTheList = false;
                    for (var n in agentsRejectingDelivery) {
                        if (agent.uid === agentsRejectingDelivery[n]) {
                            notOnTheList = true;
                            break;
                        }
                    }
                    if (!notOnTheList) {
                        searchingForAgent = false;
                    }
                }

                counter++;
                if (counter === Config.cyclesToRepeatForSelectingAvailableAgent) {
                    noAvailableAgent = true;
                    searchingForAgent = false;
                }
            }

            if (noAvailableAgent) {
                logger.info(Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE);
                defer.reject(Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE);
            } else {
                if (!agent) {
                    logger.info('No online agents');
                    defer.reject(Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE);
                } else {
                    logger.info('Selected agent socket.id: %s', agent.socket.id);

                    agent.socket.emit('deliveryRequest', dRequest);
                    logger.info('Socket (deliveryRequest) --> SENT '.event);

                    defer.resolve(true);
                }
            }


        }
    });

    return defer.promise;
}

function getRandomElements(arr, quantity) {
    var tmp = arr.slice(arr);
    var ret = [];

    for (var i = 0; i < quantity; i++) {
        var index = Math.floor(Math.random() * tmp.length);
        var removed = tmp.splice(index, 1);
        ret.push(removed[0]);
    }
    return ret;
}

exports.rejectDeliveryRequest = function (req, res, next) {
    logger.info('EXPRESS: post("/rejectDeliveryRequest") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            uid: {
                type: 'string'
            },
            deliveryRequest: {
                type: 'object'
            }
        }
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        FBase.ref('orders/' + params.deliveryRequest.id + '/agentsRejectingDelivery').push(params.uid, function (err) {
            if (err) {
                status = 0;
                message = err;
                makeResponse(res, status, message, data);
            } else {
                FBase.ref('orders/' + params.deliveryRequest.id + '/agentsRejectingDelivery').once('value', function (snpa) {
                    var agents = snpa.val();
                    var aa = [];
                    for (var a in agents) {
                        aa.push(agents[a]);
                    }

                    enlistDeliveryRequest(params.deliveryRequest, aa).then(
                        function (r) {
                            status = 1;
                            message = 'Rejection posted, invitation skipped to another agent';
                            makeResponse(res, status, message, data);
                        },
                        function (e) {
                            // do something about the fact there are no available agents
                            Notification.notifyCustomerThereIsNoAvailableAgent(params.deliveryRequest);


                            params.deliveryRequest.status = 'rejected';


                            var sockets = Socket.getOnlineSockets();

                            for (var i = 0; i < sockets.length; i++) {
                                var socket = sockets[i];

                                if (socket.id === params.deliveryRequest.customer.socketID) {
                                    socket.emit('noAgentsAcceptedForOrder', Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT);
                                }
                            }

                            FBase.ref('orders/' + params.deliveryRequest.id).set(params.deliveryRequest, function (erro) {
                                if (erro) {
                                    status = 0;
                                    message = erro;
                                    makeResponse(res, status, message, data);
                                } else {
                                    var uid = params.deliveryRequest.customer.uid;
                                    Socket.makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_NO_AGENT).then(
                                        function (s) {
                                            status = 1;
                                            makeResponse(res, status, message, data);
                                        },
                                        function (e) {
                                            status = 0;
                                            message = e;
                                            makeResponse(res, status, message, data);
                                        }
                                    );
                                }
                            });
                        }
                    );
                });
            }
        });
    }
};

exports.acceptDeliveryRequest = function (req, res, next) {
    logger.info('EXPRESS: post("/acceptDeliveryRequest") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            uid: {
                type: 'string'
            },
            deliveryRequest: {
                type: 'object'
            }
        }
    };

    var params = req.body;
    

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        params.deliveryRequest.status = 'accepted';
        params.deliveryRequest.agent_id = params.uid;
        params.deliveryRequest.order_accept_time = Date.now();

        FBase.ref('orders/' + params.deliveryRequest.id).set(params.deliveryRequest, function (err) {
            if (err) {
                status = 0;
                message = err;
                makeResponse(res, status, message, data);
            } else {


                var sockets = Socket.getOnlineSockets();
                for (var i = 0; i < sockets.length; i++) {
                    var socket = sockets[i];
                    if (socket.id === params.deliveryRequest.customer.socketID) {
                        socket.emit('requestAcceptedForCustomer', params.deliveryRequest);
                    }
                }

                Notification.notifyCustomerOfRequestAcceptance(params.deliveryRequest).then(
                    function (success) {
                        // send customer "bill" notification
                        var uid = params.deliveryRequest.uid;

                        Socket.makeNotification(uid, Config.dict.NEW_DELIVERY_REQUEST_ACCEPTED).then(
                            function (s) {
                                status = 1;
                                makeResponse(res, status, message, data);
                            },
                            function (e) {
                                status = 0;
                                message = e;
                                makeResponse(res, status, message, data);
                            }
                        );
                    },
                    function (error) {
                        status = 0;
                        message = error;
                        makeResponse(res, status, message, data);
                    }
                );

            }
        });
    }
};

function makeResponse(res, status, message, data) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: status,
        message: message,
        data: data
    });
}

