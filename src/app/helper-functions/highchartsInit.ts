export const options: Highcharts.Options = {
  chart: {
    zooming: {
      type: 'x'
    },
    type: 'spline',
  },
  // boost: {
  //   enabled: true,
  //   useGPUTranslations: true
  // },
  accessibility: { enabled: false },
  title: {
    text: 'Measurements graph'
  },
  subtitle: {
    text: 'First measurement'
  },
  tooltip: {
    headerFormat: '<b>{point.x:,.0f}</b> Hz<br/>',
    // pointFormat: '<span style="color:{series.color}">{series.name}</span>: <b>{point.y}</b><br/>',
    valueDecimals: 1,
    valueSuffix: ' Db',
  },
  xAxis: {
    min: 20,
    max: 20000,
    title: { text: 'Frequency (Hz)' },
    crosshair: true,
    accessibility: {
      description: 'Frequency'
    },
    type: "logarithmic"
  },

  yAxis: {
    min: -20,
    max: 25,
    crosshair: true,
    title: { text: 'Values (dB)' },

    // tickInterval: 5,
    // minorTickInterval: 5
  },

  legend: {
    enabled: false
  }
}

export const seriesOptions: Highcharts.SeriesOptionsType[] = [
  {
    data: [],
    type: 'line',

    lineWidth: 0.8,
    showInNavigator: true,
    dashStyle: 'Solid',
    zones: [
      {
        value: -10,
        color: '#f79d5c'
      },
      {
        value: 5,
        color: '#719f20'
      },
      {
        value: 10,
        color: '#d98f52'
      },
      {
        value: 20,
        color: '#ff0000'
      },
      {
        color: '#c93737'
      },
    ],
    // allowPointSelect: true,

  },
  {
    data: [],
    dashStyle: 'Dot',
    lineWidth: 0.7,
    type: 'spline',
    name: 'Subwoofer',
    color: 'black',
  }
];
