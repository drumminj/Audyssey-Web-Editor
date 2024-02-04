import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';

import * as Highcharts from 'highcharts';
// import Draggable from 'highcharts/modules/draggable-points';
import Exporting from 'highcharts/modules/exporting';

import { options, seriesOptions } from 'helper-functions/highcharts-options';
import { ControlPoint } from 'interfaces/control-point';
import { TargetCurve } from "interfaces/target-curve";

// Draggable(Highcharts);
Exporting(Highcharts);          // for context menu
Highcharts.setOptions(options);

const ROLLOFF_1_TARGET_CURVE: Array<[number, number]>  = [[20, 0],  [3600, 0], [9910, -2],[13300, -2.9], [16380, -4], [20000, -7]];
const ROLLOFF_2_TARGET_CURVE: Array<[number, number]>  = [[20, 0],  [3600, 0], [20000, -6]];
const MIDRANGE_COMPENSATION_CONTROL_POINTS: Array<[number, number]> = [[1000, 0], [1800, -3.6], [2000, -3.63], [3100, 0]];

const SLIDER_MIN = 1;
const SLIDER_MAX = 1000;

@Component({
  selector: 'target-curve-chart-card',
  templateUrl: './target-curve-chart-card.component.html',
  styleUrls: ['./target-curve-chart-card.component.scss'],
})
export class TargetCurveChartCardComponent {
  @ViewChild('drawer') drawer!: MatSidenav;

  @Input({required: true})
  get channelData() { return this._channelData }
  set channelData(value: number[][]) {
    this.drawer.close();
    this._channelData = value;
    this.updateChart();
  }
  _channelData!: number[][]

  @Input({required: true})
  canEditControlPoints = false;

  @Input({required: true})
  canSetCorrectionFreqLimit = false;

  @Input({required: true})
  get midrangeCompensation() { return this._midrangeCompensation }
  set midrangeCompensation(value: boolean) {
    if (value !== this._midrangeCompensation) {
      this._midrangeCompensation = value;
      this.updateChart();
    }
  }
  _midrangeCompensation = false;

  @Input({required: true})
  get crossoverFreq() { return this._crossoverFreq }
  set crossoverFreq(value: number) {
    if (value !== this._crossoverFreq) {
      this._crossoverFreq = value;
      this.updateChart();
    }
  }
  _crossoverFreq = 0;

  @Input({required: true})
  get correctionLimit() { return this._correctionLimit }
  set correctionLimit(value: number) {
    if (value !== this._correctionLimit) {
      this._correctionLimit = value;
      this.updateChart();
      this.updateRolloffSlider();
    }
  }
  _correctionLimit = 0;

  @Output()
  correctionLimitChange = new EventEmitter<number>();

  @Input({required: true})
  get targetCurve() { return this._targetCurve; }
  set targetCurve(value: TargetCurve) {
    if (value !== this.targetCurve) {
      this._targetCurve = value;
      this.updateChart();
    }
  }
  private _targetCurve: TargetCurve = 1;
  
  @Input({required: true})
  get controlPoints() { return this._controlPoints; }
  set controlPoints(value: ControlPoint[]) {
    this._controlPoints = value;
    this.updateChart();
  }
  private _controlPoints: ControlPoint[] = [];

  @Output()
  controlPointsChange = new EventEmitter<ControlPoint[]>();

  readonly highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = { series: seriesOptions };
  chartUpdateFlag = false;

  private chartObj?: Highcharts.Chart;

  chartLogarithmicScale = true;
  graphSmoothEnabled = false;

  rolloffSliderVal = 0;

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    console.log('Highcharts callback');
    if (chart.options.exporting?.menuItemDefinitions) {
      chart.options.exporting.menuItemDefinitions['xScale'].onclick = () => {
        this.chartLogarithmicScale = !this.chartLogarithmicScale;
        this.updateChart();
      }
      chart.options.exporting.menuItemDefinitions['graphSmoothing'].onclick = () => {
        this.graphSmoothEnabled = !this.graphSmoothEnabled;
        this.updateChart();
        this.updateChartMenuItems();
      }
    }
    this.chartObj = chart;
    this.updateChartMenuItems();

