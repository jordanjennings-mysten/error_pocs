#!/bin/bash
#/Users/jordanjennings/code/sui/target/debug/sui \
#    client transfer --to 0xccb8a90ff6ede2012b865873213eb56e6ac5f226a436a7e89965ef94e42fbbca --object-id 0xf09ada49290a78d4a8f54a0329bd47a1280b9b5ed49047f0799a413bb94c39ff
#!/bin/bash
/Users/jordanjennings/code/sui/target/debug/sui \
    client ptb  \
    --split-coins @0xe2d1b8cc43bb4b899c2ba8b598d9ce8443786e88f72c12542faf551ed70d4073 [1000000000000000000] \
    --assign new_coins \
    --transfer-objects [new_coins.0] @0xccb8a90ff6ede2012b865873213eb56e6ac5f226a436a7e89965ef94e42fbbca
