#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// This file is required for Capacitor to register the Swift plugin

CAP_PLUGIN(StoreKitPlugin, "StoreKit",
    CAP_PLUGIN_METHOD(getProducts, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(purchase, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(restorePurchases, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getSubscriptionStatus, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getTransactionInfo, CAPPluginReturnPromise);
)
