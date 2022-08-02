import Deque from '../deque/deque.js';
import HashedPQ from '../heaps/hashedpq.js';

class LFRUCacheD {
    constructor(cap) {
        this.cap = cap;
        this.map = new Map();
        this.cache = new Map();
        this.cache.set(1, new Deque());
        this.lowest = 0; // keeps track of lowest freq category
    }
    
    #nodeWrapper(key, value, freq) {
        return {key, value, freq};
    }
             
    #updateNode(node) {
        const freq = node.val.freq;
        this.cache.get(freq).remove(node);
        if (this.cache.has(freq + 1)) {
            this.cache.get(freq + 1).prepend(node);
        } else {
            const deque = new Deque();
            deque.prepend(node);
            this.cache.set(freq + 1, deque);
        }
        if (this.lowest === freq && this.cache.get(freq).size() === 0) {
            this.lowest = freq + 1;
        }
        node.val.freq = freq + 1;
    }
             
    #newNode(key, value) {
        const node = new Node(this.#nodeWrapper(key, value, 1));
        this.map.set(key, node);
        this.cache.get(1).prepend(node);
        this.lowest = 1;
    }
    
    get(key) {
        if (!this.map.has(key)) {
            return -1;
        }
        const node = this.map.get(key);
        const value = node.val.value;
        this.#updateNode(node);
        return value;
    }
    
    put(key, value) {
        if (this.cap === 0) {
            return;
        }
        if (this.map.has(key)) {
            const node = this.map.get(key);
            node.val.value = value;
            this.#updateNode(node);
        } else {
            if (this.map.size < this.cap) {
                this.#newNode(key, value);
            } else {
                this.map.delete(this.cache.get(this.lowest).pop().val.key);
                this.#newNode(key, value);
            }
        }
    }
}


// PQ
class LFRUCachePQ {
    constructor(cap) {
        this.cap = cap;
        this.cache = new HashedPQ({});
        this.pqWrapper = (key, value, weight) => ({key, value, weight});
    }
    
    get(key) {
        if (this.cache.has(key)) {
            const obj = this.cache.remove(undefined, key);
            this.cache.insert(this.pqWrapper(key, obj.value, obj.weight + 1));
        }
        return obj === undefined ? -1 : obj.value;
    }
    
    put(key, value) {
        if (this.cap === 0) {
            return;
        }
        if (this.cache.has(key)) {
            const obj = this.cache.remove(undefined, key);
            this.cache.insert(this.pqWrapper(key, value, obj.weight + 1));
        } else if (this.cache.size() === this.cap) {
            this.cache.remove();
            this.cache.insert(this.pqWrapper(key, value, 1));
        } else {
            this.cache.insert(this.pqWrapper(key, value, 1));
        }
    }
}