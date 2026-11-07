/*
 * The Level meter demo: a simulated voice (a stand-in AnalyserNode, so the
 * page needs no microphone), a button that makes it too loud, a muted
 * state, the variants (segmented, vertical) and tones, and a real
 * microphone check behind a button (the browser asks first). Registered
 * through SG.demo() (styleguide/sg-core.js). Size, density and shape come
 * from the options panel.
 */

/* A stand-in for an AnalyserNode: a tone whose loudness follows syllables. */
function voice(loudness) {
  var start = performance.now();
  return {
    fftSize: 1024,
    loud: false,
    getFloatTimeDomainData: function (buffer) {
      var time = (performance.now() - start) / 1000;
      // Syllables of about 180ms, words with short pauses between them.
      var syllable = Math.max(0, Math.sin(time * 17)) * (0.55 + 0.45 * Math.sin(time * 2.3));
      var pause = Math.sin(time * 0.9) > -0.6 ? 1 : 0.04;
      var amplitude = this.loud ? 1 : loudness * syllable * pause + 0.004;
      for (var i = 0; i < buffer.length; i += 1) buffer[i] = amplitude * Math.sin(i * 0.21 + time * 40);
    },
  };
}

function meter(h, opts) {
  opts = opts || {};
  var label = h.uid('level');
  return '<div class="ds-levelmeter' + (opts.cls ? ' ' + opts.cls : '') + '" data-ds-levelmeter' + (opts.demo ? ' data-demo="' + opts.demo + '"' : '') + (opts.style ? ' style="' + opts.style + '"' : '') + '>' +
    '<span class="ds-levelmeter__label" id="' + label + '">' + h.esc(opts.label || 'Microphone') + '</span>' +
    '<div class="ds-levelmeter__track" role="meter" aria-labelledby="' + label + '" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"' + (opts.muted ? ' aria-disabled="true"' : '') + '>' +
      '<span class="ds-levelmeter__fill"></span><span class="ds-levelmeter__peak"></span>' +
    '</div>' +
    '<span class="ds-levelmeter__note" aria-live="polite">' + (opts.note || '') + '</span>' +
  '</div>';
}

SG.demo('levelmeter', {
  title: 'Level meter',
  group: 'feedback',
  need: 'Show the live level of a microphone, with a peak and a word when it is too loud',
  lead: 'The page supplies an AnalyserNode (or its own values); the meter rises at once, falls smoothly, holds its peak, and says "Too loud" in words.',
  options: { sizes: true, density: true, shape: true, tones: ['primary', 'success', 'info'] },

  render: function (h) {
    var tone = h.tone ? ' ds-tone-' + h.tone : '';
    return h.section('A voice',
      '<div style="display: grid; gap: var(--ds-space-4); max-inline-size: 420px;">' +
        meter(h, { demo: 'voice', cls: tone.trim(), label: 'Microphone (simulated voice)' }) +
        '<div class="sg-row">' +
          '<button class="ds-btn ds-sm" type="button" data-demo="pause" aria-pressed="false">' + h.icon('pause', 16) + 'Pause</button>' +
          '<button class="ds-btn ds-sm" type="button" data-demo="shout">' + h.icon('volume', 16) + 'Too loud for a moment</button>' +
        '</div>' +
      '</div>', 'Syllables and pauses: the bar rises at once and falls over --ds-dur-glide; the peak holds, then falls. Loud turns red and says it.') +

      h.section('Segmented and vertical',
        '<div class="sg-row" style="align-items: end; gap: var(--ds-space-8);">' +
          '<div style="inline-size: 280px;">' + meter(h, { cls: 'ds-levelmeter--segmented' + tone, demo: 'segmented', label: 'Input level' }) + '</div>' +
          meter(h, { cls: 'ds-levelmeter--vertical' + tone, demo: 'vertical', label: 'Left' }) +
          meter(h, { cls: 'ds-levelmeter--vertical ds-levelmeter--segmented' + tone, demo: 'vertical2', label: 'Right' }) +
        '</div>') +

      h.section('Muted',
        '<div style="max-inline-size: 420px;">' + meter(h, { muted: true, label: 'Microphone, muted', note: 'Muted: unmute to check your microphone.' }) + '</div>',
        'aria-disabled="true" on the track (the page\'s): the disabled model and no level; the label and the note say why.') +

      h.section('Your microphone',
        '<div style="display: grid; gap: var(--ds-space-4); max-inline-size: 420px;">' +
          meter(h, { demo: 'mic', cls: 'ds-levelmeter--segmented', label: 'Your microphone' }) +
          '<div class="sg-row"><button class="ds-btn ds-btn--tonal ds-sm" type="button" data-demo="mic-start">' + h.icon('mic', 16) + 'Test your microphone</button>' +
          '<button class="ds-btn ds-sm" type="button" data-demo="mic-stop" hidden>' + h.icon('micOff', 16) + 'Stop</button></div>' +
        '</div>', 'getUserMedia, an AudioContext and an AnalyserNode: DS.levelmeter.create(el, { analyser }). Nothing leaves the page.');
  },

  wire: function (root, h) {
    /* The controller of a meter; DS.init() of the new markup first, as its observer may not have run yet. */
    var controller = function (el) {
      if (!DS.core.get(el, 'levelmeter')) DS.init(el);
      return DS.core.get(el, 'levelmeter');
    };
    var meters = {};
    ['voice', 'segmented', 'vertical', 'vertical2'].forEach(function (name, index) {
      var el = h.$('[data-demo="' + name + '"]', root);
      var signal = voice([0.25, 0.18, 0.3, 0.22][index]);
      meters[name] = { signal: signal, stop: controller(el).listen(signal) };
    });
    var pause = h.$('[data-demo="pause"]', root);
    pause.addEventListener('click', function () {
      var paused = pause.getAttribute('aria-pressed') !== 'true';
      pause.setAttribute('aria-pressed', String(paused));
      var meterEl = h.$('[data-demo="voice"]', root);
      if (paused) meters.voice.stop();
      else meters.voice.stop = controller(meterEl).listen(meters.voice.signal);
    });
    h.$('[data-demo="shout"]', root).addEventListener('click', function () {
      meters.voice.signal.loud = true;
      setTimeout(function () { meters.voice.signal.loud = false; }, h.slow(800));
    });

    var mic = null;
    var startBtn = h.$('[data-demo="mic-start"]', root);
    var stopBtn = h.$('[data-demo="mic-stop"]', root);
    var stopMic = function () {
      if (!mic) return;
      mic.stop();
      mic.stream.getTracks().forEach(function (track) { track.stop(); });
      mic.context.close();
      mic = null;
      startBtn.hidden = false;
      stopBtn.hidden = true;
    };
    startBtn.addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        h.toast('This browser offers no microphone here', 'error');
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        var context = new AudioContext();
        var analyser = context.createAnalyser();
        context.createMediaStreamSource(stream).connect(analyser);
        mic = { stream: stream, context: context, stop: controller(h.$('[data-demo="mic"]', root)).listen(analyser) };
        startBtn.hidden = true;
        stopBtn.hidden = false;
      }, function () { h.toast('No microphone, or no permission', 'error'); });
    });
    stopBtn.addEventListener('click', stopMic);
    return function () {
      Object.keys(meters).forEach(function (name) { meters[name].stop(); });
      stopMic();
    };
  },
});
