import { NgModule } from '@angular/core';
import { FormsModule } from "@angular/forms";
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
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HighchartsChartModule } from "highcharts-angular";

import { AppComponent } from './app.component';
import { DecodeChannelNamePipe } from 'helper-functions/decode-channel-name.pipe';
import { DecodeCrossoverPipe } from 'helper-functions/decode-crossover.pipe';
import { ChannelInfoPanelComponent } from 'components/channel-info-panel/channel-info-panel.component';
import { SystemInfoCardComponent } from 'components/system-info-card/system-info-card.component';
import { TargetCurveChartCardComponent } from 'components/target-curve-chart-card/target-curve-chart-card.component';
import { TargetCurvePanelComponent } from 'components/target-curve-panel/target-curve-panel.component';
import { TargetCurvePointsComponent } from 'components/target-curve-points/target-curve-points.component';
import { PointsConverterPipe } from 'components/target-curve-points/points-converter.pipe';
import { DecodeEqTypePipe } from 'components/system-info-card/decode-eq-type.pipe';


@NgModule({
  declarations: [
    AppComponent,
    ChannelInfoPanelComponent,
    DecodeChannelNamePipe,
    DecodeCrossoverPipe,
    DecodeEqTypePipe,
    PointsConverterPipe,
    SystemInfoCardComponent,
    TargetCurveChartCardComponent,
    TargetCurvePointsComponent,
    TargetCurvePanelComponent,

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
