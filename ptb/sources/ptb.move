module ptb::ptb {

    public struct NoAbilityStruct {}
    public struct CopyStruct {}
    public struct DropStruct has drop {}
    public struct CopyDropStruct has copy, drop {}

    // basic function
    public fun basic() {}

    public fun basic_with_arg(_a: u64) {}

    // 1(a: u32) -> a; 2(a: u64)
    public fun u32_to_u64_1(): u32 {
        0
    }

    public fun u32_to_u64_2(_a: u64) {}

    // u64 implements copy,drop as a native type
    // 1(&a) -> &a; 2(a)
    public fun borrowed_to_owned_1(a: &u64): &u64 {
      a
    }

    public fun borrowed_to_owned_2(_a: u64) {}

    // NO ERROR?
    // 1() -> a; 2(&a)
    public fun owned_to_borrowed_1(): u64 {
        1
    }

    public fun owned_to_borrowed_2(_a: &u64) {}

    public fun make_copy_struct(): CopyStruct {
        CopyStruct {}
    }

    // 1() -> copy a; 2(&a)
    public fun copy_owned_to_owned_1(): CopyStruct {
        CopyStruct {}
    }

    public fun copy_owned_to_owned_2(a: CopyStruct) {
        let CopyStruct {} = a;
    }

    // 1() -> drop a; 2(a)
    public fun drop_owned_to_owned_1(): DropStruct {
        DropStruct {}
    }

    public fun drop_owned_to_owned_2(_a: DropStruct) {}

    // 1() -> copy &a; 2(&a)
    public fun copy_borrowed_to_borrowed_1(a: &CopyStruct): &CopyStruct {
        a
    }

    public fun copy_borrowed_to_borrowed_2(_a: &CopyStruct) {}

    // 1() -> drop &a; 2(&a)
    public fun drop_borrowed_to_borrowed_1(a: &DropStruct): &DropStruct {
        a
    }

    public fun drop_borrowed_to_borrowed_2(_a: &DropStruct) {}

    public fun abort_fun() {
        abort 1
    }
    public fun vector_arg(_a: vector<u64>) {}
}
