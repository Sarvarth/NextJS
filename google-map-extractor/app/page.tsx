'use client';
import { useEffect, useState } from 'react';
import GoogleMapReact from 'google-map-react';
import { saveAs } from 'file-saver';

interface Place {
  name: string;
  vicinity: string;
  rating?: number;
  photo?: string;
  phone?: string; // Store the phone number
}

const MapComponent: React.FC = () => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapsApi, setMapsApi] = useState<typeof google.maps | null>(null);
  const [location, setLocation] = useState({ lat: 37.7749, lng: -122.4194 });
  const [keyword, setKeyword] = useState<string>('');
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [noResults, setNoResults] = useState<boolean>(false);

  // Set user location on load
  useEffect(() => {
    navigator.geolocation.getCurrentPosition((position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    });
  }, []);

  // Handle map and Google Maps API loaded
  const handleApiLoaded = (map: google.maps.Map, maps: typeof google.maps) => {
    setMap(map);
    setMapsApi(maps);
  };

  // Function to get the phone number using the Place Details API
  const getPlaceDetails = (placeId: string): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!mapsApi || !map) return resolve(null);

      const service = new mapsApi.places.PlacesService(map);
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId,
        fields: ['formatted_phone_number'], // Requesting the phone number field
      };

      service.getDetails(request, (placeDetails, status) => {
        if (status === mapsApi.places.PlacesServiceStatus.OK && placeDetails?.formatted_phone_number) {
          resolve(placeDetails.formatted_phone_number);
        } else {
          resolve(null);
        }
      });
    });
  };

  // Search for places around the location with a specific keyword and 5km radius
  const searchPlaces = async () => {
    if (!mapsApi || !map || !keyword) return;
    setIsLoading(true);
    setNoResults(false);

    const service = new mapsApi.places.PlacesService(map);
    const request: google.maps.places.PlaceSearchRequest = {
      location: new mapsApi.LatLng(location.lat, location.lng),
      radius: 5000, // Limit to 5km
      keyword: keyword,
    };

    service.nearbySearch(request, async (results, status) => {
      setIsLoading(false);
      if (status === mapsApi.places.PlacesServiceStatus.OK && results) {
        const newPlaces: Place[] = await Promise.all(
          results.map(async result => {
            const phone = await getPlaceDetails(result.place_id); // Fetch phone number
            return {
              name: result.name,
              vicinity: result.vicinity ?? 'N/A',
              rating: result.rating,
              photo: result.photos && result.photos.length > 0
                ? result.photos[0].getUrl({ maxWidth: 200, maxHeight: 200 })
                : null,
              phone, // Add phone number to the place
            };
          })
        );
        setPlaces(newPlaces);
        if (newPlaces.length === 0) {
          setNoResults(true);
        }
      } else {
        setNoResults(true);
      }
    });
  };

  // Export places data to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Full Address', 'Rating', 'Phone'].join(','), // Updated headers
      ...places.map(place => [
        place.name,
        `"${place.vicinity}"`, // Ensuring address is in one field by wrapping it in quotes
        place.rating?.toString() || 'N/A',
        place.phone || 'N/A', // Include phone number in the CSV
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'places.csv');
  };

  return (
    <div className="h-screen w-screen flex p-4">
      {/* Left Side (Search + Map) */}
      <div className="w-full lg:w-1/2 h-full flex flex-col pr-4">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-white w-full shadow-md p-4">
          <div className="max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Enter keyword (e.g., restaurants)"
              className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:border-blue-500"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            <button
              className="mt-3 p-3 bg-blue-600 text-white rounded w-full hover:bg-blue-700 transition"
              onClick={searchPlaces}
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search Places'}
            </button>
            <button
              className="mt-2 p-3 bg-green-600 text-white rounded w-full hover:bg-green-700 transition"
              onClick={exportToCSV}
              disabled={places.length === 0}
            >
              Export to CSV
            </button>
          </div>
        </div>

        {/* Google Map */}
        <div className="w-full h-full">
          <GoogleMapReact
            bootstrapURLKeys={{ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '', libraries: ['places'] }}
            defaultCenter={location}
            center={location}
            defaultZoom={12}
            yesIWantToUseGoogleMapApiInternals
            onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
          />
        </div>
      </div>

      {/* Right Side (Scrollable Results) */}
      <div className="w-full lg:w-1/2 h-full p-4 bg-white shadow-lg overflow-y-auto">
        {isLoading && <p className="text-center">Loading...</p>}
        {noResults && <p className="text-center text-red-500">No results found</p>}

        {!isLoading && places.length > 0 && (
          <ul className="space-y-4">
            {places.map((place, index) => (
              <li key={index} className="p-4 bg-gray-100 rounded-lg shadow flex space-x-4">
                {/* Place photo if available */}
                {place.photo && (
                  <img src={place.photo} alt={place.name} className="w-20 h-20 object-cover rounded" />
                )}
                <div>
                  <h3 className="text-lg font-bold">{place.name}</h3>
                  <p className="text-sm text-gray-600">{place.vicinity}</p>
                  <p className="text-sm text-gray-600">Rating: {place.rating || 'N/A'}</p>
                  <p className="text-sm text-gray-600">Phone: {place.phone || 'N/A'}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  return (
    <div className="h-full w-full overflow-hidden">
      <h1 className="text-5xl font-extrabold text-gray-800 text-center py-4">
        Google Maps Extractor
      </h1>
      <MapComponent />
    </div>
  );
};

export default Home;
