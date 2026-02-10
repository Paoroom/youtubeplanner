export const DEFAULT_INSTRUMENTS = [
  { id: 'kick', name: 'Kick', shape: 'sphere', freq: 60, pan: 0, stereo: 10, reverb: 20, volume: -3 },
  { id: 'basse', name: 'Basse', shape: 'sphere', freq: 80, pan: 0, stereo: 5, reverb: 15, volume: -4 },
  { id: 'sub', name: 'Sub', shape: 'sphere', freq: 40, pan: 0, stereo: 0, reverb: 5, volume: -5 },
  { id: 'lead', name: 'Lead', shape: 'cone', freq: 3000, pan: 10, stereo: 40, reverb: 80, volume: -6 },
  { id: 'pad', name: 'Pad', shape: 'torus', freq: 800, pan: -5, stereo: 90, reverb: 250, volume: -10 },
  { id: 'vocal', name: 'Vocal', shape: 'cone', freq: 2500, pan: 0, stereo: 20, reverb: 60, volume: -2 },
  { id: 'backvocal', name: 'Back Vocal', shape: 'cone', freq: 2200, pan: -30, stereo: 60, reverb: 150, volume: -10 },
  { id: 'synth', name: 'Synth', shape: 'torus', freq: 1500, pan: 20, stereo: 70, reverb: 100, volume: -8 },
  { id: 'keys', name: 'Keys', shape: 'box', freq: 1000, pan: -25, stereo: 50, reverb: 90, volume: -9 },
  { id: 'piano', name: 'Piano', shape: 'box', freq: 900, pan: 15, stereo: 55, reverb: 110, volume: -8 },
  { id: 'guitare', name: 'Guitare', shape: 'capsule', freq: 1200, pan: -35, stereo: 45, reverb: 70, volume: -7 },
  { id: 'snare', name: 'Snare/Clap', shape: 'cylinder', freq: 200, pan: 0, stereo: 15, reverb: 50, volume: -4 },
  { id: 'hat', name: 'Hat', shape: 'smallsphere', freq: 8000, pan: 20, stereo: 30, reverb: 30, volume: -9 },
];

export function freqToColor(freq) {
  // Grave=orange, Medium=violet, Aigu=cyan
  const logFreq = Math.log2(freq / 20) / Math.log2(20000 / 20); // 0..1
  if (logFreq < 0.35) {
    const t = logFreq / 0.35;
    return lerpColor('#FF6B00', '#B800FF', t);
  } else {
    const t = (logFreq - 0.35) / 0.65;
    return lerpColor('#B800FF', '#00F0FF', t);
  }
}

function lerpColor(a, b, t) {
  const ar = parseInt(a.slice(1, 3), 16), ag = parseInt(a.slice(3, 5), 16), ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16), bg = parseInt(b.slice(3, 5), 16), bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

export function getRecommendations(instruments) {
  const tips = [];
  const active = instruments.filter(i => i.active);

  // Check frequency masking
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      const ratio = Math.max(a.freq, b.freq) / Math.min(a.freq, b.freq);
      if (ratio < 1.3 && Math.abs(a.pan - b.pan) < 20) {
        tips.push({
          type: 'warning',
          text: `${a.name} et ${b.name} sont proches en fréquence (${a.freq}Hz / ${b.freq}Hz) et en pan. Risque de masquage ! Sépare-les en pan ou ajuste l'EQ.`,
        });
      }
    }
  }

  // Bass mono check
  active.filter(i => i.freq < 200).forEach(i => {
    if (i.stereo > 30) {
      tips.push({
        type: 'warning',
        text: `${i.name} (${i.freq}Hz) a une largeur stéréo de ${i.stereo}%. Les basses fréquences devraient rester mono (< 30%).`,
      });
    }
    if (Math.abs(i.pan) > 15) {
      tips.push({
        type: 'warning',
        text: `${i.name} est pannée à ${i.pan}%. Les basses devraient rester centrées.`,
      });
    }
  });

  // Lead/Vocal reverb check
  active.filter(i => i.freq > 1500 && i.reverb < 30).forEach(i => {
    if (i.name.toLowerCase().includes('vocal') || i.name.toLowerCase().includes('lead')) {
      tips.push({
        type: 'tip',
        text: `${i.name} a peu de reverb (${i.reverb}ms). Un peu de reverb courte (40-80ms) peut donner de la présence sans repousser l'élément.`,
      });
    }
  });

  // Volume balance
  const vocals = active.filter(i => i.name.toLowerCase().includes('vocal') && !i.name.toLowerCase().includes('back'));
  vocals.forEach(v => {
    if (v.volume < -8) {
      tips.push({
        type: 'tip',
        text: `Le vocal principal est à ${v.volume}dB — c'est bas. En général le vocal lead est entre -3dB et -6dB.`,
      });
    }
  });

  // Too many elements in center
  const centered = active.filter(i => Math.abs(i.pan) < 10);
  if (centered.length > 4) {
    tips.push({
      type: 'warning',
      text: `${centered.length} éléments sont au centre (pan < 10%). Espace ton mix en étalant certains éléments à gauche/droite.`,
    });
  }

  // Depth check: everything in front
  const allFront = active.filter(i => i.reverb < 50);
  if (allFront.length > active.length * 0.7 && active.length > 3) {
    tips.push({
      type: 'tip',
      text: `La majorité de tes éléments sont très "devant" (reverb < 50ms). Repousse les éléments secondaires en profondeur pour créer de la perspective.`,
    });
  }

  if (tips.length === 0 && active.length > 0) {
    tips.push({ type: 'good', text: 'Le placement semble équilibré. Beau travail !' });
  }

  return tips;
}
