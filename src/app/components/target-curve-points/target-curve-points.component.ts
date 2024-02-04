import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlPoint } from 'interfaces/control-point';

const MAX_FREQ = 20000;
const MIN_FREQ = 20;
const MAX_GAIN = 12;
const MIN_GAIN = -12;

@Component({
  selector: 'target-curve-points',
  templateUrl: './target-curve-points.component.html',
  styleUrls: ['./target-curve-points.component.scss'],
})
export class TargetCurvePointsComponent {
  @Input({required: true})
  controlPoints!: ControlPoint[];

  @Output()
  controlPointsChange = new EventEmitter<ControlPoint[]>();

  coerceGain(gain: number): number {
    return Math.min(Math.max(gain, MIN_GAIN), MAX_GAIN);
  }

  coerceFreq(freq: number): number {
    return Math.min(Math.max(freq, MIN_FREQ), MAX_FREQ);
  }

  changeFreq(evt: Event, index: number) {
    let freq = Number((evt.target as HTMLInputElement).value);
    if (Number.isNaN(freq)) {
      freq = this.controlPoints[index].freq;
    }

    freq = this.coerceFreq(freq);
    if (freq != this.controlPoints[index].freq) {
      this.controlPoints[index].freq = freq;
      this.controlPointsChange.emit(this.controlPoints);
    }
  }

  changeGain(evt: Event, index: number) {
    let gain = Number((evt.target as HTMLInputElement).value);
    if (Number.isNaN(gain)) {
      gain = this.controlPoints[index].gain;
    }
  
    gain = this.coerceGain(gain);
    if (gain != this.controlPoints[index].gain) {
      this.controlPoints[index].gain = Number(gain);
      this.controlPointsChange.emit(this.controlPoints);
    }
  }

  addPoint() {
    this.coercePoints();
    this.sortPoints();
    this.controlPoints.push({freq: 0, gain: 0});
  }

  removePoint(index: number) {
    this.controlPoints = this.controlPoints.filter((_, i) => i != index);
    this.coercePoints();
    this.controlPoints.sort((a, b) => a.freq - b.freq);
    this.controlPointsChange.emit(this.controlPoints);
  }

  save() {
    // Need to ensure points are sorted for export at the least, but it's nice
    // to keep them sorted in the UI as well when users are done editing
    this.coercePoints();
    this.sortPoints();
  }

  copyControlPoints() {
    navigator.clipboard.writeText(JSON.stringify(this.controlPoints));
  }

  pasteControlPoints() {
    navigator
      .clipboard
      .readText()
      .then(text => this.parseControlPtsJSON(text));
  }

  private sortPoints() {
    this.controlPoints.sort((a, b) => a.freq - b.freq);

    // Because I suck at angular, this fix is needed to properly re-render the list
    // after sort
    for (let i = 0; i < this.controlPoints.length; i++) {
      this.controlPoints[i] = {...this.controlPoints[i]};
    }
    this.controlPointsChange.emit(this.controlPoints);
  }

  private coercePoints(): void {
    this.controlPoints.forEach(pt => {
      pt.freq = this.coerceFreq(pt.freq);
      pt.gain = this.coerceGain(pt.gain);
    });
  }

  private parseControlPtsJSON(text: string) {
    try {
      const pts = JSON.parse(text);
      let valid = Array.isArray(pts);
      if (valid) {
        for (const item of pts) {
          valid = valid && !Number.isNaN(item.freq) && !Number.isNaN(item.gain);
        }
      }

      if (valid) {
        this.controlPoints = pts;
        this.controlPointsChange.emit(this.controlPoints);
      } else {
        console.log("Control Point data is improperly formatted: " + text);
      }

    } catch (e) {
      console.log("Error parsing control points from JSON: " + text);
    }
  }

  async onControlPtsUpload(files: FileList | null) {
    const fileContent = await files?.item(0)?.text();
    if (fileContent) {
      this.parseControlPtsJSON(fileContent)
    }
  }
}
