import { Component, OnInit } from '@angular/core';
import { FilesService } from '../../services/files.service'
import { Input } from '@angular/compiler/src/core';

@Component({
  selector: 'peer-host',
  templateUrl: './host.component.html',
  styleUrls: ['./host.component.sass']
})
export class HostComponent implements OnInit {
  constructor(public fs: FilesService) { }

  ngOnInit() {
    console.log(this.fs)
  }

  onNewFile($event: Event) {
    const target = $event.target as HTMLInputElement
    const files = Array.from(target.files || [])
    files.forEach(f => {
      this.fs.addFile(f)
    })
  }

  onRemoveFile(f: File) {
    this.fs.removeFile(f)
  }
}
