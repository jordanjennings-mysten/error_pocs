module upgrades::policy_day_of_week {
    use sui::object::{Self, UID};
    use sui::package;
    use sui::tx_context::TxContext;

    public struct UpgradeCap has key, store {
        id: UID,
        cap: package::UpgradeCap,
    }

    const ENeverAllowed: u64 = 1;

    public fun new_policy(
        cap: package::UpgradeCap,
        day: u8,
        ctx: &mut TxContext,
    ): UpgradeCap {
        UpgradeCap { id: object::new(ctx), cap }
    }

    public fun authorize_upgrade(
        cap: &mut UpgradeCap,
        policy: u8,
        digest: vector<u8>,
        ctx: &TxContext,
    ): package::UpgradeTicket {
        assert!(false, ENeverAllowed);
    }

    public fun commit_upgrade(
        cap: &mut UpgradeCap,
        receipt: package::UpgradeReceipt,
    ) {
        package::commit_upgrade(&mut cap.cap, receipt)
    }

    public fun make_immutable(cap: UpgradeCap) {
        let UpgradeCap { id, cap } = cap;
        object::delete(id);
        package::make_immutable(cap);
    }
}