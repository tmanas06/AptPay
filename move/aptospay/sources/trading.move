module aptospay::trading {
    use std::signer;
    use std::vector;
    use std::table::{Self, Table};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};

    /// Errors
    const E_NOT_ENOUGH_BALANCE: u64 = 1;
    const E_INVALID_LEVERAGE: u64 = 2;
    const E_POSITION_NOT_FOUND: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_UNAUTHORIZED: u64 = 5;
    const E_POSITION_ALREADY_EXISTS: u64 = 6;
    const E_INSUFFICIENT_MARGIN: u64 = 7;

    /// Position types
    const POSITION_LONG: u8 = 0;
    const POSITION_SHORT: u8 = 1;

    /// Position status
    const POSITION_OPEN: u8 = 0;
    const POSITION_CLOSED: u8 = 1;
    const POSITION_LIQUIDATED: u8 = 2;

    struct Position has store {
        id: u64,
        owner: address,
        pair: String,
        position_type: u8,
        leverage: u64,
        entry_price: u64,
        size: u64,
        margin: u64,
        timestamp: u64,
        status: u8,
        pnl: u64,
    }

    struct TradingStats has key {
        total_volume: u64,
        total_fees: u64,
        open_positions: u64,
        liquidations: u64,
    }

    struct UserPositions has key {
        positions: Table<u64, Position>,
        next_position_id: u64,
    }

    struct PriceFeeds has key {
        prices: Table<String, u64>,
    }

    struct TradingConfig has key {
        max_leverage: u64,
        min_margin: u64,
        fee_rate: u64, // in basis points (1 = 0.01%)
        liquidation_threshold: u64, // in basis points
    }

    /// Initialize the trading module
    public fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, TradingStats {
            total_volume: 0,
            total_fees: 0,
            open_positions: 0,
            liquidations: 0,
        });

        move_to(admin, PriceFeeds {
            prices: table::new(),
        });

        move_to(admin, TradingConfig {
            max_leverage: 1000, // 1000x max leverage
            min_margin: 1000000, // 1 APT minimum margin
            fee_rate: 10, // 0.1% trading fee
            liquidation_threshold: 8000, // 80% liquidation threshold
        });
    }

    /// Initialize user positions table
    public fun initialize_user_positions(user: &signer) {
        let user_addr = signer::address_of(user);
        
        assert!(!exists<UserPositions>(user_addr), E_POSITION_ALREADY_EXISTS);
        
        move_to(user, UserPositions {
            positions: table::new(),
            next_position_id: 0,
        });
    }

    /// Update price feed for a trading pair
    public fun update_price(admin: &signer, pair: String, price: u64) {
        let admin_addr = signer::address_of(admin);
        let price_feeds = borrow_global_mut<PriceFeeds>(admin_addr);
        
        table::upsert(&mut price_feeds.prices, pair, price);
    }

    /// Open a leveraged position
    public fun open_position(
        user: &signer,
        pair: String,
        position_type: u8,
        leverage: u64,
        size: u64,
        margin_coin: Coin<AptosCoin>
    ) {
        let user_addr = signer::address_of(user);
        let admin_addr = @aptospay;
        
        // Initialize user positions if not exists
        if (!exists<UserPositions>(user_addr)) {
            initialize_user_positions(user);
        };

        // Validate inputs
        assert!(position_type == POSITION_LONG || position_type == POSITION_SHORT, E_INVALID_AMOUNT);
        assert!(leverage > 0 && leverage <= 1000, E_INVALID_LEVERAGE);
        assert!(size > 0, E_INVALID_AMOUNT);
        
        let margin_amount = coin::value(&margin_coin);
        let required_margin = size / leverage;
        assert!(margin_amount >= required_margin, E_INSUFFICIENT_MARGIN);
        
        // Get current price
        let price_feeds = borrow_global<PriceFeeds>(admin_addr);
        assert!(table::contains(&price_feeds.prices, pair), E_INVALID_AMOUNT);
        let current_price = *table::borrow(&price_feeds.prices, &pair);
        
        // Calculate fees
        let trading_config = borrow_global<TradingConfig>(admin_addr);
        let fee_amount = (size * trading_config.fee_rate) / 10000;
        let total_cost = required_margin + fee_amount;
        
        assert!(margin_amount >= total_cost, E_INSUFFICIENT_MARGIN);
        
        // Create position
        let user_positions = borrow_global_mut<UserPositions>(user_addr);
        let position_id = user_positions.next_position_id;
        
        let position = Position {
            id: position_id,
            owner: user_addr,
            pair,
            position_type,
            leverage,
            entry_price: current_price,
            size,
            margin: required_margin,
            timestamp: aptos_std::timestamp::now_seconds(),
            status: POSITION_OPEN,
            pnl: 0,
        };
        
        table::add(&mut user_positions.positions, position_id, position);
        user_positions.next_position_id = position_id + 1;
        
        // Update global stats
        let stats = borrow_global_mut<TradingStats>(admin_addr);
        stats.total_volume = stats.total_volume + size;
        stats.total_fees = stats.total_fees + fee_amount;
        stats.open_positions = stats.open_positions + 1;
        
        // Transfer margin to contract
        coin::deposit(admin_addr, margin_coin);
    }

    /// Close a position
    public fun close_position(user: &signer, position_id: u64): Coin<AptosCoin> {
        let user_addr = signer::address_of(user);
        let admin_addr = @aptospay;
        
        assert!(exists<UserPositions>(user_addr), E_POSITION_NOT_FOUND);
        
        let user_positions = borrow_global_mut<UserPositions>(user_addr);
        assert!(table::contains(&user_positions.positions, position_id), E_POSITION_NOT_FOUND);
        
        let position = table::borrow_mut(&mut user_positions.positions, position_id);
        assert!(position.status == POSITION_OPEN, E_POSITION_NOT_FOUND);
        assert!(position.owner == user_addr, E_UNAUTHORIZED);
        
        // Calculate PnL
        let price_feeds = borrow_global<PriceFeeds>(admin_addr);
        let current_price = *table::borrow(&price_feeds.prices, &position.pair);
        let pnl = calculate_pnl(position, current_price);
        
        // Update position
        position.status = POSITION_CLOSED;
        position.pnl = pnl;
        
        // Update global stats
        let stats = borrow_global_mut<TradingStats>(admin_addr);
        stats.open_positions = stats.open_positions - 1;
        
        // Calculate payout
        let payout = if (pnl >= 0) {
            position.margin + pnl
        } else {
            if (position.margin > pnl) {
                position.margin + pnl // pnl is negative
            } else {
                0 // Position is liquidated
            }
        };
        
        // Withdraw payout
        coin::withdraw<AptosCoin>(&account::create_test_signer(admin_addr), payout)
    }

    /// Liquidate a position (called by liquidator)
    public fun liquidate_position(liquidator: &signer, user_addr: address, position_id: u64): Coin<AptosCoin> {
        let admin_addr = @aptospay;
        
        assert!(exists<UserPositions>(user_addr), E_POSITION_NOT_FOUND);
        
        let user_positions = borrow_global_mut<UserPositions>(user_addr);
        assert!(table::contains(&user_positions.positions, position_id), E_POSITION_NOT_FOUND);
        
        let position = table::borrow_mut(&mut user_positions.positions, position_id);
        assert!(position.status == POSITION_OPEN, E_POSITION_NOT_FOUND);
        
        // Check if position should be liquidated
        let price_feeds = borrow_global<PriceFeeds>(admin_addr);
        let current_price = *table::borrow(&price_feeds.prices, &position.pair);
        let pnl = calculate_pnl(position, current_price);
        
        let trading_config = borrow_global<TradingConfig>(admin_addr);
        let liquidation_threshold = (position.margin * trading_config.liquidation_threshold) / 10000;
        
        assert!(pnl < -(position.margin - liquidation_threshold), E_INVALID_AMOUNT);
        
        // Liquidate position
        position.status = POSITION_LIQUIDATED;
        position.pnl = pnl;
        
        // Update global stats
        let stats = borrow_global_mut<TradingStats>(admin_addr);
        stats.open_positions = stats.open_positions - 1;
        stats.liquidations = stats.liquidations + 1;
        
        // Liquidator gets liquidation bonus (5% of margin)
        let liquidation_bonus = (position.margin * 500) / 10000; // 5%
        coin::withdraw<AptosCoin>(&account::create_test_signer(admin_addr), liquidation_bonus)
    }

    /// Calculate PnL for a position
    fun calculate_pnl(position: &Position, current_price: u64): u64 {
        let price_change = if (current_price > position.entry_price) {
            current_price - position.entry_price
        } else {
            position.entry_price - current_price
        };
        
        let price_change_percent = (price_change * 10000) / position.entry_price;
        let leveraged_change = (price_change_percent * position.leverage) / 10000;
        
        if (position.position_type == POSITION_LONG) {
            if (current_price > position.entry_price) {
                (position.margin * leveraged_change) / 10000
            } else {
                -((position.margin * leveraged_change) / 10000)
            }
        } else { // SHORT
            if (current_price < position.entry_price) {
                (position.margin * leveraged_change) / 10000
            } else {
                -((position.margin * leveraged_change) / 10000)
            }
        }
    }

    /// Get user's positions
    public fun get_user_positions(user_addr: address): vector<Position> {
        if (!exists<UserPositions>(user_addr)) {
            return vector::empty()
        };
        
        let user_positions = borrow_global<UserPositions>(user_addr);
        let positions = vector::empty<Position>();
        
        // Note: In a real implementation, you'd need to iterate through the table
        // This is a simplified version
        positions
    }

    /// Get trading stats
    public fun get_trading_stats(): (u64, u64, u64, u64) {
        let admin_addr = @aptospay;
        let stats = borrow_global<TradingStats>(admin_addr);
        
        (stats.total_volume, stats.total_fees, stats.open_positions, stats.liquidations)
    }

    /// Get current price for a pair
    public fun get_price(pair: String): u64 {
        let admin_addr = @aptospay;
        let price_feeds = borrow_global<PriceFeeds>(admin_addr);
        
        *table::borrow(&price_feeds.prices, &pair)
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
