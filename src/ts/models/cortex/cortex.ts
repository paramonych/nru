class Cortex implements Disposable {
  private neurons: Neuron[];
  private dormantSignalNeurons: Neuron[];
  private blastsArray: NeuroBlast[];
  public blasts: Map<NeuroBlast>;

  constructor(
    public scene: BABYLON.Scene,
    public scale: number,
    public lifetime: number,
    public cortexState: CortexConfiguration,
    private spaceCallback: (blastsAmount: number, density ?: number) => void) {
    this.createNeurons();

    if(isLowResolution(cortexState.resolution)) {
      this.spaceCallback(null, this.checkSynapcesAmountInBox());
      this.preprocessLowBlasts();
    }
  }

  private preprocessLowBlasts(): void {
    let mediumSynapces = this.collectMediumSynapces();
    let progenySynapces = this.collectProgenySynapces();
    this.blasts = newMap<NeuroBlast>();
    this.blastsArray = new Array<NeuroBlast>();

    mediumSynapces.forEach((synapce) => {
      let filteredSynapces = _.filter(mediumSynapces, function(nextSynapce) {
        return synapce.neuron.id !== nextSynapce.neuron.id;
      });
      let newBlast = new NeuroBlast(synapce, this.cortexState.blastRadius, filteredSynapces, this.scene, this.cortexState.blastPower);
      if(newBlast.isExists) {
        this.blastsArray.push(newBlast);
      } else {
        newBlast = null;
      }
    });
    this.resolveSignalInheritanse();
    this.spaceCallback(this.blastsArray.length);
  }

  private preprocessHighBlasts(): void {
    //TODO: develip new compute model
  }

  private resolveSignalInheritanse(): void {

    for(let i=0; i< this.blastsArray.length; i++) {
      let nextBlast = this.blastsArray[i];
      for(let n=0; n< this.neurons.length; n++) {
        let isLegatee = false;
        let nextNeuron = this.neurons[n];
        if(!isMedium(nextNeuron.type)) {
          for(let s=0; s< nextNeuron.synapces.length; s++) {
            isLegatee = nextBlast.checkIntersection(nextNeuron.synapces[s]);
            if(isLegatee) {
              break;
            }
          }
          if(isLegatee) {
            nextNeuron.mesh.setLegatee(true);
            nextNeuron.mesh.select();
            break;
          }
        }
      }
    };
  }

  private collectMediumSynapces(): Synapce[] {
    var allSynapces = new Array<Synapce>();

    this.neurons.forEach((neuron) => {
      if(isMedium(neuron.type)) {
        appendAll(allSynapces, neuron.synapces);
      }
    });

    return allSynapces;
  }

  private collectProgenySynapces(): Synapce[] {
    var allSynapces = new Array<Synapce>();

    this.neurons.forEach((neuron) => {
      if(!isMedium(neuron.type)) {
        appendAll(allSynapces, neuron.synapces);
      }
    });

    return allSynapces;
  }

  private checkSynapcesAmountInBox(): number {
    let amount = 0;
    let checkBounds = (val: number): boolean => {
      let bound = cortexState.scale/1.25;
      return (val < bound) && (val > -bound);
    }

    this.neurons.forEach((neuron) => {
      neuron.synapces.forEach((synapce) => {
        let pos = synapce.mesh.position;
        if(checkBounds(pos.x) && checkBounds(pos.y) && checkBounds(pos.z)) {
          amount++;
        }
      });
    });

    return amount;
  }

  private createNeurons(): void {
    this.neurons = new Array<Neuron>();

    for(let i=0; i< this.cortexState.dendritsAmount; i++) {
      this.neurons.push(new Neuron(this, NeuronType.Progeny));
    }

    let halfScale = this.cortexState.scale/2;
    let waveStartingPoint = new BABYLON.Vector3(halfScale,halfScale,halfScale);
    this.revealDormantSignalNeurons(waveStartingPoint);
  }

  private revealDormantSignalNeurons(basePosition: BABYLON.Vector3): void {
    this.dormantSignalNeurons = new Array<Neuron>();

    _.each(this.neurons, (n) => {
      if(checkDistanceFromPointToPoint(n.mesh.center, basePosition, SCALE_THRESHOLD)) {

        this.dormantSignalNeurons.push(n);
      }
    });
  }

  public initSignal(wavePower: number): void {
    this.dropSignal();

    for(let i=0; i< wavePower; i++) {
      let progenyNeurons = _.filter(this.dormantSignalNeurons, (neuron) => {
        return !isMedium(neuron.type);
      });
      if(progenyNeurons.length > 0) {
        let index = Math.floor((progenyNeurons.length-1)*random());
        progenyNeurons[index].includeInSignal();
      } else {
        break;
      }
    }
    if(isLowResolution(cortexState.resolution)) {
      this.preprocessLowBlasts();
    }
  }

  public resetSynapces(): void {
    this.neurons.forEach((neuron) => {
      neuron.resetSynapces();
    });
  }

  public dropSpikes(): void {
    this.neurons.forEach((neuron) => {
      neuron.dropToInitialState(neuron.type);
    });
  }

  private dropSignal(): void {
    this.disposeBlasts();
    this.neurons.forEach((neuron) => {
      neuron.dropToInitialState(NeuronType.Progeny);
    });
  }

  public computeBlasts(): void {
    if(isLowResolution(cortexState.resolution)) {
      this.preprocessLowBlasts();
    } else {
      this.preprocessHighBlasts();
    }
  }

  public chargeTense(time: Time): void {
    _.each(this.neurons, (n) => {
      time.tense.add(() => n.play(), 0);
    });
  }

  public freezeTense(time: Time): void {
    _.each(this.neurons, (n) => {
      n.pause(time.tense.progress()*time.duration);
    });
  }

  public resumeTense(time: Time): void {
    _.each(this.neurons, (n) => {
      n.resume();
    });
  }

  public restartTense(time: Time): void {
    _.each(this.neurons, (n) => {
      n.restartTense();
    });
  }

  public shiftTense(time: Time, progress: number): void {
    _.each(this.neurons, (n) => {
      n.progress(progress);
    });
  }

  public keepSelected(keepSelected: boolean): void {
    _.each(this.neurons, (n) => {
      if(keepSelected && !n.mesh.isHighlighted) {
        n.hide();
      }
      if(!keepSelected && !n.mesh.isHighlighted) {
        n.show();
      }
    });
  }

  public dispose(): void {
    this.disposeBlasts();

    _.each(this.neurons, (neuron) => {
      neuron.dispose();
    });

    this.neurons = null;
    this.scene = null;
    this.cortexState = null;
    this.spaceCallback = null;
  }

  public disposeBlasts(): void {
    this.disposeMediators();

    if(this.blastsArray) {
      for(let i=0; i< this.blastsArray.length; i++) {
        this.blastsArray[i].dispose();
      }
      this.blasts = null;
      this.blastsArray = null;
    }
  }

  private disposeMediators(): void {
    _.each(this.neurons, (neuron) => {neuron.disposeMediators();});
  }
}
