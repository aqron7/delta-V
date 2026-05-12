export const G = 6.674e-11;            // m³ kg⁻¹ s⁻²
export const GM_SUN = 1.327124e20;     // m³/s²
export const AU = 1.496e11;            // m
export const DAY = 86400;              // s

export const BODIES = {
  mercury: { GM: 2.203e13, radius: 2.44e6,  sma: 0.387 * AU, period: 87.97   },
  venus:   { GM: 3.249e14, radius: 6.05e6,  sma: 0.723 * AU, period: 224.7   },
  earth:   { GM: 3.986e14, radius: 6.371e6, sma: 1.000 * AU, period: 365.25  },
  mars:    { GM: 4.283e13, radius: 3.39e6,  sma: 1.524 * AU, period: 686.97  },
  jupiter: { GM: 1.267e17, radius: 71.49e6, sma: 5.203 * AU, period: 4332.59 },
};

export const PARKING_ORBIT = {
  earth: 200e3,
  mars:  100e3,
};
