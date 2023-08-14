// base from https://github.com/mdn/webaudio-examples/blob/main/voice-change-o-matic/scripts/app.js
const heading = document.querySelector("h1");
const originalHeaderText = heading.textContent;
heading.textContent = "CLICK HERE TO START";
// document.body.addEventListener("click", init);
document.addEventListener("DOMContentLoaded", init);


const log = (text) => {
  const el = document.createElement('p');
  el.textContent = text;
  document.querySelector('#meta').appendChild(el);
}


function processData(dataArray, binSize) {
  results = {}
  results['inputData'] = dataArray;
  /** most active input bin */ 
  let maxEnergy = dataArray[0];
  let maxIdx = 0;

  for (let i = 0; i < dataArray.length; i++) {
    const energy = dataArray[i];
    if (energy > maxEnergy) {
      maxEnergy = energy;
      maxIdx = i;
    }
  }

  const hzStart = (maxIdx) * binSize;
  const hzEnd = (maxIdx + 1) * binSize;
  const hz = (hzStart + hzEnd) / 2;
  results['binNote'] = Note.fromPitch(hz);
  results['binNoteIdx'] = maxIdx;

  /** correspondence to notes */
  const notes = [...noteRange(Note.fromName("C", 2), Note.fromName("C", 7))];
  const notesEnergy = [];
  let maxNoteIdx = 0;
  for (let j = 0; j < notes.length; j++) {
    const note = notes[j];
    const [f_min, f_max] = note.pitchRange();
    let noteEnergy = 0;
    // could be more effective than going through all bins
    for (let i = 0; i < dataArray.length; i++) {
      const energy = dataArray[i];
      const hzStart = (i) * binSize;
      const hzEnd = (i + 1) * binSize;
      if (hzStart <= f_max && hzEnd >= f_min) {
        // using MAX as aggregate function
        noteEnergy = Math.max(noteEnergy, energy);
        if (i == maxIdx) {
          maxNoteIdx = j;
        }
      }
    }  
    notesEnergy.push(noteEnergy);
  }
  results['notes'] = notes;
  results['notesEnergy'] = notesEnergy;
  results['maxNoteIdx'] = maxNoteIdx;
  results['maxEnergy'] = maxEnergy;
  
  return results;
}


function init() {
  console.log('Initializing...');
  heading.textContent = originalHeaderText;
  document.body.removeEventListener("click", init);

  /** Initialize audio */
  // Set up forked web audio context, for multiple browsers
  // window. is needed otherwise Safari explodes
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  
  /** Audio engine */

  // Set up the different audio nodes we will use for the app
  const analyser = new AnalyserNode(audioCtx, {
    fftSize: 2 ** 13,
    maxDecibels: -10,
    minDecibels: -80,
    smoothingTimeConstant: 0.9,
  });
  const sampleRate = audioCtx.sampleRate;
  log(`maxDecibels: ${analyser.maxDecibels}`);
  log(`minDecibels: ${analyser.minDecibels}`);
  
  let bufferLength = analyser.frequencyBinCount;
  // https://medium.com/giant-scam/algorithmic-beat-mapping-in-unity-real-time-audio-analysis-using-the-unity-api-6e9595823ce4
  const fftMaxFreq = sampleRate / 2;
  let binSize = fftMaxFreq / bufferLength;
  
  log(`Sample rate: ${sampleRate}`);
  document.querySelector("#frequencyBinCountValue").textContent = bufferLength;
  document.querySelector("#binSizeValue").textContent = binSize;

  // use Float32Array() for higher accuracy (not needed here)
  let dataArrayAlt = new Uint8Array(bufferLength);

  
  /** Canvas visualizer */
  const canvas = document.querySelector(".visualizer");
  const vis = new Visualizer(canvas, binSize);
  window.vis = vis;
  window.dataArrayAlt = dataArrayAlt;
  const update = () => {
    analyser.getByteFrequencyData(dataArrayAlt);
    const results = processData(dataArrayAlt, binSize);
    vis.draw(results, binSize);
    const _drawVisual = requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
  
  /** Connect audio file -> analyser */

  const audio = document.querySelector('audio');
  audio.onplay = () => audioCtx.resume();
  const source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);

  /** Play btn */
  const playBtn = document.querySelector("#play_note");
  playBtn.addEventListener("click", () => {
    const isPlaying = playBtn.getAttribute('data-playing') !== 'false';
    if (isPlaying) {
      playBtn.setAttribute('data-playing', 'false');
      playBtn.classList.remove("playing");
      playBtn.classList.add("paused");
      audio.pause();
    } else {
      playBtn.setAttribute('data-playing', 'true');
      playBtn.classList.remove("paused");
      playBtn.classList.add("playing");
      audio.play();
    }
  });
 
  /** Mute button */
  
  const mute = document.querySelector("#mute");
  const isMuted = () => mute.getAttribute("data-muted") !== 'false';
  
  const doMute = () => analyser.disconnect();
  const doPlay = () => analyser.connect(audioCtx.destination);

  mute.addEventListener("click", function () {
    if (isMuted()) {
      mute.setAttribute("data-muted", "false");
      mute.classList.remove("muted");
      mute.classList.add("playing");

      doPlay();
    } else {
      mute.setAttribute("data-muted", "true");
      mute.classList.add("muted");
      mute.classList.remove("playing");

      doMute();
    }
  });
    
  if (isMuted()) {
    doMute();
  } else {
    doPlay();
  }

  /** Record button */
  
  const record = document.querySelector("#record");
  const isRecording = () => record.getAttribute("data-recording") !== 'false';
  let src;
  const startRecordingHelper = () => {
    startRecording(audioCtx, analyser).then((s) => {
      src = s;
      if (src) {
        record.setAttribute("data-recording", "true");
        record.classList.add("recording");
        record.classList.remove("muted");
        record.classList.remove("error");
      } else {
        record.classList.add("error");
      }
    });
  }

  record.addEventListener("click", function () {
    if (isRecording()) {
      record.setAttribute("data-recording", "false");
      record.classList.remove("recording");
      record.classList.add("muted");
        // record.textContent = "Record";

      if (src) {
        src.disconnect();
      }
    } else {      
      startRecordingHelper();
    }
  });

  if (isRecording()) {
    startRecordingHelper();
  }

  /** Settings */
  const settingsBtn = document.querySelector("#settings");
  settingsBtn.addEventListener("click", () => {
      document.querySelector("#meta").classList.toggle("hidden");
    }
  );
  document.querySelector("#drawRealInput").checked = vis.drawRealInput;
  document.querySelector("#drawRealInput").addEventListener("change", (e) => {
    vis.drawRealInput = e.target.checked;
  });
  document.querySelector("#drawNotes").checked = vis.drawNotes;
  document.querySelector("#drawNotes").addEventListener("change", (e) => {
    vis.drawNotes = e.target.checked;
  });
  document.querySelector("#fftSize").value = Math.log2(analyser.fftSize);
  document.querySelector("#fftSize").addEventListener("change", (e) => {
    analyser.fftSize = 2 ** e.target.value;
    bufferLength = analyser.frequencyBinCount
    binSize = fftMaxFreq / bufferLength;
    dataArrayAlt = new Uint8Array(bufferLength);
    document.querySelector("#frequencyBinCountValue").textContent = bufferLength;
    document.querySelector("#binSizeValue").textContent = binSize;
  });
  document.querySelector("#smoothingTimeConstant").value = analyser.smoothingTimeConstant;
  document.querySelector("#smoothingTimeConstant").addEventListener("change", (e) => {
    analyser.smoothingTimeConstant = e.target.value;
  });
}
