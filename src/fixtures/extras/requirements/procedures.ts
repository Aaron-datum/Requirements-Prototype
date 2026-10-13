/** Test procedure sections for Test detail (Setup, Profile, Samples, Acceptance, duration). The dataset has one free-text procedure per test. */
import type { TestProcedure } from './types'

export const PROCEDURES: Record<string, TestProcedure> = {
  'DV-TC-210': { setup: 'Burst-containment rig, turbine housing on production mounts', profile: 'Spin wheel to 120% of maximum design speed', samples: '3 housings', acceptance: 'No rupture, no fragment penetration of the containment ring', durationDays: 10 },
  'DV-TC-211': { setup: 'Thermal bench rig, actuator on a calibrated linkage', profile: 'Full-stroke command, -30 C to 150 C', samples: '8 actuators', acceptance: 'Stroke time within the response limit across the range', durationDays: 6 },
  'DV-TC-212': { setup: 'Thermal chamber, center housing clamped on a fixture', profile: '-30 C to 250 C, 50,000 cycles', samples: '4 housings', acceptance: 'Bearing clearance growth within limit (CMM before and after)', durationDays: 28 },
  'DV-TC-213': { setup: 'Engine dynamometer, instrumented compressor', profile: 'Sweep the full engine map, record surge margin at each rated-boost point', samples: '3 engines', acceptance: 'Surge margin at or above the requirement at every point', durationDays: 8 },
  'DV-TC-214': { setup: 'Calibrated reference pressure source and thermal chamber', profile: '0 to 2.5 bar(a), 5 setpoints, 3 temperatures', samples: '10 sensors', acceptance: 'Output within accuracy band at every setpoint', durationDays: 4 },
  'DV-TC-215': { setup: 'Dyno cell instrumented on the charge-air loop', profile: 'Sustained high-load cycle, continuous temperature logging', samples: '2 engines', acceptance: 'Delta-T above ambient at or below the limit', durationDays: 9 },
  'DV-TC-216': { setup: 'Hydrostatic rig, charge piping assembly capped at both ends', profile: 'Pressurize to 4.5 bar(g) and beyond', samples: '3 assemblies', acceptance: 'No rupture, no joint separation at proof pressure', durationDays: 3 },
  'DV-TC-217': { setup: 'Gas stand, manifold and downpipe on production mounts', profile: '950 C peak gas temperature, 1,500 cycles', samples: '3 assemblies', acceptance: 'No crack propagation (dye penetrant inspection)', durationDays: 21 },
  'DV-TC-218': { setup: 'Calibrated flow bench, 350 bar rail pressure', profile: 'Pulse width 0.3 to 3.0 ms', samples: '12 injectors', acceptance: 'Flow linearity within band across the range', durationDays: 5 },
  'DV-TC-219': { setup: 'Dyno cell, full validation duty cycle', profile: '130 bar peak cylinder pressure', samples: '4 engines', acceptance: 'No crown cracking, ring lands within spec (teardown)', durationDays: 35 },
  'DV-TC-220': { setup: 'Valve actuation rig with a leakage meter', profile: '500 actuation cycles then closed-position leak test', samples: '6 valves', acceptance: 'Leakage below the rated percentage of exhaust mass flow', durationDays: 5 },
  'DV-TC-222': { setup: 'Reference thermocouple and furnace', profile: 'Calibrate 400 to 980 C, then soak at 1000 C', samples: '6 sensors', acceptance: 'Accuracy within band after the accelerated-life soak', durationDays: 14 },
  'DV-TC-223': { setup: 'Feed line on a simulated center-housing fixture', profile: 'Pressurize to 6 bar, measure delivered flow at idle oil temperature', samples: '4 lines', acceptance: 'Delivered flow at or above the minimum', durationDays: 3 },
  'DV-TC-224': { setup: 'Instrumented dynamometer, strain gauges on the crank', profile: 'Full torsional vibration spectrum at rated power', samples: '2 crankshafts', acceptance: 'No crack initiation (strain gauge and periodic NDT)', durationDays: 40 },
  'DV-TC-225': { setup: 'Dyno cell, in-cylinder pressure trace', profile: 'Commanded dwell and energy at pressures equivalent to 2.5 bar(a) boost', samples: '4 coils', acceptance: 'No misfire on the pressure trace', durationDays: 6 },
}
