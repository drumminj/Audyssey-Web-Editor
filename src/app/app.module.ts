import { NgModule } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from "@angular/material/button";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatCardModule } from "@angular/material/card";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSliderModule } from "@angular/material/slider";
import { MatSlideToggleModule } from "@angular/material/slide-toggle";
import { MatTooltipModule } from '@angular/material/tooltip';

import { HighchartsChartModule } from "highcharts-angular";

import { AppComponent } from './app.component';
import { DecodeChannelNamePipe } from './helper-functions/decode-channel-name.pipe';
import { TargetCurvePointsComponent } from './target-curve-points/target-curve-points.component';
import { PointsConverterPipe } from './target-curve-points/points-converter.pipe';

import { SystemInfoCardComponent } from './components/system-info-card/system-info-card.component';
import { DecodeEqTypePipe } from './components/system-info-card/decode-eq-type.pipe';


@NgModule({
  declarations: [
    AppComponent,
    TargetCurvePointsComponent,
    PointsConverterPipe,
    DecodeChannelNamePipe,
    DecodeEqTypePipe,
    SystemInfoCardComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HighchartsChartModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatTooltipModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
