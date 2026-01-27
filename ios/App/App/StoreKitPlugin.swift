import Foundation
import Capacitor
import StoreKit

/// Capacitor Plugin for StoreKit 2 integration
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {

    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchase", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSubscriptionStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getTransactionInfo", returnType: CAPPluginReturnPromise),
    ]

    // MARK: - Get Products

    /// Get available products from App Store
    @objc func getProducts(_ call: CAPPluginCall) {
        Task { @MainActor in
            let manager = StoreKitManager.shared

            // Wait for products to load if needed
            if manager.products.isEmpty {
                await manager.loadProducts()
            }

            if let error = manager.errorMessage {
                call.reject(error)
                return
            }

            let productsData = manager.products.map { product -> [String: Any] in
                return [
                    "id": product.id,
                    "displayName": product.displayName,
                    "description": product.description,
                    "price": product.price.description,
                    "displayPrice": product.displayPrice,
                    "type": product.type.rawValue,
                    "subscription": getSubscriptionInfo(product) as Any
                ]
            }

            call.resolve(["products": productsData])
        }
    }

    /// Extract subscription info from product
    private func getSubscriptionInfo(_ product: Product) -> [String: Any]? {
        guard let subscription = product.subscription else {
            return nil
        }

        var info: [String: Any] = [
            "subscriptionGroupID": subscription.subscriptionGroupID
        ]

        // Add subscription period info
        info["period"] = [
            "unit": periodUnitString(subscription.subscriptionPeriod.unit),
            "value": subscription.subscriptionPeriod.value
        ]

        return info
    }

    /// Convert period unit to string
    private func periodUnitString(_ unit: Product.SubscriptionPeriod.Unit) -> String {
        switch unit {
        case .day: return "day"
        case .week: return "week"
        case .month: return "month"
        case .year: return "year"
        @unknown default: return "unknown"
        }
    }

    // MARK: - Purchase

    /// Initiate a purchase for a product
    @objc func purchase(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId parameter")
            return
        }

        Task { @MainActor in
            do {
                let result = try await StoreKitManager.shared.purchase(productId: productId)

                call.resolve([
                    "success": result.success,
                    "cancelled": result.cancelled,
                    "pending": result.pending,
                    "productId": result.productId as Any,
                    "transactionId": result.transactionId as Any,
                    "originalTransactionId": result.originalTransactionId as Any,
                    "expirationDate": result.expirationDate as Any
                ])
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Restore Purchases

    /// Restore previously purchased products
    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task { @MainActor in
            do {
                let result = try await StoreKitManager.shared.restorePurchases()

                call.resolve([
                    "success": result.success,
                    "hasActiveSubscription": result.hasActiveSubscription,
                    "productIds": result.productIds
                ])
            } catch {
                call.reject("Restore failed: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Subscription Status

    /// Get current subscription status
    @objc func getSubscriptionStatus(_ call: CAPPluginCall) {
        Task { @MainActor in
            let status = await StoreKitManager.shared.getSubscriptionStatus()

            call.resolve([
                "isSubscribed": status.isSubscribed,
                "productId": status.productId as Any,
                "originalTransactionId": status.originalTransactionId as Any,
                "expirationDate": status.expirationDate as Any,
                "willAutoRenew": status.willAutoRenew
            ])
        }
    }

    // MARK: - Transaction Info

    /// Get transaction info for server verification
    @objc func getTransactionInfo(_ call: CAPPluginCall) {
        Task { @MainActor in
            if let info = await StoreKitManager.shared.getTransactionInfo() {
                call.resolve([
                    "transactionId": info.transactionId,
                    "originalTransactionId": info.originalTransactionId,
                    "productId": info.productId,
                    "purchaseDate": info.purchaseDate,
                    "expirationDate": info.expirationDate as Any,
                    "environment": info.environment
                ])
            } else {
                call.resolve(["hasTransaction": false])
            }
        }
    }
}
