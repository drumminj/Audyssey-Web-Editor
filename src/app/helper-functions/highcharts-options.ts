import { Point } from "highcharts";
 
export const options: Highcharts.Options = {
  // Avoid the chart scaling down to an unreasonable height for a fixed
  // aspect ratio
  responsive: {
    rules: [{
      chartOptions: {
        chart: {
          height: 280
        }
      },
      condition: {
        maxWidth: 500
      }
    }]
  },
  chart: {
    height: (9 / 16 * 100) + '%', // 16:9 ratio
    zooming: {
      type: 'x',
    },
    panKey: 'shift',
    panning: {
      enabled: true,
      type: 'x'
    },
    type: 'spline',
  },
  boost: {
    // allowForce: true,
    pixelRatio: 1, // 2 makes that graph sharper but line width become 0.5
    seriesThreshold: 1,
    useGPUTranslations: true
  },
  exporting: {
    menuItemDefinitions: {
      xScale: {
        text: '&nbsp;&nbsp; Toggle linear/log scale'
      },
      graphSmoothing: {
        text: '&nbsp;&nbsp; Graph smoothing'
      }
    },
    buttons: {
      contextButton: {
        menuItems: ['xScale', 'graphSmoothing']
      },
    },
    chartOptions: {
      title: {
        style: {
          fontFamily: 'Roboto, Arial, sans-serif',
          fontSize: '22px'
        }
      },
      credits: {
        enabled: false
      }
    }
  },
  accessibility: { enabled: false },
  title: {
    text: '_' // use something that will allocate space for context menu button but not be useful
  },
  tooltip: {
    headerFormat: '',
    pointFormat: '',
    valueDecimals: 1,
    useHTML: true,
  },
  xAxis: {
    min: 10,
    max: 24000,
    type: 'logarithmic',
    title: { text: 'Frequency (Hz)' },
    crosshair: true,
    accessibility: {
      description: 'Frequency'
    },
  },
  yAxis: {
    min: -20,
    max: 25,
    title: { text: 'Amplitude (dB)' },
    crosshair: true,
  },
  legend: {
    enabled: false
  },
  credits: {
    enabled: false
  }
}


export const seriesOptions: Highcharts.SeriesOptionsType[] = [
  {
    name: 'Measured Response',
    data: [],
    type: 'line',
    lineWidth: 1, // boost module renders only 1px lineWidth
    showInNavigator: false,
    dashStyle: 'Solid',
    zoneAxis: 'y',
    marker: {
      enabled: false,
      states: {
        hover: {
          enabled: true,
        }
      }
    },
    dataGrouping: {
      // doesn't work well on logarithmic scale (and module import required)
      // https://github.com/highcharts/highcharts/issues/20547
      // enabled: true,
      groupPixelWidth: 10
    },
    zones: [
      {
        value: -30,
        color: '#ff0000'
      },
      {
        value: -15,
        color: '#ff0000'
      },
      {
        value: -10,
        color: '#c93737'
      },
      {
        value: -5,
        color: '#f79d5c'
      },
      {
        value: 5,
        color: '#719f20'
      },
      {
        value: 10,
        color: '#f79d5c'
      },
      {
        value: 15,
        color: '#c93737'
      },
      {
        color: '#ff0000'
      },
    ],
    stickyTracking: false,
    tooltip: {
      headerFormat: '<div class="tooltip-header">{series.name}</div>',
      pointFormatter: function(this: Point) {
      const freqStr = this!.x > 1000
        ? `${(this!.x / 1000).toFixed(2)} kHz`
        : `${Math.round(this!.x)} Hz`;
      return `
        <table class="tooltip-data">
          <tr>
            <td>Frequency:</td>
            <td><b>${freqStr}</b></td>
            <td></td>
          </tr>
          <tr>
            <td>Amplitude:</td>
            <td><b>${this!.y! > 0 ? "+" : ""}${this!.y!.toFixed(1)} dB</b></td>
            <td style="color: ${this!.color}">●</td>
          </tr>
        </table>`;
      },
    }
  },
  {
    name: 'Target Curve',
    data: [],
    type: 'spline',
    color: 'blue',
    marker: {
      symbol: 'round'
    },

    dragDrop: {
      draggableY: true,
      draggableX: true,
      dragMaxY: 12, dragMinY: -12,
    },
    stickyTracking: false,
    allowPointSelect: true,

    tooltip: {
      headerFormat: '<div class="tooltip-header">{series.name}</div>',
      pointFormatter: function(this: Point) {
      const freqStr = this!.x > 1000
        ? `${(this!.x / 1000).toFixed(2)} kHz`
        : `${Math.round(this!.x)} Hz`
      return `
        <table class="tooltip-data">
          <tr>
            <td>Frequency:</td>
            <td><b>${freqStr}</b></td>
          </tr>
          <tr>
            <td>Gain:</td>
            <td><b>${this!.y! > 0 ? "+" : ""}${this!.y!.toFixed(1)} dB</b></td>
          </tr>
        </table>`;
      },
    },
  }
];
