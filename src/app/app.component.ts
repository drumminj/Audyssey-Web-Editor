import {Component} from '@angular/core';
import {AudysseyInterface} from "./interfaces/audyssey-interface";
import {DetectedChannel} from "./interfaces/detected-channel";
import {decodeChannelName} from "./helper-functions/decode-channel-name";

import * as Highcharts from "highcharts";
import HC_boost from 'highcharts/modules/boost'
import Sonification from 'highcharts/modules/sonification';
import Exporting from 'highcharts/modules/exporting';
import {options, seriesOptions} from "./helper-functions/highchartsInit";
// Sonification(Highcharts);
HC_boost(Highcharts);
// Exporting(Highcharts);
Highcharts.setOptions(options);

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = { series: seriesOptions };

  // private chartObj?: Highcharts.Chart;

  audysseyData: AudysseyInterface = { detectedChannels: [] };
  calculatedChannelsData?: Map<string, number[][]>

  selectedChannel?: DetectedChannel;
  protected readonly decodeChannelName = decodeChannelName; // for the HTML template
  chartLogarithmicScale = true;
  chartUpdateFlag = false;
  dataSmoothEnabled = true;
  graphSmoothEnabled = false;

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    console.log('Graph loaded');
    this.chartObj = chart;
  }
  private chartObj: any;

  async onUpload(files: FileList | null) {
    const fileContent = await files?.item(0)?.text();
    if (fileContent) {
      this.audysseyData = JSON.parse(fileContent);

      if (typeof Worker !== 'undefined') { // if supported
        const worker = new Worker(new URL('./helper-functions/bg-calculator.worker', import.meta.url));
        worker.onmessage = ({ data }) => {
          console.log(`page got message from web-worker`);
          this.calculatedChannelsData = data;
        };
        worker.postMessage(this.audysseyData.detectedChannels);
      } else {
        // Web workers are not supported in this environment.
        // You should add a fallback so that your program still executes correctly.
      }
    }

  }

  updateChart() {
    console.log('this.selectedChannel', this.selectedChannel)

    const XMin = 10, XMax = 24000;

    this.chartOptions.title = {
      text: decodeChannelName(this.selectedChannel?.commandId)
    };

    this.chartOptions.xAxis = {
      min: XMin,
      max: XMax,
      type: this.chartLogarithmicScale ? "logarithmic" : "linear",
      plotBands: [{
        from: this.selectedChannel?.frequencyRangeRolloff,
        to: XMax,
        color: 'rgba(68, 170, 213, 0.1)',
        label: {
          text: 'Disabled',
          style: { color: '#606060' }
        }
      }]
    };

    // add Crossover if it's a logarithmic scale
    if (this.selectedChannel?.customCrossover && this.chartLogarithmicScale) this.chartOptions.xAxis.plotBands?.push({
      from: XMin,
      to: Number(this.selectedChannel.customCrossover),
      color: 'rgba(160, 160, 160, 0.1)',
      label: {
        text: 'Crossover',
        style: { color: '#606060' }
      }
    })

    console.time("calculate selected channel");

    // const selectedChannelData = calculatePoints(this.selectedChannel?.responseData[0], this.dataSmoothEnabled);
    const selectedChannelData = this.calculatedChannelsData?.get(this.selectedChannel!.commandId);
    console.timeEnd("calculate selected channel");

    // adding first graph
    // @ts-ignore
    this.chartOptions.series[0] = {
      data: selectedChannelData,
      type: this.graphSmoothEnabled ? 'spline' : 'line',
      name: decodeChannelName(this.selectedChannel?.commandId),
    };

    this.chartUpdateFlag = true;
  }

  async addSubwooferToTheGraph(value: boolean) {
    // const subDataValues = this.audysseyData.detectedChannels.at(-1)?.responseData[0] || [];
    // const subDataPoints = calculatePoints(subDataValues, false).slice(0, 62);
    const crossover = this.selectedChannel?.customCrossover;
    console.log(crossover)

    const subDataPoints = this.calculatedChannelsData?.get('SW1')?.slice(0, 62);

    // if (value) this.chartObj?.addSeries({});
    // else this.chartObj?.series.at(-1).destroy();

    if (this.chartOptions.series)
    if (value) this.chartOptions.series[1] = {
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

  exportFile() {
    const blob = new Blob([JSON.stringify(this.audysseyData)], {type: 'application/json'});
    const url = URL.createObjectURL(blob) // Create an object URL from blob

    const a = document.createElement('a') // Create "a" element
    a.setAttribute('href', url) // Set "a" element link
    a.setAttribute('download', this.audysseyData.title + '_' + new Date().toLocaleDateString() + '.ady') // Set download filename
    a.click() // Start downloading
    URL.revokeObjectURL(url);
  }

  playChart() {
    this.chartObj.toggleSonify();
  }

  updatePointsForSelectedChannel(points: string[]) {

    console.log('Received points from Component', points);
    console.log('Existing points', this.selectedChannel?.customTargetCurvePoints);

    this.selectedChannel!.customTargetCurvePoints = points;
  }
}
