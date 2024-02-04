import { Component, EventEmitter, Input, Output } from '@angular/core';
import  { DetectedChannel } from "interfaces/detected-channel";

const SPEED_SOUND_FIX_FACTOR = 0.875;
const METERS_TO_FEET_FACTOR = 3.28084;

const enum DistanceUnit {
    Meters = "m",
    Feet = "ft"
}

const METERS_STEP =  0.01;
const FEET_STEP = 0.1;

const METERS_FORMAT = '1.2-2';
const FEET_FORMAT = '1.1-1';

@Component({
    selector: 'channel-info-panel',
    templateUrl: './channel-info-panel.component.html',
    styleUrls: ['./channel-info-panel.component.scss'],
  })
export class ChannelInfoPanelComponent {
    @Input({required: true})
    get channelData() { return this._channelData }
    set channelData(value: DetectedChannel[]) {
      this._channelData = value;
      this.distanceValues = this.mapDistanceValues();
    }
    private _channelData!: DetectedChannel[];
    
    @Output()
    channelDataChange = new EventEmitter<DetectedChannel[]>();

    distanceUnit = DistanceUnit.Meters;
    distanceStep = METERS_STEP;
    distanceFormat = METERS_FORMAT;

    // speaker distance values converted to the appropriate unit for display,
    // based on this.distanceUnit
    distanceValues!: number[];
    speedSoundFixApplied = false;

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

    private mapDistanceValues(): number[] {
      return this.channelData.map(channel => {
        const distance = channel.customDistance ?? channel.channelReport.distance;
        return this.distanceUnit === DistanceUnit.Meters
          ? distance
          : distance * METERS_TO_FEET_FACTOR
      });
    }

    handleDistanceChange(distance: number, index: number): void {
      const newDistance = this.distanceUnit === DistanceUnit.Meters
        ? distance
        : distance / METERS_TO_FEET_FACTOR;
      this.channelData[index].customDistance = newDistance;
      this.channelDataChange.emit(this.channelData)
    }

    setDistanceUnit(unit: DistanceUnit): void {
      this.distanceUnit = unit;
      this.distanceStep = (unit == DistanceUnit.Meters) ? METERS_STEP : FEET_STEP;
      this.distanceFormat = (unit == DistanceUnit.Meters) ? METERS_FORMAT : FEET_FORMAT;
      this.distanceValues = this.mapDistanceValues();
    }

    applySpeedOfSoundFix() {
        this.channelData.forEach(channel => {
          channel.channelReport.distance *= SPEED_SOUND_FIX_FACTOR;
        });
    
        this.speedSoundFixApplied = true;
        this.channelDataChange.emit(this.channelData);
        this.distanceValues = this.mapDistanceValues();
      }
}