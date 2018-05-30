import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'peer-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.sass']
})
export class HostComponent implements OnInit {
  files:any[] = [
    {
      "name": "game.zip",
      "size": "25.4MB"
    },
    {
      "name": "row.txt",
      "size": "0.1MB"
    },
    {
      "name": "image.iso",
      "size": "7024MB"
    }
  ];
  constructor() { }

  ngOnInit() {
  }

}
