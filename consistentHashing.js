// This is not the classic implementation of consistentHashing but my version. Only difference is that it introduces more randomness. I prefer this to the other method–more straightforward

class ConsistentHashing {

    static Node = class {
        constructor(id) {
            this.id = id;
            this.ranges = []; // the ranges of keys this node is responsible for ()
            this.keyToValMap = {}; // every key maps to some piece of data (value)
        }
    }

    static RangeToNodeMap = class {
        constructor() {
            // lo_i < hi_i AND hi_i < lo_i+1 FOR ALL i
            // this.ranges is strictly increasing from initialization of ConsistentHashing, so we can use binary search
            this.ranges = []; // [[lo1, hi1], [lo2, hi2], ...] 
            this.nodes = []; // [7, 3, ...]
            // range [lo1, hi1] is stored in node 7
            // range [lo2, hi2] is stored in node 3
        }
    
        getNode(key) {
            let lop = 0, hip = this.ranges.length; // lop, hip = lo pointer, hi pointer for binary search
            while (lop <= hip) {
                const mid = (lop + hip) >> 1;
                if (this.ranges[mid][0] <= key && key <= this.ranges[mid][1]) {
                    return this.nodes[mid];
                } else if (key < this.ranges[mid][0]) {
                    hip = mid - 1;
                } else {
                    lop = mid + 1;
                }
            }
            return -1;
        }

        reassignRange(lo, hi, newNodeId) { // lo, hi parameters represent the lower bound and upper bound for the range we are looking for
            let lop = 0, hip = this.ranges.length;
            while (lop <= hip) {
                const mid = (lop + hip) >> 1;
                if (this.ranges[mid][0] === lo && this.ranges[mid][1] === hi) {
                    this.nodes[mid] = newNodeId;
                    return;
                } else if (this.ranges[mid][0] < lo && this.ranges[mid][1] < hi) {
                    lop = mid + 1;
                } else {
                    hip = mid - 1;
                }
            }
            return -1;
        }
    }

    static IDManager = class { // useful for finding which index in this.nodes a node is in constant time. maps nodeId to index in this.nodes. other methods update properly all in constant time
        constructor() {
            this.#idToIndexMap = {};
        }

        addId(nodes) {
            this.#idToIndexMap[nodes.length] = nodes.length;
        }

        removeId(rid, r, nodes) { // s => stay, r => remove
            const hid = nodes.length - 1;
            if (rid !== nodes.length - 1) { // want to maintain contiguous chunk of actively used ids–just a cool feature. We don't want to remove id 9 to then have ids 1, 2, 3, ... ,8, 10, ... We don't want holes. 
                const s = this.idToIndexMap[hid];
                this.idToIndexMap[hid] = r; // make highest id point to remove node. not useful because we're getting rid of it, but nice for demo purposes
                this.idToIndexMap[rid] = s; // make middle id point to stay node
                nodes[r].id = hid;
                nodes[s].id = rid;
            }
            delete this.idToIndexMap[hid]; // remove the high id
        }
    }

    constructor(numNodes, keyRange) {
        this.keyRange = keyRange;
        this.rangeToNodeMap = new this.RangeToNodeMap();
        this.idManager = new this.IDManager();
        this.nodes = new Array(numNodes).fill(null).map(() => (new this.Node()));
        for (let i = 0; i < numNodes; ++i) {
            this.nodes[i].id = i;
            this.idManager.idToIndexMap[i] = i;
        }
        let first = 1;
        let last = 1;
        this.numRanges = 0;
        while (last < this.keyRange) {
            const node = this.#randomNode();
            last = Math.min(this.keyRange, first + Math.floor(Math.random() * (this.keyRange / (numNodes * numNodes * Math.random())))); // create ranges [first, last] of random size
            node.ranges.push({lo: first, hi: last, keys: {}});
            first = last + 1;
            this.rangeToNodeMap.ranges.push([lo, hi]);
            this.rangeToNodeMap.nodes.push(node.id);
            ++this.numRanges;
        }
    }
    
    #randomNode() {
        return this.nodes[Math.floor(Math.random() * this.nodes.length)];
    }

    #transferRange(source, dest) {
        const rangeIndex = Math.floor(Math.random() * source.ranges.length);
        const range = source.ranges.splice(rangeIndex, 1)[0];
        dest.ranges.push(range);
        this.rangeToNodeMap.reassignRange(range.lo, range.hi, dest.id);
    }

    getValueForKey(key) {
        const id = this.rangeToNodeMap.getNode(key);
        if (id === -1) return -1
        const data = this.nodes[this.idManager.idToIndexMap[id]].keyToValueMap(key);
        return !data ? -1 : data;
    }
    
    #removeNodeHelper(id) { // constant time complexity! Cool use of various data structures to achieve
        const i = this.idManager.idToIndexMap[id];
        const remove = this.nodes[i];
        this.idManager.removeId(id, i, this.nodes);
        if (i === this.nodes.length - 1) {
            return this.nodes.pop();
        }
        const move = this.nodes.pop();
        this.nodes[i] = move;
        return remove;
    }
    
    removeNode(id) {
        const node = this.#removeNodeHelper(id);
        const n = node.ranges.length;
        for (let i = 0; i < n; ++i) { // transfer all n ranges to other nodes. randomly select the destination node
            let dest = this.#randomNode();
            this.#transferRange(node, dest);
        }
    }
    
    addNode() {
        const newnode = new this.Node(this.nodes.length);
        this.idManager.addNode(nodes.length);
        this.nodes.push(newnode);
        for (let i = 0; i < Math.floor(this.numRanges / (this.nodes.length + 1)); ++i) {
            const node = this.#randomNode();
            this.#transferRange(node, newnode);
        }
    }
}