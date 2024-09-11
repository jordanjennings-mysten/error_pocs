

module upgrades::upgrades {
    public fun test_change_upgrade_cap() {}
    public fun new_policy(
        cap: package::UpgradeCap,
    ): UpgradeCap {
        UpgradeCap { id: object::new(ctx)  }
    }
}

module policy::day_of_week {
    use sui::object::{Self, UID};
    use sui::package;
    use sui::tx_context::TxContext;

    struct UpgradeCap has key, store {
        id: UID,
        cap: package::UpgradeCap,
        day: u8,
    }

    /// Day is not a week day (number in range 0 <= day < 7).
    const ENotWeekDay: u64 = 1;

    public fun new_policy(
        cap: package::UpgradeCap,
        day: u8,
        ctx: &mut TxContext,
    ): UpgradeCap {
        assert!(day < 7, ENotWeekDay);
        UpgradeCap { id: object::new(ctx), cap, day }
    }
}