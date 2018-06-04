import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'peer-create-camp',
  templateUrl: './create-camp.component.html',
  styleUrls: ['./create-camp.component.sass']
})
export class CreateCampComponent implements OnInit {
  @Input() show: boolean
  @Output() onApply: EventEmitter<string> = new EventEmitter()
  
  name: string

  constructor() { }

  ngOnInit() {}

  onChange(event: Event) {
    this.name = (<HTMLInputElement>event.target).value
  }

  applyNewHub() {
    this.onApply.emit(this.name)
    this.show = false
  }
}
