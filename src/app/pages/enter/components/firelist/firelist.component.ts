import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'peer-firelist',
  templateUrl: './firelist.component.html',
  styleUrls: ['./firelist.component.sass']
})
export class FirelistComponent implements OnInit {
  show:boolean = false
  name:string = ''
  constructor() { }

  ngOnInit() {
  }

  onChangeCampName() {
    this.name = (<HTMLInputElement>event.target).value
  }

  onClickNewCamp() {
    this.name = ''
    this.show = true
  }

  applyNewHub() {
    console.log(this.name)
    this.show = false
  }
}
