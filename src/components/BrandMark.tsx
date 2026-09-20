type BrandMarkProps = {
  size?: number;
};

export function BrandMark({ size = 14 }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      aria-hidden="true"
      className="brand-mark-svg"
    >
      <path
        d="M7 0L14 7L7 14L0 7Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}
