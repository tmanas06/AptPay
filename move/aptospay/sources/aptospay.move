module AptosPay::AptosPay {
    use std::signer;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use std::event::{Self, EventHandle};
    use std::string::String;

    /// Event emitted when a payment is sent
    struct PaymentSentEvent has drop, store {
        sender: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    /// Event emitted when a payment is received
    struct PaymentReceivedEvent has drop, store {
        sender: address,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    /// Resource to store payment events for a user
    struct PaymentEvents has key {
        sent_events: EventHandle<PaymentSentEvent>,
        received_events: EventHandle<PaymentReceivedEvent>,
    }

    /// Initialize payment events for a user
    public entry fun initialize(sender: &signer) {
        let sender_addr = signer::address_of(sender);
        assert!(!exists<PaymentEvents>(sender_addr), 1); // Error code 1: already initialized
        
        move_to(sender, PaymentEvents {
            sent_events: event::new_event_handle<PaymentSentEvent>(sender),
            received_events: event::new_event_handle<PaymentReceivedEvent>(sender),
        });
    }

    /// Send Aptos tokens to another address
    public entry fun send(
        sender: &signer,
        recipient: address,
        amount: u64
    ) acquires PaymentEvents {
        let sender_addr = signer::address_of(sender);
        
        // Ensure sender has PaymentEvents initialized
        assert!(exists<PaymentEvents>(sender_addr), 2); // Error code 2: not initialized
        
        // Transfer the coins
        coin::transfer<AptosCoin>(sender, recipient, amount);
        
        // Get current timestamp (simplified - in production use aptos_framework::timestamp)
        let timestamp = 0; // Replace with actual timestamp in production
        
        // Emit events
        let payment_events = borrow_global_mut<PaymentEvents>(sender_addr);
        event::emit_event(&mut payment_events.sent_events, PaymentSentEvent {
            sender: sender_addr,
            recipient,
            amount,
            timestamp,
        });
        
        // Emit received event for recipient if they have PaymentEvents initialized
        if (exists<PaymentEvents>(recipient)) {
            let recipient_events = borrow_global_mut<PaymentEvents>(recipient);
            event::emit_event(&mut recipient_events.received_events, PaymentReceivedEvent {
                sender: sender_addr,
                recipient,
                amount,
                timestamp,
            });
        }
    }

    /// Get the balance of Aptos coins for an address
    public fun get_balance(addr: address): u64 {
        coin::balance<AptosCoin>(addr)
    }

    /// Check if an address has PaymentEvents initialized
    public fun has_payment_events(addr: address): bool {
        exists<PaymentEvents>(addr)
    }
}
