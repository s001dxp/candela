function coerceValue (value, coerceToType) {
  // What type should we coerce this value to?
  if (!coerceToType) {
    // No type specified - this is a magic
    // mode that bins by native data type
    if (parseFloat(value) === parseInt(value)) {
      value = 'integer';
    } else {
      value = typeof value;
    }
  } else if (coerceToType === 'boolean') {
    value = !!value;
  } else if (coerceToType === 'integer') {
    value = parseInt(value);
  } else if (coerceToType === 'number') {
    value = parseFloat(value);
  } else if (coerceToType === 'string') {
    value = String(value);
  } else if (coerceToType === 'date') {
    // TODO: apply smarter date coercion in the vein of the stuff below

    /* if (typeof value === 'integer') {
      var digits = Math.log10(value);
      if (value > 999 && value < 3000) {
        // An integer with the above range is probably a year
        dateValue = new Date(value, 0, 0);
      } else if (digits >= 9 && digits <= 15) {
        // Most millisecond date values should be between 9 and 15 digits
        // (this will miss some dates in 1969/1970, and beyond 5000AD and 1000BC)
        dateValue = new Date(value);
      }
    } else if (typeof value === 'string') {
      // Try to convert from a string
      dateValue = new Date(value);
    } */
    value = new Date(value);
  }
  // Otherwise, coerceToType is 'object' - default
  // behavior is simply to pass the value through unchanged

  return value;
}

function stringToByteArray (value, offset, limit, defaultChar) {
  offset = offset || 0;
  limit = limit === undefined ? value.length - offset : limit;
  defaultChar = defaultChar || 0;
  var result = [];
  for (var i = offset; i < offset + limit; i += 1) {
    if (i >= value.length) {
      result.push(defaultChar);
    } else {
      result.push(value.charCodeAt(i));
    }
  }
  return result;
}

var UTF_BASE = Math.pow(2, 16);

function byteArrayToNumber (value) {
  var result = 0;
  value.forEach(function (d, i) {
    result += Math.pow(UTF_BASE, value.length - i - 1) * d;
  });
  return result;
}

function numberToByteArray (value) {
  var result = [];
  var digits = Math.ceil(Math.log(value) / Math.log(UTF_BASE));
  for (var i = digits - 1; i >= 0; i -= 1) {
    var divisor = Math.pow(UTF_BASE, i);
    var byte = Math.floor(value / divisor);
    value -= byte * divisor;
    result.push(byte);
  }
  return result;
}

function byteArrayToString (value) {
  var result = '';
  value.forEach(function (b) {
    result += String.fromCharCode(b);
  });
  return result;
}

