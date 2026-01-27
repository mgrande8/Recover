import UIKit
import Capacitor

class BridgeViewController: CAPBridgeViewController {

    override open func capacitorDidLoad() {
        // Register the StoreKit plugin
        bridge?.registerPluginInstance(StoreKitPlugin())
    }
}
