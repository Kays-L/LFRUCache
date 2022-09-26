class Node {
    constructor(id) {
        this.id = id;
        this.ranges = [];
    }
}

class ConsistentHashing {
    constructor(n) {
        this.ids = {};
        this.nodes = new Array(n).fill(null).map(() => (new Node()));
        for (let i = 0; i < n; ++i) {
            this.nodes[i].id = i + 1;
            this.ids[i + 1] = i;
        }
        let first = 1;
        let last = 1;
        this.ranges = 0;
        while (last < 1000) {
            const node = this.#randomNode();
            last = Math.min(1000, first + Math.floor(Math.random() * (1000 / (n * n * Math.random()))));
            node.ranges.push({lo: first, hi: last, keys: {}});
            first = last + 1;
            ++this.ranges;
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
        const newnode = new Node(this.nextid);
        this.ids[this.nextid] = this.nodes.length;
        ++this.nextid;
        for (let i = 0; i < Math.floor(this.ranges / (this.nodes.length + 1)); ++i) {
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