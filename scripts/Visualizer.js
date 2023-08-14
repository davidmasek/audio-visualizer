class Visualizer {
  constructor(canvas) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext("2d");

    this.WIDTH = canvas.width;
    this.HEIGHT = canvas.height;
  
    this.canvasCtx.clearRect(0, 0, this.WIDTH, this.HEIGHT);
  
    this.MIN_DISPLAY_FREQ = Math.log2(50);
    this.MAX_DISPLAY_FREQ = Math.log2(3000);

    this.drawRealInput = true;
    this.drawNotes = false;
    this.labelAllNotes = false;
  }

  // convert from canvas space to frequency
  xToHz(x) {
    return 2 ** ((x / this.WIDTH) * (this.MAX_DISPLAY_FREQ - this.MIN_DISPLAY_FREQ) + this.MIN_DISPLAY_FREQ);
  }

  // convert from frequency to canvas space
  hzToX(hz) {
    return (Math.log2(hz) - this.MIN_DISPLAY_FREQ) / (this.MAX_DISPLAY_FREQ - this.MIN_DISPLAY_FREQ) * this.WIDTH;
  }

  draw(results, binSize) {
    const dataArrayAlt = results['inputData'];
    const bufferLength = dataArrayAlt.length;

    const canvasCtx = this.canvasCtx;
    canvasCtx.fillStyle = "rgb(0, 0, 0)";
    canvasCtx.fillRect(0, 0, this.WIDTH, this.HEIGHT);
    
    // leave some space at the bottom for note names
    const HIST_HEIGHT = this.HEIGHT - 30;

    // draw real input
    if (this.drawRealInput) {
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArrayAlt[i] / 255 * HIST_HEIGHT;
        
        const hzStart = (i) * binSize;
        const hzEnd = (i + 1) * binSize;
        const xStart = this.hzToX(hzStart);
        const xEnd = this.hzToX(hzEnd);
        const barWidth = xEnd - xStart;
        
        canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
        canvasCtx.fillRect(
          xStart + 1,
          HIST_HEIGHT - barHeight,
          barWidth - 1,
          barHeight
        );
      }
    }
    
    const NOTE_LINE_H = 2;
    let dy = 0;
    for (let i = 0; i < results['notes'].length; i++) {
      const note = results['notes'][i];
      const noteEnergy = results['notesEnergy'][i];
      const noteEnergyScaled = noteEnergy / 255 * HIST_HEIGHT;

      const [f_min, f_max] = note.pitchRange();
      
      // render note range as line
      const x_min = this.hzToX(f_min);
      const x_max = this.hzToX(f_max);
      canvasCtx.fillStyle = `rgb(255,255,255)`;
      canvasCtx.fillRect(
        x_min, 
        HIST_HEIGHT - noteEnergyScaled - NOTE_LINE_H, 
        x_max - x_min, 
        NOTE_LINE_H);

      // draw note energy as bar
      if (this.drawNotes) {
        canvasCtx.fillStyle = `rgb(${noteEnergy + 100},50,50)`;
        canvasCtx.fillRect(
          x_min, 
          HIST_HEIGHT - noteEnergyScaled, 
          x_max - x_min, 
          noteEnergyScaled);
      }


      // label notes above threshold
      if (noteEnergy > 0.9 * results['maxEnergy'] && noteEnergy > 10) {
        // canvasCtx.fillStyle = "rgb(255, 255, 255)";
        canvasCtx.fillStyle = `rgb(50,${noteEnergy + 100},50)`;
        canvasCtx.font = "25px sans-serif";
        canvasCtx.textBaseline = "bottom";
        canvasCtx.textAlign = "center";
        canvasCtx.fillText(
          note.name, 
          x_min + (x_max - x_min) / 2, 
          HIST_HEIGHT - noteEnergyScaled - 5
        );
      }

      // label all notes
      if (this.labelAllNotes) {
        canvasCtx.fillStyle = "rgb(255, 255, 255)";
        canvasCtx.font = "10px sans-serif";
        canvasCtx.textAlign = "center";
        canvasCtx.textBaseline = "bottom";
        canvasCtx.fillText(
          note.fullName, 
          x_min + (x_max - x_min) / 2, 
          HIST_HEIGHT - NOTE_LINE_H - 5 + dy);
          dy -= 15;
          dy %= 45;
        }
    }

    // [min, max] range of frequencies to display
    canvasCtx.fillStyle = "rgb(255, 255, 255)";
    canvasCtx.font = "20px sans-serif";
    canvasCtx.textBaseline = "top";
    canvasCtx.textAlign = "left";
    canvasCtx.fillText(`${Math.round(this.xToHz(0))} Hz`, 5, 5);
    canvasCtx.textAlign = "right";
    canvasCtx.fillText(`${Math.round(this.xToHz(this.WIDTH))} Hz`, this.WIDTH - 5, 5);
    
    // reference note names
    canvasCtx.textAlign = "center";
    canvasCtx.textBaseline = "bottom";
    canvasCtx.fillText("A4", this.hzToX(440), this.HEIGHT - 5);
    canvasCtx.fillText("C2", this.hzToX(65), this.HEIGHT - 5);
    canvasCtx.fillText("C3", this.hzToX(131), this.HEIGHT - 5);
    canvasCtx.fillText("C4", this.hzToX(262), this.HEIGHT - 5);
    canvasCtx.fillText("C5", this.hzToX(523), this.HEIGHT - 5);
    canvasCtx.fillText("C6", this.hzToX(1047), this.HEIGHT - 5);
    canvasCtx.fillText("C7", this.hzToX(2093), this.HEIGHT - 5);
  }
}

