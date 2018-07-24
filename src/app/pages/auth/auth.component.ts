import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SignallerService } from '../../services/signaller.service';

@Component({
  selector: 'peer-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.sass']
})
export class AuthComponent implements OnInit, OnDestroy {
  name: string
  private subs: Subscription[] = []
  private next: string
  private isInitial: boolean
  public error: string
  constructor(
    public auth: AuthService,
    private route: ActivatedRoute,
    private sg: SignallerService,
    private router: Router) { }

  ngOnInit() {
    this.name = this.auth.name
    this.subs.push(this.route.queryParams.subscribe(p => {
      this.next = p.next
      this.isInitial = p.initial
    }))
  }

  ngOnDestroy() {
    this.subs.forEach(s => s.unsubscribe())
  }

  onInput(event: Event) {
    this.error = ''
    this.name = (<HTMLInputElement>event.target).value
  }

  onSubmit(event: Event) {
    event.preventDefault()
    if (!this.name) return
    this.auth.name = this.name
    this.sg.forceConnect().subscribe(
      isOk => {
        if (isOk) {
          this.router.navigate([this.next || '/enter'], this.isInitial ? {
            queryParams: {
              initial: 1
            }
          } : null)
          return
        }
        this.error = `User with name ${this.name} already connected`
      },
      err => {
        this.error = `Cannot connect to signal server`
      },
      function() {
        this.unsubscribe()
      }
    )
  }
}
