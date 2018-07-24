
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

// multipart ( for file upload )
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var multiparty = require('multiparty');

// cloudinary
var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'setreflex',
    api_key: '834788356866988',
    api_secret: 'ne5hfapoxazxDOV4jVsEsRJ_Fu0'
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

exports.uploadImage = function (req, res, next) {
    logger.info('EXPRESS: post("/uploadImage") --> RECEIVED'.event);

    var status, message, data;

    var form = new multiparty.Form();

    console.log(req);
    form.parse(req, function(err, fields, files) {
        logger.info('err: %O', err);
        logger.info('fields: %O', fields);
        logger.info('files: %O', files);

        var filePath = files.file[0].path;

        cloudinary.uploader.upload(
            filePath,
            function(result) {
                logger.info('cloudinary upload result: %O', result);

                var url = result.secure_url;

                status = 1;
                data = url;
                makeResponse(res, status, message, data);
            }
        );
    });
};

exports.clearAllPushTokens = function (req, res, next) {
    logger.info('EXPRESS: get("/clearAllPushTokens") --> RECEIVED'.event);

    var status, message, data;

    FBase.ref('users').once('value', function(snapshot) {
        var users = snapshot.val();

        for (var u in users) {
            FBase.ref('users/' + u + '/pushTokens').remove();
        }
        logger.info('All pushTokens cleared!');

        status = 1;
        makeResponse(res, status, message, data);
    });
};

exports.getCities = function (req, res, next) {
    logger.info('EXPRESS: post("/getCities") --> RECEIVED'.event);
    var status, message, data;

    var cities = [
            'جـــدة'
            // 'مـكــة'
    ];

    status = 1;
    data = cities;
    makeResponse(res, status, message, data);
};


exports.getOrderTypes = function (req, res, next) {
    logger.info('EXPRESS: post("/getOrderTypes") --> RECEIVED'.event);
    var status, message, data;

    var order_types = [
        'مأكولات',
        'حلويات',
        'مشروبات',
        'اكسسوارات',
        'عدسات',
        'ساعات',
        'توزيعات',
        'الكترونيات',
        'لوحات ورسومات',
        'ملابس رجاليه',
        'ملابس نسائية',
        'ملابس اطفال',
        'تجميل',
        'منتجات مستوردة',
        'ورود و هدايا',
        'مستلزمات منزلية',
        'منتجات رياضية',
        'أخرى'
    ];

    status = 1;
    data = order_types;
    makeResponse(res, status, message, data);
};


exports.getSupportData = function (req, res, next) {
    logger.info('EXPRESS: post("/getSupportData") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object'
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

        FBase.ref('settings/support').once('value', function(snapshot) {
            data = snapshot.val();
            status = 1;
            makeResponse(res, status, message, data);
        });
    }
};

exports.getAboutMoney = function (req, res, next) {
    logger.info('EXPRESS: post("/getAboutMoney") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object'
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

        FBase.ref('settings/aboutMoney').once('value', function(snapshot) {
            data = snapshot.val();
            status = 1;
            makeResponse(res, status, message, data);
        });
    }
};

exports.saveTerms = function (req, res, next) {
    logger.info('EXPRESS: post("/saveTerms") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            terms: {
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

        FBase.ref('settings/terms').set(params.terms, function(err) {
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


exports.saveSupport = function (req, res, next) {
    logger.info('EXPRESS: post("/saveSupport") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            support: {
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

        FBase.ref('settings/support').set(params.support, function(err) {
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

exports.getTerms = function (req, res, next) {
    logger.info('EXPRESS: post("/getTerms") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object'
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

        FBase.ref('settings/terms').once('value', function(snapshot) {
            data = snapshot.val();
            status = 1;
            makeResponse(res, status, message, data);
        });
    }
};


exports.saveAbout = function (req, res, next) {
    logger.info('EXPRESS: post("/saveAbout") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object',
        properties: {
            about: {
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

        FBase.ref('settings/about').set(params.about, function(err) {
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

exports.getAboutData = function (req, res, next) {
    logger.info('EXPRESS: post("/getAboutData") --> RECEIVED'.event);

    var status, message, data;

    var schema = {
        type: 'object'
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

        FBase.ref('settings/about').once('value', function(snapshot) {
            data = snapshot.val();
            status = 1;
            makeResponse(res, status, message, data);
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



