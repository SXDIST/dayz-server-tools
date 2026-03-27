export const defaultDayzInitGeneratorState: DayzInitGeneratorState = {
  weather: {
    mode: "fixed",
    disableDynamicWeather: true,
    overcast: "0.1",
    overcastMin: "0.0",
    overcastMax: "0.35",
    rain: "0.0",
    rainMin: "0.0",
    rainMax: "0.2",
    fog: "0.02",
    fogMin: "0.0",
    fogMax: "0.1",
    wind: "8",
    windMin: "0",
    windMax: "18",
    storm: "0.0",
    stormMin: "0.0",
    stormMax: "0.2",
  },
  spawn: {
    mode: "random",
    fixedPosition: "7500 0 7500",
    presetPointName: "NWAF",
    presetPointsText: "NWAF|4700 0 10300\nTisy|1600 0 14100\nDev Coast|13100 0 8300",
    nearObjectClassname: "",
    nearObjectAnchor: "7500 0 7500",
    nearObjectRadius: "150",
    nearObjectOffset: "2 0 2",
  },
  loadout: {
    characterClass: "",
    body: "TShirt_Black",
    legs: "CargoPants_Black",
    feet: "AthleticShoes_Black",
    backpack: "AliceBag_Black",
    vest: "",
    headgear: "",
    gloves: "",
    primaryWeapon: "",
    secondaryWeapon: "",
    meleeWeapon: "FirefighterAxe",
    weaponAttachments: "",
    inventoryItems: "BandageDressing\nCompass\nMap",
    magazines: "",
    foodWater: "Canteen\nTacticalBaconCan",
    medical: "BandageDressing\nTetracyclineAntibiotics",
    extraItems: "",
  },
  helpers: {
    fillStats: true,
    clearAgents: true,
    removeBleedingSources: true,
    cleanBloodyHands: true,
    fixedDateEnabled: false,
    fixedDate: "2026-03-26 12:00",
    grantInfluenzaResistance: true,
    autoEquipLoadout: true,
    giveTestTools: true,
    testTools: "HuntingKnife\nHatchet\nShovel\nCombinationLock4\nGPSReceiver",
  },
  session: {
    loginDelaySeconds: "15",
    logoutDelaySeconds: "15",
  },
  modHooks: {
    includeActiveModsComment: true,
    manualItems: "",
  },
  loadoutPresets: [
    {
      id: "preset-light-debug",
      name: "Light Debug",
      loadout: {
        characterClass: "",
        body: "TShirt_Black",
        legs: "CargoPants_Black",
        feet: "AthleticShoes_Black",
        backpack: "",
        vest: "",
        headgear: "",
        gloves: "",
        primaryWeapon: "",
        secondaryWeapon: "",
        meleeWeapon: "FirefighterAxe",
        weaponAttachments: "",
        inventoryItems: "BandageDressing\nCompass",
        magazines: "",
        foodWater: "Canteen",
        medical: "BandageDressing",
        extraItems: "",
      },
    },
    {
      id: "preset-builder",
      name: "Builder",
      loadout: {
        characterClass: "",
        body: "Hoodie_Black",
        legs: "CargoPants_Black",
        feet: "WorkingBoots_Black",
        backpack: "AliceBag_Black",
        vest: "",
        headgear: "BaseballCap_Black",
        gloves: "WorkingGloves_Black",
        primaryWeapon: "",
        secondaryWeapon: "",
        meleeWeapon: "Hatchet",
        weaponAttachments: "",
        inventoryItems: "BoxOfNails\nWoodenPlank\nMetalWire\nCombinationLock4",
        magazines: "",
        foodWater: "Canteen\nTacticalBaconCan",
        medical: "BandageDressing",
        extraItems: "Shovel\nPickaxe",
      },
    },
    {
      id: "preset-combat",
      name: "Combat Test",
      loadout: {
        characterClass: "",
        body: "CombatJacket_Black",
        legs: "CombatPants_Black",
        feet: "MilitaryBoots_Black",
        backpack: "AssaultBag_Black",
        vest: "PlateCarrierVest",
        headgear: "Mich2001Helmet",
        gloves: "TacticalGloves_Black",
        primaryWeapon: "M4A1",
        secondaryWeapon: "FNX45",
        meleeWeapon: "CombatKnife",
        weaponAttachments: "M4_OEBttstck\nM4_PlasticHndgrd\nReflexOptic\nPistolSuppressor",
        inventoryItems: "Rangefinder\nMap\nCompass\nBandageDressing",
        magazines: "Mag_STANAG_30Rnd\nMag_STANAG_30Rnd\nMag_FNX45_15Rnd",
        foodWater: "Canteen",
        medical: "BandageDressing\nMorphine",
        extraItems: "",
      },
    },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function cloneDayzInitGeneratorState(): DayzInitGeneratorState {
  return clone(defaultDayzInitGeneratorState);
}

export function mergeDayzInitGeneratorState(
  input?: Partial<DayzInitGeneratorState> | null,
): DayzInitGeneratorState {
  const base = cloneDayzInitGeneratorState();

  if (!input) {
    return base;
  }

  return {
    ...base,
    ...input,
    weather: { ...base.weather, ...(input.weather ?? {}) },
    spawn: { ...base.spawn, ...(input.spawn ?? {}) },
    loadout: { ...base.loadout, ...(input.loadout ?? {}) },
    helpers: { ...base.helpers, ...(input.helpers ?? {}) },
    session: { ...base.session, ...(input.session ?? {}) },
    modHooks: { ...base.modHooks, ...(input.modHooks ?? {}) },
    loadoutPresets: Array.isArray(input.loadoutPresets) && input.loadoutPresets.length > 0
      ? input.loadoutPresets.map((preset) => ({
          ...preset,
          loadout: { ...base.loadout, ...preset.loadout },
        }))
      : base.loadoutPresets,
  };
}
