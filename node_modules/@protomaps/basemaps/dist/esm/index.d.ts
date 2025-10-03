import { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';

interface Flavor {
    background: string;
    earth: string;
    park_a: string;
    park_b: string;
    hospital: string;
    industrial: string;
    school: string;
    wood_a: string;
    wood_b: string;
    pedestrian: string;
    scrub_a: string;
    scrub_b: string;
    glacier: string;
    sand: string;
    beach: string;
    aerodrome: string;
    runway: string;
    water: string;
    zoo: string;
    military: string;
    tunnel_other_casing: string;
    tunnel_minor_casing: string;
    tunnel_link_casing: string;
    tunnel_major_casing: string;
    tunnel_highway_casing: string;
    tunnel_other: string;
    tunnel_minor: string;
    tunnel_link: string;
    tunnel_major: string;
    tunnel_highway: string;
    pier: string;
    buildings: string;
    minor_service_casing: string;
    minor_casing: string;
    link_casing: string;
    major_casing_late: string;
    highway_casing_late: string;
    other: string;
    minor_service: string;
    minor_a: string;
    minor_b: string;
    link: string;
    major_casing_early: string;
    major: string;
    highway_casing_early: string;
    highway: string;
    railway: string;
    boundaries: string;
    bridges_other_casing: string;
    bridges_minor_casing: string;
    bridges_link_casing: string;
    bridges_major_casing: string;
    bridges_highway_casing: string;
    bridges_other: string;
    bridges_minor: string;
    bridges_link: string;
    bridges_major: string;
    bridges_highway: string;
    roads_label_minor: string;
    roads_label_minor_halo: string;
    roads_label_major: string;
    roads_label_major_halo: string;
    ocean_label: string;
    subplace_label: string;
    subplace_label_halo: string;
    city_label: string;
    city_label_halo: string;
    state_label: string;
    state_label_halo: string;
    country_label: string;
    address_label: string;
    address_label_halo: string;
    regular?: string;
    bold?: string;
    italic?: string;
    pois?: Pois;
    landcover?: Landcover;
}
interface Pois {
    blue: string;
    green: string;
    lapis: string;
    pink: string;
    red: string;
    slategray: string;
    tangerine: string;
    turquoise: string;
}
interface Landcover {
    barren: string;
    farmland: string;
    forest: string;
    glacier: string;
    grassland: string;
    scrub: string;
    urban_area: string;
}
declare const LIGHT: Flavor;
declare const DARK: Flavor;
declare const WHITE: Flavor;
declare const GRAYSCALE: Flavor;
declare const BLACK: Flavor;

declare function get_country_name(lang: string, script?: string): (string | (string | string[])[] | {
    "text-font": (string | string[])[];
} | {
    "text-font"?: undefined;
})[];
declare function get_multiline_name(lang: string, script?: string, regular?: string): (string | (string | (string | (string | string[])[] | {
    "text-font": (string | string[])[];
} | {
    "text-font"?: undefined;
})[] | (string | (string | {
    "text-font"?: undefined;
} | (string | (string | (string | string[])[])[])[] | {
    "text-font": (string | (string | string[])[])[];
})[])[])[] | (string | (string | (string | string[])[] | {
    "text-font": (string | (string | string[])[])[];
} | {
    "text-font"?: undefined;
})[] | (string | (string | (string | (string | string[])[])[])[] | (string | (string | string[])[] | {
    "text-font": (string | (string | string[])[])[];
} | {
    "text-font"?: undefined;
})[])[])[])[];
declare const language_script_pairs: {
    lang: string;
    full_name: string;
    script: string;
}[];

declare function namedFlavor(name: string): Flavor;
declare function layers(source: string, flavor: Flavor, options?: {
    labelsOnly?: boolean;
    lang?: string;
}): LayerSpecification[];

export { BLACK, DARK, type Flavor, GRAYSCALE, LIGHT, type Pois, WHITE, get_country_name, get_multiline_name, language_script_pairs, layers, namedFlavor };
