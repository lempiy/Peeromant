import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'peer-usercard',
  templateUrl: './usercard.component.html',
  styleUrls: ['./usercard.component.sass']
})
export class UsercardComponent implements OnInit {
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
  selected:any[] = []
  constructor() {}

  ngOnInit() {
  }

}
