declare namespace google {
    export namespace maps {
      class Map {
        constructor(element: HTMLElement, opts: any);
      }
      class LatLng {
        constructor(lat: number, lng: number);
      }
      export namespace places {
        class PlacesService {
          constructor(map: google.maps.Map);
          getDetails(
            request: google.maps.places.PlaceDetailsRequest,
            callback: (
              result: google.maps.places.PlaceResult | null,
              status: google.maps.places.PlacesServiceStatus
            ) => void
          ): void;
          nearbySearch(
            request: google.maps.places.PlaceSearchRequest,
            callback: (
              results: google.maps.places.PlaceResult[],
              status: google.maps.places.PlacesServiceStatus
            ) => void
          ): void;
        }
        interface PlaceDetailsRequest {
          placeId: string;
          fields: string[];
        }
        interface PlaceResult {
          place_id: string;
          name: string;
          vicinity?: string;
          rating?: number;
          photos?: Array<{
            getUrl: (options: { maxWidth: number; maxHeight: number }) => string;
          }>;
          formatted_phone_number?: string;
        }
        interface PlaceSearchRequest {
          location: google.maps.LatLng;
          radius: number;
          keyword: string;
        }
        const PlacesServiceStatus: {
          OK: string;
          ZERO_RESULTS: string;
        };
      }
    }
  }
  