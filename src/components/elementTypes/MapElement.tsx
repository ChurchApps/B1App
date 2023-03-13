import { ElementInterface } from "@/helpers";

interface Props {
  element: ElementInterface;
}

export const MapElement = ({ element }: Props) => {
  return (
    <>
      <iframe
        height="325"
        style={{ border: 0, width: "100%" }}
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&q=${element.answers.mapAddress}&zoom=${element.answers.mapZoom}`}
        allowFullScreen
      />
    </>
  );
};
