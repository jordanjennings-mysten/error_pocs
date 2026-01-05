/// Module: error_pocs
module error_pocs::error_pocs {

    // use std::vector;

    public fun test_empty() {}

    public fun test_timeout() {
        while (true) {}
    }

    public fun test_abort() {
        abort 1
    }

    public fun test_unsigned_add_overflow() {
        18446744073709551615 + 1;
    }

    public fun test_unsigned_sub_underflow() {
        0 - 1;
    }

    public fun test_div_by_zero() {
        1/0;
    }

    public fun test_unsigned_mul_overflow() {
        4294967296 * 4294967296;
    }

    public fun test_vector_abort() {
        // from an empty vector attept to access index 1 which does not exist
        vector::borrow(&vector::empty<u64>(), 1);
    }

    public fun test_working_recursion(cont: bool) {
        if (cont == true) {
            test_working_recursion(false);
        }
    }

    public fun test_stack_overflow() {
       test_stack_overflow();
    }

    public fun test_single_arg(_my_arg:bool) {

    }


    // for use in pure object as argument test
    public struct Object has key, store {
        id: UID,
        value: u64,
    }
    // for use in pure object as argument test
    public entry fun return_value(obj: Object): u64 {
        let Object { id, value } = obj;
        id.delete();
        value
    }
}