function createBins (coerceToType, numBins, lowBound, highBound) {
  // Create:
  // 1. a list of bins with raw boundary values, plus a human-readable label
  // 2. a dictionary that looks up those bins by its human-readable label

  var sigFigs = 3;
  // sigFigs refers to the minimum number of significant
  // characters / digits that each bin label must have so that they
  // can be distinguished in the human-readable label. Note that
  // if you want to increase this beyond 3, you will need to
  // rework the string binning logic (javascript can't represent
  // integers larger than 2^53 without corruption - using more
  // than three UTF-16 characters will break that limit)

  lowBound = coerceValue(lowBound, coerceToType);
  highBound = coerceValue(highBound, coerceToType);

  var bin;
  var bins = [];
  var lookup = {};
  var step;
  var i;
  if (coerceToType === 'integer' || coerceToType === 'number' ||
      coerceToType === 'date') {
    // TODO: smarter date binning
    step = (highBound - lowBound) / numBins;
    // Get significant digits in terms of the step value; we know that
    // this will always be enough to distinguish between each boundary value
    var base = Math.pow(Math.floor(Math.log10(Math.abs(step))) - (sigFigs - 1));
    for (i = 0; i < numBins; i += 1) {
      // Create the bins with raw boundary values
      bin = {
        lowBound: lowBound + i * step,
        highBound: highBound + (i + 1) * step
      };
      bin.humanLabel = '[' + (Math.floor(bin.lowBound / base) * base) + ' - ';
      if (i === numBins - 1) {
        bin.humanLabel += (Math.ceil(highBound / base) * base) + ']';
      } else {
        bin.humanLabel += (Math.floor(bin.highBound / base) * base) + ')';
      }
      lookup[bin.humanLabel] = bins.length;
      bins.push(bin);
    }
  } else if (coerceToType === 'string' || coerceToType === 'object') {
    // Objects are treated as strings for the sake of binning
    lowBound = String(lowBound);
    highBound = String(highBound);
    var charOffset = 0;
    var charLimit = sigFigs;

    var lowBytes = stringToByteArray(lowBound);
    var highBytes = stringToByteArray(highBound);

    // When we need to extend strings, attempt to use familiar
    // characters from the actual data
    var lowChar = Math.min.apply(null, lowBytes.concat(highBytes));
    var highChar = Math.max.apply(null, lowBytes.concat(highBytes));

    // Which is the last index with a common character?
    while (charOffset < lowBytes.length &&
           charOffset < highBytes.length &&
           lowBytes[charOffset] === highBytes[charOffset]) {
      charOffset += 1;
    }
    var stem = lowBound.slice(0, charOffset);

    // To compute raw boundary values, we need the number corresponding
    // to the slice of the string that we've identified. Where
    // strings are too short, extend them by the lowest / highest
    // observed character
    var rawLowBound = stringToByteArray(lowBound, charOffset, charLimit, lowChar);
    rawLowBound = byteArrayToNumber(rawLowBound);
    var rawHighBound = stringToByteArray(highBound, charOffset, charLimit, highChar);
    rawHighBound = byteArrayToNumber(rawHighBound);

    // Now that we have numbers to play with, we can split the
    // range up into bins using math!
    step = (rawHighBound - rawLowBound) / numBins;
    for (i = 0; i < numBins; i += 1) {
      bin = {
        lowBound: numberToByteArray(rawLowBound + i * step),
        highBound: numberToByteArray(rawLowBound + (i + 1) * step)
      };
      // Convert the byte arrays back into strings
      bin.lowBound = stem + byteArrayToString(bin.lowBound);
      bin.highBound = stem + byteArrayToString(bin.highBound);
      bin.humanLabel = '[' + bin.lowBound + ' - ';
      if (i === numBins - 1) {
        // The original high bound may have been
        // corrupted slightly because of rounding;
        // because the highest bound is inclusive
        // (unlike the other bins), restore the original
        // (but keep it short)
        bin.highBound = highBound.slice(0, charOffset + charLimit);
        bin.humanLabel += bin.highBound + ']';
      } else {
        bin.humanLabel += bin.highBound + ')';
      }
      lookup[bin.humanLabel] = bins.length;
      bins.push(bin);
    }
  } else if (coerceToType === 'boolean') {
    // These are kind of silly, but they'll
    // work because of the >= lowBound check
    bins = [
      {
        lowBound: false,
        highBound: false,
        humanLabel: 'False'
      },
      {
        lowBound: true,
        highBound: true,
        humanLabel: 'True'
      }
    ];
    lookup = {
      'False': 0,
      'True': 1
    };
  } else {
    throw new Error('Can\'t create ordinal bins for type ' + coerceToType);
  }

  return {
    bins: bins,
    lookup: lookup
  };
}

function findBinLabel (value, coerceToType, lowBound, highBound, specialBins, ordinalBins) {
  // Given a value (we assume it's already been coerced into its desired
  // form), find the human-readable label of the bin that the value belongs in

  // In the case that coerceToType is 'object', we still want
  // to stringify it so that we return something hashable
  // (unless there's a custom toString(), we'll get '[object Object]',
  // which, for the purposes of binning, is still just fine)
  if (coerceToType === 'object') {
    value = String(value);
  }

  // Is the value a special value (always emit the value directly)?
  if (value === undefined || value === 'undefined') {
    return 'undefined';
  } else if (value === null || value === 'null') {
    return 'null';
  } else if (typeof value === 'number' && isNaN(value)) {
    return 'NaN';
  } else if (value === Infinity) {
    return 'Infinity';
  } else if (value === -Infinity) {
    return '-Infinity';
  } else if (value === '') {
    return '"" (empty string)';
  } else if (specialBins.indexOf(value) !== -1) {
    return value;
  }

  if (!ordinalBins) {
    // If we're being categorical, just return the value itself.
    // An external step is responsible for preventing too many
    // categorical values (e.g. the reduce step). TODO: if we
    // implement the fancier 2-pass idea in histogram_reduce.js,
    // then we SHOULD do something different here
    return value;
  } else {
    // Find which ordinal bin the value belongs to
    for (var i = 0; i < ordinalBins.length; i += 1) {
      // Does the value fit in this bin?
      if (value >= ordinalBins[i].lowBound &&
          value < ordinalBins[i].highBound) {
        return ordinalBins[i].humanLabel;
      }
    }
    // Corner case: the highest value is inclusive
    if (value <= ordinalBins[ordinalBins.length - 1].highBound) {
      return ordinalBins[ordinalBins.length - 1].humanLabel;
    }
    // Okay, the value didn't make it into any of the ordinal bins.
    // The bins must not include the full range of the data.
    return 'other';
  }
}

var es6exports = { // eslint-disable-line no-unused-vars
  coerceValue: coerceValue,
  createBins: createBins,
  findBinLabel: findBinLabel
};
