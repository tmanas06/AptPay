module aptospay::oracle {
    use std::signer;
    use std::vector;
    use std::table::{Self, Table};
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    /// Errors
    const E_ORACLE_NOT_FOUND: u64 = 1;
    const E_UNAUTHORIZED: u64 = 2;
    const E_INVALID_PRICE: u64 = 3;
    const E_PRICE_TOO_OLD: u64 = 4;
    const E_INSUFFICIENT_PRICE_FEEDS: u64 = 5;
    const E_PRICE_DEVIATION_TOO_HIGH: u64 = 6;
    const E_ORACLE_PAUSED: u64 = 7;
    const E_INVALID_TIMESTAMP: u64 = 8;
    const E_MAX_DEVIATION_EXCEEDED: u64 = 9;

    /// Price data structure
    struct PriceData has store {
        symbol: String,
        price: u64, // Scaled by 1e6
        timestamp: u64,
        volume_24h: u64,
        price_change_24h: i64, // in basis points
        price_change_7d: i64, // in basis points
        market_cap: u64,
        confidence: u64, // 0-100, higher is more confident
    }

    /// Oracle feed from a specific source
    struct OracleFeed has store {
        feed_id: u64,
        symbol: String,
        price: u64,
        timestamp: u64,
        source: String,
        weight: u64, // Weight for weighted average calculation
        is_active: bool,
    }

    /// Oracle configuration for a symbol
    struct OracleConfig has store {
        symbol: String,
        min_feeds: u64, // Minimum number of feeds required
        max_age: u64, // Maximum age of price data in seconds
        max_deviation: u64, // Maximum deviation between feeds in basis points
        is_active: bool,
        last_updated: u64,
    }

    /// Global oracle state
    struct OracleState has key {
        prices: Table<String, PriceData>,
        feeds: Table<u64, OracleFeed>,
        configs: Table<String, OracleConfig>,
        next_feed_id: u64,
        admin: address,
        is_paused: bool,
        total_symbols: u64,
        total_feeds: u64,
    }

    /// Initialize oracle module
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, OracleState {
            prices: table::new(),
            feeds: table::new(),
            configs: table::new(),
            next_feed_id: 1,
            admin: admin_addr,
            is_paused: false,
            total_symbols: 0,
            total_feeds: 0,
        });

        // Initialize default oracle configurations
        initialize_default_configs(&admin_addr);
    }

    /// Initialize default oracle configurations
    fun initialize_default_configs(admin_addr: &address) acquires OracleState {
        let state = borrow_global_mut<OracleState>(*admin_addr);
        
        // APT configuration
        table::add(&mut state.configs, string::utf8(b"APT"), OracleConfig {
            symbol: string::utf8(b"APT"),
            min_feeds: 2,
            max_age: 300, // 5 minutes
            max_deviation: 500, // 5%
            is_active: true,
            last_updated: timestamp::now_seconds(),
        });

        // BTC configuration
        table::add(&mut state.configs, string::utf8(b"BTC"), OracleConfig {
            symbol: string::utf8(b"BTC"),
            min_feeds: 3,
            max_age: 180, // 3 minutes
            max_deviation: 300, // 3%
            is_active: true,
            last_updated: timestamp::now_seconds(),
        });

        // ETH configuration
        table::add(&mut state.configs, string::utf8(b"ETH"), OracleConfig {
            symbol: string::utf8(b"ETH"),
            min_feeds: 3,
            max_age: 180, // 3 minutes
            max_deviation: 300, // 3%
            is_active: true,
            last_updated: timestamp::now_seconds(),
        });

        // USDC configuration
        table::add(&mut state.configs, string::utf8(b"USDC"), OracleConfig {
            symbol: string::utf8(b"USDC"),
            min_feeds: 2,
            max_age: 600, // 10 minutes
            max_deviation: 50, // 0.5%
            is_active: true,
            last_updated: timestamp::now_seconds(),
        });

        // Initialize with mock price data
        initialize_mock_prices(state);
    }

    /// Initialize mock price data for testing
    fun initialize_mock_prices(state: &mut OracleState) {
        let current_time = timestamp::now_seconds();
        
        // APT price data
        table::add(&mut state.prices, string::utf8(b"APT"), PriceData {
            symbol: string::utf8(b"APT"),
            price: 84500000, // $8.45
            timestamp: current_time,
            volume_24h: 50000000000000, // $50M
            price_change_24h: 234, // +2.34%
            price_change_7d: 0 - 567, // -5.67%
            market_cap: 1000000000000000, // $1T
            confidence: 95,
        });

        // BTC price data
        table::add(&mut state.prices, string::utf8(b"BTC"), PriceData {
            symbol: string::utf8(b"BTC"),
            price: 43250000000, // $43,250
            timestamp: current_time,
            volume_24h: 25000000000000, // $25B
            price_change_24h: 123, // +1.23%
            price_change_7d: 2345, // +23.45%
            market_cap: 850000000000000, // $850B
            confidence: 98,
        });

        // ETH price data
        table::add(&mut state.prices, string::utf8(b"ETH"), PriceData {
            symbol: string::utf8(b"ETH"),
            price: 2650000000, // $2,650
            timestamp: current_time,
            volume_24h: 15000000000000, // $15B
            price_change_24h: 0 - 87, // -0.87%
            price_change_7d: 1234, // +12.34%
            market_cap: 320000000000000, // $320B
            confidence: 96,
        });

        // USDC price data
        table::add(&mut state.prices, string::utf8(b"USDC"), PriceData {
            symbol: string::utf8(b"USDC"),
            price: 1000000, // $1.00
            timestamp: current_time,
            volume_24h: 8000000000000, // $8B
            price_change_24h: 1, // +0.01%
            price_change_7d: -2, // -0.02%
            market_cap: 32000000000000, // $32B
            confidence: 99,
        });

        state.total_symbols = 4;
    }

    /// Update price from an oracle feed (admin or authorized oracles)
    public entry fun update_price_feed(
        admin: &signer,
        symbol: String,
        price: u64,
        volume_24h: u64,
        price_change_24h: i64,
        source: String,
    ) acquires OracleState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<OracleState>(*admin_addr);
        
        assert!(!state.is_paused, E_ORACLE_PAUSED);
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        assert!(price > 0, E_INVALID_PRICE);
        
        // Check if symbol is configured
        assert!(table::contains(&state.configs, symbol), E_ORACLE_NOT_FOUND);
        let config = table::borrow(&state.configs, symbol);
        assert!(config.is_active, E_ORACLE_NOT_FOUND);
        
        // Add new feed
        let feed_id = state.next_feed_id;
        let feed = OracleFeed {
            feed_id,
            symbol,
            price,
            timestamp: timestamp::now_seconds(),
            source,
            weight: 1, // Default weight
            is_active: true,
        };
        
        table::add(&mut state.feeds, feed_id, feed);
        state.next_feed_id = state.next_feed_id + 1;
        state.total_feeds = state.total_feeds + 1;
        
        // Update aggregated price
        update_aggregated_price(state, symbol, price, volume_24h, price_change_24h);
    }

    /// Update aggregated price from multiple feeds
    fun update_aggregated_price(
        state: &mut OracleState,
        symbol: String,
        new_price: u64,
        volume_24h: u64,
        price_change_24h: i64,
    ) {
        let config = table::borrow(&state.configs, symbol);
        let current_time = timestamp::now_seconds();
        
        // Collect all active feeds for this symbol
        let mut valid_feeds = vector::empty<OracleFeed>();
        let mut i = 1;
        while (i < state.next_feed_id) {
            if (table::contains(&state.feeds, i)) {
                let feed = table::borrow(&state.feeds, i);
                if (feed.symbol == symbol && 
                    feed.is_active && 
                    (current_time - feed.timestamp) <= config.max_age) {
                    vector::push_back(&mut valid_feeds, *feed);
                };
            };
            i = i + 1;
        };
        
        // Check if we have enough feeds
        if (vector::length(&valid_feeds) < config.min_feeds) {
            // Use the new price directly if not enough feeds
            let price_data = PriceData {
                symbol,
                price: new_price,
                timestamp: current_time,
                volume_24h,
                price_change_24h,
                price_change_7d: 0, // Simplified
                market_cap: 0, // Simplified
                confidence: 50, // Lower confidence
            };
            
            if (table::contains(&state.prices, symbol)) {
                let existing_price = table::borrow_mut(&state.prices, symbol);
                *existing_price = price_data;
            } else {
                table::add(&mut state.prices, symbol, price_data);
                state.total_symbols = state.total_symbols + 1;
            };
            
            // Update config timestamp
            let config_mut = table::borrow_mut(&state.configs, symbol);
            config_mut.last_updated = current_time;
            return
        };
        
        // Calculate weighted average price
        let aggregated_price = calculate_weighted_average(&valid_feeds);
        
        // Check price deviation
        let max_deviation = (aggregated_price * config.max_deviation) / 10000;
        let price_diff = if (new_price > aggregated_price) {
            new_price - aggregated_price
        } else {
            aggregated_price - new_price
        };
        
        if (price_diff > max_deviation) {
            // Price deviation too high, don't update
            return
        };
        
        // Update price data
        let final_price = if (vector::length(&valid_feeds) >= 3) {
            // Use weighted average if enough feeds
            aggregated_price
        } else {
            // Use new price if not enough feeds
            new_price
        };
        
        let confidence = calculate_confidence(&valid_feeds);
        
        let price_data = PriceData {
            symbol,
            price: final_price,
            timestamp: current_time,
            volume_24h,
            price_change_24h,
            price_change_7d: 0, // Simplified
            market_cap: 0, // Simplified
            confidence,
        };
        
        if (table::contains(&state.prices, symbol)) {
            let existing_price = table::borrow_mut(&state.prices, symbol);
            *existing_price = price_data;
        } else {
            table::add(&mut state.prices, symbol, price_data);
            state.total_symbols = state.total_symbols + 1;
        };
        
        // Update config timestamp
        let config_mut = table::borrow_mut(&state.configs, symbol);
        config_mut.last_updated = current_time;
    }

    /// Calculate weighted average price from feeds
    fun calculate_weighted_average(feeds: &vector<OracleFeed>): u64 {
        let total_weight = 0u64;
        let weighted_sum = 0u128;
        let mut i = 0;
        
        while (i < vector::length(feeds)) {
            let feed = vector::borrow(feeds, i);
            total_weight = total_weight + feed.weight;
            weighted_sum = weighted_sum + ((feed.price as u128) * (feed.weight as u128));
            i = i + 1;
        };
        
        if (total_weight == 0) {
            0
        } else {
            (weighted_sum / (total_weight as u128)) as u64
        }
    }

    /// Calculate confidence based on feed quality
    fun calculate_confidence(feeds: &vector<OracleFeed>): u64 {
        let feed_count = vector::length(feeds);
        let mut confidence = 50u64; // Base confidence
        
        // Increase confidence based on number of feeds
        if (feed_count >= 3) {
            confidence = 90;
        } else if (feed_count >= 2) {
            confidence = 80;
        } else {
            confidence = 60;
        };
        
        // Check for price consistency
        if (feed_count > 1) {
            let mut i = 0;
            let mut total_deviation = 0u64;
            let base_price = vector::borrow(feeds, 0).price;
            
            while (i < feed_count) {
                let feed = vector::borrow(feeds, i);
                let deviation = if (feed.price > base_price) {
                    ((feed.price - base_price) * 10000) / base_price
                } else {
                    ((base_price - feed.price) * 10000) / base_price
                };
                total_deviation = total_deviation + deviation;
                i = i + 1;
            };
            
            let avg_deviation = total_deviation / feed_count;
            if (avg_deviation < 100) { // Less than 1% deviation
                confidence = confidence + 10;
            } else if (avg_deviation > 500) { // More than 5% deviation
                confidence = confidence - 20;
            };
        };
        
        if (confidence > 100) 100 else confidence
    }

    /// Get current price for a symbol
    public fun get_price(symbol: String): (u64, u64, u64) acquires OracleState { // (price, timestamp, confidence)
        let state = borrow_global<OracleState>(@aptospay);
        assert!(table::contains(&state.prices, symbol), E_ORACLE_NOT_FOUND);
        
        let price_data = table::borrow(&state.prices, symbol);
        (price_data.price, price_data.timestamp, price_data.confidence)
    }

    /// Get detailed price data
    public fun get_price_data(symbol: String): (String, u64, u64, u64, i64, i64, u64, u64) acquires OracleState {
        let state = borrow_global<OracleState>(@aptospay);
        assert!(table::contains(&state.prices, symbol), E_ORACLE_NOT_FOUND);
        
        let price_data = table::borrow(&state.prices, symbol);
        (
            price_data.symbol,
            price_data.price,
            price_data.timestamp,
            price_data.volume_24h,
            price_data.price_change_24h,
            price_data.price_change_7d,
            price_data.market_cap,
            price_data.confidence,
        )
    }

    /// Get all available symbols
    public fun get_all_symbols(): vector<String> acquires OracleState {
        let state = borrow_global<OracleState>(@aptospay);
        let mut symbols = vector::empty<String>();
        
        // In a real implementation, you would iterate through the prices table
        // For now, return the known symbols
        vector::push_back(&mut symbols, string::utf8(b"APT"));
        vector::push_back(&mut symbols, string::utf8(b"BTC"));
        vector::push_back(&mut symbols, string::utf8(b"ETH"));
        vector::push_back(&mut symbols, string::utf8(b"USDC"));
        
        symbols
    }

    /// Get oracle configuration
    public fun get_oracle_config(symbol: String): (String, u64, u64, u64, bool, u64) acquires OracleState {
        let state = borrow_global<OracleState>(@aptospay);
        assert!(table::contains(&state.configs, symbol), E_ORACLE_NOT_FOUND);
        
        let config = table::borrow(&state.configs, symbol);
        (
            config.symbol,
            config.min_feeds,
            config.max_age,
            config.max_deviation,
            config.is_active,
            config.last_updated,
        )
    }

    /// Update oracle configuration (admin only)
    public entry fun update_oracle_config(
        admin: &signer,
        symbol: String,
        min_feeds: u64,
        max_age: u64,
        max_deviation: u64,
        is_active: bool,
    ) acquires OracleState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<OracleState>(*admin_addr);
        
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        
        if (table::contains(&state.configs, symbol)) {
            let config = table::borrow_mut(&state.configs, symbol);
            config.min_feeds = min_feeds;
            config.max_age = max_age;
            config.max_deviation = max_deviation;
            config.is_active = is_active;
            config.last_updated = timestamp::now_seconds();
        } else {
            table::add(&mut state.configs, symbol, OracleConfig {
                symbol,
                min_feeds,
                max_age,
                max_deviation,
                is_active,
                last_updated: timestamp::now_seconds(),
            });
        };
    }

    /// Pause/unpause oracle (admin only)
    public entry fun set_oracle_paused(
        admin: &signer,
        paused: bool,
    ) acquires OracleState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<OracleState>(*admin_addr);
        
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        state.is_paused = paused;
    }

    /// Get oracle statistics
    public fun get_oracle_stats(): (u64, u64, bool) acquires OracleState {
        let state = borrow_global<OracleState>(@aptospay);
        (state.total_symbols, state.total_feeds, state.is_paused)
    }

    /// Check if price is fresh enough
    public fun is_price_fresh(symbol: String, max_age: u64): bool acquires OracleState {
        let state = borrow_global<OracleState>(@aptospay);
        if (!table::contains(&state.prices, symbol)) {
            false
        } else {
            let price_data = table::borrow(&state.prices, symbol);
            (timestamp::now_seconds() - price_data.timestamp) <= max_age
        }
    }

    /// Get price with freshness check
    public fun get_fresh_price(symbol: String, max_age: u64): (bool, u64, u64, u64) acquires OracleState { // (is_fresh, price, timestamp, confidence)
        let state = borrow_global<OracleState>(@aptospay);
        if (!table::contains(&state.prices, symbol)) {
            (false, 0, 0, 0)
        } else {
            let price_data = table::borrow(&state.prices, symbol);
            let is_fresh = (timestamp::now_seconds() - price_data.timestamp) <= max_age;
            (is_fresh, price_data.price, price_data.timestamp, price_data.confidence)
        }
    }
}
