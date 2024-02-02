import {Component} from '@angular/core';
import {AudysseyInterface} from './interfaces/audyssey-interface';
import {CurveFilter, DetectedChannel, ResponseData, ChannelReport} from './interfaces/detected-channel';
import { ControlPoint } from './interfaces/control-point';
import {decodeChannelName} from './helper-functions/decode-channel-name.pipe';

import * as Highcharts from 'highcharts';
// import HC_boost from 'highcharts/modules/boost'
// import Draggable from 'highcharts/modules/draggable-points';
import Exporting from 'highcharts/modules/exporting';
import {options, seriesOptions} from './helper-functions/highcharts-options';
import {decodeCrossover} from "./helper-functions/decode-crossover";
import {convertToDraggablePoints, convertToNonDraggablePoints} from "./helper-functions/convert-draggable-points";

// Draggable(Highcharts);
// HC_boost(Highcharts);           // optimize rendering where possible
Exporting(Highcharts);          // for context menu
Highcharts.setOptions(options);

// for controlling debug statements/logic/output
const DEBUG = false;
const SPEED_SOUND_FIX_FACTOR = 0.875;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = { series: seriesOptions };
  chartUpdateFlag = false;

  readonly crossoverFreqs = [
    { label:"40", val: 40 },
    { label:"60", val: 60 },
    { label:"80", val: 80 },
    { label:"90", val: 90 },
    { label:"100", val: 10 },
    { label:"110", val: 11 },
    { label:"120", val: 12 },
    { label:"150", val: 15 },
    { label:"200", val: 20 },
    { label:"250", val: 25 }
  ];

  private chartObj?: Highcharts.Chart;

  audysseyData: AudysseyInterface = { detectedChannels: [] };
  calculatedChannelsData?: Map<string, number[][]>

  useHouseCurve = false;
  houseCurveChannel: DetectedChannel = {
    midrangeCompensation: false,
    enChannelType: 0, 
    isSkipMeasurement: false,
    frequencyRangeRolloff: 0, 
    customDistance: 0,
    customTargetCurvePoints: [],
    commandId: '',
    delayAdjustment: '',
    flatCurveFilter: {} as CurveFilter,
    referenceCurveFilter:  {} as CurveFilter,
    channelReport: {} as ChannelReport,
    responseData: {} as ResponseData,
    trimAdjustment: ''
  }
  selectedChannel: DetectedChannel = this.houseCurveChannel;
  customCurvePoints: ControlPoint[] = [];
  speedSoundFixApplied = false;

  chartLogarithmicScale = true;
  dataSmoothEnabled = true;
  graphSmoothEnabled = false;
  distanceUnit = "m";

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

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    console.log('Highcharts callback');
    if (chart.options.exporting?.menuItemDefinitions)
    {
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
  }

  async onProfileUpload(files: FileList | null) {
    const fileContent = await files?.item(0)?.text();
    if (fileContent) {
      this.chartObj?.showLoading();
      this.audysseyData = JSON.parse(fileContent);
      this.processDataWithWorker(this.audysseyData);
    }
    else alert('Cannot read the file');
  }

  updateControlPoints(pts: ControlPoint[]) {
    this.customCurvePoints = pts;
    if (this.useHouseCurve) {
      this.houseCurveChannel.customTargetCurvePoints = pts.map(pt => `{${pt.freq}, ${pt.gain}}`);
      this.audysseyData.detectedChannels.forEach(channel => {
        channel.customTargetCurvePoints = pts.map(pt => `{${pt.freq}, ${pt.gain}}`)
      });
    } else {
      this.selectedChannel.customTargetCurvePoints = pts.map(pt => `{${pt.freq}, ${pt.gain}}`);
    }
    this.updateChart();
  }

  copyControlPoints() {
    navigator.clipboard.writeText(JSON.stringify(this.customCurvePoints));
  }

  parseControlPtsJSON(text: string) {
    try {
      const pts = JSON.parse(text);
      let valid = Array.isArray(pts);
      if (valid) {
        for (const item of pts) {
          valid = valid && !Number.isNaN(item.freq) && !Number.isNaN(item.gain);
        }
      }

      if (valid) {
        this.customCurvePoints = pts;
      } else {
        console.log("Control Point data is improperly formatted: " + text);
      }

    } catch (e) {
      console.log("Error parsing control points from JSON: " + text);
    }
  }

  pasteControlPoints() {
    navigator
      .clipboard
      .readText()
      .then(text => this.parseControlPtsJSON(text));
  }

  async onControlPtsUpload(files: FileList | null) {
    const fileContent = await files?.item(0)?.text();
    if (fileContent) {
      this.parseControlPtsJSON(fileContent)
    }
  }

  handleChannelChange() {
    this.customCurvePoints = this.selectedChannel
      .customTargetCurvePoints
      .map(item => {
        const [freq, gain] = item.substring(1, item.length - 1).split(', ');
        return { freq: Number(freq), gain: Number(gain) };
      }) || [];
    this.updateChart();
  }

  processDataWithWorker(json: AudysseyInterface) {
    console.log('File content:', json);

    if (typeof Worker !== 'undefined') { // if supported
      const worker = new Worker(new URL('./helper-functions/bg-calculator.worker', import.meta.url));
      worker.postMessage(json.detectedChannels);

      worker.onmessage = ({ data }) => {
        console.log('Got a message from Web-Worker');
        this.calculatedChannelsData = data;

        this.selectedChannel = json.detectedChannels[0] ?? this.houseCurveChannel;
        this.handleChannelChange();
        this.chartObj?.hideLoading();
      };
    } else {
      // Web workers are not supported in this environment.
      // You should add a fallback so that your program still executes correctly.
      alert('Your browser is not supported. Please use latest Firefox or Chrome browser.');
    }
  }

  updateChart() {
    console.log('updateChart()')

    const XMin = 10, XMax = 24000;

    // add frequency Rolloff
    const xAxisBands = [{
      from: this.selectedChannel?.frequencyRangeRolloff,
      to: XMax,
      color: 'rgba(68, 170, 213, 0.1)',
      label: {
        text: 'Disabled',
        style: { color: '#606060' }
      }
    }];

    // add Crossover if it's a logarithmic scale
    if (this.selectedChannel.customCrossover && this.chartLogarithmicScale) {
      xAxisBands.push({
        from: XMin,
        to: decodeCrossover(this.selectedChannel.customCrossover),
        color: 'rgba(160, 160, 160, 0.1)',
        label: {
          text: 'Crossover',
          style: { color: '#606060' }
        }
      });
    }

    this.chartOptions.xAxis = {
      min: XMin,
      max: XMax,
      type: this.chartLogarithmicScale ? "logarithmic" : "linear",
      plotBands: xAxisBands
    };

    // const selectedChannelData = calculatePoints(this.selectedChannel?.responseData[0], this.dataSmoothEnabled);
    const selectedChannelData = this.calculatedChannelsData?.get(this.selectedChannel.commandId) ?? [];

    // adding first graph
    this.chartOptions.series![0] = {
      data: selectedChannelData ?? [],
      type: this.graphSmoothEnabled ? 'spline' : 'line',
      name: decodeChannelName(this.selectedChannel.commandId),
    };

    this.updateTargetCurve();
    // this.updateTargetCurve2();
  }

  addSubwooferToTheGraph(checked: boolean) {
    // const subDataValues = this.audysseyData.detectedChannels.at(-1)?.responseData[0] || [];
    // const subDataPoints = calculatePoints(subDataValues, false).slice(0, 62);
    // const customCrossover = this.selectedChannel?.customCrossover;
    // const subCutOff = customCrossover ? Number(customCrossover) / 2.9296875 : 63;

    const subCutOff = parseInt('200 Hz') / 3;
    const subDataPoints = this.calculatedChannelsData?.get('SW1')?.slice(0, subCutOff);

    // if (value) this.chartObj?.addSeries({});
    // else this.chartObj?.series.at(-1).destroy();

    if (this.chartOptions.series)
      if (checked) this.chartOptions.series[1] = {
        data: subDataPoints,
        type: 'spline',
        name: 'Subwoofer',
      };
      else this.chartOptions.series[1] = {
        data: [],
        type: 'spline',
      }

    this.chartUpdateFlag = true;
  }

  sliderValToRolloffVal(sliderVal: number): number {
    // range of slider's domain
    const SLIDER_MIN = 1;
    const SLIDER_MAX = 1000;
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
    if (this.rolloffUpdatePending) {
      return;
    }

    this.selectedChannel.frequencyRangeRolloff = this.sliderValToRolloffVal(Number((evt.target as HTMLInputElement).value));
    window.setTimeout(() => {
      this.updateChart();
      this.rolloffUpdatePending = false;
    }, 50);
  }

  formatRolloffValue(value: number): string {
    return `${this.sliderValToRolloffVal(value).toLocaleString("en-US", {useGrouping: true})} Hz`;
  }

  updateTargetCurve() {
    let data: any[] = this.audysseyData.enTargetCurveType == 1 ? [[20, 0],  [3600, 0], [9910, -2],[13300, -2.9], [16380, -4], [20000, -7]] :
      [[20, 0],  [3600, 0], [20000, -6]];

    if (this.selectedChannel?.midrangeCompensation) data.push([1000, 0], [1800, -3.6], [2000, -3.63], [3100, 0]);

    if (this.selectedChannel?.customTargetCurvePoints) {
      data = [
        ...convertToNonDraggablePoints(data),
        ...convertToDraggablePoints(this.selectedChannel?.customTargetCurvePoints)
          .filter(point => !(point.y == 0 && (point.x == 20 || point.x == 20000))),
      ].sort((a, b) => a.x! - b.x!);
    }
    console.log('updateTargetCurve() data', data);


    if (this.audysseyData.enTargetCurveType) {
      this.chartOptions.series![2] = {
        data,
        type: 'spline',
      };
    }

    this.chartUpdateFlag = true;
  }

  updateTargetCurve2() {
    const ROLLOFF_1_TARGET_CURVE: Array<[number, number]>  = [[20, 0],  [3600, 0], [20000, -6]];
    const ROLLOFF_2_TARGET_CURVE: Array<[number, number]>  = [[20, 0],  [3600, 0], [9910, -2],[13300, -2.9], [16380, -4], [20000, -7]];
    const MIDRANGE_COMPENSATION_CONTROL_POINTS: Array<[number, number]> = [[1000, 0], [1800, -3.6], [2000, -3.63], [3100, 0]];
    let targetCurve = this.audysseyData.enTargetCurveType == 2
      ? ROLLOFF_2_TARGET_CURVE
      : ROLLOFF_1_TARGET_CURVE;

    if (this.selectedChannel.midrangeCompensation) {
      targetCurve = targetCurve.concat(MIDRANGE_COMPENSATION_CONTROL_POINTS);
    }

    const targetPoints = convertToNonDraggablePoints(targetCurve);
    let data = targetPoints;
    if (this.selectedChannel.customTargetCurvePoints) {
      // if there are custom target curve points, they should override any built-in target curve points
      const customPoints = convertToDraggablePoints(this.selectedChannel.customTargetCurvePoints);
      const customFreqs = new Set(customPoints.map(e => e.x));
      data = [
        ...targetPoints.filter(pt => !customFreqs.has(pt.x)),
        ...customPoints
      ];
    }

    data = data.sort((a, b) => a.x! - b.x!);
    console.log('data', data);

    if (this.audysseyData.enTargetCurveType) {
      this.chartOptions.series!.push({
        data,
        type: 'spline',
      });
    }

    this.chartUpdateFlag = true;
  }

  exportFile() {
    const blob = new Blob([JSON.stringify(this.audysseyData)], {type: 'application/ady'});
    const url = URL.createObjectURL(blob) // Create an object URL from blob

    const a = document.createElement('a') // Create "a" element
    a.setAttribute('href', url) // Set "a" element link
    a.setAttribute('download', this.audysseyData.title + '_' + new Date().toLocaleDateString() + '.ady') // Set download filename
    a.click() // Start downloading
    URL.revokeObjectURL(url);
  }

  async loadExample() {
    this.chartObj?.showLoading();
    const example = await fetch('assets/example-2-subs.ady').then(file => file.json());
    this.audysseyData = example;
    this.processDataWithWorker(example);
  }

  constructor() {
    this.loadExample();
  }

  applySpeedOfSoundFix() {
    this.audysseyData.detectedChannels.forEach(channel => {
      channel.channelReport.distance *= SPEED_SOUND_FIX_FACTOR;
    });

    this.speedSoundFixApplied = true;
  }
}
