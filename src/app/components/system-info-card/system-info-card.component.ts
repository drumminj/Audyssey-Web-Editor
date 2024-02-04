import { Component, EventEmitter, Input, Output } from '@angular/core';
import  { AudysseyInterface } from "interfaces/audyssey-interface";
import { TargetCurve } from "interfaces/target-curve";

@Component({
    selector: 'system-info-card',
    templateUrl: './system-info-card.component.html',
    styleUrls: ['./system-info-card.component.scss'],
  })
export class SystemInfoCardComponent {
    @Input({required: true})
    audysseyData!: AudysseyInterface;
  
    @Output()
    targetCuveChange = new EventEmitter<TargetCurve>();

    @Output()
    dynamicEQChange = new EventEmitter<boolean>();

    @Output()
    dynamicVolumeChange = new EventEmitter<boolean>();

    setDynamicEQ(val: boolean): void {
        this.dynamicEQChange.emit(val);
    }

    setDynamicVolume(val: boolean):void  {
        this.dynamicVolumeChange.emit(val);
    }

    setTargetCurve(val: TargetCurve): void {
        this.targetCuveChange.emit(val);
    }
}
