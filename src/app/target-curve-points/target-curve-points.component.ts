import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ControlPoint } from '../interfaces/control-point';

const MAX_FREQ = 20000;
const MIN_FREQ = 20;
const MAX_GAIN = 12;
const MIN_GAIN = -12;

@Component({
  selector: 'app-target-curve-points',
  templateUrl: './target-curve-points.component.html',
  styleUrls: ['./target-curve-points.component.scss'],
})
export class TargetCurvePointsComponent {
  @Input({required: true})
  curvePoints!: ControlPoint[];

  @Output()
  curvePointsChange = new EventEmitter<ControlPoint[]>();

  coerceGain(gain: number): number {
    return Math.min(Math.max(gain, MIN_GAIN), MAX_GAIN);
  }

  coerceFreq(freq: number): number {
    return Math.min(Math.max(freq, MIN_FREQ), MAX_FREQ);
  }

  changeFreq(evt: Event, index: number) {
    let freq = Number((evt.target as HTMLInputElement).value);
    if (Number.isNaN(freq)) {
      freq = this.curvePoints[index].freq;
    }

    freq = this.coerceFreq(freq);
    if (freq != this.curvePoints[index].freq) {
      this.curvePoints[index].freq = freq;
      this.curvePointsChange.emit(this.curvePoints);
    }
  }

  changeGain(evt: Event, index: number) {
    let gain = Number((evt.target as HTMLInputElement).value);
    if (Number.isNaN(gain)) {
      gain = this.curvePoints[index].gain;
    }
  
    gain = this.coerceGain(gain);
    if (gain != this.curvePoints[index].gain) {
      this.curvePoints[index].gain = Number(gain);
      this.curvePointsChange.emit(this.curvePoints);
    }
  }

  addPoint() {
    this.coercePoints();
    this.sortPoints();
    this.curvePoints.push({freq: 0, gain: 0});
  }

  removePoint(index: number) {
    this.curvePoints = this.curvePoints.filter((_, i) => i != index);
    this.coercePoints();
    this.curvePoints.sort((a, b) => a.freq - b.freq);
    this.curvePointsChange.emit(this.curvePoints);
  }

  coercePoints(): void {
    this.curvePoints.forEach(pt => {
      pt.freq = this.coerceFreq(pt.freq);
      pt.gain = this.coerceGain(pt.gain);
    });
  }

  save() {
    // Need to ensure points are sorted for export at the least, but it's nice
    // to keep them sorted in the UI as well when users are done editing
    this.coercePoints();
    this.sortPoints();
    this.curvePointsChange.emit(this.curvePoints);
  }

  private sortPoints() {
    this.curvePoints.sort((a, b) => a.freq - b.freq);

    // Because I suck at angular, this fix is needed to properly re-render the list
    // after sort
    for (let i = 0; i < this.curvePoints.length; i++) {
      this.curvePoints[i] = {...this.curvePoints[i]};
    }
    this.curvePointsChange.emit(this.curvePoints);
  }
}
