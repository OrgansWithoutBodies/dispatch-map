// /*
// This has been generated by the overpass-turbo wizard.
// The original search was:
// “"gas station"”
// */
// [out:json][timeout:25];
// // gather results
// (
//   // query part for: “"gas station"”
//   node["amenity"="fuel"]({{bbox}});
//   way["amenity"="fuel"]({{bbox}});
//   relation["amenity"="fuel"]({{bbox}});
// );
// // print results
// out body;
// >;
// out skel qt;

// // {{OverpassTurboExample|loc=36.07574;-102.6123;6|query=
// // https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=40.316828,%20-82.839840&radius=50000&type=gas_station&key=My_Google_Key
// //[bbox:-25.38653, 130.99883, -25.31478, 131.08938];

// // node["amenity"="fuel"];

// //TRYME #1 the above two statements are equivalent to the following.
// //use this form if you need to query for features in several
// //different bounding boxes
// //node(-25.38653, 130.99883, -25.31478, 131.08938)["name"];

// //TRYME #2 try finding just nodes that have a Pitjantjatjara name
// //node["name:pjt"];

// //use out body to include tags in the output, so
// //we can inspect the results
// // out body;

// // }}