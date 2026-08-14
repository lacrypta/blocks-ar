import "server-only";

import {
  isConfidentGoogleMatch,
  type GooglePhoto,
  type GooglePlaceEnrichment,
  type Merchant,
} from "./model";

interface GoogleCandidate {
  id?: string;
  displayName?: { text?: string };
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  photos?: {
    name?: string;
    googleMapsUri?: string;
    authorAttributions?: { displayName?: string; uri?: string; photoUri?: string }[];
  }[];
}

async function getPhoto(
  photo: NonNullable<GoogleCandidate["photos"]>[number],
  apiKey: string,
): Promise<GooglePhoto | null> {
  if (!photo.name) return null;
  const response = await fetch(
    `https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1200&maxHeightPx=900&skipHttpRedirect=true&key=${encodeURIComponent(apiKey)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { photoUri?: string };
  if (!data.photoUri) return null;
  return {
    photoUri: data.photoUri,
    googleMapsUri: photo.googleMapsUri,
    authors: (photo.authorAttributions ?? [])
      .filter((author) => author.displayName)
      .map((author) => ({
        displayName: author.displayName!,
        uri: author.uri,
        photoUri: author.photoUri,
      })),
  };
}

export async function getGooglePlace(
  merchant: Merchant,
  apiKey = process.env.GOOGLE_PLACES_API_KEY,
): Promise<GooglePlaceEnrichment | null> {
  if (!apiKey) return null;
  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.googleMapsUri",
            "places.photos",
          ].join(","),
        },
        body: JSON.stringify({
          textQuery: [merchant.name, merchant.address].filter(Boolean).join(", "),
          languageCode: "es-419",
          regionCode: "AR",
          pageSize: 5,
          locationBias: {
            circle: {
              center: { latitude: merchant.lat, longitude: merchant.lon },
              radius: 250,
            },
          },
        }),
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { places?: GoogleCandidate[] };
    const candidate = data.places?.find((place) =>
      isConfidentGoogleMatch(merchant, {
        displayName: place.displayName?.text,
        location:
          Number.isFinite(place.location?.latitude) &&
          Number.isFinite(place.location?.longitude)
            ? {
                latitude: place.location!.latitude!,
                longitude: place.location!.longitude!,
              }
            : undefined,
      }),
    );
    if (!candidate?.googleMapsUri) return null;

    const photos = (
      await Promise.all(
        (candidate.photos ?? []).slice(0, 5).map((photo) => getPhoto(photo, apiKey)),
      )
    ).filter((photo): photo is GooglePhoto => Boolean(photo));

    return {
      rating: candidate.rating,
      userRatingCount: candidate.userRatingCount,
      googleMapsUri: candidate.googleMapsUri,
      photos,
    };
  } catch {
    return null;
  }
}
