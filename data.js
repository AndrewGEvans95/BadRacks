/* Bad Racks Seattle — sample catalog data.
 * `grade` is an editorial severity score: F = actively hostile, C- = merely annoying.
 * Everything in here is bad — that's the point. */
const racks = [
  {
    id: 1,
    nickname: "The Avalanche",
    neighborhood: "Capitol Hill",
    address: "400 Pine St, Seattle, WA 98101",
    description: "Wave rack bolted into a 12-degree slope beside a coffee shop. Every bike slowly migrates toward the street. At peak hours you'll find six bikes leaning on the last one like dominoes.",
    type: "Wave Rack",
    grade: "F",
    lat: 47.6113,
    lng: -122.3359
  },
  {
    id: 2,
    nickname: "The Hostage",
    neighborhood: "Fremont",
    address: "3501 Fremont Ave N, Seattle, WA 98103",
    description: "Technically present, but sandwiched between a utility pole and a sandwich-board sign. You can fit half a bike in the remaining gap. The other half lives in the bike lane.",
    type: "Blocked",
    grade: "D",
    lat: 47.6510,
    lng: -122.3500
  },
  {
    id: 3,
    nickname: "The Wobbler",
    neighborhood: "Ballard",
    address: "5404 Ballard Ave NW, Seattle, WA 98107",
    description: "Staple rack installed with only one anchor bolt properly seated. The whole unit rocks four inches side to side. Locking up feels less like parking and more like a hostage negotiation.",
    type: "Staple Too Loose",
    grade: "D-",
    lat: 47.6669,
    lng: -122.3837
  },
  {
    id: 4,
    nickname: "The Submarine",
    neighborhood: "South Lake Union",
    address: "333 Westlake Ave N, Seattle, WA 98109",
    description: "Installed flush against the building wall with zero clearance for panniers or handlebars. To use it you'd need to remove your front wheel, your dignity, and your will to live.",
    type: "Wrong Orientation",
    grade: "F",
    lat: 47.6234,
    lng: -122.3378
  },
  {
    id: 5,
    nickname: "The Obstacle Course",
    neighborhood: "Pioneer Square",
    address: "102 1st Ave S, Seattle, WA 98104",
    description: "Six-rack cluster planted dead-center on a five-foot sidewalk. Pedestrians are forced into the street to pass. Often unused — cyclists don't want the confrontation.",
    type: "Sidewalk Obstacle",
    grade: "D+",
    lat: 47.6015,
    lng: -122.3343
  },
  {
    id: 6,
    nickname: "The Unicorn Trap",
    neighborhood: "University District",
    address: "4219 University Way NE, Seattle, WA 98105",
    description: "Located inside a gated courtyard that's locked after 5pm and all weekend. The city installed it in 2019. It has never once been accessible during peak cycling hours.",
    type: "Inaccessible",
    grade: "F",
    lat: 47.6584,
    lng: -122.3137
  },
  {
    id: 7,
    nickname: "The Ghost Rack",
    neighborhood: "Queen Anne",
    address: "600 Queen Anne Ave N, Seattle, WA 98109",
    description: "Wave rack so corroded and warped that none of the curves align with standard tubing. Lock up and your bike either slides free or your U-lock jams in at a 45-degree angle.",
    type: "Wave Rack",
    grade: "D-",
    lat: 47.6252,
    lng: -122.3564
  },
  {
    id: 8,
    nickname: "The Phantom",
    neighborhood: "Belltown",
    address: "2115 4th Ave, Seattle, WA 98121",
    description: "Listed on the city's bike-parking map. Does not exist in the physical world. At the listed coordinates there is a planter box and a very confused pigeon.",
    type: "Inaccessible",
    grade: "F",
    lat: 47.6145,
    lng: -122.3433
  },
  {
    id: 9,
    nickname: "The Tilt-a-Whirl",
    neighborhood: "Columbia City",
    address: "4861 Rainier Ave S, Seattle, WA 98118",
    description: "Staple rack installed with the cross-bar running vertically — rotated exactly 90 degrees from correct. You can lock to it if you're willing to tip your bike fully on its side.",
    type: "Wrong Orientation",
    grade: "C-",
    lat: 47.5593,
    lng: -122.2896
  },
  {
    id: 10,
    nickname: "The Warlord",
    neighborhood: "Beacon Hill",
    address: "2821 Beacon Ave S, Seattle, WA 98144",
    description: "Four staple racks bolted so close together that only one can be used at a time. Unlocking yours requires removing your neighbor's bike first. Diplomacy not included.",
    type: "Blocked",
    grade: "D",
    lat: 47.5742,
    lng: -122.3130
  }
];
