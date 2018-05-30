import { Pipe, PipeTransform } from '@angular/core';
import { IPeer } from '../defs/peer';

@Pipe({
  name: 'pair'
})
export class PairPipe implements PipeTransform {

  transform(value: IPeer[], odd: boolean): IPeer[] {
    return value.filter((v, i) => (i % 2 === 0) === odd)
  }

}
