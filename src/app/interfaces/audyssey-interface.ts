import {DetectedChannel} from "./detected-channel";
import { TargetCurve } from "./target-curve";

export interface AudysseyInterface {
  enAmpAssignType?: number
  dynamicVolume?: boolean
  enTargetCurveType: TargetCurve
  lfcSupport?: boolean
  detectedChannels: DetectedChannel[]
  targetModelName?: string
  title?: string
  interfaceVersion?: string
  dynamicEq?: boolean
  ampAssignInfo?: string
  lfc?: boolean
  systemDelay?: number
  auro?: boolean
  upgradeInfo?: string
  enMultEQType?: number
  adcLineup?: number
}
