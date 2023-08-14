const A4 = 440;
const noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

class Note {
  constructor(octave, name, cents, frequency, midiNumber, rawDistance) {
    this.octave = octave;
    this.name = name;
    this.cents = cents;
    this.frequency = frequency;
    this.midiNumber = midiNumber;
    this.rawDistance = rawDistance;
  }
  static fromPitch(frequency) {
    if (!isFinite(frequency)) {
      throw new Error(`Invalid frequency: ${frequency}`);
    }
    // distance from A4 (reference note), http://newt.phys.unsw.edu.au/jw/notes.html
    const distanceOctaves = Math.log2(frequency / A4);
    let distanceSemitones = 12 * distanceOctaves;
    let distanceSemitonesNearest = Math.round(distanceSemitones);
    let distanceFromNearest = distanceSemitones - distanceSemitonesNearest;
    let distanceCents = Math.round(distanceFromNearest * 100);

    const midiNumber = 69 + distanceSemitonesNearest;
    // Math.floor does wrong thing for negative numbers
    const octave = Math.trunc(midiNumber / 12) - 1;
    const noteIdx = midiNumber % 12;
    const note = noteNames[noteIdx];

    return new Note(octave, note, distanceCents, frequency, midiNumber, distanceSemitones);
  }
  static fromDistance(semitones) {
    const f_n = Math.pow(2, semitones / 12) * A4;
    return Note.fromPitch(f_n);
  }
  static fromName(name, octave) {
    const noteIdx = noteNames.indexOf(name);
    if (noteIdx === -1) {
      throw new Error(`Invalid note name: ${name}`);
    }
    const midiNumber = 12 * (octave + 1) + noteIdx;
    const semitones = midiNumber - 69;
    return Note.fromDistance(semitones);
  }
  get fullName() {
    return `${this.name}${this.octave}`;
  }
  pitchRange(tolerance = 0.3) {
    const f_min = Note.fromDistance(this.rawDistance - tolerance).frequency;
    const f_max = Note.fromDistance(this.rawDistance + tolerance).frequency;

    return [f_min, f_max];
  }
}


function* noteRange(from, to) {
    let noteIdx = noteNames.indexOf(from.name);
    if (from.frequency > to.frequency) {
        throw new Error(`Invalid range: ${from.fullName} is higher than ${to.fullName}`);
    }
    for (let o = from.octave; o < to.octave; o++) {
        for (let n = noteIdx; n < noteNames.length; n++) {
            yield Note.fromName(noteNames[n], o);
        }
        noteIdx = 0;
    }
    for (let n = noteIdx; n <= noteNames.indexOf(to.name); n++) {
        yield Note.fromName(noteNames[n], to.octave);
    }
}

// console.log([...noteRange(Note.fromName('C', 2), Note.fromName('C', 7))]);
