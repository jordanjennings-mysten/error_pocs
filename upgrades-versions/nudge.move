module upgrades::example {
    public struct Event has copy, drop { x: u64 }
    entry fun nudge() {
        sui::event::emit(Event { x: 41 })
    }
}