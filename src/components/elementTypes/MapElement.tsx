import { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { ElementInterface } from "@/helpers";
import { Loading } from "@churchapps/apphelper";

interface Props {
  element: ElementInterface;
}

const containerStyle = {
  width: "100%",
  height: "325px",
};

export const MapElement = ({ element }: Props) => {
  const [center, setCenter] = useState();

  useEffect(() => {
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${element.answers.mapAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`
    )
      .then((res) => res.json())
      .then((data) => setCenter(data?.results?.[0]?.geometry?.location));
  }, [element.answers.mapAddress]);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
  });

  return (
    <>
      {" "}
      {isLoaded
        ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={element.answers?.mapZoom || 15}
          >
            {center && element.answers.mapLabel
              ? (
                <Marker
                  position={center}
                  label={{
                    text: element.answers.mapLabel,
                    fontWeight: "600",
                    fontSize: "20px",
                  }}
                />
              )
              : null}
          </GoogleMap>
        )
        : (
          <Loading />
        )}
    </>
  );
};
