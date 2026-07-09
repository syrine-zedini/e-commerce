import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { convertImageUrl, onImgError } from "@/lib/imageUtils";

export function ProductImageCarousel({ image }: { image: string }) {
  const heightClass = "h-[150px] sm:h-[300px] md:h-[400px] lg:h-[300px]";
  const widthClass = "max-w-[150px] sm:max-w-[300px] md:max-w-[600px] lg:max-w-[480px]";
  const src = convertImageUrl(image);

  return (
    <div className="flex justify-center items-center w-full">
      <Zoom>
        <img
          src={src}
          alt="Product image"
          className={`w-full ${widthClass} ${heightClass} object-contain rounded-lg`}
          style={{ maxHeight: "500px" }}
          onError={onImgError}
        />
      </Zoom>
    </div>
  );
}
