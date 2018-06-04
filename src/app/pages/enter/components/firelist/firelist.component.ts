import { Component, OnInit, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'peer-firelist',
  templateUrl: './firelist.component.html',
  styleUrls: ['./firelist.component.sass']
})
export class FirelistComponent implements OnInit {
  @Output() add: EventEmitter<string> = new EventEmitter()
  @Output() connect: EventEmitter<string> = new EventEmitter()
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
    this.add.emit(this.name)
    this.show = false
  }
}
