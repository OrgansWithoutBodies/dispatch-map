REGION='us-west-latest'

PBF_URL='https://download.geofabrik.de/north-america/us-west-latest.osm.pbf'
REPLICATION_URL='https://download.geofabrik.de/north-america/us-west-updates/'
NOMINATIM_PORT=8080
NOMINATIM_VERSION=4.2
docker run -it   -e PBF_URL=$PBF_URL   -e REPLICATION_URL=$REPLICATION_URL   -p 8080:$NOMINATIM_PORT   --name nominatim   mediagis/nominatim:$NOMINATIM_VERSION

