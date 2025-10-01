module aptospay::trading {
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
    const E_NOT_ENOUGH_BALANCE: u64 = 1;
    const E_INVALID_LEVERAGE: u64 = 2;
    const E_POSITION_NOT_FOUND: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_UNAUTHORIZED: u64 = 5;
    const E_POSITION_ALREADY_EXISTS: u64 = 6;
    const E_INSUFFICIENT_MARGIN: u64 = 7;
    const E_POSITION_NOT_LIQUIDATABLE: u64 = 8;
    const E_INVALID_PRICE: u64 = 9;
    const E_TRADING_PAUSED: u64 = 10;
    const E_INVALID_POSITION_TYPE: u64 = 11;
    const E_POSITION_SIZE_TOO_SMALL: u64 = 12;
    const E_MAX_LEVERAGE_EXCEEDED: u64 = 13;

    /// Position types
    const POSITION_LONG: u8 = 0;
    const POSITION_SHORT: u8 = 1;

    /// Position status
    const POSITION_OPEN: u8 = 0;
    const POSITION_CLOSED: u8 = 1;
    const POSITION_LIQUIDATED: u8 = 2;

    /// Trading pair configuration
    struct TradingPair has store {
        base_token: String,
        quote_token: String,
        min_trade_size: u64,
        max_leverage: u64,
        maintenance_margin: u64, // in basis points (500 = 5%)
        is_active: bool,
    }

    /// User position
    struct Position has store {
        id: u64,
        owner: address,
        trading_pair: String,
        position_type: u8, // 0 = long, 1 = short
        size: u64,
        entry_price: u64,
        leverage: u64,
        margin: u64,
        timestamp: u64,
        status: u8,
        pnl: i64, // Can be negative
        funding_fees: u64,
        liquidation_price: u64,
    }

    /// Market data for price feeds
    struct MarketData has store {
        trading_pair: String,
        current_price: u64,
        last_update: u64,
        volume_24h: u64,
        price_change_24h: i64,
    }

    /// Trading statistics
    struct TradingStats has store {
        total_volume: u64,
        total_trades: u64,
        total_fees: u64,
        open_positions: u64,
    }

    /// Global trading state
    struct TradingState has key {
        trading_pairs: Table<String, TradingPair>,
        positions: Table<u64, Position>,
        market_data: Table<String, MarketData>,
        stats: TradingStats,
        next_position_id: u64,
        admin: address,
        is_paused: bool,
        fee_rate: u64, // in basis points (30 = 0.3%)
        liquidation_threshold: u64, // in basis points (800 = 8%)
    }

    /// User account for tracking balances
    struct UserAccount has key {
        positions: vector<u64>,
        total_deposited: u64,
        total_withdrawn: u64,
        total_fees_paid: u64,
        last_activity: u64,
    }

    /// Initialize trading module
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, TradingState {
            trading_pairs: table::new(),
            positions: table::new(),
            market_data: table::new(),
            stats: TradingStats {
                total_volume: 0,
                total_trades: 0,
                total_fees: 0,
                open_positions: 0,
            },
            next_position_id: 1,
            admin: admin_addr,
            is_paused: false,
            fee_rate: 30, // 0.3%
            liquidation_threshold: 800, // 8%
        });

        // Initialize default trading pairs
        initialize_trading_pairs(&admin_addr);
    }

    /// Initialize default trading pairs
    fun initialize_trading_pairs(admin_addr: &address) acquires TradingState {
        let state = borrow_global_mut<TradingState>(*admin_addr);
        
        // APT/USDC pair
        table::add(&mut state.trading_pairs, string::utf8(b"APT/USDC"), TradingPair {
            base_token: string::utf8(b"APT"),
            quote_token: string::utf8(b"USDC"),
            min_trade_size: 1000000, // 0.01 APT
            max_leverage: 1000,
            maintenance_margin: 500, // 5%
            is_active: true,
        });

        // BTC/USDC pair
        table::add(&mut state.trading_pairs, string::utf8(b"BTC/USDC"), TradingPair {
            base_token: string::utf8(b"BTC"),
            quote_token: string::utf8(b"USDC"),
            min_trade_size: 100000, // 0.001 BTC
            max_leverage: 1000,
            maintenance_margin: 500,
            is_active: true,
        });

        // ETH/USDC pair
        table::add(&mut state.trading_pairs, string::utf8(b"ETH/USDC"), TradingPair {
            base_token: string::utf8(b"ETH"),
            quote_token: string::utf8(b"USDC"),
            min_trade_size: 1000000, // 0.001 ETH
            max_leverage: 1000,
            maintenance_margin: 500,
            is_active: true,
        });

        // Initialize market data
        table::add(&mut state.market_data, string::utf8(b"APT/USDC"), MarketData {
            trading_pair: string::utf8(b"APT/USDC"),
            current_price: 84500000, // $8.45 (scaled by 1e6)
            last_update: timestamp::now_seconds(),
            volume_24h: 0,
            price_change_24h: 0,
        });

        table::add(&mut state.market_data, string::utf8(b"BTC/USDC"), MarketData {
            trading_pair: string::utf8(b"BTC/USDC"),
            current_price: 43250000000, // $43,250 (scaled by 1e6)
            last_update: timestamp::now_seconds(),
            volume_24h: 0,
            price_change_24h: 0,
        });

        table::add(&mut state.market_data, string::utf8(b"ETH/USDC"), MarketData {
            trading_pair: string::utf8(b"ETH/USDC"),
            current_price: 2650000000, // $2,650 (scaled by 1e6)
            last_update: timestamp::now_seconds(),
            volume_24h: 0,
            price_change_24h: 0,
        });
    }

    /// Open a new trading position
    public entry fun open_position(
        user: &signer,
        trading_pair: String,
        position_type: u8,
        size: u64,
        leverage: u64,
        margin: u64,
    ) acquires TradingState, UserAccount {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<TradingState>(@aptospay);
        
        // Check if trading is paused
        assert!(!state.is_paused, E_TRADING_PAUSED);
        
        // Validate position type
        assert!(position_type == POSITION_LONG || position_type == POSITION_SHORT, E_INVALID_POSITION_TYPE);
        
        // Check if trading pair exists and is active
        assert!(table::contains(&state.trading_pairs, trading_pair), E_POSITION_NOT_FOUND);
        let pair_info = table::borrow(&state.trading_pairs, trading_pair);
        assert!(pair_info.is_active, E_TRADING_PAUSED);
        
        // Validate leverage
        assert!(leverage >= 1 && leverage <= pair_info.max_leverage, E_INVALID_LEVERAGE);
        assert!(leverage <= 1000, E_MAX_LEVERAGE_EXCEEDED);
        
        // Validate size
        assert!(size >= pair_info.min_trade_size, E_POSITION_SIZE_TOO_SMALL);
        
        // Get current market price
        let market_data = table::borrow(&state.market_data, trading_pair);
        let current_price = market_data.current_price;
        
        // Calculate required margin
        let position_value = (size * current_price) / 1000000;
        let required_margin = position_value / leverage;
        assert!(margin >= required_margin, E_INSUFFICIENT_MARGIN);
        
        // Calculate liquidation price
        let liquidation_price = calculate_liquidation_price(
            position_type,
            current_price,
            leverage,
            pair_info.maintenance_margin
        );
        
        // Create position
        let position_id = state.next_position_id;
        let position = Position {
            id: position_id,
            owner: user_addr,
            trading_pair,
            position_type,
            size,
            entry_price: current_price,
            leverage,
            margin,
            timestamp: timestamp::now_seconds(),
            status: POSITION_OPEN,
            pnl: 0,
            funding_fees: 0,
            liquidation_price,
        };
        
        // Add position to global state
        table::add(&mut state.positions, position_id, position);
        state.next_position_id = state.next_position_id + 1;
        state.stats.open_positions = state.stats.open_positions + 1;
        state.stats.total_trades = state.stats.total_trades + 1;
        state.stats.total_volume = state.stats.total_volume + size;
        
        // Update user account
        if (!exists<UserAccount>(user_addr)) {
            move_to(user, UserAccount {
                positions: vector::empty(),
                total_deposited: 0,
                total_withdrawn: 0,
                total_fees_paid: 0,
                last_activity: timestamp::now_seconds(),
            });
        };
        
        let user_account = borrow_global_mut<UserAccount>(user_addr);
        vector::push_back(&mut user_account.positions, position_id);
        user_account.total_deposited = user_account.total_deposited + margin;
        user_account.last_activity = timestamp::now_seconds();
    }

    /// Close a position
    public entry fun close_position(
        user: &signer,
        position_id: u64,
    ) acquires TradingState, UserAccount {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<TradingState>(@aptospay);
        
        // Check if position exists
        assert!(table::contains(&state.positions, position_id), E_POSITION_NOT_FOUND);
        let position = table::borrow_mut(&state.positions, position_id);
        
        // Check ownership
        assert!(position.owner == user_addr, E_UNAUTHORIZED);
        assert!(position.status == POSITION_OPEN, E_POSITION_NOT_FOUND);
        
        // Get current market price
        let market_data = table::borrow(&state.market_data, position.trading_pair);
        let current_price = market_data.current_price;
        
        // Calculate PnL
        let pnl = calculate_pnl(
            position.position_type,
            position.entry_price,
            current_price,
            position.size
        );
        
        // Update position
        position.pnl = pnl;
        position.status = POSITION_CLOSED;
        
        // Update stats
        state.stats.open_positions = state.stats.open_positions - 1;
        
        // Update user account
        let user_account = borrow_global_mut<UserAccount>(user_addr);
        user_account.last_activity = timestamp::now_seconds();
    }

    /// Liquidate a position (admin only)
    public entry fun liquidate_position(
        admin: &signer,
        position_id: u64,
    ) acquires TradingState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<TradingState>(@aptospay);
        
        // Check admin permissions
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        
        // Check if position exists
        assert!(table::contains(&state.positions, position_id), E_POSITION_NOT_FOUND);
        let position = table::borrow_mut(&state.positions, position_id);
        
        // Check if position is liquidatable
        let market_data = table::borrow(&state.market_data, position.trading_pair);
        let current_price = market_data.current_price;
        
        assert!(is_liquidatable(position, current_price), E_POSITION_NOT_LIQUIDATABLE);
        
        // Liquidate position
        position.status = POSITION_LIQUIDATED;
        position.pnl = 0 - ((position.margin * 1000000) as i64); // Total loss
        
        // Update stats
        state.stats.open_positions = state.stats.open_positions - 1;
    }

    /// Update market price (admin only)
    public entry fun update_price(
        admin: &signer,
        trading_pair: String,
        new_price: u64,
    ) acquires TradingState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<TradingState>(@aptospay);
        
        // Check admin permissions
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        
        // Check if trading pair exists
        assert!(table::contains(&state.trading_pairs, trading_pair), E_POSITION_NOT_FOUND);
        assert!(new_price > 0, E_INVALID_PRICE);
        
        // Update market data
        let market_data = table::borrow_mut(&state.market_data, trading_pair);
        let old_price = market_data.current_price;
        
        market_data.current_price = new_price;
        market_data.last_update = timestamp::now_seconds();
        let price_diff = (new_price as i64) - (old_price as i64);
        market_data.price_change_24h = (price_diff * 1000000) / (old_price as i64);
    }

    /// Pause/unpause trading (admin only)
    public entry fun set_trading_paused(
        admin: &signer,
        paused: bool,
    ) acquires TradingState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<TradingState>(@aptospay);
        
        // Check admin permissions
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        
        state.is_paused = paused;
    }

    /// Calculate liquidation price
    fun calculate_liquidation_price(
        position_type: u8,
        entry_price: u64,
        leverage: u64,
        maintenance_margin: u64,
    ): u64 {
        let margin_ratio = 10000 - maintenance_margin; // Convert to usable margin
        let liquidation_ratio = (margin_ratio * 1000000) / leverage;
        
        if (position_type == POSITION_LONG) {
            // For long positions: liquidation price = entry_price * (1 - liquidation_ratio)
            (entry_price * (1000000 - liquidation_ratio)) / 1000000
        } else {
            // For short positions: liquidation price = entry_price * (1 + liquidation_ratio)
            (entry_price * (1000000 + liquidation_ratio)) / 1000000
        }
    }

    /// Calculate PnL for a position
    fun calculate_pnl(
        position_type: u8,
        entry_price: u64,
        current_price: u64,
        size: u64,
    ): i64 {
        let price_diff = if (position_type == POSITION_LONG) {
            (current_price as i64) - (entry_price as i64)
        } else {
            (entry_price as i64) - (current_price as i64)
        };
        
        (price_diff * (size as i64)) / 1000000
    }

    /// Check if position is liquidatable
    fun is_liquidatable(position: &Position, current_price: u64): bool {
        let pnl = calculate_pnl(
            position.position_type,
            position.entry_price,
            current_price,
            position.size
        );
        
        // Position is liquidatable if PnL is negative and exceeds maintenance margin
        let position_value = (position.size * position.entry_price) / 1000000;
        let maintenance_margin_required = (position_value * 500) / 10000; // 5%
        
        pnl < 0 && (-pnl) >= (maintenance_margin_required as i64)
    }

    /// Get position details
    public fun get_position(position_id: u64): (u64, address, String, u8, u64, u64, u64, u64, u64, u8, i64, u64, u64) acquires TradingState {
        let state = borrow_global<TradingState>(@aptospay);
        assert!(table::contains(&state.positions, position_id), E_POSITION_NOT_FOUND);
        
        let position = table::borrow(&state.positions, position_id);
        (
            position.id,
            position.owner,
            position.trading_pair,
            position.position_type,
            position.size,
            position.entry_price,
            position.leverage,
            position.margin,
            position.timestamp,
            position.status,
            position.pnl,
            position.funding_fees,
            position.liquidation_price,
        )
    }

    /// Get market data
    public fun get_market_data(trading_pair: String): (String, u64, u64, u64, i64) acquires TradingState {
        let state = borrow_global<TradingState>(@aptospay);
        assert!(table::contains(&state.market_data, trading_pair), E_POSITION_NOT_FOUND);
        
        let market_data = table::borrow(&state.market_data, trading_pair);
        (
            market_data.trading_pair,
            market_data.current_price,
            market_data.last_update,
            market_data.volume_24h,
            market_data.price_change_24h,
        )
    }

    /// Get trading stats
    public fun get_trading_stats(): (u64, u64, u64, u64) acquires TradingState {
        let state = borrow_global<TradingState>(@aptospay);
        (
            state.stats.total_volume,
            state.stats.total_trades,
            state.stats.total_fees,
            state.stats.open_positions,
        )
    }

    /// Get user positions
    public fun get_user_positions(user_addr: address): vector<u64> acquires UserAccount {
        if (!exists<UserAccount>(user_addr)) {
            vector::empty()
        } else {
            let user_account = borrow_global<UserAccount>(user_addr);
            *user_account.positions
        }
    }

    /// Check if trading pair exists and is active
    public fun is_trading_pair_active(trading_pair: String): bool acquires TradingState {
        let state = borrow_global<TradingState>(@aptospay);
        if (table::contains(&state.trading_pairs, trading_pair)) {
            let pair_info = table::borrow(&state.trading_pairs, trading_pair);
            pair_info.is_active
        } else {
            false
        }
    }

    /// Get trading pair info
    public fun get_trading_pair_info(trading_pair: String): (String, String, u64, u64, u64, bool) acquires TradingState {
        let state = borrow_global<TradingState>(@aptospay);
        assert!(table::contains(&state.trading_pairs, trading_pair), E_POSITION_NOT_FOUND);
        
        let pair_info = table::borrow(&state.trading_pairs, trading_pair);
        (
            pair_info.base_token,
            pair_info.quote_token,
            pair_info.min_trade_size,
            pair_info.max_leverage,
            pair_info.maintenance_margin,
            pair_info.is_active,
        )
    }
}