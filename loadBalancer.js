class Machine {
    constructor(machineId, cap) {
        this.key = machineId;
        this.weight = cap;
        //this.apps = {};
        this.apps = [];
    }
}

class App {
    constructor(appId, machineId, loadUse) {
        this.id = appId;
        this.onMachine = machineId;
        this.loadUse = loadUse;
    }
}

class LoadBalancer {
    constructor() {
        this.machines = new HashedPQ({op: 'max'});
        this.apps = {};
    }
    
    addMachine(machineId, cap) {
        this.machines.insert(new Machine(machineId, cap));
    }
    
    removeMachine(machineId) {
        const removed = this.machines.remove(undefined, machineId);
        for (const app of removed.apps) {
            this.addApplication(app.id, app.loadUse, app);
        }
    }
    
    #pickMachine() {
        let transfer = this.machines.remove();
        const transfers = [transfer];
        while (this.machines.peek() !== null && transfer.weight === this.machines.peek().weight) {
            const t = this.machines.remove();
            if (t.key < transfer.key) {
                transfer = t;
            }
            transfers.push(t);
        }
        for (const t of transfers) {
            if (t !== transfer) {
                this.machines.insert(t);
            }
        }
        return transfer;
    }
    
    addApplication(appId, loadUse, app = undefined) {
        const transfer = this.#pickMachine();
        if (transfer === null) {
            return -1;
        }
        if (loadUse <= transfer.weight) {
            app = app === undefined ? new App(appId, transfer.key, loadUse) : app;
            transfer.apps.push(app);
            transfer.weight -= loadUse;
            this.machines.insert(transfer);
            this.apps[appId] = app;
            return transfer.key;
        } else {
            this.machines.insert(transfer);
            return -1;
        }
    }
    
    stopApplication(appId) {
        if (appId in this.apps) {
            const app = this.apps[appId];
            delete this.apps[appId];
            const machine = this.machines.remove(undefined, app.onMachine);
            machine.apps.splice(machine.apps.indexOf(app), 1);
            machine.weight += app.loadUse;
            this.machines.insert(machine);
        }
    }
    
    getApplications(machineId) {
        return this.machines.get(machineId).apps.map(app => app.id).slice(0, 10);
    }
}