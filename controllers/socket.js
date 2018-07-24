var q = require('q');
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


var sockets = [];
var onlineAgents = [];
var _IO;

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


function initializeSocket(io) {
    setInterval(function () {
        var message = {
            timestamp: Date.now()
        };
        io.emit('track', message);
    }, 20000);

    _IO = io;
    logger.info('initializeSocket');
    // logger.info(socket);
    io.on('connection', function (socket) {
        logger.info('User connected. Socket.id: %s'.info, socket.id);
        sockets.push(socket);


        socket.on('test', function (user) {
            logger.info('Socket (test) <-- RECEIVED '.event);
        });

        socket.on('pushIsRegistered', function (obj) {
            logger.info('Socket (pushIsRegistered) <-- RECEIVED '.event);
            logger.info('OBJ: %O', obj);

            FBase.ref('users').once('value', function (snpu) {
                var usrs = snpu.val();

                for (var u in usrs) {
                    if (usrs[u].pushTokens) {
                        for (var p in usrs[u].pushTokens) {
                            if (usrs[u].pushTokens[p].token == obj.token) {
                                FBase.ref('users/' + u + '/pushTokens/' + p).remove();
                            }
                        }
                    }
                }

                FBase.ref('users/' + obj.uid + '/pushTokens').once('value', function (snapshot) {
                    var tokens = snapshot.val();

                    var flag = false;
                    for (var t in tokens) {
                        if (tokens[t].token == obj.token) {
                            flag = true;
                            break;
                        }
                    }

                    if (!flag) {
                        var newToken = obj;
                        FBase.ref('users/' + obj.uid + '/pushTokens').push(newToken, function (err) {
                            if (err) {
                                socket.emit('error', err);
                                logger.info('Socket (error) --> SENT '.event);
                            }
                        });
                    }

                    FBase.ref('users/' + obj.uid + '/socketID').set(socket.id, function (er) {
                        if (er) {
                            socket.emit('error', err);
                            logger.info('Socket (error) --> SENT '.event);
                        } else {
                            logger.info('Socket Set : %O', socket.id);
                        }
                    });
                });
            });
        });

        socket.on('markNotificationsAsRead', function (obj) {
            logger.info('Socket (markNotificationsAsRead) <-- RECEIVED '.event);
            logger.info('OBJ: %O', obj);

            FBase.ref('users/' + obj.uid).once('value', function (snpu) {
                var user = snpu.val();

                for (var n in user.notifications) {
                    user.notifications[n].status = 'read';
                }

                FBase.ref('users/' + obj.uid).set(user, function (err) {
                    var respo = {};

                    if (err) {
                        respo.status = 0;
                        respo.message = err;
                    } else {
                        respo.status = 1;
                    }

                    socket.emit('notifications', user.notifications);
                });
            });
        });

        socket.on('registerSocket', function (obj) {
            logger.info('Socket (registerSocket) <-- RECEIVED '.event);
            logger.info('OBJ: %O', obj);
            logger.info('Socket ID : %O', socket.id);
            FBase.ref('users/' + obj.uid).once('value', function (snpu) {
                var user = snpu.val();

                console.log(user.type);
                console.log('socket.id : %O', socket.id);
                user.socketID = socket.id;
              
                FBase.ref('users/' + obj.uid).set(user, function(error){
                    console.log(error);
                });

                socket.emit('updateUser', user);
            });
        });


        socket.on('agentOnline', function (agent) {
            logger.info('Socket (agentOnline) <-- RECEIVED '.event);
            logger.info('socket.id: %s'.event, socket.id);
            logger.info('user: %O', agent);

            onlineAgents.push({
                uid: agent.uid,
                socket: socket
            });

            FBase.ref('users/' + agent.uid).once('value', function (snpu) {
                var user = snpu.val();
                console.log('agentOnline User: %O', user);
                if (user) {
                    var currentTime = Date.now();
                    user.last_online = currentTime;
                    user.socketID = socket.id;
                    logger.info('lastOnline : %O', currentTime);
                    FBase.ref('users/' + agent.uid).set(user);
                }
            });
        });

        function setOffline(agent) {
            logger.info('Socket (agentOffline) <-- RECEIVED '.event);
            logger.info('socket.id: %s'.event, socket.id);
            logger.info('agent: %O', agent);

            for (var o = 0; o < onlineAgents.length; o++) {
                if (socket.id == onlineAgents[o].socket.id) {
                    onlineAgents.splice(o, 1);
                    break;
                }
            }

            FBase.ref('users/' + agent.uid).once('value', function (snpu) {
                var user = snpu.val();

                if (user) {
                    FBase.ref(`/online_history`).orderByChild('agent_id').equalTo(`${user.uid}`).once('value', function (snapshot) {
                        var histories = snapshot.val();
                        var history;

                        var currentTime = Date.now();
                        for (var h in histories) {
                            history = histories[h];
                            history.hours += currentTime - user.last_online;

                            logger.info('history : %O', history);
                            FBase.ref('online_history/' + h).set(history);
                        }
                        if (!history) {

                            history = {
                                agent_id: agent.uid,
                                hours: 0
                            };

                            if (user.last_online) {
                                history.hours = currentTime - user.last_online;
                            }


                            FBase.ref('online_history').push(history);
                        }

                        user.last_online = currentTime;

                        FBase.ref('users/' + agent.uid).set(user);
                    });
                }
            });
        }
        socket.on('agentOffline', function (agent) {
            setOffline(agent);
        });


        socket.on('logout', function (user) {
            logger.info('Socket (logout) <-- RECEIVED '.event);

            for (var i = 0; i < sockets.length; i++) {
                if (sockets[i].id == socket.id) {
                    sockets.splice(i, 1);
                    break;
                }
            }

            for (var o = 0; o < onlineAgents.length; o++) {
                if (socket.id == onlineAgents[o].socket.id) {
                    onlineAgents.splice(o, 1);
                    break;
                }
            }

            FBase.ref('users').once('value', function (snapshot) {
                var users = snapshot.val();

                for (var u in users) {
                    if (users[u].socketID == socket.id) {
                        FBase.ref('users/' + u + '/socketID').remove();
                        break;
                    }
                }
            });
        });


        /**********************************************************************************************/
        socket.on('disconnect', function () {
            logger.info('User %s DISCONNECTED'.error, socket.id);

            for (var i = 0; i < sockets.length; i++) {
                if (sockets[i].id == socket.id) {
                    sockets.splice(i, 1);
                    break;
                }
            }

            for (var o = 0; o < onlineAgents.length; o++) {
                if (socket.id == onlineAgents[o].socket.id) {
                    onlineAgents.splice(o, 1);

                    logger.info('remove online agent');

                    FBase.ref('users').once('value', function (snapshot) {
                        var users = snapshot.val();
                        try {
                            for (var u in users) {
                                console.log(users[u].socketID);
                                if (users[u].socketID == socket.id) {
                                    setOffline(users[u]);
                                }
                            }
                        } catch (error) {

                        }

                        // Remove socketids so let users offline
                        FBase.ref('users').once('value', function (snapshot) {
                            var users = snapshot.val();

                            for (var u in users) {
                                if (users[u].socketID == socket.id) {
                                    FBase.ref('users/' + u + '/socketID').remove();
                                    break;
                                }
                            }
                        });
                    });

                    break;
                }
            }



        });
        /**********************************************************************************************/

    });
}

function makeNotification(uid, message) {
    var defer = q.defer();

    var notification = {
        text: message,
        timestamp: new Date().getTime(),
        status: 'unread'
    };

    logger.info('makeNotification');

    FBase.ref('users/' + uid + '/notifications').push(notification, function (e) {
        if (e) {
            defer.reject(e);
            logger.info('makeNotification failure');
        } else {

            logger.info('makeNotification pushed notifications');

            FBase.ref('users/' + uid).once('value', function (snpn) {
                var user = snpn.val();
                logger.info('makeNotification success');
                logger.info(user.socketID)
                for (var s in sockets) {
                    logger.info(sockets[s].id)
                    if (sockets[s].id == user.socketID) {
                        logger.info('socket emit');
                        sockets[s].emit('notifications', user.notifications);
                        break;
                    }
                }

                defer.resolve(true);
            });
        }
    });

    return defer.promise;
}

exports.initializeSocket = initializeSocket;
exports.makeNotification = makeNotification;

exports.getOnlineAgents = function () {
    return onlineAgents;
}

exports.getOnlineSockets = function(){
    return sockets;
}