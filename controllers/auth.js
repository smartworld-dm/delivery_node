
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
var Config = require('./config').Config;
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

exports.registerUser = function (req, res, next) {
    logger.info('EXPRESS: post("/registerUser") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            phone: {
                type: 'string'
            },
            email: {
                type: 'email'
            },
            password: {
                type: 'string'
            },
            type: {
                type: 'string'
            },
            username: {
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

        FBase.ref('users').once('value', function (snapshot) {
            var users = snapshot.val();

            var phone, email;
            for (var u in users) {
                if (users[u].phone == params.phone) {
                    phone = true;
                    break;
                }
                if (users[u].email == params.email) {
                    email = true;
                    break;
                }
            }

            if (phone) {
                status = 0;
                message = Config.dict.PHONE_ALREADY_REGISTERED;
                makeResponse(res, status, message, data);
            } else if (email) {
                status = 0;
                message = Config.dict.EMAIL_ALREADY_REGISTERED;
                makeResponse(res, status, message, data);
            } else {
                var uRef = FBase.ref('users').push();
                var uid = uRef.key;

                var user = params;
                user.uid = uid;

                uRef.set(user, function (err) {
                    if (err) {
                        status = 0;
                        message = err;
                    } else {
                        status = 1;
                        data = user;
                    }

                    makeResponse(res, status, message, data);
                });
            }
        });
    }
};

exports.authenticateUser = function (req, res, next) {
    logger.info('EXPRESS: post("/authenticateUser") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            phone: {
                type: 'string'
            },
            password: {
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

    
        FBase.ref('users').once('value', function(snapshot) {
            var users = snapshot.val();
            if (!users) {
                status = 0;
                message = 'No users in database';
            } else {
                var user;

                for (var u in users) {
                    if (users[u].phone == params.phone && users[u].password == params.password) {
                        user = users[u];
                        break;
                    }
                }

                if (!user) {
                    status = 0;
                    message = Config.dict.AUTHENTICATION_FAILED;
                } else {
                    status = 1;
                    data = user;
                }
            }

            makeResponse(res, status, message, data);
        });
    }
}

exports.getUserData = function (req, res, next) {
    logger.info('EXPRESS: post("/getUserData") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            uid: {
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
        makeResponse(res, status, message, data);
    } else {
        logger.info('Validation passed');

        FBase.ref('users/' + params.uid).once('value', function(snapshot) {
            var user = snapshot.val();

            if (!user) {
                status = 0;
                message = 'No such user in database';
            } else {
                status = 1;
                data = user;
            }

            makeResponse(res, status, message, data);
        });
    }
};

exports.resetPassword = function (req, res, next) {
    logger.info('EXPRESS: post("/resetPassword") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            email: {
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
        
        FBase.ref('users').orderByChild('email').equalTo(`${params.email}`).once('value', function(snapshot) {

        // FBase.ref('users').once('value', function(snapshot) {
            var users = snapshot.val();

            if (!users) {
                status = 0;
                message = 'This email is not registered with us. Please check it and submit again.';
                makeResponse(res, status, message, data);
            } else {
                var user;

                for (var u in users) {
                        user = users[u];
                        break;
                }

                var email = user.email;

                // create new password

                // write new password to FBase

                // send new password by email

                // respond

            }


        });
    }
};

exports.saveUserProfile = function (req, res, next) {
    logger.info('EXPRESS: post("/saveUserProfile") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            uid: {
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

        if (params.avatar) {
            FBase.ref('users/' + params.uid + '/avatar').set(params.avatar);
        }

        if (params.email) {
            FBase.ref('users/' + params.uid + '/email').set(params.email);
        }

        if (params.location) {
            FBase.ref('users/' + params.uid + '/location').set(params.location);
        }

        if (params.username) {
            FBase.ref('users/' + params.uid + '/username').set(params.username);

        }

        status = 1;
        makeResponse(res, status, message, data);
    }
};



exports.changeUserPassword = function (req, res, next) {
    logger.info('EXPRESS: post("/changeUserPassword") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            uid: {
                type: 'string'
            },
            password: {
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

        FBase.ref('users/' + params.uid + '/password').set(params.password, function(error) {
            if (error) {
                status = 0;
                message = error;
                makeResponse(res, status, message, data);
            } else {
                status = 1;
                makeResponse(res, status, message, data);
            }
        });
    }
};


exports.getCustomers = function (req, res, next) {
    logger.info('post("/getCustomers") --> RECEIVED'.event);
    var status, message, data;
    var agents = [];
    FBase.ref('users').orderByChild('type').equalTo(`customer`).once('value', function (snapshot) {
        var users = snapshot.val();

        if (!users) {
            status = 0;
            message = 'No customers in database';
            makeResponse(res, status, message, data);
        } else {
            for (var u in users) {
                agents.push(users[u]);
            }

            status = 1;
            data = agents;
            makeResponse(res, status, message, data);
        }
    });
};

function makeResponse(res, status, message, data) {
    res.set('Access-Control-Allow-Origin', '*');
    res.status(200).json({
        status: status,
        message: message,
        data: data
    });
}



