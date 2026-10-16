import type { ImgHTMLAttributes } from "react";
type Props = ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
};
export default function Image({ fill, priority, style, ...props }: Props) {
  return (
    <img
      {...props}
      loading={priority ? "eager" : "lazy"}
      style={{
        ...(fill
          ? ({
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
            } as const)
          : {}),
        ...style,
      }}
    />
  );
}
