import { Component, ElementRef, ViewChild } from '@angular/core';
import { AudysseyInterface } from 'interfaces/audyssey-interface';

const LOADING_CLASS = "loading";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  @ViewChild('main') main!: ElementRef;
  audysseyData: AudysseyInterface = { detectedChannels: [], enTargetCurveType: 1 };
  
  constructor() {
    // Load example by default so new users aren't faced with a blank screen 
    this.loadExample();
  }

  async loadExample() {
    this.main?.nativeElement.classList.add(LOADING_CLASS);
    const example = await fetch('assets/example-2-subs.ady').then(file => file.json());
    this.audysseyData = example;
    this.main?.nativeElement.classList.remove(LOADING_CLASS);
  }

  async onProfileUpload(files: FileList | null) {
    this.main?.nativeElement.classList.add(LOADING_CLASS);
    const fileContent = await files?.item(0)?.text();
    if (fileContent) {
      this.audysseyData = JSON.parse(fileContent);
    }
    else alert('Cannot read the file');
    this.main?.nativeElement.classList.remove(LOADING_CLASS);
  }

  exportFile() {
    const blob = new Blob([JSON.stringify(this.audysseyData)], {type: 'application/ady'});
    const url = URL.createObjectURL(blob) // Create an object URL from blob

    const a = document.createElement('a') // Create "a" element
    a.setAttribute('href', url) // Set "a" element link
    a.setAttribute('download', this.audysseyData.title + '_' + new Date().toLocaleDateString() + '.ady') // Set download filename
    a.click() // Start downloading
    URL.revokeObjectURL(url);
  }
}
