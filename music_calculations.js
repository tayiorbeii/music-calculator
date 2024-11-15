class MusicCalculator {
    constructor() {
        this.decimalPlaces = 3;
        this.noteNames = ["C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab", "A", "A#/Bb", "B"];
        this.noteTypes = ["Normal", "Dotted", "Triplets"];
        this.octaves = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        this.semitones = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        this.octaveQBWConst = 1;
        this.semitoneQBWConst = 0.08333333333333333;
    }

    // Core conversion functions
    bpmToHz(bpm) {
        return bpm / 60;
    }

    hzToBpm(hz) {
        return 60 * hz;
    }

    noteToHz(note, octave) {
        return this.semitoneShift(440, parseFloat(note) + parseFloat(12 * octave));
    }

    // BPM related calculations
    convertBpm(bpm) {
        const hz = this.bpmToHz(bpm);
        const khz = hz / 1000;
        const sec = 1 / hz;
        const ms = 1000 * sec;
        const bpmNote = this.bpmToMidiNote(bpm);

        return {
            hz: hz.toFixed(this.decimalPlaces),
            khz: khz.toFixed(this.decimalPlaces),
            ms: ms.toFixed(this.decimalPlaces),
            sec: sec.toFixed(this.decimalPlaces),
            note: bpmNote.noteName,
            octave: bpmNote.octave,
            cents: bpmNote.cents.toFixed(this.decimalPlaces)
        };
    }

    calculateDelayTiming(bpm, beatsPerBar, noteType) {
        const beatsPerSec = parseFloat(60 / bpm);
        const barsLength = parseFloat(4 * beatsPerSec);
        let result = parseFloat(barsLength / (1 * beatsPerBar));

        switch (noteType) {
            case "Dotted":
                result += result / 2;
                break;
            case "Triplets":
                result -= result / 3;
                break;
        }

        const ms = 1000 * result;
        const hz = 1 / ms * 1000;
        const delayBpm = this.hzToBpm(hz);
        const midiNoteInfo = this.bpmToMidiNote(delayBpm);

        return {
            hz: hz.toFixed(this.decimalPlaces),
            khz: (hz / 1000).toFixed(this.decimalPlaces),
            ms: ms.toFixed(this.decimalPlaces),
            sec: result.toFixed(this.decimalPlaces),
            note: midiNoteInfo.noteName,
            octave: midiNoteInfo.octave,
            cents: midiNoteInfo.cents.toFixed(this.decimalPlaces)
        };
    }

    calculateTimeStretch(bpmA, bpmB) {
        const ratio = 100 / (bpmB / bpmA);
        const percentDiff = 100 / (bpmA / (bpmB - bpmA));

        return {
            ratio: ratio.toFixed(this.decimalPlaces),
            percentChange: percentDiff.toFixed(this.decimalPlaces)
        };
    }

    transposeBpmByPercentage(bpm, percentage) {
        const newBpm = bpm + bpm * (parseFloat(percentage) / 100);
        const semitones = this.semitoneDiff(bpm, newBpm);
        const midiNoteInfo = this.bpmToMidiNote(newBpm);

        return {
            bpm: newBpm.toFixed(this.decimalPlaces),
            semitones: semitones.toFixed(this.decimalPlaces),
            note: midiNoteInfo.noteName,
            octave: midiNoteInfo.octave,
            cents: midiNoteInfo.cents.toFixed(this.decimalPlaces)
        };
    }

    transposeBpmBySemitones(bpm, semitones) {
        const newBpm = this.semitoneShift(bpm, semitones);
        const percentDiff = 100 / (bpm / (newBpm - bpm));
        const midiNoteInfo = this.bpmToMidiNote(newBpm);

        return {
            bpm: newBpm.toFixed(this.decimalPlaces),
            percentChange: percentDiff.toFixed(this.decimalPlaces),
            note: midiNoteInfo.noteName,
            octave: midiNoteInfo.octave,
            cents: midiNoteInfo.cents.toFixed(this.decimalPlaces)
        };
    }

    // Helper functions
    bpmToMidiNote(bpm) {
        const hz = this.bpmToHz(bpm);
        const powerDiff = Math.log(hz / 440) / Math.log(2);
        const noteValue = 189 + 12 * powerDiff;
        const noteIndex = Math.round(noteValue);

        return {
            octave: Math.round(powerDiff) + 4,
            noteName: this.noteNames[Math.abs(noteIndex) % 12],
            cents: 100 * (noteValue - noteIndex)
        };
    }

    semitoneShift(value, amount) {
        return value * Math.pow(2, amount / 12);
    }

    semitoneDiff(valueA, valueB) {
        return 12 * Math.log2(valueB / valueA);
    }

    // Quality Factor calculations
    octaveBWtoQ(octaveValue) {
        return Math.sqrt(Math.pow(2, octaveValue)) / (Math.pow(2, octaveValue) - 1);
    }

    qToOctaveBW(qualityFactor) {
        const matrix1 = (qualityFactor * qualityFactor * 2 + 1) / (qualityFactor * qualityFactor * 2);
        const matrix2 = Math.pow(matrix1, 2);
        const matrix4 = matrix1 + Math.sqrt(matrix2 - 1);
        return Math.log(matrix4) / Math.log(2);
    }

    // Delay calculator
    calculateDelay(bpm, division) {
        if (!bpm || !division) return { rate: 0 };
        const beatMs = (60000 / bpm); // ms per beat
        const delayMs = beatMs * 4 * division; // multiply by 4 to convert from quarter notes
        return {
            rate: delayMs.toFixed(2)
        };
    }

    // Time to BPM converter
    timeToBpm(lengthSecs, beats) {
        const bpm = (beats / lengthSecs) * 60;
        const hz = this.bpmToHz(bpm);
        const ms = (lengthSecs * 1000) / beats;
        
        return {
            bpm: bpm.toFixed(this.decimalPlaces),
            hz: hz.toFixed(this.decimalPlaces),
            msPerBeat: ms.toFixed(this.decimalPlaces)
        };
    }

    // BPM to Time converter
    bpmToTime(bpm, beats) {
        const lengthSecs = (beats / bpm) * 60;
        const ms = lengthSecs * 1000;
        const hz = this.bpmToHz(bpm);
        
        return {
            lengthSecs: lengthSecs.toFixed(this.decimalPlaces),
            ms: ms.toFixed(this.decimalPlaces),
            hz: hz.toFixed(this.decimalPlaces)
        };
    }

    // LFO rate calculator
    calculateLfoRate(bpm, divisionBeats) {
        const beatsPerSecond = bpm / 60;
        const hz = beatsPerSecond / divisionBeats;
        const ms = 1000 / hz;
        const period = 1 / hz;
        
        return {
            rateHz: hz.toFixed(this.decimalPlaces),
            periodSecs: period.toFixed(this.decimalPlaces),
            ms: ms.toFixed(this.decimalPlaces),
            bpm: this.hzToBpm(hz).toFixed(this.decimalPlaces)
        };
    }

    // Find closest division
    findClosestDivision(bpm, rateHz) {
        const beatsPerSecond = bpm / 60;
        const division = beatsPerSecond / rateHz;
        const closestDivision = Math.round(division);
        const actualHz = beatsPerSecond / closestDivision;
        const error = Math.abs(rateHz - actualHz);
        
        return {
            divisionBeats: closestDivision,
            actualHz: actualHz.toFixed(this.decimalPlaces),
            errorHz: error.toFixed(this.decimalPlaces),
            errorPercent: ((error / rateHz) * 100).toFixed(this.decimalPlaces)
        };
    }

    // Note to frequency converter
    noteToFrequency(noteName, octave = 4) {
        // First, standardize the note name format
        noteName = noteName.toUpperCase().replace('♯', '#').replace('♭', 'B');
        
        // Define semitone offsets from A4 (A4 = 440Hz)
        const noteOffsets = {
            'C': -9,
            'C#': -8, 'DB': -8,
            'D': -7,
            'D#': -6, 'EB': -6,
            'E': -5,
            'F': -4,
            'F#': -3, 'GB': -3,
            'G': -2,
            'G#': -1, 'AB': -1,
            'A': 0,
            'A#': 1, 'BB': 1,
            'B': 2
        };

        // Find the note's offset
        let offset = noteOffsets[noteName];
        if (offset === undefined) return null;

        // Calculate total semitones from A4 (440Hz)
        const semitonesFromA4 = offset + (octave - 4) * 12;
        
        // Calculate frequency using the formula: f = 440 * 2^(n/12)
        // where n is the number of semitones from A4
        const frequency = 440 * Math.pow(2, semitonesFromA4 / 12);
        const period = 1 / frequency;
        
        return {
            frequencyHz: frequency.toFixed(this.decimalPlaces),
            periodMs: (period * 1000).toFixed(this.decimalPlaces),
            periodSecs: period.toFixed(this.decimalPlaces),
            semitonesFromA4: semitonesFromA4,
            midiNoteNumber: 69 + semitonesFromA4 // 69 is A4 in MIDI
        };
    }

    // Frequency to closest MIDI note
    frequencyToClosestNote(frequencyHz) {
        // A4 = 440Hz = MIDI note 69
        const midiNote = 12 * Math.log2(frequencyHz / 440) + 69;
        const roundedMidiNote = Math.round(midiNote);
        const octave = Math.floor(roundedMidiNote / 12) - 1;
        const noteIndex = roundedMidiNote % 12;
        const cents = 100 * (midiNote - roundedMidiNote);
        
        // Calculate exact frequency of the closest note
        const exactFreq = 440 * Math.pow(2, (roundedMidiNote - 69) / 12);
        const error = Math.abs(frequencyHz - exactFreq);
        
        return {
            note: this.noteNames[noteIndex],
            octave: octave,
            cents: cents.toFixed(this.decimalPlaces),
            exactFrequency: exactFreq.toFixed(this.decimalPlaces),
            errorHz: error.toFixed(this.decimalPlaces),
            errorCents: cents.toFixed(this.decimalPlaces),
            midiNoteNumber: roundedMidiNote
        };
    }

    // Add these useful utility methods
    
    getCommonMusicalDivisions(bpm) {
        const divisions = [1, 2, 4, 8, 16, 32, 64]; // Common note divisions
        const results = [];
        
        for (const div of divisions) {
            const timeMs = (60000 / bpm) * (4 / div); // 4 beats per bar
            results.push({
                division: `1/${div}`,
                ms: timeMs.toFixed(this.decimalPlaces),
                hz: (1000 / timeMs).toFixed(this.decimalPlaces)
            });
        }
        
        return results;
    }

    calculateTripletTiming(bpm) {
        const quarterNote = 60000 / bpm;
        return {
            quarterTriplet: (quarterNote / 1.5).toFixed(this.decimalPlaces),
            eighthTriplet: (quarterNote / 3).toFixed(this.decimalPlaces),
            sixteenthTriplet: (quarterNote / 6).toFixed(this.decimalPlaces)
        };
    }

    calculateDottedTiming(bpm) {
        const quarterNote = 60000 / bpm;
        return {
            dottedQuarter: (quarterNote * 1.5).toFixed(this.decimalPlaces),
            dottedEighth: (quarterNote * 0.75).toFixed(this.decimalPlaces),
            dottedSixteenth: (quarterNote * 0.375).toFixed(this.decimalPlaces)
        };
    }
}

module.exports = MusicCalculator; 