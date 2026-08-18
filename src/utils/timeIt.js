export function timeIt(fn, n, label) {
  const t0 = performance.now();

  for (let i = 0; i < n; i++) fn();
  
  const dt = (performance.now() - t0) / n;
  
  const [mul, unit] = dt > 1 ? [1, 'ms'] : (dt > .001 ? [1_000, 'us'] : [1_000_000, 'ns']); 
  
  console.log(label, mul * dt, unit);
  
  return dt;
}