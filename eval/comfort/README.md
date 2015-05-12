# Comfort Level During Activities Survey

 * Data from polling friends and family
 * 62 real datapoints (raw.csv)
   * In cases where multiple subactivities were listed, the row was split into several rows: one for each subactivity
   * CSV Structure:
     * `<class>, <path to weather info>, <gender>, <age_group>, <activity>, <subactivity>, <outfit_features[]>`
     * Note weather info is simply the filesystem cache from querying GearSmarts weather API with the date/location provided in the survey response
 * 70 synthesized dataponts (synth.csv)
   * Taken from real datapoints, with outfits exagerated to create 'hott' and 'cold' datapoints.
   * Based on assumption that noone would be comfortable in a tshirt or swim suit in cold weather, or in a heavy jacket in hot weather
 * 3 classes: good, hott, cold

