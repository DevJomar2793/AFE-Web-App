import Image from "next/image";

export function BrandMark() {
  return (
    <Image
      src="/adamos-fresh-eggs-logo.jpg"
      alt=""
      aria-hidden="true"
      width={480}
      height={480}
      className="size-full object-cover"
    />
  );
}
