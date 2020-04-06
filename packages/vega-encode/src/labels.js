import {Symbols, Discrete} from './legend-types';
import {tickFormat, tickValues} from './ticks';
import {peek} from 'vega-util';
import {Log, Quantile, Quantize, Threshold, tickFormat as spanFormat, Time, UTC} from 'vega-scale';

const symbols = {
  [Quantile]: 'quantiles',
  [Quantize]: 'thresholds',
  [Threshold]: 'domain'
};

const formats = {
  [Quantile]: 'quantiles',
  [Quantize]: 'domain'
};

export function labelValues(scale, count) {
  return scale.bins
    ? binValues(scale.bins)
    : scale.type === Log
    ? logValues(scale, count)
    : symbols[scale.type]
    ? thresholdValues(scale[symbols[scale.type]]())
    : tickValues(scale, count);
}

function logValues(scale, count) {
  const ticks = tickValues(scale, count);
  const base = scale.base();
  const logb = Math.log(base);
  const k = Math.max(1, (base * count) / ticks.length);

  // apply d3-scale's log format filter criteria
  return ticks.filter(d => {
    let i = d / Math.pow(base, Math.round(Math.log(d) / logb));
    if (i * base < base - 0.5) i *= base;
    return i <= k;
  });
}

export function thresholdFormat(scale, specifier) {
  const _ = scale[formats[scale.type]]();
  const n = _.length;
  let d = n > 1 ? _[1] - _[0] : _[0];
  let i;

  for (i = 1; i < n; ++i) {
    d = Math.min(d, _[i] - _[i - 1]);
  }

  // 3 ticks times 10 for increased resolution
  return spanFormat(0, d, 3 * 10, specifier);
}

function thresholdValues(thresholds) {
  const values = [-Infinity].concat(thresholds);
  values.max = +Infinity;

  return values;
}

function binValues(bins) {
  const values = bins.slice(0, -1);
  values.max = peek(bins);

  return values;
}

function isDiscreteRange(scale) {
  return symbols[scale.type] || scale.bins;
}

export function labelFormat(scale, count, type, specifier, formatType, noSkip) {
  const format =
    formats[scale.type] && formatType !== Time && formatType !== UTC
      ? thresholdFormat(scale, specifier)
      : tickFormat(scale, count, specifier, formatType, noSkip);

  return type === Symbols && isDiscreteRange(scale)
    ? formatRange(format)
    : type === Discrete
    ? formatDiscrete(format)
    : formatPoint(format);
}

function formatRange(format) {
  return function (value, index, array) {
    const limit = get(array[index + 1], get(array.max, +Infinity));
    const lo = formatValue(value, format);
    const hi = formatValue(limit, format);
    return lo && hi ? lo + ' \u2013 ' + hi : hi ? '< ' + hi : '\u2265 ' + lo;
  };
}

function get(value, dflt) {
  return value != null ? value : dflt;
}

function formatDiscrete(format) {
  return function (value, index) {
    return index ? format(value) : null;
  };
}

function formatPoint(format) {
  return function (value) {
    return format(value);
  };
}

function formatValue(value, format) {
  return Number.isFinite(value) ? format(value) : null;
}

export function labelFraction(scale) {
  const domain = scale.domain();
  const count = domain.length - 1;
  let lo = +domain[0];
  let hi = +peek(domain);
  let span = hi - lo;

  if (scale.type === Threshold) {
    const adjust = count ? span / count : 0.1;
    lo -= adjust;
    hi += adjust;
    span = hi - lo;
  }

  return function (value) {
    return (value - lo) / span;
  };
}
