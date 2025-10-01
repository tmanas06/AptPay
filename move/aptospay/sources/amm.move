module aptospay::amm {
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
    const E_POOL_NOT_FOUND: u64 = 1;
    const E_INSUFFICIENT_LIQUIDITY: u64 = 2;
    const E_INVALID_AMOUNT: u64 = 3;
    const E_UNAUTHORIZED: u64 = 4;
    const E_POOL_ALREADY_EXISTS: u64 = 5;
    const E_INVALID_SLIPPAGE: u64 = 6;
    const E_DEADLINE_EXCEEDED: u64 = 7;
    const E_INSUFFICIENT_BALANCE: u64 = 8;
    const E_INVALID_TOKEN_PAIR: u64 = 9;
    const E_AMM_PAUSED: u64 = 10;
    const E_MINIMUM_LIQUIDITY_NOT_MET: u64 = 11;
    const E_INVALID_FEE_RATE: u64 = 12;

    /// Liquidity pool
    struct Pool has key {
        id: u64,
        token0: String,
        token1: String,
        reserve0: u64,
        reserve1: u64,
        total_supply: u64,
        fee_rate: u64, // in basis points (30 = 0.3%)
        last_update: u64,
        volume_24h: u64,
        fees_24h: u64,
        is_active: bool,
        k: u128, // Constant product (reserve0 * reserve1)
    }

    /// User liquidity position
    struct LiquidityPosition has store {
        id: u64,
        owner: address,
        pool_id: u64,
        liquidity_tokens: u64,
        token0_amount: u64,
        token1_amount: u64,
        fees_earned: u64,
        timestamp: u64,
    }

    /// Swap transaction record
    struct SwapRecord has store {
        id: u64,
        user: address,
        pool_id: u64,
        token_in: String,
        token_out: String,
        amount_in: u64,
        amount_out: u64,
        price_impact: u64,
        fee_paid: u64,
        timestamp: u64,
    }

    /// Global AMM state
    struct AMMState has key {
        pools: Table<u64, Pool>,
        pool_by_tokens: Table<String, u64>, // "TOKEN0/TOKEN1" -> pool_id
        positions: Table<u64, LiquidityPosition>,
        swap_records: Table<u64, SwapRecord>,
        next_pool_id: u64,
        next_position_id: u64,
        next_swap_id: u64,
        admin: address,
        is_paused: bool,
        default_fee_rate: u64, // 30 basis points (0.3%)
        protocol_fee_rate: u64, // 10 basis points (0.1%)
        total_volume: u64,
        total_fees: u64,
    }

    /// User account for tracking AMM activity
    struct UserAMMAccount has key {
        positions: vector<u64>,
        total_swaps: u64,
        total_volume: u64,
        total_fees_paid: u64,
        total_fees_earned: u64,
        last_activity: u64,
    }

    /// Initialize AMM module
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, AMMState {
            pools: table::new(),
            pool_by_tokens: table::new(),
            positions: table::new(),
            swap_records: table::new(),
            next_pool_id: 1,
            next_position_id: 1,
            next_swap_id: 1,
            admin: admin_addr,
            is_paused: false,
            default_fee_rate: 30, // 0.3%
            protocol_fee_rate: 10, // 0.1%
            total_volume: 0,
            total_fees: 0,
        });

        // Initialize default pools
        initialize_default_pools(&admin_addr);
    }

    /// Initialize default pools
    fun initialize_default_pools(admin_addr: &address) acquires AMMState {
        let state = borrow_global_mut<AMMState>(*admin_addr);
        
        // Create APT/USDC pool
        create_pool_internal(
            state,
            string::utf8(b"APT"),
            string::utf8(b"USDC"),
            100000000000, // 1000 APT initial liquidity
            845000000000, // $8450 USDC initial liquidity (1000 APT * $8.45)
            30, // 0.3% fee
        );

        // Create BTC/USDC pool
        create_pool_internal(
            state,
            string::utf8(b"BTC"),
            string::utf8(b"USDC"),
            10000000, // 0.1 BTC initial liquidity
            4325000000, // $4325 USDC initial liquidity
            30,
        );

        // Create ETH/USDC pool
        create_pool_internal(
            state,
            string::utf8(b"ETH"),
            string::utf8(b"USDC"),
            1000000000, // 1 ETH initial liquidity
            2650000000, // $2650 USDC initial liquidity
            30,
        );
    }

    /// Create a new liquidity pool
    public entry fun create_pool(
        admin: &signer,
        token0: String,
        token1: String,
        initial_reserve0: u64,
        initial_reserve1: u64,
        fee_rate: u64,
    ) acquires AMMState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<AMMState>(admin_addr);
        
        // Check admin permissions
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        assert!(!state.is_paused, E_AMM_PAUSED);
        assert!(fee_rate > 0 && fee_rate <= 1000, E_INVALID_FEE_RATE); // Max 10%
        
        create_pool_internal(state, token0, token1, initial_reserve0, initial_reserve1, fee_rate);
    }

    /// Internal function to create pool
    fun create_pool_internal(
        state: &mut AMMState,
        token0: String,
        token1: String,
        initial_reserve0: u64,
        initial_reserve1: u64,
        fee_rate: u64,
    ) {
        let pool_key = get_pool_key(token0, token1);
        assert!(!table::contains(&state.pool_by_tokens, pool_key), E_POOL_ALREADY_EXISTS);
        
        let pool_id = state.next_pool_id;
        let k = (initial_reserve0 as u128) * (initial_reserve1 as u128);
        
        let pool = Pool {
            id: pool_id,
            token0,
            token1,
            reserve0: initial_reserve0,
            reserve1: initial_reserve1,
            total_supply: 1000000000000000, // Initial LP token supply
            fee_rate,
            last_update: timestamp::now_seconds(),
            volume_24h: 0,
            fees_24h: 0,
            is_active: true,
            k,
        };
        
        table::add(&mut state.pools, pool_id, pool);
        table::add(&mut state.pool_by_tokens, pool_key, pool_id);
        state.next_pool_id = state.next_pool_id + 1;
    }

    /// Add liquidity to a pool
    public entry fun add_liquidity(
        user: &signer,
        pool_id: u64,
        amount0: u64,
        amount1: u64,
        min_liquidity: u64,
    ) acquires AMMState, UserAMMAccount {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<AMMState>(@aptospay);
        
        assert!(!state.is_paused, E_AMM_PAUSED);
        assert!(table::contains(&state.pools, pool_id), E_POOL_NOT_FOUND);
        
        let pool = table::borrow_mut(&state.pools, pool_id);
        assert!(pool.is_active, E_POOL_NOT_FOUND);
        assert!(amount0 > 0 && amount1 > 0, E_INVALID_AMOUNT);
        
        // Calculate liquidity tokens to mint
        let liquidity_tokens = if (pool.total_supply == 0) {
            // First liquidity provider
            math64::sqrt(((amount0 as u128) * (amount1 as u128)) as u64)
        } else {
            // Calculate based on existing reserves
            let liquidity0 = (amount0 * pool.total_supply) / pool.reserve0;
            let liquidity1 = (amount1 * pool.total_supply) / pool.reserve1;
            math64::min(liquidity0, liquidity1)
        };
        
        assert!(liquidity_tokens >= min_liquidity, E_INVALID_AMOUNT);
        assert!(liquidity_tokens >= 1000000, E_MINIMUM_LIQUIDITY_NOT_MET); // Minimum 0.000001
        
        // Update pool reserves
        pool.reserve0 = pool.reserve0 + amount0;
        pool.reserve1 = pool.reserve1 + amount1;
        pool.total_supply = pool.total_supply + liquidity_tokens;
        pool.k = (pool.reserve0 as u128) * (pool.reserve1 as u128);
        pool.last_update = timestamp::now_seconds();
        
        // Create liquidity position
        let position_id = state.next_position_id;
        let position = LiquidityPosition {
            id: position_id,
            owner: user_addr,
            pool_id,
            liquidity_tokens,
            token0_amount: amount0,
            token1_amount: amount1,
            fees_earned: 0,
            timestamp: timestamp::now_seconds(),
        };
        
        table::add(&mut state.positions, position_id, position);
        state.next_position_id = state.next_position_id + 1;
        
        // Update user account
        if (!exists<UserAMMAccount>(user_addr)) {
            move_to(user, UserAMMAccount {
                positions: vector::empty(),
                total_swaps: 0,
                total_volume: 0,
                total_fees_paid: 0,
                total_fees_earned: 0,
                last_activity: timestamp::now_seconds(),
            });
        };
        
        let user_account = borrow_global_mut<UserAMMAccount>(user_addr);
        vector::push_back(&mut user_account.positions, position_id);
        user_account.last_activity = timestamp::now_seconds();
    }

    /// Remove liquidity from a pool
    public entry fun remove_liquidity(
        user: &signer,
        position_id: u64,
        liquidity_amount: u64,
    ) acquires AMMState, UserAMMAccount {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<AMMState>(@aptospay);
        
        assert!(!state.is_paused, E_AMM_PAUSED);
        assert!(table::contains(&state.positions, position_id), E_POOL_NOT_FOUND);
        
        let position = table::borrow_mut(&state.positions, position_id);
        assert!(position.owner == user_addr, E_UNAUTHORIZED);
        assert!(liquidity_amount <= position.liquidity_tokens, E_INSUFFICIENT_BALANCE);
        
        let pool = table::borrow_mut(&state.pools, position.pool_id);
        
        // Calculate amounts to return
        let amount0 = (liquidity_amount * pool.reserve0) / pool.total_supply;
        let amount1 = (liquidity_amount * pool.reserve1) / pool.total_supply;
        
        // Update pool reserves
        pool.reserve0 = pool.reserve0 - amount0;
        pool.reserve1 = pool.reserve1 - amount1;
        pool.total_supply = pool.total_supply - liquidity_amount;
        pool.k = (pool.reserve0 as u128) * (pool.reserve1 as u128);
        pool.last_update = timestamp::now_seconds();
        
        // Update position
        position.liquidity_tokens = position.liquidity_tokens - liquidity_amount;
        position.token0_amount = position.token0_amount - amount0;
        position.token1_amount = position.token1_amount - amount1;
        
        // Update user account
        let user_account = borrow_global_mut<UserAMMAccount>(user_addr);
        user_account.last_activity = timestamp::now_seconds();
    }

    /// Swap tokens
    public entry fun swap_tokens(
        user: &signer,
        pool_id: u64,
        token_in: String,
        amount_in: u64,
        min_amount_out: u64,
        deadline: u64,
    ) acquires AMMState, UserAMMAccount {
        let user_addr = signer::address_of(user);
        let state = borrow_global_mut<AMMState>(@aptospay);
        
        assert!(!state.is_paused, E_AMM_PAUSED);
        assert!(table::contains(&state.pools, pool_id), E_POOL_NOT_FOUND);
        assert!(timestamp::now_seconds() <= deadline, E_DEADLINE_EXCEEDED);
        
        let pool = table::borrow_mut(&state.pools, pool_id);
        assert!(pool.is_active, E_POOL_NOT_FOUND);
        assert!(amount_in > 0, E_INVALID_AMOUNT);
        
        let (reserve_in, reserve_out, token_out) = if (token_in == pool.token0) {
            (pool.reserve0, pool.reserve1, pool.token1)
        } else if (token_in == pool.token1) {
            (pool.reserve1, pool.reserve0, pool.token0)
        } else {
            abort E_INVALID_TOKEN_PAIR
        };
        
        // Calculate swap amount with fees
        let fee = (amount_in * pool.fee_rate) / 10000;
        let amount_in_after_fee = amount_in - fee;
        
        // Calculate amount out using constant product formula
        let amount_out = calculate_swap_amount(reserve_in, reserve_out, amount_in_after_fee);
        assert!(amount_out >= min_amount_out, E_INVALID_SLIPPAGE);
        
        // Calculate price impact
        let price_impact = calculate_price_impact(reserve_out, amount_out);
        
        // Update reserves
        if (token_in == pool.token0) {
            pool.reserve0 = pool.reserve0 + amount_in;
            pool.reserve1 = pool.reserve1 - amount_out;
        } else {
            pool.reserve1 = pool.reserve1 + amount_in;
            pool.reserve0 = pool.reserve0 - amount_out;
        };
        
        pool.k = (pool.reserve0 as u128) * (pool.reserve1 as u128);
        pool.volume_24h = pool.volume_24h + amount_in;
        pool.fees_24h = pool.fees_24h + fee;
        pool.last_update = timestamp::now_seconds();
        
        // Record swap
        let swap_id = state.next_swap_id;
        let swap_record = SwapRecord {
            id: swap_id,
            user: user_addr,
            pool_id,
            token_in,
            token_out,
            amount_in,
            amount_out,
            price_impact,
            fee_paid: fee,
            timestamp: timestamp::now_seconds(),
        };
        
        table::add(&mut state.swap_records, swap_id, swap_record);
        state.next_swap_id = state.next_swap_id + 1;
        state.total_volume = state.total_volume + amount_in;
        state.total_fees = state.total_fees + fee;
        
        // Update user account
        if (!exists<UserAMMAccount>(user_addr)) {
            move_to(user, UserAMMAccount {
                positions: vector::empty(),
                total_swaps: 0,
                total_volume: 0,
                total_fees_paid: 0,
                total_fees_earned: 0,
                last_activity: timestamp::now_seconds(),
            });
        };
        
        let user_account = borrow_global_mut<UserAMMAccount>(user_addr);
        user_account.total_swaps = user_account.total_swaps + 1;
        user_account.total_volume = user_account.total_volume + amount_in;
        user_account.total_fees_paid = user_account.total_fees_paid + fee;
        user_account.last_activity = timestamp::now_seconds();
    }

    /// Calculate swap amount using constant product formula
    fun calculate_swap_amount(reserve_in: u64, reserve_out: u64, amount_in: u64): u64 {
        let numerator = amount_in * reserve_out;
        let denominator = reserve_in + amount_in;
        numerator / denominator
    }

    /// Calculate price impact
    fun calculate_price_impact(reserve_out: u64, amount_out: u64): u64 {
        (amount_out * 10000) / reserve_out // in basis points
    }

    /// Get pool key for token pair
    fun get_pool_key(token0: String, token1: String): String {
        if (token0 < token1) {
            string::utf8(b"") // Concatenate tokens
        } else {
            string::utf8(b"") // Concatenate tokens
        }
    }

    /// Get pool information
    public fun get_pool_info(pool_id: u64): (u64, String, String, u64, u64, u64, u64, u64, u64, bool, u128) acquires AMMState {
        let state = borrow_global<AMMState>(@aptospay);
        assert!(table::contains(&state.pools, pool_id), E_POOL_NOT_FOUND);
        
        let pool = table::borrow(&state.pools, pool_id);
        (
            pool.id,
            pool.token0,
            pool.token1,
            pool.reserve0,
            pool.reserve1,
            pool.total_supply,
            pool.fee_rate,
            pool.last_update,
            pool.volume_24h,
            pool.is_active,
            pool.k,
        )
    }

    /// Get liquidity position
    public fun get_position_info(position_id: u64): (u64, address, u64, u64, u64, u64, u64, u64) acquires AMMState {
        let state = borrow_global<AMMState>(@aptospay);
        assert!(table::contains(&state.positions, position_id), E_POOL_NOT_FOUND);
        
        let position = table::borrow(&state.positions, position_id);
        (
            position.id,
            position.owner,
            position.pool_id,
            position.liquidity_tokens,
            position.token0_amount,
            position.token1_amount,
            position.fees_earned,
            position.timestamp,
        )
    }

    /// Get swap record
    public fun get_swap_record(swap_id: u64): (u64, address, u64, String, String, u64, u64, u64, u64, u64) acquires AMMState {
        let state = borrow_global<AMMState>(@aptospay);
        assert!(table::contains(&state.swap_records, swap_id), E_POOL_NOT_FOUND);
        
        let swap = table::borrow(&state.swap_records, swap_id);
        (
            swap.id,
            swap.user,
            swap.pool_id,
            swap.token_in,
            swap.token_out,
            swap.amount_in,
            swap.amount_out,
            swap.price_impact,
            swap.fee_paid,
            swap.timestamp,
        )
    }

    /// Get user positions
    public fun get_user_positions(user_addr: address): vector<u64> acquires UserAMMAccount {
        if (!exists<UserAMMAccount>(user_addr)) {
            vector::empty()
        } else {
            let user_account = borrow_global<UserAMMAccount>(user_addr);
            *user_account.positions
        }
    }

    /// Get user AMM account info
    public fun get_user_amm_account(user_addr: address): (u64, u64, u64, u64, u64) acquires UserAMMAccount {
        if (!exists<UserAMMAccount>(user_addr)) {
            (0, 0, 0, 0, 0)
        } else {
            let user_account = borrow_global<UserAMMAccount>(user_addr);
            (
                vector::length(&user_account.positions),
                user_account.total_swaps,
                user_account.total_volume,
                user_account.total_fees_paid,
                user_account.total_fees_earned,
            )
        }
    }

    /// Get AMM global stats
    public fun get_amm_stats(): (u64, u64, u64, u64) acquires AMMState {
        let state = borrow_global<AMMState>(@aptospay);
        (
            state.total_volume,
            state.total_fees,
            state.next_pool_id - 1,
            state.next_swap_id - 1,
        )
    }

    /// Pause/unpause AMM (admin only)
    public entry fun set_amm_paused(
        admin: &signer,
        paused: bool,
    ) acquires AMMState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<AMMState>(@aptospay);
        
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        state.is_paused = paused;
    }

    /// Update pool fee (admin only)
    public entry fun update_pool_fee(
        admin: &signer,
        pool_id: u64,
        new_fee_rate: u64,
    ) acquires AMMState {
        let admin_addr = signer::address_of(admin);
        let state = borrow_global_mut<AMMState>(@aptospay);
        
        assert!(admin_addr == state.admin, E_UNAUTHORIZED);
        assert!(table::contains(&state.pools, pool_id), E_POOL_NOT_FOUND);
        assert!(new_fee_rate <= 1000, E_INVALID_FEE_RATE); // Max 10%
        
        let pool = table::borrow_mut(&state.pools, pool_id);
        pool.fee_rate = new_fee_rate;
        pool.last_update = timestamp::now_seconds();
    }

    /// Get pool by token pair
    public fun get_pool_by_tokens(token0: String, token1: String): Option<u64> acquires AMMState {
        let state = borrow_global<AMMState>(@aptospay);
        let pool_key = get_pool_key(token0, token1);
        
        if (table::contains(&state.pool_by_tokens, pool_key)) {
            option::some(*table::borrow(&state.pool_by_tokens, pool_key))
        } else {
            option::none()
        }
    }

    /// Calculate swap quote
    public fun get_swap_quote(
        pool_id: u64,
        token_in: String,
        amount_in: u64,
    ): (u64, u64, u64) acquires AMMState { // (amount_out, fee, price_impact)
        let state = borrow_global<AMMState>(@aptospay);
        assert!(table::contains(&state.pools, pool_id), E_POOL_NOT_FOUND);
        
        let pool = table::borrow(&state.pools, pool_id);
        
        let (reserve_in, reserve_out) = if (token_in == pool.token0) {
            (pool.reserve0, pool.reserve1)
        } else {
            (pool.reserve1, pool.reserve0)
        };
        
        let fee = (amount_in * pool.fee_rate) / 10000;
        let amount_in_after_fee = amount_in - fee;
        let amount_out = calculate_swap_amount(reserve_in, reserve_out, amount_in_after_fee);
        let price_impact = calculate_price_impact(reserve_out, amount_out);
        
        (amount_out, fee, price_impact)
    }
}