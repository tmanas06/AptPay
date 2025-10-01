module aptospay::hedging {
    use std::signer;
    use std::vector;
    use std::table::{Self, Table};
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_std::math64;
    use aptos_std::table::{Self, Table};

    /// Errors
    const E_STRATEGY_NOT_FOUND: u64 = 1;
    const E_INVALID_AMOUNT: u64 = 2;
    const E_UNAUTHORIZED: u64 = 3;
    const E_INSUFFICIENT_BALANCE: u64 = 4;
    const E_HEDGE_NOT_FOUND: u64 = 5;
    const E_HEDGE_ALREADY_ACTIVE: u64 = 6;
    const E_HEDGE_NOT_ACTIVE: u64 = 7;
    const E_INVALID_STRATEGY: u64 = 8;
    const E_HEDGING_PAUSED: u64 = 9;
    const E_INSUFFICIENT_COLLATERAL: u64 = 10;
    const E_INVALID_EXPIRY: u64 = 11;
    const E_HEDGE_EXPIRED: u64 = 12;
    const E_INVALID_STRIKE_PRICE: u64 = 13;
    const E_MAX_HEDGES_EXCEEDED: u64 = 14;

    /// Hedging strategy types
    const STRATEGY_DELTA_NEUTRAL: u8 = 0;
    const STRATEGY_PROTECTIVE_PUT: u8 = 1;
    const STRATEGY_COVERED_CALL: u8 = 2;
    const STRATEGY_IRON_CONDOR: u8 = 3;
    const STRATEGY_COLLAR: u8 = 4;
    const STRATEGY_STOP_LOSS: u8 = 5;

    /// Hedge status
    const HEDGE_ACTIVE: u8 = 0;
    const HEDGE_CLOSED: u8 = 1;
    const HEDGE_EXPIRED: u8 = 2;
    const HEDGE_LIQUIDATED: u8 = 3;

    /// Risk level
    const RISK_LOW: u8 = 0;
    const RISK_MEDIUM: u8 = 1;
    const RISK_HIGH: u8 = 2;

    /// Hedging strategy configuration
    struct HedgingStrategy has store {
        id: u8,
        name: String,
        description: String,
        risk_level: u8,
        min_amount: u64,
        max_amount: u64,
        fee_rate: u64, // in basis points
        is_active: bool,
        expected_return_min: u64, // in basis points
        expected_return_max: u64, // in basis points
    }

    /// Individual hedge position
    struct HedgePosition has store {
        id: u64,
        owner: address,
        strategy_id: u8,
        underlying_asset: String,
        hedge_amount: u64,
        strike_price: u64,
        expiry_timestamp: u64,
        premium_paid: u64,
        collateral_deposited: u64,
        status: u8,
        pnl: i64,
        created_at: u64,
        last_updated: u64,
        auto_renew: bool,
    }

    /// Portfolio risk metrics
    struct RiskMetrics has store {
        total_value: u64,
        hedged_value: u64,
        unhedged_value: u64,
        delta_exposure: i64,
        gamma_exposure: u64,
        vega_exposure: u64,
        theta_exposure: i64,
        var_95: u64, // Value at Risk 95%
        max_drawdown: u64,
        sharpe_ratio: u64,
        beta: u64,
        volatility: u64,
    }

    /// Global hedging state
    struct HedgingState has key {
        strategies: Table<u8, HedgingStrategy>,
        positions: Table<u64, HedgePosition>,
        risk_metrics: Table<address, RiskMetrics>,
        next_position_id: u64,
        admin: address,
        is_paused: bool,
        total_hedged_value: u64,
        total_premium_collected: u64,
        total_payouts: u64,
        max_positions_per_user: u64,
    }

    /// User hedging account
    struct UserHedgeAccount has key {
        positions: vector<u64>,
        total_hedged: u64,
        total_premium_paid: u64,
        total_payouts_received: u64,
        risk_tolerance: u8,
        last_activity: u64,
        auto_hedge_enabled: bool,
    }

    /// Initialize hedging module
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, HedgingState {
            strategies: table::new(),
            positions: table::new(),
            risk_metrics: table::new(),
            next_position_id: 1,
            admin: admin_addr,
            is_paused: false,
            total_hedged_value: 0,
            total_premium_collected: 0,
            total_payouts: 0,
            max_positions_per_user: 10,
        });

        // Initialize hedging strategies
        initialize_hedging_strategies(&admin_addr);
    }

    /// Initialize default hedging strategies
    fun initialize_hedging_strategies(admin_addr: &address) acquires HedgingState {
        let state = borrow_global_mut<HedgingState>(*admin_addr);
        
        // Delta Neutral Strategy
        table::add(&mut state.strategies, STRATEGY_DELTA_NEUTRAL, HedgingStrategy {
            id: STRATEGY_DELTA_NEUTRAL,
            name: string::utf8(b"Delta Neutral"),
            description: string::utf8(b"Hedge against price movements using options"),
            risk_level: RISK_LOW,
            min_amount: 1000000, // 1 APT
            max_amount: 1000000000, // 1000 APT
            fee_rate: 50, // 0.5%
            is_active: true,
            expected_return_min: 500, // 5%
            expected_return_max: 800, // 8%
        });

        // Protective Put Strategy
        table::add(&mut state.strategies, STRATEGY_PROTECTIVE_PUT, HedgingStrategy {
            id: STRATEGY_PROTECTIVE_PUT,
            name: string::utf8(b"Protective Put"),
            description: string::utf8(b"Protect against downside risk"),
            risk_level: RISK_MEDIUM,
            min_amount: 500000, // 0.5 APT
            max_amount: 500000000, // 500 APT
            fee_rate: 75, // 0.75%
            is_active: true,
            expected_return_min: 800, // 8%
            expected_return_max: 1200, // 12%
        });

        // Covered Call Strategy
        table::add(&mut state.strategies, STRATEGY_COVERED_CALL, HedgingStrategy {
            id: STRATEGY_COVERED_CALL,
            name: string::utf8(b"Covered Call"),
            description: string::utf8(b"Income generation strategy"),
            risk_level: RISK_MEDIUM,
            min_amount: 500000, // 0.5 APT
            max_amount: 500000000, // 500 APT
            fee_rate: 60, // 0.6%
            is_active: true,
            expected_return_min: 600, // 6%
            expected_return_max: 1000, // 10%
        });

        // Iron Condor Strategy
        table::add(&mut state.strategies, STRATEGY_IRON_CONDOR, HedgingStrategy {
            id: STRATEGY_IRON_CONDOR,
            name: string::utf8(b"Iron Condor"),
            description: string::utf8(b"Volatility trading strategy"),
            risk_level: RISK_HIGH,
            min_amount: 1000000, // 1 APT
            max_amount: 100000000, // 100 APT
            fee_rate: 100, // 1%
            is_active: true,
            expected_return_min: 1000, // 10%
            expected_return_max: 2000, // 20%
        });

        // Collar Strategy
        table::add(&mut state.strategies, STRATEGY_COLLAR, HedgingStrategy {
            id: STRATEGY_COLLAR,
            name: string::utf8(b"Collar"),
            description: string::utf8(b"Combined protective put and covered call"),
            risk_level: RISK_LOW,
            min_amount: 1000000, // 1 APT
            max_amount: 1000000000, // 1000 APT
            fee_rate: 80, // 0.8%
            is_active: true,
            expected_return_min: 400, // 4%
            expected_return_max: 700, // 7%
        });

        // Stop Loss Strategy
        table::add(&mut state.strategies, STRATEGY_STOP_LOSS, HedgingStrategy {
            id: STRATEGY_STOP_LOSS,
            name: string::utf8(b"Stop Loss"),
            description: string::utf8(b"Automated stop loss protection"),
            risk_level: RISK_LOW,
            min_amount: 100000, // 0.1 APT
            max_amount: 1000000000, // 1000 APT
            fee_rate: 25, // 0.25%
            is_active: true,
            expected_return_min: 0, // Break-even
            expected_return_max: 200, // 2%
        });
    }

    /// Create a new hedge position
    public entry fun create_hedge(
        user: &signer,
        strategy_id: u8,
        underlying_asset: String,
        hedge_amount: u64,
        strike_price: u64,
        expiry_days: u64,
        auto_renew: bool,
    ) acquires HedgingState, UserHedgeAccount {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<HedgingState>(@aptospay);
        
        assert!(!state.is_paused, E_HEDGING_PAUSED);
        assert!(table::contains(&state.strategies, strategy_id), E_STRATEGY_NOT_FOUND);
        
        let strategy = table::borrow(&state.strategies, strategy_id);
        assert!(strategy.is_active, E_INVALID_STRATEGY);
        assert!(hedge_amount >= strategy.min_amount && hedge_amount <= strategy.max_amount, E_INVALID_AMOUNT);
        assert!(expiry_days > 0 && expiry_days <= 365, E_INVALID_EXPIRY);
        assert!(strike_price > 0, E_INVALID_STRIKE_PRICE);
        
        // Check user position limit
        if (exists<UserHedgeAccount>(user_addr)) {
            let user_account = borrow_global<UserHedgeAccount>(user_addr);
            assert!(vector::length(&user_account.positions) < state.max_positions_per_user, E_MAX_HEDGES_EXCEEDED);
        };
        
        // Calculate premium and collateral
        let premium = calculate_premium(strategy_id, hedge_amount, strike_price, expiry_days);
        let collateral = calculate_collateral_required(strategy_id, hedge_amount, strike_price);
        
        let position_id = state.next_position_id;
        let expiry_timestamp = timestamp::now_seconds() + (expiry_days * 86400);
        
        let position = HedgePosition {
            id: position_id,
            owner: user_addr,
            strategy_id,
            underlying_asset,
            hedge_amount,
            strike_price,
            expiry_timestamp,
            premium_paid: premium,
            collateral_deposited: collateral,
            status: HEDGE_ACTIVE,
            pnl: 0,
            created_at: timestamp::now_seconds(),
            last_updated: timestamp::now_seconds(),
            auto_renew,
        };
        
        // Add position to global state
        table::add(&mut state.positions, position_id, position);
        state.next_position_id = state.next_position_id + 1;
        state.total_hedged_value = state.total_hedged_value + hedge_amount;
        state.total_premium_collected = state.total_premium_collected + premium;
        
        // Update user account
        if (!exists<UserHedgeAccount>(user_addr)) {
            move_to(user, UserHedgeAccount {
                positions: vector::empty(),
                total_hedged: 0,
                total_premium_paid: 0,
                total_payouts_received: 0,
                risk_tolerance: RISK_MEDIUM,
                last_activity: timestamp::now_seconds(),
                auto_hedge_enabled: false,
            });
        };
        
        let user_account = borrow_global_mut<UserHedgeAccount>(user_addr);
        vector::push_back(&mut user_account.positions, position_id);
        user_account.total_hedged = user_account.total_hedged + hedge_amount;
        user_account.total_premium_paid = user_account.total_premium_paid + premium;
        user_account.last_activity = timestamp::now_seconds();
    }

    /// Close a hedge position
    public entry fun close_hedge(
        user: &signer,
        position_id: u64,
    ) acquires HedgingState, UserHedgeAccount {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<HedgingState>(@aptospay);
        
        assert!(table::contains(&state.positions, position_id), E_HEDGE_NOT_FOUND);
        
        let position = table::borrow_mut(&state.positions, position_id);
        assert!(position.owner == user_addr, E_UNAUTHORIZED);
        assert!(position.status == HEDGE_ACTIVE, E_HEDGE_NOT_ACTIVE);
        
        // Calculate final PnL
        let current_price = get_current_price(&position.underlying_asset);
        let pnl = calculate_hedge_pnl(position, current_price);
        
        position.pnl = pnl;
        position.status = HEDGE_CLOSED;
        position.last_updated = timestamp::now_seconds();
        
        // Update global stats
        state.total_hedged_value = state.total_hedged_value - position.hedge_amount;
        if (pnl > 0) {
            state.total_payouts = state.total_payouts + (pnl as u64);
        };
        
        // Update user account
        let user_account = borrow_global_mut<UserHedgeAccount>(user_addr);
        if (pnl > 0) {
            user_account.total_payouts_received = user_account.total_payouts_received + (pnl as u64);
        };
        user_account.last_activity = timestamp::now_seconds();
    }

    /// Auto-renew expired hedges
    public entry fun renew_hedge(
        user: &signer,
        position_id: u64,
        new_expiry_days: u64,
    ) acquires HedgingState {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<HedgingState>(@aptospay);
        
        assert!(table::contains(&state.positions, position_id), E_HEDGE_NOT_FOUND);
        
        let position = table::borrow_mut(&state.positions, position_id);
        assert!(position.owner == user_addr, E_UNAUTHORIZED);
        assert!(position.auto_renew, E_HEDGE_NOT_ACTIVE);
        assert!(timestamp::now_seconds() >= position.expiry_timestamp, E_HEDGE_NOT_EXPIRED);
        
        // Renew the hedge
        position.expiry_timestamp = timestamp::now_seconds() + (new_expiry_days * 86400);
        position.status = HEDGE_ACTIVE;
        position.last_updated = timestamp::now_seconds();
    }

    /// Calculate premium for a hedge
    fun calculate_premium(strategy_id: u8, amount: u64, strike_price: u64, expiry_days: u64): u64 {
        let base_premium = match (strategy_id) {
            STRATEGY_DELTA_NEUTRAL => (amount * 50) / 10000, // 0.5%
            STRATEGY_PROTECTIVE_PUT => (amount * 75) / 10000, // 0.75%
            STRATEGY_COVERED_CALL => (amount * 60) / 10000, // 0.6%
            STRATEGY_IRON_CONDOR => (amount * 100) / 10000, // 1%
            STRATEGY_COLLAR => (amount * 80) / 10000, // 0.8%
            STRATEGY_STOP_LOSS => (amount * 25) / 10000, // 0.25%
            _ => 0,
        };
        
        // Add time decay factor
        let time_factor = (expiry_days * 100) / 365; // Scale by days
        (base_premium * (100 + time_factor)) / 100
    }

    /// Calculate collateral required for a hedge
    fun calculate_collateral_required(strategy_id: u8, amount: u64, strike_price: u64): u64 {
        match (strategy_id) {
            STRATEGY_DELTA_NEUTRAL => (amount * 2000) / 10000, // 20%
            STRATEGY_PROTECTIVE_PUT => (amount * 1500) / 10000, // 15%
            STRATEGY_COVERED_CALL => amount, // 100% (full collateral)
            STRATEGY_IRON_CONDOR => (amount * 3000) / 10000, // 30%
            STRATEGY_COLLAR => (amount * 2500) / 10000, // 25%
            STRATEGY_STOP_LOSS => (amount * 500) / 10000, // 5%
            _ => 0,
        }
    }

    /// Calculate PnL for a hedge position
    fun calculate_hedge_pnl(position: &HedgePosition, current_price: u64): i64 {
        match (position.strategy_id) {
            STRATEGY_DELTA_NEUTRAL => calculate_delta_neutral_pnl(position, current_price),
            STRATEGY_PROTECTIVE_PUT => calculate_protective_put_pnl(position, current_price),
            STRATEGY_COVERED_CALL => calculate_covered_call_pnl(position, current_price),
            STRATEGY_IRON_CONDOR => calculate_iron_condor_pnl(position, current_price),
            STRATEGY_COLLAR => calculate_collar_pnl(position, current_price),
            STRATEGY_STOP_LOSS => calculate_stop_loss_pnl(position, current_price),
            _ => 0,
        }
    }

    /// Calculate delta neutral PnL
    fun calculate_delta_neutral_pnl(position: &HedgePosition, current_price: u64): i64 {
        // Simplified delta neutral calculation
        let price_change = if (current_price > position.strike_price) {
            current_price - position.strike_price
        } else {
            position.strike_price - current_price
        };
        
        let pnl = (position.hedge_amount * price_change) / position.strike_price;
        (pnl as i64) - (position.premium_paid as i64)
    }

    /// Calculate protective put PnL
    fun calculate_protective_put_pnl(position: &HedgePosition, current_price: u64): i64 {
        if (current_price >= position.strike_price) {
            // No payout, but premium paid
            0 - (position.premium_paid as i64)
        } else {
            // Payout: strike - current price
            let payout = position.strike_price - current_price;
            let payout_amount = ((position.hedge_amount * payout) / position.strike_price) as i64;
            payout_amount - (position.premium_paid as i64)
        }
    }

    /// Calculate covered call PnL
    fun calculate_covered_call_pnl(position: &HedgePosition, current_price: u64): i64 {
        if (current_price <= position.strike_price) {
            // Premium received
            (position.premium_paid as i64)
        } else {
            // Limited upside, premium received minus opportunity cost
            let opportunity_cost = (current_price - position.strike_price) * position.hedge_amount / position.strike_price;
            let premium = position.premium_paid as i64;
            let cost = opportunity_cost as i64;
            premium - cost
        }
    }

    /// Calculate iron condor PnL
    fun calculate_iron_condor_pnl(position: &HedgePosition, current_price: u64): i64 {
        // Simplified iron condor calculation
        let price_change = if (current_price > position.strike_price) {
            current_price - position.strike_price
        } else {
            position.strike_price - current_price
        };
        
        let pnl = (position.hedge_amount * price_change) / position.strike_price;
        let pnl_amount = pnl as i64;
        let premium = position.premium_paid as i64;
        pnl_amount - premium
    }

    /// Calculate collar PnL
    fun calculate_collar_pnl(position: &HedgePosition, current_price: u64): i64 {
        // Collar is protective put + covered call
        let put_pnl = calculate_protective_put_pnl(position, current_price);
        let call_pnl = calculate_covered_call_pnl(position, current_price);
        put_pnl + call_pnl
    }

    /// Calculate stop loss PnL
    fun calculate_stop_loss_pnl(position: &HedgePosition, current_price: u64): i64 {
        if (current_price <= position.strike_price) {
            // Stop loss triggered, payout the difference
            let loss = position.strike_price - current_price;
            let loss_amount = ((position.hedge_amount * loss) / position.strike_price) as i64;
            loss_amount - (position.premium_paid as i64)
        } else {
            // No payout, but premium paid
            0 - (position.premium_paid as i64)
        }
    }

    /// Get current price for an asset (mock implementation)
    fun get_current_price(asset: &String): u64 {
        // In a real implementation, this would fetch from an oracle
        match (*asset) {
            _ => 84500000, // Default APT price $8.45
        }
    }

    /// Update risk metrics for a user
    public entry fun update_risk_metrics(
        user: &signer,
        portfolio_value: u64,
        delta_exposure: i64,
        volatility: u64,
    ) acquires HedgingState {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<HedgingState>(@aptospay);
        
        // Calculate risk metrics
        let hedged_value = if (exists<UserHedgeAccount>(user_addr)) {
            let user_account = borrow_global<UserHedgeAccount>(user_addr);
            user_account.total_hedged
        } else {
            0
        };
        
        let unhedged_value = portfolio_value - hedged_value;
        let var_95 = calculate_var_95(unhedged_value, volatility);
        let sharpe_ratio = calculate_sharpe_ratio(portfolio_value, volatility);
        
        let risk_metrics = RiskMetrics {
            total_value: portfolio_value,
            hedged_value,
            unhedged_value,
            delta_exposure,
            gamma_exposure: 0, // Simplified
            vega_exposure: 0, // Simplified
            theta_exposure: 0, // Simplified
            var_95,
            max_drawdown: 0, // Simplified
            sharpe_ratio,
            beta: 1000, // Default beta of 1.0
            volatility,
        };
        
        if (table::contains(&state.risk_metrics, user_addr)) {
            let existing_metrics = table::borrow_mut(&state.risk_metrics, user_addr);
            *existing_metrics = risk_metrics;
        } else {
            table::add(&mut state.risk_metrics, user_addr, risk_metrics);
        };
    }

    /// Calculate Value at Risk (95%)
    fun calculate_var_95(portfolio_value: u64, volatility: u64): u64 {
        // Simplified VaR calculation: 1.65 * volatility * portfolio_value
        (portfolio_value * volatility * 165) / 10000
    }

    /// Calculate Sharpe ratio
    fun calculate_sharpe_ratio(portfolio_value: u64, volatility: u64): u64 {
        if (volatility == 0) 1000 else (portfolio_value * 1000) / volatility
    }

    /// Get hedge position details
    public fun get_hedge_position(position_id: u64): (u64, address, u8, String, u64, u64, u64, u64, u64, u8, i64, u64, u64, bool) acquires HedgingState {
        let state = borrow_global<HedgingState>(@aptospay);
        assert!(table::contains(&state.positions, position_id), E_HEDGE_NOT_FOUND);
        
        let position = table::borrow(&state.positions, position_id);
        (
            position.id,
            position.owner,
            position.strategy_id,
            position.underlying_asset,
            position.hedge_amount,
            position.strike_price,
            position.expiry_timestamp,
            position.premium_paid,
            position.collateral_deposited,
            position.status,
            position.pnl,
            position.created_at,
            position.last_updated,
            position.auto_renew,
        )
    }

    /// Get hedging strategy info
    public fun get_hedging_strategy(strategy_id: u8): (u8, String, String, u8, u64, u64, u64, bool, u64, u64) acquires HedgingState {
        let state = borrow_global<HedgingState>(@aptospay);
        assert!(table::contains(&state.strategies, strategy_id), E_STRATEGY_NOT_FOUND);
        
        let strategy = table::borrow(&state.strategies, strategy_id);
        (
            strategy.id,
            strategy.name,
            strategy.description,
            strategy.risk_level,
            strategy.min_amount,
            strategy.max_amount,
            strategy.fee_rate,
            strategy.is_active,
            strategy.expected_return_min,
            strategy.expected_return_max,
        )
    }

    /// Get user hedge positions
    public fun get_user_hedge_positions(user_addr: address): vector<u64> acquires UserHedgeAccount {
        if (!exists<UserHedgeAccount>(user_addr)) {
            vector::empty()
        } else {
            let user_account = borrow_global<UserHedgeAccount>(user_addr);
            *user_account.positions
        }
    }

    /// Get risk metrics for a user
    public fun get_user_risk_metrics(user_addr: address): (u64, u64, u64, i64, u64, u64, u64, u64, u64, u64, u64) acquires HedgingState {
        let state = borrow_global<HedgingState>(@aptospay);
        if (!table::contains(&state.risk_metrics, user_addr)) {
            (0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
        } else {
            let metrics = table::borrow(&state.risk_metrics, user_addr);
            (
                metrics.total_value,
                metrics.hedged_value,
                metrics.unhedged_value,
                metrics.delta_exposure,
                metrics.gamma_exposure,
                metrics.vega_exposure,
                metrics.theta_exposure,
                metrics.var_95,
                metrics.max_drawdown,
                metrics.sharpe_ratio,
                metrics.volatility,
            )
        }
    }

    /// Get hedging global stats
    public fun get_hedging_stats(): (u64, u64, u64, u64) acquires HedgingState {
        let state = borrow_global<HedgingState>(@aptospay);
        (
            state.total_hedged_value,
            state.total_premium_collected,
            state.total_payouts,
            state.next_position_id - 1,
        )
    }

    /// Pause/unpause hedging (admin only)
    public entry fun set_hedging_paused(
        admin: &signer,
        paused: bool,
    ) acquires HedgingState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<HedgingState>(@aptospay);
        
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        state.is_paused = paused;
    }

    /// Set user risk tolerance
    public entry fun set_risk_tolerance(
        user: &signer,
        risk_tolerance: u8,
    ) acquires UserHedgeAccount {
        let user_addr = signer::address_of(user);
        assert!(risk_tolerance <= RISK_HIGH, E_INVALID_STRATEGY);
        
        if (!exists<UserHedgeAccount>(user_addr)) {
            move_to(user, UserHedgeAccount {
                positions: vector::empty(),
                total_hedged: 0,
                total_premium_paid: 0,
                total_payouts_received: 0,
                risk_tolerance,
                last_activity: timestamp::now_seconds(),
                auto_hedge_enabled: false,
            });
        } else {
            let user_account = borrow_global_mut<UserHedgeAccount>(user_addr);
            user_account.risk_tolerance = risk_tolerance;
            user_account.last_activity = timestamp::now_seconds();
        };
    }

    /// Enable/disable auto-hedge
    public entry fun set_auto_hedge(
        user: &signer,
        enabled: bool,
    ) acquires UserHedgeAccount {
        let user_addr = signer::address_of(user);
        
        if (exists<UserHedgeAccount>(user_addr)) {
            let user_account = borrow_global_mut<UserHedgeAccount>(user_addr);
            user_account.auto_hedge_enabled = enabled;
            user_account.last_activity = timestamp::now_seconds();
        };
    }
}