    // immediately redraw with data for selected channel once chart is initialized
    window.setTimeout(() => this.updateChart(), 0);
  }

  // Updates context menu items for the chart based on the option's current state
  updateChartMenuItems() {
    this.chartObj?.update({
      exporting: {
        menuItemDefinitions: {
          graphSmoothing: {
            text: `${this.graphSmoothEnabled ? "\u2713 " : "&nbsp;&nbsp;"} Graph Smoothing`
          }
        }
      }
    });
  }

  updateChart() {
    if (!this.chartObj) {
      // if the chart isn't yet initialized, do nothing as we'll trigger an as soon as it is
      return;
    }

    console.log('updateChart()')

    const xAxisBands = [];
    if (this._correctionLimit !== -1) {
      xAxisBands.push({
        from: this._correctionLimit,
        to: (this.chartLogarithmicScale)
          ? Math.pow(10, this.chartObj!.xAxis[0].max!)
          : this.chartObj!.xAxis[0].max!,
        color: 'rgba(68, 170, 213, 0.1)',
        label: {
          text: 'Disabled',
          style: { color: '#606060' }
        }
      });
    }

    // add Crossover if it's a logarithmic scale
    if (!Number.isNaN(this._crossoverFreq) && this.chartLogarithmicScale) {
      xAxisBands.push({
        from: (this.chartLogarithmicScale)
          ? Math.pow(10, this.chartObj!.xAxis[0].min!)
          : this.chartObj!.xAxis[0].min!,
        to: this._crossoverFreq,
        color: 'rgba(160, 160, 160, 0.1)',
        label: {
          text: 'Crossover',
          style: { color: '#606060' }
        }
      });
    }

    this.chartOptions.xAxis = {
      type: this.chartLogarithmicScale ? "logarithmic" : "linear",
      plotBands: xAxisBands
    };

    // adding first graph
    this.chartOptions.series![0] = {
      data: this._channelData ?? [],
      type: this.graphSmoothEnabled ? 'spline' : 'line'
    };

    this.updateTargetCurve();
  }

  updateTargetCurve() {    
    // Build un-customized target curve
    let targetCurve = this._targetCurve === 1 ? ROLLOFF_1_TARGET_CURVE : ROLLOFF_2_TARGET_CURVE;
    if (this.midrangeCompensation) {
      targetCurve = targetCurve.concat(MIDRANGE_COMPENSATION_CONTROL_POINTS);
    }
    const targetPoints = this.convertToNonDraggablePoints(targetCurve);

    // Add-in any custom points
    let data = targetPoints;
    if (this._controlPoints) {
      // if there are custom target curve points, they should override any built-in target curve points
      const customPoints = this.convertToDraggablePoints(this._controlPoints);
      const customFreqs = new Set(customPoints.map(e => e.x));
      data = data
        .filter(pt => !customFreqs.has(pt.x))
        .concat(customPoints);
    }
    data.sort((a, b) => a.x! - b.x!);
    console.log('updateTargetCurve() data: ', data);

    if (this.targetCurve) {
      this.chartOptions.series![2] = {
        data,
        type: 'spline',
      };
    }

    this.chartUpdateFlag = true;
  }

  private updateRolloffSlider() {
    // update the slider position based on correction frequency
    const min = this.chartObj!.xAxis[0].min!;
    const max = this.chartObj!.xAxis[0].max!;

    const logVal = Math.log10(this._correctionLimit);
    const pct = (logVal - min) / (max-min);
    this.rolloffSliderVal = pct * (SLIDER_MAX - SLIDER_MIN) + SLIDER_MIN;
  }

  sliderValToRolloffVal(sliderVal: number): number {
    // range of slider's domain
    const pct = (sliderVal - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN);

    // Get actual min/max values for x axis
    // (note, for log axis it's the log of the real value)
    const min = this.chartObj!.xAxis[0].min!;
    const max = this.chartObj!.xAxis[0].max!;

    let rolloff = pct * (max - min) + min;
    if (this.chartLogarithmicScale) {
      rolloff = Math.pow(10, rolloff);
    }

    return Math.round(rolloff);
  }

  rolloffUpdatePending = false;
  updateRolloff(evt: Event) {
    let newVal = Number((evt.target as HTMLInputElement).value);
    this._correctionLimit = this.sliderValToRolloffVal(newVal);
    this.correctionLimitChange.emit(this._correctionLimit);

    if (this.rolloffUpdatePending) {
      return;
    }

    window.setTimeout(() => {
      this.updateChart();
      this.rolloffUpdatePending = false;
    }, 50);
  }

  formatRolloffValue(value: number): string {
    return `${this.sliderValToRolloffVal(value).toLocaleString("en-US", {useGrouping: true})} Hz`;
  }

  updateControlPoints(pts: ControlPoint[]) {
    this._controlPoints = pts;
    this.controlPointsChange.emit(pts);
    this.updateChart();
  }

  private convertToDraggablePoints(arr: ControlPoint[]): Highcharts.PointOptionsObject[] {
    return arr.map(point => {
      return {
        x: point.freq,
        y: point.gain,
        dragDrop: {draggableY: true, draggableX: true, dragMaxX: point.freq + 20, dragMinX: point.gain - 20},
        marker: {enabled: true}
      }
    })
  }
  
  private convertToNonDraggablePoints(arr: Array<[number, number]>): Highcharts.PointOptionsObject[] {
    return arr.map(point => {
      return {
        x: point[0],
        y: point[1],
        dragDrop: {draggableY: false, draggableX: false},
        marker: {enabled: false, states: {hover: {enabled: false}}},
      }
    })
  }
  
}