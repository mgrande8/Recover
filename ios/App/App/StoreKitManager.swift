import Foundation
import StoreKit

/// StoreKit 2 Manager for handling In-App Purchases
@MainActor
class StoreKitManager: ObservableObject {

    // MARK: - Product IDs
    static let monthlyProductId = "com.mgrande8.recover.monthly"
    static let annualProductId = "com.mgrande8.recover.annual"

    static let allProductIds: Set<String> = [monthlyProductId, annualProductId]

    // MARK: - Published Properties
    @Published private(set) var products: [Product] = []
    @Published private(set) var purchasedProductIDs: Set<String> = []
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    // MARK: - Private Properties
    private var updateListenerTask: Task<Void, Error>?

    // MARK: - Singleton
    static let shared = StoreKitManager()

    // MARK: - Initialization
    private init() {
        // Start listening for transaction updates
        updateListenerTask = listenForTransactions()

        // Load products on init
        Task {
            await loadProducts()
            await updatePurchasedProducts()
        }
    }

    deinit {
        updateListenerTask?.cancel()
    }

    // MARK: - Product Loading

    /// Load available products from App Store Connect
    func loadProducts() async {
        isLoading = true
        errorMessage = nil

        print("StoreKit: Loading products with IDs: \(StoreKitManager.allProductIds)")

        do {
            let storeProducts = try await Product.products(for: StoreKitManager.allProductIds)

            print("StoreKit: Loaded \(storeProducts.count) products")
            for product in storeProducts {
                print("StoreKit: Product - ID: \(product.id), Name: \(product.displayName), Price: \(product.displayPrice)")
            }

            // Sort products: monthly first, then annual
            products = storeProducts.sorted { product1, product2 in
                if product1.id == StoreKitManager.monthlyProductId {
                    return true
                }
                if product2.id == StoreKitManager.monthlyProductId {
                    return false
                }
                return product1.price < product2.price
            }

            if products.isEmpty {
                print("StoreKit: WARNING - No products returned from App Store!")
                errorMessage = "No products available. Products may still be processing in App Store Connect."
            }

            isLoading = false
        } catch {
            errorMessage = "Failed to load products: \(error.localizedDescription)"
            isLoading = false
            print("StoreKit: Failed to load products - \(error)")
        }
    }

    // MARK: - Purchase

    /// Purchase a product by ID
    func purchase(productId: String) async throws -> PurchaseResult {
        print("StoreKit: Attempting to purchase product: \(productId)")
        print("StoreKit: Available products count: \(products.count)")
        for p in products {
            print("StoreKit: Available product: \(p.id)")
        }

        guard let product = products.first(where: { $0.id == productId }) else {
            print("StoreKit: Product NOT FOUND in loaded products!")
            throw StoreKitError.productNotFound
        }

        return try await purchase(product: product)
    }

