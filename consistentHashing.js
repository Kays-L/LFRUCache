class ConsistentHashing {

    static Node = class {
        constructor(id) {
            this.id = id;
            this.ranges = [];
            this.keyToValMap = {};
        }
    }

    static RangeToNodeMap = class {
        constructor() {
            this.ranges = [];
            this.nodes = [];
        }
    
        getNode(key) {
            let lop = 0, hip = this.ranges.length;
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

        reassignRange(lo, hi, newNodeId) {
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
        }
    }

    static IDManager = class {
        constructor() {
            this.#idToIndexMap = {};
        }

        addId(nodes) {
            this.#idToIndexMap[nodes.length] = nodes.length;
        }

        removeId(rid, r, nodes) {
            const hid = nodes.length - 1;
            if (rid !== nodes.length - 1) {
                const s = this.idToIndexMap[hid];
                this.idToIndexMap[hid] = r;
                this.idToIndexMap[rid] = s;
                nodes[r].id = hid;
                nodes[s].id = rid;
            }
            delete this.idToIndexMap[hid];
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
            last = Math.min(this.keyRange, first + Math.floor(Math.random() * (this.keyRange / (numNodes * numNodes * Math.random()))));
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
    
    #removeNodeHelper(id) {
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
        for (let i = 0; i < n; ++i) {
            const dest = this.#randomNode();
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