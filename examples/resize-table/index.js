import candela from 'candela';
import 'candela/plugins/vega/load';
import 'candela/plugins/mixin/load';

import html from './index.jade';
import './index.styl';

let data = [];
for (let i = 0; i < 100; i += 1) {
  data.push({x: Math.random(), y: Math.random()});
}

window.onload = () => {
  document.body.innerHTML = html();

  let el = document.getElementById('vis-element');
  let vis = new (candela.mixins.AutoResize(candela.mixins.InitSize(candela.components.ScatterPlot)))(el, {
    data,
    x: 'x',
    y: 'y'
  });
  console.log(`initial size: ${vis.width}, ${vis.height}`);
  vis.render();

  vis.on('resize', () => {
    console.log(`resize event: ${vis.width}, ${vis.height}`);
  });

  let callback = () => {
    let table = document.getElementById('containing-table');
    if (table) {
      table.style.width = (500 + Math.floor(Math.random() * 500)) + 'px';
      window.setTimeout(callback, 1000);
    }
  };

  callback();
};