    /// Purchase a specific product
    func purchase(product: Product) async throws -> PurchaseResult {
        isLoading = true
        errorMessage = nil

        do {
            let result = try await product.purchase()

            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)

                // Update purchased products
                await updatePurchasedProducts()

                // Finish the transaction
                await transaction.finish()

                isLoading = false

                return PurchaseResult(
                    success: true,
                    productId: product.id,
                    transactionId: String(transaction.id),
                    originalTransactionId: String(transaction.originalID),
                    expirationDate: transaction.expirationDate?.ISO8601Format()
                )

            case .userCancelled:
                isLoading = false
                return PurchaseResult(success: false, cancelled: true)

            case .pending:
                isLoading = false
                return PurchaseResult(success: false, pending: true)

            @unknown default:
                isLoading = false
                return PurchaseResult(success: false)
            }
        } catch {
            isLoading = false
            errorMessage = "Purchase failed: \(error.localizedDescription)"
            throw error
        }
    }

    // MARK: - Restore Purchases

    /// Restore previously purchased products
    func restorePurchases() async throws -> RestoreResult {
        isLoading = true
        errorMessage = nil

        do {
            // Sync with App Store
            try await AppStore.sync()

            // Update purchased products
            await updatePurchasedProducts()

            isLoading = false

            // Check if we have any active subscriptions
            let hasActiveSubscription = !purchasedProductIDs.isEmpty

            return RestoreResult(
                success: true,
                hasActiveSubscription: hasActiveSubscription,
                productIds: Array(purchasedProductIDs)
            )
        } catch {
            isLoading = false
            errorMessage = "Restore failed: \(error.localizedDescription)"
            throw error
        }
    }

    // MARK: - Subscription Status

    /// Get the current subscription status
    func getSubscriptionStatus() async -> SubscriptionStatus {
        await updatePurchasedProducts()

        // Get the active subscription details
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if StoreKitManager.allProductIds.contains(transaction.productID) {
                    return SubscriptionStatus(
                        isSubscribed: true,
                        productId: transaction.productID,
                        originalTransactionId: String(transaction.originalID),
                        expirationDate: transaction.expirationDate?.ISO8601Format(),
                        willAutoRenew: transaction.revocationDate == nil
                    )
                }
            }
        }

        return SubscriptionStatus(isSubscribed: false)
    }

    /// Get transaction info for server verification
    func getTransactionInfo() async -> TransactionInfo? {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if StoreKitManager.allProductIds.contains(transaction.productID) {
                    return TransactionInfo(
                        transactionId: String(transaction.id),
                        originalTransactionId: String(transaction.originalID),
                        productId: transaction.productID,
                        purchaseDate: transaction.purchaseDate.ISO8601Format(),
                        expirationDate: transaction.expirationDate?.ISO8601Format(),
                        environment: transaction.environment.rawValue
                    )
                }
            }
        }
        return nil
    }

    // MARK: - Private Methods

    /// Listen for transaction updates (renewals, refunds, etc.)
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in Transaction.updates {
                do {
                    let transaction = try await self.checkVerified(result)

                    // Update purchased products on main thread
                    await self.updatePurchasedProducts()

                    // Always finish the transaction
                    await transaction.finish()
                } catch {
                    print("StoreKit: Transaction verification failed - \(error)")
                }
            }
        }
    }

    /// Update the set of purchased product IDs
    private func updatePurchasedProducts() async {
        var purchasedIds: Set<String> = []

        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                if transaction.revocationDate == nil {
                    purchasedIds.insert(transaction.productID)
                }
            }
        }

        purchasedProductIDs = purchasedIds
    }

    /// Verify a transaction result
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw StoreKitError.verificationFailed(error)
        case .verified(let safe):
            return safe
        }
    }
}

// MARK: - Error Types

enum StoreKitError: Error, LocalizedError {
    case productNotFound
    case verificationFailed(Error)
    case purchaseFailed(Error)

    var errorDescription: String? {
        switch self {
        case .productNotFound:
            return "Product not found"
        case .verificationFailed(let error):
            return "Verification failed: \(error.localizedDescription)"
        case .purchaseFailed(let error):
            return "Purchase failed: \(error.localizedDescription)"
        }
    }
}

// MARK: - Result Types

struct PurchaseResult: Codable {
    let success: Bool
    var cancelled: Bool = false
    var pending: Bool = false
    var productId: String?
    var transactionId: String?
    var originalTransactionId: String?
    var expirationDate: String?
    var error: String?
}

struct RestoreResult: Codable {
    let success: Bool
    var hasActiveSubscription: Bool = false
    var productIds: [String] = []
    var error: String?
}

struct SubscriptionStatus: Codable {
    let isSubscribed: Bool
    var productId: String?
    var originalTransactionId: String?
    var expirationDate: String?
    var willAutoRenew: Bool = false
}

struct TransactionInfo: Codable {
    let transactionId: String
    let originalTransactionId: String
    let productId: String
    let purchaseDate: String
    var expirationDate: String?
    let environment: String
}
