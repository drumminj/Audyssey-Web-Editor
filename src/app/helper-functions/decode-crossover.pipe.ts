import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'decodeCrossover' })
export class DecodeCrossoverPipe implements PipeTransform {

  transform(value?: string): number {
    return decodeCrossover(value);
  }
}

export function decodeCrossover(val?: string): number {
  const valAsNum = Number(val);
  return (valAsNum < 40) ? valAsNum * 10 : valAsNum;
}
