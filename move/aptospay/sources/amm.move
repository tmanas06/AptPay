module aptospay::amm {
    use std::signer;
    use std::vector;
    use std::table::{Self, Table};
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::account;
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

    struct Pool has key {
        id: u64,
        token0: String,
        token1: String,
        reserve0: u64,
        reserve1: u64,
        total_supply: u64,
        fee_rate: u64, // in basis points
        last_update: u64,
    }

    struct LiquidityPosition has store {
        id: u64,
        owner: address,
        pool_id: u64,
        liquidity: u64,
        token0_amount: u64,
        token1_amount: u64,
        timestamp: u64,
    }

    struct UserLiquidity has key {
        positions: Table<u64, LiquidityPosition>,
        next_position_id: u64,
    }

    struct PoolRegistry has key {
        pools: Table<u64, Pool>,
        next_pool_id: u64,
    }

    struct AMMConfig has key {
        default_fee_rate: u64, // 0.3% = 30 basis points
        min_liquidity: u64,
        max_slippage: u64, // 5% = 500 basis points
    }

    struct SwapStats has key {
        total_volume: u64,
        total_fees: u64,
        total_swaps: u64,
    }

    /// Initialize the AMM module
    public fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, PoolRegistry {
            pools: table::new(),
            next_pool_id: 0,
        });

        move_to(admin, AMMConfig {
            default_fee_rate: 30, // 0.3%
            min_liquidity: 1000000, // 1 APT minimum
            max_slippage: 500, // 5%
        });

        move_to(admin, SwapStats {
            total_volume: 0,
            total_fees: 0,
            total_swaps: 0,
        });
    }

    /// Initialize user liquidity positions
    public fun initialize_user_liquidity(user: &signer) {
        let user_addr = signer::address_of(user);
        
        assert!(!exists<UserLiquidity>(user_addr), E_POOL_ALREADY_EXISTS);
        
        move_to(user, UserLiquidity {
            positions: table::new(),
            next_position_id: 0,
        });
    }

    /// Create a new liquidity pool
    public fun create_pool(
        admin: &signer,
        token0: String,
        token1: String,
        fee_rate: u64
    ): u64 {
        let admin_addr = signer::address_of(admin);
        let pool_registry = borrow_global_mut<PoolRegistry>(admin_addr);
        
        let pool_id = pool_registry.next_pool_id;
        
        let pool = Pool {
            id: pool_id,
            token0,
            token1,
            reserve0: 0,
            reserve1: 0,
            total_supply: 0,
            fee_rate,
            last_update: aptos_std::timestamp::now_seconds(),
        };
        
        table::add(&mut pool_registry.pools, pool_id, pool);
        pool_registry.next_pool_id = pool_id + 1;
        
        pool_id
    }

    /// Add liquidity to a pool
    public fun add_liquidity(
        user: &signer,
        pool_id: u64,
        amount0: u64,
        amount1: u64,
        min_liquidity: u64
    ): u64 {
        let user_addr = signer::address_of(user);
        let admin_addr = @aptospay;
        
        // Initialize user liquidity if not exists
        if (!exists<UserLiquidity>(user_addr)) {
            initialize_user_liquidity(user);
        };
        
        let pool_registry = borrow_global_mut<PoolRegistry>(admin_addr);
        assert!(table::contains(&pool_registry.pools, pool_id), E_POOL_NOT_FOUND);
        
        let pool = table::borrow_mut(&mut pool_registry.pools, pool_id);
        
        let liquidity_minted;
        
        if (pool.total_supply == 0) {
            // First liquidity provision - use geometric mean
            liquidity_minted = math64::sqrt(amount0 * amount1);
        } else {
            // Calculate liquidity based on existing reserves
            let liquidity0 = (amount0 * pool.total_supply) / pool.reserve0;
            let liquidity1 = (amount1 * pool.total_supply) / pool.reserve1;
            liquidity_minted = if (liquidity0 < liquidity1) { liquidity0 } else { liquidity1 };
        };
        
        assert!(liquidity_minted >= min_liquidity, E_INVALID_SLIPPAGE);
        
        // Update pool reserves
        pool.reserve0 = pool.reserve0 + amount0;
        pool.reserve1 = pool.reserve1 + amount1;
        pool.total_supply = pool.total_supply + liquidity_minted;
        pool.last_update = aptos_std::timestamp::now_seconds();
        
        // Create user position
        let user_liquidity = borrow_global_mut<UserLiquidity>(user_addr);
        let position_id = user_liquidity.next_position_id;
        
        let position = LiquidityPosition {
            id: position_id,
            owner: user_addr,
            pool_id,
            liquidity: liquidity_minted,
            token0_amount: amount0,
            token1_amount: amount1,
            timestamp: aptos_std::timestamp::now_seconds(),
        };
        
        table::add(&mut user_liquidity.positions, position_id, position);
        user_liquidity.next_position_id = position_id + 1;
        
        liquidity_minted
    }

    /// Remove liquidity from a pool
    public fun remove_liquidity(
        user: &signer,
        position_id: u64
    ): (u64, u64) {
        let user_addr = signer::address_of(user);
        let admin_addr = @aptospay;
        
        assert!(exists<UserLiquidity>(user_addr), E_POOL_NOT_FOUND);
        
        let user_liquidity = borrow_global_mut<UserLiquidity>(user_addr);
        assert!(table::contains(&user_liquidity.positions, position_id), E_POOL_NOT_FOUND);
        
        let position = table::borrow_mut(&mut user_liquidity.positions, position_id);
        assert!(position.owner == user_addr, E_UNAUTHORIZED);
        
        let pool_registry = borrow_global_mut<PoolRegistry>(admin_addr);
        let pool = table::borrow_mut(&mut pool_registry.pools, position.pool_id);
        
        // Calculate amounts to withdraw
        let amount0 = (position.liquidity * pool.reserve0) / pool.total_supply;
        let amount1 = (position.liquidity * pool.reserve1) / pool.total_supply;
        
        // Update pool reserves
        pool.reserve0 = pool.reserve0 - amount0;
        pool.reserve1 = pool.reserve1 - amount1;
        pool.total_supply = pool.total_supply - position.liquidity;
        pool.last_update = aptos_std::timestamp::now_seconds();
        
        // Remove position
        table::remove(&mut user_liquidity.positions, position_id);
        
        (amount0, amount1)
    }

    /// Swap tokens using constant product formula
    public fun swap(
        user: &signer,
        pool_id: u64,
        token_in: String,
        amount_in: u64,
        min_amount_out: u64,
        deadline: u64
    ): u64 {
        let admin_addr = @aptospay;
        let current_time = aptos_std::timestamp::now_seconds();
        
        assert!(current_time <= deadline, E_DEADLINE_EXCEEDED);
        assert!(amount_in > 0, E_INVALID_AMOUNT);
        
        let pool_registry = borrow_global_mut<PoolRegistry>(admin_addr);
        assert!(table::contains(&pool_registry.pools, pool_id), E_POOL_NOT_FOUND);
        
        let pool = table::borrow_mut(&mut pool_registry.pools, pool_id);
        
        let (reserve_in, reserve_out) = if (token_in == pool.token0) {
            (pool.reserve0, pool.reserve1)
        } else {
            (pool.reserve1, pool.reserve0)
        };
        
        assert!(reserve_in > 0 && reserve_out > 0, E_INSUFFICIENT_LIQUIDITY);
        
        // Calculate fee
        let fee_amount = (amount_in * pool.fee_rate) / 10000;
        let amount_in_after_fee = amount_in - fee_amount;
        
        // Calculate output using constant product formula: x * y = k
        let amount_out = (amount_in_after_fee * reserve_out) / (reserve_in + amount_in_after_fee);
        
        assert!(amount_out >= min_amount_out, E_INVALID_SLIPPAGE);
        
        // Update reserves
        if (token_in == pool.token0) {
            pool.reserve0 = pool.reserve0 + amount_in;
            pool.reserve1 = pool.reserve1 - amount_out;
        } else {
            pool.reserve1 = pool.reserve1 + amount_in;
            pool.reserve0 = pool.reserve0 - amount_out;
        };
        
        pool.last_update = current_time;
        
        // Update stats
        let stats = borrow_global_mut<SwapStats>(admin_addr);
        stats.total_volume = stats.total_volume + amount_in;
        stats.total_fees = stats.total_fees + fee_amount;
        stats.total_swaps = stats.total_swaps + 1;
        
        amount_out
    }

    /// Get pool information
    public fun get_pool_info(pool_id: u64): (String, String, u64, u64, u64, u64) {
        let admin_addr = @aptospay;
        let pool_registry = borrow_global<PoolRegistry>(admin_addr);
        
        assert!(table::contains(&pool_registry.pools, pool_id), E_POOL_NOT_FOUND);
        let pool = table::borrow(&pool_registry.pools, pool_id);
        
        (pool.token0, pool.token1, pool.reserve0, pool.reserve1, pool.total_supply, pool.fee_rate)
    }

    /// Get user's liquidity positions
    public fun get_user_positions(user_addr: address): vector<LiquidityPosition> {
        if (!exists<UserLiquidity>(user_addr)) {
            return vector::empty()
        };
        
        let user_liquidity = borrow_global<UserLiquidity>(user_addr);
        let positions = vector::empty<LiquidityPosition>();
        
        // Note: In a real implementation, you'd need to iterate through the table
        // This is a simplified version
        positions
    }

    /// Calculate price impact for a swap
    public fun calculate_price_impact(
        pool_id: u64,
        token_in: String,
        amount_in: u64
    ): u64 {
        let admin_addr = @aptospay;
        let pool_registry = borrow_global<PoolRegistry>(admin_addr);
        
        assert!(table::contains(&pool_registry.pools, pool_id), E_POOL_NOT_FOUND);
        let pool = table::borrow(&pool_registry.pools, pool_id);
        
        let (reserve_in, reserve_out) = if (token_in == pool.token0) {
            (pool.reserve0, pool.reserve1)
        } else {
            (pool.reserve1, pool.reserve0)
        };
        
        if (reserve_in == 0 || reserve_out == 0) {
            return 0
        };
        
        let fee_amount = (amount_in * pool.fee_rate) / 10000;
        let amount_in_after_fee = amount_in - fee_amount;
        
        let amount_out = (amount_in_after_fee * reserve_out) / (reserve_in + amount_in_after_fee);
        let price_impact = (amount_in_after_fee * 10000) / reserve_in;
        
        price_impact
    }

    /// Get swap statistics
    public fun get_swap_stats(): (u64, u64, u64) {
        let admin_addr = @aptospay;
        let stats = borrow_global<SwapStats>(admin_addr);
        
        (stats.total_volume, stats.total_fees, stats.total_swaps)
    }

    /// Rebalance pool (proactive liquidity management)
    public fun rebalance_pool(admin: &signer, pool_id: u64) {
        let admin_addr = signer::address_of(admin);
        let pool_registry = borrow_global_mut<PoolRegistry>(admin_addr);
        
        assert!(table::contains(&pool_registry.pools, pool_id), E_POOL_NOT_FOUND);
        let pool = table::borrow_mut(&mut pool_registry.pools, pool_id);
        
        // Simple rebalancing logic: if one reserve is too low, adjust
        let total_value = pool.reserve0 + pool.reserve1;
        let target_ratio = 5000; // 50/50 split
        
        let current_ratio = (pool.reserve0 * 10000) / total_value;
        
        if (current_ratio > 6000) { // 60% threshold
            // Too much token0, need to rebalance
            let excess = pool.reserve0 - (total_value / 2);
            pool.reserve0 = pool.reserve0 - excess;
            pool.reserve1 = pool.reserve1 + excess;
        } else if (current_ratio < 4000) { // 40% threshold
            // Too little token0, need to rebalance
            let deficit = (total_value / 2) - pool.reserve0;
            pool.reserve0 = pool.reserve0 + deficit;
            pool.reserve1 = pool.reserve1 - deficit;
        };
        
        pool.last_update = aptos_std::timestamp::now_seconds();
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
