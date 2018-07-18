import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';

@Component({
  selector: 'peer-nickname',
  templateUrl: './nickname.component.html',
  styleUrls: ['./nickname.component.sass']
})
export class NicknameComponent implements OnInit {

  constructor(public auth: AuthService) { }

  ngOnInit() {
  }

}
