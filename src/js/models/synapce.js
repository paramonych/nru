var Synapce = (function () {
    function Synapce(neuron, position) {
        this.neuron = neuron;
        this.position = position;
        this.toDefaultState();
        var scene = this.neuron.cortex.scene;
        var scale = this.neuron.cortex.scale;
        this.mesh = new SynapceMesh(scene, scale, position);
        this.setMediator();
        this.deactivate();
    }
    Synapce.prototype.setMediator = function () {
        this.mediator = new Mediator(this);
    };
    Synapce.prototype.activate = function () {
        this.state(StateType.Active);
    };
    Synapce.prototype.deactivate = function () {
        this.state(StateType.Silent);
    };
    Synapce.prototype.toDefaultState = function () {
        var _this = this;
        this.state = ko.observable(StateType.Silent);
        this.state.subscribe(function (state) { return _this.serveState(state); });
    };
    Synapce.prototype.serveState = function (newState) {
        if (isActiveState(newState)) {
            this.mesh.activate();
            this.mediator.activate();
        }
        else {
            this.mesh.deactivate();
            this.mediator.deactivate();
        }
    };
    Synapce.prototype.dispose = function () {
        this.mesh.dispose();
    };
    return Synapce;
})();
