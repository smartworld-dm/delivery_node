
var firebase = require("firebase");
var FBase = firebase.database();
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


exports.reportCustomers = function(req,res,next) {
    logger.info('post("/reportCustomers") --> RECEIVED'.event);
    var status, message, data;

    var customers = [];

    var schema = {
        type: 'object',
        properties: {
            from_date: {
                type: 'string'
            },
            to_date: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];
                    if(order.order_accept_time >= params.from_date && order.order_accept_time <= params.to_date) {

                        if(customers.indexOf(order.customer.uid) === -1)
                            customers.push(order.customer.uid);
                    }
                        
                }

                status = 1;
                data = customers.length;;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportNumOrdersFromStores = function(req,res,next) {
    logger.info('post("/reportNumOrdersFromStores") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            from_date: {
                type: 'string'
            },
            to_date: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];
                    if(order.order_accept_time >= params.from_date && order.order_accept_time <= params.to_date) {

                        if(order.order_type === 'store')
                            orders.push(order);
                    }
                        
                }

                status = 1;
                data = orders.length;;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportNumOrdersFromHomeStores = function(req,res,next) {
    logger.info('post("/reportNumOrdersFromHomeStore") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            from_date: {
                type: 'string'
            },
            to_date: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {
                

                for (var key in response) {
                    var order = response[key];
                    if(order.order_accept_time >= params.from_date && order.order_accept_time <= params.to_date) {

                        if(order.order_type === 'homeStore')
                            orders.push(order);
                    }      
                }

                status = 1;
                data = orders.length;;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.reportTotalCostFromStores = function(req,res,next) {
    logger.info('post("/reportTotalCostFromStores") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            from_date: {
                type: 'string'
            },
            to_date: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];
                    if(order.order_accept_time >= params.from_date && order.order_accept_time <= params.to_date) {

                        if(order.order_type === 'store')
                            cost += parseFloat(order.order_price);
                    } 
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportTotalCostFromHomeStores = function(req,res,next) {
    logger.info('post("/reportTotalCostFromHomeStores") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            from_date: {
                type: 'string'
            },
            to_date: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];
                    if(order.order_accept_time >= params.from_date && order.order_accept_time <= params.to_date) {

                        if(order.order_type === 'homeStore')
                            cost += parseFloat(order.order_price);
                    }
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.reportTotalCostFromDelivery = function(req,res,next) {
    logger.info('post("/reportTotalCostFromDelivery") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            from_date: {
                type: 'string'
            },
            to_date: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];
                    if(order.order_accept_time >= params.from_date && order.order_accept_time <= params.to_date) {
                        cost += parseFloat(order.delivery_price);
                    }
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportNumPickedOrdersFromStores = function(req,res,next) {
    logger.info('post("/reportNumPickedOrdersFromStores") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];

                    if(order.order_type === 'store')
                        orders.push(order);
                }

                status = 1;
                data = orders.length;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportNumPickedOrdersFromHomeStores = function(req,res,next) {
    logger.info('post("/reportNumPickedOrdersFromHomeStores") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];

                    if(order.order_type === 'homeStore')
                        orders.push(order);
                }

                status = 1;
                data = orders.length;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportNumAgentOrdersFromStores = function(req,res,next) {
    logger.info('post("/reportNumAgentOrdersFromStores") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {
               

                for (var key in response) {
                    var order = response[key];

                    if(order.agent_id === params.agent_id && order.order_type === 'store')
                        orders.push(order);
                }

                status = 1;
                data = orders.length;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportNumAgentOrdersFromHomeStores = function(req,res,next) {
    logger.info('post("/reportNumAgentOrdersFromHomeStores") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {


                for (var key in response) {
                    var order = response[key];

                    if(order.agent_id === params.agent_id && order.order_type === 'homeStore')
                        orders.push(order);
                }

                status = 1;
                data = orders.length;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.reportAgentTotalCostDelivery = function(req,res,next) {
    logger.info('post("/reportAgentTotalCostDelivery") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];

                    if(order.agent_id === params.agent_id)
                        cost += parseFloat(order.delivery_price);
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.reportNumOrdersFromStore = function(req,res,next) {
    logger.info('post("/reportNumOrdersFromStore") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {


                for (var key in response) {
                    var order = response[key];

                    if(order.store && order.store.id === params.store_id && order.order_type === 'store')
                        orders.push(order);
                }

                status = 1;
                data = orders.length;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportNumOrdersFromHomeStore = function(req,res,next) {
    logger.info('post("/reportNumOrdersFromHomeStore") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {


                for (var key in response) {
                    var order = response[key];

                    if(order.store && order.store.id === params.store_id && order.order_type === 'homeStore')
                        orders.push(order);
                }

                status = 1;
                data = orders.length;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportTotalCostOrdersFromStore = function(req,res,next) {
    logger.info('post("/reportTotalCostOrdersFromStore") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {


                for (var key in response) {
                    var order = response[key];

                    if(order.store && order.store.id === params.store_id && order.order_type === 'store')
                      cost += parseFloat(order.order_price);
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportTotalCostOrdersFromHomeStore = function(req,res,next) {
    logger.info('post("/reportTotalCostOrdersFromHomeStore") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {
                  for (var key in response) {
                    var order = response[key];

                    if(order.store && order.store.id === params.store_id && order.order_type === 'homeStore')
                      cost += parseFloat(order.order_price);
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportTotalCostDeliveryFromStore = function(req,res,next) {
    logger.info('post("/reportTotalCostDeliveryFromStore") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];
                    if(order.store && order.store.id === params.store_id && order.order_type === 'store')
                      cost += parseFloat(order.delivery_price);
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportTotalCostDeliveryFromHomeStore = function(req,res,next) {
    logger.info('post("/reportTotalCostDeliveryFromHomeStore") --> RECEIVED'.event);
    var status, message, data;

    var cost = 0;

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

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
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];

                    if(order.store && order.store.id === params.store_id && order.order_type === 'homeStore')
                      cost += parseFloat(order.delivery_price);
                }

                status = 1;
                data = cost;
                makeResponse(res, status, message, data);
            }
        });
    }
}



exports.getAgentOrdersByTime = function(req,res,next) {
    logger.info('post("/getAgentOrdersByTime") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').orderByChild('order_accept_time').once('value', function (snapshot) {
            var response = snapshot.val();


            if (!response) {
                status = 0;
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {


                for (var key in response) {
                    var order = response[key];

                    if(order.agent_id === params.agent_id)
                      orders.push(order);
                }

                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportOrdersFromStoreByTime = function(req,res,next) {
    logger.info('post("/reportOrdersFromStoreByTime") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').orderByChild('order_accept_time').once('value', function (snapshot) {
            var response = snapshot.val();
            if (!response) {
                status = 0;
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    var order = response[key];

                    if(order.store && order.store.id === params.store_id && order.order_type === 'store')
                      orders.push(order);
                }

                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}

exports.reportOrdersFromHomeStoreByTime = function(req,res,next) {
    logger.info('post("/reportOrdersFromHomeStoreByTime") --> RECEIVED'.event);
    var status, message, data;

    var orders = [];

    var schema = {
        type: 'object',
        properties: {
            store_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('orders').orderByChild('order_accept_time').once('value', function (snapshot) {
            var response = snapshot.val();
            if (!response) {
                status = 0;
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {
                for (var key in response) {
                    var order = response[key];

                    if(order.store && order.store.id === params.store_id && order.order_type === 'homeStore')
                      orders.push(order);
                }

                status = 1;
                data = orders;
                makeResponse(res, status, message, data);
            }
        });
    }
}


exports.reportAgentHours = function(req,res,next) {
    logger.info('post("/reportAgentHours") --> RECEIVED'.event);
    var status, message, data;

    var history = null;

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            }
        }
    };

    var params = req.body;
    logger.log('params: %O', params);

    var validationresult = inspector.validate(schema, params);

    if (!validationresult.valid) {
        status = 0;
        message = validationresult.format();
        logger.log(validationresult.format());

        makeResponse(res, status, message, data);
    } else {

        FBase.ref('online_history').orderByChild('agent_id').equalTo(`${params.agent_id}`).once('value', function (snapshot) {
            var response = snapshot.val();

            logger.info(response);
            if (!response) {
                status = 0;
                message = 'No reports in database';
                makeResponse(res, status, message, data);
            } else {

                for (var key in response) {
                    history = response[key];
                }

                status = 1;

                if(history!=null)
                    data = history.hours;
                else 
                    data = 0;
                makeResponse(res, status, message, data);
            }
        });
    }
}


function makeResponse(res, status, message, data) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: status,
        message: message,
        data: data
    });
}



