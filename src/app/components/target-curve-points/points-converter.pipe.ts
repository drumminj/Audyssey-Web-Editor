import { Pipe, PipeTransform } from '@angular/core';
import { ControlPoint } from '../../interfaces/control-point';

@Pipe({ name: 'convertPoints' })
export class PointsConverterPipe implements PipeTransform {

  transform(inputArr: string[]): ControlPoint[] {
    return inputArr.map(item => {
      const [freq, gain] = item.substring(1, item.length - 1).split(', ');
      return { freq: Number(freq), gain: Number(gain) };
    }) || [];
  }

}
