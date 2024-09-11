#[allow(duplicate_alias)]
module upgrades::policy_day_of_week {
    use sui::object::{Self, UID};
    use sui::package;
    use sui::tx_context::TxContext;

    public struct UpgradeCap has key, store {
        id: UID,
        cap: package::UpgradeCap,
        day: u8,
    }

    // Day is not a week day (number in range 0 <= day < 7).
    const ENotWeekDay: u64 = 1;
    const ENotAllowedDay: u64 = 2;
    const MS_IN_DAY: u64 = 24 * 60 * 60 * 1000;

    public fun new_policy(
        cap: package::UpgradeCap,
        day: u8,
        ctx: &mut TxContext,
    ): UpgradeCap {
        assert!(day < 7, ENotWeekDay);
        UpgradeCap { id: object::new(ctx), cap, day }
    }

    fun week_day(ctx: &TxContext): u8 {
        let days_since_unix_epoch =
            sui::tx_context::epoch_timestamp_ms(ctx) / MS_IN_DAY;
        // The unix epoch (1st Jan 1970) was a Thursday so shift days
        // since the epoch by 3 so that 0 = Monday.
        ((days_since_unix_epoch + 3) % 7 as u8)
    }

    public fun authorize_upgrade(
        cap: &mut UpgradeCap,
        policy: u8,
        digest: vector<u8>,
        ctx: &TxContext,
    ): package::UpgradeTicket {
        package::authorize_upgrade(&mut cap.cap, policy, digest)
    }

    public fun commit_upgrade(
        cap: &mut UpgradeCap,
        receipt: package::UpgradeReceipt,
    ) {
        package::commit_upgrade(&mut cap.cap, receipt)
    }

    public fun make_immutable(cap: UpgradeCap) {
        let UpgradeCap { id, cap, day: _ } = cap;
        object::delete(id);
        package::make_immutable(cap);
    }
}