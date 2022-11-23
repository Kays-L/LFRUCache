class ConsistentHashing {

    static Node = class {
        constructor(id) {
            this.id = id;
            this.ranges = []; // the ranges of keys this node is responsible for ()
            this.keyToValMap = {}; // every key maps to some piece of data (value)
        }
    }

    static rangeToNodeMap = class {
        constructor() {
            // lo_i < hi_i AND hi_i < lo_i+1 FOR ALL i
            // this.ranges is strictly increasing from initialization of ConsistentHashing, so we can use binary search
            this.ranges = []; // [[lo1, hi1], [lo2, hi2], ...] 
            this.nodes = []; // [7, 3, ...]
            // range [lo1, hi1] is stored in node 7
            // range [lo2, hi2] is stored in node 3
        }
    
        getNode(lo, hi) { // lo, hi parameters represent the lower bound and upper bound for the range we are looking for
            let lop = 0, hip = this.ranges.length;
            while (lop <= hip) {
                const mid = (lop + hip) >> 1;
                if (this.ranges[mid][0] === lo && this.ranges[mid][1] === hi) { // we don't need to check for both, but might as well–can't pick which one I want to use 🤷‍♂️
                    return this.nodes[mid];
                } else if (this.ranges[mid][0] < lo && this.ranges[mid][1] < hi) {
                    lop = mid + 1;
                } else {
                    hip = mid - 1;
                }
            }
            return -1;
        }
    }

    constructor(n) {
        this.ids = {}; // useful for finding which index in this.nodes a node is in constant time. maps nodeId to index in this.nodes. other methods update properly all in constant time
        this.nodes = new Array(n).fill(null).map(() => (new this.Node()));
        for (let i = 0; i < n; ++i) {
            this.nodes[i].id = i + 1;
            this.ids[i + 1] = i;
        }
        let first = 1;
        let last = 1;
        this.numRanges = 0;
        while (last < 1000) {
            const node = this.#randomNode();
            last = Math.min(1000, first + Math.floor(Math.random() * (1000 / (n * n * Math.random())))); // create ranges [first, last] of random size
            node.ranges.push({lo: first, hi: last, keys: {}});
            first = last + 1;
            ++this.numRanges;
        }
        this.nextid = n + 1;
    }
    
    #randomNode() {
        return this.nodes[Math.floor(Math.random() * this.nodes.length)];
    }

    #transferRange(source, dest) {
        dest.ranges.push(source.ranges.splice(Math.floor(Math.random() * source.ranges.length))[0]);
    }

    getNodeForKey(key) {
        for (const node of this.nodes) {
            for (const {lo, hi, keys} of node.ranges) {
                if (key >= lo && key <= hi) {
                    keys[key] = true;
                    return node.id;
                }
            }
        }
        return -1;
    }
    
    #removeNodeHelper(id) {
        const i = this.ids[id];
        delete this.ids[id];
        const remove = this.nodes[i];
        if (i === this.nodes.length - 1) {
            return this.nodes.pop();
        }
        const move = this.nodes.pop();
        this.nodes[i] = move;
        this.ids[move.id] = i;
        --this.nextid;
        return remove;
    }
    
    #deepcopyKeys(keys) {
        const newkeys = {};
        for (const key in keys) {
            newkeys[key] = true;
        }
        return newkeys;
    }
    
    removeNode(id) {
        const node = this.#removeNodeHelper(id);
        let transfer = this.#randomNode();
        for (const range of node.ranges) {
            if (transfer.ranges.find(trange => (trange.lo <= range.lo && trange.hi >= range.hi)) === undefined) {
                transfer.ranges.push(range);
            }
        }
        return transfer.id;
    }
    
    addNode() {
        const newnode = new this.Node(this.nextid);
        this.ids[this.nextid] = this.nodes.length;
        ++this.nextid;
        for (let i = 0; i < Math.floor(this.numRanges / (this.nodes.length + 1)); ++i) {
            const node = this.#randomNode();
            this.#transferRange(node, newnode);
        }
        this.nodes.push(newnode);
        return [newnode.id, this.nodes[0].id];
    }
    
    getKeysInNode(id) {
        const node = this.nodes[this.ids[id]];
        const results = [];
        for (const {lo, hi, keys} of node.ranges) {
            for (const key in keys) {
                results.push(key);
            }
        }
        return results;
    }
}