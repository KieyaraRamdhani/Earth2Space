const POWER = 'https://power.larc.nasa.gov/api/temporal/monthly/point';
export async function getPowerSeries(site, start='201501', end=new Date().toISOString().slice(0,7).replace('-','')) {
  const params = new URLSearchParams({
    parameters:'T2M,PRECTOTCORR,WS10M',
    community:'RE',
    longitude:String(site.lon),
    latitude:String(site.lat),
    start, end, format:'JSON'
  });
  const response = await fetch(`${POWER}?${params}`);
  if (!response.ok) throw new Error(`NASA POWER returned ${response.status}`);
  const json = await response.json();
  const properties = json?.properties?.parameter || {};
  const temperature = properties.T2M || {};
  const rainfall = properties.PRECTOTCORR || {};
  const wind = properties.WS10M || {};
  const keys = Object.keys(temperature).filter(k => Number.isFinite(Number(temperature[k])) && Number(temperature[k]) > -900).sort();
  return keys.map(k => ({
    month:`${k.slice(0,4)}-${k.slice(4,6)}`,
    temperature:Number(temperature[k]),
    rainfall:Number(rainfall[k]) > -900 ? Number(rainfall[k]) : null,
    wind:Number(wind[k]) > -900 ? Number(wind[k]) : null
  }));
}
export function linearTrend(rows, key) {
  const values = rows.filter(r => Number.isFinite(r[key]));
  if (values.length < 3) return {slope:null, r2:null, n:values.length};
  const xs=values.map((_,i)=>i), ys=values.map(r=>r[key]);
  const xm=xs.reduce((a,b)=>a+b,0)/xs.length, ym=ys.reduce((a,b)=>a+b,0)/ys.length;
  const numerator=xs.reduce((s,x,i)=>s+(x-xm)*(ys[i]-ym),0);
  const denominator=xs.reduce((s,x)=>s+(x-xm)**2,0);
  const slope=numerator/denominator;
  const intercept=ym-slope*xm;
  const ssTot=ys.reduce((s,y)=>s+(y-ym)**2,0);
  const ssRes=ys.reduce((s,y,i)=>s+(y-(intercept+slope*xs[i]))**2,0);
  return {slope, r2:ssTot ? 1-ssRes/ssTot : 0, n:values.length};
}
