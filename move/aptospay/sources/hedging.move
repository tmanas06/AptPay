module aptospay::hedging {
    use std::signer;
    use std::vector;
    use std::table::{Self, Table};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    /// Errors
    const E_HEDGE_NOT_FOUND: u64 = 1;
    const E_INSUFFICIENT_COLLATERAL: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;
    const E_HEDGE_ALREADY_EXISTS: u64 = 5;
    const E_INVALID_STRATEGY: u64 = 6;
    const E_EXPIRED_HEDGE: u64 = 7;
    const E_INSUFFICIENT_PREMIUM: u64 = 8;

    /// Hedging strategies
    const STRATEGY_DELTA_NEUTRAL: u8 = 0;
    const STRATEGY_PROTECTIVE_PUT: u8 = 1;
    const STRATEGY_COVERED_CALL: u8 = 2;
    const STRATEGY_IRON_CONDOR: u8 = 3;

    /// Hedge status
    const HEDGE_ACTIVE: u8 = 0;
    const HEDGE_EXPIRED: u8 = 1;
    const HEDGE_EXERCISED: u8 = 2;
    const HEDGE_CLOSED: u8 = 3;

    struct HedgePosition has store {
        id: u64,
        owner: address,
        underlying_asset: String,
        hedge_strategy: u8,
        notional_amount: u64,
        premium_paid: u64,
        collateral_amount: u64,
        strike_price: u64,
        expiry_timestamp: u64,
        status: u8,
        pnl: u64,
        created_at: u64,
    }

    struct UserHedges has key {
        hedges: Table<u64, HedgePosition>,
        next_hedge_id: u64,
        total_collateral: u64,
        total_premium: u64,
    }

    struct HedgingRegistry has key {
        hedges: Table<u64, HedgePosition>,
        next_hedge_id: u64,
        total_premium_collected: u64,
    }

    struct HedgingConfig has key {
        min_collateral_ratio: u64, // 110% = 11000 basis points
        max_hedge_duration: u64, // 365 days in seconds
        premium_rate: u64, // 2% = 200 basis points
        liquidation_threshold: u64, // 105% = 10500 basis points
    }

    struct RiskMetrics has key {
        total_hedged_value: u64,
        total_premium_collected: u64,
        active_hedges: u64,
        expired_hedges: u64,
        liquidated_hedges: u64,
    }

    /// Initialize the hedging module
    public fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, HedgingRegistry {
            hedges: table::new(),
            next_hedge_id: 0,
            total_premium_collected: 0,
        });

        move_to(admin, HedgingConfig {
            min_collateral_ratio: 11000, // 110%
            max_hedge_duration: 31536000, // 365 days
            premium_rate: 200, // 2%
            liquidation_threshold: 10500, // 105%
        });

        move_to(admin, RiskMetrics {
            total_hedged_value: 0,
            total_premium_collected: 0,
            active_hedges: 0,
            expired_hedges: 0,
            liquidated_hedges: 0,
        });
    }

    /// Initialize user hedging positions
    public fun initialize_user_hedges(user: &signer) {
        let user_addr = signer::address_of(user);
        
        assert!(!exists<UserHedges>(user_addr), E_HEDGE_ALREADY_EXISTS);
        
        move_to(user, UserHedges {
            hedges: table::new(),
            next_hedge_id: 0,
            total_collateral: 0,
            total_premium: 0,
        });
    }

    /// Create a hedge position
    public fun create_hedge(
        user: &signer,
        underlying_asset: String,
        hedge_strategy: u8,
        notional_amount: u64,
        strike_price: u64,
        duration_days: u64,
        collateral_coin: Coin<AptosCoin>
    ): u64 {
        let user_addr = signer::address_of(user);
        let admin_addr = @aptospay;
        
        // Initialize user hedges if not exists
        if (!exists<UserHedges>(user_addr)) {
            initialize_user_hedges(user);
        };
        
        // Validate inputs
        assert!(hedge_strategy <= STRATEGY_IRON_CONDOR, E_INVALID_STRATEGY);
        assert!(notional_amount > 0, E_INVALID_AMOUNT);
        assert!(strike_price > 0, E_INVALID_AMOUNT);
        assert!(duration_days > 0 && duration_days <= 365, E_INVALID_AMOUNT);
        
        let collateral_amount = coin::value(&collateral_coin);
        let config = borrow_global<HedgingConfig>(admin_addr);
        
        // Calculate required collateral (110% of notional)
        let required_collateral = (notional_amount * config.min_collateral_ratio) / 10000;
        assert!(collateral_amount >= required_collateral, E_INSUFFICIENT_COLLATERAL);
        
        // Calculate premium
        let premium_amount = (notional_amount * config.premium_rate) / 10000;
        assert!(collateral_amount >= premium_amount, E_INSUFFICIENT_PREMIUM);
        
        // Calculate expiry
        let current_time = aptos_std::timestamp::now_seconds();
        let expiry_timestamp = current_time + (duration_days * 86400);
        
        // Create hedge position
        let user_hedges = borrow_global_mut<UserHedges>(user_addr);
        let hedge_id = user_hedges.next_hedge_id;
        
        let hedge_position = HedgePosition {
            id: hedge_id,
            owner: user_addr,
            underlying_asset,
            hedge_strategy,
            notional_amount,
            premium_paid: premium_amount,
            collateral_amount,
            strike_price,
            expiry_timestamp,
            status: HEDGE_ACTIVE,
            pnl: 0,
            created_at: current_time,
        };
        
        table::add(&mut user_hedges.hedges, hedge_id, hedge_position);
        user_hedges.next_hedge_id = hedge_id + 1;
        user_hedges.total_collateral = user_hedges.total_collateral + collateral_amount;
        user_hedges.total_premium = user_hedges.total_premium + premium_amount;
        
        // Update global registry
        let registry = borrow_global_mut<HedgingRegistry>(admin_addr);
        table::add(&mut registry.hedges, hedge_id, hedge_position);
        registry.total_premium_collected = registry.total_premium_collected + premium_amount;
        
        // Update risk metrics
        let metrics = borrow_global_mut<RiskMetrics>(admin_addr);
        metrics.total_hedged_value = metrics.total_hedged_value + notional_amount;
        metrics.total_premium_collected = metrics.total_premium_collected + premium_amount;
        metrics.active_hedges = metrics.active_hedges + 1;
        
        // Transfer collateral to contract
        coin::deposit(admin_addr, collateral_coin);
        
        hedge_id
    }

    /// Close a hedge position
    public fun close_hedge(user: &signer, hedge_id: u64): Coin<AptosCoin> {
        let user_addr = signer::address_of(user);
        let admin_addr = @aptospay;
        
        assert!(exists<UserHedges>(user_addr), E_HEDGE_NOT_FOUND);
        
        let user_hedges = borrow_global_mut<UserHedges>(user_addr);
        assert!(table::contains(&user_hedges.hedges, hedge_id), E_HEDGE_NOT_FOUND);
        
        let hedge = table::borrow_mut(&mut user_hedges.hedges, hedge_id);
        assert!(hedge.owner == user_addr, E_UNAUTHORIZED);
        assert!(hedge.status == HEDGE_ACTIVE, E_HEDGE_NOT_FOUND);
        
        // Calculate PnL based on current market conditions
        let current_price = get_current_price(&hedge.underlying_asset);
        let pnl = calculate_hedge_pnl(hedge, current_price);
        
        // Update hedge
        hedge.status = HEDGE_CLOSED;
        hedge.pnl = pnl;
        
        // Update user stats
        user_hedges.total_collateral = user_hedges.total_collateral - hedge.collateral_amount;
        user_hedges.total_premium = user_hedges.total_premium - hedge.premium_paid;
        
        // Update global metrics
        let metrics = borrow_global_mut<RiskMetrics>(admin_addr);
        metrics.active_hedges = metrics.active_hedges - 1;
        
        // Calculate payout
        let payout = if (pnl >= 0) {
            hedge.collateral_amount + pnl
        } else {
            if (hedge.collateral_amount > pnl) {
                hedge.collateral_amount + pnl // pnl is negative
            } else {
                0 // Hedge is liquidated
            }
        };
        
        // Withdraw payout
        coin::withdraw<AptosCoin>(&account::create_test_signer(admin_addr), payout)
    }

    /// Exercise a hedge (for protective puts)
    public fun exercise_hedge(user: &signer, hedge_id: u64): Coin<AptosCoin> {
        let user_addr = signer::address_of(user);
        let admin_addr = @aptospay;
        
        assert!(exists<UserHedges>(user_addr), E_HEDGE_NOT_FOUND);
        
        let user_hedges = borrow_global_mut<UserHedges>(user_addr);
        assert!(table::contains(&user_hedges.hedges, hedge_id), E_HEDGE_NOT_FOUND);
        
        let hedge = table::borrow_mut(&mut user_hedges.hedges, hedge_id);
        assert!(hedge.owner == user_addr, E_UNAUTHORIZED);
        assert!(hedge.status == HEDGE_ACTIVE, E_HEDGE_NOT_FOUND);
        assert!(hedge.hedge_strategy == STRATEGY_PROTECTIVE_PUT, E_INVALID_STRATEGY);
        
        let current_time = aptos_std::timestamp::now_seconds();
        assert!(current_time <= hedge.expiry_timestamp, E_EXPIRED_HEDGE);
        
        let current_price = get_current_price(&hedge.underlying_asset);
        
        // Can only exercise if current price is below strike price
        assert!(current_price < hedge.strike_price, E_INVALID_AMOUNT);
        
        // Calculate exercise payout
        let payout_amount = hedge.strike_price - current_price;
        let total_payout = hedge.collateral_amount + payout_amount;
        
        // Update hedge
        hedge.status = HEDGE_EXERCISED;
        hedge.pnl = payout_amount;
        
        // Update metrics
        let metrics = borrow_global_mut<RiskMetrics>(admin_addr);
        metrics.active_hedges = metrics.active_hedges - 1;
        
        // Withdraw payout
        coin::withdraw<AptosCoin>(&account::create_test_signer(admin_addr), total_payout)
    }

    /// Liquidate an underwater hedge
    public fun liquidate_hedge(liquidator: &signer, user_addr: address, hedge_id: u64): Coin<AptosCoin> {
        let admin_addr = @aptospay;
        
        assert!(exists<UserHedges>(user_addr), E_HEDGE_NOT_FOUND);
        
        let user_hedges = borrow_global_mut<UserHedges>(user_addr);
        assert!(table::contains(&user_hedges.hedges, hedge_id), E_HEDGE_NOT_FOUND);
        
        let hedge = table::borrow_mut(&mut user_hedges.hedges, hedge_id);
        assert!(hedge.status == HEDGE_ACTIVE, E_HEDGE_NOT_FOUND);
        
        let config = borrow_global<HedgingConfig>(admin_addr);
        let current_price = get_current_price(&hedge.underlying_asset);
        
        // Calculate current collateral ratio
        let pnl = calculate_hedge_pnl(hedge, current_price);
        let current_collateral = hedge.collateral_amount + pnl;
        let collateral_ratio = (current_collateral * 10000) / hedge.notional_amount;
        
        // Check if hedge should be liquidated
        assert!(collateral_ratio < config.liquidation_threshold, E_INVALID_AMOUNT);
        
        // Liquidate hedge
        hedge.status = HEDGE_CLOSED;
        hedge.pnl = pnl;
        
        // Update metrics
        let metrics = borrow_global_mut<RiskMetrics>(admin_addr);
        metrics.active_hedges = metrics.active_hedges - 1;
        metrics.liquidated_hedges = metrics.liquidated_hedges + 1;
        
        // Liquidator gets liquidation bonus (5% of collateral)
        let liquidation_bonus = (hedge.collateral_amount * 500) / 10000; // 5%
        coin::withdraw<AptosCoin>(&account::create_test_signer(admin_addr), liquidation_bonus)
    }

    /// Calculate PnL for a hedge position
    fun calculate_hedge_pnl(hedge: &HedgePosition, current_price: u64): u64 {
        let pnl = match (hedge.hedge_strategy) {
            STRATEGY_DELTA_NEUTRAL => {
                // Delta neutral should have minimal PnL from price movements
                0
            },
            STRATEGY_PROTECTIVE_PUT => {
                // Profit if current price is below strike price
                if (current_price < hedge.strike_price) {
                    hedge.strike_price - current_price
                } else {
                    0
                }
            },
            STRATEGY_COVERED_CALL => {
                // Profit if current price is below strike price
                if (current_price < hedge.strike_price) {
                    hedge.strike_price - current_price
                } else {
                    // Loss limited to the difference
                    -(current_price - hedge.strike_price)
                }
            },
            STRATEGY_IRON_CONDOR => {
                // Complex strategy - simplified calculation
                let price_range = hedge.strike_price / 10; // 10% range
                if (current_price > hedge.strike_price + price_range) {
                    -(current_price - hedge.strike_price - price_range)
                } else if (current_price < hedge.strike_price - price_range) {
                    -(hedge.strike_price - price_range - current_price)
                } else {
                    0 // Within profitable range
                }
            },
            _ => 0
        };
        
        pnl
    }

    /// Get current price for an asset (mock implementation)
    fun get_current_price(asset: &String): u64 {
        // In a real implementation, this would fetch from an oracle
        // For now, return a mock price
        if (*asset == "APT") {
            845000000 // $8.45 in micro-units
        } else if (*asset == "BTC") {
            43250000000000 // $43250 in micro-units
        } else if (*asset == "ETH") {
            2650000000000 // $2650 in micro-units
        } else {
            1000000 // $1.00 default
        }
    }

    /// Get user's hedge positions
    public fun get_user_hedges(user_addr: address): vector<HedgePosition> {
        if (!exists<UserHedges>(user_addr)) {
            return vector::empty()
        };
        
        let user_hedges = borrow_global<UserHedges>(user_addr);
        let hedges = vector::empty<HedgePosition>();
        
        // Note: In a real implementation, you'd need to iterate through the table
        // This is a simplified version
        hedges
    }

    /// Get risk metrics
    public fun get_risk_metrics(): (u64, u64, u64, u64, u64) {
        let admin_addr = @aptospay;
        let metrics = borrow_global<RiskMetrics>(admin_addr);
        
        (metrics.total_hedged_value, metrics.total_premium_collected, 
         metrics.active_hedges, metrics.expired_hedges, metrics.liquidated_hedges)
    }

    /// Get user's hedging stats
    public fun get_user_hedging_stats(user_addr: address): (u64, u64, u64) {
        if (!exists<UserHedges>(user_addr)) {
            return (0, 0, 0)
        };
        
        let user_hedges = borrow_global<UserHedges>(user_addr);
        
        (user_hedges.next_hedge_id, user_hedges.total_collateral, user_hedges.total_premium)
    }

    /// Update hedge status for expired hedges
    public fun update_expired_hedges(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        let current_time = aptos_std::timestamp::now_seconds();
        
        let registry = borrow_global_mut<HedgingRegistry>(admin_addr);
        let metrics = borrow_global_mut<RiskMetrics>(admin_addr);
        
        // Note: In a real implementation, you'd iterate through all hedges
        // and update expired ones. This is a simplified version.
        // For now, we'll just update the metrics
        metrics.expired_hedges = metrics.expired_hedges + 0; // Placeholder
    }

    #[test_only]
    public fun initialize_test(admin: &signer) {
        initialize(admin);
    }

    #[test_only]
    public fun mint_coin(account: &signer, amount: u64): Coin<AptosCoin> {
        coin::mint<AptosCoin>(account, amount)
    }
}
