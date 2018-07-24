var Config = require('./config').Config;
// promise
var q = require('q');
//inspector
var inspector = require('schema-inspector');

var firebase = require("firebase");
var FBase = firebase.database();

function notifyCustomerThereIsNoAvailableAgent(dRequest) {
    sendPushNotification(
        dRequest.customerUID,
        'noAgentAvailable',
        Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_TITLE,
        Config.dict.DELIVERY_REQUEST_NO_AGENT_AVAILABLE_MESSAGE
    );
}

function notifyHomeStoreOwnerOfNewDeliveryRequest(uid) {

    var defer = q.defer();

    sendPushNotification(
        uid,
        'newOrderForHomeStoreOwner',
        Config.dict.NEW_HOME_STORE_DELIVERY_REQUEST_TITLE,
        Config.dict.NEW_HOME_STORE_DELIVERY_REQUEST_MESSAGE
    )
        .then(
            function (success) {
                defer.resolve(true);
            },
            function (error) {
                defer.reject(error);
            }
        );

    return defer.promise;
}

function notifyCustomerOfRequestAcceptance(dRequest) {
    var defer = q.defer();

    var ownerUID = dRequest.customerUID;
    console.log('About to send a push notification to user with uid: %s, saying his request have been accepted!', ownerUID);

    sendPushNotification(
        ownerUID,
        'requestAcceptedForCustomer',
        Config.dict.CUSTOMER_ORDER_TITLE,
        Config.dict.CUSTOMER_ORDER_MESSAGE
    ).then(
        function (success) {
            defer.resolve(true);
        },
        function (error) {
            defer.reject(error);
        }
    );

    return defer.promise;
}

function notifyAgentOfNewDeliveryRequest(agent, orders) {
    var defer = q.defer();

    sendPushNotification(
        agent.uid,
        'newDeliveryRequestForAgent',
        Config.dict.NEW_DELIVERY_REQUEST_FOR_AGENT_TITLE,
        Config.dict.NEW_DELIVERY_REQUEST_FOR_AGENT_MESSAGE,
        orders
    )
        .then(
            function (success) {
                defer.resolve(true);
            },
            function (error) {
                defer.reject(error);
            }
        );

    return defer.promise;
}

function sendPushNotification(uid, scope, title, msg, orders) {
    var defer = q.defer();

    FBase.ref('users/' + uid).once('value', function (snapshot) {
        var user = snapshot.val();
        var tokensToBeNotified = [];
        var message;
        var orderIDs = [];

        if (orders) {
            for (var o in orders) {
                orderIDs.push(orders[o].id);
            }
        }

        message = {
            priority: 'high',
            collapse_key: 'test_colapse_key',
            data: {
                scope: scope,
                message: msg,
                title: title
            },
            notification: {
                title: title,
                body: msg,
                sound: 'default',
                click_action: 'FCM_PLUGIN_ACTIVITY',
                iconkey: 'fcm_push_icon',
            }
        };

        if (orderIDs.length > 0) {
            message.data.orders = orderIDs;
        }

        if (user != undefined)
            for (var t in user.pushTokens) {
                message.to = user.pushTokens[t].token,

                    //callback style
                    fcm.send(message, function (err, response) {
                        if (err) {
                            console.log("Something has gone wrong with the push: %O", err);
                        } else {
                            console.log("Successfully sent push, with response: %O", response);
                        }
                    });
            }

        defer.resolve(true);
    });

    return defer.promise;
}


exports.sendPushNotification = sendPushNotification;
exports.notifyCustomerThereIsNoAvailableAgent = notifyCustomerThereIsNoAvailableAgent;
exports.notifyHomeStoreOwnerOfNewDeliveryRequest = notifyHomeStoreOwnerOfNewDeliveryRequest;
exports.notifyCustomerOfRequestAcceptance = notifyCustomerOfRequestAcceptance;
exports.notifyAgentOfNewDeliveryRequest = notifyAgentOfNewDeliveryRequest;

