const Agent = require('./controllers/agent');
const Auth = require('./controllers/auth');
const Data = require('./controllers/data');
const District = require('./controllers/district');
const Price = require('./controllers/price');
const RequestAgent = require('./controllers/requestAgent');
const RequestStore = require('./controllers/requestStore');
const Store = require('./controllers/store');
const Order = require('./controllers/order');
const Report = require('./controllers/report');

module.exports = function (app) {
    app.post('/getAgents', Agent.getAgents);
    app.post('/activateAgent', Agent.activateAgent);
    app.post('/pauseAgent', Agent.pauseAgent);
    app.post('/changePercentage', Agent.changePercentage);
    app.post('/updateAgent', Agent.updateAgent);
    app.post('/addAgentNamePassword', Agent.addAgentNamePassword);
    app.post('/getOnlineAgents', Agent.getOnlineAgents);
    app.post('/updateAgentLocation', Agent.updateAgentLocation);

    
    app.post('/registerUser', Auth.registerUser);
    app.post('/authenticateUser', Auth.authenticateUser);
    app.post('/getUserData', Auth.getUserData);
    app.post('/resetPassword', Auth.resetPassword);
    app.post('/saveUserProfile', Auth.saveUserProfile);
    app.post('/changeUserPassword', Auth.changeUserPassword);
    app.post('/getCustomers', Auth.getCustomers);
    

    app.post('/uploadImage', Data.uploadImage);
    app.post('/getCities', Data.getCities);
    app.post('/getSupportData', Data.getSupportData);
    app.post('/getTerms', Data.getTerms);
    app.post('/saveAbout', Data.saveAbout);
    app.post('/getAboutData', Data.getAboutData);
    app.post('/getAboutMoney', Data.getAboutMoney);
    app.post('/saveSupport', Data.saveSupport);
    app.post('/saveTerms', Data.saveTerms);
    app.post('/getOrderTypes', Data.getOrderTypes);

    app.post('/addDistrict', District.addDistrict);
    app.post('/deleteDistrict', District.deleteDistrict);
    app.post('/getAllDistricts', District.getAllDistricts);

    app.post('/addPersonalOrder', Order.addPersonalOrder);
    app.post('/addStoreOrderRequest', Order.addStoreOrderRequest);
    app.post('/getOrdersPending', Order.getOrdersPending);
    app.post('/getOrdersAccepted', Order.getOrdersAccepted);
    app.post('/getOrdersCompleted', Order.getOrdersCompleted);
    app.post('/getOrdersRejected', Order.getOrdersRejected);
    app.post('/getOrders', Order.getOrders);
    app.post('/rejectDeliveryRequest', Order.rejectDeliveryRequest);
    app.post('/acceptDeliveryRequest', Order.acceptDeliveryRequest);
    app.post('/completeOrder', Order.completeOrder);

    app.post('/addPrice', Price.addPrice);
    app.post('/deletePrice', Price.deletePrice);
    app.post('/getAllPrices', Price.getAllPrices);

    app.post('/addAgentRequest', RequestAgent.addAgentRequest);
    app.post('/getAgentRequests', RequestAgent.getAgentRequests);
    app.post('/acceptAgentRequest', RequestAgent.acceptAgentRequest);
    app.post('/rejectAgentRequest', RequestAgent.rejectAgentRequest);
    
    app.post('/getAgentRequestsPending', RequestAgent.getAgentRequestsPending);
    app.post('/getAgentRequestsAccepted', RequestAgent.getAgentRequestsAccepted);
    app.post('/getAgentRequestsRejected', RequestAgent.getAgentRequestsRejected);

    app.post('/acceptStoreRequest', RequestStore.acceptStoreRequest);
    app.post('/rejectStoreRequest', RequestStore.rejectStoreRequest);
    app.post('/acceptHomeStoreRequest', RequestStore.acceptHomeStoreRequest);
    app.post('/rejectHomeStoreRequest', RequestStore.rejectHomeStoreRequest);
    

    app.post('/getStoreRequestsPending', RequestStore.getStoreRequestsPending);
    app.post('/getStoreRequestsRejected', RequestStore.getStoreRequestsRejected);
    app.post('/getStoreRequestsAccepted', RequestStore.getStoreRequestsAccepted);
    app.post('/getHomeStoreRequestsPending', RequestStore.getHomeStoreRequestsPending);
    app.post('/getHomeStoreRequestsRejected', RequestStore.getHomeStoreRequestsRejected);
    app.post('/getHomeStoreRequestsAccepted', RequestStore.getHomeStoreRequestsAccepted);

    app.post('/addHomeStoreRequest', RequestStore.addHomeStoreRequest);
    app.post('/addStoreRequest', RequestStore.addStoreRequest);

    

    app.post('/getStores', Store.getStores);
    app.post('/getHomeStores', Store.getHomeStores);
    app.post('/getMyStore', Store.getMyStore);
    app.post('/getPlaces', Store.getPlaces);
    app.post('/deleteStore', Store.deleteStore);
    app.post('/updateStore', Store.updateStore);
    app.post('/updateHomeStore', Store.updateHomeStore);



    app.post('/reportCustomers', Report.reportCustomers);
    app.post('/reportNumOrdersFromStores', Report.reportNumOrdersFromStores);
    app.post('/reportNumOrdersFromHomeStores', Report.reportNumOrdersFromHomeStores);
    app.post('/reportTotalCostFromStores', Report.reportTotalCostFromStores);
    app.post('/reportTotalCostFromHomeStores', Report.reportTotalCostFromHomeStores);
    app.post('/reportTotalCostFromDelivery', Report.reportTotalCostFromDelivery);
    app.post('/reportNumPickedOrdersFromStores', Report.reportNumPickedOrdersFromStores);
    app.post('/reportNumPickedOrdersFromHomeStores', Report.reportNumPickedOrdersFromHomeStores);
    app.post('/reportNumAgentOrdersFromStores', Report.reportNumAgentOrdersFromStores);
    app.post('/reportNumAgentOrdersFromHomeStores', Report.reportNumAgentOrdersFromHomeStores);
    app.post('/reportAgentTotalCostDelivery', Report.reportAgentTotalCostDelivery);
    app.post('/reportNumOrdersFromStore', Report.reportNumOrdersFromStore);
    app.post('/reportNumOrdersFromHomeStore', Report.reportNumOrdersFromHomeStore);
    app.post('/reportTotalCostOrdersFromStore', Report.reportTotalCostOrdersFromStore);
    app.post('/reportTotalCostOrdersFromHomeStore', Report.reportTotalCostOrdersFromHomeStore);
    app.post('/reportTotalCostDeliveryFromStore', Report.reportTotalCostDeliveryFromStore);
    app.post('/reportTotalCostDeliveryFromHomeStore', Report.reportTotalCostDeliveryFromHomeStore);

    app.post('/reportOrdersFromStoreByTime', Report.reportOrdersFromStoreByTime);
    app.post('/reportOrdersFromHomeStoreByTime', Report.reportOrdersFromHomeStoreByTime);
    app.post('/getAgentOrdersByTime', Report.getAgentOrdersByTime);

    app.post('/reportAgentHours', Report.reportAgentHours);
}
