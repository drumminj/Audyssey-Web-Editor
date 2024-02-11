import { Component, EventEmitter, Input, Output } from '@angular/core';
import { calculatePoints } from 'helper-functions/calculate-points';
import { ControlPoint } from 'interfaces/control-point';
import { ChannelReport, CurveFilter, DetectedChannel, ResponseData } from "interfaces/detected-channel";
import { TargetCurve } from "interfaces/target-curve";

@Component({
  selector: 'target-curve-panel',
  templateUrl: './target-curve-panel.component.html',
  styleUrls: ['./target-curve-panel.component.scss'],
})
export class TargetCurvePanelComponent {
  @Input({required: true})
  get channelData() {
    return this._channelData;
  }
  set channelData(value: DetectedChannel[]) {
    this._channelData = value;
    this.cachedResponseData = new Array(value.length);
    this.setSelectedChannel(value.length > 0 ? 0 : this.HOUSE_CURVE_CHANNEL);
  }
  private _channelData!: DetectedChannel[];

  @Input({required: true})
  targetCurve: TargetCurve = 1;

  @Output()
  channelDataChange = new EventEmitter<DetectedChannel[]>();

  readonly HOUSE_CURVE_CHANNEL = -1;
  useHouseCurve = false;
  private houseCurveChannelData: DetectedChannel = {
    midrangeCompensation: false,
    enChannelType: 0, 
    isSkipMeasurement: false,
    frequencyRangeRolloff: -1, 
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

  selectedChannel = this.HOUSE_CURVE_CHANNEL;       // index of currently selected channel (house curve is -1)
  selectedChannelData = this.houseCurveChannelData; // DetectedChannelData for the currently selected channel
  selectedChannelResponseData: number[][] = [[]];   // freq response data for the currently selected channel
  selectedChannelControlPts: ControlPoint[] = [];   // control points (if any) for the currently selected channel
  cachedResponseData: number[][][] = [];            // cache freq response data for each channel when computed

  setSelectedChannel(value: number) {
    this.selectedChannel = value;
    this.selectedChannelData = this.selectedChannel === this.HOUSE_CURVE_CHANNEL
      ? this.houseCurveChannelData
      : this._channelData[this.selectedChannel];
    if (this.selectedChannel != this.HOUSE_CURVE_CHANNEL) {
      this.cachedResponseData[value] = this.cachedResponseData[value] || calculatePoints(this.selectedChannelData.responseData[0]);
    }
    this.selectedChannelResponseData = this.cachedResponseData[value]
    this.selectedChannelControlPts = this.selectedChannelData.customTargetCurvePoints
      ? this.selectedChannelData.customTargetCurvePoints.map(pt => {
          const coords = pt.replace(/[{}]/g, '').split(',');
          return { freq: Number(coords[0]), gain: Number(coords[1]) };
      }) : [];
  }

  handleControlPointsChange(controlPoints: ControlPoint[]) {
    this.selectedChannelData.customTargetCurvePoints = controlPoints.map(pt => `{${pt.freq}, ${pt.gain}}`);
    if (this.useHouseCurve) {
      this.channelData.forEach(channel => {
        channel.customTargetCurvePoints = [...this.selectedChannelData.customTargetCurvePoints]
      });
    }
  }

  handleCorrectionLimitChange(limitFreq: number) {
    if (limitFreq !== this.selectedChannelData.frequencyRangeRolloff) {
      this.selectedChannelData.frequencyRangeRolloff = limitFreq;
      this.channelDataChange.emit(this.channelData);
    }
  }
}