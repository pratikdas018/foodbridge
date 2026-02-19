import Link from "next/link";

function hasCoordinates(latitude: number | null, longitude: number | null): boolean {
  return typeof latitude === "number" && typeof longitude === "number";
}

export function AddressMap({
  address,
  latitude = null,
  longitude = null,
}: {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const destination = hasCoordinates(latitude, longitude)
    ? `${latitude},${longitude}`
    : address;
  const encodedDestination = encodeURIComponent(destination);
  const mapEmbedUrl = `https://www.google.com/maps?q=${encodedDestination}&z=15&output=embed`;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodedDestination}`;

  return (
    <div className="mt-3 rounded-xl border border-sky-100 bg-sky-50/40 p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-slate-700">Pickup Location Map</p>
        <Link
          className="text-xs font-semibold text-sky-700 hover:underline"
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open Directions
        </Link>
      </div>

      <iframe
        className="h-44 w-full rounded-lg border border-sky-100"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={mapEmbedUrl}
        title="Pickup location"
      />
      {hasCoordinates(latitude, longitude) ? (
        <p className="mt-2 text-[11px] text-slate-500">
          Coordinates: {latitude?.toFixed(6)}, {longitude?.toFixed(6)}
        </p>
      ) : null}
    </div>
  );
}
