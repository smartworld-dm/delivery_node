
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


exports.getAgents = function (req, res, next) {
    logger.info('EXPRESS: post("/getAgents") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
    };

    FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
        var users = snapshot.val();

        if (!users) {
            status = 0;
            message = 'No agents in database';
            logger.info(message);
            makeResponse(res, status, message, data);
        } else {
            var agents = [];

            for (var u in users) {
                agents.push(users[u]);
            }
            status = 1;
            data = agents;
            makeResponse(res, status, message, data);
        }
    });
}


exports.activateAgent = function (req, res, next) {
    logger.info('EXPRESS: post("/getAgents") --> RECEIVED'.event);

    var status, message, data;

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
        logger.info('Validation passed');
        FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
            var users = snapshot.val();

            var agent;
            if (!users) {
                status = 0;
                message = 'No agents in database';
                logger.info(message);
                makeResponse(res, status, message, data);
            } else {

                for (var u in users) {
                    if (users[u].uid == params.agent_id)
                        agent = users[u];
                }

                if (!agent) {
                    status = 0;
                    message = 'No agent in database';
                    logger.info(message);
                    makeResponse(res, status, message, data);
                } else {
                    agent.status = 'active';

                    FBase.ref('users/' + agent.uid).set(agent, function(err) {
                        if (err) {
                            status = 0;
                            message = err;
                        } else {
                            status = 1;
                            message = agent;
                        }
        
                        makeResponse(res, status, message, data);
                    });
                }
            }
        });
    }
}

exports.changePercentage = function (req, res, next) {
    logger.info('EXPRESS: post("/changePercentage") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            },
            percentage: {
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
        logger.info('Validation passed');
        FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
            var users = snapshot.val();

            var agent;
            if (!users) {
                status = 0;
                message = 'No agents in database';
                logger.info(message);
                makeResponse(res, status, message, data);
            } else {

                for (var u in users) {
                    if (users[u].uid == params.agent_id)
                        agent = users[u];
                }

                if (!agent) {
                    status = 0;
                    message = 'No agent in database';
                    logger.info(message);
                    makeResponse(res, status, message, data);
                } else {
                    agent.percentage = params.percentage;
                    FBase.ref('users/' + agent.uid).set(agent, function(err) {
                        if (err) {
                            status = 0;
                            message = err;
                        } else {
                            status = 1;
                            message = agent;
                        }
        
                        makeResponse(res, status, message, data);
                    });
                }
            }
        });
    }
}


exports.updateAgent = function (req, res, next) {
    logger.info('EXPRESS: post("/updateAgent") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            },
            phone: {
                type: 'string'
            },
            name: {
                type:'string'
            },
            password: {
                type:'string'
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
        logger.info('Validation passed');
        FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
            var users = snapshot.val();

            var agent;
            if (!users) {
                status = 0;
                message = 'No agents in database';
                logger.info(message);
                makeResponse(res, status, message, data);
            } else {

                for (var u in users) {
                    if (users[u].uid == params.agent_id)
                        agent = users[u];
                }

                if (!agent) {
                    status = 0;
                    message = 'No agent in database';
                    logger.info(message);
                    makeResponse(res, status, message, data);
                } else {
                    agent.username = params.name;
                    agent.phone = params.phone;
                    agent.password = params.password;
                    agent.type = 'agent';

                    FBase.ref('users/' + agent.uid).set(agent, function(err) {
                        if (err) {
                            status = 0;
                            message = err;
                        } else {
                            status = 1;
                            message = agent;
                        }
        
                        makeResponse(res, status, message, data);
                    });
                }
            }
        });
    }
}


exports.addAgentNamePassword = function (req, res, next) {
    logger.info('EXPRESS: post("/addAgentNamePassword") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            },
            name: {
                type:'string'
            },
            password: {
                type:'string'
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
        logger.info('Validation passed');
        FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
            var users = snapshot.val();

            var agent;
            if (!users) {
                status = 0;
                message = 'No agents in database';
                logger.info(message);
                makeResponse(res, status, message, data);
            } else {

                for (var u in users) {
                    if (users[u].uid == params.agent_id)
                        agent = users[u];
                }

                if (!agent) {
                    status = 0;
                    message = 'No agent in database';
                    logger.info(message);
                    makeResponse(res, status, message, data);
                } else {
                    agent.username = params.name;
                    agent.password = params.password;
                    FBase.ref('users/' + agent.uid).set(agent, function(err) {
                        if (err) {
                            status = 0;
                            message = err;
                        } else {
                            status = 1;
                            message = agent;
                        }
        
                        makeResponse(res, status, message, data);
                    });
                }
            }
        });
    }
}

exports.updateAgentLocation = function (req, res, next) {
    logger.info('EXPRESS: post("/getAgents") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            agent_id: {
                type: 'string'
            },
            location: {
                type: 'object'
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
        logger.info('Validation passed');
        FBase.ref('users').orderByChild('uid').equalTo(`${params.agent_id}`).once('value', function (snapshot) {
            var users = snapshot.val();

            var agent;
            if (!users) {
                status = 0;
                message = 'No agent in database';
                logger.info(message);
                makeResponse(res, status, message, data);
            } else {

                for (var u in users) {
                    agent = users[u];
                }

                if (!agent) {
                    status = 0;
                    message = 'No agent in database';
                    logger.info(message);
                    makeResponse(res, status, message, data);
                } else {
                    agent.location = params.location;
                    logger.info(agent);
                    FBase.ref('users/' + agent.uid).set(agent, function(err) {
                        if (err) {
                            status = 0;
                            message = err;
                        } else {
                            status = 1;
                            message = 'success';
                        }
        
                        makeResponse(res, status, message, data);
                    });
                }
            }
        });
    }
}


exports.pauseAgent = function (req, res, next) {
    logger.info('EXPRESS: post("/getAgents") --> RECEIVED'.event);

    var status, message, data;

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
        logger.info('Validation passed');
        FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
            var users = snapshot.val();

            var agent;
            if (!users) {
                status = 0;
                message = 'No agents in database';
                logger.info(message);
                makeResponse(res, status, message, data);
            } else {

                for (var u in users) {
                    if (users[u].uid == params.agent_id)
                        agent = users[u];
                }

                if (!agent) {
                    status = 0;
                    message = 'No agent in database';
                    logger.info(message);
                    makeResponse(res, status, message, data);
                } else {
                    agent.status = 'paused';

                    FBase.ref('users/' + agent.uid).set(agent, function(err) {
                        if (err) {
                            status = 0;
                            message = err;
                        } else {
                            status = 1;
                            message = agent;
                        }
        
                        makeResponse(res, status, message, data);
                    });
                }
            }
        });
    }
}

exports.getOnlineAgents = function (req, res, next) {
    logger.info('EXPRESS: post("/getOnlineAgents") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
    };

    FBase.ref('users').orderByChild('type').equalTo(`agent`).once('value', function (snapshot) {
        var users = snapshot.val();

        if (!users) {
            status = 0;
            message = 'No agents in database';
            logger.info(message);
            makeResponse(res, status, message, data);
        } else {
            var onlineAgents = [];

            for (var u in users) {
                if (users[u].socketID)
                    onlineAgents.push(users[u]);
            }

            status = 1;
            data = onlineAgents;
            makeResponse(res, status, message, data);
        }
    });
}

function makeResponse(res, status, message, data) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: status,
        message: message,
        data: data
    });
}



